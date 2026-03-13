/**
 * Computes the score for a solved puzzle.
 * guess 1 → 100, 2 → 90, 3 → 75, 4 → 60, 5 → 45, 6 → 30, failed → 0
 */
export function computeScore(guessCount: number, solved: boolean): number {
  if (!solved) return 0;
  const table: Record<number, number> = { 1: 100, 2: 90, 3: 75, 4: 60, 5: 45, 6: 30 };
  return table[guessCount] ?? 0;
}

/**
 * XP earned for completing a daily puzzle.
 * Base: 50 XP for attempting, +bonus based on solve performance.
 */
export function computeXp(guessCount: number, solved: boolean, streakDays: number): number {
  let xp = 50; // participation XP
  if (solved) {
    // Bonus: fewer guesses = more XP (guess 1 = 60, guess 6 = 10)
    xp += Math.max(10, (7 - guessCount) * 10);
    // Streak bonus (up to +50)
    xp += Math.min(50, streakDays * 5);
  }
  return xp;
}

/**
 * Returns the ISO week start date (Monday 00:00 UTC) for a given date string.
 */
export function isoWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay(); // 0=Sun … 6=Sat
  const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}
