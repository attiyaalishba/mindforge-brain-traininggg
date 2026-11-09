import { PlayerStats, LevelProgress, KPHistoryPoint } from '../types/game';

const STORAGE_KEY = 'mindforge_player_stats_v1';
export const KP_HISTORY_STORAGE_KEY = 'mindforge_kp_history_v1';

const defaultStats: PlayerStats = {
  unlockedLevel: 1,
  knowledgePoints: 0,
  levels: {},
  totalGamesPlayed: 0,
  totalMatchesFound: 0,
  totalScore: 0,
  highScore: 0,
  currentStreak: 1,
  longestStreak: 1,
  lastLoginDate: '',
};

export function calculateTotalScore(stats: PlayerStats): number {
  let total = 0;
  Object.values(stats.levels || {}).forEach((lvl) => {
    if (lvl.bestScore && !isNaN(lvl.bestScore)) {
      total += lvl.bestScore;
    }
  });
  return total;
}

export function calculateHighScore(stats: PlayerStats): { highScore: number; levelNumber?: number } {
  let maxScore = 0;
  let bestLvl: number | undefined;
  Object.entries(stats.levels || {}).forEach(([lvlKey, lvl]) => {
    if (lvl.bestScore && lvl.bestScore > maxScore) {
      maxScore = lvl.bestScore;
      bestLvl = Number(lvlKey);
    }
  });
  return { highScore: maxScore, levelNumber: bestLvl };
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function updateDailyStreak(stats: PlayerStats): PlayerStats {
  const today = getLocalDateString();
  const lastLogin = stats.lastLoginDate;

  if (!lastLogin) {
    return {
      ...stats,
      currentStreak: 1,
      longestStreak: Math.max(stats.longestStreak || 1, 1),
      lastLoginDate: today,
    };
  }

  if (lastLogin === today) {
    // Already recorded for today
    return stats;
  }

  // Calculate day difference between calendar days
  const lastDate = new Date(lastLogin + 'T00:00:00');
  const currentDate = new Date(today + 'T00:00:00');
  const diffMs = currentDate.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  let currentStreak = stats.currentStreak || 1;
  let longestStreak = stats.longestStreak || 1;

  if (diffDays === 1) {
    // Logged in on consecutive day
    currentStreak += 1;
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }
  } else if (diffDays > 1) {
    // Missed a day
    currentStreak = 1;
  }

  return {
    ...stats,
    currentStreak,
    longestStreak,
    lastLoginDate: today,
  };
}

export function loadPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const today = getLocalDateString();

    if (!raw) {
      const initial: PlayerStats = {
        ...defaultStats,
        lastLoginDate: today,
      };
      savePlayerStats(initial);
      return initial;
    }

    const parsed = JSON.parse(raw);
    const loaded: PlayerStats = {
      ...defaultStats,
      ...parsed,
      levels: parsed.levels || {},
    };

    // Ensure totalScore & highScore are initialized
    if (loaded.totalScore === undefined) {
      loaded.totalScore = calculateTotalScore(loaded);
    }
    if (loaded.highScore === undefined) {
      loaded.highScore = calculateHighScore(loaded).highScore;
    }

    // Apply streak updates based on calendar day
    const withStreak = updateDailyStreak(loaded);
    if (
      withStreak.currentStreak !== loaded.currentStreak ||
      withStreak.lastLoginDate !== loaded.lastLoginDate ||
      withStreak.longestStreak !== loaded.longestStreak
    ) {
      savePlayerStats(withStreak);
    }

    recordDailyKnowledgePoints(today, withStreak.knowledgePoints);

    return withStreak;
  } catch {
    return defaultStats;
  }
}

export function savePlayerStats(stats: PlayerStats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save player stats', err);
  }
}

export function calculateMedals(stats: PlayerStats): { bronze: number; silver: number; gold: number; total: number } {
  let bronze = 0;
  let silver = 0;
  let gold = 0;

  Object.values(stats.levels).forEach((lvl) => {
    if (lvl.medals.bronze) bronze++;
    if (lvl.medals.silver) silver++;
    if (lvl.medals.gold) gold++;
  });

  return { bronze, silver, gold, total: bronze + silver + gold };
}

export function calculateKnowledgePoints(stats: PlayerStats): number {
  let kp = 0;
  for (let i = 1; i <= 30; i++) {
    if (stats.levels[i] && stats.levels[i].completions > 0) {
      kp++;
    }
  }
  return kp;
}

export function recordLevelSuccess(
  currentStats: PlayerStats,
  levelNumber: number,
  timeSec: number,
  moves: number,
  misses: number,
  stars: number,
  score: number = 0
): {
  updatedStats: PlayerStats;
  isFirstCompletion: boolean;
  newMedalsAwarded: ('bronze' | 'silver' | 'gold')[];
  isNewHighScore: boolean;
  bestScore: number;
} {
  const stats = { ...currentStats, levels: { ...currentStats.levels } };
  const existing = stats.levels[levelNumber] || {
    completions: 0,
    bestTime: Infinity,
    bestMoves: Infinity,
    leastMisses: Infinity,
    medals: { bronze: false, silver: false, gold: false },
    stars: 0,
    bestScore: 0,
  };

  const isFirstCompletion = existing.completions === 0;
  const newCompletions = existing.completions + 1;
  const newMedalsAwarded: ('bronze' | 'silver' | 'gold')[] = [];

  const medals = { ...existing.medals };
  if (newCompletions >= 2 && !medals.bronze) {
    medals.bronze = true;
    newMedalsAwarded.push('bronze');
  }
  if (newCompletions >= 5 && !medals.silver) {
    medals.silver = true;
    newMedalsAwarded.push('silver');
  }
  if (newCompletions >= 10 && !medals.gold) {
    medals.gold = true;
    newMedalsAwarded.push('gold');
  }

  const previousBestScore = existing.bestScore || 0;
  const isNewHighScore = score > previousBestScore;
  const bestScore = Math.max(previousBestScore, score);

  const updatedProgress: LevelProgress = {
    completions: newCompletions,
    bestTime: Math.min(existing.bestTime, timeSec),
    bestMoves: Math.min(existing.bestMoves, moves),
    leastMisses: Math.min(existing.leastMisses, misses),
    medals,
    stars: Math.max(existing.stars, stars),
    bestScore,
  };

  stats.levels[levelNumber] = updatedProgress;
  stats.totalGamesPlayed = (stats.totalGamesPlayed || 0) + 1;
  stats.knowledgePoints = calculateKnowledgePoints(stats);
  stats.totalScore = calculateTotalScore(stats);
  stats.highScore = Math.max(stats.highScore || 0, score);

  if (levelNumber >= stats.unlockedLevel && levelNumber < 30) {
    stats.unlockedLevel = levelNumber + 1;
  }

  savePlayerStats(stats);
  recordDailyKnowledgePoints(getLocalDateString(), stats.knowledgePoints);

  return {
    updatedStats: stats,
    isFirstCompletion,
    newMedalsAwarded,
    isNewHighScore,
    bestScore,
  };
}

export function formatShortDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatFullDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function recordDailyKnowledgePoints(dateStr: string, points: number) {
  try {
    let map: Record<string, number> = {};
    const raw = localStorage.getItem(KP_HISTORY_STORAGE_KEY);
    if (raw) {
      map = JSON.parse(raw);
    }
    const safePoints = Math.max(0, Math.min(30, points));
    map[dateStr] = Math.max(map[dateStr] || 0, safePoints);
    localStorage.setItem(KP_HISTORY_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to record daily KP to localStorage', err);
  }
}

export function resetKnowledgePointsHistory() {
  try {
    localStorage.removeItem(KP_HISTORY_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to reset KP history', err);
  }
}

/**
 * Retrieves the last 30 calendar days of Knowledge Points history from local storage.
 * If local storage has empty or partial history, initializes and stores a continuous progression
 * aligned with the player's current knowledge points.
 */
export function getKnowledgePointsHistory30Days(currentKP: number): KPHistoryPoint[] {
  const result: KPHistoryPoint[] = [];
  const today = new Date();
  const todayStr = getLocalDateString(today);

  // 1. Read existing historical stats from localStorage
  let historyMap: Record<string, number> = {};
  try {
    const raw = localStorage.getItem(KP_HISTORY_STORAGE_KEY);
    if (raw) {
      historyMap = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse KP history from localStorage', e);
  }

  // Ensure today's entry has at least the current KP
  if (historyMap[todayStr] === undefined || historyMap[todayStr] < currentKP) {
    historyMap[todayStr] = currentKP;
  }

  // Generate 30 date strings from (today - 29 days) through today
  const dateStrings: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dateStrings.push(getLocalDateString(d));
  }

  // If local storage has few/no entries prior to today and currentKP > 0,
  // seed an accumulation curve over recent active days leading up to currentKP
  const recordedCount = Object.keys(historyMap).length;
  if (recordedCount <= 1 && currentKP > 0) {
    const activeDays = Math.min(24, Math.max(4, currentKP * 2));
    const startIndex = Math.max(0, 30 - activeDays);
    for (let idx = startIndex; idx < 30; idx++) {
      const dStr = dateStrings[idx];
      const progressFraction = (idx - startIndex + 1) / (30 - startIndex);
      // Smooth curve up to currentKP
      const pts = Math.min(currentKP, Math.max(1, Math.round(progressFraction * currentKP)));
      if (historyMap[dStr] === undefined) {
        historyMap[dStr] = pts;
      }
    }
  }

  // Guarantee cumulative non-decreasing progression across the 30 days
  let runningKP = 0;
  for (let i = 0; i < dateStrings.length; i++) {
    const dStr = dateStrings[i];
    if (historyMap[dStr] !== undefined) {
      runningKP = Math.max(runningKP, Math.min(30, historyMap[dStr]));
    }
    historyMap[dStr] = runningKP;
  }

  // The last day must match currentKP
  if (dateStrings.length > 0) {
    const lastDStr = dateStrings[dateStrings.length - 1];
    runningKP = Math.max(runningKP, currentKP);
    historyMap[lastDStr] = runningKP;
  }

  // Persist back to local storage so subsequent reads preserve the historical timeline
  try {
    localStorage.setItem(KP_HISTORY_STORAGE_KEY, JSON.stringify(historyMap));
  } catch (e) {
    console.error('Failed to persist KP history to localStorage', e);
  }

  // Format into KPHistoryPoint array
  let prevDayKP = 0;
  for (let i = 0; i < dateStrings.length; i++) {
    const dStr = dateStrings[i];
    const kp = historyMap[dStr] ?? prevDayKP;
    const gained = i === 0 ? kp : Math.max(0, kp - prevDayKP);
    prevDayKP = kp;

    result.push({
      date: dStr,
      shortDate: formatShortDate(dStr),
      displayDate: formatFullDate(dStr),
      knowledgePoints: kp,
      pointsGained: gained,
    });
  }

  return result;
}
