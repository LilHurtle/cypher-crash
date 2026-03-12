import type { BattlePassReward, UserBattlePass } from '@cypher-crash/shared';

interface BattlePassTrackProps {
  rewards: BattlePassReward[];
  userPass: UserBattlePass | null;
  maxTiers: number;
  xpPerTier: number;
  trackType: 'free' | 'premium';
}

const rewardIcons: Record<string, string> = {
  badge: '🎖️',
  theme: '🎨',
  title: '📛',
  effect: '✨',
  border: '🔲',
  banner: '🖼️',
  xp_boost: '⚡',
};

export function BattlePassTrack({
  rewards,
  userPass,
  maxTiers,
  xpPerTier,
  trackType,
}: BattlePassTrackProps) {
  const currentTier = userPass?.currentTier ?? 0;
  const isPremium = userPass?.isPremium ?? false;
  const trackRewards = rewards.filter((r) =>
    trackType === 'free' ? !r.isPremium : r.isPremium,
  );

  return (
    <div className="relative">
      {/* Tier track */}
      <div className="flex gap-0 overflow-x-auto pb-2 snap-x snap-mandatory">
        {Array.from({ length: maxTiers }, (_, i) => {
          const tier = i + 1;
          const reward = trackRewards.find((r) => r.tier === tier);
          const unlocked =
            tier <= currentTier && (trackType === 'free' || isPremium);
          const isCurrent = tier === currentTier + 1;

          return (
            <div
              key={tier}
              className="flex-shrink-0 snap-start flex flex-col items-center gap-1 w-16 sm:w-20"
            >
              {/* XP progress connector */}
              <div className="relative flex items-center w-full">
                <div className={`flex-1 h-1 ${tier === 1 ? 'opacity-0' : unlocked ? 'bg-yellow-400' : 'bg-gray-700'}`} />
                {/* Tier node */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    unlocked
                      ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                      : isCurrent
                      ? 'bg-transparent border-yellow-400 text-yellow-400 animate-pulse'
                      : 'bg-gray-800 border-gray-700 text-gray-600'
                  }`}
                >
                  {tier}
                </div>
                <div className={`flex-1 h-1 ${tier === maxTiers ? 'opacity-0' : unlocked ? 'bg-yellow-400' : 'bg-gray-700'}`} />
              </div>

              {/* Reward card */}
              {reward ? (
                <div
                  className={`w-14 sm:w-16 rounded-lg p-1.5 text-center border transition-all ${
                    unlocked
                      ? trackType === 'premium'
                        ? 'bg-purple-900/50 border-purple-500 shadow-sm shadow-purple-500/30'
                        : 'bg-yellow-900/40 border-yellow-500'
                      : 'bg-gray-800/60 border-gray-700 opacity-60'
                  }`}
                >
                  <div className="text-lg">{rewardIcons[reward.rewardType] ?? '🎁'}</div>
                  <div className="text-[9px] sm:text-[10px] text-gray-300 leading-tight mt-0.5 truncate">
                    {reward.rewardName}
                  </div>
                </div>
              ) : (
                <div className="w-14 sm:w-16 h-16 rounded-lg bg-gray-800/30 border border-gray-800" />
              )}

              {/* XP label */}
              <div className="text-[9px] text-gray-600 tabular-nums">
                {tier * xpPerTier} XP
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
