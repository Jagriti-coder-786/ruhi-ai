import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFlashcard extends Document {
  deckId: mongoose.Types.ObjectId;
  front: string;
  back: string;
  nextReview: Date;
  interval: number; // in days
  easeFactor: number;
  repetitions: number;
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardSchema = new Schema<IFlashcard>(
  {
    deckId: { type: Schema.Types.ObjectId, ref: 'FlashcardDeck', required: true, index: true },
    front: { type: String, required: true },
    back: { type: String, required: true },
    nextReview: { type: Date, default: Date.now, index: true },
    interval: { type: Number, default: 0 },
    easeFactor: { type: Number, default: 2.5 },
    repetitions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Flashcard: Model<IFlashcard> =
  mongoose.models.Flashcard || mongoose.model<IFlashcard>('Flashcard', FlashcardSchema);

export default Flashcard;
