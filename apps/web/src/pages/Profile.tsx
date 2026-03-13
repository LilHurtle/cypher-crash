import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyProfile } from '../lib/api';
import type { UserProfile } from '@cypher-crash/shared';

function formatTime(ms: number | null): string {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export function Profile() {
  const { user, signInWithGoogle, signOut, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!user) return;
    getMyProfile()
      .then(setProfile)
      .catch((e) => setLoadError(e.message));
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-6 pt-16 text-center px-4">
        <h2 className="text-2xl font-bold">Your Profile</h2>
        <p className="text-gray-400 max-w-xs">Sign in to see your stats.</p>
        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-colors tap-target"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  const stats = profile?.stats;

  return (
    <div className="pt-4 space-y-6">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 py-4">
        {user.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt="avatar"
            className="w-20 h-20 rounded-full border-4 border-yellow-500"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-3xl font-bold">
            {user.email?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="text-center">
          <h1 className="text-xl font-bold">
            {user.user_metadata?.full_name ?? profile?.displayName ?? 'Player'}
          </h1>
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>
        <button
          onClick={signOut}
          className="text-sm text-gray-500 hover:text-red-400 transition-colors"
        >
          Sign out
        </button>
      </div>

      {loadError && (
        <p className="text-red-400 text-center text-sm">{loadError}</p>
      )}

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Played', value: stats.totalPlayed },
            { label: 'Solved', value: stats.totalSolved },
            { label: 'Streak', value: `${stats.currentStreak} 🔥` },
            { label: 'Avg Score', value: stats.averageScore },
            { label: 'Avg Time', value: formatTime(stats.averageSolveTimeMs) },
            {
              label: 'Win Rate',
              value: stats.totalPlayed
                ? `${Math.round((stats.totalSolved / stats.totalPlayed) * 100)}%`
                : '—',
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center"
            >
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Guess distribution */}
      {stats && Object.keys(stats.guessDistribution).length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-2">
          <h2 className="font-semibold text-sm text-gray-300">Guess Distribution</h2>
          {Array.from({ length: 6 }, (_, i) => {
            const count = stats.guessDistribution[String(i + 1)] ?? 0;
            const max = Math.max(...Object.values(stats.guessDistribution), 1);
            const pct = Math.round((count / max) * 100);
            return (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-3 text-gray-400 text-right">{i + 1}</span>
                <div className="flex-1 bg-gray-800 rounded-sm h-5 overflow-hidden">
                  <div
                    className="h-full bg-correct rounded-sm flex items-center justify-end pr-1.5"
                    style={{ width: `${pct}%`, minWidth: count ? '1.5rem' : 0 }}
                  >
                    {count > 0 && <span className="text-[10px] font-bold text-white">{count}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Battle Pass link */}
      <Link
        to="/battlepass"
        className="block w-full py-3 bg-gray-900 border border-gray-800 rounded-xl text-center text-sm font-semibold text-white hover:border-yellow-500 transition-colors tap-target"
      >
        ⚔️ View Battle Pass
      </Link>
    </div>
  );
}
