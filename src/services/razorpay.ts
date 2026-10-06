import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '@/config/env';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import Subscription from '@/models/Subscription';

export const PLANS_CONFIG: Record<
  'pro' | 'team',
  { name: string; amountPaise: number; currency: string; description: string }
> = {
  pro: {
    name: 'Ruhi AI Pro',
    amountPaise: 49900, // ₹499 / month
    currency: 'INR',
    description: 'Unlimited chats, Deep Reasoner model, 1GB storage, advanced tools & vision',
  },
  team: {
    name: 'Ruhi AI Team',
    amountPaise: 149900, // ₹1,499 / month
    currency: 'INR',
    description: 'Multi-seat access, priority routing, custom project knowledge, 10GB storage',
  },
};

let razorpayInstance: Razorpay | null = null;
const activeKeyId = process.env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID;
const activeKeySecret = process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;

if (activeKeyId && activeKeySecret) {
  razorpayInstance = new Razorpay({
    key_id: activeKeyId,
    key_secret: activeKeySecret,
  });
}

export async function createPaymentOrder(tier: 'pro' | 'team', userId: string) {
  const plan = PLANS_CONFIG[tier];
  if (!plan) throw new Error('Invalid plan selected');

  const keyId = process.env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;

  if (keyId && keySecret) {
    if (!razorpayInstance) {
      razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
    const order = await razorpayInstance.orders.create({
      amount: plan.amountPaise,
      currency: plan.currency,
      receipt: `rcpt_${userId.slice(-6)}_${Date.now()}`,
      notes: { userId, planTier: tier },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      isSandboxMock: false,
    };
  }

  // Graceful Sandbox Simulation Mode if keys are not configured
  const mockOrderId = `order_mock_${tier}_${Date.now()}`;
  return {
    orderId: mockOrderId,
    amount: plan.amountPaise,
    currency: plan.currency,
    keyId: 'rzp_test_mock_sandbox',
    isSandboxMock: true,
  };
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (orderId.startsWith('order_mock_')) {
    return true;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
}

export async function activateSubscription(params: {
  userId: string;
  plan: 'pro' | 'team';
  orderId: string;
  paymentId: string;
}) {
  await connectDB();
  const { userId, plan, orderId, paymentId } = params;

  await User.findByIdAndUpdate(userId, { $set: { plan } });

  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  const sub = await Subscription.findOneAndUpdate(
    { userId },
    {
      $set: {
        plan,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        amount: PLANS_CONFIG[plan].amountPaise / 100,
        currency: 'INR',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      },
    },
    { upsert: true, new: true }
  );

  return sub;
}
