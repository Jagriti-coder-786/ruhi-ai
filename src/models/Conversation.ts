import mongoose, { Schema, Model } from 'mongoose';

export interface IConversation {
  userId: mongoose.Types.ObjectId;
  title: string;
  model: string;
  projectId?: mongoose.Types.ObjectId | null;
  pinned: boolean;
  archived: boolean;
  metadata?: {
    lastMessagePreview?: string;
    totalMessages?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, default: 'New Conversation', trim: true },
    model: { type: String, required: true, default: 'ruhi-balanced' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    pinned: { type: Boolean, default: false, index: true },
    archived: { type: Boolean, default: false, index: true },
    metadata: {
      lastMessagePreview: { type: String, default: '' },
      totalMessages: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

ConversationSchema.index({ userId: 1, updatedAt: -1 });
ConversationSchema.index({ userId: 1, pinned: -1, updatedAt: -1 });
ConversationSchema.index({ userId: 1, archived: 1, updatedAt: -1 });

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;
