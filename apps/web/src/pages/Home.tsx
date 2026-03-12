import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyDailyRank } from '../lib/api';
import type { RankResponse } from '@cypher-crash/shared';

export function Home() {
  const { user, signInWithGoogle, loading } = useAuth();
  const [rank, setRank] = useState<RankResponse | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (user) {
      getMyDailyRank(today)
        .then(setRank)
        .catch(() => null);
    }
  }, [user, today]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 pt-8 pb-4 text-center">
      {/* Hero */}
      <div className="space-y-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          ⚔️ <span className="text-yellow-400">Cipher</span> Clash
        </h1>
        <p className="text-gray-400 text-base sm:text-lg max-w-xs mx-auto">
          The daily competitive word game. Race the clock, top the board.
        </p>
      </div>

      {/* Daily status card */}
      <div className="w-full max-w-xs bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
        <div className="text-sm text-gray-500 font-medium">{today}</div>

        {user ? (
          rank?.score !== null && rank?.score !== undefined ? (
            <div className="space-y-2">
              <div className="text-3xl font-bold text-yellow-400">{rank.score}</div>
              <div className="text-sm text-gray-400">points today</div>
              {rank.rank && (
                <div className="text-sm text-gray-300">
                  Rank #{rank.rank} of {rank.total}
                </div>
              )}
              <Link
                to="/leaderboard"
                className="block w-full py-2.5 bg-gray-800 rounded-xl text-sm font-semibold text-white hover:bg-gray-700 transition-colors tap-target"
              >
                View Leaderboard
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-300 text-sm">You haven't played today yet!</p>
              <Link
                to="/play"
                className="block w-full py-3 bg-yellow-500 rounded-xl font-bold text-gray-900 text-base hover:bg-yellow-400 transition-colors tap-target"
              >
                Play Today's Puzzle →
              </Link>
            </div>
          )
        ) : (
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">Sign in to play and compete on the leaderboard.</p>
            <button
              onClick={signInWithGoogle}
              className="w-full py-3 bg-white text-gray-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors tap-target"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        <Link
          to="/leaderboard"
          className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center hover:border-gray-700 transition-colors"
        >
          <div className="text-2xl mb-1">🏆</div>
          <div className="text-sm font-semibold text-white">Leaderboard</div>
        </Link>
        <Link
          to="/battlepass"
          className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center hover:border-gray-700 transition-colors"
        >
          <div className="text-2xl mb-1">⚔️</div>
          <div className="text-sm font-semibold text-white">Battle Pass</div>
        </Link>
      </div>
    </div>
  );
}
