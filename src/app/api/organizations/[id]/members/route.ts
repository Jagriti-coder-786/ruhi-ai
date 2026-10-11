import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAuth } from '@/lib/auth/session';
import {
  addMemberToOrganization,
  removeMemberFromOrganization,
} from '@/services/organization';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const body = await req.json();
    const { targetUserId, role = 'member' } = body;

    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: 'Valid targetUserId is required' }, { status: 400 });
    }

    const validRoles = ['admin', 'member', 'viewer'];
    const assignedRole = validRoles.includes(role) ? role : 'member';

    const org = await addMemberToOrganization({
      orgId: id,
      requesterUserId: user.userId,
      targetUserId,
      role: assignedRole as any,
    });

    return NextResponse.json({
      message: 'Member added to organization',
      members: org.members,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (err.message.startsWith('FORBIDDEN')) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: 'Valid targetUserId is required' }, { status: 400 });
    }

    const org = await removeMemberFromOrganization({
      orgId: id,
      requesterUserId: user.userId,
      targetUserId,
    });

    return NextResponse.json({
      message: 'Member removed from organization',
      members: org.members,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (err.message.startsWith('FORBIDDEN')) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
