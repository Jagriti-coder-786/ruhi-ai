import { AgentTask } from '@/models/AgentTask';
import { generateTaskPlan } from './planner';

/**
 * The autonomous agent loop orchestrator.
 * Handles PLAN -> EXECUTE -> OBSERVE -> VERIFY -> FIX -> RETRY
 */
export class AgentOrchestrator {
  
  /**
   * Initializes a new autonomous task.
   */
  async startNewTask(userId: string, objective: string, projectId?: string) {
    // 1. PLAN
    const initialPlan = await generateTaskPlan(objective);
    
    const task = await AgentTask.create({
      userId,
      projectId,
      title: objective,
      status: 'queued',
      plan: initialPlan,
      executionHistory: [{
        action: 'Task initialized and plan generated',
        timestamp: new Date()
      }]
    });

    // In a production app, we would enqueue this to a durable background worker (e.g. Inngest)
    // For now, we simulate async execution triggering
    this.executeLoop(task.id).catch(console.error);
    
    return task;
  }

  /**
   * The core execution loop (simulated for architectural foundation)
   */
  private async executeLoop(taskId: string) {
    const task = await AgentTask.findById(taskId);
    if (!task || task.status === 'cancelled') return;

    task.status = 'running';
    await task.save();

    for (let i = 0; i < task.plan.length; i++) {
      const step = task.plan[i];
      
      if (step.status === 'completed') continue;

      // Update UI state
      step.status = 'in_progress';
      task.markModified('plan');
      await task.save();

      // EXECUTE phase (Simulation)
      try {
        await this.simulateAgentWork(step.agentType);
        
        // Safety/Approval Check
        if (task.approvalMode === 'safe' && step.agentType === 'Coder') {
          // Pause and ask user for permission to write code
          task.status = 'waiting_approval';
          task.executionHistory.push({
            action: `Paused for approval on step: ${step.name}`,
            timestamp: new Date()
          });
          await task.save();
          return; // Pause execution until user approves
        }

        // VERIFY phase
        step.status = 'completed';
        task.executionHistory.push({
          action: `Completed step: ${step.name} by ${step.agentType} Agent`,
          timestamp: new Date()
        });
        
        task.markModified('plan');
        await task.save();

      } catch (err: any) {
        // FIX / RETRY phase
        step.status = 'failed';
        task.executionHistory.push({
          action: `Failed step: ${step.name}`,
          error: err.message,
          timestamp: new Date()
        });
        task.status = 'failed';
        await task.save();
        return; // Break loop on failure
      }
    }

    // Complete task
    task.status = 'completed';
    task.executionHistory.push({
      action: `Task successfully completed all steps`,
      timestamp: new Date()
    });
    await task.save();
  }

  /**
   * Simulates the time taken by an LLM agent to do work
   */
  private async simulateAgentWork(agentType: string) {
    return new Promise(resolve => setTimeout(resolve, 3000));
  }

  /**
   * Resumes a task that was paused for approval
   */
  async approveAndResume(taskId: string) {
    const task = await AgentTask.findById(taskId);
    if (!task || task.status !== 'waiting_approval') return;
    
    task.executionHistory.push({
      action: `User approved pending action`,
      timestamp: new Date()
    });
    
    await task.save();
    
    // Resume loop
    this.executeLoop(taskId).catch(console.error);
  }
}

export const orchestrator = new AgentOrchestrator();
