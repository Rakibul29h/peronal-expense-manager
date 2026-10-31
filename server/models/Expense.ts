import mongoose, { Schema } from 'mongoose';
import { addOwnership } from './ownership';

export interface IExpense {
  title: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ExpenseSchema = new Schema<IExpense>(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    paymentMethod: { type: String, default: 'Cash' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: -1, category: 1 });
ExpenseSchema.plugin(addOwnership);

export const ExpenseModel =
  (mongoose.models.Expense as mongoose.Model<IExpense> | undefined) ||
  mongoose.model<IExpense>('Expense', ExpenseSchema);
