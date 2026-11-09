import React from 'react';
import { PlayerStats } from '../types/game';
import { X, Sparkles } from 'lucide-react';
import { HelpfulGamesLevelList } from './HelpfulGamesLevelList';

interface LevelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLevel: (levelNumber: number) => void;
  currentLevelNumber: number;
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
}

export const LevelSelectorModal: React.FC<LevelSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectLevel,
  currentLevelNumber,
  stats,
  onUpdateStats,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 dark:bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/90 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                HelpfulGames Memory Levels (12 to 54 Cards)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose a level to play: Free Play, Miss Limit, or Zero Misses
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-6 overflow-y-auto">
          <HelpfulGamesLevelList
            currentLevelNumber={currentLevelNumber}
            stats={stats}
            onSelectLevel={(lvl) => {
              onSelectLevel(lvl);
              onClose();
            }}
            onUpdateStats={onUpdateStats}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
};
