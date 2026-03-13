import crypto from 'crypto';

const DAILY_SECRET = process.env.DAILY_SECRET ?? 'dev-secret-please-change';

/**
 * Returns the UTC date string (YYYY-MM-DD) for "today".
 */
export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Computes the word length for a given UTC date.
 * length = 5 + (HMAC_SHA256(secret, "length:" + date) % 3) → 5 | 6 | 7
 */
export function getDayLength(date: string): number {
  const mac = crypto.createHmac('sha256', DAILY_SECRET).update(`length:${date}`).digest();
  const num = mac.readUInt32BE(0);
  return 5 + (num % 3);
}

/**
 * Picks a deterministic answer from a pool of same-length words for a date.
 * index = HMAC_SHA256(secret, "word:" + date) % pool.length
 */
export function pickDailyWord(date: string, pool: string[]): string {
  if (pool.length === 0) throw new Error('Word pool is empty');
  const mac = crypto.createHmac('sha256', DAILY_SECRET).update(`word:${date}`).digest();
  const num = mac.readUInt32BE(0);
  return pool[num % pool.length];
}
