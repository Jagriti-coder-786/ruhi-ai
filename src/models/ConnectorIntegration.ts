import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConnectorIntegration extends Document {
  userId: mongoose.Types.ObjectId;
  provider: 'google_drive' | 'gmail' | 'google_calendar' | 'github' | 'notion';
  accessToken: string; // Should be encrypted in a production environment
  refreshToken?: string; // Should be encrypted in a production environment
  expiresAt?: Date;
  scopes: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ConnectorIntegrationSchema = new Schema<IConnectorIntegration>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: {
      type: String,
      enum: ['google_drive', 'gmail', 'google_calendar', 'github', 'notion'],
      required: true,
    },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiresAt: { type: Date },
    scopes: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// A user should only have one active integration per provider
ConnectorIntegrationSchema.index({ userId: 1, provider: 1 }, { unique: true });

export const ConnectorIntegration: Model<IConnectorIntegration> =
  mongoose.models.ConnectorIntegration ||
  mongoose.model<IConnectorIntegration>('ConnectorIntegration', ConnectorIntegrationSchema);

export default ConnectorIntegration;
