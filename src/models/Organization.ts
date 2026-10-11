import mongoose, { Schema, Document, Model } from 'mongoose';

export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface IOrganizationMember {
  userId: mongoose.Types.ObjectId;
  role: OrganizationRole;
  joinedAt: Date;
}

export interface IOrganizationDocument extends Document {
  name: string;
  slug: string;
  ownerId: mongoose.Types.ObjectId;
  members: IOrganizationMember[];
  plan: 'free' | 'team' | 'enterprise';
  settings: {
    enforceMfa: boolean;
    defaultModel: string;
    dataRetentionDays: number;
    allowPublicSharing: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationMemberSchema = new Schema<IOrganizationMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member',
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OrganizationSchema = new Schema<IOrganizationDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: [OrganizationMemberSchema],
    plan: { type: String, enum: ['free', 'team', 'enterprise'], default: 'team' },
    settings: {
      enforceMfa: { type: Boolean, default: false },
      defaultModel: { type: String, default: 'ruhi-balanced' },
      dataRetentionDays: { type: Number, default: 90 },
      allowPublicSharing: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

OrganizationSchema.index({ 'members.userId': 1 });

export const Organization: Model<IOrganizationDocument> =
  mongoose.models.Organization ||
  mongoose.model<IOrganizationDocument>('Organization', OrganizationSchema);

export default Organization;
