import mongoose, { Schema, Document, Model } from 'mongoose';
import { OrganizationRole } from './Organization';

export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface IOrganizationInviteDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  email: string;
  role: OrganizationRole;
  token: string;
  invitedBy: mongoose.Types.ObjectId;
  status: InviteStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationInviteSchema = new Schema<IOrganizationInviteDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],
      default: 'member',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'revoked'],
      default: 'pending',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: { type: Date },
    acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

OrganizationInviteSchema.index({ organizationId: 1, email: 1 });
OrganizationInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB TTL index

export const OrganizationInvite: Model<IOrganizationInviteDocument> =
  mongoose.models.OrganizationInvite ||
  mongoose.model<IOrganizationInviteDocument>('OrganizationInvite', OrganizationInviteSchema);

export default OrganizationInvite;
