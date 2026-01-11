import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- TYPES ---
export type CelestialType = 'Star' | 'Planet' | 'Moon' | 'Nebula' | 'BlackHole';

export interface CelestialNode {
  id: string;
  parentId?: string; // e.g., 'earth' is parent of 'moon'
  name: string;
  type: CelestialType;
  description: string; // The "Lore" or Scientific Fact
  
  // [NEW] Gameplay Benefit
  perk?: string; // e.g. "Passive: +1 Life"
  
  // Position & Visuals (Canvas Coordinates)
  x: number; 
  y: number;
  radius: number; // Size of the node
  orbitRadius?: number; // Distance from parent (for drawing orbit lines)
  color: string; // Hex for the minimap/glow
  
  // Animation Properties
  orbitSpeed?: number; // Speed multiplier (Moons need high speed >0.03)
  startAngle?: number; // Starting position in radians (0 to 2PI)
  
  // Economy
  cost: number;
  currency: 'stardust' | 'cometShards';
  
  // Requirements
  requires?: string[]; // IDs of nodes that must be unlocked first
}

export interface HistoryStar {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  dateUnlocked: string;
}

interface GalaxyState {
  unlockedNodeIds: string[];
  historyStars: HistoryStar[];
  
  // Actions
  unlockNode: (nodeId: string) => boolean;
  addHistoryStar: () => void;
  isNodeUnlocked: (nodeId: string) => boolean;
  isNodeUnlockable: (nodeId: string) => boolean;
  
  // Reset Action
  resetGalaxy: () => void;
}

// --- DATA: THE FULL SOLAR SYSTEM ---

export const SOLAR_SYSTEM: CelestialNode[] = [
  // --- STAR ---
  {
    id: 'sun',
    name: 'Sol',
    type: 'Star',
    description: 'The burning heart of the system. 99.8% of the system\'s mass resides here.',
    perk: 'The Source: Allows Stardust Collection',
    x: 0, y: 0, radius: 60,
    color: '#fbbf24', // Amber-400
    cost: 0, currency: 'stardust',
    orbitSpeed: 0,
  },
  
  // --- INNER PLANETS ---
  {
    id: 'mercury',
    parentId: 'sun',
    name: 'Mercury',
    type: 'Planet',
    description: 'The swift messenger. Temperatures swing from 430°C to -180°C.',
    perk: 'Speed Demon: +10% Stardust on speed wins (< 5 min)',
    x: 0, y: 0, radius: 12, orbitRadius: 100,
    color: '#94a3b8', // Slate-400
    cost: 250, currency: 'stardust',
    requires: ['sun'],
    orbitSpeed: 0.008, startAngle: 0.5 
  },
  {
    id: 'venus',
    parentId: 'sun',
    name: 'Venus',
    type: 'Planet',
    description: 'The hottest planet. Its thick CO2 atmosphere creates a runaway greenhouse effect.',
    perk: 'Morning Star: Daily Login Bonus +50 Dust',
    x: 0, y: 0, radius: 18, orbitRadius: 150,
    color: '#facc15', // Yellow-400
    cost: 500, currency: 'stardust',
    requires: ['mercury'],
    orbitSpeed: 0.006, startAngle: 2.1
  },
  {
    id: 'earth',
    parentId: 'sun',
    name: 'Earth',
    type: 'Planet',
    description: 'Our home. The only known world to harbor life.',
    perk: 'Life Support: +1 Max Mistake (Total 4)',
    x: 0, y: 0, radius: 20, orbitRadius: 210,
    color: '#3b82f6', // Blue-500
    cost: 1000, currency: 'stardust',
    requires: ['venus'],
    orbitSpeed: 0.004, startAngle: 3.5
  },
  // MOON
  {
    id: 'moon',
    parentId: 'earth',
    name: 'Luna',
    type: 'Moon',
    description: 'Earth\'s tidal lock companion.',
    perk: 'Night Watch: Unlocks "Dark Side" Theme',
    x: 0, y: 0, radius: 6, orbitRadius: 35,
    color: '#e2e8f0', // Slate-200
    cost: 300, currency: 'stardust',
    requires: ['earth'],
    orbitSpeed: 0.04, startAngle: 0 
  },
  {
    id: 'mars',
    parentId: 'sun',
    name: 'Mars',
    type: 'Planet',
    description: 'The Red Planet. Home to the largest volcano in the solar system.',
    perk: 'Veteran: +15% XP from all sources',
    x: 0, y: 0, radius: 16, orbitRadius: 280,
    color: '#ef4444', // Red-500
    cost: 1500, currency: 'stardust',
    requires: ['earth'],
    orbitSpeed: 0.003, startAngle: 5.0
  },
  {
    id: 'phobos',
    parentId: 'mars',
    name: 'Phobos',
    type: 'Moon',
    description: 'A doomed moon, slowly spiraling inward.',
    perk: 'Panic Button: 1 Free Hint per game',
    x: 0, y: 0, radius: 4, orbitRadius: 25,
    color: '#7f1d1d', // Red-900
    cost: 200, currency: 'stardust',
    requires: ['mars'],
    orbitSpeed: 0.06, startAngle: 1.0
  },
  {
    id: 'deimos',
    parentId: 'mars',
    name: 'Deimos',
    type: 'Moon',
    description: 'A captured asteroid drifting outward.',
    perk: 'Second Chance: 1 Free Undo per game',
    x: 0, y: 0, radius: 3, orbitRadius: 40,
    color: '#7f1d1d', // Red-900
    cost: 200, currency: 'stardust',
    requires: ['mars'],
    orbitSpeed: 0.03, startAngle: 3.0
  },

  // --- GAS GIANTS & GALILEAN MOONS ---
  {
    id: 'jupiter',
    parentId: 'sun',
    name: 'Jupiter',
    type: 'Planet',
    description: 'The King of Planets. A gas giant 318x massive than Earth.',
    perk: 'Gravity Well: 10% Discount in Shop',
    x: 0, y: 0, radius: 45, orbitRadius: 420,
    color: '#d97706', // Amber-600
    cost: 2500, currency: 'stardust',
    requires: ['mars'],
    orbitSpeed: 0.001, startAngle: 1.2
  },
  {
    id: 'io',
    parentId: 'jupiter',
    name: 'Io',
    type: 'Moon',
    description: 'The most volcanically active body in the solar system.',
    perk: 'Volcanic Forge: Themes cost 15% less',
    x: 0, y: 0, radius: 6, orbitRadius: 60,
    color: '#facc15', // Sulfur Yellow
    cost: 400, currency: 'stardust',
    requires: ['jupiter'],
    orbitSpeed: 0.05, startAngle: 0
  },
  {
    id: 'europa',
    parentId: 'jupiter',
    name: 'Europa',
    type: 'Moon',
    description: 'An icy shell covering a vast subsurface ocean.',
    perk: 'Deep Freeze: Unlocks "Ice World" Theme',
    x: 0, y: 0, radius: 5, orbitRadius: 75,
    color: '#f1f5f9', // Ice White
    cost: 500, currency: 'stardust',
    requires: ['jupiter'],
    orbitSpeed: 0.04, startAngle: 2
  },
  {
    id: 'ganymede',
    parentId: 'jupiter',
    name: 'Ganymede',
    type: 'Moon',
    description: 'The largest moon, bigger than Mercury.',
    perk: 'Magnetic Shield: 1x Streak Protection / week',
    x: 0, y: 0, radius: 8, orbitRadius: 95,
    color: '#9ca3af', // Gray
    cost: 500, currency: 'stardust',
    requires: ['jupiter'],
    orbitSpeed: 0.03, startAngle: 4
  },
  {
    id: 'callisto',
    parentId: 'jupiter',
    name: 'Callisto',
    type: 'Moon',
    description: 'The most heavily cratered object in the solar system.',
    perk: 'Scarred Visage: Unlocks "Crater" Theme',
    x: 0, y: 0, radius: 7, orbitRadius: 115,
    color: '#475569', // Slate-600
    cost: 500, currency: 'stardust',
    requires: ['jupiter'],
    orbitSpeed: 0.02, startAngle: 5.5
  },

  // --- SATURN SYSTEM ---
  {
    id: 'saturn',
    parentId: 'sun',
    name: 'Saturn',
    type: 'Planet',
    description: 'The Ringed Jewel. Less dense than water.',
    perk: 'Guardian: +2 Streak Protection / week',
    x: 0, y: 0, radius: 40, orbitRadius: 580,
    color: '#eab308', // Yellow-500
    cost: 3500, currency: 'stardust',
    requires: ['jupiter'],
    orbitSpeed: 0.0008, startAngle: 4.2
  },
  {
    id: 'titan',
    parentId: 'saturn',
    name: 'Titan',
    type: 'Moon',
    description: 'The only moon with a thick atmosphere and liquid methane lakes.',
    perk: 'Thick Atmosphere: Slower timer (-10%)',
    x: 0, y: 0, radius: 9, orbitRadius: 70,
    color: '#f59e0b', // Hazy Orange
    cost: 600, currency: 'stardust',
    requires: ['saturn'],
    orbitSpeed: 0.03, startAngle: 1
  },

  // --- OUTER GIANTS ---
  {
    id: 'uranus',
    parentId: 'sun',
    name: 'Uranus',
    type: 'Planet',
    description: 'The Ice Giant that rolls on its side.',
    perk: 'Deep Focus: Timer runs 15% slower',
    x: 0, y: 0, radius: 28, orbitRadius: 720,
    color: '#22d3ee', // Cyan-400
    cost: 5000, currency: 'stardust',
    requires: ['saturn'],
    orbitSpeed: 0.0004, startAngle: 0.5
  },
  {
    id: 'neptune',
    parentId: 'sun',
    name: 'Neptune',
    type: 'Planet',
    description: 'The Windy Planet with supersonic storms.',
    perk: 'Treasure Hunter: 5% Chance for Comet Shard drop',
    x: 0, y: 0, radius: 26, orbitRadius: 850,
    color: '#1d4ed8', // Blue-700
    cost: 7500, currency: 'stardust',
    requires: ['uranus'],
    orbitSpeed: 0.0003, startAngle: 2.8
  },
  {
    id: 'triton',
    parentId: 'neptune',
    name: 'Triton',
    type: 'Moon',
    description: 'A captured object that orbits in retrograde.',
    perk: 'Retrograde: 10% Chance to refund Stardust cost',
    x: 0, y: 0, radius: 6, orbitRadius: 50,
    color: '#cbd5e1', // Ice Blue Gray
    cost: 800, currency: 'stardust',
    requires: ['neptune'],
    orbitSpeed: -0.04, // Negative speed for Retrograde orbit!
    startAngle: 1
  }
];

// --- STORE IMPLEMENTATION ---

export const useGalaxyStore = create<GalaxyState>()(
  persist(
    (set, get) => ({
      unlockedNodeIds: ['sun'], // Sun is always unlocked
      historyStars: [],

      isNodeUnlocked: (id) => get().unlockedNodeIds.includes(id),

      isNodeUnlockable: (id) => {
        const node = SOLAR_SYSTEM.find(n => n.id === id);
        if (!node) return false;
        if (get().unlockedNodeIds.includes(id)) return false; 
        if (node.requires) {
          return node.requires.every(reqId => get().unlockedNodeIds.includes(reqId));
        }
        return true;
      },

      unlockNode: (nodeId) => {
        const state = get();
        if (state.unlockedNodeIds.includes(nodeId)) return true;
        set((state) => ({ unlockedNodeIds: [...state.unlockedNodeIds, nodeId] }));
        return true;
      },

      addHistoryStar: () => {
        const newStar: HistoryStar = {
          id: crypto.randomUUID(),
          x: (Math.random() * 4000) - 2000,
          y: (Math.random() * 4000) - 2000,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.5 + 0.1, 
          dateUnlocked: new Date().toISOString(),
        };

        set((state) => {
            const updatedStars = [...state.historyStars, newStar];
            if (updatedStars.length > 1000) updatedStars.shift();
            return { historyStars: updatedStars };
        });
      },

      // RESET ACTION
      resetGalaxy: () => {
        set({
          unlockedNodeIds: ['sun'],
          historyStars: []
        });
      }
    }),
    {
      name: 'ku-galaxy-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);