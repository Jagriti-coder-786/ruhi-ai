import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Subscription from '@/models/Subscription';
import Usage from '@/models/Usage';
import AuditLog from '@/models/AuditLog';
import { requireAdmin } from '@/lib/auth/session';
import modelRegistry from '@/providers/ai/registry';

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    await connectDB();

    const [
      totalUsers,
      activeUsers,
      proUsers,
      teamUsers,
      totalConversations,
      totalMessages,
      recentSubscriptions,
      recentLogs,
      totalLikes,
      totalDislikes,
      dislikeReasons,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ plan: 'pro' }),
      User.countDocuments({ plan: 'team' }),
      Conversation.countDocuments(),
      Message.countDocuments(),
      Subscription.find().sort({ createdAt: -1 }).limit(5).lean(),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).lean(),
      Message.countDocuments({ feedback: 'like' }),
      Message.countDocuments({ feedback: 'dislike' }),
      Message.aggregate([
        { $match: { feedback: 'dislike', feedbackReason: { $exists: true, $ne: '' } } },
        { $group: { _id: '$feedbackReason', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    // Calculate approximate monthly revenue
    const estimatedMonthlyRevenue = proUsers * 499 + teamUsers * 1499;

    const models = modelRegistry.getAllModels();

    const totalRated = totalLikes + totalDislikes;
    const satisfactionRate = totalRated > 0 ? Math.round((totalLikes / totalRated) * 100) : 100;

    return NextResponse.json({
      metrics: {
        totalUsers,
        activeUsers,
        proUsers,
        teamUsers,
        totalConversations,
        totalMessages,
        estimatedMonthlyRevenue,
      },
      feedbackStats: {
        likes: totalLikes,
        dislikes: totalDislikes,
        satisfactionRate,
        topDislikeReasons: dislikeReasons.map((r: any) => ({ reason: r._id, count: r.count })),
      },
      modelsStatus: models.map((m) => ({
        id: m.id,
        name: m.displayName,
        provider: m.provider,
        isAvailable: m.isAvailable,
        isPremiumOnly: m.isPremiumOnly,
      })),
      recentSubscriptions,
      recentLogs,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Access denied: Admin privileges required.' }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
