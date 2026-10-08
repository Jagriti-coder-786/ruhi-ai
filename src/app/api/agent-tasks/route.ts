import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import AgentTask from '@/models/AgentTask';
import { requireAuth } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const tasks = await AgentTask.find({
      userId: new mongoose.Types.ObjectId(user.userId),
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ tasks });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const body = await req.json();
    const { title, projectId, plan, limits, approvalMode } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const task = await AgentTask.create({
      userId: new mongoose.Types.ObjectId(user.userId),
      projectId: projectId ? new mongoose.Types.ObjectId(projectId) : undefined,
      title: title.trim(),
      status: 'queued',
      plan: plan || [],
      limits: limits || { maxRetries: 3 },
      approvalMode: approvalMode || 'safe',
    });

    // In a real implementation, we would trigger the orchestrator background job here
    // e.g., await queueAgentTask(task._id);

    return NextResponse.json({ task }, { status: 201 });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
