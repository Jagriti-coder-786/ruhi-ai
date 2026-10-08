import mongoose, { Schema, Model } from 'mongoose';

export interface IScheduledTaskDocument {
  userId: mongoose.Types.ObjectId;
  title: string;
  prompt: string;
  scheduleType: 'once' | 'daily' | 'weekly' | 'monthly';
  scheduledTime?: string;
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  notifyVia: 'in_app' | 'email';
  lastResult?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ScheduledTaskSchema = new Schema<IScheduledTaskDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    prompt: { type: String, required: true, trim: true },
    scheduleType: {
      type: String,
      enum: ['once', 'daily', 'weekly', 'monthly'],
      default: 'daily',
    },
    scheduledTime: { type: String, default: '09:00' },
    isActive: { type: Boolean, default: true, index: true },
    lastRunAt: { type: Date },
    nextRunAt: { type: Date },
    notifyVia: {
      type: String,
      enum: ['in_app', 'email'],
      default: 'in_app',
    },
    lastResult: { type: String },
  },
  { timestamps: true }
);

ScheduledTaskSchema.index({ userId: 1, isActive: 1 });
ScheduledTaskSchema.index({ isActive: 1, nextRunAt: 1 });

export const ScheduledTask: Model<IScheduledTaskDocument> =
  mongoose.models.ScheduledTask ||
  mongoose.model<IScheduledTaskDocument>('ScheduledTask', ScheduledTaskSchema);

export default ScheduledTask;
