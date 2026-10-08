import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import Artifact from '@/models/Artifact';
import { requireAuth } from '@/lib/auth/session';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid artifact ID' }, { status: 400 });
    }

    await connectDB();

    const artifact = await Artifact.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(user.userId),
    }).lean();

    if (!artifact) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
    }

    return NextResponse.json({ artifact });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid artifact ID' }, { status: 400 });
    }

    await connectDB();

    const artifact = await Artifact.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(user.userId),
    });

    if (!artifact) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
    }

    const body = await req.json();
    const { title, content, metadata, language } = body;

    let contentChanged = false;
    if (content !== undefined && content !== artifact.content) {
      contentChanged = true;
      artifact.content = content;
    }

    if (title) artifact.title = title.trim();
    if (language) artifact.language = language;
    if (metadata) artifact.metadata = { ...artifact.metadata, ...metadata };

    if (contentChanged) {
      artifact.versions.push({
        content: artifact.content,
        title: artifact.title,
        createdAt: new Date(),
      });
      // Keep last 25 versions max
      if (artifact.versions.length > 25) {
        artifact.versions = artifact.versions.slice(-25);
      }
    }

    await artifact.save();

    return NextResponse.json({ artifact });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid artifact ID' }, { status: 400 });
    }

    await connectDB();

    const result = await Artifact.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(user.userId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Artifact deleted successfully' });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
