import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { verifyPaymentSignature, activateSubscription } from '@/services/razorpay';
import AuditLog from '@/models/AuditLog';

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { orderId, paymentId, signature, plan } = body;

    if (!orderId || !paymentId) {
      return NextResponse.json({ error: 'Missing orderId or paymentId' }, { status: 400 });
    }

    // Verify HMAC-SHA256 signature
    const isValid = verifyPaymentSignature(orderId, paymentId, signature || '');
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature. Verification failed.' }, { status: 400 });
    }

    const subscription = await activateSubscription({
      userId: user.userId,
      plan: plan === 'team' ? 'team' : 'pro',
      orderId,
      paymentId,
    });

    await AuditLog.create({
      userId: user.userId,
      action: 'SUBSCRIPTION_UPGRADE',
      resourceType: 'Subscription',
      resourceId: subscription._id.toString(),
      metadata: { plan, orderId, paymentId },
    });

    return NextResponse.json({
      message: `Successfully upgraded to ${plan.toUpperCase()}!`,
      subscription,
      userPlan: plan,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Payment verification failed' }, { status: 500 });
  }
}
