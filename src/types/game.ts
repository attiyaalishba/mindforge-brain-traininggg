export type GameMode = 'levels' | 'custom';

export type LevelVariant = 'standard' | 'challenging' | 'perfect';

export type CustomDifficultyLevel = 'relaxed' | 'balanced' | 'strict' | 'master' | 'custom';

export type CardThemeId = 
  | 'variety'
  | 'animals' 
  | 'space' 
  | 'food' 
  | 'vehicles' 
  | 'sports' 
  | 'fantasy' 
  | 'science' 
  | 'nature' 
  | 'music' 
  | 'symbols';

export interface LevelConfig {
  levelNumber: number;
  group: number;
  variant: LevelVariant;
  cardCount: number; // e.g. 6, 8, 12, 16, 20, 24, 30, 36, 42, 48
  pairCount: number;
  allowedMisses: number; // Infinity for standard, specific number for challenging, 0 for perfect
  targetTimeSec: number;
  timeLimitSec?: number; // Card-scaled timer allotment in seconds
  title: string;
  description: string;
  difficulty?: CustomDifficultyLevel;
  memoryDecaySpeedMs?: number; // Mismatch exposure duration in milliseconds (e.g. 350ms to 2000ms)
  decaySpeedName?: string; // Descriptive tag like "Fast (550ms)"
}

export interface CardItem {
  id: string;
  pairId: number;
  symbol: string;
  label: string;
  isFlipped: boolean;
  isMatched: boolean;
  seenCount: number; // tracks if the card has been exposed to detect true misses
}

export interface LevelProgress {
  completions: number;
  bestTime: number; // in seconds
  bestMoves: number;
  leastMisses: number;
  medals: {
    bronze: boolean; // earned at 2 completions
    silver: boolean; // earned at 5 completions
    gold: boolean;   // earned at 10 completions
  };
  stars: number; // 1 to 3 stars
  bestScore?: number; // Highest score achieved on this level
}

export interface PlayerStats {
  unlockedLevel: number;
  knowledgePoints: number; // 1 KP per completed level (max 30)
  levels: Record<number, LevelProgress>;
  totalGamesPlayed: number;
  totalMatchesFound: number;
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  totalScore?: number; // Cumulative score across all completed levels
  highScore?: number; // All-time highest single-level score
  copycatBestScore?: number;
  matrixBestLevel?: number;
  numberSpanBest?: number;
}

export interface KPHistoryPoint {
  date: string;          // ISO date 'YYYY-MM-DD'
  shortDate: string;     // e.g. 'Oct 7'
  displayDate: string;   // e.g. 'Oct 7, 2026'
  knowledgePoints: number; // Cumulative KP on this date (0 - 30)
  pointsGained: number;  // Knowledge points gained on this date
}

export interface ScoreBreakdown {
  baseScore: number;
  streakBonus: number;
  timeBonus: number;
  accuracyBonus: number;
  efficiencyBonus: number;
  starBonus: number;
  tierMultiplier: number;
  subtotal: number;
  totalScore: number;
}

