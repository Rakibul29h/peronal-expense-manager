import mongoose, { Schema } from 'mongoose';
import { addOwnership } from './ownership';

export interface ISettings {
  currency: string;
  currencySymbol: string;
  openingBalance: number;
  survivalWindowDays: number;
  warningThresholdDays: number;
  theme: string;
  dateFormat: string;
  updatedAt: Date;
}

export const SettingsSchema = new Schema<ISettings>(
  {
    currency: { type: String, default: 'BDT' },
    currencySymbol: { type: String, default: '৳' },
    openingBalance: { type: Number, default: 0 },
    survivalWindowDays: { type: Number, default: 30 },
    warningThresholdDays: { type: Number, default: 15 },
    theme: { type: String, default: 'light' },
    dateFormat: { type: String, default: 'yyyy-MM-dd' },
  },
  { timestamps: true }
);
SettingsSchema.plugin(addOwnership);

export const SettingsModel =
  (mongoose.models.Settings as mongoose.Model<ISettings> | undefined) ||
  mongoose.model<ISettings>('Settings', SettingsSchema);
