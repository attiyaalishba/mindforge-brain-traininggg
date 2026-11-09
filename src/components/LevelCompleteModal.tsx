import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, Trophy, Sparkles, Clock, Flame, ArrowRight, RotateCcw, AlertTriangle, Sliders, Zap, Award } from 'lucide-react';
import { LevelConfig } from '../types/game';
import { getRankByKnowledgePoints } from '../utils/ranks';
import { formatScore, ScoreBreakdown } from '../utils/score';

interface LevelCompleteModalProps {
  isOpen: boolean;
  levelConfig: LevelConfig;
  timeSec: number;
  moves: number;
  misses: number;
  stars: number;
  score: number;
  bestScore?: number;
  isNewHighScore?: boolean;
  scoreBreakdown?: ScoreBreakdown;
  isFirstCompletion: boolean;
  newMedalsAwarded: ('bronze' | 'silver' | 'gold')[];
  totalCompletions: number;
  totalKnowledgePoints: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onClose: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  isOpen,
  levelConfig,
  timeSec,
  moves,
  misses,
  stars,
  score,
  bestScore,
  isNewHighScore,
  scoreBreakdown,
  isFirstCompletion,
  newMedalsAwarded,
  totalCompletions,
  totalKnowledgePoints,
  onNextLevel,
  onReplay,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Center celebratory burst
    try {
      confetti({
        particleCount: stars === 3 ? 100 : 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ec4899'],
        zIndex: 9999,
      });

      // Side cannons for extra reward feel
      const timeout1 = setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 55,
          origin: { x: 0.1, y: 0.7 },
          colors: ['#38bdf8', '#6366f1', '#f59e0b'],
          zIndex: 9999,
        });
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 55,
          origin: { x: 0.9, y: 0.7 },
          colors: ['#10b981', '#a855f7', '#ec4899'],
          zIndex: 9999,
        });
      }, 250);

      let timeout2: number | undefined;
      // Extra burst if gold medal or 3 stars
      if (stars === 3 || newMedalsAwarded.includes('gold')) {
        timeout2 = window.setTimeout(() => {
          confetti({
            particleCount: 60,
            spread: 100,
            origin: { y: 0.4 },
            colors: ['#fbbf24', '#f59e0b', '#d97706', '#fef08a'],
            zIndex: 9999,
          });
        }, 500);
      }

      return () => {
        clearTimeout(timeout1);
        if (timeout2) clearTimeout(timeout2);
      };
    } catch {
      // Fallback gracefully if canvas context is unavailable
    }
  }, [isOpen, stars, newMedalsAwarded]);

  const triggerExtraConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#6366f1', '#10b981', '#f59e0b'],
        zIndex: 9999,
      });
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const hasNextLevel = levelConfig.levelNumber < 30;
  const { currentRank, nextRank, pointsToNext } = getRankByKnowledgePoints(totalKnowledgePoints);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 dark:bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl text-center relative overflow-hidden transition-colors">
        
        {/* Glow behind */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Level Banner */}
        <button
          onClick={triggerExtraConfetti}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 cursor-pointer hover:bg-emerald-500/20 transition-colors"
          title="Click for celebration sparks!"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Stage Cleared!</span>
        </button>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
          {levelConfig.levelNumber === 99 ? 'Custom Practice Complete' : `Level ${levelConfig.levelNumber} Mastered`}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {levelConfig.title}
        </p>

        {/* Stars */}
        <div
          onClick={triggerExtraConfetti}
          className="flex items-center justify-center gap-2 mb-6 cursor-pointer group"
          title="Click to celebrate!"
        >
          {[1, 2, 3].map((starIdx) => (
            <div
              key={starIdx}
              className={`p-2 rounded-2xl transition-all duration-300 ${
                starIdx <= stars
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 scale-110'
                  : 'bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700'
              }`}
            >
              <Star
                className={`w-7 h-7 sm:w-8 sm:h-8 ${
                  starIdx <= stars ? 'fill-amber-400 text-amber-500 dark:text-amber-400 animate-pulse' : 'text-slate-300 dark:text-slate-700'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Score Showcase */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-amber-100/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-900/30 p-4 rounded-2xl border-2 border-amber-300 dark:border-amber-500/50 mb-4 shadow-md shadow-amber-500/10 text-left">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Level Score</span>
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white tracking-tight mt-0.5">
                {formatScore(score)}
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 ml-1.5">PTS</span>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              {isNewHighScore ? (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-[11px] shadow-sm animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>New Best!</span>
                </div>
              ) : bestScore && bestScore > 0 ? (
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="block uppercase text-[10px] font-bold">Personal Best</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatScore(bestScore)} pts</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Score breakdown pills */}
          {scoreBreakdown && (
            <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-amber-200/80 dark:border-amber-500/20 text-center">
              <div className="p-1 rounded-lg bg-white/70 dark:bg-slate-950/60">
                <span className="text-[9px] text-slate-400 uppercase font-semibold block">Matches</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">+{formatScore(scoreBreakdown.baseScore)}</span>
              </div>
              <div className="p-1 rounded-lg bg-white/70 dark:bg-slate-950/60">
                <span className="text-[9px] text-slate-400 uppercase font-semibold block">Speed</span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">+{formatScore(scoreBreakdown.timeBonus)}</span>
              </div>
              <div className="p-1 rounded-lg bg-white/70 dark:bg-slate-950/60">
                <span className="text-[9px] text-slate-400 uppercase font-semibold block">Accuracy</span>
                <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">+{formatScore(scoreBreakdown.accuracyBonus)}</span>
              </div>
              <div className="p-1 rounded-lg bg-white/70 dark:bg-slate-950/60">
                <span className="text-[9px] text-slate-400 uppercase font-semibold block">Tier Mult</span>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">{scoreBreakdown.tierMultiplier}x</span>
              </div>
            </div>
          )}
        </div>

        {/* Metrics Box */}
        <div className="grid grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-950/70 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 mb-5">
          <div className="p-2 text-center">
            <div className="flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Time</div>
            <div className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white">
              {formatTime(timeSec)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Limit: {levelConfig.timeLimitSec || Math.round(levelConfig.cardCount * 3.75)}s
            </div>
          </div>

          <div className="p-2 text-center">
            <div className="flex items-center justify-center text-sky-500 dark:text-sky-400 mb-1">
              <Flame className="w-4 h-4" />
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Flips</div>
            <div className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white">
              {moves}
            </div>
          </div>

          <div className="p-2 text-center">
            <div className="flex items-center justify-center text-amber-500 dark:text-amber-400 mb-1">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Misses</div>
            <div className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white">
              {misses}
            </div>
          </div>
        </div>

        {/* Custom Practice Config Summary (if Level 99) */}
        {levelConfig.levelNumber === 99 && (
          <div className="mb-5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center justify-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span>Custom Sandbox Settings Applied</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
              {levelConfig.difficulty && (
                <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold capitalize border border-indigo-500/20">
                  {levelConfig.difficulty} Difficulty
                </span>
              )}
              {levelConfig.memoryDecaySpeedMs && (
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono font-bold border border-amber-500/20 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>{levelConfig.memoryDecaySpeedMs}ms Decay</span>
                </span>
              )}
              <span className="px-2 py-0.5 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono border border-slate-300 dark:border-slate-700">
                {levelConfig.allowedMisses === Infinity ? 'Unlimited' : `${levelConfig.allowedMisses} Max`} Misses
              </span>
            </div>
          </div>
        )}

        {/* HelpfulGames Rewards Alert */}
        <div className="space-y-2 mb-6 text-left">
          {/* Knowledge Point & Rank Status */}
          {isFirstCompletion && levelConfig.levelNumber <= 30 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="text-xs flex-1">
                <div className="font-bold flex items-center justify-between">
                  <span>+1 Knowledge Point Earned!</span>
                  <span className="font-mono">{totalKnowledgePoints} / 30 KP</span>
                </div>
                <div className="text-amber-700/80 dark:text-amber-300/80 text-[11px] flex items-center gap-1.5 mt-0.5">
                  <span>Rank:</span>
                  <span className="font-bold text-amber-900 dark:text-amber-200">{currentRank.badge} {currentRank.title}</span>
                  {nextRank && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">
                      ({pointsToNext} KP to {nextRank.title})
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* New Medals Earned */}
          {newMedalsAwarded.map((medal) => {
            const medalInfo = {
              bronze: { name: 'Bronze Medal', icon: '🥉', count: 2 },
              silver: { name: 'Silver Medal', icon: '🥈', count: 5 },
              gold: { name: 'Gold Medal', icon: '🥇', count: 10 },
            }[medal];

            return (
              <div
                key={medal}
                className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200 animate-bounce"
              >
                <span className="text-2xl">{medalInfo.icon}</span>
                <div className="text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {medalInfo.name} Unlocked!
                  </div>
                  <div className="text-emerald-700/80 dark:text-emerald-300/80 text-[11px]">
                    Completed {levelConfig.title} {medalInfo.count} times!
                  </div>
                </div>
              </div>
            );
          })}

          <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
            Completed this level <span className="font-bold text-slate-900 dark:text-white font-mono">{totalCompletions}</span> time{totalCompletions > 1 ? 's' : ''}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {hasNextLevel && levelConfig.levelNumber <= 30 && (
            <button
              onClick={onNextLevel}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
            >
              <span>Next Level ({levelConfig.levelNumber + 1})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onReplay}
              className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-xs border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay</span>
            </button>

            <button
              onClick={onClose}
              className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-xs border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              {levelConfig.levelNumber === 99 ? (
                <>
                  <Sliders className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sandbox Settings</span>
                </>
              ) : (
                <span>Level Menu</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
