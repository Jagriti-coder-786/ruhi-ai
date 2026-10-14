import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import {
  getUserProjects,
  createProject,
  deleteProject,
} from '@/services/projects';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const projects = await getUserProjects(user.userId);
    return NextResponse.json({ projects });
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
    const { name, description, customInstructions } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Project name cannot exceed 100 characters' }, { status: 400 });
    }

    if (description && typeof description === 'string' && description.length > 500) {
      return NextResponse.json({ error: 'Description cannot exceed 500 characters' }, { status: 400 });
    }

    if (customInstructions && typeof customInstructions === 'string' && customInstructions.length > 2000) {
      return NextResponse.json({ error: 'Custom instructions cannot exceed 2000 characters' }, { status: 400 });
    }

    const project = await createProject({
      userId: user.userId,
      name: name.trim(),
      description: description ? description.trim() : undefined,
      customInstructions: customInstructions ? customInstructions.trim() : undefined,
    });

    return NextResponse.json({ project }, { status: 201 });
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
    const projectId = searchParams.get('id');

    if (!projectId || !projectId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ error: 'Valid project ID is required' }, { status: 400 });
    }

    await deleteProject(projectId, user.userId);
    return NextResponse.json({ message: 'Project deleted' });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
