import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUsageDocument extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // Format: YYYY-MM-DD for daily rate tracking
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  imageGenerations: number;
  voiceSeconds: number;
  storageBytes: number;
  toolCallsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const UsageSchema = new Schema<IUsageDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true },
    requestCount: { type: Number, default: 0 },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    imageGenerations: { type: Number, default: 0 },
    voiceSeconds: { type: Number, default: 0 },
    storageBytes: { type: Number, default: 0 },
    toolCallsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UsageSchema.index({ userId: 1, date: -1 }, { unique: true });

export const Usage: Model<IUsageDocument> =
  mongoose.models.Usage || mongoose.model<IUsageDocument>('Usage', UsageSchema);

export default Usage;
