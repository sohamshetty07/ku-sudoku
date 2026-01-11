import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useGalaxyStore } from '@/lib/store/galaxy'; 

// --- TYPES ---
export interface GameState {
  initialBoard: number[][];
  boardState: number[][];
  solution: number[][];
  notes: Record<string, number[]>;
  history: { board: number[][]; notes: Record<string, number[]> }[];
  mistakes: number;
  timeElapsed: number;
  difficulty: 'Relaxed' | 'Standard' | 'Mastery';
  cellTimes: Record<string, number>; 
  isGameOver?: boolean;
  isWon?: boolean;
}

interface UserStore {
  // 1. SKILL
  elo: number;
  updateElo: (change: number) => void;

  // 2. PROGRESSION (Constellation)
  xp: number;
  addXp: (amount: number) => void;
  
  stardust: number;
  cometShards: number;
  addCurrency: (type: 'stardust' | 'cometShards', amount: number) => void;

  unlockedThemes: string[];
  unlockTheme: (themeId: string) => void;

  // 3. LIFETIME STATS
  gamesPlayed: number;
  gamesWon: number;
  flawlessWins: number;
  bestTimes: {
    Relaxed: number | null;
    Standard: number | null;
    Mastery: number | null;
  };
  incrementStats: (isWin: boolean, mode: 'Relaxed' | 'Standard' | 'Mastery', time: number, mistakes: number) => void;

  // 4. GAME STATE
  activeGame: GameState | null;
  saveGame: (game: GameState) => void;
  clearGame: () => void;

  // PERKS STATE
  maxMistakes: number; 
  refreshPerks: () => void; 

  // DAILY REWARD MODAL STATE
  showDailyRewardModal: boolean;
  closeDailyRewardModal: () => void;

  // 5. VISUALS
  themeDifficulty: 'Relaxed' | 'Standard' | 'Mastery';
  setThemeDifficulty: (diff: 'Relaxed' | 'Standard' | 'Mastery') => void;
  
  activeThemeId: string;
  setActiveTheme: (themeId: string) => void;

  // 6. STREAK TRACKING
  currentStreak: number;
  lastPlayedDate: string | null; 
  updateStreak: () => void;

  // 7. SETTINGS
  audioEnabled: boolean;
  timerVisible: boolean;      
  autoEraseNotes: boolean;    
  
  toggleAudio: () => void;
  toggleTimer: () => void;    
  toggleAutoErase: () => void;

  // 8. RESET ACCOUNT
  resetProgress: () => Promise<void>; 

  // 9. SYNC ACTION
  pushSync: () => Promise<void>;
}

// --- STORE IMPLEMENTATION ---
export const useStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // DEFAULTS
      elo: 1000,
      xp: 0,
      stardust: 0,
      cometShards: 0,
      unlockedThemes: ['midnight'], 
      gamesPlayed: 0,
      gamesWon: 0,
      flawlessWins: 0,
      bestTimes: { Relaxed: null, Standard: null, Mastery: null },
      
      activeGame: null,
      maxMistakes: 3, 
      
      showDailyRewardModal: false,

      themeDifficulty: 'Standard',
      activeThemeId: 'midnight',
      
      currentStreak: 0,
      lastPlayedDate: null,

      audioEnabled: true,
      timerVisible: true,     
      autoEraseNotes: true,   

      // ACTIONS
      updateElo: (change) => set((state) => ({ elo: state.elo + change })),
      
      addXp: (amount) => set((state) => {
        let finalAmount = amount;
        const isMarsUnlocked = useGalaxyStore.getState().isNodeUnlocked('mars');
        if (isMarsUnlocked) {
            finalAmount = Math.floor(amount * 1.15); 
        }
        return { xp: state.xp + finalAmount };
      }),
      
      addCurrency: (type, amount) => set((state) => {
        let finalAmount = amount;
        if (type === 'stardust') {
           const isMercuryUnlocked = useGalaxyStore.getState().isNodeUnlocked('mercury');
           if (isMercuryUnlocked) {
               finalAmount = Math.floor(amount * 1.10); 
           }
        }
        return { [type]: state[type] + finalAmount };
      }),
      
      unlockTheme: (themeId) => set((state) => ({
        unlockedThemes: state.unlockedThemes.includes(themeId) 
          ? state.unlockedThemes 
          : [...state.unlockedThemes, themeId]
      })),

      refreshPerks: () => {
        const isEarthUnlocked = useGalaxyStore.getState().isNodeUnlocked('earth');
        set({ maxMistakes: isEarthUnlocked ? 4 : 3 });
      },

      closeDailyRewardModal: () => set({ showDailyRewardModal: false }),

      incrementStats: (isWin, mode, time, mistakes) => set((state) => {
        const newGamesPlayed = state.gamesPlayed + 1;
        if (!isWin) return { gamesPlayed: newGamesPlayed };

        const newGamesWon = state.gamesWon + 1;
        const isFlawless = mistakes === 0;
        const newFlawlessWins = isFlawless ? state.flawlessWins + 1 : state.flawlessWins;

        const currentBest = state.bestTimes[mode];
        let newBestTime = currentBest;
        if (currentBest === null || time < currentBest) {
          newBestTime = time;
        }

        return {
          gamesPlayed: newGamesPlayed,
          gamesWon: newGamesWon,
          flawlessWins: newFlawlessWins,
          bestTimes: { ...state.bestTimes, [mode]: newBestTime }
        };
      }),

      saveGame: (game) => set({ activeGame: game }),
      clearGame: () => set({ activeGame: null }),
      setThemeDifficulty: (diff) => set({ themeDifficulty: diff }),
      setActiveTheme: (themeId) => set({ activeThemeId: themeId }),

      updateStreak: () => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        if (state.lastPlayedDate === today) return {}; 

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        const newStreak = (state.lastPlayedDate === yesterdayString) ? state.currentStreak + 1 : 1;

        const isVenusUnlocked = useGalaxyStore.getState().isNodeUnlocked('venus');
        const stardustBonus = isVenusUnlocked ? 50 : 0;

        return { 
            currentStreak: newStreak, 
            lastPlayedDate: today,
            stardust: state.stardust + stardustBonus,
            showDailyRewardModal: isVenusUnlocked
        };
      }),

      toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),
      toggleTimer: () => set((state) => ({ timerVisible: !state.timerVisible })),
      toggleAutoErase: () => set((state) => ({ autoEraseNotes: !state.autoEraseNotes })),

      // [UPDATED] RESET PROGRESS (Clears Galaxy Too)
      resetProgress: async () => {
        // 1. Reset Main Store
        set({
          elo: 1000,
          xp: 0,
          stardust: 0,
          cometShards: 0,
          unlockedThemes: ['midnight'],
          gamesPlayed: 0,
          gamesWon: 0,
          flawlessWins: 0,
          bestTimes: { Relaxed: null, Standard: null, Mastery: null },
          activeGame: null,
          activeThemeId: 'midnight',
          currentStreak: 0,
          lastPlayedDate: null,
          maxMistakes: 3, 
          showDailyRewardModal: false, 
          audioEnabled: true,
          timerVisible: true,
          autoEraseNotes: true,
        });

        // 2. [NEW] Reset Galaxy Store
        useGalaxyStore.getState().resetGalaxy();

        // 3. Reset Server
        try {
          await fetch("/api/user/reset", { method: "POST" });
          console.log("✅ Server data reset.");
        } catch (err) {
          console.error("Failed to reset server data:", err);
        }
      },

      // [UPDATED] PUSH SYNC ACTION (Includes Galaxy Data)
      pushSync: async () => {
        const state = get();
        // [NEW] Get Galaxy State directly
        const galaxyState = useGalaxyStore.getState();
        
        const payload = {
          // --- USER STATS ---
          elo: state.elo,
          xp: state.xp,
          stardust: state.stardust,
          cometShards: state.cometShards,
          unlockedThemes: state.unlockedThemes,
          gamesPlayed: state.gamesPlayed,
          gamesWon: state.gamesWon,
          flawlessWins: state.flawlessWins,
          currentStreak: state.currentStreak,
          lastPlayedDate: state.lastPlayedDate,
          bestTimes: state.bestTimes,
          
          // --- SETTINGS ---
          activeThemeId: state.activeThemeId,
          audioEnabled: state.audioEnabled,
          timerVisible: state.timerVisible,
          autoEraseNotes: state.autoEraseNotes,

          // [NEW] GALAXY DATA (Added to Payload)
          unlockedNodeIds: galaxyState.unlockedNodeIds,
          historyStars: galaxyState.historyStars,
        };

        try {
          console.log("☁️ Syncing with cloud...");
          const res = await fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          
          const data = await res.json();
          
          if (data.success && data.user) {
             const u = data.user;
             const p = u.progression || {};
             const s = u.stats || {};
             const pref = u.settings || {};
             // [NEW] Galaxy Data from DB
             const g = u.galaxy || {}; 

             // 1. Update Main Store
             set({
               elo: p.elo,
               xp: p.xp,
               stardust: p.stardust,
               cometShards: p.cometShards,
               unlockedThemes: p.unlockedThemes,
               gamesPlayed: s.gamesPlayed,
               gamesWon: s.gamesWon,
               flawlessWins: s.flawlessWins,
               currentStreak: s.currentStreak,
               lastPlayedDate: s.lastPlayedDate,
               bestTimes: {
                 Relaxed: s.bestTimeRelaxed || null,
                 Standard: s.bestTimeStandard || null,
                 Mastery: s.bestTimeMastery || null,
               },
               activeThemeId: pref.activeThemeId || 'midnight',
               audioEnabled: pref.audioEnabled ?? true,
               timerVisible: pref.timerVisible ?? true,
               autoEraseNotes: pref.autoEraseNotes ?? true,
             });

             // 2. [NEW] Update Galaxy Store from Cloud Data
             if (g.unlockedNodeIds) {
                 useGalaxyStore.setState({ 
                     unlockedNodeIds: g.unlockedNodeIds,
                     historyStars: g.historyStars || [] 
                 });
             }

             console.log("✅ Sync successful.");
          }
        } catch (err) {
          console.error("Sync failed:", err);
        }
      },
    }),
    {
      name: 'ku-storage',
    }
  )
);