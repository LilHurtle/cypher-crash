import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BattlePassStatus } from '@cypher-crash/shared';
import { useAuth } from '../context/AuthContext';
import { getBattlePass, upgradeBattlePass } from '../lib/api';
import { BattlePassTrack } from '../components/BattlePassTrack';

export function BattlePass() {
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<BattlePassStatus | null>(null);
  const [loadError, setLoadError] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => {
    if (!user) return;
    getBattlePass()
      .then(setStatus)
      .catch((e) => setLoadError(e.message));
  }, [user]);

  // Stripe redirect success
  useEffect(() => {
    if (searchParams.get('upgraded') === '1' && user) {
      showToast('🎉 Premium Battle Pass unlocked!');
      getBattlePass().then(setStatus).catch(() => null);
    }
  }, [searchParams, user]);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const resp = await upgradeBattlePass();
      if (resp.checkoutUrl) {
        window.location.href = resp.checkoutUrl;
      } else {
        // Dev mode: immediate upgrade
        showToast('🎉 Premium pass activated (dev mode)!');
        getBattlePass().then(setStatus).catch(() => null);
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Upgrade failed');
    } finally {
      setUpgrading(false);
    }
  };

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
        <h2 className="text-2xl font-bold">⚔️ Battle Pass</h2>
        <p className="text-gray-400 max-w-xs">Sign in to view and earn your Battle Pass rewards.</p>
        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-colors tap-target"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="pt-8 text-center space-y-4">
        <p className="text-gray-400">No active Battle Pass season right now.</p>
        <p className="text-red-400 text-sm">{loadError}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { season, userPass, xpPerTier } = status;
  const isPremium = userPass?.isPremium ?? false;
  const currentTier = userPass?.currentTier ?? 0;
  const currentXp = userPass?.currentXp ?? 0;
  const nextTierXp = (currentTier + 1) * xpPerTier;
  const xpProgress = Math.min(currentXp % xpPerTier, xpPerTier);
  const xpPct = Math.round((xpProgress / xpPerTier) * 100);

  const endDate = new Date(season.endDate);

  return (
    <div className="pt-4 space-y-6 pb-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white text-gray-900 font-semibold text-sm px-4 py-2 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">⚔️ Battle Pass</h1>
        <p className="text-sm text-gray-400">{season.name}</p>
        <p className="text-xs text-gray-600">
          Ends {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* XP progress bar */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300 font-medium">
            Tier {currentTier} <span className="text-gray-600">/ {season.maxTiers}</span>
          </span>
          <span className="text-yellow-400 font-semibold tabular-nums">
            {currentXp} XP
          </span>
        </div>
        <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-500"
            style={{ width: `${xpPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 text-center">
          {xpProgress} / {xpPerTier} XP to Tier {currentTier + 1}
          {currentTier >= season.maxTiers && ' — Max tier reached! 🏆'}
        </p>
      </div>

      {/* Premium upgrade card */}
      {!isPremium && (
        <div className="relative overflow-hidden rounded-2xl border border-purple-500 bg-gradient-to-br from-purple-950 to-gray-900 p-5 space-y-3">
          {/* Glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-3">
            <div className="text-3xl">💎</div>
            <div>
              <h2 className="font-bold text-white text-base">Premium Battle Pass</h2>
              <p className="text-sm text-gray-300 mt-0.5">
                Unlock exclusive themes, effects, borders, and a Champion title.
              </p>
            </div>
          </div>
          <ul className="space-y-1 text-sm text-gray-300">
            {['Gold & Neon themes', 'Sparkle & Confetti effects', 'Champion border + banner', '"Champion" title', '10 extra premium rewards'].map((perk) => (
              <li key={perk} className="flex items-center gap-2">
                <span className="text-purple-400">✓</span> {perk}
              </li>
            ))}
          </ul>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-bold text-base transition-colors tap-target disabled:opacity-60"
          >
            {upgrading ? 'Redirecting…' : 'Upgrade for $2.99'}
          </button>
          <p className="text-xs text-gray-600 text-center">One-time purchase · No subscription</p>
        </div>
      )}

      {isPremium && (
        <div className="flex items-center gap-2 bg-purple-900/30 border border-purple-700 rounded-xl px-4 py-2.5 text-sm text-purple-300 font-medium">
          💎 Premium Battle Pass active
          {userPass?.purchasedAt && (
            <span className="ml-auto text-xs text-gray-500">
              Since {new Date(userPass.purchasedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Free track */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-gray-300 flex items-center gap-2">
          🎖️ Free Track
        </h3>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 overflow-x-auto">
          <BattlePassTrack
            rewards={season.rewards}
            userPass={userPass}
            maxTiers={season.maxTiers}
            xpPerTier={xpPerTier}
            trackType="free"
          />
        </div>
      </div>

      {/* Premium track */}
      <div className="space-y-2">
        <h3 className={`font-semibold text-sm flex items-center gap-2 ${isPremium ? 'text-purple-400' : 'text-gray-600'}`}>
          💎 Premium Track {!isPremium && <span className="text-xs font-normal text-gray-700">(locked)</span>}
        </h3>
        <div className={`rounded-xl border p-3 overflow-x-auto transition-all ${isPremium ? 'bg-purple-950/30 border-purple-800' : 'bg-gray-900/50 border-gray-800 opacity-60'}`}>
          <BattlePassTrack
            rewards={season.rewards}
            userPass={userPass}
            maxTiers={season.maxTiers}
            xpPerTier={xpPerTier}
            trackType="premium"
          />
        </div>
        {!isPremium && (
          <p className="text-xs text-gray-600 text-center">Upgrade to Premium to earn these rewards</p>
        )}
      </div>

      {/* How to earn XP */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-2">
        <h3 className="font-semibold text-sm text-gray-300">How to earn XP</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>🎮 Play daily puzzle: <span className="text-white">+50 XP</span></li>
          <li>✅ Guess 1: <span className="text-white">+110 XP</span> · Guess 6: <span className="text-white">+60 XP</span></li>
          <li>🔥 Streak bonus: <span className="text-white">+5 XP/day</span> (up to +50)</li>
        </ul>
      </div>
    </div>
  );
}
