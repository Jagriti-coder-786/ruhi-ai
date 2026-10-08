import mongoose, { Schema, Model } from 'mongoose';

export interface IArtifactDocument {
  userId: mongoose.Types.ObjectId;
  conversationId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  title: string;
  type: 'document' | 'code' | 'spreadsheet' | 'presentation' | 'table' | 'chart' | 'diagram' | 'interactive';
  content: string;
  language?: string;
  metadata?: Record<string, unknown>;
  versions: Array<{
    content: string;
    title?: string;
    createdAt: Date;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

const ArtifactSchema = new Schema<IArtifactDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', default: null, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    title: { type: String, required: true, trim: true, default: 'Untitled Artifact' },
    type: {
      type: String,
      enum: ['document', 'code', 'spreadsheet', 'presentation', 'table', 'chart', 'diagram', 'interactive'],
      required: true,
      default: 'document',
    },
    content: { type: String, required: true, default: '' },
    language: { type: String, default: 'typescript' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    versions: [
      {
        content: { type: String, required: true },
        title: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

ArtifactSchema.index({ userId: 1, updatedAt: -1 });
ArtifactSchema.index({ userId: 1, type: 1 });

export const Artifact: Model<IArtifactDocument> =
  mongoose.models.Artifact || mongoose.model<IArtifactDocument>('Artifact', ArtifactSchema);

export default Artifact;
