import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProjectDocument extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  customInstructions?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProjectDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    customInstructions: { type: String, default: '', trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProjectSchema.index({ userId: 1, createdAt: -1 });

export const Project: Model<IProjectDocument> =
  mongoose.models.Project || mongoose.model<IProjectDocument>('Project', ProjectSchema);

export default Project;
