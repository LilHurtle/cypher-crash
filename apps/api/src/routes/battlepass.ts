import type { FastifyInstance, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { authenticate, type SupabaseJwtPayload } from '../lib/auth';
import { getActiveSeason, getOrCreateUserPass } from '../lib/battlepass';

const PRICE_ID = process.env.STRIPE_BATTLE_PASS_PRICE_ID ?? '';
const WEB_URL = process.env.WEB_URL ?? 'http://localhost:5173';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

export async function battlePassRoutes(app: FastifyInstance, prisma: PrismaClient) {

  // ── GET /api/battlepass ───────────────────────────────────────────────────
  app.get('/api/battlepass', { preHandler: [authenticate] }, async (req, reply) => {
    const user = (req as FastifyRequest & { user: SupabaseJwtPayload }).user;

    const season = await getActiveSeason(prisma);
    if (!season) return reply.code(404).send({ error: 'No active battle pass season' });

    const userPass = await getOrCreateUserPass(prisma, user.sub, season.id);

    return reply.send({
      season: {
        id: season.id,
        name: season.name,
        startDate: season.startDate.toISOString(),
        endDate: season.endDate.toISOString(),
        maxTiers: season.maxTiers,
        rewards: season.rewards.map((r) => ({
          id: r.id,
          tier: r.tier,
          isPremium: r.isPremium,
          rewardType: r.rewardType,
          rewardKey: r.rewardKey,
          rewardName: r.rewardName,
          rewardData: r.rewardData,
          xpRequired: r.tier * season.xpPerTier,
        })),
      },
      userPass: {
        seasonId: season.id,
        isPremium: userPass.isPremium,
        currentXp: userPass.currentXp,
        currentTier: userPass.currentTier,
        purchasedAt: userPass.purchasedAt?.toISOString() ?? null,
      },
      xpPerTier: season.xpPerTier,
    });
  });

  // ── POST /api/battlepass/upgrade ──────────────────────────────────────────
  // Creates a Stripe Checkout session for $2.99 premium pass
  app.post('/api/battlepass/upgrade', { preHandler: [authenticate] }, async (req, reply) => {
    const user = (req as FastifyRequest & { user: SupabaseJwtPayload }).user;

    const season = await getActiveSeason(prisma);
    if (!season) return reply.code(404).send({ error: 'No active battle pass season' });

    const pass = await getOrCreateUserPass(prisma, user.sub, season.id);
    if (pass.isPremium) return reply.code(400).send({ error: 'Already a premium pass holder' });

    if (!process.env.STRIPE_SECRET_KEY || !PRICE_ID) {
      // Dev mode: immediately upgrade without payment
      await prisma.userBattlePass.update({
        where: { userId_seasonId: { userId: user.sub, seasonId: season.id } },
        data: { isPremium: true, purchasedAt: new Date() },
      });
      return reply.send({ checkoutUrl: null, upgraded: true });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${WEB_URL}/battlepass?upgraded=1`,
      cancel_url: `${WEB_URL}/battlepass`,
      metadata: { userId: user.sub, seasonId: String(season.id) },
    });

    return reply.send({ checkoutUrl: session.url });
  });

  // ── POST /api/battlepass/webhook ──────────────────────────────────────────
  // Stripe sends payment confirmation here
  app.post(
    '/api/battlepass/webhook',
    { config: { rawBody: true } } as never,
    async (req, reply) => {
      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

      if (!sig || !webhookSecret) {
        return reply.code(400).send({ error: 'Missing Stripe signature' });
      }

      let event: Stripe.Event;
      try {
        const stripe = getStripe();
        event = stripe.webhooks.constructEvent(
          (req as FastifyRequest & { rawBody: Buffer }).rawBody,
          sig,
          webhookSecret,
        );
      } catch {
        return reply.code(400).send({ error: 'Webhook signature invalid' });
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const seasonId = Number(session.metadata?.seasonId);
        if (userId && seasonId) {
          await prisma.userBattlePass.upsert({
            where: { userId_seasonId: { userId, seasonId } },
            create: {
              userId,
              seasonId,
              isPremium: true,
              purchasedAt: new Date(),
              stripePaymentId: session.id,
            },
            update: {
              isPremium: true,
              purchasedAt: new Date(),
              stripePaymentId: session.id,
            },
          });
        }
      }

      return reply.send({ received: true });
    },
  );
}
