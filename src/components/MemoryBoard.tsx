import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CardItem, CardThemeId, LevelConfig } from '../types/game';
import { CARD_THEMES } from '../data/themes';
import { calculateLevelTimerSec } from '../data/levels';
import { soundManager } from '../utils/sound';
import { calculateGameScore, formatScore, ScoreBreakdown } from '../utils/score';
import { MemoryCard } from './MemoryCard';
import confetti from 'canvas-confetti';
import { 
  RotateCcw, 
  Eye, 
  Clock, 
  Target, 
  AlertTriangle, 
  Layers, 
  Palette, 
  Pause, 
  Play, 
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Sparkles,
  Trophy,
  Sliders,
  Zap,
  Brain
} from 'lucide-react';

export type BoardPlayState = 'ready' | 'loading' | 'countdown' | 'playing' | 'game_over';

interface MemoryBoardProps {
  levelConfig: LevelConfig;
  onLevelComplete: (
    timeSec: number, 
    moves: number, 
    misses: number, 
    stars: number, 
    score: number, 
    scoreBreakdown: ScoreBreakdown
  ) => void;
  onGameOver: (reason: string, misses: number, allowedMisses: number) => void;
  onOpenLevelSelector: () => void;
  onNextLevel?: () => void;
  onPrevLevel?: () => void;
  selectedThemeId: CardThemeId;
  onChangeTheme: (theme: CardThemeId) => void;
  onOpenCustomConfig?: () => void;
  bestScore?: number;
}

export const MemoryBoard: React.FC<MemoryBoardProps> = ({
  levelConfig,
  onLevelComplete,
  onGameOver,
  onOpenLevelSelector,
  onNextLevel,
  onPrevLevel,
  selectedThemeId,
  onChangeTheme,
  onOpenCustomConfig,
  bestScore,
}) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [moves, setMoves] = useState<number>(0);
  const [misses, setMisses] = useState<number>(0);
  const [matchesFound, setMatchesFound] = useState<number>(0);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [hasPeeked, setHasPeeked] = useState<boolean>(false);
  const [shakingIndices, setShakingIndices] = useState<number[]>([]);

  // Live Score & Combo Streak States
  const [liveScore, setLiveScore] = useState<number>(0);
  const [comboStreak, setComboStreak] = useState<number>(0);
  const [accumulatedStreakBonus, setAccumulatedStreakBonus] = useState<number>(0);

  // Start & Loading Game Flow States
  const [playState, setPlayState] = useState<BoardPlayState>('ready');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingStatusText, setLoadingStatusText] = useState<string>('Preparing cards...');
  const [countdownVal, setCountdownVal] = useState<number | string | null>(null);
  const [timerDisplayMode, setTimerDisplayMode] = useState<'countdown' | 'elapsed'>('countdown');

  // Exact card-calibrated level timer
  const allocatedTimeSec = levelConfig.timeLimitSec || calculateLevelTimerSec(levelConfig.cardCount, levelConfig.variant);
  const remainingSec = Math.max(0, allocatedTimeSec - secondsElapsed);
  const isTimeUp = remainingSec === 0 || playState === 'game_over';
  const isLowTime = remainingSec <= 10 && remainingSec > 0 && playState === 'playing';
  const timerPercent = Math.max(0, Math.min(100, (remainingSec / allocatedTimeSec) * 100));

  const timerRef = useRef<number | null>(null);
  const loadingIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Initialize and shuffle cards for the level
  const initBoard = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    const theme = CARD_THEMES[selectedThemeId] || CARD_THEMES.animals;
    const pairCount = levelConfig.pairCount;
    
    // Pick unique items from the theme, recycling if needed
    const shuffledThemeItems = [...theme.items].sort(() => Math.random() - 0.5);
    const chosenItems: { symbol: string; label: string }[] = [];
    for (let i = 0; i < pairCount; i++) {
      if (i < shuffledThemeItems.length) {
        chosenItems.push(shuffledThemeItems[i]);
      } else {
        const base = shuffledThemeItems[i % shuffledThemeItems.length];
        chosenItems.push({
          symbol: base.symbol,
          label: `${base.label} +`,
        });
      }
    }

    // Create pairs
    const deck: CardItem[] = [];
    chosenItems.forEach((item, index) => {
      deck.push({
        id: `card-${index}-a`,
        pairId: index,
        symbol: item.symbol,
        label: item.label,
        isFlipped: false,
        isMatched: false,
        seenCount: 0,
      });
      deck.push({
        id: `card-${index}-b`,
        pairId: index,
        symbol: item.symbol,
        label: item.label,
        isFlipped: false,
        isMatched: false,
        seenCount: 0,
      });
    });

    // Shuffle deck
    const shuffledDeck = deck.sort(() => Math.random() - 0.5);

    setCards(shuffledDeck);
    setFlippedIndices([]);
    setIsProcessing(false);
    setMoves(0);
    setMisses(0);
    setMatchesFound(0);
    setSecondsElapsed(0);
    setIsPaused(false);
    setHasPeeked(false);
    setShakingIndices([]);
    setCountdownVal(null);
    setLiveScore(0);
    setComboStreak(0);
    setAccumulatedStreakBonus(0);

    // FLOW: FIRST LOADING, THEN START SCREEN, THEN PLAY!
    setPlayState('loading');
    setLoadingProgress(0);
    setLoadingStatusText(`Shuffling ${levelConfig.cardCount} memory cards...`);
    soundManager.playCardDeal();

    const startTime = Date.now();
    const duration = 900; // ms smooth game load

    loadingIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setLoadingProgress(pct);

      if (pct < 35) {
        setLoadingStatusText(`Shuffling ${levelConfig.cardCount} memory cards...`);
      } else if (pct < 70) {
        setLoadingStatusText('Dealing cards onto grid...');
      } else if (pct < 95) {
        setLoadingStatusText('Calibrating spatial recall layout...');
      } else {
        setLoadingStatusText('Deck ready!');
        if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);

        setTimeout(() => {
          setPlayState('ready');
          soundManager.playCountdownBeep(false);
        }, 150);
      }
    }, 30);
  }, [levelConfig, selectedThemeId]);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Start Game Sequence: When user clicks START GAME in 'ready' state -> 3-2-1-GO! Countdown -> Playing
  const handleStartGame = useCallback(() => {
    if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setPlayState('countdown');
    setCountdownVal(3);
    soundManager.playCountdownBeep(false);

    let count = 3;
    countdownIntervalRef.current = window.setInterval(() => {
      count -= 1;
      if (count === 2) {
        setCountdownVal(2);
        soundManager.playCountdownBeep(false);
      } else if (count === 1) {
        setCountdownVal(1);
        soundManager.playCountdownBeep(false);
      } else if (count === 0) {
        setCountdownVal('GO!');
        soundManager.playCountdownBeep(true);
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setPlayState('playing');
        setCountdownVal(null);
        setSecondsElapsed(0);
      }
    }, 600);
  }, []);

  // Skip loading straight to the Ready / Start screen
  const handleSkipLoadingToReady = useCallback(() => {
    if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    setLoadingProgress(100);
    setPlayState('ready');
    soundManager.playCountdownBeep(false);
  }, []);

  // Quick launch into game skipping countdown
  const handleSkipToPlay = useCallback(() => {
    if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    soundManager.playCountdownBeep(true);
    setPlayState('playing');
    setLoadingProgress(100);
    setCountdownVal(null);
    setSecondsElapsed(0);
  }, []);

  // Spacebar starts game when in ready state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && playState === 'ready') {
        e.preventDefault();
        handleStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playState, handleStartGame]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Game timer loop - ticks while playing and immediately ends the game when time expires
  useEffect(() => {
    if (playState === 'playing' && !isPaused && matchesFound < levelConfig.pairCount) {
      timerRef.current = window.setInterval(() => {
        setSecondsElapsed((prev) => {
          const next = prev + 1;
          // When time is up, the game MUST end and not continue!
          if (next >= allocatedTimeSec) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setPlayState('game_over');
            soundManager.playGameOver();
            onGameOver(
              `Time's Up! The ${allocatedTimeSec}s timer calibrated for ${levelConfig.cardCount} cards ran out before all ${levelConfig.pairCount} pairs were matched.`,
              misses,
              levelConfig.allowedMisses
            );
            return allocatedTimeSec;
          }
          return next;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [playState, isPaused, matchesFound, levelConfig.pairCount, allocatedTimeSec, levelConfig.cardCount, levelConfig.allowedMisses, misses, onGameOver]);

  // Victory celebration
  const handleVictory = (finalTime: number, finalMoves: number, finalMisses: number, currentStreakBonus: number) => {
    soundManager.playVictory();

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#38bdf8', '#10b981', '#f59e0b'],
      });
    } catch {
      // ignore
    }

    // Calculate stars: 3 stars = fast & low misses, 2 stars = moderate, 1 star = completed
    let stars = 1;
    if (finalMisses <= Math.max(1, Math.floor(levelConfig.pairCount / 3))) {
      stars = 2;
      if (finalTime <= levelConfig.targetTimeSec) {
        stars = 3;
      }
    }

    const breakdown = calculateGameScore(
      levelConfig.pairCount,
      levelConfig.variant,
      finalTime,
      allocatedTimeSec,
      finalMoves,
      finalMisses,
      stars,
      currentStreakBonus
    );

    setLiveScore(breakdown.totalScore);
    onLevelComplete(finalTime, finalMoves, finalMisses, stars, breakdown.totalScore, breakdown);
  };

  // Card click handler
  const handleCardClick = (clickedIndex: number) => {
    if (playState !== 'playing' || isProcessing || isPaused) return;

    const clickedCard = cards[clickedIndex];
    if (clickedCard.isFlipped || clickedCard.isMatched) return;

    soundManager.playFlip();

    const newFlipped = [...flippedIndices, clickedIndex];
    setFlippedIndices(newFlipped);

    // Update card: flip it and increment its seenCount
    const updatedCards = [...cards];
    updatedCards[clickedIndex] = {
      ...updatedCards[clickedIndex],
      isFlipped: true,
      seenCount: updatedCards[clickedIndex].seenCount + 1,
    };
    setCards(updatedCards);

    // If second card flipped, check for match
    if (newFlipped.length === 2) {
      setIsProcessing(true);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = updatedCards[firstIdx];
      const secondCard = updatedCards[secondIdx];
      const nextMoves = moves + 1;
      setMoves(nextMoves);

      // Check match
      if (firstCard.pairId === secondCard.pairId) {
        // MATCH!
        setTimeout(() => {
          soundManager.playMatch();
          const matchedCards = updatedCards.map((c, i) =>
            i === firstIdx || i === secondIdx ? { ...c, isMatched: true, isFlipped: false } : c
          );
          setCards(matchedCards);
          setFlippedIndices([]);
          setIsProcessing(false);
          const nextMatches = matchesFound + 1;
          setMatchesFound(nextMatches);

          // Update combo streak and live score points
          const nextStreak = comboStreak + 1;
          const streakBonus = (nextStreak - 1) * 25;
          const matchPoints = 100 + streakBonus;
          setComboStreak(nextStreak);
          const nextAccumulatedStreak = accumulatedStreakBonus + streakBonus;
          setAccumulatedStreakBonus(nextAccumulatedStreak);
          setLiveScore((prev) => prev + matchPoints);

          // Check Win Condition
          if (nextMatches === levelConfig.pairCount) {
            handleVictory(secondsElapsed, nextMoves, misses, nextAccumulatedStreak);
          }
        }, 320);
      } else {
        // MISMATCH!
        // HelpfulGames Miss detection:
        // A "miss" happens when you flip a card you've previously seen, but it doesn't match!
        const isMiss = firstCard.seenCount > 1 || secondCard.seenCount > 1;
        const newMisses = isMiss ? misses + 1 : misses;

        if (isMiss) {
          setMisses(newMisses);
          soundManager.playMiss();
          setShakingIndices([firstIdx, secondIdx]);
          setComboStreak(0);
        }

        // Mismatch memory decay duration (customizable via Difficulty / Sandbox)
        const decayDelayMs = levelConfig.memoryDecaySpeedMs ?? 850;

        // Check fail condition for Challenging or Perfect levels
        if (newMisses > levelConfig.allowedMisses) {
          const failDelay = Math.min(850, Math.max(350, decayDelayMs));
          setPlayState('game_over');
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setTimeout(() => {
            soundManager.playGameOver();
            onGameOver(
              levelConfig.variant === 'perfect'
                ? 'Zero misses allowed in Perfect mode! You uncovered a previously seen card without matching.'
                : `Exceeded the allowed misses limit (${levelConfig.allowedMisses} max).`,
              newMisses,
              levelConfig.allowedMisses
            );
            setIsProcessing(false);
          }, failDelay);
          return;
        }

        // Flip back after brief glance governed by memory decay speed
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
          setIsProcessing(false);
          setShakingIndices([]);
        }, decayDelayMs);
      }
    }
  };

  // Peek Power-up (flash all cards for 1.2 seconds, penalty: counts as 1 move)
  const handlePeek = () => {
    if (playState !== 'playing' || hasPeeked || isProcessing || isPaused) return;
    setHasPeeked(true);
    setIsProcessing(true);
    soundManager.playFlip();

    // Flip all unmatched cards face-up
    setCards((prev) => prev.map((c) => (c.isMatched ? c : { ...c, isFlipped: true })));

    setTimeout(() => {
      setCards((prev) => prev.map((c) => (c.isMatched ? c : { ...c, isFlipped: false })));
      setIsProcessing(false);
      setMoves((m) => m + 1);
    }, 1200);
  };

  // Dynamic grid column setup based on exact HelpfulGames card counts: 12, 16, 20, 24, 28, 30, 36, 42, 48, 54
  const getGridColsClass = (totalCards: number) => {
    if (totalCards <= 12) return 'grid-cols-3 sm:grid-cols-4 max-w-xl';
    if (totalCards <= 16) return 'grid-cols-4 max-w-xl';
    if (totalCards <= 20) return 'grid-cols-4 sm:grid-cols-5 max-w-2xl';
    if (totalCards <= 24) return 'grid-cols-4 sm:grid-cols-6 max-w-3xl';
    if (totalCards <= 28) return 'grid-cols-4 sm:grid-cols-7 max-w-3xl';
    if (totalCards <= 30) return 'grid-cols-5 sm:grid-cols-6 max-w-3xl';
    if (totalCards <= 36) return 'grid-cols-6 max-w-4xl';
    if (totalCards <= 42) return 'grid-cols-6 sm:grid-cols-7 max-w-4xl';
    if (totalCards <= 48) return 'grid-cols-6 sm:grid-cols-8 max-w-5xl';
    return 'grid-cols-6 sm:grid-cols-9 max-w-5xl';
  };

  const isCompact = cards.length >= 24;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const missWarningThreshold = levelConfig.allowedMisses !== Infinity && levelConfig.allowedMisses > 0
    ? levelConfig.allowedMisses - 1
    : -1;

  const isAllMatched = matchesFound === levelConfig.pairCount && levelConfig.pairCount > 0;

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto px-2 sm:px-4 py-3">
      
      {/* Top Level Banner & Controls */}
      <div className="w-full bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 mb-3 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Level Info & Stage Stepper */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Level Stepper Buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
              {levelConfig.levelNumber !== 99 && onPrevLevel && (
                <button
                  onClick={onPrevLevel}
                  disabled={levelConfig.levelNumber <= 1}
                  className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors"
                  title="Previous Level"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {levelConfig.levelNumber === 99 ? (
                <button
                  onClick={onOpenCustomConfig || onOpenLevelSelector}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm shadow-amber-500/30 transition-transform active:scale-95 cursor-pointer"
                  title="Configure Custom Sandbox Settings"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Sandbox</span>
                </button>
              ) : (
                <button
                  onClick={onOpenLevelSelector}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-sm sm:text-base flex items-center gap-1 shadow-sm shadow-emerald-600/30 transition-transform active:scale-95 cursor-pointer"
                  title="Select Level from Grid"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>L{levelConfig.levelNumber}</span>
                </button>
              )}

              {levelConfig.levelNumber !== 99 && onNextLevel && (
                <button
                  onClick={onNextLevel}
                  disabled={levelConfig.levelNumber >= 30}
                  className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors"
                  title="Next Level"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {levelConfig.title}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className={`font-semibold capitalize ${
                    levelConfig.variant === 'standard'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : levelConfig.variant === 'challenging'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {levelConfig.variant}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{levelConfig.cardCount} Cards ({levelConfig.pairCount} Pairs)</span>
                  {levelConfig.memoryDecaySpeedMs && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-amber-600 dark:text-amber-400">{levelConfig.memoryDecaySpeedMs}ms decay</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {levelConfig.description}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Custom Sandbox Config shortcut button */}
            {levelConfig.levelNumber === 99 && onOpenCustomConfig && (
              <button
                onClick={onOpenCustomConfig}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-bold cursor-pointer transition-colors"
                title="Open Sandbox Settings to adjust difficulty, decay speed, or board size"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}

            {/* Theme Selector Dropdown */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
              <Palette className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <select
                value={selectedThemeId}
                onChange={(e) => onChangeTheme(e.target.value as CardThemeId)}
                className="bg-transparent text-slate-800 dark:text-white text-xs font-semibold focus:outline-none cursor-pointer"
                title="Card Visual Theme"
              >
                {Object.values(CARD_THEMES).map((t) => (
                  <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                    {t.icon} {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Start Button in Toolbar when in Ready State */}
            {playState === 'ready' && (
              <button
                onClick={handleStartGame}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 hover:from-emerald-500 hover:to-amber-400 text-white text-xs font-black shadow-md shadow-emerald-500/25 cursor-pointer transition-all hover:scale-105 active:scale-95 animate-pulse"
                title="Start Game (Press Space or Click)"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>START</span>
              </button>
            )}

            {/* Peek power-up */}
            <button
              onClick={handlePeek}
              disabled={playState !== 'playing' || hasPeeked || isProcessing || isPaused || isAllMatched}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                playState !== 'playing' || hasPeeked || isAllMatched
                  ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-50'
                  : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              }`}
              title={playState !== 'playing' ? 'Start game first to use Peek' : hasPeeked ? 'Peek already used this round' : 'Peek all cards for 1.2s (+1 move penalty)'}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Peek</span>
            </button>

            {/* Pause */}
            <button
              onClick={() => setIsPaused((p) => !p)}
              disabled={playState !== 'playing' || isAllMatched}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer disabled:opacity-40"
              title={playState !== 'playing' ? 'Start game first' : isPaused ? 'Resume Game' : 'Pause Game'}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Pause className="w-4 h-4" />}
            </button>

            {/* Restart */}
            <button
              onClick={initBoard}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
              title="Reset Level"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live HUD Counters: Score, Time, Matches, Moves, Misses */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
          
          {/* Live Game Score */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-slate-900/60 p-2 rounded-xl border border-amber-200/80 dark:border-amber-500/30 text-center col-span-2 sm:col-span-1 shadow-xs">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Score</span>
              {comboStreak > 1 && (
                <span className="text-[9px] font-black uppercase px-1 py-0.2 bg-amber-500 text-white rounded-md animate-pulse">
                  {comboStreak}x
                </span>
              )}
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-amber-800 dark:text-amber-300 mt-0.5 tracking-tight">
              {formatScore(liveScore)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
              {bestScore && bestScore > 0 ? `Best: ${formatScore(bestScore)}` : 'First Play'}
            </div>
          </div>

          {/* Card-Calibrated Level Timer */}
          <button
            type="button"
            onClick={() => setTimerDisplayMode((m) => (m === 'countdown' ? 'elapsed' : 'countdown'))}
            className={`p-2 rounded-xl border text-center transition-all cursor-pointer relative overflow-hidden group ${
              isTimeUp
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700'
                : isLowTime
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 animate-pulse'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            title={`Timer calibrated for ${levelConfig.cardCount} cards (${allocatedTimeSec}s limit). Click to toggle Countdown / Elapsed.`}
          >
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <Clock className={`w-3.5 h-3.5 ${isTimeUp || isLowTime ? 'text-rose-500' : 'text-emerald-500 dark:text-emerald-400'}`} />
              <span>{isTimeUp ? "Time's Up!" : timerDisplayMode === 'countdown' ? 'Time Left' : 'Time'}</span>
            </div>
            <div className={`text-sm sm:text-base font-black font-mono mt-0.5 tracking-tight ${
              isTimeUp || isLowTime
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-900 dark:text-white'
            }`}>
              {timerDisplayMode === 'countdown' ? `${remainingSec}s` : formatTime(secondsElapsed)}
              <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                /{allocatedTimeSec}s
              </span>
            </div>
            
            {/* Live Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isTimeUp
                    ? 'bg-rose-500'
                    : isLowTime
                    ? 'bg-rose-500'
                    : timerPercent <= 30
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${timerPercent}%` }}
              />
            </div>
          </button>

          {/* Matches Progress */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <Target className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Pairs</span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-300 mt-0.5">
              {matchesFound} / {levelConfig.pairCount}
            </div>
          </div>

          {/* Moves */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Moves</span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
              {moves}
            </div>
          </div>

          {/* HelpfulGames Misses */}
          <div
            className={`p-2 rounded-xl border transition-colors ${
              levelConfig.allowedMisses === 0
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-500/30'
                : misses > missWarningThreshold && levelConfig.allowedMisses !== Infinity
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/40 animate-pulse'
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <AlertTriangle className={`w-3.5 h-3.5 ${levelConfig.allowedMisses === 0 ? 'text-rose-500 dark:text-rose-400' : 'text-amber-500 dark:text-amber-400'}`} />
              <span>Misses</span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">
              {misses}
              <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                {levelConfig.allowedMisses === Infinity ? ' / ∞' : ` / ${levelConfig.allowedMisses}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* In-Board Completion Banner (Direct Next Level Advance) */}
      {isAllMatched && (
        <div className="w-full bg-gradient-to-r from-emerald-50 via-white to-indigo-50 dark:from-emerald-950/80 dark:via-slate-900 dark:to-indigo-950/80 border border-emerald-300 dark:border-emerald-500/40 rounded-2xl p-4 mb-4 shadow-md dark:shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-amber-500 dark:text-amber-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {levelConfig.levelNumber === 99 ? 'Custom Sandbox Cleared!' : `Level ${levelConfig.levelNumber} Completed!`}
                </h3>
                <span className="text-xs bg-amber-500/15 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-black font-mono">
                  ★ {formatScore(liveScore)} PTS
                </span>
                <span className="text-xs bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                  {formatTime(secondsElapsed)} • {moves} moves
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 flex flex-wrap items-center gap-1.5">
                <span>
                  {levelConfig.levelNumber === 99
                    ? `Completed with ${levelConfig.cardCount} cards, ${levelConfig.memoryDecaySpeedMs || 850}ms decay, and ${misses} misses!`
                    : levelConfig.levelNumber < 30
                    ? `Next Level (${levelConfig.levelNumber + 1}) expands the deck to ${levelConfig.cardCount + 2} cards!`
                    : 'You have mastered all 30 levels! Apex Grandmaster achieved!'}
                </span>
                {bestScore && liveScore > bestScore ? (
                  <span className="text-rose-600 dark:text-rose-400 font-bold">🏆 New High Score!</span>
                ) : bestScore && bestScore > 0 ? (
                  <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">(Record: {formatScore(bestScore)})</span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={initBoard}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors"
            >
              Replay Level ↺
            </button>

            {levelConfig.levelNumber === 99 && onOpenCustomConfig && (
              <button
                onClick={onOpenCustomConfig}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Sandbox Settings</span>
              </button>
            )}

            {onNextLevel && levelConfig.levelNumber < 30 && (
              <button
                onClick={onNextLevel}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
              >
                <span>Advance to Level {levelConfig.levelNumber + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Paused Overlay */}
      {isPaused && (
        <div className="my-10 text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl transition-colors">
          <Pause className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Game Paused</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Take a breath. Working memory thrives with calm focus.</p>
          <button
            onClick={() => setIsPaused(false)}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 cursor-pointer"
          >
            Resume Focus
          </button>
        </div>
      )}

      {/* Game State Overlay Area: Ready / Loading / Countdown / Playing */}
      {!isPaused && (
        <div className="relative w-full flex flex-col items-center">
          
          {/* STATE 2: Loading Sequence Screen (First: Loading) */}
          {playState === 'loading' && (
            <div className="w-full max-w-md mx-auto my-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-center animate-in fade-in duration-200 z-10">
              <div className="relative w-20 h-24 mx-auto mb-5">
                <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 rotate-6 transform origin-bottom animate-pulse" />
                <div className="absolute inset-0 rounded-2xl bg-teal-500/30 border border-teal-400/50 -rotate-6 transform origin-bottom animate-pulse" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 border border-white/30 flex items-center justify-center shadow-lg">
                  <Brain className="w-9 h-9 text-white animate-pulse" />
                </div>
              </div>

              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                Loading Level Deck
              </span>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                {levelConfig.levelNumber === 99 ? 'Custom Practice' : `Level ${levelConfig.levelNumber}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 font-medium min-h-[20px]">
                {loadingStatusText}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 p-0.5 border border-slate-200 dark:border-slate-700 overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400 rounded-full transition-all duration-75 shadow-sm"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-5 px-1">
                <span>{loadingProgress}% Loaded</span>
                <span>{levelConfig.cardCount} Cards ({levelConfig.pairCount} Pairs)</span>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleSkipLoadingToReady}
                  className="text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold cursor-pointer transition-colors"
                >
                  Skip to Start →
                </button>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <button
                  onClick={handleSkipToPlay}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                >
                  Quick Play ⚡
                </button>
              </div>
            </div>
          )}

          {/* STATE 1: Ready / Start Screen (Then: Start Game) */}
          {playState === 'ready' && (
            <div className="w-full max-w-xl mx-auto my-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200 z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-amber-400 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
                <Play className="w-8 h-8 fill-white ml-0.5" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{levelConfig.levelNumber === 99 ? 'Custom Practice Briefing' : `Level ${levelConfig.levelNumber} Ready`}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {levelConfig.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-5">
                {levelConfig.description}
              </p>

              {/* Level Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto mb-6 text-left">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Deck Size</span>
                  <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white">
                    {levelConfig.cardCount} Cards
                  </span>
                  <span className="text-[10px] text-slate-500 block">{levelConfig.pairCount} Pairs</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Miss Limit</span>
                  <span className={`text-sm sm:text-base font-black font-mono ${
                    levelConfig.allowedMisses === 0 
                      ? 'text-rose-600 dark:text-rose-400' 
                      : levelConfig.allowedMisses === Infinity 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {levelConfig.allowedMisses === Infinity ? 'Unlimited' : `${levelConfig.allowedMisses} Misses`}
                  </span>
                  <span className="text-[10px] text-slate-500 block capitalize">{levelConfig.variant} Mode</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Level Timer</span>
                  <span className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {allocatedTimeSec}s
                  </span>
                  <span className="text-[10px] text-slate-500 block">Scaled for {levelConfig.cardCount} Cards</span>
                </div>
              </div>

              {/* Big Play / Start Button */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleStartGame}
                  className="w-full sm:w-auto min-w-[240px] px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 hover:from-emerald-500 hover:to-amber-400 text-white font-black text-base sm:text-lg shadow-xl shadow-emerald-500/35 hover:shadow-emerald-500/50 flex items-center justify-center gap-3 cursor-pointer transition-all hover:scale-105 active:scale-95 group ring-4 ring-emerald-500/20"
                >
                  <Play className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" />
                  <span>START GAME</span>
                </button>

                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span>Click START or press</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono font-bold">SPACE</kbd>
                  <span>to play</span>
                </span>
              </div>
            </div>
          )}

          {/* STATE 3: Countdown Screen */}
          {playState === 'countdown' && (
            <div className="w-full max-w-sm mx-auto my-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 text-center animate-in zoom-in duration-200 z-10">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                Get Ready
              </div>

              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-amber-400 p-1 mx-auto mb-4 flex items-center justify-center shadow-xl shadow-emerald-500/25">
                <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                  <span className={`font-black font-mono tracking-tight animate-bounce ${
                    countdownVal === 'GO!'
                      ? 'text-3xl text-emerald-500'
                      : 'text-5xl text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {countdownVal}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {countdownVal === 'GO!' ? 'START MATCHING CARDS!' : 'Focus your working memory...'}
              </p>

              <button
                onClick={handleSkipToPlay}
                className="mt-4 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Skip Countdown →
              </button>
            </div>
          )}

          {/* STATE 4: Game Over Overlay (Time Expired / Round Ended) */}
          {playState === 'game_over' && (
            <div className="w-full max-w-sm mx-auto my-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-2xl p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200 z-10">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-500/20">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 mb-2">
                <span>Time Expired</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                Game Over
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                The {allocatedTimeSec}s timer has expired. The board is locked and cannot continue without restarting.
              </p>

              <div className="flex items-center justify-center gap-2.5">
                <button
                  onClick={initBoard}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={onOpenLevelSelector}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  <span>Select Level</span>
                </button>
              </div>
            </div>
          )}

          {/* Memory Cards Tabletop Felt Arena */}
          <div className="w-full flex justify-center py-2">
            <div
              className={`w-full p-3 sm:p-5 rounded-3xl bg-slate-900/30 dark:bg-slate-950/60 border border-slate-700/20 dark:border-slate-800/80 shadow-2xl backdrop-blur-xs flex justify-center transition-all ${
                playState !== 'playing'
                  ? 'opacity-35 pointer-events-none filter blur-[0.5px] scale-[0.98]'
                  : 'animate-in fade-in duration-300'
              }`}
            >
              <div
                className={`grid gap-2.5 sm:gap-3.5 w-full justify-center ${getGridColsClass(cards.length)}`}
              >
                {cards.map((card, index) => (
                  <MemoryCard
                    key={card.id}
                    card={card}
                    onClick={() => handleCardClick(index)}
                    disabled={playState !== 'playing' || isProcessing || card.isMatched || card.isFlipped}
                    isShaking={shakingIndices.includes(index)}
                    compact={isCompact}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* HelpfulGames Miss Rule Clarification Footer */}
      <div className="mt-4 text-center text-[11px] text-slate-500 max-w-lg">
        💡 <span className="font-semibold text-slate-400">Cognitive rule:</span> A &quot;Miss&quot; is only recorded when you uncover an already seen card without matching it. New cards can be explored without penalty!
      </div>
    </div>
  );
};
