import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { requireAdmin } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    await connectDB();

    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        _id: u._id.toString(),
      })),
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin(req);
    await connectDB();

    const body = await req.json();
    const { userId, plan, isActive, role } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const updateFields: Record<string, unknown> = {};
    if (typeof isActive === 'boolean') updateFields.isActive = isActive;
    if (plan && ['free', 'pro', 'team'].includes(plan)) updateFields.plan = plan;
    if (role && ['user', 'admin'].includes(role)) updateFields.role = role;

    const updatedUser = await User.findByIdAndUpdate(
      new mongoose.Types.ObjectId(userId),
      { $set: updateFields },
      { new: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(admin.userId),
      action: 'ADMIN_USER_MODIFICATION',
      resourceType: 'User',
      resourceId: userId,
      metadata: updateFields,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
