import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import Project from '@/models/Project';
import { signAuthToken } from '@/lib/auth/jwt';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
      plan: 'free',
      preferences: {
        theme: 'dark',
        defaultModel: 'ruhi-balanced',
        systemPrompt: 'You are Ruhi, a highly intelligent, empathetic, thoughtful, and capable AI companion.',
        temperature: 0.7,
        streamResponses: true,
        webSearchDefault: false,
        voiceEnabled: true,
      },
    });

    // Create default "Personal Space" project
    await Project.create({
      userId: newUser._id,
      name: 'General Workspace',
      description: 'Your default workspace for personal notes and tasks',
      isDefault: true,
    });

    const token = signAuthToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      plan: newUser.plan,
    });

    const response = NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          plan: newUser.plan,
        },
      },
      { status: 201 }
    );

    // Set HTTP-only secure cookie
    response.cookies.set('ruhi_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 500 }
    );
  }
}
