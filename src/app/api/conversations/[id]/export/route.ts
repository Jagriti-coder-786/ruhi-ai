import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { requireAuth } from '@/lib/auth/session';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get('format') || 'markdown').toLowerCase();

    await connectDB();

    const conversation = await Conversation.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(user.userId),
    }).lean();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const messages = await Message.find({
      conversationId: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(user.userId),
    })
      .sort({ createdAt: 1 })
      .lean();

    const titleSafe = conversation.title.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 30);
    const dateStr = new Date(conversation.createdAt || Date.now()).toISOString().split('T')[0];

    if (format === 'json') {
      const payload = {
        title: conversation.title,
        model: conversation.model,
        exportedAt: new Date().toISOString(),
        messages: messages.map((m: any) => ({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
          citations: m.citations,
        })),
      };

      return new NextResponse(JSON.stringify(payload, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${titleSafe}_${dateStr}.json"`,
        },
      });
    }

    if (format === 'text' || format === 'txt') {
      let textOutput = `RUHI AI CONVERSATION: ${conversation.title}\n`;
      textOutput += `Date: ${dateStr}\n`;
      textOutput += `Model: ${conversation.model}\n`;
      textOutput += `========================================\n\n`;

      for (const m of messages) {
        const sender = m.role === 'user' ? 'USER' : 'RUHI AI';
        textOutput += `[${sender}]:\n${m.content}\n\n`;
      }

      return new NextResponse(textOutput, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${titleSafe}_${dateStr}.txt"`,
        },
      });
    }

    // Default: Markdown (.md)
    let mdOutput = `# 🌸 ${conversation.title}\n\n`;
    mdOutput += `*Exported from Ruhi AI on ${dateStr} • Model: \`${conversation.model}\`*\n\n---\n\n`;

    for (const m of messages) {
      if (m.role === 'user') {
        mdOutput += `### 👤 User\n\n${m.content}\n\n`;
      } else {
        mdOutput += `### 🌸 Ruhi AI\n\n${m.content}\n\n`;
        if (m.citations && m.citations.length > 0) {
          mdOutput += `**Sources & Citations:**\n`;
          for (const c of m.citations) {
            mdOutput += `- [${c.title}](${c.url || '#'}): ${c.snippet.slice(0, 100)}...\n`;
          }
          mdOutput += '\n';
        }
      }
      mdOutput += `---\n\n`;
    }

    return new NextResponse(mdOutput, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${titleSafe}_${dateStr}.md"`,
      },
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
