import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useGalaxyStore } from '@/lib/store/galaxy'; 

// [NEW] Transaction Types for robustness
export type Transaction = {
  id: string; // UUID to prevent double-processing
  type: 'SPEND_CURRENCY' | 'EARN_CURRENCY' | 'UNLOCK_THEME';
  payload: any;
  timestamp: number;
};

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
  // META STATE
  hasHydrated: boolean;
  isDirty: boolean;
  setHasHydrated: (val: boolean) => void;

  // [NEW] TRANSACTION QUEUE
  pendingTransactions: Transaction[];
  clearProcessedTransactions: (processedIds: string[]) => void;

  // 1. SKILL
  elo: number;
  eloLastUpdated: number;
  updateElo: (change: number) => void;

  // 2. PROGRESSION
  xp: number;
  xpLastUpdated: number;
  addXp: (amount: number) => void;
  
  stardust: number;
  cometShards: number;
  currencyLastUpdated: number;
  // [UPDATED] Robust Currency Actions
  addCurrency: (type: 'stardust' | 'cometShards', amount: number) => void;
  spendCurrency: (type: 'stardust' | 'cometShards', amount: number) => boolean; // Returns success/fail

  unlockedThemes: string[];
  themesLastUpdated: number;
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
  statsLastUpdated: number;
  incrementStats: (isWin: boolean, mode: 'Relaxed' | 'Standard' | 'Mastery', time: number, mistakes: number) => void;

  // 4. GAME STATE
  activeGame: GameState | null;
  saveGame: (game: GameState) => void;
  clearGame: () => void;

  // PERKS
  maxMistakes: number; 
  refreshPerks: () => void; 

  // UI STATE
  showDailyRewardModal: boolean;
  closeDailyRewardModal: () => void;

  // VISUALS
  themeDifficulty: 'Relaxed' | 'Standard' | 'Mastery';
  setThemeDifficulty: (diff: 'Relaxed' | 'Standard' | 'Mastery') => void;
  activeThemeId: string;
  setActiveTheme: (themeId: string) => void;

  // STREAK
  currentStreak: number;
  lastPlayedDate: string | null; 
  updateStreak: () => void;

  // SETTINGS
  audioEnabled: boolean;
  timerVisible: boolean;      
  autoEraseNotes: boolean;    
  inputMode: 'cell-first' | 'digit-first';
  textSize: 'standard' | 'large';
  highlightCompletions: boolean;
  settingsLastUpdated: number;

  toggleAudio: () => void;
  toggleTimer: () => void;    
  toggleAutoErase: () => void;
  toggleInputMode: () => void;
  toggleTextSize: () => void;
  toggleHighlightCompletions: () => void;

  // SYSTEM ACTIONS
  resetProgress: () => Promise<void>; 
  pushSync: () => Promise<void>;
  logout: () => void; 
}

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

export const useStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // DEFAULTS
      hasHydrated: false,
      isDirty: false,
      setHasHydrated: (val) => set({ hasHydrated: val }),
      pendingTransactions: [],

      elo: 1000,
      eloLastUpdated: 0,
      xp: 0,
      xpLastUpdated: 0,
      stardust: 0,
      cometShards: 0,
      currencyLastUpdated: 0,
      unlockedThemes: ['midnight'], 
      themesLastUpdated: 0,
      
      gamesPlayed: 0,
      gamesWon: 0,
      flawlessWins: 0,
      bestTimes: { Relaxed: null, Standard: null, Mastery: null },
      statsLastUpdated: 0,
      
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
      inputMode: 'cell-first',
      textSize: 'standard',
      highlightCompletions: true,
      settingsLastUpdated: 0,

      // --- LOGIC ---

      clearProcessedTransactions: (processedIds) => set((state) => ({
        pendingTransactions: state.pendingTransactions.filter(t => !processedIds.includes(t.id))
      })),

      updateElo: (change) => set((state) => ({ 
        elo: state.elo + change,
        eloLastUpdated: Date.now(),
        isDirty: true 
      })),
      
      addXp: (amount) => set((state) => {
        let finalAmount = amount;
        const isMarsUnlocked = useGalaxyStore.getState().isNodeUnlocked('mars');
        if (isMarsUnlocked) finalAmount = Math.floor(amount * 1.15); 
        return { 
          xp: state.xp + finalAmount,
          xpLastUpdated: Date.now(),
          isDirty: true
        };
      }),
      
      addCurrency: (type, amount) => set((state) => {
        let finalAmount = amount;
        if (type === 'stardust') {
           const isMercuryUnlocked = useGalaxyStore.getState().isNodeUnlocked('mercury');
           if (isMercuryUnlocked) finalAmount = Math.floor(amount * 1.10); 
        }
        
        // Optimistic Update
        const newState = { [type]: state[type] + finalAmount };
        
        // Log Transaction
        const transaction: Transaction = {
            id: generateId(),
            type: 'EARN_CURRENCY',
            payload: { type, amount: finalAmount },
            timestamp: Date.now()
        };

        return { 
          ...newState,
          currencyLastUpdated: Date.now(),
          pendingTransactions: [...state.pendingTransactions, transaction],
          isDirty: true
        };
      }),

      spendCurrency: (type, amount) => {
        const state = get();
        if (state[type] < amount) return false; // Insufficient funds

        // Log Transaction
        const transaction: Transaction = {
            id: generateId(),
            type: 'SPEND_CURRENCY',
            payload: { type, amount },
            timestamp: Date.now()
        };

        set({ 
            [type]: state[type] - amount,
            currencyLastUpdated: Date.now(),
            pendingTransactions: [...state.pendingTransactions, transaction],
            isDirty: true
        });
        return true;
      },
      
      unlockTheme: (themeId) => set((state) => {
        if (state.unlockedThemes.includes(themeId)) return {};
        
        // Log Transaction
        const transaction: Transaction = {
            id: generateId(),
            type: 'UNLOCK_THEME',
            payload: { themeId },
            timestamp: Date.now()
        };

        return {
            unlockedThemes: [...state.unlockedThemes, themeId],
            themesLastUpdated: Date.now(),
            pendingTransactions: [...state.pendingTransactions, transaction],
            isDirty: true
        }
      }),

      refreshPerks: () => {
        const isEarthUnlocked = useGalaxyStore.getState().isNodeUnlocked('earth');
        set({ maxMistakes: isEarthUnlocked ? 4 : 3 });
      },

      closeDailyRewardModal: () => set({ showDailyRewardModal: false }),

      incrementStats: (isWin, mode, time, mistakes) => set((state) => {
        const newGamesPlayed = state.gamesPlayed + 1;
        let updates: Partial<UserStore> = { gamesPlayed: newGamesPlayed };

        if (isWin) {
          const newGamesWon = state.gamesWon + 1;
          const isFlawless = mistakes === 0;
          const newFlawlessWins = isFlawless ? state.flawlessWins + 1 : state.flawlessWins;

          const currentBest = state.bestTimes[mode];
          let newBestTime = currentBest;
          if (currentBest === null || time < currentBest) {
            newBestTime = time;
          }

          updates = {
            ...updates,
            gamesWon: newGamesWon,
            flawlessWins: newFlawlessWins,
            bestTimes: { ...state.bestTimes, [mode]: newBestTime }
          };
        }

        return {
          ...updates,
          statsLastUpdated: Date.now(),
          isDirty: true
        };
      }),

      saveGame: (game) => set({ activeGame: game }),
      clearGame: () => set({ activeGame: null }),
      setThemeDifficulty: (diff) => set({ themeDifficulty: diff }),
      setActiveTheme: (themeId) => set((state) => ({ 
        activeThemeId: themeId,
        settingsLastUpdated: Date.now(),
        isDirty: true
      })),

      updateStreak: () => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        if (state.lastPlayedDate === today) return {}; 

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        const newStreak = (state.lastPlayedDate === yesterdayString) ? state.currentStreak + 1 : 1;

        const isVenusUnlocked = useGalaxyStore.getState().isNodeUnlocked('venus');
        const stardustBonus = isVenusUnlocked ? 50 : 0;

        // If bonus earned, add transaction
        let transactions = state.pendingTransactions;
        if (stardustBonus > 0) {
             transactions = [...transactions, {
                id: generateId(),
                type: 'EARN_CURRENCY',
                payload: { type: 'stardust', amount: stardustBonus },
                timestamp: Date.now()
             }];
        }

        return { 
            currentStreak: newStreak, 
            lastPlayedDate: today,
            stardust: state.stardust + stardustBonus,
            showDailyRewardModal: isVenusUnlocked,
            pendingTransactions: transactions,
            statsLastUpdated: Date.now(),
            isDirty: true
        };
      }),

      toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled, settingsLastUpdated: Date.now(), isDirty: true })),
      toggleTimer: () => set((state) => ({ timerVisible: !state.timerVisible, settingsLastUpdated: Date.now(), isDirty: true })),
      toggleAutoErase: () => set((state) => ({ autoEraseNotes: !state.autoEraseNotes, settingsLastUpdated: Date.now(), isDirty: true })),
      toggleInputMode: () => set((state) => ({ inputMode: state.inputMode === 'cell-first' ? 'digit-first' : 'cell-first', settingsLastUpdated: Date.now(), isDirty: true })),
      toggleTextSize: () => set((state) => ({ textSize: state.textSize === 'standard' ? 'large' : 'standard', settingsLastUpdated: Date.now(), isDirty: true })),
      toggleHighlightCompletions: () => set((state) => ({ highlightCompletions: !state.highlightCompletions, settingsLastUpdated: Date.now(), isDirty: true })),

      logout: () => {
        set({
          elo: 1000, eloLastUpdated: 0,
          xp: 0, xpLastUpdated: 0,
          stardust: 0, cometShards: 0, currencyLastUpdated: 0,
          unlockedThemes: ['midnight'], themesLastUpdated: 0,
          gamesPlayed: 0, gamesWon: 0, flawlessWins: 0,
          bestTimes: { Relaxed: null, Standard: null, Mastery: null }, statsLastUpdated: 0,
          activeGame: null, activeThemeId: 'midnight',
          currentStreak: 0, lastPlayedDate: null,
          maxMistakes: 3, showDailyRewardModal: false, 
          audioEnabled: true, timerVisible: true, autoEraseNotes: true,
          inputMode: 'cell-first', textSize: 'standard', highlightCompletions: true, settingsLastUpdated: 0,
          pendingTransactions: [],
          isDirty: false
        });
        useGalaxyStore.getState().resetGalaxy();
        if (typeof window !== 'undefined') {
            localStorage.removeItem('ku-storage');
            localStorage.removeItem('ku-galaxy-storage');
        }
      },

      resetProgress: async () => {
        get().logout();
        try {
          await fetch("/api/user/reset", { method: "POST" });
          console.log("✅ Server data reset.");
        } catch (err) {
          console.error("Failed to reset server data:", err);
        }
      },

      pushSync: async () => {
        const state = get();
        if (!state.hasHydrated) return; 

        const galaxyState = useGalaxyStore.getState();
        
        const payload = {
          // --- DATA + TIMESTAMPS ---
          elo: state.elo,
          eloLastUpdated: state.eloLastUpdated,
          xp: state.xp,
          xpLastUpdated: state.xpLastUpdated,
          
          // [NEW] Send Transactions
          transactions: state.pendingTransactions,
          
          // Legacy fallbacks (for display consistency if sync fails)
          stardust: state.stardust,
          cometShards: state.cometShards,
          currencyLastUpdated: state.currencyLastUpdated,

          unlockedThemes: state.unlockedThemes,
          themesLastUpdated: state.themesLastUpdated,
          
          stats: {
            gamesPlayed: state.gamesPlayed,
            gamesWon: state.gamesWon,
            flawlessWins: state.flawlessWins,
            currentStreak: state.currentStreak,
            lastPlayedDate: state.lastPlayedDate,
            bestTimes: state.bestTimes,
          },
          statsLastUpdated: state.statsLastUpdated,
          
          settings: {
            activeThemeId: state.activeThemeId,
            audioEnabled: state.audioEnabled,
            timerVisible: state.timerVisible,
            autoEraseNotes: state.autoEraseNotes,
            inputMode: state.inputMode,
            textSize: state.textSize,
            highlightCompletions: state.highlightCompletions,
          },
          settingsLastUpdated: state.settingsLastUpdated,

          unlockedNodeIds: galaxyState.unlockedNodeIds,
          historyStars: galaxyState.historyStars,
        };

        try {
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
             const g = u.galaxy || {}; 

             // [NEW] Clear processed transactions
             if (data.processedTransactionIds) {
                 get().clearProcessedTransactions(data.processedTransactionIds);
             }

             // SERVER MERGE LOGIC (Smart Merge)
             set((prev) => ({
               elo: p.eloLastUpdated > prev.eloLastUpdated ? p.elo : prev.elo,
               eloLastUpdated: Math.max(p.eloLastUpdated, prev.eloLastUpdated),
               
               xp: p.xpLastUpdated > prev.xpLastUpdated ? p.xp : prev.xp,
               xpLastUpdated: Math.max(p.xpLastUpdated, prev.xpLastUpdated),
               
               // [UPDATED] Trust server balance (calculated from transactions)
               stardust: p.stardust,
               cometShards: p.cometShards,
               currencyLastUpdated: Date.now(), // Synced

               unlockedThemes: p.themesLastUpdated > prev.themesLastUpdated ? p.unlockedThemes : prev.unlockedThemes,
               themesLastUpdated: Math.max(p.themesLastUpdated, prev.themesLastUpdated),

               // Stats Merge
               gamesPlayed: s.statsLastUpdated > prev.statsLastUpdated ? s.gamesPlayed : prev.gamesPlayed,
               gamesWon: s.statsLastUpdated > prev.statsLastUpdated ? s.gamesWon : prev.gamesWon,
               flawlessWins: s.statsLastUpdated > prev.statsLastUpdated ? s.flawlessWins : prev.flawlessWins,
               currentStreak: s.statsLastUpdated > prev.statsLastUpdated ? s.currentStreak : prev.currentStreak,
               lastPlayedDate: s.statsLastUpdated > prev.statsLastUpdated ? s.lastPlayedDate : prev.lastPlayedDate,
               
               statsLastUpdated: Math.max(s.statsLastUpdated, prev.statsLastUpdated),

               // Settings Merge
               activeThemeId: pref.settingsLastUpdated > prev.settingsLastUpdated ? pref.activeThemeId : prev.activeThemeId,
               audioEnabled: pref.settingsLastUpdated > prev.settingsLastUpdated ? pref.audioEnabled : prev.audioEnabled,
               timerVisible: pref.settingsLastUpdated > prev.settingsLastUpdated ? pref.timerVisible : prev.timerVisible,
               autoEraseNotes: pref.settingsLastUpdated > prev.settingsLastUpdated ? pref.autoEraseNotes : prev.autoEraseNotes,
               inputMode: pref.settingsLastUpdated > prev.settingsLastUpdated ? pref.inputMode : prev.inputMode,
               textSize: pref.settingsLastUpdated > prev.settingsLastUpdated ? pref.textSize : prev.textSize,
               highlightCompletions: pref.settingsLastUpdated > prev.settingsLastUpdated ? pref.highlightCompletions : prev.highlightCompletions,
               
               settingsLastUpdated: Math.max(pref.settingsLastUpdated, prev.settingsLastUpdated),

               isDirty: false 
             }));

             if (g.unlockedNodeIds) {
                 useGalaxyStore.setState({ 
                     unlockedNodeIds: g.unlockedNodeIds,
                     historyStars: g.historyStars || [] 
                 });
             }
             console.log("✅ Smart Sync successful.");
          }
        } catch (err) {
          console.error("Sync failed:", err);
        }
      },
    }),
    {
      name: 'ku-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);