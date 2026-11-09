export interface MemoryRank {
  tier: number;
  title: string;
  minKP: number;
  maxKP: number;
  badge: string;
  description: string;
  colorClass: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  iconName: string;
}

export const MEMORY_RANKS: MemoryRank[] = [
  {
    tier: 1,
    title: 'Memory Novice',
    minKP: 0,
    maxKP: 4,
    badge: '🌱',
    description: 'Taking first steps in working memory conditioning.',
    colorClass: 'text-slate-500 dark:text-slate-400',
    bgGradient: 'from-slate-500/10 via-slate-500/5 to-transparent',
    borderColor: 'border-slate-300 dark:border-slate-700',
    textColor: 'text-slate-700 dark:text-slate-300',
    iconName: 'Sprout',
  },
  {
    tier: 2,
    title: 'Apprentice Recallist',
    minKP: 5,
    maxKP: 9,
    badge: '⚡',
    description: 'Establishing cognitive pathways and pattern grouping.',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgGradient: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    borderColor: 'border-emerald-300 dark:border-emerald-800',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    iconName: 'Zap',
  },
  {
    tier: 3,
    title: 'Cognitive Adept',
    minKP: 10,
    maxKP: 14,
    badge: '🌿',
    description: 'Demonstrating rapid visual encoding and spatial memory.',
    colorClass: 'text-teal-600 dark:text-teal-400',
    bgGradient: 'from-teal-500/15 via-teal-500/5 to-transparent',
    borderColor: 'border-teal-300 dark:border-teal-800',
    textColor: 'text-teal-700 dark:text-teal-300',
    iconName: 'Brain',
  },
  {
    tier: 4,
    title: 'Memory Specialist',
    minKP: 15,
    maxKP: 19,
    badge: '💎',
    description: 'Tackling complex matrix grids with minimal interference.',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgGradient: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    borderColor: 'border-emerald-300 dark:border-emerald-800',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    iconName: 'Sparkles',
  },
  {
    tier: 5,
    title: 'Synaptic Master',
    minKP: 20,
    maxKP: 24,
    badge: '⭐',
    description: 'High-speed retrieval across large multi-card layouts.',
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgGradient: 'from-purple-500/15 via-purple-500/5 to-transparent',
    borderColor: 'border-purple-300 dark:border-purple-800',
    textColor: 'text-purple-700 dark:text-purple-300',
    iconName: 'Star',
  },
  {
    tier: 6,
    title: 'Memory Champion',
    minKP: 25,
    maxKP: 29,
    badge: '🏆',
    description: 'Elite cognitive endurance, near-zero error frequency.',
    colorClass: 'text-amber-500 dark:text-amber-400',
    bgGradient: 'from-amber-500/15 via-amber-500/5 to-transparent',
    borderColor: 'border-amber-300 dark:border-amber-700',
    textColor: 'text-amber-700 dark:text-amber-300',
    iconName: 'Trophy',
  },
  {
    tier: 7,
    title: 'Grandmaster',
    minKP: 30,
    maxKP: 30,
    badge: '👑',
    description: 'Absolute mastery of all 30 cognitive memory levels!',
    colorClass: 'text-amber-400 dark:text-yellow-300',
    bgGradient: 'from-amber-500/25 via-yellow-500/10 to-transparent',
    borderColor: 'border-amber-400 dark:border-amber-500',
    textColor: 'text-amber-600 dark:text-yellow-400',
    iconName: 'Crown',
  },
];

export function getRankByKnowledgePoints(kp: number): {
  currentRank: MemoryRank;
  nextRank: MemoryRank | null;
  progressPercent: number;
  pointsToNext: number;
} {
  const clampedKP = Math.max(0, Math.min(30, kp));

  let currentRank = MEMORY_RANKS[0];
  for (let i = MEMORY_RANKS.length - 1; i >= 0; i--) {
    if (clampedKP >= MEMORY_RANKS[i].minKP) {
      currentRank = MEMORY_RANKS[i];
      break;
    }
  }

  const currentIndex = MEMORY_RANKS.findIndex((r) => r.tier === currentRank.tier);
  const nextRank = currentIndex < MEMORY_RANKS.length - 1 ? MEMORY_RANKS[currentIndex + 1] : null;

  let progressPercent = 100;
  let pointsToNext = 0;

  if (nextRank) {
    const range = nextRank.minKP - currentRank.minKP;
    const progress = clampedKP - currentRank.minKP;
    progressPercent = Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
    pointsToNext = nextRank.minKP - clampedKP;
  }

  return {
    currentRank,
    nextRank,
    progressPercent,
    pointsToNext,
  };
}
