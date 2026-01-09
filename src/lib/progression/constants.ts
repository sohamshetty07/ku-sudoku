// --- 1. RANK SYSTEM ---
export interface Rank {
  id: string;
  title: string;
  minXp: number;
  color: string; // For UI styling (Tailwind classes or hex)
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
  // XP GAINS (Increased for Mastery)
  XP_WIN_STANDARD: 100,
  XP_WIN_MASTERY: 400, // <--- Big Jump (Was 250)
  XP_LOSS: 25,
  
  // STARDUST (Currency)
  STARDUST_WIN: 15,
  // New Time Bonus constant
  STARDUST_PER_30S_SAVED: 1, 
  
  // COMET SHARDS
  SHARDS_WIN_MASTERY: 1,
};

// --- 3. DIFFICULTY CONFIG ---
export const DIFFICULTY_SETTINGS = {
  Relaxed:  { xpMultiplier: 0.5, ratingChange: 0 },
  Standard: { xpMultiplier: 1.0, ratingChange: 25 }, // <--- Increased to 25
  Mastery:  { xpMultiplier: 2.0, ratingChange: 60 }, // <--- Increased to 60
};