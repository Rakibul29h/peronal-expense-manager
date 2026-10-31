import mongoose, { Schema } from 'mongoose';
import { addOwnership } from './ownership';

const TuitionSessionSchema = new Schema(
  {
    date: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

export interface ITuition {
  name: string;
  targetDaysPerMonth: number;
  sessions: { date: string; completed: boolean }[];
  paid: boolean;
  monthKey: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TuitionSchema = new Schema<ITuition>(
  {
    name: { type: String, required: true, trim: true },
    targetDaysPerMonth: { type: Number, required: true, min: 1, max: 31 },
    sessions: { type: [TuitionSessionSchema], default: [] },
    paid: { type: Boolean, default: false },
    monthKey: { type: String, required: true },
    parentId: { type: String },
  },
  { timestamps: true }
);
TuitionSchema.plugin(addOwnership);

export const TuitionModel =
  (mongoose.models.Tuition as mongoose.Model<ITuition> | undefined) ||
  mongoose.model<ITuition>('Tuition', TuitionSchema);
