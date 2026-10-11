import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAuth } from '@/lib/auth/session';
import { revokeInvitation } from '@/services/invitations';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { inviteId } = await params;

    if (!mongoose.Types.ObjectId.isValid(inviteId)) {
      return NextResponse.json({ error: 'Invalid invitation ID' }, { status: 400 });
    }

    const result = await revokeInvitation(inviteId, user.userId);
    return NextResponse.json({ success: true, message: 'Invitation revoked successfully' });
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
