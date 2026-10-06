import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import Conversation from '@/models/Conversation';
import { requireAuth } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const archived = searchParams.get('archived') === 'true';
    const pinned = searchParams.get('pinned');
    const projectId = searchParams.get('projectId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);

    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(user.userId),
      archived,
    };

    if (pinned === 'true') {
      filter.pinned = true;
    }
    if (projectId) {
      filter.projectId = new mongoose.Types.ObjectId(projectId);
    }

    const conversations = await Conversation.find(filter)
      .sort({ pinned: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Conversation.countDocuments(filter);

    return NextResponse.json({
      conversations: conversations.map((c: any) => ({
        ...c,
        _id: c._id.toString(),
        userId: c.userId.toString(),
        projectId: c.projectId ? c.projectId.toString() : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const { title = 'New Conversation', model = 'ruhi-balanced', projectId } = body;

    const conversation = await Conversation.create({
      userId: new mongoose.Types.ObjectId(user.userId),
      title: title.trim(),
      model: model.trim(),
      projectId: projectId ? new mongoose.Types.ObjectId(projectId) : undefined,
      pinned: false,
      archived: false,
    });

    const cObj = conversation.toObject ? conversation.toObject() : conversation;

    return NextResponse.json(
      {
        conversation: {
          ...cObj,
          _id: conversation._id.toString(),
          userId: conversation.userId.toString(),
          projectId: conversation.projectId ? conversation.projectId.toString() : null,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
