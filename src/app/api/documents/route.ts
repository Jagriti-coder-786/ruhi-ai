import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import DocumentRecord from '@/models/Document';
import DocumentChunk from '@/models/DocumentChunk';
import { requireAuth } from '@/lib/auth/session';
import { parseDocumentBuffer } from '@/services/rag/parser';
import { chunkText } from '@/services/rag/chunker';
import modelRegistry from '@/providers/ai/registry';
import { recordUsage } from '@/services/usage';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('projectId') as string | null;
    const conversationId = formData.get('conversationId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the 15MB limit (${Math.round(file.size / (1024 * 1024))}MB)` },
        { status: 400 }
      );
    }

    const mimeType = file.type || 'text/plain';
    const fileName = file.name || 'uploaded_document';

    // 1. Create Document Record
    const doc = await DocumentRecord.create({
      userId: new mongoose.Types.ObjectId(user.userId),
      projectId: projectId ? new mongoose.Types.ObjectId(projectId) : undefined,
      conversationId: conversationId ? new mongoose.Types.ObjectId(conversationId) : undefined,
      name: fileName,
      mimeType,
      size: file.size,
      status: 'processing',
    });

    // 2. Parse text from buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parsed = await parseDocumentBuffer(buffer, mimeType, fileName);

    // 3. Chunk text
    const chunks = chunkText(parsed.text, 650, 100);
    const geminiProvider = modelRegistry.getProvider('gemini');

    // 4. Generate embeddings and store chunks
    const chunkDocs = [];
    for (const ch of chunks) {
      let embedding: number[] = [];
      if (geminiProvider) {
        try {
          embedding = await geminiProvider.generateEmbedding(ch.content);
        } catch {
          // Fallback handled in provider
        }
      }

      chunkDocs.push({
        documentId: doc._id,
        userId: new mongoose.Types.ObjectId(user.userId),
        projectId: projectId ? new mongoose.Types.ObjectId(projectId) : undefined,
        chunkIndex: ch.index,
        content: ch.content,
        embedding,
        metadata: {
          charCount: ch.charCount,
          fileName,
        },
      });
    }

    if (chunkDocs.length > 0) {
      await DocumentChunk.insertMany(chunkDocs);
    }

    // 5. Update Document status to 'ready'
    await DocumentRecord.findByIdAndUpdate(doc._id, {
      $set: {
        status: 'ready',
        chunksCount: chunkDocs.length,
        summary: parsed.text.slice(0, 200) + '...',
      },
    });

    // 6. Record storage usage
    await recordUsage({
      userId: user.userId,
      storageBytesAdded: file.size,
    });

    return NextResponse.json({
      message: 'Document processed successfully',
      document: {
        id: doc._id.toString(),
        name: fileName,
        size: file.size,
        mimeType,
        chunksCount: chunkDocs.length,
        status: 'ready',
      },
    });
  } catch (err: any) {
    console.error('Document upload error:', err);
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'File processing failed' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(user.userId),
    };
    if (projectId) {
      filter.projectId = new mongoose.Types.ObjectId(projectId);
    }

    const docs = await DocumentRecord.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      documents: docs.map((d: any) => ({
        ...d,
        _id: d._id.toString(),
        userId: d.userId.toString(),
        projectId: d.projectId ? d.projectId.toString() : null,
      })),
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document id is required' }, { status: 400 });
    }

    const doc = await DocumentRecord.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(documentId),
      userId: new mongoose.Types.ObjectId(user.userId),
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete chunks
    await DocumentChunk.deleteMany({
      documentId: new mongoose.Types.ObjectId(documentId),
      userId: new mongoose.Types.ObjectId(user.userId),
    });

    return NextResponse.json({ message: 'Document and vector chunks removed' });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
