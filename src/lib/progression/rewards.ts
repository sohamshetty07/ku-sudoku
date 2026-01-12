import { REWARDS, DIFFICULTY_SETTINGS } from './constants';

// --- TYPES ---
export interface GameResult {
  mode: 'Relaxed' | 'Standard' | 'Mastery' | 'Daily'; // [UPDATED] Added Daily
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
  // Handle Daily mode separately or fallback if not in constants
  const settings = result.mode === 'Daily' 
    ? { xpMultiplier: 1.5, ratingChange: 0 } 
    : DIFFICULTY_SETTINGS[result.mode];

  const bonuses: string[] = [];
  
  let xp = 0;
  let stardust = 0;
  let cometShards = 0;
  let eloChange = 0;

  // 1. BASE REWARDS (Win vs Loss)
  if (result.isWin) {
    // XP Calculation
    let baseXp = REWARDS.XP_WIN_STANDARD;
    if (result.mode === 'Mastery') baseXp = REWARDS.XP_WIN_MASTERY;
    if (result.mode === 'Daily') baseXp = 150; // Daily XP Reward

    xp = Math.floor(baseXp * (settings?.xpMultiplier || 1));

    // ELO (Only change rating if not Relaxed or Daily)
    if (result.mode !== 'Relaxed' && result.mode !== 'Daily') {
      eloChange = settings?.ratingChange || 15;
    }

    // STARDUST (Base)
    stardust = result.mode === 'Daily' ? 75 : REWARDS.STARDUST_WIN;

    // COMET SHARDS (Mastery Only)
    if (result.mode === 'Mastery') {
      cometShards = REWARDS.SHARDS_WIN_MASTERY;
      bonuses.push("Mastery Bonus");
    }

    // --- TIME BONUS LOGIC ---
    let parTime = 300; // Standard
    if (result.mode === 'Mastery') parTime = 900;
    if (result.mode === 'Daily') parTime = 450;
    
    // Safety check: Don't reward games faster than 10 seconds
    if (result.timeElapsed < parTime && result.timeElapsed > 10) {
      const timeSaved = parTime - result.timeElapsed;
      
      // Calculate bonus
      const timeBonus = Math.floor(timeSaved / 30) * REWARDS.STARDUST_PER_30S_SAVED;
      const finalBonus = Math.min(timeBonus, 20); // Cap at 20

      if (finalBonus > 0) {
        stardust += finalBonus;
        bonuses.push(`Speed Bonus (+${finalBonus} Dust)`);
      }
    }

  } else {
    // LOSS REWARDS
    xp = REWARDS.XP_LOSS;
    
    // ELO PENALTY (Protected: Can't go below 1000)
    // Relaxed and Daily do NOT lose ELO
    if (result.mode !== 'Relaxed' && result.mode !== 'Daily') {
      
      // Standard: -15, Mastery: -30 (High Risk)
      const penalty = result.mode === 'Mastery' ? 30 : 15;

      // [FIX] Soft Floor Logic
      // If subtracting the penalty would drop below 1000, only subtract enough to reach 1000.
      if (result.currentElo - penalty < 1000) {
        eloChange = -(result.currentElo - 1000); 
      } else {
        eloChange = -penalty;
      }
    }
  }

  // 2. SKILL BONUSES (Win Only)
  if (result.isWin) {
    // FLAWLESS (No Mistakes)
    if (result.mistakes === 0) {
      const flawlessBonus = result.mode === 'Mastery' ? 20 : 10;
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