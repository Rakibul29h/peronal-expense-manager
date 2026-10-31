import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dns from 'node:dns';
import { format, subDays, subMonths, parseISO } from 'date-fns';
import { ExpenseRecord, IncomeRecord, Category, UserSettings, BorrowingRecord, TuitionRecord } from '../../src/types';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../../src/lib/constants';
import { ExpenseModel, IncomeModel, CategoryModel, SettingsModel, BorrowingModel, TuitionModel } from './models';
import { calculateBalanceThroughDate } from '../calculations';

type TuitionUpdate =
  | { action: 'edit'; name: string; targetDaysPerMonth: number }
  | { action: 'addDates'; dates: string[] }
  | { action: 'addToday'; date: string }
  | { action: 'editSession'; date: string; newDate: string }
  | { action: 'deleteSession'; date: string }
  | { action: 'setPaid'; paid: boolean };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

interface LocalDatabase {
  expenses: ExpenseRecord[];
  income: IncomeRecord[];
  borrowings: BorrowingRecord[];
  tuitions: TuitionRecord[];
  categories: Category[];
  settings: UserSettings;
}

export interface MongoStatus {
  isMongoConnected: boolean;
  usingFallback: boolean;
  mongoUriConfigured: boolean;
  mongoError: string | null;
  clusterHost: string | null;
  isIpWhitelistError: boolean;
}

let isMongoConnected = false;
let mongoStatus: MongoStatus = {
  isMongoConnected: false,
  usingFallback: true,
  mongoUriConfigured: false,
  mongoError: null,
  clusterHost: null,
  isIpWhitelistError: false,
};

let initializationPromise: Promise<void> | null = null;

export function getMongoStatus(): MongoStatus {
  return { ...mongoStatus };
}

export async function tryConnectMongo(customUri?: string): Promise<{ success: boolean; error?: string }> {
  const mongoUri = customUri || process.env.MONGODB_URI;
  if (!mongoUri) {
    mongoStatus = {
      isMongoConnected: false,
      usingFallback: true,
      mongoUriConfigured: false,
      mongoError: null,
      clusterHost: null,
      isIpWhitelistError: false,
    };
    console.log('[database] MONGODB_URI is not configured; using local JSON storage.');
    return { success: false, error: 'No MONGODB_URI configured' };
  }

  let clusterHost = 'MongoDB Atlas Cluster';
  try {
    const atSplit = mongoUri.split('@');
    if (atSplit.length > 1) {
      clusterHost = atSplit[1].split('/')[0].split('?')[0];
    }
  } catch {
    clusterHost = 'MongoDB Atlas';
  }

  try {
    if (mongoUri.startsWith('mongodb+srv://')) {
      dns.setServers(['1.1.1.1', '8.8.8.8']);
      dns.promises.setServers(['1.1.1.1', '8.8.8.8']);
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }

    mongoose.connection.removeAllListeners('error');
    mongoose.connection.on('error', (err: any) => {
      isMongoConnected = false;
      mongoStatus.isMongoConnected = false;
      mongoStatus.usingFallback = true;
      mongoStatus.mongoError = err?.message || 'MongoDB connection error';
    });

    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || 'expense_tracker',
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });

    isMongoConnected = true;
    mongoStatus = {
      isMongoConnected: true,
      usingFallback: false,
      mongoUriConfigured: true,
      mongoError: null,
      clusterHost,
      isIpWhitelistError: false,
    };
    console.log(
      `[database] MongoDB connected successfully: ${clusterHost}/${
        process.env.MONGODB_DB_NAME || 'expense_tracker'
      }`
    );

    const [expCount, incomeCount, categoryCount, settingsCount] = await Promise.all([
      ExpenseModel.countDocuments(),
      IncomeModel.countDocuments(),
      CategoryModel.countDocuments(),
      SettingsModel.countDocuments(),
    ]);

    // Seed only a completely empty database. Clearing transactions must not recreate demo data.
    if (expCount === 0 && incomeCount === 0 && categoryCount === 0 && settingsCount === 0) {
      const localData = readLocalDb();
      if (localData.expenses.length > 0) {
        await ExpenseModel.insertMany(localData.expenses);
        await IncomeModel.insertMany(localData.income);
        await CategoryModel.insertMany(localData.categories);
        await SettingsModel.create(localData.settings);
      } else {
        const seed = generateInitialSeedData();
        await ExpenseModel.insertMany(seed.expenses);
        await IncomeModel.insertMany(seed.income);
        await CategoryModel.insertMany(seed.categories);
        await SettingsModel.create(seed.settings);
      }
    }

    await removeDuplicateMongoCategories();

    return { success: true };
  } catch (err: any) {
    await mongoose.disconnect().catch(() => {});
    isMongoConnected = false;
    const msg = err?.message || 'MongoDB Atlas connection failed';
    const isWhitelist =
      msg.includes('whitelist') ||
      msg.includes('Could not connect to any servers') ||
      msg.includes('ETIMEDOUT') ||
      msg.includes('ECONNREFUSED');

    mongoStatus = {
      isMongoConnected: false,
      usingFallback: true,
      mongoUriConfigured: true,
      mongoError: msg,
      clusterHost,
      isIpWhitelistError: isWhitelist,
    };
    console.error(`[database] MongoDB connection failed; using local JSON storage: ${msg}`);

    return { success: false, error: msg };
  }

  async function removeDuplicateMongoCategories(): Promise<void> {
    const categories = await CategoryModel.find().sort({ createdAt: 1, _id: 1 }).lean();
    const seen = new Set<string>();
    const duplicateIds = categories
      .filter(category => {
        const key = `${category.type}:${category.name.trim().toLowerCase()}`;
        if (seen.has(key)) return true;
        seen.add(key);
        return false;
      })
      .map(category => category._id);

    if (duplicateIds.length > 0) {
      await CategoryModel.deleteMany({ _id: { $in: duplicateIds } });
      console.log(`[database] Removed ${duplicateIds.length} duplicate categories.`);
    }
  }
}

async function initializeDatabase(): Promise<void> {
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Ensure local DB file exists with default seed data
  if (!fs.existsSync(DB_FILE)) {
    const initialData = generateInitialSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }

  // Attempt MongoDB connection if configured
  if (process.env.MONGODB_URI) {
    await tryConnectMongo();
  }
}

export function initDatabase(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = initializeDatabase().catch(error => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}

export async function ensureMonthCarryForward(selectedMonth: string): Promise<void> {
  const today = new Date();
  const currentMonth = format(today, 'yyyy-MM');
  if (selectedMonth !== currentMonth) return;

  const previousMonth = format(subMonths(parseISO(`${selectedMonth}-01`), 1), 'yyyy-MM');
  const nextMonthDate = `${selectedMonth}-01`;
  const [settings, incomes, expenses, borrowings] = await Promise.all([
    db.getSettings(),
    db.getIncomes(),
    db.getExpenses(),
    db.getBorrowings(),
  ]);
  if (incomes.some(income => income.title === `Balance carried forward from ${previousMonth}`)) return;

  const previousBalance = calculateBalanceThroughDate(
    settings.openingBalance,
    incomes,
    expenses,
    borrowings,
    `${previousMonth}-31`
  ).currentBalance;

  if (previousBalance > 0) {
    await db.createIncome({
      title: `Balance carried forward from ${previousMonth}`,
      amount: Number(previousBalance.toFixed(2)),
      category: 'Other',
      date: nextMonthDate,
      source: 'Automatic month-end carry-forward',
      notes: '',
    });
  }
}

void initDatabase().catch(error => {
  console.error('[database] Database initialization failed:', error);
});

function readLocalDb(): LocalDatabase {
  if (process.env.MONGODB_URI && !isMongoConnected) {
    throw new Error('MongoDB is unavailable. Local fallback storage is disabled while user authentication is enabled.');
  }
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData = generateInitialSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw) as LocalDatabase;
    return { ...data, borrowings: data.borrowings || [], tuitions: data.tuitions || [] };
  } catch (err) {
    console.error('Error reading local db, reinitializing:', err);
    const initialData = generateInitialSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

function writeLocalDb(data: LocalDatabase): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to local db:', err);
  }
}

export function generateInitialSeedData(): LocalDatabase {
  const categories: Category[] = [
    ...DEFAULT_EXPENSE_CATEGORIES.map(c => ({
      ...c,
      type: 'expense' as const,
      createdAt: new Date().toISOString(),
    })),
    ...DEFAULT_INCOME_CATEGORIES.map(c => ({
      ...c,
      type: 'income' as const,
      createdAt: new Date().toISOString(),
    })),
  ];

  const settings: UserSettings = {
    id: 'user_settings_default',
    currency: 'BDT',
    currencySymbol: '৳',
    openingBalance: 0,
    survivalWindowDays: 30,
    warningThresholdDays: 15,
    theme: 'light',
    dateFormat: 'yyyy-MM-dd',
    updatedAt: new Date().toISOString(),
  };

  // Demo data is cleared - clean slate ready for user input
  const income: IncomeRecord[] = [];
  const expenses: ExpenseRecord[] = [];

  return { expenses, income, borrowings: [], tuitions: [], categories, settings };
}

// Data Store Accessors
export const db = {
  // Expenses
  getExpenses: async (): Promise<ExpenseRecord[]> => {
    if (isMongoConnected) {
      const docs = await ExpenseModel.find().sort({ date: -1 }).lean();
      return docs.map(d => ({
        id: d._id.toString(),
        title: d.title,
        amount: d.amount,
        category: d.category,
        date: d.date,
        paymentMethod: d.paymentMethod,
        notes: d.notes,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      }));
    }
    const data = readLocalDb();
    return [...data.expenses].sort((a, b) => b.date.localeCompare(a.date));
  },

  getExpenseById: async (id: string): Promise<ExpenseRecord | null> => {
    if (isMongoConnected) {
      const doc = await ExpenseModel.findById(id).lean();
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        title: doc.title,
        amount: doc.amount,
        category: doc.category,
        date: doc.date,
        paymentMethod: doc.paymentMethod,
        notes: doc.notes,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    }
    const data = readLocalDb();
    return data.expenses.find(e => e.id === id) || null;
  },

  createExpense: async (payload: Omit<ExpenseRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExpenseRecord> => {
    const nowIso = new Date().toISOString();
    if (isMongoConnected) {
      const doc = await ExpenseModel.create({
        ...payload,
      });
      return {
        id: doc._id.toString(),
        title: doc.title,
        amount: doc.amount,
        category: doc.category,
        date: doc.date,
        paymentMethod: doc.paymentMethod,
        notes: doc.notes,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    }
    const data = readLocalDb();
    const newExpense: ExpenseRecord = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...payload,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    data.expenses.push(newExpense);
    writeLocalDb(data);
    return newExpense;
  },

  updateExpense: async (id: string, payload: Partial<ExpenseRecord>): Promise<ExpenseRecord | null> => {
    const nowIso = new Date().toISOString();
    if (isMongoConnected) {
      const doc = await ExpenseModel.findByIdAndUpdate(
        id,
        { ...payload, updatedAt: new Date() },
        { new: true }
      ).lean();
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        title: doc.title,
        amount: doc.amount,
        category: doc.category,
        date: doc.date,
        paymentMethod: doc.paymentMethod,
        notes: doc.notes,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    }
    const data = readLocalDb();
    const index = data.expenses.findIndex(e => e.id === id);
    if (index === -1) return null;
    data.expenses[index] = {
      ...data.expenses[index],
      ...payload,
      updatedAt: nowIso,
    };
    writeLocalDb(data);
    return data.expenses[index];
  },

  deleteExpense: async (id: string): Promise<boolean> => {
    if (isMongoConnected) {
      const res = await ExpenseModel.findByIdAndDelete(id);
      return !!res;
    }
    const data = readLocalDb();
    const prevLen = data.expenses.length;
    data.expenses = data.expenses.filter(e => e.id !== id);
    if (data.expenses.length !== prevLen) {
      writeLocalDb(data);
      return true;
    }
    return false;
  },

  // Income
  getIncomes: async (): Promise<IncomeRecord[]> => {
    if (isMongoConnected) {
      const docs = await IncomeModel.find().sort({ date: -1 }).lean();
      return docs.map(d => ({
        id: d._id.toString(),
        title: d.title,
        amount: d.amount,
        category: d.category,
        date: d.date,
        source: d.source,
        notes: d.notes,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      }));
    }
    const data = readLocalDb();
    return [...data.income].sort((a, b) => b.date.localeCompare(a.date));
  },

  getIncomeById: async (id: string): Promise<IncomeRecord | null> => {
    if (isMongoConnected) {
      const doc = await IncomeModel.findById(id).lean();
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        title: doc.title,
        amount: doc.amount,
        category: doc.category,
        date: doc.date,
        source: doc.source,
        notes: doc.notes,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    }
    const data = readLocalDb();
    return data.income.find(i => i.id === id) || null;
  },

  createIncome: async (payload: Omit<IncomeRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<IncomeRecord> => {
    const nowIso = new Date().toISOString();
    if (isMongoConnected) {
      const doc = await IncomeModel.create({
        ...payload,
      });
      return {
        id: doc._id.toString(),
        title: doc.title,
        amount: doc.amount,
        category: doc.category,
        date: doc.date,
        source: doc.source,
        notes: doc.notes,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    }
    const data = readLocalDb();
    const newIncome: IncomeRecord = {
      id: `inc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...payload,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    data.income.push(newIncome);
    writeLocalDb(data);
    return newIncome;
  },

  updateIncome: async (id: string, payload: Partial<IncomeRecord>): Promise<IncomeRecord | null> => {
    const nowIso = new Date().toISOString();
    if (isMongoConnected) {
      const doc = await IncomeModel.findByIdAndUpdate(
        id,
        { ...payload, updatedAt: new Date() },
        { new: true }
      ).lean();
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        title: doc.title,
        amount: doc.amount,
        category: doc.category,
        date: doc.date,
        source: doc.source,
        notes: doc.notes,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    }
    const data = readLocalDb();
    const index = data.income.findIndex(i => i.id === id);
    if (index === -1) return null;
    data.income[index] = {
      ...data.income[index],
      ...payload,
      updatedAt: nowIso,
    };
    writeLocalDb(data);
    return data.income[index];
  },

  deleteIncome: async (id: string): Promise<boolean> => {
    if (isMongoConnected) {
      const res = await IncomeModel.findByIdAndDelete(id);
      return !!res;
    }
    const data = readLocalDb();
    const prevLen = data.income.length;
    data.income = data.income.filter(i => i.id !== id);
    if (data.income.length !== prevLen) {
      writeLocalDb(data);
      return true;
    }
    return false;
  },

  getBorrowings: async (): Promise<BorrowingRecord[]> => {
    if (isMongoConnected) {
      const docs = await BorrowingModel.find().sort({ date: -1, createdAt: -1 }).lean();
      return docs.map(d => ({
        id: d._id.toString(),
        type: d.type,
        person: d.person,
        amount: d.amount,
        date: d.date,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      }));
    }
    return [...readLocalDb().borrowings].sort((a, b) => b.date.localeCompare(a.date));
  },

  createBorrowing: async (
    payload: Omit<BorrowingRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<BorrowingRecord> => {
    const nowIso = new Date().toISOString();
    if (isMongoConnected) {
      const doc = await BorrowingModel.create(payload);
      return {
        id: doc._id.toString(),
        type: doc.type,
        person: doc.person,
        amount: doc.amount,
        date: doc.date,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    }
    const data = readLocalDb();
    const record = { ...payload, id: `borrow_${Date.now()}`, createdAt: nowIso, updatedAt: nowIso };
    data.borrowings.push(record);
    writeLocalDb(data);
    return record;
  },

  updateBorrowing: async (id: string, payload: Partial<Pick<BorrowingRecord, 'person' | 'amount'>>): Promise<BorrowingRecord | null> => {
    if (isMongoConnected) {
      const doc = await BorrowingModel.findByIdAndUpdate(id, payload, { new: true }).lean();
      if (!doc) return null;
      return { id: doc._id.toString(), type: doc.type, person: doc.person, amount: doc.amount, date: doc.date, createdAt: doc.createdAt.toISOString(), updatedAt: doc.updatedAt.toISOString() };
    }
    const data = readLocalDb();
    const record = data.borrowings.find(item => item.id === id);
    if (!record) return null;
    Object.assign(record, payload, { updatedAt: new Date().toISOString() });
    writeLocalDb(data);
    return record;
  },

  deleteBorrowing: async (id: string): Promise<boolean> => {
    if (isMongoConnected) return !!(await BorrowingModel.findByIdAndDelete(id));
    const data = readLocalDb();
    const count = data.borrowings.length;
    data.borrowings = data.borrowings.filter(item => item.id !== id);
    if (data.borrowings.length === count) return false;
    writeLocalDb(data);
    return true;
  },

  getTuitions: async (): Promise<TuitionRecord[]> => {
    if (!isMongoConnected && process.env.MONGODB_URI) {
      await tryConnectMongo();
    }
    const currentMonth = format(new Date(), 'yyyy-MM');
    const nextMonthDate = new Date();
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1, 1);
    const nextMonth = format(nextMonthDate, 'yyyy-MM');
    if (isMongoConnected) {
      const docs = await TuitionModel.find().sort({ createdAt: -1 }).lean();
      const records = docs.map(doc => ({
        id: doc._id.toString(),
        name: doc.name,
        targetDaysPerMonth: doc.targetDaysPerMonth || doc.sessions.length,
        sessions: Array.isArray(doc.sessions) ? doc.sessions.map(session => ({ date: session.date, completed: session.completed ?? false })) : [],
        paid: doc.paid ?? false,
        monthKey: doc.monthKey || currentMonth,
        parentId: doc.parentId || doc._id.toString(),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      }));
      for (const record of records) {
        const completed = record.sessions.filter(session => session.completed && session.date.startsWith(currentMonth)).length;
        if (record.monthKey !== currentMonth || completed < record.targetDaysPerMonth) continue;
        const parentId = record.parentId || record.id;
        const exists = records.some(item => item.parentId === parentId && item.monthKey === nextMonth);
        if (!exists) {
          const nextDoc = await TuitionModel.create({
            name: `${record.name.replace(/ - [A-Z][a-z]{2} \d{4}$/, '')} - ${format(nextMonthDate, 'MMM yyyy')}`,
            targetDaysPerMonth: record.targetDaysPerMonth,
            sessions: [],
            paid: false,
            monthKey: nextMonth,
            parentId,
          });
          records.push({
            id: nextDoc._id.toString(),
            name: nextDoc.name,
            targetDaysPerMonth: nextDoc.targetDaysPerMonth,
            sessions: [],
            paid: false,
            monthKey: nextDoc.monthKey,
            parentId,
            createdAt: nextDoc.createdAt.toISOString(),
            updatedAt: nextDoc.updatedAt.toISOString(),
          });
        }
      }
      return records;
    }
    const data = readLocalDb();
    const records = data.tuitions.map(tuition => ({
      ...tuition,
      sessions: Array.isArray(tuition.sessions) ? tuition.sessions.map(session => ({ date: session.date, completed: session.completed ?? false })) : [],
      targetDaysPerMonth: tuition.targetDaysPerMonth || tuition.sessions.length || 1,
      paid: tuition.paid ?? false,
      monthKey: tuition.monthKey || currentMonth,
      parentId: tuition.parentId || tuition.id,
    }));
    for (const record of records) {
      const completed = record.sessions.filter(session => session.completed && session.date.startsWith(currentMonth)).length;
      if (record.monthKey !== currentMonth || completed < record.targetDaysPerMonth) continue;
      const parentId = record.parentId || record.id;
      if (records.some(item => item.parentId === parentId && item.monthKey === nextMonth)) continue;
      const now = new Date().toISOString();
      data.tuitions.push({ id: `tuition_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, name: `${record.name.replace(/ - [A-Z][a-z]{2} \d{4}$/, '')} - ${format(nextMonthDate, 'MMM yyyy')}`, targetDaysPerMonth: record.targetDaysPerMonth, sessions: [], paid: false, monthKey: nextMonth, parentId, createdAt: now, updatedAt: now });
    }
    if (data.tuitions.length !== records.length) writeLocalDb(data);
    return data.tuitions.map(tuition => ({ ...tuition, paid: tuition.paid ?? false, monthKey: tuition.monthKey || currentMonth, parentId: tuition.parentId || tuition.id, targetDaysPerMonth: tuition.targetDaysPerMonth || tuition.sessions.length || 1 }));
  },

  createTuition: async (name: string, targetDaysPerMonth: number): Promise<TuitionRecord> => {
    const sessions: TuitionRecord['sessions'] = [];
    if (isMongoConnected) {
      const doc = await TuitionModel.create({ name, targetDaysPerMonth, sessions, paid: false, monthKey: format(new Date(), 'yyyy-MM') });
      doc.parentId = doc._id.toString();
      await doc.save();
      return {
        id: doc._id.toString(),
        name: doc.name,
        targetDaysPerMonth: doc.targetDaysPerMonth,
        sessions: doc.sessions,
        paid: doc.paid ?? false,
        monthKey: doc.monthKey,
        parentId: doc.parentId || doc._id.toString(),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    }
    const now = new Date().toISOString();
    const id = `tuition_${Date.now()}`;
    const record = { id, name, targetDaysPerMonth, sessions, paid: false, monthKey: format(new Date(), 'yyyy-MM'), parentId: id, createdAt: now, updatedAt: now };
    const data = readLocalDb();
    data.tuitions.push(record);
    writeLocalDb(data);
    return record;
  },

  updateTuition: async (
    id: string,
    action: TuitionUpdate
  ): Promise<TuitionRecord | null> => {
    if (action.action === 'edit') {
      if (isMongoConnected) {
        const doc = await TuitionModel.findByIdAndUpdate(id, { name: action.name, targetDaysPerMonth: action.targetDaysPerMonth }, { new: true }).lean();
        if (!doc) return null;
        return { id: doc._id.toString(), name: doc.name, targetDaysPerMonth: doc.targetDaysPerMonth, sessions: doc.sessions, paid: doc.paid ?? false, monthKey: doc.monthKey, parentId: doc.parentId || doc._id.toString(), createdAt: doc.createdAt.toISOString(), updatedAt: doc.updatedAt.toISOString() };
      }
      const data = readLocalDb();
      const tuition = data.tuitions.find(item => item.id === id);
      if (!tuition) return null;
      tuition.name = action.name;
      tuition.targetDaysPerMonth = action.targetDaysPerMonth;
      tuition.updatedAt = new Date().toISOString();
      writeLocalDb(data);
      return tuition;
    }
    if (action.action === 'setPaid') {
      if (isMongoConnected) {
        const doc = await TuitionModel.findByIdAndUpdate(id, { paid: action.paid }, { new: true }).lean();
        if (!doc) return null;
        return { id: doc._id.toString(), name: doc.name, targetDaysPerMonth: doc.targetDaysPerMonth, sessions: doc.sessions, paid: doc.paid ?? false, monthKey: doc.monthKey, parentId: doc.parentId || doc._id.toString(), createdAt: doc.createdAt.toISOString(), updatedAt: doc.updatedAt.toISOString() };
      }
      const data = readLocalDb();
      const tuition = data.tuitions.find(item => item.id === id);
      if (!tuition) return null;
      tuition.paid = action.paid;
      tuition.updatedAt = new Date().toISOString();
      writeLocalDb(data);
      return tuition;
    }
    if (action.action === 'editSession' || action.action === 'deleteSession') {
      if (isMongoConnected) {
        const doc = await TuitionModel.findById(id);
        if (!doc) return null;
        if (action.action === 'deleteSession') {
          doc.sessions = doc.sessions.filter(session => session.date !== action.date);
        } else {
          const session = doc.sessions.find(item => item.date === action.date);
          if (!session) return null;
          if (doc.sessions.some(item => item.date === action.newDate && item.date !== action.date)) return null;
          session.date = action.newDate;
        }
        await doc.save();
        return { id: doc._id.toString(), name: doc.name, targetDaysPerMonth: doc.targetDaysPerMonth || doc.sessions.length, sessions: doc.sessions, paid: doc.paid ?? false, monthKey: doc.monthKey, parentId: doc.parentId || doc._id.toString(), createdAt: doc.createdAt.toISOString(), updatedAt: doc.updatedAt.toISOString() };
      }
      const data = readLocalDb();
      const tuition = data.tuitions.find(item => item.id === id);
      if (!tuition) return null;
      if (action.action === 'deleteSession') {
        tuition.sessions = tuition.sessions.filter(session => session.date !== action.date);
      } else {
        const session = tuition.sessions.find(item => item.date === action.date);
        if (!session || tuition.sessions.some(item => item.date === action.newDate && item.date !== action.date)) return null;
        session.date = action.newDate;
      }
      tuition.sessions.sort((a, b) => a.date.localeCompare(b.date));
      tuition.updatedAt = new Date().toISOString();
      writeLocalDb(data);
      return tuition;
    }
    const dates = action.action === 'addDates' ? action.dates : [action.date];
    if (isMongoConnected) {
      const doc = await TuitionModel.findById(id);
      if (!doc) return null;
      const existing = new Map(doc.sessions.map(session => [session.date, session.completed]));
      dates.forEach(date => existing.set(date, true));
      doc.sessions = [...existing.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, completed]) => ({ date, completed }));
      await doc.save();
      return {
        id: doc._id.toString(),
        name: doc.name,
        targetDaysPerMonth: doc.targetDaysPerMonth || doc.sessions.length,
        sessions: doc.sessions,
        paid: doc.paid ?? false,
        monthKey: doc.monthKey,
        parentId: doc.parentId || doc._id.toString(),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    }
    const data = readLocalDb();
    const tuition = data.tuitions.find(item => item.id === id);
    if (!tuition) return null;
    const existing = new Map(tuition.sessions.map(session => [session.date, session.completed]));
    dates.forEach(date => existing.set(date, true));
    tuition.sessions = [...existing.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, completed]) => ({ date, completed }));
    tuition.updatedAt = new Date().toISOString();
    writeLocalDb(data);
    return {
      ...tuition,
      targetDaysPerMonth: tuition.targetDaysPerMonth || tuition.sessions.length || 1,
    };
  },

  deleteTuition: async (id: string): Promise<boolean> => {
    if (isMongoConnected) return !!(await TuitionModel.findByIdAndDelete(id));
    const data = readLocalDb();
    const count = data.tuitions.length;
    data.tuitions = data.tuitions.filter(item => item.id !== id);
    if (data.tuitions.length === count) return false;
    writeLocalDb(data);
    return true;
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    if (isMongoConnected) {
      let docs = await CategoryModel.find().sort({ name: 1 }).lean();
      if (docs.length === 0) {
        for (const category of [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]) {
          await CategoryModel.create({
            name: category.name,
            type: category.type as 'expense' | 'income',
            icon: category.icon,
            color: category.color,
            isDefault: category.isDefault,
            isActive: category.isActive,
          });
        }
        docs = await CategoryModel.find().sort({ name: 1 }).lean();
      }
      const seen = new Set<string>();
      return docs.filter(d => {
        const key = `${d.type}:${d.name.trim().toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).map(d => ({
        id: d._id.toString(),
        name: d.name,
        type: d.type,
        icon: d.icon,
        color: d.color,
        isDefault: d.isDefault,
        isActive: d.isActive,
        createdAt: d.createdAt.toISOString(),
      }));
    }
    const data = readLocalDb();
    return data.categories;
  },

  createCategory: async (payload: Omit<Category, 'id' | 'createdAt'>): Promise<Category> => {
    const nowIso = new Date().toISOString();
    if (isMongoConnected) {
      const doc = await CategoryModel.create({
        ...payload,
      });
      return {
        id: doc._id.toString(),
        name: doc.name,
        type: doc.type,
        icon: doc.icon,
        color: doc.color,
        isDefault: doc.isDefault,
        isActive: doc.isActive,
        createdAt: doc.createdAt.toISOString(),
      };
    }
    const data = readLocalDb();
    const newCat: Category = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...payload,
      createdAt: nowIso,
    };
    data.categories.push(newCat);
    writeLocalDb(data);
    return newCat;
  },

  updateCategory: async (id: string, payload: Partial<Category>): Promise<Category | null> => {
    if (isMongoConnected) {
      const doc = await CategoryModel.findByIdAndUpdate(id, payload, { new: true }).lean();
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        name: doc.name,
        type: doc.type,
        icon: doc.icon,
        color: doc.color,
        isDefault: doc.isDefault,
        isActive: doc.isActive,
        createdAt: doc.createdAt.toISOString(),
      };
    }
    const data = readLocalDb();
    const index = data.categories.findIndex(c => c.id === id);
    if (index === -1) return null;
    data.categories[index] = {
      ...data.categories[index],
      ...payload,
    };
    writeLocalDb(data);
    return data.categories[index];
  },

  deleteCategory: async (id: string): Promise<boolean> => {
    if (isMongoConnected) {
      const res = await CategoryModel.findByIdAndDelete(id);
      return !!res;
    }
    const data = readLocalDb();
    const prevLen = data.categories.length;
    data.categories = data.categories.filter(c => c.id !== id);
    if (data.categories.length !== prevLen) {
      writeLocalDb(data);
      return true;
    }
    return false;
  },

  // Settings
  getSettings: async (): Promise<UserSettings> => {
    if (isMongoConnected) {
      let doc = await SettingsModel.findOne().lean();
      if (!doc) {
        doc = await SettingsModel.create({
          currency: 'BDT',
          currencySymbol: '৳',
          openingBalance: 0,
          survivalWindowDays: 30,
          warningThresholdDays: 15,
          theme: 'light',
          dateFormat: 'yyyy-MM-dd',
        });
      }
      return {
        id: doc._id.toString(),
        currency: doc.currency,
        currencySymbol: doc.currencySymbol,
        openingBalance: doc.openingBalance,
        survivalWindowDays: doc.survivalWindowDays,
        warningThresholdDays: doc.warningThresholdDays,
        theme: doc.theme as any,
        dateFormat: doc.dateFormat,
        updatedAt: doc.updatedAt.toISOString(),
      };
    }
    const data = readLocalDb();
    return data.settings;
  },

  updateSettings: async (payload: Partial<UserSettings>): Promise<UserSettings> => {
    const nowIso = new Date().toISOString();
    if (isMongoConnected) {
      const doc = await SettingsModel.findOneAndUpdate(
        {},
        { ...payload, updatedAt: new Date() },
        { upsert: true, new: true }
      ).lean();
      return {
        id: doc._id.toString(),
        currency: doc.currency,
        currencySymbol: doc.currencySymbol,
        openingBalance: doc.openingBalance,
        survivalWindowDays: doc.survivalWindowDays,
        warningThresholdDays: doc.warningThresholdDays,
        theme: doc.theme as any,
        dateFormat: doc.dateFormat,
        updatedAt: doc.updatedAt.toISOString(),
      };
    }
    const data = readLocalDb();
    data.settings = {
      ...data.settings,
      ...payload,
      updatedAt: nowIso,
    };
    writeLocalDb(data);
    return data.settings;
  },

  // Reset / Clear
  clearAllData: async (): Promise<void> => {
    if (isMongoConnected) {
      await ExpenseModel.deleteMany({});
      await IncomeModel.deleteMany({});
      await BorrowingModel.deleteMany({});
      await TuitionModel.deleteMany({});
    }
    const data = readLocalDb();
    data.expenses = [];
    data.income = [];
    data.borrowings = [];
    data.tuitions = [];
    writeLocalDb(data);
  },

  resetDatabase: async (): Promise<void> => {
    const fresh = generateInitialSeedData();
    if (isMongoConnected) {
      await ExpenseModel.deleteMany({});
      await IncomeModel.deleteMany({});
      await CategoryModel.deleteMany({});
      await SettingsModel.deleteMany({});

      await ExpenseModel.insertMany(fresh.expenses);
      await IncomeModel.insertMany(fresh.income);
      await CategoryModel.insertMany(fresh.categories);
      await SettingsModel.create(fresh.settings);
      return;
    }
    writeLocalDb(fresh);
  },
};
