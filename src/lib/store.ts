import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// The shape of a saved game
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
  
  // --- NEW FIELDS ---
  isGameOver?: boolean; // Tracks if the game ended in loss
  isWon?: boolean;      // Tracks if the game ended in victory
}

interface UserStore {
  elo: number;
  updateElo: (change: number) => void;

  activeGame: GameState | null;
  saveGame: (game: GameState) => void;
  clearGame: () => void;
}

export const useStore = create<UserStore>()(
  persist(
    (set) => ({
      elo: 1000,
      updateElo: (change) => set((state) => ({ elo: state.elo + change })),
      
      activeGame: null,
      saveGame: (game) => set({ activeGame: game }),
      clearGame: () => set({ activeGame: null }),
    }),
    {
      name: 'ku-storage', // Saves to localStorage
    }
  )
);