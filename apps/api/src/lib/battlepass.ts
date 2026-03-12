import type { PrismaClient } from '@prisma/client';

const XP_PER_TIER = 100;

/**
 * Gets or creates the current battle pass season for a user.
 * If the user has no pass record for the current season, one is created (free).
 */
export async function getOrCreateUserPass(
  prisma: PrismaClient,
  userId: string,
  seasonId: number,
) {
  return prisma.userBattlePass.upsert({
    where: { userId_seasonId: { userId, seasonId } },
    create: { userId, seasonId },
    update: {},
  });
}

/**
 * Awards XP to a user for the current season and advances their tier if applicable.
 */
export async function awardXp(
  prisma: PrismaClient,
  userId: string,
  seasonId: number,
  xp: number,
): Promise<void> {
  const pass = await getOrCreateUserPass(prisma, userId, seasonId);
  const newXp = pass.currentXp + xp;
  const newTier = Math.min(Math.floor(newXp / XP_PER_TIER), 15);

  await prisma.userBattlePass.update({
    where: { userId_seasonId: { userId, seasonId } },
    data: { currentXp: newXp, currentTier: newTier },
  });
}

/**
 * Returns the active season (latest one whose endDate >= now).
 */
export async function getActiveSeason(prisma: PrismaClient) {
  return prisma.battlePassSeason.findFirst({
    where: { endDate: { gte: new Date() } },
    orderBy: { startDate: 'asc' },
    include: { rewards: { orderBy: { tier: 'asc' } } },
  });
}
