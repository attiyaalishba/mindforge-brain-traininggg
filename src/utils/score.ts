import { LevelVariant, ScoreBreakdown } from '../types/game';

export type { ScoreBreakdown };

/**
 * Calculates a rewarding cognitive game score based on match count, speed, precision, and difficulty tier.
 */
export function calculateGameScore(
  pairCount: number,
  variant: LevelVariant = 'standard',
  timeSec: number,
  allocatedTimeSec: number,
  moves: number,
  misses: number,
  stars: number,
  accumulatedStreakBonus: number = 0
): ScoreBreakdown {
  // Base match points: 100 points per pair
  const baseScore = pairCount * 100;

  // Time bonus: 15 points per remaining second
  const remainingSec = Math.max(0, allocatedTimeSec - timeSec);
  const timeBonus = remainingSec * 15;

  // Accuracy bonus: max 500 points, losing 40 points per miss
  const accuracyBonus = Math.max(0, 500 - misses * 40);

  // Efficiency bonus: reward doing it in fewer flips than target flips
  const targetFlips = Math.round(pairCount * 2.4);
  const efficiencyBonus = Math.max(0, (targetFlips - moves) * 20);

  // Star bonus
  const starBonus = stars === 3 ? 300 : stars === 2 ? 150 : 50;

  // Streak bonus accumulated during the game from consecutive matches
  const streakBonus = Math.max(0, accumulatedStreakBonus);

  // Tier Multiplier
  const tierMultiplier = variant === 'perfect' ? 1.5 : variant === 'challenging' ? 1.25 : 1.0;

  const subtotal = baseScore + timeBonus + accuracyBonus + efficiencyBonus + starBonus + streakBonus;
  const totalScore = Math.round(subtotal * tierMultiplier);

  return {
    baseScore,
    streakBonus,
    timeBonus,
    accuracyBonus,
    efficiencyBonus,
    starBonus,
    tierMultiplier,
    subtotal,
    totalScore,
  };
}

/**
 * Formats score with comma separators (e.g. 8,450).
 */
export function formatScore(score?: number | null): string {
  if (score === undefined || score === null || isNaN(score)) return '0';
  return Math.max(0, Math.round(score)).toLocaleString();
}
