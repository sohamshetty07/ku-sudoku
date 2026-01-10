"use client";

import { useEffect, useState, useCallback, Suspense, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation"; 
import { generateSudoku } from "@/lib/sudoku/generator";
import { useStore, type GameState } from "@/lib/store"; 
import SudokuGrid from "@/components/game/SudokuGrid";
import NumberPad from "@/components/game/NumberPad";
import GameOverModal from "@/components/game/GameOverModal";
import VictoryModal from "@/components/game/VictoryModal";
import LevelUpModal from "@/components/progression/LevelUpModal"; 
import Button from "@/components/ui/Button";
import { calculateGameRewards, type RewardSummary } from "@/lib/progression/rewards"; 
import { RANKS } from "@/lib/progression/constants";
import { playSfx } from "@/lib/audio"; 

// --- CONFIGURATION RULES ---
const GAME_CONFIG = {
  Relaxed:  { holes: 30, lives: Infinity, parTime: 600 },
  Standard: { holes: 40, lives: 3, parTime: 300 },
  Mastery:  { holes: 55, lives: 2, parTime: 900 },
};

// Helper type for valid modes
type GameMode = keyof typeof GAME_CONFIG;

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // --- STORE ---
  const { 
    updateElo, 
    saveGame, 
    clearGame, 
    setThemeDifficulty, 
    elo, 
    xp, 
    addXp, 
    addCurrency, 
    incrementStats,
    updateStreak,
    // SETTINGS
    timerVisible,    
    autoEraseNotes   
  } = useStore();

  const rawMode = searchParams.get("mode");
  const searchMode: GameMode = (rawMode && rawMode in GAME_CONFIG) 
    ? (rawMode as GameMode) 
    : "Standard";

  const [activeMode, setActiveMode] = useState<GameMode>(searchMode);
  const config = GAME_CONFIG[activeMode];

  // --- STATE ---
  const [mounted, setMounted] = useState(false); // Hydration fix
  const [initialBoard, setInitialBoard] = useState<number[][] | null>(null);
  const [boardState, setBoardState] = useState<number[][] | null>(null);
  const [solution, setSolution] = useState<number[][] | null>(null);
  
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null);
  const [mistakes, setMistakes] = useState<number>(0);
  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());
  
  const [isNoteMode, setIsNoteMode] = useState<boolean>(false);
  const [notes, setNotes] = useState<Record<string, number[]>>({});
  const [history, setHistory] = useState<{ board: number[][]; notes: Record<string, number[]> }[]>([]);

  // Refs for high-frequency updates (prevents re-renders/thrashing)
  const cellTimesRef = useRef<Record<string, number>>({});
  const timeRef = useRef(0);
  const [timeElapsed, setTimeElapsed] = useState<number>(0); // Keep state for UI display only

  const [isWon, setIsWon] = useState<boolean>(false);
  const [rewards, setRewards] = useState<RewardSummary | null>(null);
  
  // LEVEL UP STATE
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newRankId, setNewRankId] = useState<string | null>(null);

  const isGameOver = config.lives !== Infinity && mistakes >= config.lives;
  const isGameActive = !isGameOver && !isWon;

  // --- LOGIC: Completed Numbers ---
  const completedNumbers = useMemo(() => {
    if (!boardState || !solution) return [];
    const counts = new Array(10).fill(0);
    boardState.forEach((row, rIndex) => {
      row.forEach((num, cIndex) => {
        if (num !== 0 && num === solution[rIndex][cIndex]) {
          counts[num]++;
        }
      });
    });
    return counts.map((count, num) => (count === 9 ? num : -1)).filter(n => n !== -1);
  }, [boardState, solution]);

  // Mount check
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setThemeDifficulty(activeMode);
  }, [activeMode, setThemeDifficulty]);

  // --- CORE: INIT & RESUME ---
  const startNewGame = useCallback(() => {
    const shouldResume = searchParams.get("resume") === "true";
    const storeState = useStore.getState();
    const savedGame = storeState.activeGame;

    if (shouldResume && savedGame) {
      console.log("Resuming saved game...");
      setActiveMode(savedGame.difficulty);
      setInitialBoard(savedGame.initialBoard);
      setSolution(savedGame.solution);
      setBoardState(savedGame.boardState);
      setMistakes(savedGame.mistakes);
      
      // Resume Timers
      setTimeElapsed(savedGame.timeElapsed);
      timeRef.current = savedGame.timeElapsed;
      cellTimesRef.current = savedGame.cellTimes || {};

      setNotes(savedGame.notes);
      setHistory(savedGame.history);
      
      setErrorCells(new Set());
      setSelectedCell(null);
      setIsNoteMode(false);
      setIsWon(false);
      setRewards(null);
      setShowLevelUp(false); 
    } else {
      console.log("Generating new game client-side...");
      setActiveMode(searchMode); 
      
      if (savedGame && !savedGame.isGameOver && !savedGame.isWon && savedGame.mistakes > 0) {
        // Only apply penalty if the previous game wasn't just cleared
        storeState.updateElo(-5);
      }

      const { initial, solved } = generateSudoku(GAME_CONFIG[searchMode].holes);
      
      setInitialBoard(initial);
      setSolution(solved);
      setBoardState(initial.map(row => [...row]));
      setMistakes(0);
      setErrorCells(new Set());
      setNotes({});
      setHistory([]);
      
      // Reset Timers
      cellTimesRef.current = {};
      timeRef.current = 0;
      setTimeElapsed(0);

      setSelectedCell(null);
      setIsNoteMode(false);
      setIsWon(false);
      setRewards(null);
      setShowLevelUp(false);
      
      clearGame();
    }
  }, [searchParams, clearGame, searchMode]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // --- HELPER: CONSTRUCT GAME STATE ---
  const getGameState = useCallback((): GameState | null => {
    if (!boardState || !initialBoard || !solution) return null;
    return {
        initialBoard,
        boardState,
        solution,
        notes,
        history,
        mistakes,
        timeElapsed: timeRef.current, // Use fresh Ref
        difficulty: activeMode,
        cellTimes: cellTimesRef.current, // Use fresh Ref
        isGameOver, 
        isWon
    };
  }, [boardState, initialBoard, solution, notes, history, mistakes, activeMode, isGameOver, isWon]);

  // --- AUTO-SAVE (Optimized) ---
  // Only saves when structural state changes, NOT when time ticks.
  useEffect(() => {
    if (isGameActive) {
      const state = getGameState();
      if (state) saveGame(state);
    }
  }, [boardState, notes, mistakes, isGameActive, getGameState, saveGame]); // removed timeElapsed and cellTimes dependencies

  // --- SAVE ON TAB SWITCH ---
  // Ensures time is captured if user leaves without making a move
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isGameActive) {
        const state = getGameState();
        if (state) saveGame(state);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isGameActive, getGameState, saveGame]);

  // --- CLEANUP ON GAME OVER ---
  useEffect(() => {
    if (isGameOver) {
      playSfx('gameover'); 
      const result = calculateGameRewards({
        mode: activeMode,
        timeElapsed: timeRef.current,
        mistakes,
        isWin: false,
        currentElo: elo
      });

      updateElo(result.eloChange);
      addXp(result.xp);
      incrementStats(false, activeMode, timeRef.current, mistakes);
      
      clearGame();
    }
  }, [isGameOver, clearGame, activeMode, mistakes, elo, updateElo, addXp, incrementStats]);

  // --- GLOBAL TIMER ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGameActive && boardState) {
      interval = setInterval(() => {
        // Update Ref (Source of Truth)
        timeRef.current += 1;
        // Update State (UI only)
        setTimeElapsed(timeRef.current);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGameActive, boardState]);

  // --- CELL TIMER ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGameActive && selectedCell) {
      interval = setInterval(() => {
        const key = `${selectedCell.row}-${selectedCell.col}`;
        cellTimesRef.current[key] = (cellTimesRef.current[key] || 0) + 1;
        // No state update here to avoid re-rendering grid every second
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGameActive, selectedCell]);

  const handleExit = () => {
    router.push('/dashboard');
  };

  const saveToHistory = useCallback(() => {
    if (!boardState) return;
    setHistory(p => [...p, { board: boardState.map(r => [...r]), notes: { ...notes } }]);
  }, [boardState, notes]);

  const handleUndo = useCallback(() => {
    if (!isGameActive || history.length === 0) return;
    const prev = history[history.length - 1];
    setBoardState(prev.board);
    setNotes(prev.notes);
    setHistory(p => p.slice(0, -1));

    if (solution) {
      const newErrors = new Set<string>();
      prev.board.forEach((row, r) => {
        row.forEach((val, c) => {
          if (val !== 0 && val !== solution[r][c]) {
            newErrors.add(`${r}-${c}`);
          }
        });
      });
      setErrorCells(newErrors);
    }
  }, [isGameActive, history, solution]);

  const checkVictory = useCallback((currentBoard: number[][], solved: number[][]) => {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (currentBoard[i][j] !== solved[i][j]) return false;
      }
    }
    return true;
  }, []);

  const handleCellClick = (row: number, col: number) => {
    playSfx('click'); 
    setSelectedCell({ row, col });
  };

  // --- INPUT HANDLER ---
  const handleInput = useCallback((num: number) => {
    if (!isGameActive || !selectedCell || !boardState || !initialBoard || !solution) return;
    const { row, col } = selectedCell;

    if (initialBoard[row][col] !== 0) {
      playSfx('error');
      return;
    }

    // 2. NOTE MODE
    if (isNoteMode) {
      if (boardState[row][col] !== 0) return;
      playSfx('click');
      saveToHistory();
      const key = `${row}-${col}`;
      const curr = notes[key] || [];
      const newNotes = curr.includes(num) ? curr.filter(n => n !== num) : [...curr, num];
      setNotes(p => ({ ...p, [key]: newNotes }));
      return; 
    }

    if (boardState[row][col] === solution[row][col]) return;

    saveToHistory();

    // 3. CORRECT MOVE
    if (num === solution[row][col]) {
      playSfx('input'); 

      const newBoard = boardState.map(r => [...r]);
      newBoard[row][col] = num;
      setBoardState(newBoard);
      
      const newErrors = new Set(errorCells);
      newErrors.delete(`${row}-${col}`);
      setErrorCells(newErrors);

      // --- LOGIC: AUTO-ERASE NOTES ---
      setNotes(prevNotes => {
        const nextNotes = { ...prevNotes };
        delete nextNotes[`${row}-${col}`];

        if (autoEraseNotes) {
            // Row & Col
            for (let i = 0; i < 9; i++) {
                const rKey = `${row}-${i}`;
                const cKey = `${i}-${col}`;
                if (nextNotes[rKey]) nextNotes[rKey] = nextNotes[rKey].filter(n => n !== num);
                if (nextNotes[cKey]) nextNotes[cKey] = nextNotes[cKey].filter(n => n !== num);
            }
            // Box
            const startRow = Math.floor(row / 3) * 3;
            const startCol = Math.floor(col / 3) * 3;
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    const bKey = `${startRow + r}-${startCol + c}`;
                    if (nextNotes[bKey]) nextNotes[bKey] = nextNotes[bKey].filter(n => n !== num);
                }
            }
        }
        return nextNotes;
      });

      if (checkVictory(newBoard, solution)) {
        playSfx('victory'); 
        
        const result = calculateGameRewards({
          mode: activeMode,
          timeElapsed: timeRef.current,
          mistakes,
          isWin: true,
          currentElo: elo
        });

        const currentXp = useStore.getState().xp; 
        const nextXp = currentXp + result.xp;
        
        const oldRank = [...RANKS].reverse().find(r => currentXp >= r.minXp);
        const newRank = [...RANKS].reverse().find(r => nextXp >= r.minXp);

        if (oldRank && newRank && newRank.id !== oldRank.id) {
          setNewRankId(newRank.id);
          setShowLevelUp(true);
        }

        updateElo(result.eloChange);
        addXp(result.xp);
        addCurrency('stardust', result.stardust);
        if (result.cometShards > 0) {
            addCurrency('cometShards', result.cometShards);
        }
        
        incrementStats(true, activeMode, timeRef.current, mistakes);
        updateStreak();

        setRewards(result);
        setIsWon(true);
        clearGame(); 
      }

    } else {
      // 4. INCORRECT MOVE
      playSfx('error'); 
      
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      const newErrors = new Set(errorCells);
      newErrors.add(`${row}-${col}`);
      setErrorCells(newErrors);
      
      const newBoard = boardState.map(r => [...r]);
      newBoard[row][col] = num;
      setBoardState(newBoard);
    }
  }, [
    isGameActive, selectedCell, boardState, initialBoard, solution, isNoteMode, 
    notes, errorCells, mistakes, saveToHistory, checkVictory, updateElo, clearGame, 
    activeMode, elo, addXp, addCurrency, incrementStats, updateStreak, 
    autoEraseNotes
  ]); // removed timeElapsed dependency here as well since we use Ref in victory check? 
      // Actually victory check uses result.timeElapsed which should be passed from timeRef.current.
      // I updated the victory logic block above to use timeRef.current.

  const handleDelete = useCallback(() => {
    if (!isGameActive || !selectedCell || !boardState || !initialBoard) return;
    const { row, col } = selectedCell;
    if (initialBoard[row][col] !== 0) return;
    
    if (boardState[row][col] !== 0) {
      playSfx('erase'); 
      saveToHistory();
      const newBoard = boardState.map(r => [...r]);
      newBoard[row][col] = 0;
      setBoardState(newBoard);
      const newErrors = new Set(errorCells);
      newErrors.delete(`${row}-${col}`);
      setErrorCells(newErrors);
    } 
  }, [isGameActive, selectedCell, boardState, initialBoard, errorCells, saveToHistory]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isGameActive || !selectedCell) return;
    const { row, col } = selectedCell;
    const key = e.key;

    if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); handleUndo(); return; }
    if (key === "ArrowUp" && row > 0) return setSelectedCell({ row: row - 1, col });
    if (key === "ArrowDown" && row < 8) return setSelectedCell({ row: row + 1, col });
    if (key === "ArrowLeft" && col > 0) return setSelectedCell({ row, col: col - 1 });
    if (key === "ArrowRight" && col < 8) return setSelectedCell({ row, col: col + 1 });
    if (key >= "1" && key <= "9") handleInput(parseInt(key));
    if (key === "Backspace" || key === "Delete") handleDelete();
    if (key === "n" || key === "N") setIsNoteMode(prev => !prev);
  }, [isGameActive, selectedCell, handleInput, handleDelete, handleUndo]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!boardState || !initialBoard) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white animate-pulse">
        <h2 className="text-xl font-mono tracking-widest text-neon-cyan">ENTERING THE VOID...</h2>
        <p className="text-white/40 text-sm mt-2">Generating Logic Pattern</p>
      </div>
    );
  }

  return (
    <main 
      className="relative flex min-h-screen flex-col items-center justify-center px-1 py-4 md:p-4 pb-8 transition-colors duration-1000"
    >
      {showLevelUp && newRankId && (
        <LevelUpModal 
          newRankId={newRankId} 
          onClose={() => setShowLevelUp(false)} 
        />
      )}

      {isGameOver && <GameOverModal onRetry={startNewGame} />}
      
      {isWon && (
        <VictoryModal 
          timeElapsed={timeRef.current} 
          mistakes={mistakes} 
          onRetry={startNewGame}
          cellTimes={cellTimesRef.current} 
          finalBoard={boardState}
          // @ts-ignore
          rewards={rewards} 
        />
      )}

      {/* TOP BAR */}
      <div className="flex w-full max-w-lg items-center justify-between mb-6 px-1">
        <button onClick={handleExit} className="text-white/50 hover:text-white transition">← Exit</button>
        
        <div className="flex items-center gap-4">
          <div className="text-white/50 font-sans text-sm capitalize">{activeMode}</div>
          
          {/* VISIBLE TIMER SETTING with Hydration Fix */}
          <div className="font-mono text-sm text-white/80 w-16 text-center">
             {mounted && timerVisible 
                ? formatTime(timeElapsed) 
                : <span className="text-white/20 text-xs">HIDDEN</span>
             }
          </div>
          
          {config.lives === Infinity ? (
             <div className="text-neon-cyan text-xl">∞</div>
          ) : (
            <div className={`font-mono text-sm font-bold ${mistakes >= config.lives ? "text-neon-red" : "text-neon-cyan"}`}>
              {mistakes}/{config.lives}
            </div>
          )}
        </div>
      </div>

      {/* GRID */}
      <div className={`
        w-full
        transition-all duration-1000 
        ${!isGameActive && !isWon ? "opacity-30 pointer-events-none filter blur-sm" : ""}
        ${isWon ? "scale-105" : ""}
      `}>
        <SudokuGrid 
          initialBoard={initialBoard}
          boardState={boardState}
          selectedCell={selectedCell}
          onCellClick={handleCellClick} 
          errorCells={errorCells}
          notes={notes}
        />
      </div>

      {/* INPUTS */}
      <div className={`
        w-full max-w-lg flex flex-col gap-6 mt-6 mx-auto items-center 
        transition-all duration-500 
        ${!isGameActive ? "opacity-0 pointer-events-none translate-y-10" : ""}
      `}>
        <NumberPad 
          onNumberClick={handleInput} 
          onDelete={handleDelete} 
          completedNumbers={completedNumbers}
        />
        <div className="flex gap-4 w-full justify-center">
          <Button variant="secondary" className="w-1/3" onClick={handleUndo} disabled={history.length === 0}>Undo</Button>
          <Button variant={isNoteMode ? "primary" : "secondary"} className="w-1/3" onClick={() => setIsNoteMode(!isNoteMode)}>
            {isNoteMode ? "Note: ON" : "Note"}
          </Button>
        </div>
      </div>
    </main>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white/20">Loading...</div>}>
      <GameContent />
    </Suspense>
  );
}