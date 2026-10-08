import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import Memory from '@/models/Memory';
import { MemoryAction } from './intent';

export interface MemoryExecutionResult {
  handledDirectly: boolean;
  confirmationMessage?: string;
  activePromptInjection?: string;
}

export class MemoryOrchestrator {
  /**
   * Handle explicit memory commands (Remember, Forget, Query)
   */
  async handleMemoryCommand(
    action: MemoryAction,
    userId: string
  ): Promise<MemoryExecutionResult> {
    await connectDB();

    if (action.type === 'create' && action.content) {
      // Security check: Don't store passwords or credentials
      const sensitivePattern = /(password|pin|secret|api[_\s]?key|credit[_\s]?card|cvv)\s*[:=]\s*(\S+)/i;
      if (sensitivePattern.test(action.content)) {
        return {
          handledDirectly: true,
          confirmationMessage:
            "For your privacy and security, I cannot store sensitive credentials, passwords, or payment details in memory.",
        };
      }

      await Memory.create({
        userId: new mongoose.Types.ObjectId(userId),
        category: action.category || 'preference',
        content: action.content,
        isEnabled: true,
      });

      return {
        handledDirectly: true,
        confirmationMessage: `Got it! I've remembered that: "${action.content}". I'll keep this in mind for our future conversations.`,
      };
    }

    if (action.type === 'delete') {
      const queryContent = action.content?.toLowerCase() || '';
      let deleted = null;

      if (queryContent && queryContent !== 'preference' && queryContent !== 'that') {
        // Search by partial text match
        deleted = await Memory.findOneAndDelete({
          userId: new mongoose.Types.ObjectId(userId),
          content: { $regex: queryContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
        });
      }

      // If not found or general request like "forget that preference", delete most recent preference
      if (!deleted) {
        deleted = await Memory.findOneAndDelete({
          userId: new mongoose.Types.ObjectId(userId),
        }).sort({ createdAt: -1 });
      }

      if (deleted) {
        return {
          handledDirectly: true,
          confirmationMessage: `I've removed that from my memory: "${deleted.content}".`,
        };
      } else {
        return {
          handledDirectly: true,
          confirmationMessage: "I didn't find that specific preference stored in my memory.",
        };
      }
    }

    if (action.type === 'query') {
      const allMemories = await Memory.find({
        userId: new mongoose.Types.ObjectId(userId),
        isEnabled: true,
      })
        .sort({ createdAt: -1 })
        .lean();

      if (allMemories.length === 0) {
        return {
          handledDirectly: true,
          confirmationMessage:
            "I don't have any saved preferences or memories for you yet. You can tell me anytime, for example: 'Remember that I prefer simple explanations'!",
        };
      }

      const list = allMemories
        .map((m, idx) => `${idx + 1}. **${m.category.toUpperCase()}**: ${m.content}`)
        .join('\n');

      return {
        handledDirectly: true,
        confirmationMessage: `Here is what I remember about your preferences:\n\n${list}`,
      };
    }

    return { handledDirectly: false };
  }

  /**
   * Intelligently retrieve only relevant memories for a prompt rather than dumping everything.
   */
  async getRelevantMemoriesPrompt(userId: string, currentQuery: string): Promise<string> {
    await connectDB();
    const all = await Memory.find({
      userId: new mongoose.Types.ObjectId(userId),
      isEnabled: true,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    if (all.length === 0) return '';

    const lowerQuery = currentQuery.toLowerCase();
    
    // Determine relevance:
    // General style/preference memories are always useful for formatting and explanation depth
    const relevant = all.filter((m) => {
      if (m.category === 'preference' || m.category === 'instruction') {
        return true;
      }
      // Keyword overlap
      const words = m.content.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      return words.some((w) => lowerQuery.includes(w));
    });

    if (relevant.length === 0) return '';

    const lines = relevant.map((m) => `- [${m.category}]: ${m.content}`);
    return `=== RELEVANT USER MEMORY & PREFERENCES ===
The user has established the following personal preferences:
${lines.join('\n')}
Honor these preferences naturally in your response.
=== END OF MEMORY ===`;
  }
}

export const memoryOrchestrator = new MemoryOrchestrator();
