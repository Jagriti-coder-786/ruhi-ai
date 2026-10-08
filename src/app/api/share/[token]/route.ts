import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token || token.length < 10) {
      return NextResponse.json({ error: 'Invalid share token' }, { status: 400 });
    }

    await connectDB();

    const conversation = await Conversation.findOne({
      shareToken: token,
      isShared: true,
    }).lean();

    if (!conversation) {
      return NextResponse.json({ error: 'Shared conversation not found or access has been revoked.' }, { status: 404 });
    }

    // Fetch messages for this shared conversation
    const messages = await Message.find({
      conversationId: conversation._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    // Sanitize completely: no user IDs, emails, internal models
    const sanitizedMessages = messages.map((m: any) => ({
      _id: m._id.toString(),
      role: m.role,
      content: m.content,
      citations: (m.citations || []).map((c: any) => ({
        title: c.title,
        url: c.url,
        snippet: c.snippet,
        sourceType: c.sourceType,
      })),
      createdAt: m.createdAt,
    }));

    return NextResponse.json({
      conversation: {
        title: conversation.title,
        createdAt: conversation.createdAt,
        model: conversation.model,
      },
      messages: sanitizedMessages,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching shared chat' }, { status: 500 });
  }
}
