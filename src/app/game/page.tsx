"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation"; 
import { generateSudoku } from "@/lib/sudoku/generator";
import { useStore, type GameState } from "@/lib/store"; 
import SudokuGrid from "@/components/game/SudokuGrid";
import NumberPad from "@/components/game/NumberPad";
import GameOverModal from "@/components/game/GameOverModal";
import VictoryModal from "@/components/game/VictoryModal";
import Button from "@/components/ui/Button";
import Link from "next/link";

// --- CONFIGURATION RULES ---
// Updated to include 'eloPenalty'
const GAME_CONFIG = {
  Relaxed:  { holes: 30, lives: Infinity, eloReward: 0, eloPenalty: 0 },
  Standard: { holes: 40, lives: 3, eloReward: 15, eloPenalty: 5 },
  Mastery:  { holes: 55, lives: 1, eloReward: 30, eloPenalty: 10 },
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

function GameContent() {
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") as keyof typeof GAME_CONFIG) || "Standard";
  const config = GAME_CONFIG[mode];

  const { updateElo, saveGame, clearGame } = useStore();

  // --- STATE ---
  const [initialBoard, setInitialBoard] = useState<number[][] | null>(null);
  const [boardState, setBoardState] = useState<number[][] | null>(null);
  const [solution, setSolution] = useState<number[][] | null>(null);
  
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null);
  const [mistakes, setMistakes] = useState<number>(0);
  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());
  
  const [isNoteMode, setIsNoteMode] = useState<boolean>(false);
  const [notes, setNotes] = useState<Record<string, number[]>>({});
  const [history, setHistory] = useState<{ board: number[][]; notes: Record<string, number[]> }[]>([]);

  // HEATMAP STATE
  const [cellTimes, setCellTimes] = useState<Record<string, number>>({}); 

  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);

  const isGameOver = config.lives !== Infinity && mistakes >= config.lives;
  const isGameActive = !isGameOver && !isWon;

  // --- LOGIC: Calculate Completed Numbers ---
  // A number is hidden ONLY if there are 9 of them AND they are all correct according to the solution.
  const completedNumbers = useMemo(() => {
    if (!boardState || !solution) return [];
    
    const counts = new Array(10).fill(0);
    
    // Check every cell
    boardState.forEach((row, rIndex) => {
      row.forEach((num, cIndex) => {
        // Only count the number if it matches the solution at this position
        if (num !== 0 && num === solution[rIndex][cIndex]) {
          counts[num]++;
        }
      });
    });

    // Filter for numbers that appear 9 times correctly
    return counts
      .map((count, num) => (count === 9 ? num : -1))
      .filter(n => n !== -1);
  }, [boardState, solution]);

  // --- VISUALS: DYNAMIC BACKGROUND ---
  const backgroundClass = useMemo(() => {
    switch (mode) {
      case 'Relaxed':
        return "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/40 via-midnight to-midnight";
      case 'Mastery':
        return "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-midnight to-black";
      case 'Standard':
      default:
        return "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-midnight to-midnight";
    }
  }, [mode]);

  // --- INIT & RESUME LOGIC ---
  const startNewGame = useCallback(() => {
    const shouldResume = searchParams.get("resume") === "true";
    
    // Read directly to avoid loops
    const savedGame = useStore.getState().activeGame;

    if (shouldResume && savedGame) {
      // RESUME
      setInitialBoard(savedGame.initialBoard);
      setSolution(savedGame.solution);
      setBoardState(savedGame.boardState);
      setMistakes(savedGame.mistakes);
      setTimeElapsed(savedGame.timeElapsed);
      setNotes(savedGame.notes);
      setHistory(savedGame.history);
      setCellTimes(savedGame.cellTimes || {}); 
      
      setErrorCells(new Set());
      setSelectedCell(null);
      setIsNoteMode(false);
      setIsWon(false);
    } else {
      // START FRESH
      const { initial, solved } = generateSudoku(config.holes);
      setInitialBoard(initial);
      setSolution(solved);
      setBoardState(initial.map(row => [...row]));
      setMistakes(0);
      setErrorCells(new Set());
      setNotes({});
      setHistory([]);
      setCellTimes({}); 
      setSelectedCell(null);
      setIsNoteMode(false);
      setTimeElapsed(0);
      setIsWon(false);
      
      clearGame();
    }
  }, [config.holes, searchParams, clearGame]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // --- AUTO-SAVE ---
  useEffect(() => {
    if (isGameActive && boardState && initialBoard && solution) {
      const currentGameState: GameState = {
        initialBoard,
        boardState,
        solution,
        notes,
        history,
        mistakes,
        timeElapsed,
        difficulty: mode as 'Relaxed' | 'Standard' | 'Mastery',
        cellTimes
      };
      saveGame(currentGameState);
    }
  }, [boardState, notes, mistakes, timeElapsed, isGameActive, initialBoard, solution, history, mode, saveGame, cellTimes]);

  // --- CLEANUP ON GAME OVER & PENALTY ---
  useEffect(() => {
    if (isGameOver) {
      // PENALTY LOGIC: Deduct points for losing
      if (config.eloPenalty > 0) {
        updateElo(-config.eloPenalty);
      }
      clearGame();
    }
  }, [isGameOver, clearGame, config.eloPenalty, updateElo]);

  // --- TIMER (Global) ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGameActive && boardState) {
      interval = setInterval(() => setTimeElapsed(p => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isGameActive, boardState]);

  // --- HEATMAP TRACKER (Per Cell) ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGameActive && selectedCell) {
      interval = setInterval(() => {
        const key = `${selectedCell.row}-${selectedCell.col}`;
        setCellTimes(prev => ({
          ...prev,
          [key]: (prev[key] || 0) + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGameActive, selectedCell]);

  // --- HISTORY ---
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
    setErrorCells(new Set());
  }, [isGameActive, history]);

  const checkVictory = useCallback((currentBoard: number[][], solved: number[][]) => {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (currentBoard[i][j] !== solved[i][j]) return false;
      }
    }
    return true;
  }, []);

  // --- INPUT LOGIC ---
  const handleInput = useCallback((num: number) => {
    if (!isGameActive || !selectedCell || !boardState || !initialBoard || !solution) return;
    const { row, col } = selectedCell;

    if (initialBoard[row][col] !== 0) return;

    if (isNoteMode) {
      if (boardState[row][col] !== 0) return;
      saveToHistory();
      const key = `${row}-${col}`;
      const curr = notes[key] || [];
      const newNotes = curr.includes(num) ? curr.filter(n => n !== num) : [...curr, num];
      setNotes(p => ({ ...p, [key]: newNotes }));
      return; 
    }

    if (boardState[row][col] === solution[row][col]) return;

    saveToHistory();

    if (num === solution[row][col]) {
      const newBoard = boardState.map(r => [...r]);
      newBoard[row][col] = num;
      setBoardState(newBoard);
      
      const newErrors = new Set(errorCells);
      newErrors.delete(`${row}-${col}`);
      setErrorCells(newErrors);

      setNotes(p => {
        const n = { ...p };
        delete n[`${row}-${col}`];
        return n;
      });

      if (checkVictory(newBoard, solution)) {
        setIsWon(true);
        clearGame(); 
        if (config.eloReward > 0) {
          updateElo(config.eloReward);
        }
      }

    } else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      const newErrors = new Set(errorCells);
      newErrors.add(`${row}-${col}`);
      setErrorCells(newErrors);
      
      const newBoard = boardState.map(r => [...r]);
      newBoard[row][col] = num;
      setBoardState(newBoard);
    }
  }, [isGameActive, selectedCell, boardState, initialBoard, solution, isNoteMode, notes, errorCells, mistakes, saveToHistory, checkVictory, config.eloReward, updateElo, clearGame]);

  // --- DELETE & KEYBOARD ---
  const handleDelete = useCallback(() => {
    if (!isGameActive || !selectedCell || !boardState || !initialBoard) return;
    const { row, col } = selectedCell;
    if (initialBoard[row][col] !== 0) return;
    if (boardState[row][col] !== 0) {
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

  if (!boardState || !initialBoard) return <div className="text-white text-center mt-20">Entering the Void...</div>;

  return (
    // Updated Main Container with dynamic backgroundClass
    <main className={`relative flex min-h-screen flex-col items-center justify-center p-4 pb-8 transition-colors duration-1000 ${backgroundClass}`}>
      
      {isGameOver && <GameOverModal onRetry={startNewGame} />}
      
      {isWon && (
        <VictoryModal 
          timeElapsed={timeElapsed} 
          mistakes={mistakes} 
          onRetry={startNewGame}
          cellTimes={cellTimes} 
          finalBoard={boardState}
        />
      )}

      {/* TOP BAR */}
      <div className="flex w-full max-w-md items-center justify-between mb-6 px-1">
        <Link href="/" className="text-white/50 hover:text-white transition">← Exit</Link>
        <div className="flex items-center gap-4">
          <div className="text-white/50 font-sans text-sm">{mode}</div>
          <div className="font-mono text-sm text-white/80 w-12 text-center">{formatTime(timeElapsed)}</div>
          
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
        transition-all duration-1000 
        ${!isGameActive && !isWon ? "opacity-30 pointer-events-none filter blur-sm" : ""}
        ${isWon ? "scale-105" : ""}
      `}>
        <SudokuGrid 
          initialBoard={initialBoard}
          boardState={boardState}
          selectedCell={selectedCell}
          onCellClick={(row, col) => setSelectedCell({ row, col })}
          errorCells={errorCells}
          notes={notes}
        />
      </div>

      {/* INPUTS */}
      <div className={`w-full max-w-md flex flex-col gap-6 transition-all duration-500 ${!isGameActive ? "opacity-0 pointer-events-none translate-y-10" : ""}`}>
        {/* Pass completedNumbers to NumberPad to hide finished numbers */}
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
    <Suspense fallback={<div className="text-white text-center mt-20">Loading...</div>}>
      <GameContent />
    </Suspense>
  );
}