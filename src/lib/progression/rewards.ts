import { REWARDS, DIFFICULTY_SETTINGS } from './constants';

// --- TYPES ---
interface GameResult {
  mode: 'Relaxed' | 'Standard' | 'Mastery';
  timeElapsed: number; // in seconds
  mistakes: number;
  isWin: boolean;
  currentElo: number;
}

export interface RewardSummary {
  xp: number;
  stardust: number;
  cometShards: number;
  eloChange: number;
  bonuses: string[];
}

// --- THE CALCULATOR ---
export function calculateGameRewards(result: GameResult): RewardSummary {
  const settings = DIFFICULTY_SETTINGS[result.mode];
  const bonuses: string[] = [];
  
  let xp = 0;
  let stardust = 0;
  let cometShards = 0;
  let eloChange = 0;

  // 1. BASE REWARDS (Win vs Loss)
  if (result.isWin) {
    // XP Calculation
    const baseXp = result.mode === 'Mastery' 
      ? REWARDS.XP_WIN_MASTERY 
      : REWARDS.XP_WIN_STANDARD;
    
    xp = Math.floor(baseXp * settings.xpMultiplier);

    // ELO (Only change rating if not Relaxed)
    if (result.mode !== 'Relaxed') {
      eloChange = settings.ratingChange;
    }

    // STARDUST (Base)
    stardust = REWARDS.STARDUST_WIN;

    // COMET SHARDS (Mastery Only)
    if (result.mode === 'Mastery') {
      cometShards = REWARDS.SHARDS_WIN_MASTERY;
      bonuses.push("Mastery Bonus");
    }

    // --- NEW: TIME BONUS LOGIC ---
    // Standard Par: 300s (5m) | Mastery Par: 900s (15m)
    const parTime = result.mode === 'Mastery' ? 900 : 300;
    
    if (result.timeElapsed < parTime) {
      const timeSaved = parTime - result.timeElapsed;
      // +1 Stardust for every 30 seconds saved
      const timeBonus = Math.floor(timeSaved / 30) * REWARDS.STARDUST_PER_30S_SAVED;
      
      if (timeBonus > 0) {
        stardust += timeBonus;
        bonuses.push(`Speed Bonus (+${timeBonus} Dust)`);
      }
    }

  } else {
    // LOSS REWARDS
    xp = REWARDS.XP_LOSS;
    
    // ELO PENALTY (Protected: Can't go below 1000)
    if (result.mode !== 'Relaxed') {
      const potentialElo = result.currentElo - 10; // Flat -10 penalty for loss
      
      // If Mastery, risk is higher (-20)
      const penalty = result.mode === 'Mastery' ? 20 : 10;

      if (result.currentElo - penalty < 1000) {
        eloChange = 1000 - result.currentElo; // Soft landing at 1000
      } else {
        eloChange = -penalty;
      }
    }
  }

  // 2. SKILL BONUSES (Win Only)
  if (result.isWin) {
    // FLAWLESS (No Mistakes)
    if (result.mistakes === 0) {
      const flawlessBonus = 10;
      stardust += flawlessBonus;
      bonuses.push(`Flawless (+${flawlessBonus} Dust)`);
    }
  }

  return {
    xp: Math.floor(xp),
    stardust: Math.floor(stardust),
    cometShards,
    eloChange: Math.floor(eloChange),
    bonuses
  };
}