import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import { dailyRoutes } from './routes/daily';
import { leaderboardRoutes } from './routes/leaderboards';
import { meRoutes } from './routes/me';
import { battlePassRoutes } from './routes/battlepass';

const prisma = new PrismaClient();

async function buildServer() {
  const app = Fastify({ logger: true, bodyLimit: 1048576 });

  // ── CORS ────────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: process.env.WEB_URL ?? 'http://localhost:5173',
    credentials: true,
  });

  // ── Rate limiting ────────────────────────────────────────────────────────
  await app.register(rateLimit, {
    max: 60,
    timeWindow: '1 minute',
    // Stricter limits for mutation endpoints
    keyGenerator: (req) => req.ip,
  });

  // ── Routes ───────────────────────────────────────────────────────────────
  await dailyRoutes(app, prisma);
  await leaderboardRoutes(app, prisma);
  await meRoutes(app, prisma);
  await battlePassRoutes(app, prisma);

  // ── Health check ─────────────────────────────────────────────────────────
  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}

async function main() {
  const app = await buildServer();
  const port = parseInt(process.env.PORT ?? '3001', 10);
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`🚀  API running on http://localhost:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
