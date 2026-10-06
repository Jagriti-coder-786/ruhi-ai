import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import Usage from '@/models/Usage';
import User from '@/models/User';
import { SubscriptionTier } from '@/types';

export const TIER_LIMITS = {
  free: {
    dailyRequests: 50,
    dailyTokens: 100000,
    imageGenerationsPerDay: 5,
    maxStorageBytes: 25 * 1024 * 1024, // 25 MB
    allowReasonerModel: false,
    allowVoiceMode: true,
  },
  pro: {
    dailyRequests: 1000,
    dailyTokens: 2000000,
    imageGenerationsPerDay: 100,
    maxStorageBytes: 1024 * 1024 * 1024, // 1 GB
    allowReasonerModel: true,
    allowVoiceMode: true,
  },
  team: {
    dailyRequests: 5000,
    dailyTokens: 10000000,
    imageGenerationsPerDay: 500,
    maxStorageBytes: 10 * 1024 * 1024 * 1024, // 10 GB
    allowReasonerModel: true,
    allowVoiceMode: true,
  },
};

export async function checkQuota(userId: string, tier: SubscriptionTier) {
  await connectDB();
  const today = new Date().toISOString().split('T')[0];

  const usage = await Usage.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    date: today,
  });

  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  const currentRequests = usage?.requestCount || 0;

  if (currentRequests >= limits.dailyRequests) {
    return {
      allowed: false,
      reason: `Daily request limit reached (${currentRequests}/${limits.dailyRequests}). Upgrade to Pro for 1,000+ daily requests.`,
      usage,
      limits,
    };
  }

  return {
    allowed: true,
    usage: usage || {
      requestCount: 0,
      totalTokens: 0,
      imageGenerations: 0,
      voiceSeconds: 0,
      storageBytes: 0,
    },
    limits,
  };
}

export async function recordUsage(params: {
  userId: string;
  tokensTotal?: number;
  promptTokens?: number;
  completionTokens?: number;
  isImageGen?: boolean;
  voiceSeconds?: number;
  toolCall?: boolean;
  storageBytesAdded?: number;
}) {
  await connectDB();
  const today = new Date().toISOString().split('T')[0];
  const userObjectId = new mongoose.Types.ObjectId(params.userId);

  const incUpdate: Record<string, number> = {
    requestCount: 1,
    totalTokens: params.tokensTotal || 0,
    promptTokens: params.promptTokens || 0,
    completionTokens: params.completionTokens || 0,
  };

  if (params.isImageGen) incUpdate.imageGenerations = 1;
  if (params.voiceSeconds) incUpdate.voiceSeconds = params.voiceSeconds;
  if (params.toolCall) incUpdate.toolCallsCount = 1;
  if (params.storageBytesAdded) incUpdate.storageBytes = params.storageBytesAdded;

  await Usage.findOneAndUpdate(
    { userId: userObjectId, date: today },
    { $inc: incUpdate },
    { upsert: true, new: true }
  );
}
