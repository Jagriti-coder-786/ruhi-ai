import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import Organization from '@/models/Organization';
import AuditLog from '@/models/AuditLog';
import { requireAuth } from '@/lib/auth/session';
import { getOrganizationById } from '@/services/organization';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const org = await getOrganizationById(id, user.userId);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ organization: org });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    await connectDB();
    const org = await Organization.findById(new mongoose.Types.ObjectId(id));
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const userObjectId = new mongoose.Types.ObjectId(user.userId);
    const isOwner = org.ownerId.equals(userObjectId);
    const member = org.members.find((m) => m.userId.equals(userObjectId));
    if (!isOwner && (!member || member.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden: Admin or owner role required' }, { status: 403 });
    }

    const body = await req.json();
    if (body.name && typeof body.name === 'string') org.name = body.name.trim();
    if (body.settings && typeof body.settings === 'object') {
      org.settings = { ...org.settings, ...body.settings };
    }

    await org.save();

    await AuditLog.create({
      userId: userObjectId,
      organizationId: org._id,
      action: 'ORGANIZATION_SETTINGS_UPDATED',
      resourceType: 'Organization',
      resourceId: org._id.toString(),
      metadata: body,
    });

    return NextResponse.json({ organization: org });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
