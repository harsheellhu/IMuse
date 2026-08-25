import { useSettingsStore } from '../store/useSettingsStore';

class AudioEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
      } catch (e) {
        console.warn('Web Audio API not supported', e);
      }
    }
    
    // Resume context if it was suspended (browser policy)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private getVolume() {
    const { interfaceSounds } = useSettingsStore.getState();
    if (interfaceSounds === 'off') return 0;
    if (interfaceSounds === 'subtle') return 0.05;
    if (interfaceSounds === 'balanced') return 0.15;
    return 0;
  }

  public playCollectionOpen() {
    const vol = this.getVolume();
    if (vol === 0) return;
    
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      
      // Gentle sine sweep for a cinematic opening feel
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.3);
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(t);
      osc.stop(t + 0.6);
    } catch (e) {
      console.warn('Audio playback failed', e);
    }
  }

  public playCarouselMove() {
    const vol = this.getVolume();
    if (vol === 0) return;
    
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      
      // Tiny subtle tick/whoosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.1);
      
      gain.gain.setValueAtTime(0, t);
      // Reduce volume specifically for navigation so it's not annoying
      gain.gain.linearRampToValueAtTime(vol * 0.4, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(t);
      osc.stop(t + 0.1);
    } catch (e) {
      console.warn('Audio playback failed', e);
    }
  }
}

export const uiAudio = new AudioEngine();
