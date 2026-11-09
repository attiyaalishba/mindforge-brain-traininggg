import React, { useState, useMemo } from 'react';
import { PlayerStats, KPHistoryPoint } from '../types/game';
import { calculateMedals, getKnowledgePointsHistory30Days, resetKnowledgePointsHistory } from '../utils/storage';
import { getRankByKnowledgePoints, MEMORY_RANKS } from '../utils/ranks';
import { formatScore } from '../utils/score';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { 
  X, 
  Trophy, 
  Sparkles, 
  BarChart2, 
  Flame, 
  RotateCcw, 
  CheckCircle2,
  Award,
  Calendar,
  Zap,
  Crown,
  ChevronRight,
  Shield,
  Star,
  Info,
  TrendingUp,
  Activity
} from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  onResetProgress: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onResetProgress,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showRankLadder, setShowRankLadder] = useState(false);

  // Retrieve 30-day historical knowledge points accumulation from local storage
  // Declared unconditionally before early return to adhere to React Rules of Hooks
  const historyData = useMemo(() => {
    if (!isOpen) return [];
    return getKnowledgePointsHistory30Days(stats.knowledgePoints);
  }, [stats.knowledgePoints, isOpen]);

  if (!isOpen) return null;

  const medals = calculateMedals(stats);
  const { currentRank, nextRank, progressPercent, pointsToNext } = getRankByKnowledgePoints(stats.knowledgePoints);

  const currentStreak = stats.currentStreak || 1;
  const longestStreak = stats.longestStreak || 1;

  const startKP = historyData.length > 0 ? historyData[0].knowledgePoints : 0;
  const thirtyDayGain = Math.max(0, stats.knowledgePoints - startKP);
  const activeDaysCount = historyData.filter((d) => d.pointsGained > 0).length;

  // Compute cognitive memory index (0 - 150 scale)
  const baseScore = 80;
  const kpBonus = stats.knowledgePoints * 1.5;
  const medalsBonus = medals.total * 0.4;
  const matchesBonus = Math.min(20, Math.floor(stats.totalMatchesFound / 4));
  const streakBonus = Math.min(10, currentStreak * 1.2);
  const memoryQuotient = Math.min(150, Math.round(baseScore + kpBonus + medalsBonus + matchesBonus + streakBonus));

  // Streak milestones
  const streakMilestones = [
    { days: 3, label: '3-Day Spark', icon: '🔥', unlocked: longestStreak >= 3 },
    { days: 7, label: '7-Day Mind Master', icon: '🧠', unlocked: longestStreak >= 7 },
    { days: 14, label: '14-Day Memory Titan', icon: '⚡', unlocked: longestStreak >= 14 },
    { days: 30, label: '30-Day Apex Legend', icon: '👑', unlocked: longestStreak >= 30 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Brain Performance Analytics</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">HelpfulGames cognitive profile & streaks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* TOP RANKING & TITLE CARD BASED ON KNOWLEDGE POINTS */}
          <div className={`relative overflow-hidden p-5 rounded-2xl border ${currentRank.borderColor} bg-gradient-to-br ${currentRank.bgGradient} bg-white dark:bg-slate-900 shadow-md transition-all`}>
            {/* Header / Current Tier */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-3xl shrink-0 select-none">
                  {currentRank.badge}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                      Tier {currentRank.tier} of {MEMORY_RANKS.length}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                      {stats.knowledgePoints} KP
                    </span>
                  </div>
                  <h3 className={`text-xl sm:text-2xl font-black ${currentRank.textColor} tracking-tight mt-0.5`}>
                    {currentRank.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {currentRank.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRankLadder(!showRankLadder)}
                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors"
                title="View all 7 Memory Ranks from Novice to Grandmaster"
              >
                <span>{showRankLadder ? 'Hide Ranks' : 'All Ranks'}</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showRankLadder ? 'rotate-90' : ''}`} />
              </button>
            </div>

            {/* Next Rank Progress Bar */}
            {nextRank ? (
              <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800/70">
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Next Title:</span>
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <span>{nextRank.badge}</span>
                      <span>{nextRank.title}</span>
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300 font-bold">
                    {pointsToNext} KP needed ({nextRank.minKP} KP)
                  </span>
                </div>

                <div className="w-full h-3 bg-slate-200/90 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  <span>{currentRank.minKP} KP ({currentRank.title})</span>
                  <span className="font-bold">{progressPercent}% to next rank</span>
                  <span>{nextRank.minKP} KP ({nextRank.title})</span>
                </div>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-amber-300/40 dark:border-amber-500/30 flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-300">
                <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Supreme Achievement! You have attained the highest title of Grandmaster (30/30 KP).</span>
              </div>
            )}

            {/* Expandable All Ranks Ladder */}
            {showRankLadder && (
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Knowledge Points Ranking Ladder (30 Levels)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MEMORY_RANKS.map((r) => {
                    const isCurrent = r.tier === currentRank.tier;
                    const isUnlocked = stats.knowledgePoints >= r.minKP;
                    return (
                      <div
                        key={r.tier}
                        className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
                          isCurrent
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/30 shadow-xs'
                            : isUnlocked
                            ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                            : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60 text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        <div className="text-xl shrink-0 select-none">{r.badge}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold truncate text-slate-900 dark:text-white">
                              {r.title}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 shrink-0 ml-1">
                              {r.minKP}{r.minKP === r.maxKP ? ' KP' : `–${r.maxKP} KP`}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                            {r.description}
                          </span>
                        </div>
                        {isCurrent && (
                          <span className="shrink-0 text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-xs">
                            Active
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Top IQ / Memory Quotient Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/60 dark:via-slate-900 dark:to-teal-950/60 p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 shadow-sm dark:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Estimated Memory Index
                </span>
                <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                  {memoryQuotient} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ 150</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {memoryQuotient > 125 ? '⚡ Superior Memory Retention' : memoryQuotient > 105 ? '✨ High Cognitive Agility' : '🌱 Expanding Working Memory'}
                </p>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 dark:border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                <Award className="w-9 h-9" />
              </div>
            </div>
          </div>

          {/* Brain Training Score Card */}
          <div className="bg-gradient-to-br from-amber-50 via-white to-amber-100/50 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/30 p-4 sm:p-5 rounded-2xl border border-amber-200 dark:border-amber-500/30 shadow-sm dark:shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Zap className="w-5 h-5 text-amber-500 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Brain Training Score</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Total cumulative points achieved across all mastered levels</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/80 dark:bg-slate-950/70 p-3 rounded-xl border border-amber-200/80 dark:border-amber-500/20">
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 block">Total Game Score</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white leading-tight mt-0.5">
                  {formatScore(stats.totalScore || 0)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">pts</span>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-950/70 p-3 rounded-xl border border-amber-200/80 dark:border-amber-500/20">
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 block">All-Time High Score</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400 leading-tight mt-0.5">
                  {formatScore(stats.highScore || 0)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Login Streak Card */}
          <div className="bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-orange-950/40 dark:via-slate-900 dark:to-amber-950/30 p-4 sm:p-5 rounded-2xl border border-orange-200 dark:border-orange-500/30 shadow-sm dark:shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                  <Flame className="w-5 h-5 fill-orange-500 dark:fill-orange-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daily Training Streak</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Recurring practice strengthens long-term synaptic plasticity</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-orange-700 dark:text-orange-300 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                <Zap className="w-3 h-3" />
                <span>Active</span>
              </div>
            </div>

            {/* Streak Metrics (Current vs Longest) */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Current Streak */}
              <div className="bg-white/80 dark:bg-slate-950/70 p-3 rounded-xl border border-orange-200 dark:border-orange-500/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                  <Flame className="w-6 h-6 fill-orange-500 dark:fill-orange-400 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-orange-600/80 dark:text-orange-300/80 block">Current Streak</span>
                  <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white leading-tight">
                    {currentStreak} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">day{currentStreak > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Longest Streak */}
              <div className="bg-white/80 dark:bg-slate-950/70 p-3 rounded-xl border border-amber-200 dark:border-amber-500/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Crown className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-700/80 dark:text-amber-300/80 block">Longest Record</span>
                  <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white leading-tight">
                    {longestStreak} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">day{longestStreak > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Milestone badges */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Streak Milestones</span>
                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-normal">Train daily to unlock</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {streakMilestones.map((m) => (
                  <div
                    key={m.days}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      m.unlocked
                        ? 'bg-orange-500/10 border-orange-500/40 text-orange-800 dark:text-orange-200'
                        : 'bg-slate-100 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/60 opacity-50 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <span className="text-lg block mb-0.5">{m.icon}</span>
                    <div className="text-[10px] font-bold truncate text-slate-900 dark:text-white">{m.label}</div>
                    <span className="text-[9px] font-mono block text-slate-500 dark:text-slate-400">
                      {m.days} Days
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Knowledge Points Progress */}
          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Knowledge Points (HelpfulGames)
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                {stats.knowledgePoints} / 30 KP
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700/60">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${(stats.knowledgePoints / 30) * 100}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 flex justify-between">
              <span>Earn 1 point per completed level</span>
              <span>{Math.round((stats.knowledgePoints / 30) * 100)}% Mastered</span>
            </div>
          </div>

          {/* 30-DAY KNOWLEDGE POINTS ACCUMULATION LINE CHART (RECHARTS) */}
          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>30-Day Knowledge Points Accumulation</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Historical progression retrieved from local storage
                  </p>
                </div>
              </div>

              {/* 30-Day metric summary badges */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  <Activity className="w-3 h-3" />
                  <span>+{thirtyDayGain} KP (30d)</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700">
                  {stats.knowledgePoints} / 30 KP
                </span>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 mb-3 pt-1">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-medium">30d Ago</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                  {startKP} KP
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-medium">30d Growth</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  +{thirtyDayGain} KP
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-medium">Active Days</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-amber-600 dark:text-amber-400">
                  {activeDaysCount} Days
                </span>
              </div>
            </div>

            {/* Recharts Line Chart */}
            <div className="h-56 sm:h-60 w-full pt-2 select-none">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={historyData}
                  margin={{ top: 8, right: 12, left: -22, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#94a3b8"
                    strokeOpacity={0.2}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="shortDate"
                    interval={4}
                    tickLine={false}
                    axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.25 }}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                  />
                  <YAxis
                    domain={[0, 30]}
                    ticks={[0, 10, 20, 30]}
                    tickLine={false}
                    axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.25 }}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const point = payload[0].payload as KPHistoryPoint;
                        const rankInfo = getRankByKnowledgePoints(point.knowledgePoints);
                        return (
                          <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white p-3 rounded-xl shadow-xl border border-slate-700/80 text-xs backdrop-blur-md min-w-[190px]">
                            <div className="font-bold text-slate-200 border-b border-slate-700/80 pb-1.5 mb-2 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                {point.displayDate}
                              </span>
                              <span className="text-[10px] text-amber-400 font-mono font-semibold bg-amber-400/10 px-1.5 py-0.5 rounded">
                                {point.shortDate}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-amber-300 font-medium mb-1.5">
                              <span className="text-slate-400">Knowledge Points:</span>
                              <span className="font-mono text-sm font-bold text-amber-400">
                                {point.knowledgePoints} <span className="text-[10px] text-slate-400 font-normal">/ 30 KP</span>
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-[11px] mb-2">
                              <span className="text-slate-400">Daily Gain:</span>
                              {point.pointsGained > 0 ? (
                                <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  +{point.pointsGained} KP earned
                                </span>
                              ) : (
                                <span className="font-mono text-slate-500">No change</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-700/80 text-[11px] text-slate-300">
                              <span className="text-base select-none">{rankInfo.currentRank.badge}</span>
                              <span className="font-semibold truncate text-slate-200">{rankInfo.currentRank.title}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={30}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    strokeOpacity={0.35}
                  />
                  <Line
                    type="monotone"
                    dataKey="knowledgePoints"
                    name="Knowledge Points"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    activeDot={{
                      r: 6,
                      fill: '#f59e0b',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                    dot={(props: any) => {
                      const { cx, cy, payload, index } = props;
                      const isLast = index === historyData.length - 1;
                      const hasGain = payload && payload.pointsGained > 0;
                      if (hasGain || isLast) {
                        return (
                          <circle
                            key={`dot-${payload.date}`}
                            cx={cx}
                            cy={cy}
                            r={hasGain ? 3.5 : 3}
                            fill="#f59e0b"
                            stroke="#ffffff"
                            strokeWidth={1.5}
                          />
                        );
                      }
                      return null;
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Chart footer info */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                <span>Hover points to inspect daily progression & rank tier</span>
              </span>
              <span className="font-mono text-amber-700/80 dark:text-amber-400/80">
                1 KP per level (Max 30)
              </span>
            </div>
          </div>

          {/* Medals Showcase (90 Max) */}
          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  90 Medals Collection
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                {medals.total} / 90
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="text-2xl mb-1">🥉</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Bronze</div>
                <div className="text-xs font-mono text-amber-600 dark:text-amber-300 font-bold mt-0.5">
                  {medals.bronze} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">/30</span>
                </div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">2 completions</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="text-2xl mb-1">🥈</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Silver</div>
                <div className="text-xs font-mono text-slate-700 dark:text-slate-200 font-bold mt-0.5">
                  {medals.silver} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">/30</span>
                </div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">5 completions</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="text-2xl mb-1">🥇</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Gold</div>
                <div className="text-xs font-mono text-amber-500 dark:text-amber-400 font-bold mt-0.5">
                  {medals.gold} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">/30</span>
                </div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">10 completions</span>
              </div>
            </div>
          </div>

          {/* Memory Card Performance Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Total Score</div>
              <div className="text-base sm:text-lg font-black font-mono text-amber-600 dark:text-amber-400">
                {formatScore(stats.totalScore || 0)} <span className="text-[10px] font-normal text-slate-400">pts</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Matches Found</div>
              <div className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                {stats.totalMatchesFound || 0} <span className="text-[10px] font-normal text-slate-400">pairs</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Levels Cleared</div>
              <div className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                {Object.keys(stats.levels || {}).length} <span className="text-[10px] font-normal text-slate-400">/ 30</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Games Played</div>
              <div className="text-base sm:text-lg font-black font-mono text-purple-600 dark:text-purple-400">
                {stats.totalGamesPlayed || 0} <span className="text-[10px] font-normal text-slate-400">rounds</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Reset option */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs">
          {!showConfirmReset ? (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Game Data</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-rose-600 dark:text-rose-400 font-medium">Are you sure?</span>
              <button
                onClick={() => {
                  resetKnowledgePointsHistory();
                  onResetProgress();
                  setShowConfirmReset(false);
                }}
                className="px-2.5 py-1 bg-rose-600 text-white rounded font-bold cursor-pointer"
              >
                Yes, Reset All
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold cursor-pointer border border-slate-200 dark:border-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
