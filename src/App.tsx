import { useState } from 'react';
import { getLevelConfig } from './data/levels';
import { CardThemeId, GameMode, LevelConfig, PlayerStats } from './types/game';
import { ScoreBreakdown } from './utils/score';
import { soundManager } from './utils/sound';
import {
  getLocalDateString,
  loadPlayerStats,
  recordLevelSuccess,
  resetKnowledgePointsHistory,
  savePlayerStats
} from './utils/storage';

import helpfulGamesBg from './assets/images/helpfulgames_vibrant_bg_1790111676710.jpg';
import { CustomGameConfig } from './components/CustomGameConfig';
import { GameOverModal } from './components/GameOverModal';
import { Header } from './components/Header';
import { HelpfulGamesLevelList } from './components/HelpfulGamesLevelList';
import { HowToPlayModal } from './components/HowToPlayModal';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { LevelSelectorModal } from './components/LevelSelectorModal';
import { MemoryBoard } from './components/MemoryBoard';
import { StatsModal } from './components/StatsModal';

export default function App() {
  const [stats, setStats] = useState<PlayerStats>(loadPlayerStats);
  const [currentMode, setCurrentMode] = useState<GameMode>('levels');
  const [levelsSubView, setLevelsSubView] = useState<'board' | 'list'>('board');
  const [activeLevelNumber, setActiveLevelNumber] = useState<number>(1);
  const [boardSessionId, setBoardSessionId] = useState<number>(0);
  const [customLevelConfig, setCustomLevelConfig] = useState<LevelConfig | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<CardThemeId>('animals');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundManager.isEnabled());

  // Modals state
  const [isLevelSelectorOpen, setIsLevelSelectorOpen] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);

  // Victory modal state
  const [victoryState, setVictoryState] = useState<{
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
  } | null>(null);

  // Game over modal state
  const [gameOverState, setGameOverState] = useState<{
    isOpen: boolean;
    levelConfig: LevelConfig;
    reason: string;
    misses: number;
    allowedMisses: number;
  } | null>(null);

  // Sync state changes with soundManager
  const handleToggleSound = () => {
    const updated = soundManager.toggleSound();
    setSoundEnabled(updated);
  };

  const handleUpdateStats = (newStats: PlayerStats) => {
    setStats(newStats);
    savePlayerStats(newStats);
  };

  const handleResetProgress = () => {
    const freshStats: PlayerStats = {
      unlockedLevel: 1,
      knowledgePoints: 0,
      levels: {},
      totalGamesPlayed: 0,
      totalMatchesFound: 0,
      totalScore: 0,
      highScore: 0,
      currentStreak: 1,
      longestStreak: 1,
      lastLoginDate: getLocalDateString(),
    };
    handleUpdateStats(freshStats);
    resetKnowledgePointsHistory();
    setActiveLevelNumber(1);
    setBoardSessionId((id) => id + 1);
  };

  // Called when player successfully matches all pairs
  const handleLevelComplete = (
    timeSec: number, 
    moves: number, 
    misses: number, 
    stars: number,
    score: number,
    scoreBreakdown: ScoreBreakdown
  ) => {
    const config = currentMode === 'custom' && customLevelConfig
      ? customLevelConfig
      : getLevelConfig(activeLevelNumber);

    if (config.levelNumber <= 30) {
      const { updatedStats, isFirstCompletion, newMedalsAwarded, isNewHighScore, bestScore } = recordLevelSuccess(
        stats,
        config.levelNumber,
        timeSec,
        moves,
        misses,
        stars,
        score
      );
      setStats(updatedStats);

      const levelData = updatedStats.levels[config.levelNumber];
      setVictoryState({
        isOpen: true,
        levelConfig: config,
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
        totalCompletions: levelData?.completions || 1,
      });
    } else {
      // Custom Game Complete
      setVictoryState({
        isOpen: true,
        levelConfig: config,
        timeSec,
        moves,
        misses,
        stars,
        score,
        bestScore: score,
        isNewHighScore: true,
        scoreBreakdown,
        isFirstCompletion: false,
        newMedalsAwarded: [],
        totalCompletions: 1,
      });
    }
  };

  // Called when allowed misses limit is breached
  const handleGameOver = (reason: string, misses: number, allowedMisses: number) => {
    const config = currentMode === 'custom' && customLevelConfig
      ? customLevelConfig
      : getLevelConfig(activeLevelNumber);

    setGameOverState({
      isOpen: true,
      levelConfig: config,
      reason,
      misses,
      allowedMisses,
    });
  };

  // Select next level (advances level and expands card count)
  const handleNextLevel = () => {
    setVictoryState(null);
    setGameOverState(null);
    if (activeLevelNumber < 30) {
      setActiveLevelNumber((prev) => prev + 1);
      setCurrentMode('levels');
      setBoardSessionId((id) => id + 1);
    }
  };

  // Select previous level
  const handlePrevLevel = () => {
    setVictoryState(null);
    setGameOverState(null);
    if (activeLevelNumber > 1) {
      setActiveLevelNumber((prev) => prev - 1);
      setCurrentMode('levels');
      setBoardSessionId((id) => id + 1);
    }
  };

  // Replay current level
  const handleReplayCurrentLevel = () => {
    setVictoryState(null);
    setGameOverState(null);
    setBoardSessionId((id) => id + 1);
  };

  // Launch custom practice
  const handleStartCustomGame = (config: LevelConfig, themeId: CardThemeId) => {
    setCustomLevelConfig(config);
    setSelectedThemeId(themeId);
    setCurrentMode('custom');
    setBoardSessionId((id) => id + 1);
  };

  const activeConfig = currentMode === 'custom' && customLevelConfig
    ? customLevelConfig
    : getLevelConfig(activeLevelNumber);

  return (
    <div
      className="min-h-screen relative bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-emerald-500 selection:text-white bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(248, 250, 252, 0.82), rgba(241, 245, 249, 0.88)), url(${helpfulGamesBg})`,
      }}
    >
      {/* Dark theme wallpaper overlay for background image */}
      <div
        className="hidden dark:block absolute inset-0 bg-slate-950/80 pointer-events-none z-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.90)), url(${helpfulGamesBg})`,
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* App Header & Gamification Bar */}
        <Header
          currentMode={currentMode}
          onSelectMode={(mode) => {
            setCurrentMode(mode);
            setVictoryState(null);
            setGameOverState(null);
          }}
          stats={stats}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          onOpenStats={() => setIsStatsOpen(true)}
          onOpenLevelSelector={() => setIsLevelSelectorOpen(true)}
          activeLevel={activeLevelNumber}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col items-center justify-start py-4 px-2 sm:px-4">
              
              {/* Sub-navigation for Levels Mode (Game Board vs HelpfulGames Level Directory) */}
              {currentMode === 'levels' && (
                <div className="w-full max-w-5xl flex items-center justify-between gap-2 mb-3 px-2">
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
                    <button
                      onClick={() => setLevelsSubView('board')}
                      className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        levelsSubView === 'board'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>Level {activeConfig.levelNumber} Board ({activeConfig.cardCount} Cards)</span>
                    </button>
                    <button
                      onClick={() => setLevelsSubView('list')}
                      className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        levelsSubView === 'list'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>Campaign Levels (1–30)</span>
                    </button>
                  </div>

                  {levelsSubView === 'board' && (
                    <button
                      onClick={() => setLevelsSubView('list')}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold flex items-center gap-1 bg-white hover:bg-slate-50 dark:bg-slate-900/80 dark:hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Browse All 30 Levels</span>
                      <span className="text-slate-400 dark:text-slate-500">→</span>
                    </button>
                  )}
                </div>
              )}

              {/* MODE: 30 Levels Campaign - Board View */}
              {currentMode === 'levels' && levelsSubView === 'board' && (
                <MemoryBoard
                  key={`${currentMode}-${activeConfig.levelNumber}-${selectedThemeId}-${boardSessionId}`}
                  levelConfig={activeConfig}
                  onLevelComplete={handleLevelComplete}
                  onGameOver={handleGameOver}
                  onOpenLevelSelector={() => setLevelsSubView('list')}
                  onNextLevel={activeLevelNumber < 30 ? handleNextLevel : undefined}
                  onPrevLevel={activeLevelNumber > 1 ? handlePrevLevel : undefined}
                  selectedThemeId={selectedThemeId}
                  onChangeTheme={setSelectedThemeId}
                  bestScore={stats.levels[activeConfig.levelNumber]?.bestScore}
                />
              )}

              {/* MODE: 30 Levels Campaign - HelpfulGames Level Directory View */}
              {currentMode === 'levels' && levelsSubView === 'list' && (
                <HelpfulGamesLevelList
                  currentLevelNumber={activeLevelNumber}
                  stats={stats}
                  onSelectLevel={(lvl) => {
                    setActiveLevelNumber(lvl);
                    setLevelsSubView('board');
                    setBoardSessionId((id) => id + 1);
                  }}
                  onUpdateStats={handleUpdateStats}
                />
              )}

              {/* MODE: Custom Practice Board (When active) */}
              {currentMode === 'custom' && customLevelConfig && (
                <MemoryBoard
                  key={`custom-${activeConfig.levelNumber}-${selectedThemeId}-${boardSessionId}`}
                  levelConfig={activeConfig}
                  onLevelComplete={handleLevelComplete}
                  onGameOver={handleGameOver}
                  onOpenLevelSelector={() => setIsLevelSelectorOpen(true)}
                  onOpenCustomConfig={() => setCustomLevelConfig(null)}
                  selectedThemeId={selectedThemeId}
                  onChangeTheme={setSelectedThemeId}
                />
              )}

              {/* MODE: Custom Practice Config (When not yet started) */}
              {currentMode === 'custom' && !customLevelConfig && (
                <CustomGameConfig
                  onStartCustomGame={handleStartCustomGame}
                  initialConfig={customLevelConfig}
                />
              )}
            </main>

            {/* Bottom Footer Info */}
            <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm py-3 text-center text-[11px] text-slate-500">
              MindForge Brain Training Gym • HelpfulGames Cognitive Memory System • 30 Progressive Levels (4 to 64 Expanding Cards) • 90 Medals
            </footer>
          </div>

      {/* Level Selector Modal */}
      <LevelSelectorModal
        isOpen={isLevelSelectorOpen}
        onClose={() => setIsLevelSelectorOpen(false)}
        onSelectLevel={(lvlNum) => {
          setActiveLevelNumber(lvlNum);
          setCurrentMode('levels');
          setBoardSessionId((id) => id + 1);
          setVictoryState(null);
          setGameOverState(null);
        }}
        currentLevelNumber={activeLevelNumber}
        stats={stats}
        onUpdateStats={handleUpdateStats}
      />

      {/* Victory / Level Complete Modal */}
      {victoryState && (
        <LevelCompleteModal
          isOpen={victoryState.isOpen}
          levelConfig={victoryState.levelConfig}
          timeSec={victoryState.timeSec}
          moves={victoryState.moves}
          misses={victoryState.misses}
          stars={victoryState.stars}
          score={victoryState.score}
          bestScore={victoryState.bestScore}
          isNewHighScore={victoryState.isNewHighScore}
          scoreBreakdown={victoryState.scoreBreakdown}
          isFirstCompletion={victoryState.isFirstCompletion}
          newMedalsAwarded={victoryState.newMedalsAwarded}
          totalCompletions={victoryState.totalCompletions}
          totalKnowledgePoints={stats.knowledgePoints}
          onNextLevel={handleNextLevel}
          onReplay={handleReplayCurrentLevel}
          onClose={() => {
            setVictoryState(null);
            if (currentMode === 'custom') {
              setCustomLevelConfig(null);
            } else {
              setIsLevelSelectorOpen(true);
            }
          }}
        />
      )}

      {/* Game Over Modal */}
      {gameOverState && (
        <GameOverModal
          isOpen={gameOverState.isOpen}
          levelConfig={gameOverState.levelConfig}
          reason={gameOverState.reason}
          misses={gameOverState.misses}
          allowedMisses={gameOverState.allowedMisses}
          onTryAgain={handleReplayCurrentLevel}
          onChooseLevel={() => {
            setGameOverState(null);
            if (currentMode === 'custom') {
              setCustomLevelConfig(null);
            } else {
              setIsLevelSelectorOpen(true);
            }
          }}
        />
      )}

      {/* How To Play Modal */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      {/* Stats & Brain Profile Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        onResetProgress={handleResetProgress}
      />
    </div>
  );
}
