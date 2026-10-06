import mongoose, { Schema, Model } from 'mongoose';

export interface IMemory {
  userId: mongoose.Types.ObjectId;
  category: 'preference' | 'instruction' | 'fact' | 'project';
  content: string;
  isEnabled: boolean;
  confidence: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const MemorySchema = new Schema<IMemory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      enum: ['preference', 'instruction', 'fact', 'project'],
      default: 'preference',
    },
    content: { type: String, required: true, trim: true },
    isEnabled: { type: Boolean, default: true, index: true },
    confidence: { type: Number, default: 1.0 },
  },
  { timestamps: true }
);

MemorySchema.index({ userId: 1, isEnabled: 1 });
MemorySchema.index({ userId: 1, createdAt: -1 });

export const Memory: Model<IMemory> =
  mongoose.models.Memory || mongoose.model<IMemory>('Memory', MemorySchema);

export default Memory;
