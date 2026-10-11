import { NextResponse } from 'next/server';
import { verifyWebhookSignature, activateSubscription } from '@/services/razorpay';
import AuditLog from '@/models/AuditLog';
import Subscription from '@/models/Subscription';
import User from '@/models/User';
import connectDB from '@/lib/db/mongoose';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
    }

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    let eventPayload: any;
    try {
      eventPayload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const event = eventPayload.event;
    const payment = eventPayload.payload?.payment?.entity;
    const order = eventPayload.payload?.order?.entity;

    await connectDB();

    // Idempotency: check if event was already processed
    const eventId = eventPayload.event_id || eventPayload.id;
    if (eventId) {
      const existingLog = await AuditLog.findOne({
        action: 'RAZORPAY_WEBHOOK_PROCESSED',
        resourceId: eventId,
      });
      if (existingLog) {
        return NextResponse.json({ received: true, note: 'Duplicate event ignored' });
      }
    }

    // Process event types
    if (event === 'order.paid' || event === 'payment.captured') {
      const notes = order?.notes || payment?.notes || {};
      const userId = notes.userId;
      const planTier = notes.planTier === 'team' ? 'team' : 'pro';
      const orderId = order?.id || payment?.order_id;
      const paymentId = payment?.id || `pay_${Date.now()}`;

      if (userId && orderId) {
        await activateSubscription({
          userId,
          plan: planTier,
          orderId,
          paymentId,
        });

        await AuditLog.create({
          userId,
          action: 'RAZORPAY_WEBHOOK_PROCESSED',
          resourceType: 'Subscription',
          resourceId: eventId || paymentId,
          metadata: { event, orderId, paymentId, planTier },
        });
      }
    } else if (event === 'subscription.cancelled' || event === 'subscription.halted') {
      const subEntity = eventPayload.payload?.subscription?.entity;
      if (subEntity?.id) {
        const sub = await Subscription.findOneAndUpdate(
          { razorpaySubscriptionId: subEntity.id },
          { $set: { status: 'cancelled' } }
        );
        if (sub?.userId) {
          await User.findByIdAndUpdate(sub.userId, { $set: { plan: 'free' } });
        }
      }
    }

    return NextResponse.json({ received: true, event });
  } catch (err: any) {
    console.error('Razorpay webhook processing error:', err);
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}
