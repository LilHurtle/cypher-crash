/**
 * Seed script: populates WordList and creates the initial Battle Pass season.
 * Run with: pnpm --filter api seed
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedWords() {
  console.log('Seeding word lists…');
  const dataDir = path.join(__dirname, '../data');
  const files: Array<{ file: string; length: number }> = [
    { file: 'words-5.txt', length: 5 },
    { file: 'words-6.txt', length: 6 },
    { file: 'words-7.txt', length: 7 },
  ];

  for (const { file, length } of files) {
    const filePath = path.join(dataDir, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const words = raw
      .split('\n')
      .map((w) => w.trim().toUpperCase())
      .filter((w) => w.length === length);

    let inserted = 0;
    for (const word of words) {
      await prisma.wordList.upsert({
        where: { word },
        create: { word, length, isAnswer: true },
        update: {},
      });
      inserted++;
    }
    console.log(`  ${file}: ${inserted} words inserted`);
  }
}

async function seedBattlePassSeason() {
  console.log('Seeding Battle Pass season…');

  const now = new Date();
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const seasonName = `Season ${startDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })}`;

  // Check if season already exists
  const existing = await prisma.battlePassSeason.findFirst({
    where: { startDate, endDate },
  });
  if (existing) {
    console.log(`  Season already exists (id=${existing.id}). Skipping.`);
    return existing.id;
  }

  const season = await prisma.battlePassSeason.create({
    data: { name: seasonName, startDate, endDate, maxTiers: 15, xpPerTier: 100 },
  });

  // Free track rewards
  const freeRewards = [
    { tier: 1,  rewardType: 'badge',  rewardKey: 'badge_starter',      rewardName: 'Starter Badge',        rewardData: { icon: '🎖️' } },
    { tier: 3,  rewardType: 'theme',  rewardKey: 'theme_midnight',      rewardName: 'Midnight Theme',       rewardData: { bg: '#0f172a', tile: '#1e293b' } },
    { tier: 5,  rewardType: 'title',  rewardKey: 'title_dedicated',     rewardName: '"Dedicated" Title',    rewardData: {} },
    { tier: 8,  rewardType: 'badge',  rewardKey: 'badge_wordsmith',     rewardName: 'Wordsmith Badge',      rewardData: { icon: '📚' } },
    { tier: 10, rewardType: 'theme',  rewardKey: 'theme_forest',        rewardName: 'Forest Theme',         rewardData: { bg: '#14532d', tile: '#166534' } },
    { tier: 13, rewardType: 'title',  rewardKey: 'title_veteran',       rewardName: '"Veteran" Title',      rewardData: {} },
    { tier: 15, rewardType: 'badge',  rewardKey: 'badge_completionist', rewardName: 'Completionist Badge',  rewardData: { icon: '🏅' } },
  ];

  // Paid track rewards (unlocked alongside free, but only for premium holders)
  const premiumRewards = [
    { tier: 1,  rewardType: 'theme',  rewardKey: 'theme_gold',          rewardName: 'Gold Theme',           rewardData: { bg: '#78350f', tile: '#92400e', accent: '#fbbf24' } },
    { tier: 2,  rewardType: 'border', rewardKey: 'border_champion',     rewardName: 'Champion Border',      rewardData: { color: '#fbbf24' } },
    { tier: 4,  rewardType: 'effect', rewardKey: 'effect_sparkle',      rewardName: 'Sparkle Tile Effect',  rewardData: {} },
    { tier: 6,  rewardType: 'theme',  rewardKey: 'theme_neon',          rewardName: 'Neon Theme',           rewardData: { bg: '#1a1a2e', tile: '#16213e', accent: '#00d9ff' } },
    { tier: 7,  rewardType: 'badge',  rewardKey: 'badge_premium',       rewardName: 'Premium Badge',        rewardData: { icon: '💎' } },
    { tier: 9,  rewardType: 'effect', rewardKey: 'effect_confetti',     rewardName: 'Confetti Win Effect',  rewardData: {} },
    { tier: 11, rewardType: 'theme',  rewardKey: 'theme_crimson',       rewardName: 'Crimson Theme',        rewardData: { bg: '#450a0a', tile: '#7f1d1d', accent: '#f87171' } },
    { tier: 12, rewardType: 'banner', rewardKey: 'banner_elite',        rewardName: 'Elite Profile Banner', rewardData: { gradient: 'linear-gradient(135deg,#7c3aed,#db2777)' } },
    { tier: 14, rewardType: 'title',  rewardKey: 'title_champion',      rewardName: '"Champion" Title',     rewardData: {} },
    { tier: 15, rewardType: 'badge',  rewardKey: 'badge_legend',        rewardName: 'Legend Badge',         rewardData: { icon: '👑' } },
  ];

  for (const r of freeRewards) {
    await prisma.battlePassReward.create({
      data: { seasonId: season.id, isPremium: false, ...r },
    });
  }
  for (const r of premiumRewards) {
    await prisma.battlePassReward.create({
      data: { seasonId: season.id, isPremium: true, ...r },
    });
  }

  console.log(`  Season "${seasonName}" created (id=${season.id}) with ${freeRewards.length} free + ${premiumRewards.length} premium rewards`);
  return season.id;
}

async function main() {
  try {
    await seedWords();
    await seedBattlePassSeason();
    console.log('\n✅  Seed complete!');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
