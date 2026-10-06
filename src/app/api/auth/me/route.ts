import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    await connectDB();
    const user = await User.findById(auth.userId).select('-passwordHash');
    if (!user || !user.isActive) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        avatar: user.avatar,
        preferences: user.preferences,
      },
    });
  } catch (error: any) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { name, preferences } = body;

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name.trim();
    if (preferences) updateData.preferences = preferences;

    const updatedUser = await User.findByIdAndUpdate(
      auth.userId,
      { $set: updateData },
      { new: true }
    ).select('-passwordHash');

    return NextResponse.json({
      message: 'Preferences updated',
      user: {
        id: updatedUser?._id.toString(),
        name: updatedUser?.name,
        email: updatedUser?.email,
        role: updatedUser?.role,
        plan: updatedUser?.plan,
        preferences: updatedUser?.preferences,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 });
  }
}
