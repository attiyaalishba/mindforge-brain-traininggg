import { LevelConfig, LevelVariant } from '../types/game';

// Exactly matching HelpfulGames Memory cognitive progression:
// 10 card tier sizes: 12, 16, 20, 24, 28, 30, 36, 42, 48, 54 cards
export const HELPFUL_TIER_SIZES = [
  { cards: 12, pairs: 6, maxMisses: 1 },
  { cards: 16, pairs: 8, maxMisses: 2 },
  { cards: 20, pairs: 10, maxMisses: 3 },
  { cards: 24, pairs: 12, maxMisses: 4 },
  { cards: 28, pairs: 14, maxMisses: 5 },
  { cards: 30, pairs: 15, maxMisses: 5 },
  { cards: 36, pairs: 18, maxMisses: 6 },
  { cards: 42, pairs: 21, maxMisses: 7 },
  { cards: 48, pairs: 24, maxMisses: 8 },
  { cards: 54, pairs: 27, maxMisses: 9 },
];

/**
 * Calculates the level timer allotment strictly calibrated to the number of cards.
 * Scales with cognitive search area (O(N log N) spatial pairs):
 * 12 cards -> 45s (3.75s / card)
 * 16 cards -> 60s (3.75s / card)
 * 20 cards -> 75s (3.75s / card)
 * 24 cards -> 95s
 * 28 cards -> 115s
 * 30 cards -> 125s
 * 36 cards -> 155s
 * 42 cards -> 185s
 * 48 cards -> 220s
 * 54 cards -> 255s
 */
export function calculateLevelTimerSec(cardCount: number, variant: LevelVariant = 'standard'): number {
  let baseTimer: number;
  switch (cardCount) {
    case 6:
      baseTimer = 25;
      break;
    case 8:
      baseTimer = 35;
      break;
    case 12:
      baseTimer = 45;
      break;
    case 16:
      baseTimer = 60;
      break;
    case 20:
      baseTimer = 75;
      break;
    case 24:
      baseTimer = 95;
      break;
    case 28:
      baseTimer = 115;
      break;
    case 30:
      baseTimer = 125;
      break;
    case 36:
      baseTimer = 155;
      break;
    case 42:
      baseTimer = 185;
      break;
    case 48:
      baseTimer = 220;
      break;
    case 54:
      baseTimer = 255;
      break;
    case 60:
      baseTimer = 290;
      break;
    case 64:
      baseTimer = 315;
      break;
    default:
      baseTimer = Math.round(cardCount * 4.2);
  }

  // Adjust for tier discipline
  if (variant === 'challenging') {
    return Math.round(baseTimer * 1.08); // Slight extra allowance for deliberate accuracy
  }
  if (variant === 'perfect') {
    return Math.round(baseTimer * 1.15); // Extra time to carefully avoid any miss
  }
  return baseTimer;
}

export const GAME_LEVELS: LevelConfig[] = [];

// Tier 1: Levels 1 - 10: FREE PLAY (Standard - No miss limit)
HELPFUL_TIER_SIZES.forEach((tier, index) => {
  const levelNumber = index + 1;
  const timeLimitSec = calculateLevelTimerSec(tier.cards, 'standard');
  const targetTimeSec = Math.round(timeLimitSec * 0.7); // 3-star benchmark

  GAME_LEVELS.push({
    levelNumber,
    group: 1, // Standard Tier
    variant: 'standard',
    cardCount: tier.cards,
    pairCount: tier.pairs,
    allowedMisses: Infinity,
    timeLimitSec,
    targetTimeSec,
    title: `${tier.cards} CARDS - FREE PLAY`,
    description: `Match all ${tier.pairs} pairs with a ${timeLimitSec}s level timer calibrated for ${tier.cards} cards.`,
  });
});

// Tier 2: Levels 11 - 20: CHALLENGING (Strict Miss Limit)
HELPFUL_TIER_SIZES.forEach((tier, index) => {
  const levelNumber = index + 11;
  const timeLimitSec = calculateLevelTimerSec(tier.cards, 'challenging');
  const targetTimeSec = Math.round(timeLimitSec * 0.75);

  GAME_LEVELS.push({
    levelNumber,
    group: 2, // Challenging Tier
    variant: 'challenging',
    cardCount: tier.cards,
    pairCount: tier.pairs,
    allowedMisses: tier.maxMisses,
    timeLimitSec,
    targetTimeSec,
    title: `${tier.cards} CARDS - MAX ${tier.maxMisses} ${tier.maxMisses === 1 ? 'MISS' : 'MISSES'}`,
    description: `Discipline challenge: Beat the ${timeLimitSec}s timer with at most ${tier.maxMisses} ${tier.maxMisses === 1 ? 'miss' : 'misses'} across ${tier.cards} cards!`,
  });
});

// Tier 3: Levels 21 - 30: PERFECT (Zero Misses Allowed)
HELPFUL_TIER_SIZES.forEach((tier, index) => {
  const levelNumber = index + 21;
  const timeLimitSec = calculateLevelTimerSec(tier.cards, 'perfect');
  const targetTimeSec = Math.round(timeLimitSec * 0.8);

  GAME_LEVELS.push({
    levelNumber,
    group: 3, // Perfect Tier
    variant: 'perfect',
    cardCount: tier.cards,
    pairCount: tier.pairs,
    allowedMisses: 0,
    timeLimitSec,
    targetTimeSec,
    title: `${tier.cards} CARDS - ZERO MISSES`,
    description: `Ultimate precision: ${timeLimitSec}s timer and ZERO misses allowed across ${tier.cards} cards.`,
  });
});

export function getLevelConfig(levelNumber: number): LevelConfig {
  const found = GAME_LEVELS.find((l) => l.levelNumber === levelNumber);
  return found || GAME_LEVELS[0];
}
