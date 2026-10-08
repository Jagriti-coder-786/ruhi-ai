import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuizQuestion {
  type: 'mcq' | 'true_false' | 'short_answer' | 'coding' | 'fill_in_the_blank';
  question: string;
  options?: string[]; // For MCQ
  correctAnswer: string;
  explanation: string;
}

export interface IQuiz extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  questions: IQuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema = new Schema<IQuiz>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'adaptive'],
      default: 'medium',
    },
    questions: [
      {
        type: {
          type: String,
          enum: ['mcq', 'true_false', 'short_answer', 'coding', 'fill_in_the_blank'],
          required: true,
        },
        question: { type: String, required: true },
        options: [{ type: String }],
        correctAnswer: { type: String, required: true },
        explanation: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const Quiz: Model<IQuiz> =
  mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);

export default Quiz;
