import React from 'react';
import { X, Brain, CheckCircle, AlertTriangle, Sparkles, Trophy, Lightbulb } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">How to Play & Cognitive Rules</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">HelpfulGames Memory Gym scientific system</p>
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
          
          {/* Section 1: Objective & 30 Levels */}
          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2 mb-2">
              <span className="text-emerald-600 dark:text-emerald-400">1.</span> 30 Progressive Cognitive Levels
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              The game features 30 levels organized into 10 stages of increasing grid sizes (from 12 cards up to 54 cards). Each stage contains 3 difficulty variants:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">Standard</span>
                No miss limits. Master card locations at your own pace.
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
                <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">Challenging</span>
                Allowed miss limit (e.g. 1 to 12 misses). Tests mental control.
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40">
                <span className="font-bold text-rose-700 dark:text-rose-400 block mb-1">Perfect Mode</span>
                Zero misses allowed! Complete the board with absolute precision.
              </div>
            </div>
          </div>

          {/* Section 2: What is a "Miss"? */}
          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>What Counts as a &quot;Miss&quot;?</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
              In HelpfulGames rules, flipping unknown cards to discover what is underneath is <strong className="text-slate-900 dark:text-white">NOT</strong> a miss.
            </p>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-xs">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 dark:text-white">No Miss:</strong> Flipping fresh, unseen cards to discover their symbols.</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900 dark:text-white">Miss:</strong> Uncovering a card you have ALREADY seen previously, but failing to pair it with its match!</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              This rule trains you to actively maintain visual locations in your working memory and think deliberately before flipping your second card.
            </p>
          </div>

          {/* Section 3: Knowledge Points & Medals */}
          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>Knowledge Points & 90 Medals</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span><strong className="text-slate-900 dark:text-white">Knowledge Points:</strong> Earn 1 KP for each unique level cleared (30 KP max).</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center font-medium">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-base mb-0.5">🥉</div>
                  <div className="text-slate-900 dark:text-white font-bold">Bronze Medal</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Complete 2 times</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-base mb-0.5">🥈</div>
                  <div className="text-slate-900 dark:text-white font-bold">Silver Medal</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Complete 5 times</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-base mb-0.5">🥇</div>
                  <div className="text-slate-900 dark:text-white font-bold">Gold Medal</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Complete 10 times</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                Total available medals: 30 Bronze + 30 Silver + 30 Gold = 90 Medals!
              </p>
            </div>
          </div>

          {/* Section 4: Science & Cognitive Tips */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">Neuroplasticity Strategy:</div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Say the card name aloud (e.g. &quot;Koala, top right&quot;) when revealed. Combining verbal coding with visual spatial coordinates doubles memory retention in the hippocampus!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-sm"
          >
            Got it, Let&apos;s Train!
          </button>
        </div>
      </div>
    </div>
  );
};
