import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  elo: number;
  updateElo: (change: number) => void;

  activeGame: GameState | null;
  saveGame: (game: GameState) => void;
  clearGame: () => void;

  // --- NEW: Theme State ---
  themeDifficulty: 'Relaxed' | 'Standard' | 'Mastery';
  setThemeDifficulty: (diff: 'Relaxed' | 'Standard' | 'Mastery') => void;
}

export const useStore = create<UserStore>()(
  persist(
    (set) => ({
      elo: 1000,
      updateElo: (change) => set((state) => ({ elo: state.elo + change })),
      
      activeGame: null,
      saveGame: (game) => set({ activeGame: game }),
      clearGame: () => set({ activeGame: null }),

      // --- NEW: Default to Standard ---
      themeDifficulty: 'Standard',
      setThemeDifficulty: (diff) => set({ themeDifficulty: diff }),
    }),
    {
      name: 'ku-storage',
    }
  )
);