import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'team';
  avatar?: string;
  preferences: {
    theme: 'dark' | 'light' | 'system';
    defaultModel: string;
    systemPrompt: string;
    temperature: number;
    streamResponses: boolean;
    webSearchDefault: boolean;
    voiceEnabled: boolean;
    voiceName: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    plan: { type: String, enum: ['free', 'pro', 'team'], default: 'free', index: true },
    avatar: { type: String },
    preferences: {
      theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
      defaultModel: { type: String, default: 'ruhi-balanced' },
      systemPrompt: { type: String, default: 'You are Ruhi, a highly intelligent, empathetic, thoughtful, and capable AI companion.' },
      temperature: { type: Number, default: 0.7, min: 0, max: 2 },
      streamResponses: { type: Boolean, default: true },
      webSearchDefault: { type: Boolean, default: false },
      voiceEnabled: { type: Boolean, default: true },
      voiceName: { type: String, default: 'Ruhi Natural' },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default User;
