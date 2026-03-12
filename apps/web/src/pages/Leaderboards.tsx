import { useEffect, useState } from 'react';
import type { LeaderboardResponse } from '@cypher-crash/shared';
import { getDailyLeaderboard, getWeeklyLeaderboard } from '../lib/api';
import { isoWeekStart } from '@cypher-crash/shared';

type Tab = 'daily' | 'weekly';

function formatTime(ms: number | null): string {
  if (ms === null) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export function Leaderboards() {
  const [tab, setTab] = useState<Tab>('daily');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const weekStart = isoWeekStart(today);

  useEffect(() => {
    setLoading(true);
    setError('');
    const fn =
      tab === 'daily'
        ? getDailyLeaderboard(today)
        : getWeeklyLeaderboard(weekStart);

    fn.then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tab, today, weekStart]);

  return (
    <div className="pt-4 space-y-4">
      <h1 className="text-2xl font-bold text-center">🏆 Leaderboard</h1>

      {/* Tab bar */}
      <div className="flex bg-gray-900 rounded-xl p-1 gap-1">
        {(['daily', 'weekly'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors tap-target ${
              tab === t
                ? 'bg-yellow-500 text-gray-900'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'daily' ? '📅 Daily' : '📆 Weekly'}
          </button>
        ))}
      </div>

      {/* Date label */}
      <div className="text-center text-xs text-gray-500">
        {tab === 'daily' ? today : `Week of ${weekStart}`}
      </div>

      {/* List */}
      {loading && (
        <div className="flex justify-center pt-8">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && <p className="text-red-400 text-center text-sm">{error}</p>}
      {!loading && data && (
        <div className="space-y-2">
          {data.entries.length === 0 && (
            <p className="text-gray-500 text-center py-8">No entries yet.</p>
          )}
          {data.entries.map((entry) => (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900 border ${
                entry.rank === 1
                  ? 'border-yellow-500'
                  : entry.rank === 2
                  ? 'border-gray-400'
                  : entry.rank === 3
                  ? 'border-amber-700'
                  : 'border-gray-800'
              }`}
            >
              {/* Rank */}
              <div className="w-8 text-center font-bold text-lg">
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
              </div>

              {/* Avatar */}
              {entry.avatarUrl ? (
                <img
                  src={entry.avatarUrl}
                  alt={entry.displayName}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {entry.displayName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-white truncate">
                  {entry.displayName}
                </div>
                {entry.guessesUsed && (
                  <div className="text-xs text-gray-500">{entry.guessesUsed} guesses</div>
                )}
              </div>

              {/* Score + time */}
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-yellow-400">{entry.score}</div>
                <div className="text-xs text-gray-500">{formatTime(entry.solveTimeMs)}</div>
              </div>
            </div>
          ))}
          {data.total > data.entries.length && (
            <p className="text-center text-xs text-gray-600 py-2">
              Showing top {data.entries.length} of {data.total}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
