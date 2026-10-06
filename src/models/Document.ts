import mongoose, { Schema, Model } from 'mongoose';

export interface IDocumentRecord {
  userId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId | null;
  conversationId?: mongoose.Types.ObjectId | null;
  name: string;
  mimeType: string;
  size: number;
  chunksCount: number;
  summary?: string;
  status: 'processing' | 'ready' | 'error';
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const DocumentSchema = new Schema<IDocumentRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', default: null, index: true },
    name: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    chunksCount: { type: Number, default: 0 },
    summary: { type: String },
    status: {
      type: String,
      enum: ['processing', 'ready', 'error'],
      default: 'processing',
      index: true,
    },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

DocumentSchema.index({ userId: 1, createdAt: -1 });
DocumentSchema.index({ userId: 1, projectId: 1 });

export const DocumentRecord: Model<IDocumentRecord> =
  mongoose.models.DocumentRecord ||
  mongoose.model<IDocumentRecord>('DocumentRecord', DocumentSchema);

export default DocumentRecord;
