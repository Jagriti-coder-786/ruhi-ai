import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStudyPlanTask {
  title: string;
  topic: string;
  type: 'review' | 'quiz' | 'read' | 'practice';
  status: 'pending' | 'completed' | 'skipped';
  scheduledFor: Date;
}

export interface IStudyPlan extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  targetDate: Date;
  topics: string[];
  schedule: IStudyPlanTask[];
  createdAt: Date;
  updatedAt: Date;
}

const StudyPlanSchema = new Schema<IStudyPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    targetDate: { type: Date, required: true },
    topics: [{ type: String }],
    schedule: [
      {
        title: { type: String, required: true },
        topic: { type: String, required: true },
        type: { type: String, enum: ['review', 'quiz', 'read', 'practice'], required: true },
        status: { type: String, enum: ['pending', 'completed', 'skipped'], default: 'pending' },
        scheduledFor: { type: Date, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const StudyPlan: Model<IStudyPlan> =
  mongoose.models.StudyPlan || mongoose.model<IStudyPlan>('StudyPlan', StudyPlanSchema);

export default StudyPlan;
