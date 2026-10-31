import mongoose, { Schema } from 'mongoose';
import { addOwnership } from './ownership';

export type TodoStatus = 'backlog' | 'todo' | 'in_progress' | 'done' | 'canceled';
export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ITodo {
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: string;
  tags: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const TodoSchema = new Schema<ITodo>(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: '', maxlength: 1000 },
    status: { type: String, enum: ['backlog', 'todo', 'in_progress', 'done', 'canceled'], default: 'backlog', index: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium', index: true },
    dueDate: { type: String, default: '' },
    tags: { type: [String], default: [] },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

TodoSchema.index({ status: 1, order: 1 });
TodoSchema.plugin(addOwnership);

export const TodoModel =
  (mongoose.models.Todo as mongoose.Model<ITodo> | undefined) ||
  mongoose.model<ITodo>('Todo', TodoSchema);
