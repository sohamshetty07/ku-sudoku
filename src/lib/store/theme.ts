export interface Theme {
  id: string;
  name: string;
  description: string;
  type: 'Standard' | 'Premium' | 'Legendary';
  cost: number;
  currency: 'stardust' | 'cometShards';
  
  // Shop Visuals
  previewColor: string; 

  // App Visuals (CSS/Tailwind)
  background: string;   
  gridBorder: string;
  gridColor: string; // <--- NEW: Required for grid preview logic
  numColor: string;     
  
  // Animation Visuals (Hex)
  accentHex: string;    
}

export const SHOP_THEMES: Theme[] = [
  // --- TIER 1: STANDARD (Stardust) ---
  {
    id: 'midnight',
    name: 'Midnight Void',
    description: 'The standard protocol. Clean and efficient.',
    type: 'Standard',
    cost: 0,
    currency: 'stardust',
    previewColor: '#0F172A',
    background: 'radial-gradient(circle at center, #1e293b 0%, #0F172A 100%)',
    gridBorder: 'border-white/20',
    gridColor: 'rgba(255, 255, 255, 0.1)',
    numColor: 'text-neon-cyan',
    accentHex: '#22d3ee', 
  },
  {
    id: 'matrix',
    name: 'Construct',
    description: 'Raw code visibility. See the logic.',
    type: 'Standard',
    cost: 500,
    currency: 'stardust',
    previewColor: '#10b981',
    background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.15) 0%, #022c22 80%, #000000 100%)',
    gridBorder: 'border-emerald-500/30',
    gridColor: 'rgba(16, 185, 129, 0.2)',
    numColor: 'text-emerald-400',
    accentHex: '#34d399', 
  },
  {
    id: 'sunset',
    name: 'Horizon',
    description: 'Focus in the warmth of a dying star.',
    type: 'Standard',
    cost: 1000,
    currency: 'stardust',
    previewColor: '#f59e0b',
    background: 'radial-gradient(circle at center, rgba(245, 158, 11, 0.15) 0%, #451a03 80%, #000000 100%)',
    gridBorder: 'border-orange-500/30',
    gridColor: 'rgba(249, 115, 22, 0.2)',
    numColor: 'text-orange-400',
    accentHex: '#fb923c', 
  },
  {
    id: 'glacier',
    name: 'Permafrost',
    description: 'Cold logic. High contrast visibility.',
    type: 'Standard',
    cost: 1500,
    currency: 'stardust',
    previewColor: '#e0f2fe',
    background: 'radial-gradient(circle at center, #0c4a6e 0%, #082f49 100%)',
    gridBorder: 'border-sky-300/30',
    gridColor: 'rgba(125, 211, 252, 0.2)',
    numColor: 'text-sky-200',
    accentHex: '#bae6fd', 
  },
  {
    id: 'verdant',
    name: 'Overgrowth',
    description: 'Nature reclaiming the machine.',
    type: 'Standard',
    cost: 2000,
    currency: 'stardust',
    previewColor: '#4ade80',
    background: 'radial-gradient(circle at center, rgba(20, 83, 45, 0.4) 0%, #052e16 100%)',
    gridBorder: 'border-green-500/30',
    gridColor: 'rgba(74, 222, 128, 0.2)',
    numColor: 'text-green-400',
    accentHex: '#4ade80',
  },
  {
    id: 'abyss',
    name: 'The Abyss',
    description: 'Deep pressure. Crushing depths.',
    type: 'Standard',
    cost: 2500,
    currency: 'stardust',
    previewColor: '#06b6d4',
    background: 'radial-gradient(circle at bottom, #155e75 0%, #083344 100%)',
    gridBorder: 'border-cyan-700/50',
    gridColor: 'rgba(6, 182, 212, 0.2)',
    numColor: 'text-cyan-300',
    accentHex: '#22d3ee',
  },

  // --- TIER 2: PREMIUM (Comet Shards) ---
  {
    id: 'nebula',
    name: 'Nebula',
    description: 'Forged from the heart of a galaxy.',
    type: 'Premium',
    cost: 5,
    currency: 'cometShards',
    previewColor: '#8b5cf6',
    background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.2) 0%, #2e1065 70%, #000000 100%)',
    gridBorder: 'border-purple-500/40',
    gridColor: 'rgba(168, 85, 247, 0.2)',
    numColor: 'text-purple-400',
    accentHex: '#c084fc', 
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    description: 'Neon sunsets and digital dreams.',
    type: 'Premium',
    cost: 6,
    currency: 'cometShards',
    previewColor: '#d946ef',
    background: 'linear-gradient(to bottom, #2e1065 0%, #4a044e 100%)',
    gridBorder: 'border-fuchsia-500/40',
    gridColor: 'rgba(232, 121, 249, 0.25)',
    numColor: 'text-fuchsia-400',
    accentHex: '#e879f9',
  },
  {
    id: 'sakura',
    name: 'Blossom',
    description: 'Peaceful, soft pink hues for relaxed play.',
    type: 'Premium',
    cost: 8,
    currency: 'cometShards',
    previewColor: '#f472b6',
    background: 'radial-gradient(circle at center, rgba(244, 114, 182, 0.15) 0%, #500724 80%, #000000 100%)',
    gridBorder: 'border-pink-400/30',
    gridColor: 'rgba(244, 114, 182, 0.2)',
    numColor: 'text-pink-300',
    accentHex: '#f9a8d4', 
  },
  {
    id: 'cyber',
    name: 'Edgerunner',
    description: 'High-tech yellow against deep blue.',
    type: 'Premium',
    cost: 10,
    currency: 'cometShards',
    previewColor: '#facc15',
    background: 'linear-gradient(to bottom right, #172554, #000000)',
    gridBorder: 'border-yellow-400/40',
    gridColor: 'rgba(250, 204, 21, 0.2)',
    numColor: 'text-yellow-400',
    accentHex: '#facc15', 
  },
  {
    id: 'midas',
    name: 'Midas Touch',
    description: 'Luxury gold for the high rollers.',
    type: 'Premium',
    cost: 12,
    currency: 'cometShards',
    previewColor: '#fbbf24',
    background: 'radial-gradient(circle at center, rgba(180, 83, 9, 0.2) 0%, #451a03 100%)',
    gridBorder: 'border-amber-400/40',
    gridColor: 'rgba(251, 191, 36, 0.25)',
    numColor: 'text-amber-300',
    accentHex: '#fcd34d',
  },

  // --- TIER 3: LEGENDARY (Comet Shards) ---
  {
    id: 'crimson',
    name: 'Singularity',
    description: 'The event horizon. Aggressive and bold.',
    type: 'Legendary',
    cost: 15,
    currency: 'cometShards',
    previewColor: '#ef4444',
    background: 'radial-gradient(circle at center, rgba(153, 27, 27, 0.4) 0%, #000000 90%)',
    gridBorder: 'border-red-600/50',
    gridColor: 'rgba(220, 38, 38, 0.3)',
    numColor: 'text-red-500',
    accentHex: '#ef4444', 
  },
  {
    id: 'noir',
    name: 'Noir',
    description: 'Total desaturation. Pure focus.',
    type: 'Legendary',
    cost: 20,
    currency: 'cometShards',
    previewColor: '#ffffff',
    background: '#000000',
    gridBorder: 'border-white/40',
    gridColor: 'rgba(255, 255, 255, 0.15)',
    numColor: 'text-white',
    accentHex: '#ffffff', 
  },
  {
    id: 'void',
    name: 'True Void',
    description: 'The absence of light. Minimalist perfection.',
    type: 'Legendary',
    cost: 25,
    currency: 'cometShards',
    previewColor: '#171717',
    background: 'radial-gradient(circle at bottom, #262626 0%, #000000 100%)',
    gridBorder: 'border-neutral-700',
    gridColor: 'rgba(64, 64, 64, 0.3)',
    numColor: 'text-neutral-200',
    accentHex: '#e5e5e5', 
  },
  {
    id: 'lumina',
    name: 'Lumina',
    description: 'Blinding light. For those who fear the dark.',
    type: 'Legendary',
    cost: 30,
    currency: 'cometShards',
    previewColor: '#f8fafc',
    background: 'radial-gradient(circle at center, #e2e8f0 0%, #cbd5e1 100%)',
    gridBorder: 'border-slate-400',
    gridColor: 'rgba(71, 85, 105, 0.2)',
    numColor: 'text-slate-800',
    accentHex: '#0f172a', // Dark accent for contrast
  },
];

export const getThemeById = (id: string): Theme => {
  return SHOP_THEMES.find((t) => t.id === id) || SHOP_THEMES[0];
};