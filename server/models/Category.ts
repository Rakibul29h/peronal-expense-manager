import mongoose, { Schema } from 'mongoose';
import { addOwnership } from './ownership';

export interface ICategory {
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
}

export const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['expense', 'income'], required: true, index: true },
    icon: { type: String, default: 'Tag' },
    color: { type: String, default: '#64748b' },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
CategorySchema.plugin(addOwnership);

export const CategoryModel =
  (mongoose.models.Category as mongoose.Model<ICategory> | undefined) ||
  mongoose.model<ICategory>('Category', CategorySchema);
