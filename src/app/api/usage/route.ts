import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { checkQuota } from '@/services/usage';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const quota = await checkQuota(user.userId, user.plan);

    return NextResponse.json({
      plan: user.plan,
      usage: quota.usage,
      limits: quota.limits,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
