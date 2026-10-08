import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFlashcardDeck extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  topic: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardDeckSchema = new Schema<IFlashcardDeck>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export const FlashcardDeck: Model<IFlashcardDeck> =
  mongoose.models.FlashcardDeck || mongoose.model<IFlashcardDeck>('FlashcardDeck', FlashcardDeckSchema);

export default FlashcardDeck;
