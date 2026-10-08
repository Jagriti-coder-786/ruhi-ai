import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import ScheduledTask from '@/models/ScheduledTask';
import { requireAuth } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const tasks = await ScheduledTask.find({
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
    const { title, prompt, scheduleType, scheduledTime, notifyVia } = body;

    if (!title || !prompt) {
      return NextResponse.json({ error: 'Title and prompt are required' }, { status: 400 });
    }

    const task = await ScheduledTask.create({
      userId: new mongoose.Types.ObjectId(user.userId),
      title: title.trim(),
      prompt: prompt.trim(),
      scheduleType: ['once', 'daily', 'weekly', 'monthly'].includes(scheduleType)
        ? scheduleType
        : 'daily',
      scheduledTime: scheduledTime || '09:00',
      notifyVia: notifyVia === 'email' ? 'email' : 'in_app',
      isActive: true,
      nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next run tomorrow
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const body = await req.json();
    const { id, isActive, title, prompt, scheduleType, scheduledTime, notifyVia } = body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Valid task ID is required' }, { status: 400 });
    }

    const task = await ScheduledTask.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(user.userId),
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (typeof isActive === 'boolean') task.isActive = isActive;
    if (title) task.title = title.trim();
    if (prompt) task.prompt = prompt.trim();
    if (scheduleType) task.scheduleType = scheduleType;
    if (scheduledTime) task.scheduledTime = scheduledTime;
    if (notifyVia) task.notifyVia = notifyVia;

    await task.save();

    return NextResponse.json({ task });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Valid task ID is required' }, { status: 400 });
    }

    await connectDB();

    const result = await ScheduledTask.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(user.userId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Task deleted' });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
