import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITopicMastery extends Document {
  userId: mongoose.Types.ObjectId;
  topic: string;
  masteryLevel: number; // 0 to 100
  lastReviewed?: Date;
  weakAreas: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TopicMasterySchema = new Schema<ITopicMastery>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, required: true, trim: true },
    masteryLevel: { type: Number, default: 0, min: 0, max: 100 },
    lastReviewed: { type: Date },
    weakAreas: [{ type: String }],
  },
  { timestamps: true }
);

TopicMasterySchema.index({ userId: 1, topic: 1 }, { unique: true });

export const TopicMastery: Model<ITopicMastery> =
  mongoose.models.TopicMastery || mongoose.model<ITopicMastery>('TopicMastery', TopicMasterySchema);

export default TopicMastery;
