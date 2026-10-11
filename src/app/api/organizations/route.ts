import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import {
  getUserOrganizations,
  createOrganization,
} from '@/services/organization';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const organizations = await getUserOrganizations(user.userId);
    return NextResponse.json({ organizations });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { name, slug } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    const organization = await createOrganization({
      name: name.trim(),
      slug: slug?.trim(),
      ownerId: user.userId,
    });

    return NextResponse.json({ organization }, { status: 201 });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Failed to create organization' }, { status: 500 });
  }
}
