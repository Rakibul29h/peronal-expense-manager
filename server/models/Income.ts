import mongoose, { Schema } from 'mongoose';
import { addOwnership } from './ownership';

export interface IIncome {
  title: string;
  amount: number;
  category: string;
  date: string;
  source?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const IncomeSchema = new Schema<IIncome>(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    source: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

IncomeSchema.index({ date: -1, category: 1 });
IncomeSchema.plugin(addOwnership);

export const IncomeModel =
  (mongoose.models.Income as mongoose.Model<IIncome> | undefined) ||
  mongoose.model<IIncome>('Income', IncomeSchema);
