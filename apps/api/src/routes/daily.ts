import type { FastifyInstance, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { evaluateGuess, isSolved } from '@cypher-crash/shared';
import { authenticate, type SupabaseJwtPayload } from '../lib/auth';
import { todayUTC, getDayLength, pickDailyWord } from '../lib/wordOfDay';
import { computeScore, computeXp } from '../lib/scoring';
import { awardXp, getActiveSeason, getOrCreateUserPass } from '../lib/battlepass';

const MAX_GUESSES = 6;

export async function dailyRoutes(app: FastifyInstance, prisma: PrismaClient) {
  // ── Ensure user row exists ────────────────────────────────────────────────
  async function ensureUser(payload: SupabaseJwtPayload) {
    await prisma.user.upsert({
      where: { id: payload.sub },
      create: {
        id: payload.sub,
        email: payload.email,
        displayName:
          payload.user_metadata?.full_name ??
          payload.user_metadata?.name ??
          payload.email.split('@')[0],
        avatarUrl: payload.user_metadata?.avatar_url ?? null,
      },
      update: {},
    });
  }

  // ── Resolve or create today's DailyWord ──────────────────────────────────
  async function resolveDailyWord(date: string) {
    const existing = await prisma.dailyWord.findUnique({ where: { date } });
    if (existing) return existing;

    const length = getDayLength(date);
    const pool = await prisma.wordList.findMany({
      where: { length, isAnswer: true },
      select: { word: true },
    });
    if (pool.length === 0) throw new Error(`No answer words of length ${length} for ${date}`);
    const word = pickDailyWord(date, pool.map((w) => w.word));

    return prisma.dailyWord.create({ data: { date, word, length } });
  }

  // ── GET /api/daily ────────────────────────────────────────────────────────
  app.get('/api/daily', { preHandler: [authenticate] }, async (req, reply) => {
    const user = (req as FastifyRequest & { user: SupabaseJwtPayload }).user;
    await ensureUser(user);

    const date = todayUTC();
    const dailyWord = await resolveDailyWord(date);

    const attempt = await prisma.dailyAttempt.findUnique({
      where: { userId_date: { userId: user.sub, date } },
    });

    return reply.send({
      date,
      wordLength: dailyWord.length,
      maxGuesses: MAX_GUESSES,
      guessesUsed: attempt?.guessCount ?? 0,
      guesses: attempt?.guesses ?? [],
      results: [], // re-computed on client from stored guesses
      solved: attempt?.solved ?? false,
      finished: attempt
        ? attempt.solved || attempt.guessCount >= MAX_GUESSES
        : false,
      startedAt: attempt?.startedAt?.toISOString() ?? null,
      finishedAt: attempt?.finishedAt?.toISOString() ?? null,
      solveTimeMs: attempt?.solveTimeMs ?? null,
      score: attempt?.score ?? null,
    });
  });

  // ── POST /api/daily/start ─────────────────────────────────────────────────
  app.post('/api/daily/start', { preHandler: [authenticate] }, async (req, reply) => {
    const user = (req as FastifyRequest & { user: SupabaseJwtPayload }).user;
    await ensureUser(user);

    const date = todayUTC();
    const dailyWord = await resolveDailyWord(date);

    const attempt = await prisma.dailyAttempt.upsert({
      where: { userId_date: { userId: user.sub, date } },
      create: {
        userId: user.sub,
        date,
        wordId: dailyWord.id,
        guesses: [],
        startedAt: new Date(),
      },
      update: {}, // idempotent — don't overwrite existing startedAt
    });

    return reply.send({ startedAt: attempt.startedAt?.toISOString() });
  });

  // ── POST /api/daily/guess ─────────────────────────────────────────────────
  app.post(
    '/api/daily/guess',
    { preHandler: [authenticate] },
    async (req, reply) => {
      const user = (req as FastifyRequest & { user: SupabaseJwtPayload }).user;
      const { guess } = req.body as { guess: string };

      if (!guess || typeof guess !== 'string') {
        return reply.code(400).send({ error: 'guess is required' });
      }

      const date = todayUTC();
      const dailyWord = await resolveDailyWord(date);
      const target = dailyWord.word.toUpperCase();
      const normalised = guess.toUpperCase().trim();

      if (normalised.length !== target.length) {
        return reply.code(400).send({
          error: `Guess must be ${target.length} letters`,
        });
      }

      // Validate word exists in dictionary
      const validWord = await prisma.wordList.findFirst({
        where: { word: { equals: normalised, mode: 'insensitive' } },
      });
      if (!validWord) {
        return reply.code(400).send({ error: 'Not in word list' });
      }

      const attempt = await prisma.dailyAttempt.findUnique({
        where: { userId_date: { userId: user.sub, date } },
      });

      if (!attempt || !attempt.startedAt) {
        return reply.code(400).send({ error: 'Game not started — call /api/daily/start first' });
      }

      if (attempt.solved || attempt.guessCount >= MAX_GUESSES) {
        return reply.code(400).send({ error: 'Game already finished' });
      }

      const result = evaluateGuess(normalised, target);
      const solved = isSolved(result);
      const newGuessCount = attempt.guessCount + 1;
      const finished = solved || newGuessCount >= MAX_GUESSES;

      const finishedAt = finished ? new Date() : null;
      const solveTimeMs = finished
        ? finishedAt!.getTime() - attempt.startedAt.getTime()
        : null;
      const score = finished ? computeScore(newGuessCount, solved) : 0;

      await prisma.dailyAttempt.update({
        where: { id: attempt.id },
        data: {
          guesses: [...attempt.guesses, normalised],
          guessCount: newGuessCount,
          solved,
          finishedAt,
          solveTimeMs,
          score,
        },
      });

      // Award XP on completion
      if (finished) {
        await ensureUser(user);
        const season = await getActiveSeason(prisma);
        if (season) {
          await getOrCreateUserPass(prisma, user.sub, season.id);
          const streakDays = 1; // simplified — could compute from consecutive dates
          const xp = computeXp(newGuessCount, solved, streakDays);
          await awardXp(prisma, user.sub, season.id, xp);
        }
      }

      return reply.send({
        result,
        solved,
        finished,
        ...(finished && { word: target, score, solveTimeMs }),
      });
    },
  );
}
