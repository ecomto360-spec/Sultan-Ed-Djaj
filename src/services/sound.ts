// Web Audio API chime synthesizer for Sultan Ed-Djaj order notifications
class SoundService {
  private audioCtx: AudioContext | null = null;

  private initCtx() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Play double bell chime for incoming order
  playNewOrderBeep() {
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Note 1: 587.33 Hz (D5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // Ramp up to A5

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.3, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: 880 Hz (A5) -> 1174.66 Hz (D6)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.18);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.32);

      gain2.gain.setValueAtTime(0.001, now + 0.18);
      gain2.gain.linearRampToValueAtTime(0.35, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.65);
    } catch {
      // Audio playback fails silently if browser blocks autoplay before gesture
    }
  }

  // Quick subtle click/success feedback
  playSuccess() {
    try {
      this.initCtx();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // ignore
    }
  }

  // Débloque l'audio sur un geste utilisateur (clic « Commander ») : les
  // navigateurs bloquent la lecture tant qu'aucune interaction n'a eu lieu.
  // On reprend l'AudioContext et l'on joue un fragment quasi silencieux.
  unlockAudio(): boolean {
    try {
      this.initCtx();
      if (!this.audioCtx) return false;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const buffer = this.audioCtx.createBuffer(1, 1, 22050);
      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioCtx.destination);
      source.start(0);
      return this.audioCtx.state === 'running';
    } catch {
      return false;
    }
  }

  isAudioUnlocked(): boolean {
    try {
      return Boolean(this.audioCtx) && this.audioCtx?.state === 'running';
    } catch {
      return false;
    }
  }

  private playTone(
    freq: number,
    startAt: number,
    duration: number,
    volume: number,
    type: OscillatorType = 'triangle',
    endFreq?: number
  ) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startAt);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, startAt + duration * 0.8);
    }
    gain.gain.setValueAtTime(0.001, startAt);
    gain.gain.linearRampToValueAtTime(volume, startAt + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  }

  // Sonneries courtes côté client (≈1–2 s, volume modéré). Le son « Prête »
  // et « En livraison » est plus marqué : triple note montante plus intense.
  playClientStatusChime(status: 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled') {
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      switch (status) {
        case 'preparing':
          this.playTone(659.25, now, 0.28, 0.22);
          this.playTone(880, now + 0.22, 0.42, 0.22);
          break;
        case 'ready':
        case 'delivering':
          this.playTone(587.33, now, 0.22, 0.3);
          this.playTone(783.99, now + 0.18, 0.22, 0.3);
          this.playTone(1046.5, now + 0.36, 0.55, 0.32);
          break;
        case 'delivered':
          this.playTone(783.99, now, 0.25, 0.2, 'sine');
          this.playTone(1046.5, now + 0.2, 0.5, 0.2, 'sine');
          break;
        case 'cancelled':
          this.playTone(220, now, 0.5, 0.25, 'sawtooth', 140);
          this.playTone(185, now + 0.4, 0.6, 0.22, 'sawtooth', 110);
          break;
      }
    } catch {
      // Audio bloqué : l'UI propose le bouton « Activer le son ».
    }
  }
}

export const soundService = new SoundService();
