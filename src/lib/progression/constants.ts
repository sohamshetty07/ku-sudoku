// --- 1. RANK SYSTEM ---
export interface Rank {
  id: string;
  title: string;
  minXp: number;
  color: string;
  benefit: string;
}

export const RANKS: Rank[] = [
  { id: 'initiate', title: 'Initiate', minXp: 0, color: 'text-white/60', benefit: 'Base Game Access' },
  { id: 'seeker', title: 'Seeker', minXp: 500, color: 'text-neon-cyan', benefit: 'Unlocks The Observatory' },
  { id: 'adept', title: 'Adept', minXp: 1500, color: 'text-purple-400', benefit: 'Unlocks Mastery Difficulty' },
  { id: 'sage', title: 'Sage', minXp: 5000, color: 'text-amber-400', benefit: 'Unlocks Elite Shop Access' },
  { id: 'voidwalker', title: 'Void Walker', minXp: 15000, color: 'text-rose-500', benefit: 'Unlocks Void Expedition' },
];

// --- 2. ECONOMY SETTINGS ---
export const REWARDS = {
  XP_WIN_STANDARD: 100,
  XP_WIN_MASTERY: 400,
  XP_LOSS: 25,
  STARDUST_WIN: 50, 
  STARDUST_PER_30S_SAVED: 5,
  SHARDS_WIN_MASTERY: 1,
};

// --- 3. DIFFICULTY CONFIG ---
export const DIFFICULTY_SETTINGS = {
  Relaxed:  { xpMultiplier: 0.5, ratingChange: 0 },
  Standard: { xpMultiplier: 1.0, ratingChange: 25 },
  Mastery:  { xpMultiplier: 2.0, ratingChange: 60 },
  Daily:    { xpMultiplier: 1.5, ratingChange: 0 }, 
};

// --- 4. COSMIC ARTIFACTS ---
export interface Artifact {
  id: string;
  name: string;
  type: 'Passive' | 'Active' | 'Cursed'; // [UPDATED] Added Cursed
  rarity: 'Common' | 'Rare' | 'Legendary' | 'Cursed';
  description: string;
  cost: number;
  effectId: string; 
  maxUses?: number; 
  cooldownType?: 'PerPuzzle' | 'PerRun';
  // [NEW] Multipliers for Cursed items logic
  rewardMultiplier?: { xp?: number; stardust?: number; shards?: number };
}

export const ARTIFACTS: Artifact[] = [
  // --- COMMON (Cost 1-2) ---
  {
    id: 'chronos_shard',
    name: 'Chronos Shard',
    type: 'Active',
    rarity: 'Common',
    description: 'Freezes the timer for 30s. (Recharges every sector)',
    cost: 1,
    effectId: 'freeze',
    maxUses: 1,
    cooldownType: 'PerPuzzle'
  },
  {
    id: 'oracle_lens',
    name: 'Oracle Lens',
    type: 'Active',
    rarity: 'Common',
    description: 'Highlights all instances of the selected number for 10s.',
    cost: 2,
    effectId: 'reveal_number',
    maxUses: 1,
    cooldownType: 'PerPuzzle'
  },
  {
    id: 'nano_scribe',
    name: 'Nano Scribe',
    type: 'Active',
    rarity: 'Common',
    description: 'Instantly fills valid pencil notes for all empty cells.',
    cost: 2,
    effectId: 'auto_notes',
    maxUses: 1,
    cooldownType: 'PerPuzzle'
  },
  {
    id: 'stabilizer',
    name: 'Core Stabilizer',
    type: 'Passive',
    rarity: 'Common',
    description: 'The first mistake of every sector is ignored.',
    cost: 2,
    effectId: 'ignore_first_mistake',
    cooldownType: 'PerPuzzle'
  },
  {
    id: 'scout_drone',
    name: 'Scout Drone',
    type: 'Active',
    rarity: 'Common',
    description: 'Validates board state without penalty (3 uses/sector).',
    cost: 2,
    effectId: 'validate_board',
    maxUses: 3,
    cooldownType: 'PerPuzzle'
  },

  // --- RARE (Cost 3-4) ---
  {
    id: 'aegis_shield',
    name: 'Aegis Shield',
    type: 'Passive',
    rarity: 'Rare',
    description: 'Blocks up to 3 mistakes total per run.',
    cost: 3,
    effectId: 'shield_pool',
    maxUses: 3,
    cooldownType: 'PerRun'
  },
  {
    id: 'stellar_siphon',
    name: 'Stellar Siphon',
    type: 'Passive',
    rarity: 'Rare',
    description: 'Gain +10 Stardust for every 3x3 box completed.',
    cost: 3,
    effectId: 'siphon_on_box',
    cooldownType: 'PerRun'
  },
  {
    id: 'flux_capacitor',
    name: 'Flux Capacitor',
    type: 'Passive',
    rarity: 'Rare',
    description: 'Reduces time penalty for mistakes by 50%.',
    cost: 4,
    effectId: 'reduce_penalty',
    cooldownType: 'PerRun'
  },
  {
    id: 'quantum_key',
    name: 'Quantum Key',
    type: 'Active',
    rarity: 'Rare',
    description: 'Instantly solves one selected cell (1 use/sector).',
    cost: 4,
    effectId: 'auto_solve_1',
    maxUses: 1,
    cooldownType: 'PerPuzzle'
  },
  {
    id: 'midas_touch',
    name: 'Midas Touch',
    type: 'Passive',
    rarity: 'Rare',
    description: 'Gain +50% Stardust, but -60s Par Time.',
    cost: 4,
    effectId: 'economy_boost',
    cooldownType: 'PerRun'
  },

  // --- LEGENDARY (Cost 5+) ---
  {
    id: 'void_anchor',
    name: 'Void Anchor',
    type: 'Passive',
    rarity: 'Legendary',
    description: 'Fatal damage restores 1 Life instead (Once per run).',
    cost: 5,
    effectId: 'revive',
    maxUses: 1,
    cooldownType: 'PerRun'
  },
  {
    id: 'omniscient_eye',
    name: 'Omniscient Eye',
    type: 'Active',
    rarity: 'Legendary',
    description: 'Auto-fills 3 random cells at the start of every sector.',
    cost: 6,
    effectId: 'auto_solve_3',
    maxUses: 1,
    cooldownType: 'PerRun'
  },
  
  // --- CURSED (Cost 0, High Risk) ---
  {
    id: 'blood_pact',
    name: 'Blood Pact',
    type: 'Cursed',
    rarity: 'Cursed',
    description: 'Set Max Lives to 1. Gain 3x XP Rewards.',
    cost: 0,
    effectId: 'curse_1hp',
    cooldownType: 'PerRun',
    rewardMultiplier: { xp: 3 }
  },
  {
    id: 'blind_fold',
    name: 'The Blindfold',
    type: 'Cursed',
    rarity: 'Cursed',
    description: 'Notes Mode Disabled. Gain 2x Stardust & Shards.',
    cost: 0, 
    effectId: 'curse_no_notes',
    cooldownType: 'PerRun',
    rewardMultiplier: { stardust: 2, shards: 2 }
  },
  {
    id: 'entropy_drive',
    name: 'Entropy Drive',
    type: 'Cursed',
    rarity: 'Cursed',
    description: 'A random cell is deleted every 60s. 2x All Rewards.',
    cost: 0,
    effectId: 'curse_decay',
    cooldownType: 'PerRun',
    rewardMultiplier: { xp: 2, stardust: 2 }
  }
];