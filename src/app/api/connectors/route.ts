import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import Connector from '@/models/Connector';
import { requireAuth } from '@/lib/auth/session';

const SUPPORTED_CONNECTORS = [
  {
    provider: 'google_drive',
    name: 'Google Drive',
    description: 'Read and analyze docs, spreadsheets, and drive presentations',
    defaultScopes: ['drive.readonly', 'drive.file'],
  },
  {
    provider: 'github',
    name: 'GitHub',
    description: 'Search repositories, pull requests, issues, and codebases',
    defaultScopes: ['repo:status', 'read:user', 'repo'],
  },
  {
    provider: 'slack',
    name: 'Slack',
    description: 'Sync channels, search conversations, and thread summaries',
    defaultScopes: ['channels:read', 'chat:write'],
  },
  {
    provider: 'notion',
    name: 'Notion',
    description: 'Search workspaces, import notes, and query databases',
    defaultScopes: ['workspace:read'],
  },
  {
    provider: 'dropbox',
    name: 'Dropbox',
    description: 'Access cloud folders, sync documents, and analyze files',
    defaultScopes: ['files.content.read'],
  },
];

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const existing = await Connector.find({
      userId: new mongoose.Types.ObjectId(user.userId),
    }).lean();

    const existingMap = new Map<string, any>();
    existing.forEach((c: any) => existingMap.set(c.provider, c));

    const connectors = SUPPORTED_CONNECTORS.map((sup) => {
      const dbRecord = existingMap.get(sup.provider);
      return {
        provider: sup.provider,
        name: sup.name,
        description: sup.description,
        status: dbRecord?.status || 'disconnected',
        accountEmail: dbRecord?.accountEmail,
        scopes: dbRecord?.scopes || sup.defaultScopes,
        lastSyncedAt: dbRecord?.lastSyncedAt,
        _id: dbRecord?._id,
      };
    });

    return NextResponse.json({ connectors });
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
    const { provider, action, accountEmail, scopes } = body;

    const validProviders = ['google_drive', 'github', 'slack', 'notion', 'dropbox'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: 'Unsupported connector provider' }, { status: 400 });
    }

    const supMeta = SUPPORTED_CONNECTORS.find((s) => s.provider === provider)!;

    if (action === 'disconnect') {
      await Connector.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(user.userId), provider },
        { status: 'disconnected', accountEmail: undefined },
        { upsert: true }
      );
      return NextResponse.json({ success: true, message: `${supMeta.name} disconnected` });
    }

    // Connect action
    const connector = await Connector.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(user.userId), provider },
      {
        name: supMeta.name,
        status: 'connected',
        accountEmail: accountEmail || `${user.email || 'user'}@workspace.ext`,
        scopes: scopes || supMeta.defaultScopes,
        lastSyncedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, connector });
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
    const { provider } = body;

    const connector = await Connector.findOne({
      userId: new mongoose.Types.ObjectId(user.userId),
      provider,
    });

    if (!connector || connector.status !== 'connected') {
      return NextResponse.json(
        { error: 'Connector not connected or not found' },
        { status: 400 }
      );
    }

    connector.lastSyncedAt = new Date();
    await connector.save();

    return NextResponse.json({ success: true, lastSyncedAt: connector.lastSyncedAt });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
