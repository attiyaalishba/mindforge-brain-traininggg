import React from 'react';
import { CardItem } from '../types/game';
import { Sparkles, Brain } from 'lucide-react';

interface MemoryCardProps {
  card: CardItem;
  onClick: () => void;
  disabled: boolean;
  isShaking?: boolean;
  compact?: boolean;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  card,
  onClick,
  disabled,
  isShaking = false,
  compact = false,
}) => {
  const isRevealed = card.isFlipped || card.isMatched;

  return (
    <div
      onClick={!disabled && !isRevealed ? onClick : undefined}
      className={`relative w-full aspect-[4/5] perspective-1000 select-none ${
        !disabled && !isRevealed 
          ? 'cursor-pointer hover:scale-[1.04] hover:-translate-y-1 active:scale-[0.98]' 
          : 'cursor-default'
      } transition-all duration-200 ${isShaking ? 'animate-card-shake' : ''}`}
      role="button"
      tabIndex={!disabled && !isRevealed ? 0 : -1}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isRevealed) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={isRevealed ? card.label : 'Hidden memory card'}
    >
      <div
        className={`w-full h-full duration-300 transform-style-preserve-3d transition-transform rounded-xl sm:rounded-2xl ${
          isRevealed ? 'rotate-y-180' : ''
        }`}
      >
        {/* CARD FRONT (HIDDEN FACE / DECK COVER) */}
        <div
          className={`absolute inset-0 backface-hidden rounded-xl sm:rounded-2xl border flex flex-col items-center justify-center p-1 sm:p-1.5 shadow-sm dark:shadow-md transition-all ${
            !disabled
              ? 'bg-gradient-to-br from-emerald-50/95 via-white to-slate-100 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 border-slate-300/90 hover:border-emerald-500 dark:border-slate-700 dark:hover:border-emerald-400 dark:shadow-slate-950/60 hover:shadow-md'
              : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80'
          }`}
        >
          {/* Deck Pattern */}
          <div className="w-full h-full rounded-lg sm:rounded-xl border border-dashed border-slate-300 dark:border-slate-700/70 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/40 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-amber-500/10" />
            <Brain className={`${compact ? 'w-4 h-4' : 'w-5 h-5 sm:w-7 sm:h-7'} text-emerald-500 dark:text-emerald-400/80 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors drop-shadow-xs`} />
            <span className="absolute bottom-1 text-[9px] font-mono font-bold text-slate-400/80 dark:text-slate-600 hidden md:block">
              ?
            </span>
          </div>
        </div>

        {/* CARD BACK (REVEALED CONTENT) */}
        <div
          className={`absolute inset-0 rotate-y-180 backface-hidden rounded-xl sm:rounded-2xl border flex flex-col items-center justify-center p-1 sm:p-1.5 shadow-md dark:shadow-xl transition-all ${
            card.isMatched
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 dark:border-emerald-500/80 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/30'
              : 'bg-white dark:bg-slate-850 border-emerald-500 dark:border-emerald-400 text-slate-900 dark:text-white ring-1 ring-emerald-500/20'
          }`}
        >
          {/* Matched badge */}
          {card.isMatched && (
            <div className="absolute top-1 right-1 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            </div>
          )}

          {/* Symbol Emoji / Icon */}
          <span
            className={`transition-transform duration-200 ${
              compact
                ? 'text-xl sm:text-2xl'
                : 'text-2xl sm:text-4xl md:text-5xl'
            } ${card.isMatched ? 'scale-110 drop-shadow-sm' : ''}`}
          >
            {card.symbol}
          </span>

          {/* Label name (for cognitive verbalization) */}
          {!compact && (
            <span
              className={`mt-1 text-[10px] sm:text-xs font-bold tracking-tight truncate max-w-[90%] text-center ${
                card.isMatched ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {card.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
