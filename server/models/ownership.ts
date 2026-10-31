import { cookies } from 'next/headers';
import crypto from 'crypto';
import { UserModel } from './User';

const SESSION_COOKIE = 'financeflow_session';

async function getOwnerId() {
  let token: string | undefined;
  try {
    token = (await cookies()).get(SESSION_COOKIE)?.value;
  } catch {
    return null;
  }
  if (!token) return null;
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await UserModel.findOne({ sessionTokenHash: hash }).select('_id').lean();
  return user?._id;
}

export function addOwnership(schema: any) {
  schema.add({ ownerId: { type: String, index: true } });
  schema.pre(/^find/, async function () {
    const ownerId = await getOwnerId();
    this.where(ownerId ? { ownerId: ownerId.toString() } : { _id: null });
  });
  schema.pre(/^count/, async function () {
    const ownerId = await getOwnerId();
    this.where(ownerId ? { ownerId: ownerId.toString() } : { _id: null });
  });
  schema.pre('findOneAndUpdate', async function () {
    const ownerId = await getOwnerId();
    this.setQuery({ ...this.getQuery(), ownerId: ownerId?.toString() || null });
  });
  schema.pre('findOneAndDelete', async function () {
    const ownerId = await getOwnerId();
    this.setQuery({ ...this.getQuery(), ownerId: ownerId?.toString() || null });
  });
  schema.pre('deleteMany', async function () {
    const ownerId = await getOwnerId();
    this.setQuery(ownerId ? { ...this.getQuery(), ownerId: ownerId.toString() } : { _id: null });
  });
  schema.pre('save', async function () {
    if (!this.ownerId) {
      const ownerId = await getOwnerId();
      if (ownerId) this.ownerId = ownerId.toString();
    }
  });
}
