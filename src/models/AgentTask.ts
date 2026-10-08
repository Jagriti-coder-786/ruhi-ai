import mongoose, { Schema, Model } from 'mongoose';

export interface IAgentTask {
  userId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  title: string;
  status: 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';
  plan: Array<{
    name: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    agentType: string;
  }>;
  executionHistory: Array<{
    action: string;
    result?: string;
    error?: string;
    timestamp: Date;
  }>;
  costMetrics: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    toolCallsCount: number;
    durationMs: number;
  };
  limits: {
    maxCostUsd?: number;
    maxDurationMs?: number;
    maxRetries: number;
  };
  approvalMode: 'safe' | 'balanced' | 'autonomous';
  createdAt?: Date;
  updatedAt?: Date;
}

const AgentTaskSchema = new Schema<IAgentTask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ['queued', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled'],
      default: 'queued',
    },
    plan: [
      {
        name: { type: String, required: true },
        status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },
        agentType: { type: String, required: true },
      },
    ],
    executionHistory: [
      {
        action: { type: String, required: true },
        result: { type: String },
        error: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    costMetrics: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
      toolCallsCount: { type: Number, default: 0 },
      durationMs: { type: Number, default: 0 },
    },
    limits: {
      maxCostUsd: { type: Number },
      maxDurationMs: { type: Number },
      maxRetries: { type: Number, default: 3 },
    },
    approvalMode: {
      type: String,
      enum: ['safe', 'balanced', 'autonomous'],
      default: 'safe',
    },
  },
  { timestamps: true }
);

export const AgentTask: Model<IAgentTask> =
  mongoose.models.AgentTask || mongoose.model<IAgentTask>('AgentTask', AgentTaskSchema);

export default AgentTask;
