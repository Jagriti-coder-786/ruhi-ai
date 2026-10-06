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

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const project = await createProject({
      userId: user.userId,
      name,
      description,
      customInstructions,
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

    if (!projectId) {
      return NextResponse.json({ error: 'Project id is required' }, { status: 400 });
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
