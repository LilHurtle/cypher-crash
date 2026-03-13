import type { FastifyInstance, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authenticate, type SupabaseJwtPayload } from '../lib/auth';
import { isoWeekStart } from '../lib/scoring';

export async function leaderboardRoutes(app: FastifyInstance, prisma: PrismaClient) {

  // ── GET /api/leaderboards/daily?date=YYYY-MM-DD&limit=50 ─────────────────
  app.get('/api/leaderboards/daily', async (req, reply) => {
    const { date, limit } = req.query as { date?: string; limit?: string };
    const targetDate = date ?? new Date().toISOString().slice(0, 10);
    const take = Math.min(parseInt(limit ?? '50', 10), 100);

    const rows = await prisma.dailyAttempt.findMany({
      where: { date: targetDate },
      orderBy: [
        { score: 'desc' },
        { solveTimeMs: 'asc' },
        { finishedAt: 'asc' },
      ],
      take,
      include: { user: true },
    });

    const total = await prisma.dailyAttempt.count({ where: { date: targetDate } });

    return reply.send({
      entries: rows.map((r, i) => ({
        rank: i + 1,
        userId: r.userId,
        displayName: r.user.displayName ?? r.user.email,
        avatarUrl: r.user.avatarUrl,
        score: r.score,
        solveTimeMs: r.solveTimeMs,
        guessesUsed: r.guessCount,
      })),
      total,
    });
  });

  // ── GET /api/leaderboards/weekly?weekStart=YYYY-MM-DD&limit=50 ────────────
  app.get('/api/leaderboards/weekly', async (req, reply) => {
    const { weekStart, limit } = req.query as { weekStart?: string; limit?: string };
    const ws = weekStart ?? isoWeekStart(new Date().toISOString().slice(0, 10));
    const we = new Date(ws + 'T00:00:00Z');
    we.setUTCDate(we.getUTCDate() + 7);
    const weekEnd = we.toISOString().slice(0, 10);
    const take = Math.min(parseInt(limit ?? '50', 10), 100);

    // Aggregate total score per user for the week
    const raw = await prisma.dailyAttempt.groupBy({
      by: ['userId'],
      where: { date: { gte: ws, lt: weekEnd } },
      _sum: { score: true },
      _min: { solveTimeMs: true },
      orderBy: [
        { _sum: { score: 'desc' } },
        { _min: { solveTimeMs: 'asc' } },
      ],
      take,
    });

    const userIds = raw.map((r) => r.userId);
    const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
    const total = await prisma.dailyAttempt
      .groupBy({ by: ['userId'], where: { date: { gte: ws, lt: weekEnd } } })
      .then((r) => r.length);

    return reply.send({
      entries: raw.map((r, i) => ({
        rank: i + 1,
        userId: r.userId,
        displayName: userMap[r.userId]?.displayName ?? userMap[r.userId]?.email ?? r.userId,
        avatarUrl: userMap[r.userId]?.avatarUrl ?? null,
        score: r._sum.score ?? 0,
        solveTimeMs: r._min.solveTimeMs ?? null,
        guessesUsed: null,
      })),
      total,
    });
  });
}
