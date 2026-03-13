import type { FastifyInstance, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authenticate, type SupabaseJwtPayload } from '../lib/auth';
import { isoWeekStart } from '../lib/scoring';

export async function meRoutes(app: FastifyInstance, prisma: PrismaClient) {

  // ── GET /api/me/rank/daily?date=YYYY-MM-DD ────────────────────────────────
  app.get('/api/me/rank/daily', { preHandler: [authenticate] }, async (req, reply) => {
    const user = (req as FastifyRequest & { user: SupabaseJwtPayload }).user;
    const { date } = req.query as { date?: string };
    const targetDate = date ?? new Date().toISOString().slice(0, 10);

    const attempt = await prisma.dailyAttempt.findUnique({
      where: { userId_date: { userId: user.sub, date: targetDate } },
    });

    if (!attempt) {
      return reply.send({ rank: null, score: null, solveTimeMs: null, total: 0 });
    }

    // Count how many players scored higher, or same score + faster
    const rank = await prisma.dailyAttempt.count({
      where: {
        date: targetDate,
        OR: [
          { score: { gt: attempt.score } },
          {
            score: attempt.score,
            solveTimeMs: { lt: attempt.solveTimeMs ?? Number.MAX_SAFE_INTEGER },
          },
        ],
      },
    });

    const total = await prisma.dailyAttempt.count({ where: { date: targetDate } });
    return reply.send({ rank: rank + 1, score: attempt.score, solveTimeMs: attempt.solveTimeMs, total });
  });

  // ── GET /api/me/rank/weekly?weekStart=YYYY-MM-DD ──────────────────────────
  app.get('/api/me/rank/weekly', { preHandler: [authenticate] }, async (req, reply) => {
    const user = (req as FastifyRequest & { user: SupabaseJwtPayload }).user;
    const { weekStart } = req.query as { weekStart?: string };
    const ws = weekStart ?? isoWeekStart(new Date().toISOString().slice(0, 10));
    const we = new Date(ws + 'T00:00:00Z');
    we.setUTCDate(we.getUTCDate() + 7);
    const weekEnd = we.toISOString().slice(0, 10);

    const myAgg = await prisma.dailyAttempt.aggregate({
      where: { userId: user.sub, date: { gte: ws, lt: weekEnd } },
      _sum: { score: true },
      _min: { solveTimeMs: true },
    });

    const myScore = myAgg._sum.score ?? 0;
    const myTime = myAgg._min.solveTimeMs;

    if (myScore === 0 && myTime === null) {
      return reply.send({ rank: null, score: null, solveTimeMs: null, total: 0 });
    }

    const allUsers = await prisma.dailyAttempt.groupBy({
      by: ['userId'],
      where: { date: { gte: ws, lt: weekEnd } },
      _sum: { score: true },
      _min: { solveTimeMs: true },
    });

    const total = allUsers.length;
    const rank =
      allUsers.filter((u) => {
        const theirScore = u._sum.score ?? 0;
        const theirTime = u._min.solveTimeMs ?? Number.MAX_SAFE_INTEGER;
        return (
          theirScore > myScore ||
          (theirScore === myScore && theirTime < (myTime ?? Number.MAX_SAFE_INTEGER))
        );
      }).length + 1;

    return reply.send({ rank, score: myScore, solveTimeMs: myTime, total });
  });

  // ── GET /api/me/profile ───────────────────────────────────────────────────
  app.get('/api/me/profile', { preHandler: [authenticate] }, async (req, reply) => {
    const user = (req as FastifyRequest & { user: SupabaseJwtPayload }).user;

    const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
    if (!dbUser) return reply.code(404).send({ error: 'User not found' });

    const attempts = await prisma.dailyAttempt.findMany({ where: { userId: user.sub } });
    const totalPlayed = attempts.length;
    const solved = attempts.filter((a) => a.solved);
    const totalSolved = solved.length;

    const distMap: Record<string, number> = {};
    solved.forEach((a) => {
      const key = String(a.guessCount);
      distMap[key] = (distMap[key] ?? 0) + 1;
    });

    const avgScore = totalPlayed ? attempts.reduce((s, a) => s + a.score, 0) / totalPlayed : 0;
    const times = solved.filter((a) => a.solveTimeMs !== null).map((a) => a.solveTimeMs!);
    const avgTime = times.length ? times.reduce((s, t) => s + t, 0) / times.length : null;

    // Simple streak: count consecutive days from today backwards
    const dates = [...new Set(solved.map((a) => a.date))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    let checkDate = today;
    for (const d of dates) {
      if (d === checkDate) {
        streak++;
        const dt = new Date(checkDate + 'T00:00:00Z');
        dt.setUTCDate(dt.getUTCDate() - 1);
        checkDate = dt.toISOString().slice(0, 10);
      } else break;
    }

    return reply.send({
      id: dbUser.id,
      email: dbUser.email,
      displayName: dbUser.displayName,
      avatarUrl: dbUser.avatarUrl,
      createdAt: dbUser.createdAt.toISOString(),
      stats: {
        totalPlayed,
        totalSolved,
        currentStreak: streak,
        maxStreak: streak, // simplified
        averageScore: Math.round(avgScore),
        averageSolveTimeMs: avgTime ? Math.round(avgTime) : null,
        guessDistribution: distMap,
      },
    });
  });
}
