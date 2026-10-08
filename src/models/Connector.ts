import mongoose, { Schema, Model } from 'mongoose';

export interface IConnectorDocument {
  userId: mongoose.Types.ObjectId;
  provider: 'google_drive' | 'github' | 'slack' | 'notion' | 'dropbox';
  name: string;
  status: 'connected' | 'disconnected';
  accountEmail?: string;
  scopes: string[];
  metadata?: Record<string, unknown>;
  lastSyncedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const ConnectorSchema = new Schema<IConnectorDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: {
      type: String,
      enum: ['google_drive', 'github', 'slack', 'notion', 'dropbox'],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['connected', 'disconnected'],
      default: 'disconnected',
    },
    accountEmail: { type: String, trim: true },
    scopes: [{ type: String }],
    metadata: { type: Schema.Types.Mixed, default: {} },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

ConnectorSchema.index({ userId: 1, provider: 1 });

export const Connector: Model<IConnectorDocument> =
  mongoose.models.Connector || mongoose.model<IConnectorDocument>('Connector', ConnectorSchema);

export default Connector;
