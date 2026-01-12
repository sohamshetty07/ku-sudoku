"use client";
import { useStore } from "@/lib/store";

// Helper to keep the context active singleton
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

// [UPDATED] Added new sound types to the union type
export type SoundType = 
  | 'click' 
  | 'input' 
  | 'error' 
  | 'erase' 
  | 'gameover' 
  | 'victory' 
  | 'heavy-impact' 
  | 'success' 
  | 'chord'
  | 'ice-shatter'  // [NEW] Chronos Shard
  | 'scan'         // [NEW] Oracle Lens / Nano Scribe
  | 'shield-block' // [NEW] Aegis Shield
  | 'revive'       // [NEW] Void Anchor
  | 'upgrade';     // [NEW] Intermission

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
      // Soft Bubble Pop
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
      // Glass Ping
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1760, now); // A6
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      
      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.5);
      osc2.stop(now + 0.5);
      break;
    }

    case 'erase': {
      // Reverse Suction
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
      // Digital Glitch
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    }

    case 'victory': {
      // Ethereal Chord
      const notes = [523.25, 659.25, 783.99, 987.77];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + (i * 0.1));
        
        gain.gain.setValueAtTime(0, now + (i * 0.1));
        gain.gain.linearRampToValueAtTime(0.1, now + (i * 0.1) + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.1) + 2.0);
        
        osc.start(now + (i * 0.1));
        osc.stop(now + (i * 0.1) + 2.0);
      });
      break;
    }

    // Chord for Row/Col Completion
    case 'chord': {
      // Major triad swell (C4, E4, G4)
      const notes = [261.63, 329.63, 392.00]; 
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine'; // Sine for a smooth, pure tone
        osc.frequency.setValueAtTime(freq, now);
        
        // Quick swell and fade
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.05); // Fast attack
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6); // Short decay
        
        osc.start(now);
        osc.stop(now + 0.6);
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

    // SUCCESS (For Comet Catch / Wealth)
    case 'success': {
        // High-pitched "Coin" shimmer
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.1); // Quick rise
        
        osc2.type = 'square'; // Adds sparkle
        osc2.frequency.setValueAtTime(2400, now);
        
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.4);
        osc2.stop(now + 0.4);
        break;
    }

    // "GENESIS" IMPACT SOUND (For Planet Unlock / Start Run)
    case 'heavy-impact': {
        // 1. The Sub-Bass (Impact Thud)
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);

        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(150, now); // Start low mid
        subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.4); // Drop to sub bass

        subGain.gain.setValueAtTime(0.6, now); // Loud start
        subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        subOsc.start(now);
        subOsc.stop(now + 0.6);

        // 2. The Atmospheric Rumble (Sawtooth + Low Pass Filter)
        const rumbleOsc = ctx.createOscillator();
        const rumbleGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        rumbleOsc.connect(filter);
        filter.connect(rumbleGain);
        rumbleGain.connect(ctx.destination);

        rumbleOsc.type = 'sawtooth';
        rumbleOsc.frequency.setValueAtTime(60, now); // Deep drone

        // Filter sweep to simulate "dust clearing"
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.linearRampToValueAtTime(50, now + 1.5);

        rumbleGain.gain.setValueAtTime(0.2, now);
        rumbleGain.gain.linearRampToValueAtTime(0, now + 1.5); // Long fade

        rumbleOsc.start(now);
        rumbleOsc.stop(now + 1.5);

        // 3. The "Divine" Shine (High Frequency Shimmer)
        const shineOsc = ctx.createOscillator();
        const shineGain = ctx.createGain();
        shineOsc.connect(shineGain);
        shineGain.connect(ctx.destination);

        shineOsc.type = 'triangle';
        shineOsc.frequency.setValueAtTime(440, now); // A4
        shineOsc.frequency.exponentialRampToValueAtTime(880, now + 2); // Slow rise to A5

        shineGain.gain.setValueAtTime(0, now);
        shineGain.gain.linearRampToValueAtTime(0.05, now + 0.1); // Soft attack
        shineGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5); // Very long tail

        shineOsc.start(now);
        shineOsc.stop(now + 2.5);
        break;
    }

    // [NEW] Ice Shatter (For Chronos Shard)
    case 'ice-shatter': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2000, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3); // Fast drop
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
        break;
    }

    // [NEW] Scan (For Lens/Drone)
    case 'scan': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.2); // Up sweep
        
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.2);
        break;
    }

    // [NEW] Shield Block (For Aegis)
    case 'shield-block': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.2);
        break;
    }

    // [NEW] Revive (For Anchor)
    case 'revive': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 1.0); // Slow rise
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 1.0);
        
        osc.start(now);
        osc.stop(now + 1.0);
        break;
    }

    // [NEW] Upgrade (For Intermission)
    case 'upgrade': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.3);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
        break;
    }
  }
};