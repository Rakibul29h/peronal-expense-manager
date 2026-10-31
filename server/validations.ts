import { z } from 'zod';

export const expenseCreateSchema = z.object({
  title: z.string().min(1, 'Expense title is required').max(150, 'Title must be under 150 characters'),
  amount: z.number().positive('Amount must be a positive number'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  paymentMethod: z.string().optional().default('Cash'),
  notes: z.string().max(500, 'Notes must be under 500 characters').optional().default(''),
});

export const expenseUpdateSchema = expenseCreateSchema.partial();

export const incomeCreateSchema = z.object({
  title: z.string().min(1, 'Income title is required').max(150, 'Title must be under 150 characters'),
  amount: z.number().positive('Amount must be a positive number'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  source: z.string().max(100, 'Source must be under 100 characters').optional().default(''),
  notes: z.string().max(500, 'Notes must be under 500 characters').optional().default(''),
});

export const incomeUpdateSchema = incomeCreateSchema.partial();

export const borrowingCreateSchema = z.object({
  type: z.enum(['credit', 'debt']),
  person: z.string().min(1, 'Person is required').max(150, 'Name must be under 150 characters'),
  amount: z.number().positive('Amount must be a positive number'),
});
export const borrowingUpdateSchema = borrowingCreateSchema.partial();

export const tuitionCreateSchema = z.object({
  name: z.string().min(1, 'Tuition name is required').max(150),
  targetDaysPerMonth: z.number().int().min(1).max(31),
});

export const tuitionUpdateSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('edit'),
    name: z.string().min(1).max(150),
    targetDaysPerMonth: z.number().int().min(1).max(31),
  }),
  z.object({
    action: z.literal('addDates'),
    dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
  }),
  z.object({ action: z.literal('addToday'), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
  z.object({ action: z.literal('editSession'), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
  z.object({ action: z.literal('deleteSession'), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
  z.object({ action: z.literal('setPaid'), paid: z.boolean() }),
]);

export const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Name must be under 50 characters'),
  type: z.enum(['expense', 'income']),
  icon: z.string().optional().default('Tag'),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a valid hex color').default('#6366f1'),
  isActive: z.boolean().optional().default(true),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const settingsUpdateSchema = z.object({
  currency: z.string().min(1).max(10).optional(),
  currencySymbol: z.string().min(1).max(5).optional(),
  openingBalance: z.number().optional(),
  survivalWindowDays: z.number().min(1).max(365).optional(),
  warningThresholdDays: z.number().min(1).max(90).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  dateFormat: z.string().optional(),
});

export const todoStatusSchema = z.enum(['backlog', 'todo', 'in_progress', 'done', 'canceled']);
export const todoPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const todoCreateSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(150),
  description: z.string().max(1000).optional().default(''),
  status: todoStatusSchema.default('backlog'),
  priority: todoPrioritySchema.default('medium'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be formatted as YYYY-MM-DD').optional().or(z.literal('')),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
});
export const todoUpdateSchema = todoCreateSchema.partial();
export const todoReorderSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), status: todoStatusSchema, order: z.number().int().min(0) })).min(1),
});
