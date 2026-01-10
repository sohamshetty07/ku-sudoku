import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

  // 3. LIFETIME STATS (Detailed)
  gamesPlayed: number;
  gamesWon: number;
  flawlessWins: number;
  bestTimes: {
    Relaxed: number | null;
    Standard: number | null;
    Mastery: number | null;
  };
  incrementStats: (isWin: boolean, mode: 'Relaxed' | 'Standard' | 'Mastery', time: number, mistakes: number) => void;

  // 4. GAME STATE (Active Session)
  activeGame: GameState | null;
  saveGame: (game: GameState) => void;
  clearGame: () => void;

  // 5. VISUALS
  themeDifficulty: 'Relaxed' | 'Standard' | 'Mastery';
  setThemeDifficulty: (diff: 'Relaxed' | 'Standard' | 'Mastery') => void;
  
  // Active Theme State
  activeThemeId: string;
  setActiveTheme: (themeId: string) => void;

  // 6. STREAK TRACKING
  currentStreak: number;
  lastPlayedDate: string | null; 
  updateStreak: () => void;

  // 7. SETTINGS (AUDIO & GAMEPLAY)
  audioEnabled: boolean;
  timerVisible: boolean;      
  autoEraseNotes: boolean;    
  
  toggleAudio: () => void;
  toggleTimer: () => void;    
  toggleAutoErase: () => void;

  // 8. RESET ACCOUNT
  resetProgress: () => Promise<void>; 

  // 9. SYNC ACTION (PUSH & PULL)
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
      themeDifficulty: 'Standard',
      activeThemeId: 'midnight',
      
      // Streak Defaults
      currentStreak: 0,
      lastPlayedDate: null,

      // Settings Defaults
      audioEnabled: true,
      timerVisible: true,     
      autoEraseNotes: true,   

      // ACTIONS
      updateElo: (change) => set((state) => ({ elo: state.elo + change })),
      
      addXp: (amount) => set((state) => ({ xp: state.xp + amount })),
      
      addCurrency: (type, amount) => set((state) => ({ 
        [type]: state[type] + amount 
      })),
      
      unlockTheme: (themeId) => set((state) => ({
        unlockedThemes: state.unlockedThemes.includes(themeId) 
          ? state.unlockedThemes 
          : [...state.unlockedThemes, themeId]
      })),

      incrementStats: (isWin, mode, time, mistakes) => set((state) => {
        const newGamesPlayed = state.gamesPlayed + 1;

        if (!isWin) {
          return { gamesPlayed: newGamesPlayed };
        }

        const newGamesWon = state.gamesWon + 1;
        
        // Flawless Check
        const isFlawless = mistakes === 0;
        const newFlawlessWins = isFlawless ? state.flawlessWins + 1 : state.flawlessWins;

        // Best Time Check (Lower is better)
        const currentBest = state.bestTimes[mode];
        let newBestTime = currentBest;
        
        if (currentBest === null || time < currentBest) {
          newBestTime = time;
        }

        return {
          gamesPlayed: newGamesPlayed,
          gamesWon: newGamesWon,
          flawlessWins: newFlawlessWins,
          bestTimes: {
            ...state.bestTimes,
            [mode]: newBestTime
          }
        };
      }),

      saveGame: (game) => set({ activeGame: game }),
      clearGame: () => set({ activeGame: null }),
      setThemeDifficulty: (diff) => set({ themeDifficulty: diff }),
      setActiveTheme: (themeId) => set({ activeThemeId: themeId }),

      updateStreak: () => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        
        if (state.lastPlayedDate === today) {
          return {}; 
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        if (state.lastPlayedDate === yesterdayString) {
          return { currentStreak: state.currentStreak + 1, lastPlayedDate: today };
        } else {
          return { currentStreak: 1, lastPlayedDate: today };
        }
      }),

      // SETTINGS ACTIONS
      toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),
      toggleTimer: () => set((state) => ({ timerVisible: !state.timerVisible })),
      toggleAutoErase: () => set((state) => ({ autoEraseNotes: !state.autoEraseNotes })),

      // ASYNC HARD RESET ACTION
      resetProgress: async () => {
        // 1. IMMEDIATE LOCAL WIPE (Fixes Race Condition)
        // We clear local state first so no background sync sends old data.
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
          // Optional: Reset settings to default
          audioEnabled: true,
          timerVisible: true,
          autoEraseNotes: true,
        });

        // 2. SERVER WIPE
        try {
          await fetch("/api/user/reset", { method: "POST" });
          console.log("✅ Server data reset.");
        } catch (err) {
          console.error("Failed to reset server data:", err);
        }
      },

      // NEW: PUSH SYNC ACTION (Sends Local Data -> Cloud -> Updates Local with Merged Data)
      pushSync: async () => {
        const state = get();
        
        // 1. Prepare Payload
        const payload = {
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
          
          activeThemeId: state.activeThemeId,
          audioEnabled: state.audioEnabled,
          timerVisible: state.timerVisible,
          autoEraseNotes: state.autoEraseNotes,
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
             // 2. Merge Cloud Data Back
             const u = data.user;
             const p = u.progression || {};
             const s = u.stats || {};
             const pref = u.settings || {};

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