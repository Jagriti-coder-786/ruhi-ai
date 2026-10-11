import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import {
  getInvitationDetails,
  acceptInvitation,
} from '@/services/invitations';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const invite = await getInvitationDetails(token);

    if (!invite) {
      return NextResponse.json(
        { error: 'Invitation not found, already accepted, or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({ invitation: invite });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error checking invitation' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { token } = await params;

    const result = await acceptInvitation(token, user.userId);
    return NextResponse.json({
      message: `Successfully joined ${result.organization.name}!`,
      organization: result.organization,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please sign in to accept this invitation' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Failed to accept invitation' }, { status: 400 });
  }
}
