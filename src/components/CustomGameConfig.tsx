import React, { useState, useEffect, useRef } from 'react';
import { CardThemeId, LevelConfig, LevelVariant, CustomDifficultyLevel } from '../types/game';
import { CARD_THEMES } from '../data/themes';
import { calculateLevelTimerSec } from '../data/levels';
import { 
  Sliders, 
  Play, 
  Check, 
  Zap, 
  Target, 
  Feather, 
  Crown, 
  Clock, 
  Eye, 
  Sparkles, 
  RotateCcw,
  AlertTriangle,
  Info
} from 'lucide-react';

interface CustomGameConfigProps {
  onStartCustomGame: (config: LevelConfig, themeId: CardThemeId) => void;
  initialConfig?: LevelConfig | null;
}

interface DifficultyPresetDef {
  id: CustomDifficultyLevel;
  title: string;
  subtitle: string;
  decayMs: number;
  decayLabel: string;
  variant: LevelVariant;
  defaultMisses: number;
  icon: React.ReactNode;
  badgeColor: string;
  borderActive: string;
  bgActive: string;
  description: string;
}

const DIFFICULTY_PRESETS: DifficultyPresetDef[] = [
  {
    id: 'relaxed',
    title: 'Relaxed',
    subtitle: 'Gentle & Forgiving',
    decayMs: 1400,
    decayLabel: 'Relaxed (1400ms)',
    variant: 'challenging',
    defaultMisses: 8,
    icon: <Feather className="w-4 h-4 text-emerald-500" />,
    badgeColor: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    borderActive: 'border-emerald-500 ring-2 ring-emerald-500/20',
    bgActive: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    description: 'Generous 1.4s exposure window gives ample time to inspect symbols and speak card names aloud.',
  },
  {
    id: 'balanced',
    title: 'Balanced',
    subtitle: 'Standard Cognitive',
    decayMs: 850,
    decayLabel: 'Standard (850ms)',
    variant: 'challenging',
    defaultMisses: 4,
    icon: <Target className="w-4 h-4 text-teal-500" />,
    badgeColor: 'text-teal-700 dark:text-teal-300 bg-teal-500/10 border-teal-500/30',
    borderActive: 'border-teal-500 ring-2 ring-teal-500/20',
    bgActive: 'bg-teal-50/80 dark:bg-teal-950/30',
    description: 'Optimal training balance. Cards flip back in 850ms, testing standard working memory buffer.',
  },
  {
    id: 'strict',
    title: 'Strict',
    subtitle: 'High Alertness',
    decayMs: 550,
    decayLabel: 'Fast (550ms)',
    variant: 'challenging',
    defaultMisses: 2,
    icon: <Zap className="w-4 h-4 text-amber-500" />,
    badgeColor: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30',
    borderActive: 'border-amber-500 ring-2 ring-amber-500/20',
    bgActive: 'bg-amber-50/80 dark:bg-amber-950/30',
    description: 'Rapid 550ms flip-back and tight 2-miss threshold demands high spatial vigilance.',
  },
  {
    id: 'master',
    title: 'Master',
    subtitle: 'Lightning Snapshot',
    decayMs: 350,
    decayLabel: 'Lightning (350ms)',
    variant: 'perfect',
    defaultMisses: 0,
    icon: <Crown className="w-4 h-4 text-rose-500" />,
    badgeColor: 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/30',
    borderActive: 'border-rose-500 ring-2 ring-rose-500/20',
    bgActive: 'bg-rose-50/80 dark:bg-rose-950/30',
    description: 'Apex challenge: 350ms tachistoscope flash with zero allowed misses. Tests iconic snapshot memory.',
  },
];

export const CustomGameConfig: React.FC<CustomGameConfigProps> = ({
  onStartCustomGame,
  initialConfig,
}) => {
  // Config state
  const [selectedDifficulty, setSelectedDifficulty] = useState<CustomDifficultyLevel>(
    initialConfig?.difficulty || 'balanced'
  );
  const [cardCount, setCardCount] = useState<number>(initialConfig?.cardCount || 16);
  const [memoryDecaySpeedMs, setMemoryDecaySpeedMs] = useState<number>(
    initialConfig?.memoryDecaySpeedMs || 850
  );
  const [variant, setVariant] = useState<LevelVariant>(initialConfig?.variant || 'challenging');
  const [customMissLimit, setCustomMissLimit] = useState<number>(
    initialConfig?.allowedMisses === 0
      ? 0
      : initialConfig?.allowedMisses && initialConfig.allowedMisses !== Infinity
      ? initialConfig.allowedMisses
      : 4
  );
  const [themeId, setThemeId] = useState<CardThemeId>('animals');

  // Interactive Live Decay Speed Preview state
  const [isPreviewFlipped, setIsPreviewFlipped] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(100);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previewAnimRef = useRef<number | null>(null);

  const cardCountOptions = [12, 16, 20, 24, 28, 30, 36, 42, 48, 54];

  // When a preset is clicked, auto-tune decay speed & misses
  const handleSelectPreset = (preset: DifficultyPresetDef) => {
    setSelectedDifficulty(preset.id);
    setMemoryDecaySpeedMs(preset.decayMs);
    setVariant(preset.variant);
    setCustomMissLimit(preset.defaultMisses);
  };

  // Helper to mark custom if user tweaks sliders directly away from preset
  const handleCustomDecayChange = (ms: number) => {
    setMemoryDecaySpeedMs(ms);
    const matching = DIFFICULTY_PRESETS.find(
      (p) => p.decayMs === ms && p.variant === variant && p.defaultMisses === customMissLimit
    );
    setSelectedDifficulty(matching ? matching.id : 'custom');
  };

  const handleCustomMissChange = (misses: number) => {
    setCustomMissLimit(misses);
    const matching = DIFFICULTY_PRESETS.find(
      (p) => p.decayMs === memoryDecaySpeedMs && p.variant === variant && p.defaultMisses === misses
    );
    setSelectedDifficulty(matching ? matching.id : 'custom');
  };

  const handleVariantChange = (newVariant: LevelVariant) => {
    setVariant(newVariant);
    if (newVariant === 'perfect') {
      setCustomMissLimit(0);
    } else if (newVariant === 'challenging' && customMissLimit === 0) {
      setCustomMissLimit(4);
    }
    const matching = DIFFICULTY_PRESETS.find(
      (p) => p.decayMs === memoryDecaySpeedMs && p.variant === newVariant && p.defaultMisses === customMissLimit
    );
    setSelectedDifficulty(matching ? matching.id : 'custom');
  };

  // Live Decay Speed Simulator
  const triggerDecayPreview = () => {
    if (isPreviewFlipped) return;
    setIsPreviewFlipped(true);
    setPreviewProgress(100);

    const startTime = Date.now();
    const duration = memoryDecaySpeedMs;

    const updateBar = () => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / duration) * 100);
      setPreviewProgress(remainingPct);

      if (elapsed < duration) {
        previewAnimRef.current = requestAnimationFrame(updateBar);
      }
    };
    previewAnimRef.current = requestAnimationFrame(updateBar);

    previewTimerRef.current = setTimeout(() => {
      setIsPreviewFlipped(false);
      setPreviewProgress(100);
      if (previewAnimRef.current) cancelAnimationFrame(previewAnimRef.current);
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      if (previewAnimRef.current) cancelAnimationFrame(previewAnimRef.current);
    };
  }, []);

  const getDecaySpeedLabel = (ms: number) => {
    if (ms <= 400) return 'Lightning Snapshot';
    if (ms <= 650) return 'Fast Pace';
    if (ms <= 1000) return 'Standard Buffer';
    if (ms <= 1600) return 'Relaxed Glance';
    return 'Slow / Extended';
  };

  const handleStart = () => {
    let allowedMisses = Infinity;
    if (variant === 'perfect') allowedMisses = 0;
    if (variant === 'challenging') allowedMisses = customMissLimit;

    const decaySpeedName = `${getDecaySpeedLabel(memoryDecaySpeedMs)} (${memoryDecaySpeedMs}ms)`;
    const timeLimitSec = calculateLevelTimerSec(cardCount, variant);
    const targetTimeSec = Math.round(timeLimitSec * 0.75);

    const customConfig: LevelConfig = {
      levelNumber: 99,
      group: 0,
      variant,
      cardCount,
      pairCount: cardCount / 2,
      allowedMisses,
      timeLimitSec,
      targetTimeSec,
      title: `Custom Practice: ${cardCount} Cards (${selectedDifficulty.toUpperCase()})`,
      description: `Tailored practice: ${getDecaySpeedLabel(memoryDecaySpeedMs)} decay (${memoryDecaySpeedMs}ms), ${timeLimitSec}s timer calibrated for ${cardCount} cards, ${
        allowedMisses === Infinity ? 'Unlimited' : allowedMisses
      } misses limit.`,
      difficulty: selectedDifficulty,
      memoryDecaySpeedMs,
      decaySpeedName,
    };

    onStartCustomGame(customConfig, themeId);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl dark:shadow-2xl transition-colors">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Custom Practice Sandbox
                </h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Tailored Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Fine-tune memory decay speed, allowed misses, and board complexity to suit your cognitive training goals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-center bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Active Preset:</span>
            <span className="font-bold capitalize text-slate-900 dark:text-white">{selectedDifficulty}</span>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* SECTION 1: DIFFICULTY PRESETS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>1. Difficulty Setting</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Adjusts memory decay exposure & allowed misses
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {DIFFICULTY_PRESETS.map((preset) => {
                const isSelected = selectedDifficulty === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? `${preset.borderActive} ${preset.bgActive} shadow-sm`
                        : 'bg-slate-50 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {preset.icon}
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {preset.title}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 leading-tight">
                        {preset.subtitle}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 dark:text-slate-500">Decay:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {preset.decayMs}ms
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 dark:text-slate-500">Misses:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {preset.defaultMisses === 0 ? '0 (Zero)' : `Max ${preset.defaultMisses}`}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Preset Description Banner */}
            {selectedDifficulty !== 'custom' && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  {DIFFICULTY_PRESETS.find((p) => p.id === selectedDifficulty)?.description}
                </span>
              </div>
            )}
          </div>

          {/* SECTION 2: MEMORY DECAY SPEED (EXPOSURE WINDOW) */}
          <div className="bg-slate-50/80 dark:bg-slate-850/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>2. Memory Decay Speed (Exposure Window)</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  How long mismatched cards remain visible before flipping back face-down.
                </p>
              </div>

              {/* Current Speed Badge */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-400 shadow-xs">
                  {memoryDecaySpeedMs} ms • {getDecaySpeedLabel(memoryDecaySpeedMs)}
                </span>
              </div>
            </div>

            {/* Slider with visual scale */}
            <div className="space-y-2 mb-3">
              <input
                type="range"
                min={300}
                max={2000}
                step={50}
                value={memoryDecaySpeedMs}
                onChange={(e) => handleCustomDecayChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>300ms (Lightning)</span>
                <span>600ms (Fast)</span>
                <span>850ms (Normal)</span>
                <span>1400ms (Relaxed)</span>
                <span>2000ms (Slow)</span>
              </div>
            </div>

            {/* Quick Decay Pills & Interactive Preview */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { ms: 350, label: '350ms (Instant)' },
                  { ms: 550, label: '550ms (Fast)' },
                  { ms: 850, label: '850ms (Standard)' },
                  { ms: 1400, label: '1400ms (Relaxed)' },
                  { ms: 2000, label: '2000ms (Slow)' },
                ].map((item) => (
                  <button
                    key={item.ms}
                    type="button"
                    onClick={() => handleCustomDecayChange(item.ms)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      memoryDecaySpeedMs === item.ms
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Interactive Decay Preview Button */}
              <button
                type="button"
                onClick={triggerDecayPreview}
                disabled={isPreviewFlipped}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer disabled:opacity-60"
                title="Test this decay speed on a live card"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Test Speed ({memoryDecaySpeedMs}ms)</span>
              </button>
            </div>

            {/* Mini Live Preview Flip Simulation (if active) */}
            {isPreviewFlipped && (
              <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-4 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-xl animate-bounce">
                    🦁
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Decay Timer Running...
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Card will flip back when timer expires
                    </div>
                  </div>
                </div>

                <div className="w-36 flex flex-col items-end gap-1">
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {Math.round((previewProgress / 100) * memoryDecaySpeedMs)} ms
                  </span>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all duration-75"
                      style={{ width: `${previewProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: ALLOWED MISSES & PRECISION RULES */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>3. Precision & Miss Rule</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                HelpfulGames True-Miss tracking
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { 
                  id: 'standard', 
                  title: 'Free Play (Standard)', 
                  desc: 'Unlimited misses allowed. Learn calmly.' 
                },
                { 
                  id: 'challenging', 
                  title: 'Miss Limit (Challenging)', 
                  desc: `Fail if exceeding ${customMissLimit} misses.` 
                },
                { 
                  id: 'perfect', 
                  title: 'Zero Misses (Perfect)', 
                  desc: 'Zero misses allowed. Flawless recall required.' 
                },
              ].map((v) => {
                const isSelected = variant === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleVariantChange(v.id as LevelVariant)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20 text-slate-900 dark:text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between mb-1">
                      <span>{v.title}</span>
                      {isSelected && <Check className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {v.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Allowed Misses Slider if Challenging */}
            {variant === 'challenging' && (
              <div className="mt-3 bg-slate-50/80 dark:bg-slate-850/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Maximum Allowed Misses:
                  </span>
                  <span className="font-mono font-bold text-sm px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    {customMissLimit} {customMissLimit === 1 ? 'Miss' : 'Misses'}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={customMissLimit}
                  onChange={(e) => handleCustomMissChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[1, 2, 3, 4, 6, 8, 12, 16].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleCustomMissChange(num)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors ${
                        customMissLimit === num
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: GRID SIZE (CARD COUNT) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>4. Board Size ({cardCount} Cards = {cardCount / 2} Pairs)</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {cardCount / 2} pairs to match
              </span>
            </div>
            
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {cardCountOptions.map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setCardCount(cnt)}
                  className={`py-2 px-1 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                    cardCount === cnt
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 scale-103'
                      : 'bg-slate-50 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="block text-xs font-black">{cnt}</span>
                  <span className="text-[9px] font-normal opacity-80">{cnt / 2}p</span>
                </button>
              ))}
            </div>

            {/* Calibrated Level Timer Callout */}
            <div className="mt-2.5 flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800/50 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Level Timer (scaled for {cardCount} cards):</span>
              </div>
              <div className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                {calculateLevelTimerSec(cardCount, variant)}s
              </div>
            </div>
          </div>

          {/* SECTION 5: VISUAL THEME */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                5. Visual Theme
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Pick card illustrations
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {Object.values(CARD_THEMES).map((thm) => (
                <button
                  key={thm.id}
                  type="button"
                  onClick={() => setThemeId(thm.id)}
                  className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    themeId === thm.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 dark:text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-2xl shrink-0">{thm.icon}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-xs truncate text-slate-900 dark:text-white">
                      {thm.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {thm.items.length} cards
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Launch Button */}
          <div className="pt-2">
            <button
              onClick={handleStart}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2.5 cursor-pointer transition-transform active:scale-98"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>Launch Custom Practice Board ({cardCount} Cards • {memoryDecaySpeedMs}ms Decay)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
