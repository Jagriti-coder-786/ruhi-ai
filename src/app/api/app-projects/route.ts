import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import AppProject from '@/models/AppProject';
import { requireAuth } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const projects = await AppProject.find({
      userId: new mongoose.Types.ObjectId(user.userId),
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ projects });
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
    const { name, description, framework } = body;

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const project = await AppProject.create({
      userId: new mongoose.Types.ObjectId(user.userId),
      name: name.trim(),
      description: description?.trim() || '',
      framework: framework || 'nextjs',
      files: {}, // Start empty, agent will populate
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
