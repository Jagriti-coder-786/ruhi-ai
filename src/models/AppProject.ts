import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAppProject extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  framework: 'nextjs' | 'react' | 'static' | 'node_express' | 'mern';
  files: Record<string, { content: string; isBinary: boolean; path: string }>;
  environmentVars: Record<string, string>; // In a real app, these should be encrypted
  dependencies: Record<string, string>;
  deployments: Array<{
    url: string;
    status: 'pending' | 'success' | 'failed';
    timestamp: Date;
  }>;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AppProjectSchema = new Schema<IAppProject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    framework: {
      type: String,
      enum: ['nextjs', 'react', 'static', 'node_express', 'mern'],
      default: 'nextjs',
    },
    files: { type: Map, of: Schema.Types.Mixed, default: {} },
    environmentVars: { type: Map, of: String, default: {} },
    dependencies: { type: Map, of: String, default: {} },
    deployments: [
      {
        url: { type: String, required: true },
        status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AppProjectSchema.index({ userId: 1, createdAt: -1 });

export const AppProject: Model<IAppProject> =
  mongoose.models.AppProject || mongoose.model<IAppProject>('AppProject', AppProjectSchema);

export default AppProject;
