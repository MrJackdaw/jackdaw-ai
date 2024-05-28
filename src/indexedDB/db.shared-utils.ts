import Dexie from "dexie";
import { DateTime } from "luxon";

export type PutInCacheOpts<T> = {
  key: string;
  value: T;
  maxAgeSeconds?: number;
  db: Dexie.Table;
};

export async function cacheValue<T>(opts: PutInCacheOpts<T>): Promise<void> {
  const { key, value, maxAgeSeconds, db } = opts;
  const expires = maxAgeSeconds
    ? DateTime.now().toSeconds() + maxAgeSeconds
    : undefined;

  return void db.put({ key, value, expires });
}

export async function deleteCachedValue(key: string, db: Dexie.Table) {
  return db.delete(key);
}

export async function getCachedValue<X>(
  key: string,
  db: Dexie.Table<X, string, X>
) {
  const value = await db.get(key);
  return value ?? null;
}
