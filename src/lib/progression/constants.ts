// --- 1. RANK SYSTEM ---
export interface Rank {
  id: string;
  title: string;
  minXp: number;
  color: string;
  benefit: string;
}

export const RANKS: Rank[] = [
  { 
    id: 'initiate', 
    title: 'Initiate', 
    minXp: 0, 
    color: 'text-white/60', 
    benefit: 'Base Game Access' 
  },
  { 
    id: 'seeker', 
    title: 'Seeker', 
    minXp: 500, 
    color: 'text-neon-cyan', 
    benefit: 'Unlocks The Observatory (Themes)' 
  },
  { 
    id: 'adept', 
    title: 'Adept', 
    minXp: 1500, 
    color: 'text-purple-400', 
    benefit: 'Unlocks Mastery Difficulty' 
  },
  { 
    id: 'sage', 
    title: 'Sage', 
    minXp: 5000, 
    color: 'text-amber-400', 
    benefit: 'Unlocks Elite Shop Access' 
  },
  { 
    id: 'voidwalker', 
    title: 'Void Walker', 
    minXp: 15000, 
    color: 'text-rose-500', 
    benefit: 'Unlocks Infinite Mode' 
  },
];

// --- 2. ECONOMY SETTINGS ---
export const REWARDS = {
  // XP GAINS
  XP_WIN_STANDARD: 100,
  XP_WIN_MASTERY: 400,
  XP_LOSS: 25,
  
  // STARDUST (Standard Currency)
  // [SUGGESTION] Increased base win from 15 to 50 to make grinding feel rewarding
  STARDUST_WIN: 50, 
  STARDUST_PER_30S_SAVED: 5, // [SUGGESTION] Increased from 1 to 5 to make speed matter
  
  // COMET SHARDS (Premium Currency)
  SHARDS_WIN_MASTERY: 1,
};

// --- 3. DIFFICULTY CONFIG ---
export const DIFFICULTY_SETTINGS = {
  Relaxed:  { xpMultiplier: 0.5, ratingChange: 0 },
  Standard: { xpMultiplier: 1.0, ratingChange: 25 },
  Mastery:  { xpMultiplier: 2.0, ratingChange: 60 },
  // [NEW] Added Daily Config
  Daily:    { xpMultiplier: 1.5, ratingChange: 0 }, 
};