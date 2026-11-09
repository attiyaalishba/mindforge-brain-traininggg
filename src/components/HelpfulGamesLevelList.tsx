import React, { useState } from 'react';
import { GAME_LEVELS } from '../data/levels';
import { PlayerStats } from '../types/game';
import { calculateMedals } from '../utils/storage';
import { formatScore } from '../utils/score';
import { 
  Play, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Trophy, 
  Sparkles, 
  Info, 
  Lock, 
  Unlock 
} from 'lucide-react';

interface HelpfulGamesLevelListProps {
  currentLevelNumber: number;
  stats: PlayerStats;
  onSelectLevel: (levelNumber: number) => void;
  onUpdateStats?: (newStats: PlayerStats) => void;
  isModal?: boolean;
}

export const HelpfulGamesLevelList: React.FC<HelpfulGamesLevelListProps> = ({
  currentLevelNumber,
  stats,
  onSelectLevel,
  onUpdateStats,
  isModal = false,
}) => {
  const [showAllLevels, setShowAllLevels] = useState(false);
  const [selectedTierFilter, setSelectedTierFilter] = useState<'all' | 'standard' | 'challenging' | 'perfect'>('all');
  const medals = calculateMedals(stats);

  const handleUnlockAll = () => {
    if (onUpdateStats) {
      onUpdateStats({ ...stats, unlockedLevel: 30 });
    }
  };

  const filteredLevels = GAME_LEVELS.filter((lvl) => {
    if (selectedTierFilter === 'all') return true;
    return lvl.variant === selectedTierFilter;
  });

  // By default, HelpfulGames shows the first 8 levels before the "Show more levels" toggle
  const initialVisibleCount = 8;
  const isCapped = !showAllLevels && selectedTierFilter === 'all';
  const displayedLevels = isCapped 
    ? filteredLevels.slice(0, initialVisibleCount) 
    : filteredLevels;
  const remainingCount = filteredLevels.length - initialVisibleCount;

  return (
    <div className={`w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-6 ${isModal ? 'p-2 sm:p-4' : 'py-4 px-2 sm:px-4'}`}>
      
      {/* LEFT/CENTER: HelpfulGames Levels List */}
      <div className="flex-1 flex flex-col space-y-2.5">
        
        {/* Tier filter tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
            <button
              onClick={() => setSelectedTierFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                selectedTierFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All 30 Levels
            </button>
            <button
              onClick={() => setSelectedTierFilter('standard')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                selectedTierFilter === 'standard'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Free Play (1-10)
            </button>
            <button
              onClick={() => setSelectedTierFilter('challenging')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                selectedTierFilter === 'challenging'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Challenging (11-20)
            </button>
            <button
              onClick={() => setSelectedTierFilter('perfect')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                selectedTierFilter === 'perfect'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Perfect (21-30)
            </button>
          </div>

          {stats.unlockedLevel < 30 && onUpdateStats && (
            <button
              onClick={handleUnlockAll}
              className="text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              title="Unlock all 30 levels immediately"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unlock All</span>
            </button>
          )}
        </div>

        {/* Level Rows */}
        <div className="flex flex-col space-y-2">
          {displayedLevels.map((lvl) => {
            const isActive = lvl.levelNumber === currentLevelNumber;
            const isUnlocked = lvl.levelNumber <= stats.unlockedLevel;
            const progress = stats.levels[lvl.levelNumber];
            const hasKP = !!(progress && progress.completions >= 1);
            const hasBronze = !!(progress && progress.medals?.bronze);
            const hasSilver = !!(progress && progress.medals?.silver);
            const hasGold = !!(progress && progress.medals?.gold);

            return (
              <div
                key={lvl.levelNumber}
                onClick={() => {
                  if (isUnlocked) onSelectLevel(lvl.levelNumber);
                }}
                className={`group flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl border transition-all select-none shadow-xs ${
                  !isUnlocked
                    ? 'opacity-55 bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                    : isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-400/80 shadow-md shadow-emerald-500/10 dark:shadow-emerald-900/20 cursor-pointer ring-1 ring-emerald-400/30'
                    : 'bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer'
                }`}
              >
                {/* Left Side: Active Arrow, Number Circle, Title & Pairs */}
                <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                  {/* Arrow Indicator for Current Active Level */}
                  <div className="w-4 sm:w-5 flex items-center justify-center shrink-0">
                    {isActive ? (
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 dark:text-emerald-400 fill-emerald-500 dark:fill-emerald-400 animate-pulse" />
                    ) : null}
                  </div>

                  {/* Emerald Number Circle */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-sm sm:text-base shrink-0 shadow-sm ${
                      !isUnlocked
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700'
                        : isActive
                        ? 'bg-emerald-500 text-white ring-2 ring-emerald-300 dark:ring-emerald-400/40'
                        : 'bg-emerald-600 group-hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {!isUnlocked ? <Lock className="w-4 h-4" /> : lvl.levelNumber}
                  </div>

                  {/* Title & Pair Subtext */}
                  <div className="text-left min-w-0">
                    <h3
                      className={`font-black text-xs sm:text-sm md:text-base tracking-wide uppercase truncate ${
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-300'
                          : 'text-slate-800 group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-200'
                      }`}
                    >
                      {lvl.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span>{lvl.pairCount} PAIRS</span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{lvl.timeLimitSec || Math.round(lvl.cardCount * 3.75)}S TIMER</span>
                      </p>
                      {progress?.bestScore && progress.bestScore > 0 ? (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            ★ {formatScore(progress.bestScore)} PTS
                          </span>
                        </>
                      ) : isUnlocked ? (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            Unplayed
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Right Side: 4 HelpfulGames Medal Circles + Play Triangle Button */}
                <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                  {/* 1. Gold Circle */}
                  <div
                    title={hasGold ? 'Gold Medal Earned (10+ completions)' : 'Gold Medal (Requires 10 completions)'}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center transition-transform ${
                      hasGold
                        ? 'border-amber-400 bg-amber-400 text-slate-950 scale-105 shadow-sm shadow-amber-400/50'
                        : 'border-amber-400/50 bg-amber-400/10 text-transparent'
                    }`}
                  >
                    {hasGold ? <Trophy className="w-3.5 h-3.5 fill-current" /> : null}
                  </div>

                  {/* 2. Silver Circle */}
                  <div
                    title={hasSilver ? 'Silver Medal Earned (5+ completions)' : 'Silver Medal (Requires 5 completions)'}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center transition-transform ${
                      hasSilver
                        ? 'border-slate-300 bg-slate-300 text-slate-900 scale-105 shadow-sm shadow-slate-300/40'
                        : 'border-slate-300 dark:border-slate-400/40 bg-slate-200/50 dark:bg-slate-400/10 text-transparent'
                    }`}
                  >
                    {hasSilver ? <Trophy className="w-3.5 h-3.5 fill-current" /> : null}
                  </div>

                  {/* 3. Bronze Circle */}
                  <div
                    title={hasBronze ? 'Bronze Medal Earned (2+ completions)' : 'Bronze Medal (Requires 2 completions)'}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center transition-transform ${
                      hasBronze
                        ? 'border-amber-600 bg-amber-600 text-amber-100 scale-105 shadow-sm shadow-amber-600/40'
                        : 'border-amber-600/50 bg-amber-600/10 text-transparent'
                    }`}
                  >
                    {hasBronze ? <Trophy className="w-3.5 h-3.5 fill-current" /> : null}
                  </div>

                  {/* 4. Knowledge Point (KP) Circle */}
                  <div
                    title={hasKP ? 'Knowledge Point Earned (Completed >= 1 time)' : 'Knowledge Point (Complete level to earn)'}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center transition-transform ${
                      hasKP
                        ? 'border-emerald-500 bg-emerald-500 text-white scale-105 shadow-sm shadow-emerald-500/40'
                        : 'border-emerald-500/40 bg-emerald-500/10 text-transparent'
                    }`}
                  >
                    {hasKP ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                  </div>

                  {/* Play Button ▶ */}
                  <button
                    disabled={!isUnlocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isUnlocked) onSelectLevel(lvl.levelNumber);
                    }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-sm transition-all active:scale-90 cursor-pointer ${
                      !isUnlocked
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        : isActive
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                    }`}
                    title={`Play ${lvl.title}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* "Show more levels (22)" Button */}
        {selectedTierFilter === 'all' && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setShowAllLevels((prev) => !prev)}
              className="px-6 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <span>
                {showAllLevels
                  ? 'Show fewer levels'
                  : `Show more levels (${remainingCount})`}
              </span>
              {showAllLevels ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR: HelpfulGames 4-Capsule Widget & Status */}
      <div className="w-full lg:w-72 shrink-0 flex flex-col space-y-4">
        {/* HelpfulGames 4 Oval Stats Pill Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-xl transition-colors">
          {/* Cumulative Score Summary Banner */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-slate-950/80 p-3 rounded-xl border border-amber-200/80 dark:border-amber-500/30 mb-3.5 text-center shadow-xs">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
              Cumulative Game Score
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-900 dark:text-amber-300 mt-0.5">
              {formatScore(stats.totalScore || 0)} <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">PTS</span>
            </div>
            {stats.highScore && stats.highScore > 0 ? (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5">
                Top Round: {formatScore(stats.highScore)} pts
              </span>
            ) : null}
          </div>

          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 text-center">
            HelpfulGames Progress
          </h4>

          <div className="grid grid-cols-4 gap-2">
            {/* Gold Capsule */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-sm shadow-amber-400/20">
                {medals.gold}
              </div>
              <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 mt-1 uppercase">
                GOLD
              </span>
            </div>

            {/* Silver Capsule */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-300 text-slate-900 font-black text-sm flex items-center justify-center shadow-sm shadow-slate-300/20">
                {medals.silver}
              </div>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-1 uppercase">
                SILVER
              </span>
            </div>

            {/* Bronze Capsule */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-amber-600 text-amber-100 font-black text-sm flex items-center justify-center shadow-sm shadow-amber-600/20">
                {medals.bronze}
              </div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 mt-1 uppercase">
                BRONZE
              </span>
            </div>

            {/* Knowledge Points Capsule */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-black text-sm flex items-center justify-center shadow-sm shadow-emerald-500/20">
                {stats.knowledgePoints}
              </div>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 uppercase text-center leading-tight">
                POINTS
              </span>
            </div>
          </div>

          {/* Privacy / Storage Status Box */}
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Scores saved locally!
              </span>
              Progress persists on this device. Complete levels to earn Knowledge Points and medals.
            </div>
          </div>
        </div>

        {/* Cognitive Information Box */}
        <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 text-xs text-slate-600 dark:text-slate-400 space-y-2 shadow-xs transition-colors">
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>HelpfulGames Rules</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            <strong className="text-slate-800 dark:text-slate-200">Standard (1-10):</strong> Free play without miss penalties across 12 to 54 cards.
          </p>
          <p className="text-[11px] leading-relaxed">
            <strong className="text-slate-800 dark:text-slate-200">Challenging (11-20):</strong> Strictly capped misses (1 to 9 max).
          </p>
          <p className="text-[11px] leading-relaxed">
            <strong className="text-slate-800 dark:text-slate-200">Perfect (21-30):</strong> Zero misses allowed. Precision working memory test!
          </p>
        </div>
      </div>
    </div>
  );
};
