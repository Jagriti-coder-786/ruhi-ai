import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAutomatedWorkflow extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  trigger: {
    type: 'schedule' | 'event' | 'condition';
    schedule?: string; // cron expression
    eventSource?: string; // e.g., 'github_webhook', 'gmail_inbound'
    conditions?: Record<string, unknown>;
  };
  steps: Array<{
    provider: string; // e.g., 'google_drive', 'ruhi_ai', 'gmail'
    action: string; // e.g., 'search', 'summarize', 'send_email'
    parameters: Record<string, unknown>;
  }>;
  isActive: boolean;
  lastRunAt?: Date;
  lastStatus?: 'success' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const AutomatedWorkflowSchema = new Schema<IAutomatedWorkflow>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    trigger: {
      type: {
        type: String,
        enum: ['schedule', 'event', 'condition'],
        required: true,
      },
      schedule: { type: String },
      eventSource: { type: String },
      conditions: { type: Schema.Types.Mixed },
    },
    steps: [
      {
        provider: { type: String, required: true },
        action: { type: String, required: true },
        parameters: { type: Schema.Types.Mixed, default: {} },
      },
    ],
    isActive: { type: Boolean, default: true },
    lastRunAt: { type: Date },
    lastStatus: { type: String, enum: ['success', 'failed'] },
  },
  { timestamps: true }
);

AutomatedWorkflowSchema.index({ userId: 1, isActive: 1 });

export const AutomatedWorkflow: Model<IAutomatedWorkflow> =
  mongoose.models.AutomatedWorkflow ||
  mongoose.model<IAutomatedWorkflow>('AutomatedWorkflow', AutomatedWorkflowSchema);

export default AutomatedWorkflow;
