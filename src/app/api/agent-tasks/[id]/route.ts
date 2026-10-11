import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import AgentTask from '@/models/AgentTask';
import AuditLog from '@/models/AuditLog';
import { requireAuth } from '@/lib/auth/session';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    await connectDB();

    const task = await AgentTask.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(user.userId),
    }).lean();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    await connectDB();

    const task = await AgentTask.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(user.userId),
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await req.json();
    const { status, approvalDecision, planStepIndex } = body;

    // Handle Human-in-the-Loop Approval Decision
    if (approvalDecision) {
      if (approvalDecision === 'approved') {
        task.status = 'running';
        task.executionHistory.push({
          action: 'HUMAN_APPROVAL_GRANTED',
          result: 'User approved execution plan to proceed.',
          timestamp: new Date(),
        });
      } else if (approvalDecision === 'rejected') {
        task.status = 'cancelled';
        task.executionHistory.push({
          action: 'HUMAN_APPROVAL_REJECTED',
          result: 'User rejected execution plan.',
          timestamp: new Date(),
        });
      }
    } else if (status && ['queued', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled'].includes(status)) {
      task.status = status;
    }

    if (typeof planStepIndex === 'number' && task.plan[planStepIndex]) {
      if (body.stepStatus && ['pending', 'in_progress', 'completed', 'failed'].includes(body.stepStatus)) {
        task.plan[planStepIndex].status = body.stepStatus;
      }
    }

    await task.save();

    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(user.userId),
      action: 'AGENT_TASK_UPDATED',
      resourceType: 'AgentTask',
      resourceId: task._id.toString(),
      metadata: { status: task.status, approvalDecision },
    });

    return NextResponse.json({ task });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
