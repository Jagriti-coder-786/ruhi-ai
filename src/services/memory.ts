import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import Memory from '@/models/Memory';

export async function getUserMemories(userId: string) {
  await connectDB();
  return await Memory.find({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .lean();
}

export async function getActiveMemoriesPrompt(userId: string): Promise<string> {
  await connectDB();
  const memories = await Memory.find({
    userId: new mongoose.Types.ObjectId(userId),
    isEnabled: true,
  }).lean();

  if (memories.length === 0) return '';

  const memoryLines = memories.map((m) => `- [${m.category}]: ${m.content}`);
  return `
=== USER PREFERENCES & MEMORY ===
The user has asked you to remember the following preferences and context:
${memoryLines.join('\n')}
Adapt your style and responses to honor these preferences.
=== END OF USER MEMORY ===
`.trim();
}

export async function createMemory(params: {
  userId: string;
  category: 'preference' | 'instruction' | 'fact' | 'project';
  content: string;
}) {
  await connectDB();
  return await Memory.create({
    userId: new mongoose.Types.ObjectId(params.userId),
    category: params.category,
    content: params.content.trim(),
    isEnabled: true,
  });
}

export async function updateMemory(params: {
  memoryId: string;
  userId: string;
  content?: string;
  isEnabled?: boolean;
}) {
  await connectDB();
  return await Memory.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(params.memoryId),
      userId: new mongoose.Types.ObjectId(params.userId),
    },
    {
      $set: {
        ...(params.content ? { content: params.content.trim() } : {}),
        ...(typeof params.isEnabled === 'boolean' ? { isEnabled: params.isEnabled } : {}),
      },
    },
    { new: true }
  );
}

export async function deleteMemory(memoryId: string, userId: string) {
  await connectDB();
  return await Memory.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(memoryId),
    userId: new mongoose.Types.ObjectId(userId),
  });
}
