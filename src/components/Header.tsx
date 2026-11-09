import React from 'react';
import { GameMode, PlayerStats } from '../types/game';
import { calculateMedals } from '../utils/storage';
import { getRankByKnowledgePoints } from '../utils/ranks';
import { soundManager } from '../utils/sound';
import { formatScore } from '../utils/score';
import { useTheme } from '../context/ThemeContext';
import { 
  Brain, 
  Trophy, 
  HelpCircle, 
  BarChart3, 
  Volume2, 
  VolumeX, 
  Layers, 
  Sliders, 
  Flame, 
  Sun, 
  Moon,
  Zap
} from 'lucide-react';

interface HeaderProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  stats: PlayerStats;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenHowToPlay: () => void;
  onOpenStats: () => void;
  onOpenLevelSelector: () => void;
  activeLevel?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  stats,
  soundEnabled,
  onToggleSound,
  onOpenHowToPlay,
  onOpenStats,
  onOpenLevelSelector,
  activeLevel = 1,
}) => {
  const medals = calculateMedals(stats);
  const { currentRank } = getRankByKnowledgePoints(stats.knowledgePoints);
  const { theme, toggleTheme } = useTheme();


  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow-lg transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-sm shadow-emerald-500/20 shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white truncate">
                MindForge <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Memory</span>
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                Cognitive Working Memory & Spatial Conditioning
              </p>
            </div>
          </div>

          {/* Core Gamification Stats: KP & Medals & Streak */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Daily Streak */}
            <button
              onClick={onOpenStats}
              title={`Daily Login Streak: ${stats.currentStreak || 1} day${(stats.currentStreak || 1) > 1 ? 's' : ''}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 transition-colors text-slate-800 dark:text-slate-200 cursor-pointer text-left"
            >
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />
              <div className="leading-tight">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Streak</span>
                <span className="text-xs sm:text-sm font-black font-mono tabular-nums">{stats.currentStreak || 1}d</span>
              </div>
            </button>

            {/* Knowledge Points & Player Rank */}
            <button
              onClick={onOpenStats}
              title={`Title: ${currentRank.title} (${stats.knowledgePoints}/30 KP) - Click for Stats`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 transition-colors text-slate-800 dark:text-slate-200 cursor-pointer text-left"
            >
              <span className="text-sm select-none" role="img" aria-label={currentRank.title}>
                {currentRank.badge}
              </span>
              <div className="leading-tight">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block truncate max-w-[85px] sm:max-w-none">
                  {currentRank.title}
                </span>
                <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  {stats.knowledgePoints}<span className="text-[10px] text-slate-400 font-normal">/30 KP</span>
                </span>
              </div>
            </button>

            {/* Medals */}
            <button
              onClick={onOpenStats}
              title="Medals: Earn Bronze (2x), Silver (5x), and Gold (10x) per level (Max 90)"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 transition-colors text-slate-800 dark:text-slate-200 cursor-pointer text-left"
            >
              <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="leading-tight">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Medals</span>
                <span className="text-xs sm:text-sm font-black font-mono tabular-nums">
                  {medals.total}<span className="text-[10px] text-slate-400 font-normal">/90</span>
                </span>
              </div>
            </button>

            {/* Total Game Score */}
            <button
              onClick={onOpenStats}
              title={`Total Cumulative Score: ${formatScore(stats.totalScore || 0)} pts - Click to inspect brain stats`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-500/30 transition-colors text-slate-800 dark:text-slate-200 cursor-pointer text-left"
            >
              <Zap className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
              <div className="leading-tight">
                <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80 uppercase font-bold tracking-wider block">Score</span>
                <span className="text-xs sm:text-sm font-black font-mono tabular-nums text-amber-800 dark:text-amber-300">
                  {formatScore(stats.totalScore || 0)}
                </span>
              </div>
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => {
                toggleTheme();
                soundManager.playFlip();
              }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700/60 cursor-pointer shadow-xs"
              aria-label="Toggle Light and Dark Mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-emerald-600 hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                onToggleSound();
                soundManager.playFlip();
              }}
              title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700/60 cursor-pointer"
              aria-label="Toggle Sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
            </button>

            {/* Brain Stats Modal */}
            <button
              onClick={onOpenStats}
              title="Brain Performance & Statistics"
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700/60 cursor-pointer"
              aria-label="View Statistics"
            >
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>

            {/* Rules / Help */}
            <button
              onClick={onOpenHowToPlay}
              title="How to Play & Cognitive Rules"
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700/60 cursor-pointer"
              aria-label="How to Play"
            >
              <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>

          </div>
        </div>

        {/* Navigation Mode Selector Tabs - Memory Cards Only */}
        <div className="flex items-center gap-1.5 mt-2.5 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl w-fit border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm font-medium">
          <button
            onClick={() => onSelectMode('levels')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              currentMode === 'levels'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>30 Levels Campaign</span>
            {currentMode === 'levels' && (
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                Lvl {activeLevel}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectMode('custom')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              currentMode === 'custom'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Custom Sandbox</span>
          </button>
        </div>
      </div>
    </header>
  );
};
