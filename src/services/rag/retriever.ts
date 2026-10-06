import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import DocumentChunk from '@/models/DocumentChunk';
import modelRegistry from '@/providers/ai/registry';
import { ICitation } from '@/types';

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  content: string;
  similarity: number;
  fileName?: string;
  chunkIndex: number;
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function retrieveRelevantChunks(params: {
  userId: string;
  query: string;
  documentIds?: string[];
  projectId?: string;
  topK?: number;
}): Promise<{ chunks: RetrievedChunk[]; citations: ICitation[] }> {
  const { userId, query, documentIds, projectId, topK = 4 } = params;
  await connectDB();

  // 1. Generate embedding for query
  const geminiProvider = modelRegistry.getProvider('gemini');
  if (!geminiProvider) {
    return { chunks: [], citations: [] };
  }

  const queryEmbedding = await geminiProvider.generateEmbedding(query);

  // 2. Build secure user-isolated query filter
  const filter: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
  };

  if (documentIds && documentIds.length > 0) {
    filter.documentId = {
      $in: documentIds.map((id) => new mongoose.Types.ObjectId(id)),
    };
  } else if (projectId) {
    filter.projectId = new mongoose.Types.ObjectId(projectId);
  }

  // 3. Fetch candidate chunks
  const candidateChunks = await DocumentChunk.find(filter)
    .populate('documentId', 'name')
    .lean()
    .limit(100);

  if (candidateChunks.length === 0) {
    return { chunks: [], citations: [] };
  }

  // 4. Calculate similarity scores
  const scoredChunks: RetrievedChunk[] = candidateChunks
    .map((chunk: any) => {
      const similarity = chunk.embedding && chunk.embedding.length > 0
        ? cosineSimilarity(queryEmbedding, chunk.embedding)
        : 0;

      return {
        chunkId: chunk._id.toString(),
        documentId: chunk.documentId?._id?.toString() || chunk.documentId?.toString(),
        content: chunk.content,
        similarity,
        fileName: chunk.documentId?.name || chunk.metadata?.fileName || 'Document',
        chunkIndex: chunk.chunkIndex,
      };
    })
    .filter((c) => c.similarity > 0.15)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  const citations: ICitation[] = scoredChunks.map((c) => ({
    title: `${c.fileName} (Section ${c.chunkIndex + 1})`,
    snippet: c.content.slice(0, 160) + '...',
    sourceType: 'document' as const,
    documentId: c.documentId,
  }));

  return { chunks: scoredChunks, citations };
}
