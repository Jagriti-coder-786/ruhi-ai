import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import Project from '@/models/Project';
import Memory from '@/models/Memory';
import { signAuthToken } from '@/lib/auth/jwt';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { role = 'user', plan = 'pro' } = await req.json().catch(() => ({}));

    const demoEmail = role === 'admin' ? 'admin@ruhi.ai' : 'demo@ruhi.ai';
    const demoName = role === 'admin' ? 'Ruhi Admin' : 'Ruhi Explorer';

    let user = await User.findOne({ email: demoEmail });

    if (!user) {
      try {
        const passwordHash = await bcrypt.hash('RuhiAiDemo2026!', 10);
        user = await User.create({
          name: demoName,
          email: demoEmail,
          passwordHash,
          role: role === 'admin' ? 'admin' : 'user',
          plan: plan || 'pro',
          preferences: {
            theme: 'dark',
            defaultModel: 'ruhi-balanced',
            systemPrompt: 'You are Ruhi, a highly intelligent, empathetic, thoughtful, and capable AI companion.',
            temperature: 0.7,
            streamResponses: true,
            webSearchDefault: false,
            voiceEnabled: true,
            voiceName: 'Ruhi Natural',
          },
        });
      } catch (createErr: any) {
        if (createErr.code === 11000) {
          user = await User.findOne({ email: demoEmail });
        } else {
          throw createErr;
        }
      }

      if (!user) {
        throw new Error('Failed to initialize demo user');
      }

      // Seed a starter project
      await Project.create({
        userId: user._id,
        name: 'Quantum Intelligence Research',
        description: 'Multi-agent reasoning and quantum computing exploration',
        customInstructions: 'Focus on clear scientific explanations and code examples in Python and TypeScript.',
        isDefault: false,
      });

      // Seed starter preferences in memory
      await Memory.create([
        {
          userId: user._id,
          category: 'preference',
          content: 'User prefers concise, well-structured technical answers with code blocks.',
          isEnabled: true,
        },
        {
          userId: user._id,
          category: 'fact',
          content: 'User is building modern cloud applications with Next.js and MongoDB.',
          isEnabled: true,
        },
      ]);
    }

    const token = signAuthToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      plan: user.plan,
    });

    const response = NextResponse.json({
      message: 'Demo access granted',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        preferences: user.preferences,
      },
    });

    response.cookies.set('ruhi_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Demo auth error:', error);
    return NextResponse.json({ error: error.message || 'Demo login failed' }, { status: 500 });
  }
}
