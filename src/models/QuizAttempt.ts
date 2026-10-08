import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuizAttempt extends Document {
  quizId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  score: number;
  answers: Array<{
    questionIndex: number;
    userAnswer: string;
    isCorrect: boolean;
  }>;
  completedAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    score: { type: Number, required: true },
    answers: [
      {
        questionIndex: { type: Number, required: true },
        userAnswer: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
      },
    ],
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const QuizAttempt: Model<IQuizAttempt> =
  mongoose.models.QuizAttempt || mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);

export default QuizAttempt;
