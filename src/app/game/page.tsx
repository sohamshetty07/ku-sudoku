"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation"; 
import { generateSudoku } from "@/lib/sudoku/generator";
import { useStore, type GameState } from "@/lib/store"; 
import SudokuGrid from "@/components/game/SudokuGrid";
import NumberPad from "@/components/game/NumberPad";
import GameOverModal from "@/components/game/GameOverModal";
import VictoryModal from "@/components/game/VictoryModal";
import Button from "@/components/ui/Button";

// --- CONFIGURATION RULES ---
const GAME_CONFIG = {
  Relaxed:  { holes: 30, lives: Infinity, eloReward: 0, eloPenalty: 0, baseScore: 10, parTime: 600 },
  Standard: { holes: 40, lives: 3, eloReward: 15, eloPenalty: 5, baseScore: 30, parTime: 300 },
  Mastery:  { holes: 55, lives: 2, eloReward: 30, eloPenalty: 10, baseScore: 120, parTime: 900 },
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Get the requested mode from URL (User Intent)
  const searchMode = (searchParams.get("mode") as keyof typeof GAME_CONFIG) || "Standard";

  // 2. Create state for the ACTUAL active mode. 
  // This allows us to override the URL if the saved game has a different difficulty.
  const [activeMode, setActiveMode] = useState(searchMode);
  
  // 3. Derive config from the STATE, not the URL
  const config = GAME_CONFIG[activeMode];

  // --- STORE ---
  const { updateElo, saveGame, clearGame, setThemeDifficulty } = useStore();

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
  
  const [finalScore, setFinalScore] = useState<number>(0);

  const isGameOver = config.lives !== Infinity && mistakes >= config.lives;
  const isGameActive = !isGameOver && !isWon;

  // --- LOGIC: Score Calculator ---
  const calculateScore = useCallback((elapsed: number, mistakesCount: number) => {
    const { baseScore, parTime } = config;
    const timeDiff = Math.max(0, parTime - elapsed);
    const timeBonus = Math.floor(timeDiff / 10);
    const mistakePenalty = mistakesCount * 5;
    return Math.max(0, baseScore + timeBonus - mistakePenalty);
  }, [config]);

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

  // --- VISUALS: DYNAMIC BACKGROUND (INLINE STYLE) ---
  const backgroundStyle = useMemo(() => {
    switch (activeMode) { // UPDATED: Listen to activeMode
      case 'Relaxed':
        return { background: "radial-gradient(circle at center, rgba(20, 184, 166, 0.4) 0%, #0F172A 70%, #0F172A 100%)" };
      case 'Mastery':
        return { background: "radial-gradient(circle at center, rgba(225, 29, 72, 0.4) 0%, #0F172A 70%, #000000 100%)" };
      case 'Standard':
      default:
        return { background: "radial-gradient(circle at center, rgba(37, 99, 235, 0.4) 0%, #0F172A 70%, #0F172A 100%)" };
    }
  }, [activeMode]);

  // --- VISUALS: SYNC BACKGROUND ---
  useEffect(() => {
    if (activeMode) {
      setThemeDifficulty(activeMode as 'Relaxed' | 'Standard' | 'Mastery');
    }
  }, [activeMode, setThemeDifficulty]);

  // --- INIT & RESUME LOGIC ---
  const startNewGame = useCallback(() => {
    const shouldResume = searchParams.get("resume") === "true";
    
    const storeState = useStore.getState();
    const savedGame = storeState.activeGame;

    if (shouldResume && savedGame) {
      // RESUME
      setActiveMode(savedGame.difficulty); // <--- FIX: Restore difficulty from save
      
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
      setFinalScore(0);
    } else {
      // START FRESH
      // Ensure we use the URL mode if we are starting a new game
      setActiveMode(searchMode); 
      
      if (savedGame && !savedGame.isGameOver && !savedGame.isWon && savedGame.mistakes > 0) {
        const penalty = savedGame.mistakes * 5;
        storeState.updateElo(-penalty);
        console.log(`Abandoned game penalty applied: -${penalty}`);
      }

      // Generate based on the requested Search Mode to ensure correct holes
      const { initial, solved } = generateSudoku(GAME_CONFIG[searchMode].holes);
      
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
      setFinalScore(0);
      
      clearGame();
    }
  }, [searchParams, clearGame, searchMode]);

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
        difficulty: activeMode as 'Relaxed' | 'Standard' | 'Mastery', // UPDATED: Save activeMode
        cellTimes,
        isGameOver, 
        isWon
      };
      saveGame(currentGameState);
    }
  }, [boardState, notes, mistakes, timeElapsed, isGameActive, initialBoard, solution, history, activeMode, saveGame, cellTimes, isGameOver, isWon]);

  // --- CLEANUP ON GAME OVER ---
  useEffect(() => {
    if (isGameOver) {
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

  // --- HANDLER: Exit Game ---
  const handleExit = () => {
    router.push('/');
  };

  // --- HISTORY ---
  const saveToHistory = useCallback(() => {
    if (!boardState) return;
    setHistory(p => [...p, { board: boardState.map(r => [...r]), notes: { ...notes } }]);
  }, [boardState, notes]);

  const handleUndo = useCallback(() => {
    if (!isGameActive || history.length === 0) return;
    const prev = history[history.length - 1];
    
    // 1. Restore the board
    setBoardState(prev.board);
    setNotes(prev.notes);
    setHistory(p => p.slice(0, -1));

    // 2. BUG FIX: Recalculate errors for the restored board
    // We compare every number on the restored board against the solution.
    if (solution) {
      const newErrors = new Set<string>();
      prev.board.forEach((row, r) => {
        row.forEach((val, c) => {
          // If a cell has a value, and it doesn't match the solution -> It's an error
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
        // --- VICTORY! ---
        const score = calculateScore(timeElapsed, mistakes);
        setFinalScore(score);
        
        setIsWon(true);
        clearGame(); 
        
        if (score > 0) {
          updateElo(score);
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
  }, [isGameActive, selectedCell, boardState, initialBoard, solution, isNoteMode, notes, errorCells, mistakes, saveToHistory, checkVictory, config.eloReward, updateElo, clearGame, calculateScore, timeElapsed]);

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
    <main 
      className="relative flex min-h-screen flex-col items-center justify-center px-1 py-4 md:p-4 pb-8 transition-colors duration-1000"
      style={backgroundStyle}
    >
      
      {isGameOver && <GameOverModal onRetry={startNewGame} />}
      
      {isWon && (
        <VictoryModal 
          timeElapsed={timeElapsed} 
          mistakes={mistakes} 
          onRetry={startNewGame}
          cellTimes={cellTimes} 
          finalBoard={boardState}
          score={finalScore} 
        />
      )}

      {/* TOP BAR */}
      <div className="flex w-full max-w-lg items-center justify-between mb-6 px-1">
        <button onClick={handleExit} className="text-white/50 hover:text-white transition">← Exit</button>
        
        <div className="flex items-center gap-4">
          <div className="text-white/50 font-sans text-sm">{activeMode}</div>
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
        w-full
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
    <Suspense fallback={<div className="text-white text-center mt-20">Loading...</div>}>
      <GameContent />
    </Suspense>
  );
}