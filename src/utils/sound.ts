// Web Audio API Synthesizer for lag-free, cross-browser sounds

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    const saved = localStorage.getItem('mindforge_sound_enabled');
    if (saved !== null) {
      this.soundEnabled = saved === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('mindforge_sound_enabled', String(this.soundEnabled));
    return this.soundEnabled;
  }

  public setSound(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('mindforge_sound_enabled', String(this.soundEnabled));
  }

  public playFlip() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // AudioContext could be blocked by browser policy until interaction
    }
  }

  public playMatch() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.06);

        const startTime = this.ctx.currentTime + i * 0.06;
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.32);
      });
    } catch {
      // ignore
    }
  }

  public playMiss() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.16);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch {
      // ignore
    }
  }

  public playVictory() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const chord = [
        { freq: 523.25, time: 0 },
        { freq: 659.25, time: 0.1 },
        { freq: 783.99, time: 0.2 },
        { freq: 1046.5, time: 0.32 },
        { freq: 1318.5, time: 0.44 },
      ];
      chord.forEach(({ freq, time }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + time);

        const st = this.ctx.currentTime + time;
        gain.gain.setValueAtTime(0.18, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(st);
        osc.stop(st + 0.48);
      });
    } catch {
      // ignore
    }
  }

  public playGameOver() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const freqs = [350, 280, 220, 160];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        const st = this.ctx.currentTime + idx * 0.12;
        osc.frequency.setValueAtTime(freq, st);

        gain.gain.setValueAtTime(0.12, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(st);
        osc.stop(st + 0.26);
      });
    } catch {
      // ignore
    }
  }

  public playTone(freq: number, duration: number = 0.25, type: OscillatorType = 'sine') {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // ignore
    }
  }

  public playCountdownBeep(isGo: boolean = false) {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isGo ? 'triangle' : 'sine';
      const freq = isGo ? 880 : 440;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (isGo) {
        osc.frequency.exponentialRampToValueAtTime(1046.5, this.ctx.currentTime + 0.18);
      }

      gain.gain.setValueAtTime(isGo ? 0.24 : 0.16, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isGo ? 0.35 : 0.14));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + (isGo ? 0.35 : 0.14));
    } catch {
      // ignore
    }
  }

  public playCardDeal() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(180, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();
