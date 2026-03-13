/**
 * Returns the ISO week start date (Monday 00:00 UTC) for a given YYYY-MM-DD string.
 * Used on both client (Leaderboards.tsx) and server (scoring.ts).
 */
export function isoWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}
