import mongoose, { Schema, Model } from 'mongoose';

export interface IMessage {
  conversationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  model?: string;
  attachments?: Array<{
    name: string;
    type: string;
    mimeType: string;
    size: number;
    url?: string;
    dataBase64?: string;
    extractedText?: string;
    documentId?: mongoose.Types.ObjectId;
  }>;
  toolCalls?: Array<{
    toolName: string;
    args: Record<string, unknown>;
    result?: unknown;
    status: 'pending' | 'success' | 'failed';
  }>;
  citations?: Array<{
    title: string;
    url?: string;
    snippet: string;
    sourceType: 'web' | 'document';
    documentId?: mongoose.Types.ObjectId;
    page?: number;
  }>;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  feedback?: 'like' | 'dislike';
  createdAt?: Date;
  updatedAt?: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant', 'system', 'tool'], required: true },
    content: { type: String, required: true },
    model: { type: String },
    attachments: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        url: { type: String },
        dataBase64: { type: String },
        extractedText: { type: String },
        documentId: { type: Schema.Types.ObjectId, ref: 'DocumentRecord' },
      },
    ],
    toolCalls: [
      {
        toolName: { type: String, required: true },
        args: { type: Schema.Types.Mixed },
        result: { type: Schema.Types.Mixed },
        status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
      },
    ],
    citations: [
      {
        title: { type: String, required: true },
        url: { type: String },
        snippet: { type: String, required: true },
        sourceType: { type: String, enum: ['web', 'document'], default: 'web' },
        documentId: { type: Schema.Types.ObjectId, ref: 'DocumentRecord' },
        page: { type: Number },
      },
    ],
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    feedback: { type: String, enum: ['like', 'dislike'] },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ userId: 1, createdAt: -1 });

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
