import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import crypto from 'crypto';
import connectDB from '@/lib/db/mongoose';
import Conversation from '@/models/Conversation';
import { requireAuth } from '@/lib/auth/session';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    await connectDB();

    const conversation = await Conversation.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(user.userId),
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.isTemporary) {
      return NextResponse.json({ error: 'Temporary conversations cannot be publicly shared.' }, { status: 400 });
    }

    // Generate or reuse secure random share token
    let token = conversation.shareToken;
    if (!token) {
      token = crypto.randomBytes(16).toString('hex');
    }

    conversation.shareToken = token;
    conversation.isShared = true;
    await conversation.save();

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${origin}/share/${token}`;

    return NextResponse.json({
      success: true,
      shareToken: token,
      shareUrl,
      isShared: true,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    await connectDB();

    const conversation = await Conversation.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(user.userId),
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    conversation.isShared = false;
    conversation.shareToken = undefined;
    await conversation.save();

    return NextResponse.json({
      success: true,
      isShared: false,
      message: 'Public link revoked successfully.',
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
