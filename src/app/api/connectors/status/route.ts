import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import ConnectorIntegration from '@/models/ConnectorIntegration';
import { requireAuth } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const integrations = await ConnectorIntegration.find({
      userId: new mongoose.Types.ObjectId(user.userId),
      isActive: true,
    })
      .select('provider scopes updatedAt') // Exclude tokens for security
      .lean();

    return NextResponse.json({ integrations });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
