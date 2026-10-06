import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDocumentChunkDocument extends Document {
  documentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  chunkIndex: number;
  content: string;
  embedding?: number[];
  metadata?: {
    pageNumber?: number;
    charCount?: number;
    fileName?: string;
  };
  createdAt: Date;
}

const DocumentChunkSchema = new Schema<IDocumentChunkDocument>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'DocumentRecord', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    chunkIndex: { type: Number, required: true },
    content: { type: String, required: true },
    embedding: { type: [Number], default: [] },
    metadata: {
      pageNumber: { type: Number },
      charCount: { type: Number },
      fileName: { type: String },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Strictly isolate documents by user + documentId
DocumentChunkSchema.index({ userId: 1, documentId: 1 });
DocumentChunkSchema.index({ userId: 1, projectId: 1 });

export const DocumentChunk: Model<IDocumentChunkDocument> =
  mongoose.models.DocumentChunk ||
  mongoose.model<IDocumentChunkDocument>('DocumentChunk', DocumentChunkSchema);

export default DocumentChunk;
