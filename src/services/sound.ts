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
}

export const soundService = new SoundService();
