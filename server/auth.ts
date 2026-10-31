import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import { UserModel } from './models/User';

const SESSION_COOKIE = 'financeflow_session';

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

function requireDatabaseConnection() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database connection unavailable. Check the MongoDB connection settings.');
  }
}

export async function registerUser(email: string, password: string) {
  requireDatabaseConnection();
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await UserModel.findOne({ email: normalizedEmail }).lean();
  if (existing) throw new Error('An account with this email already exists.');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await UserModel.create({ email: normalizedEmail, passwordHash });
  const ownerId = user._id.toString();
  for (const collectionName of ['expenses', 'incomes', 'categories', 'settings', 'borrowings', 'tuitions', 'todos']) {
    await user.db.collection(collectionName).updateMany({ ownerId: { $exists: false } }, { $set: { ownerId } });
  }
  return createSession(ownerId, normalizedEmail);
}

export async function loginUser(email: string, password: string) {
  requireDatabaseConnection();
  const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new Error('Invalid email or password.');
  }
  return createSession(user._id.toString(), user.email);
}

async function createSession(userId: string, email: string) {
  const token = crypto.randomBytes(32).toString('hex');
  await UserModel.findByIdAndUpdate(userId, { sessionTokenHash: hashToken(token) });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return { id: userId, email };
}

export async function getCurrentUser() {
  if (mongoose.connection.readyState !== 1) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = await UserModel.findOne({ sessionTokenHash: hashToken(token) }).select('_id email').lean();
  return user ? { id: user._id.toString(), email: user.email } : null;
}

export async function logoutUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token && mongoose.connection.readyState === 1) {
    await UserModel.updateOne({ sessionTokenHash: hashToken(token) }, { $unset: { sessionTokenHash: 1 } });
  }
  cookieStore.delete(SESSION_COOKIE);
}
