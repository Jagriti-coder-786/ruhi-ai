import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Project from '@/models/Project';
import { requireAuth } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query) {
      return NextResponse.json({ conversations: [], messages: [], projects: [] });
    }

    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const userObjectId = new mongoose.Types.ObjectId(user.userId);

    // 1. Search Conversation Titles
    const matchedConversations = await Conversation.find({
      userId: userObjectId,
      title: regex,
    })
      .limit(10)
      .lean();

    // 2. Search Message Content
    const matchedMessages = await Message.find({
      userId: userObjectId,
      content: regex,
    })
      .populate('conversationId', 'title')
      .limit(15)
      .lean();

    // 3. Search Projects
    const matchedProjects = await Project.find({
      userId: userObjectId,
      $or: [{ name: regex }, { description: regex }],
    })
      .limit(5)
      .lean();

    return NextResponse.json({
      query,
      conversations: matchedConversations.map((c) => ({
        id: c._id.toString(),
        title: c.title,
        updatedAt: c.updatedAt,
      })),
      messages: matchedMessages.map((m: any) => ({
        id: m._id.toString(),
        conversationId: m.conversationId?._id?.toString() || m.conversationId?.toString(),
        conversationTitle: m.conversationId?.title || 'Conversation',
        contentSnippet: m.content.slice(0, 140) + '...',
        role: m.role,
        createdAt: m.createdAt,
      })),
      projects: matchedProjects.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        description: p.description,
      })),
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
