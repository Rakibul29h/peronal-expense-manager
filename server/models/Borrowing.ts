import mongoose, { Schema } from 'mongoose';
import { addOwnership } from './ownership';

export interface IBorrowing {
  type: 'credit' | 'debt';
  person: string;
  amount: number;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

export const BorrowingSchema = new Schema<IBorrowing>(
  {
    type: { type: String, enum: ['credit', 'debt'], required: true, index: true },
    person: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: String, required: true, index: true },
  },
  { timestamps: true }
);
BorrowingSchema.plugin(addOwnership);

export const BorrowingModel =
  (mongoose.models.Borrowing as mongoose.Model<IBorrowing> | undefined) ||
  mongoose.model<IBorrowing>('Borrowing', BorrowingSchema);
