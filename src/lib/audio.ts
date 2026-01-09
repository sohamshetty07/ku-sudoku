"use client";
import { useStore } from "@/lib/store";

// Helper to keep the context active
let audioCtx: AudioContext | null = null;

const getContext = () => {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    // @ts-ignore - Handle Safari prefix
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  return audioCtx;
};

type SoundType = 'click' | 'input' | 'error' | 'erase' | 'gameover' | 'victory';

export const playSfx = (type: SoundType) => {
  // 1. Check if Audio is Enabled in Store
  const { audioEnabled } = useStore.getState();
  if (!audioEnabled) return;

  const ctx = getContext();
  if (!ctx) return;
  
  // Resume context if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;

  switch (type) {
    case 'click': {
      // Soft Bubble Pop (Sine wave, quick pitch drop)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    }

    case 'input': {
      // Glass Ping (Sine + Triangle overtone)
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1760, now); // A6 (Octave up)
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5); // Long tail
      
      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.5);
      osc2.stop(now + 0.5);
      break;
    }

    case 'erase': {
      // Reverse Suction (Low frequency ramp up)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(300, now + 0.1);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    }

    case 'error': {
      // Digital Glitch (Sawtooth + Low Pass Filter)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now); // Low buzz
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    }

    case 'victory': {
      // Ethereal Chord Arpeggio (C Major 7: C - E - G - B)
      const notes = [523.25, 659.25, 783.99, 987.77]; // C5, E5, G5, B5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + (i * 0.1)); // Stagger starts
        
        gain.gain.setValueAtTime(0, now + (i * 0.1));
        gain.gain.linearRampToValueAtTime(0.1, now + (i * 0.1) + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.1) + 2.0); // Long fade
        
        osc.start(now + (i * 0.1));
        osc.stop(now + (i * 0.1) + 2.0);
      });
      break;
    }
    
    case 'gameover': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(50, now + 1);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 1);
        
        osc.start(now);
        osc.stop(now + 1);
        break;
    }
  }
};