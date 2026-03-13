import type {
  DailyMeta,
  StartResponse,
  GuessResponse,
  LeaderboardResponse,
  RankResponse,
  BattlePassStatus,
  UpgradeBattlePassResponse,
  UserProfile,
} from '@cypher-crash/shared';
import { supabase } from './supabase';

const BASE = '/api';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

async function getHeaders(): Promise<HeadersInit> {
  if (DEV_MODE) {
    // Dev mode: send the well-known dev token — accepted by the API when DEV_MODE=true
    return { 'Content-Type': 'application/json', Authorization: 'Bearer dev-local-token' };
  }
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: await getHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: await getHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Daily ─────────────────────────────────────────────────────────────────

export const getDaily = (): Promise<DailyMeta> => get('/daily');

export const startDaily = (): Promise<StartResponse> => post('/daily/start');

export const submitGuess = (guess: string): Promise<GuessResponse> =>
  post('/daily/guess', { guess });

// ── Leaderboards ─────────────────────────────────────────────────────────

export const getDailyLeaderboard = (date: string, limit = 50): Promise<LeaderboardResponse> =>
  get(`/leaderboards/daily?date=${date}&limit=${limit}`);

export const getWeeklyLeaderboard = (weekStart: string, limit = 50): Promise<LeaderboardResponse> =>
  get(`/leaderboards/weekly?weekStart=${weekStart}&limit=${limit}`);

// ── Me ───────────────────────────────────────────────────────────────────

export const getMyDailyRank = (date: string): Promise<RankResponse> =>
  get(`/me/rank/daily?date=${date}`);

export const getMyWeeklyRank = (weekStart: string): Promise<RankResponse> =>
  get(`/me/rank/weekly?weekStart=${weekStart}`);

export const getMyProfile = (): Promise<UserProfile> => get('/me/profile');

// ── Battle Pass ───────────────────────────────────────────────────────────

export const getBattlePass = (): Promise<BattlePassStatus> => get('/battlepass');

export const upgradeBattlePass = (): Promise<UpgradeBattlePassResponse> =>
  post('/battlepass/upgrade');
