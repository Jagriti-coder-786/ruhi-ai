import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import {
  getUserMemories,
  createMemory,
  updateMemory,
  deleteMemory,
} from '@/services/memory';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const memories = await getUserMemories(user.userId);
    return NextResponse.json({ memories });
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
    const body = await req.json();
    const { category = 'preference', content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Memory content is required' }, { status: 400 });
    }

    const memory = await createMemory({
      userId: user.userId,
      category,
      content,
    });

    return NextResponse.json({ memory }, { status: 201 });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { memoryId, content, isEnabled } = body;

    if (!memoryId) {
      return NextResponse.json({ error: 'memoryId is required' }, { status: 400 });
    }

    const memory = await updateMemory({
      memoryId,
      userId: user.userId,
      content,
      isEnabled,
    });

    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    return NextResponse.json({ memory });
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
    const { searchParams } = new URL(req.url);
    const memoryId = searchParams.get('id');

    if (!memoryId) {
      return NextResponse.json({ error: 'Memory id is required' }, { status: 400 });
    }

    await deleteMemory(memoryId, user.userId);
    return NextResponse.json({ message: 'Memory deleted' });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
