import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import AgentTask, { IAgentTask } from '@/models/AgentTask';
import { safeDiagnostics } from '@/services/ai/orchestrator/observability';

export interface TaskQueueOptions {
  maxRetries?: number;
  retryDelayMs?: number;
}

export class ReliableAgentTaskQueue {
  private activeWorkers: Set<string> = new Set();
  private isRedisConfigured: boolean = false;

  constructor() {
    this.isRedisConfigured = Boolean(process.env.REDIS_URL || process.env.REDIS_HOST);
  }

  /**
   * Enqueues an agent task for background execution with persistent retries
   */
  async enqueueTask(taskId: string, options: TaskQueueOptions = {}): Promise<void> {
    await connectDB();
    const task = await AgentTask.findById(taskId);
    if (!task) throw new Error(`AgentTask ${taskId} not found`);

    task.status = 'queued';
    await task.save();

    safeDiagnostics.record('tool_executed' as any, {
      queueAction: 'task_enqueued',
      taskId,
      approvalMode: task.approvalMode,
      totalSteps: task.plan.length,
      redisDurable: this.isRedisConfigured,
    });

    // Dispatch execution asynchronously
    this.processTask(taskId, 0, options).catch((err) => {
      console.error(`[ReliableAgentTaskQueue] Task ${taskId} processor error:`, err);
    });
  }

  /**
   * Resumes a paused task following human approval
   */
  async resumeTask(taskId: string): Promise<void> {
    await connectDB();
    const task = await AgentTask.findById(taskId);
    if (!task) throw new Error(`AgentTask ${taskId} not found`);

    if (task.status !== 'waiting_approval' && task.status !== 'running') {
      return;
    }

    task.status = 'running';
    await task.save();

    safeDiagnostics.record('tool_executed' as any, {
      queueAction: 'task_resumed_by_human',
      taskId,
    });

    this.processTask(taskId, 0).catch((err) => {
      console.error(`[ReliableAgentTaskQueue] Resume failed for task ${taskId}:`, err);
    });
  }

  /**
   * Core step-by-step worker loop with failure isolation, status tracking, and retries
   */
  private async processTask(
    taskId: string,
    retryCount: number = 0,
    options: TaskQueueOptions = {}
  ): Promise<void> {
    if (this.activeWorkers.has(taskId)) {
      return; // Prevent duplicate concurrent workers on the same task
    }

    this.activeWorkers.add(taskId);

    try {
      await connectDB();
      const task = await AgentTask.findById(taskId);
      if (!task || task.status === 'cancelled') {
        return;
      }

      task.status = 'running';
      await task.save();

      for (let i = 0; i < task.plan.length; i++) {
        const step = task.plan[i];

        // Skip completed steps (ensures resumability from exact failure/approval point)
        if (step.status === 'completed') {
          continue;
        }

        // Safety gate check: pause for human approval if required
        if (
          task.approvalMode === 'safe' &&
          ['Coder', 'Deployer', 'FileModifier'].includes(step.agentType) &&
          step.status !== 'in_progress'
        ) {
          task.status = 'waiting_approval';
          task.executionHistory.push({
            action: `HUMAN_APPROVAL_REQUIRED: Paused for approval on "${step.name}" (${step.agentType})`,
            timestamp: new Date(),
          });
          await task.save();
          return; // Safely yield until user approves
        }

        // Mark step in progress
        step.status = 'in_progress';
        task.markModified('plan');
        await task.save();

        const startTime = Date.now();

        try {
          // Execute step action
          await this.executeStepWork(step.agentType, step.name);

          step.status = 'completed';
          const durationMs = Date.now() - startTime;
          task.costMetrics.durationMs = (task.costMetrics.durationMs || 0) + durationMs;
          task.costMetrics.toolCallsCount = (task.costMetrics.toolCallsCount || 0) + 1;

          task.executionHistory.push({
            action: `Step completed: "${step.name}"`,
            result: `Finished via ${step.agentType} Agent in ${durationMs}ms`,
            timestamp: new Date(),
          });

          task.markModified('plan');
          await task.save();

        } catch (stepErr: any) {
          const maxRetries = options.maxRetries ?? task.limits?.maxRetries ?? 3;

          if (retryCount < maxRetries) {
            const nextRetry = retryCount + 1;
            const backoffDelay = (options.retryDelayMs || 1000) * Math.pow(2, retryCount);

            task.executionHistory.push({
              action: `Step retry attempt ${nextRetry}/${maxRetries} scheduled for "${step.name}"`,
              error: stepErr.message,
              timestamp: new Date(),
            });
            await task.save();

            // Wait with exponential backoff then retry
            await new Promise((r) => setTimeout(r, backoffDelay));
            this.activeWorkers.delete(taskId);
            return await this.processTask(taskId, nextRetry, options);
          } else {
            step.status = 'failed';
            task.status = 'failed';
            task.executionHistory.push({
              action: `Step failed permanently after ${maxRetries} retries: "${step.name}"`,
              error: stepErr.message,
              timestamp: new Date(),
            });
            task.markModified('plan');
            await task.save();
            return;
          }
        }
      }

      // If all steps completed
      task.status = 'completed';
      task.executionHistory.push({
        action: 'ALL_STEPS_COMPLETED: Autonomous agent task finished successfully.',
        timestamp: new Date(),
      });
      await task.save();

    } catch (fatalErr: any) {
      console.error(`[ReliableAgentTaskQueue] Fatal error on task ${taskId}:`, fatalErr);
      await AgentTask.findByIdAndUpdate(taskId, {
        $set: { status: 'failed' },
        $push: {
          executionHistory: {
            action: 'FATAL_QUEUE_ERROR',
            error: fatalErr.message,
            timestamp: new Date(),
          },
        },
      });
    } finally {
      this.activeWorkers.delete(taskId);
    }
  }

  /**
   * Simulates step execution with realistic agent action delay
   */
  private async executeStepWork(agentType: string, stepName: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
}

export const agentTaskQueue = new ReliableAgentTaskQueue();
export default agentTaskQueue;
