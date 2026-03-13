// ─── Tile / Guess Types ────────────────────────────────────────────────────

export type TileStatus = 'correct' | 'present' | 'absent' | 'empty' | 'tbd';

export interface LetterResult {
  letter: string;
  status: TileStatus;
}

export type GuessResult = LetterResult[];

// ─── Daily Puzzle Types ────────────────────────────────────────────────────

export interface DailyMeta {
  date: string;          // YYYY-MM-DD
  wordLength: number;    // 5 | 6 | 7
  maxGuesses: number;    // always 6
  guessesUsed: number;
  guesses: string[];
  results: GuessResult[];
  solved: boolean;
  finished: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  solveTimeMs: number | null;
  score: number | null;
}

export interface StartResponse {
  startedAt: string;
}

export interface GuessResponse {
  result: GuessResult;
  solved: boolean;
  finished: boolean;
  word?: string;          // revealed only when game ends
  score?: number;
  solveTimeMs?: number;
}

// ─── Leaderboard Types ─────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
  solveTimeMs: number | null;
  guessesUsed: number | null;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
}

export interface RankResponse {
  rank: number | null;
  score: number | null;
  solveTimeMs: number | null;
  total: number;
}

// ─── Battle Pass Types ──────────────────────────────────────────────────────

export type RewardType = 'badge' | 'theme' | 'title' | 'effect' | 'border' | 'banner' | 'xp_boost';

export interface BattlePassReward {
  id: number;
  tier: number;
  isPremium: boolean;
  rewardType: RewardType;
  rewardKey: string;
  rewardName: string;
  rewardData?: Record<string, unknown>;
  xpRequired: number;
}

export interface BattlePassSeason {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  maxTiers: number;
  rewards: BattlePassReward[];
}

export interface UserBattlePass {
  seasonId: number;
  isPremium: boolean;
  currentXp: number;
  currentTier: number;
  purchasedAt: string | null;
}

export interface BattlePassStatus {
  season: BattlePassSeason;
  userPass: UserBattlePass | null;
  xpPerTier: number;
}

export interface UpgradeBattlePassResponse {
  checkoutUrl: string;
}

// ─── Auth / User Types ──────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  stats: {
    totalPlayed: number;
    totalSolved: number;
    currentStreak: number;
    maxStreak: number;
    averageScore: number;
    averageSolveTimeMs: number | null;
    guessDistribution: Record<string, number>;
  };
}
