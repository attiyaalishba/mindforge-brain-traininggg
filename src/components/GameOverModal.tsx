import React from 'react';
import { AlertOctagon, RotateCcw, Menu, Lightbulb, Sliders } from 'lucide-react';
import { LevelConfig } from '../types/game';

interface GameOverModalProps {
  isOpen: boolean;
  levelConfig: LevelConfig;
  reason: string;
  misses: number;
  allowedMisses: number;
  onTryAgain: () => void;
  onChooseLevel: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  levelConfig,
  reason,
  misses,
  allowedMisses,
  onTryAgain,
  onChooseLevel,
}) => {
  if (!isOpen) return null;

  const isCustomLevel = levelConfig.levelNumber === 99;
  const isTimeExpired = reason.toLowerCase().includes('time') || reason.toLowerCase().includes('clock');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 dark:bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl text-center relative overflow-hidden transition-colors">
        
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-rose-500/10 dark:bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Danger Icon */}
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 text-rose-500 dark:text-rose-400">
          {isTimeExpired ? <RotateCcw className="w-8 h-8 animate-spin" /> : <AlertOctagon className="w-8 h-8" />}
        </div>

        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
          {isTimeExpired ? "Time's Up!" : "Precision Limit Reached"}
        </h2>
        <p className="text-xs text-rose-600 dark:text-rose-300 font-semibold mb-3">
          {isTimeExpired
            ? `${levelConfig.timeLimitSec || Math.round(levelConfig.cardCount * 3.75)}s Timer (${levelConfig.cardCount} Cards)`
            : levelConfig.variant === 'perfect' 
            ? 'Zero Misses Allowed (Perfect Mode)' 
            : `Max ${allowedMisses} Misses Allowed`}
          {levelConfig.memoryDecaySpeedMs ? ` • ${levelConfig.memoryDecaySpeedMs}ms Decay` : ''}
        </p>

        <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          {reason}
        </p>

        {/* Strategy Tip */}
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3 mb-6 text-left flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-600 dark:text-slate-300">
            <span className="font-bold text-amber-600 dark:text-amber-300">
              {isTimeExpired ? 'Speed Training Tip: ' : 'HelpfulGames Tip: '}
            </span>
            {isTimeExpired
              ? 'Subvocalize the card names and quadrant locations as soon as you flip them. Dual-coding verbal + spatial coordinates cuts recognition latency by up to 40%!'
              : 'A miss only registers when you uncover a card you\'ve already seen before without pairing it. Once you reveal your first card, deliberately recall if you\'ve seen its twin before flipping!'}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onTryAgain}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Level Again</span>
          </button>

          <button
            onClick={onChooseLevel}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-xs border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            {isCustomLevel ? (
              <>
                <Sliders className="w-3.5 h-3.5 text-amber-500" />
                <span>Adjust Custom Sandbox Settings</span>
              </>
            ) : (
              <>
                <Menu className="w-3.5 h-3.5" />
                <span>Select Another Level</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
