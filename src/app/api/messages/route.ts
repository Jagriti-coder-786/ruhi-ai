import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import { requireAuth } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
    }

    // Verify conversation belongs to user
    const convo = await Conversation.findOne({
      _id: new mongoose.Types.ObjectId(conversationId),
      userId: new mongoose.Types.ObjectId(user.userId),
    });

    if (!convo) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const messages = await Message.find({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      userId: new mongoose.Types.ObjectId(user.userId),
    })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      messages: messages.map((m) => ({
        ...m,
        _id: m._id.toString(),
        conversationId: m.conversationId.toString(),
        userId: m.userId.toString(),
      })),
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const body = await req.json();
    const { messageId, feedback, feedbackReason, feedbackComment, activeVersionIndex, content } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
    }

    const message = await Message.findOne({
      _id: new mongoose.Types.ObjectId(messageId),
      userId: new mongoose.Types.ObjectId(user.userId),
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (feedback !== undefined) {
      message.feedback = feedback;
      if (feedbackReason !== undefined) message.feedbackReason = feedbackReason;
      if (feedbackComment !== undefined) message.feedbackComment = feedbackComment;
    }

    if (typeof activeVersionIndex === 'number' && message.versions && message.versions.length > activeVersionIndex) {
      message.activeVersionIndex = activeVersionIndex;
      const targetVersion = message.versions[activeVersionIndex];
      message.content = targetVersion.content;
      message.citations = targetVersion.citations as any;
      message.toolCalls = targetVersion.toolCalls as any;
      if (targetVersion.model) message.set('model', targetVersion.model);
    }

    if (typeof content === 'string' && message.role === 'user') {
      message.content = content.trim();
    }

    await message.save();

    return NextResponse.json({
      message: {
        ...message.toObject(),
        _id: message._id.toString(),
        conversationId: message.conversationId.toString(),
        userId: message.userId.toString(),
      },
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('id');

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const deleted = await Message.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(messageId),
      userId: new mongoose.Types.ObjectId(user.userId),
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Message deleted' });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
