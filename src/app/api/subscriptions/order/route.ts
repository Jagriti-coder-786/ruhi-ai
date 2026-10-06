import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { createPaymentOrder, PLANS_CONFIG } from '@/services/razorpay';

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const rawPlan = body.plan === 'team' ? 'team' : 'pro';

    const orderData = await createPaymentOrder(rawPlan, user.userId);

    return NextResponse.json({
      ...orderData,
      planDetails: PLANS_CONFIG[rawPlan],
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Failed to create payment order' }, { status: 500 });
  }
}
