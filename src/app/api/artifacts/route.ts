import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import Artifact from '@/models/Artifact';
import { requireAuth } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type');

    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(user.userId),
    };

    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      filter.conversationId = new mongoose.Types.ObjectId(conversationId);
    }
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      filter.projectId = new mongoose.Types.ObjectId(projectId);
    }
    if (type) {
      filter.type = type;
    }

    const artifacts = await Artifact.find(filter)
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ artifacts });
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
    const { title, type, content, language, metadata, conversationId, projectId } = body;

    if (!title || !content === undefined) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const validTypes = ['document', 'code', 'spreadsheet', 'presentation', 'table', 'chart', 'diagram', 'interactive'];
    const artifactType = validTypes.includes(type) ? type : 'document';

    const artifact = await Artifact.create({
      userId: new mongoose.Types.ObjectId(user.userId),
      conversationId:
        conversationId && mongoose.Types.ObjectId.isValid(conversationId)
          ? new mongoose.Types.ObjectId(conversationId)
          : undefined,
      projectId:
        projectId && mongoose.Types.ObjectId.isValid(projectId)
          ? new mongoose.Types.ObjectId(projectId)
          : undefined,
      title: title.trim(),
      type: artifactType,
      content: content || '',
      language: language || (artifactType === 'code' ? 'typescript' : undefined),
      metadata: metadata || {},
      versions: [
        {
          content: content || '',
          title: title.trim(),
          createdAt: new Date(),
        },
      ],
    });

    return NextResponse.json({ artifact }, { status: 201 });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
