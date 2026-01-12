"use client";

import { useEffect, useState, useCallback, Suspense, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation"; 
// [UPDATED] Import generateDailyBoard
import { generateSudoku, generateDailyBoard } from "@/lib/sudoku/generator";
import { useStore, type GameState } from "@/lib/store"; 
import { useGalaxyStore } from "@/lib/store/galaxy"; 
import SudokuGrid from "@/components/game/SudokuGrid";
import NumberPad from "@/components/game/NumberPad";
import GameOverModal from "@/components/game/GameOverModal";
import VictoryModal, { type RewardSummary } from "@/components/game/VictoryModal"; 
import LevelUpModal from "@/components/progression/LevelUpModal";
import DailyRewardModal from "@/components/game/DailyRewardModal"; 
import GameSettingsModal from "@/components/game/GameSettingsModal";
import Button from "@/components/ui/Button";
import { calculateGameRewards } from "@/lib/progression/rewards"; 
import { RANKS } from "@/lib/progression/constants";
import { playSfx } from "@/lib/audio"; 
import { Settings } from "lucide-react";

// --- CONFIGURATION RULES ---
const GAME_CONFIG = {
  Relaxed:  { holes: 30, parTime: 600 },
  Standard: { holes: 40, parTime: 300 },
  Mastery:  { holes: 55, parTime: 900 },
  // [NEW] Daily Configuration
  Daily:    { holes: 40, parTime: 450 }, 
};

type GameMode = keyof typeof GAME_CONFIG;

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Helper to Calculate Completed Areas (Row/Col/Box)
const getCompletedRegions = (board: number[][], solution: number[][]) => {
  const regions = new Set<string>();
  
  // 1. Check Rows
  for (let r = 0; r < 9; r++) {
    if (board[r].every((val, c) => val === solution[r][c])) {
      regions.add(`row-${r}`);
    }
  }
  
  // 2. Check Columns
  for (let c = 0; c < 9; c++) {
    if (board.every((row, r) => row[c] === solution[r][c])) {
      regions.add(`col-${c}`);
    }
  }
  
  // 3. Check 3x3 Boxes
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      let isBoxComplete = true;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
           const row = br * 3 + r;
           const col = bc * 3 + c;
           if (board[row][col] !== solution[row][col]) {
             isBoxComplete = false;
             break;
           }
        }
      }
      if (isBoxComplete) regions.add(`box-${br}-${bc}`);
    }
  }
  return regions;
};

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // --- STORES ---
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
    // SETTINGS & PERKS
    timerVisible,    
    autoEraseNotes,
    maxMistakes,
    refreshPerks,
    showDailyRewardModal,
    // VISUALS & INPUT
    inputMode,
    highlightCompletions,
    pushSync 
  } = useStore();

  const { addHistoryStar, isNodeUnlocked } = useGalaxyStore();

  const rawMode = searchParams.get("mode");
  // [UPDATED] Check if rawMode matches any key in GAME_CONFIG (including Daily)
  const searchMode: GameMode = (rawMode && rawMode in GAME_CONFIG) 
    ? (rawMode as GameMode) 
    : "Standard";

  const [activeMode, setActiveMode] = useState<GameMode>(searchMode);
  
  // Daily Mode typically allows mistakes, but we can stick to Standard rules (3 strikes) or make it stricter
  const currentMaxLives = activeMode === 'Relaxed' ? Infinity : (activeMode === 'Mastery' ? 2 : maxMistakes);

  // --- STATE ---
  const [mounted, setMounted] = useState(false);
  const [initialBoard, setInitialBoard] = useState<number[][] | null>(null);
  const [boardState, setBoardState] = useState<number[][] | null>(null);
  const [solution, setSolution] = useState<number[][] | null>(null);
  
  const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null);
  const [activeNumber, setActiveNumber] = useState<number | null>(null);

  const [mistakes, setMistakes] = useState<number>(0);
  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());
  
  const [isNoteMode, setIsNoteMode] = useState<boolean>(false);
  const [notes, setNotes] = useState<Record<string, number[]>>({});
  const [history, setHistory] = useState<{ board: number[][]; notes: Record<string, number[]> }[]>([]);

  // Refs
  const cellTimesRef = useRef<Record<string, number>>({});
  const timeRef = useRef(0);
  const [timeElapsed, setTimeElapsed] = useState<number>(0); 

  const [isWon, setIsWon] = useState<boolean>(false);
  const [rewards, setRewards] = useState<RewardSummary | null>(null);
  
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newRankId, setNewRankId] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(false);

  const isGameOver = currentMaxLives !== Infinity && mistakes >= currentMaxLives;
  const isGameActive = !isGameOver && !isWon;

  // --- DERIVED STATE ---
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

  const [transientRegions, setTransientRegions] = useState<Set<string>>(new Set());
  const prevRegionsRef = useRef<Set<string>>(new Set());

  const completedRegions = useMemo(() => {
    if (!boardState || !solution) return new Set<string>();
    return getCompletedRegions(boardState, solution);
  }, [boardState, solution]);

  useEffect(() => {
    const current = completedRegions;
    const prev = prevRegionsRef.current;

    if (current.size > prev.size) {
        const diff = new Set([...current].filter(x => !prev.has(x)));
        
        if (diff.size > 0 && highlightCompletions && isGameActive && mounted) {
            playSfx('chord'); 
            setTransientRegions(prevTr => {
                const next = new Set(prevTr);
                diff.forEach(d => next.add(d));
                return next;
            });
            setTimeout(() => {
                 setTransientRegions(prevTr => {
                    const next = new Set(prevTr);
                    diff.forEach(d => next.delete(d));
                    return next;
                });
            }, 1500);
        }
    }
    prevRegionsRef.current = current;
  }, [completedRegions, highlightCompletions, isGameActive, mounted]);


  // --- INIT ---
  useEffect(() => {
    setMounted(true);
    refreshPerks(); 
  }, [refreshPerks]);

  useEffect(() => {
    // If Daily, maybe map it to 'Mastery' theme or keep 'Standard'
    // For now, mapping 'Daily' difficulty to 'Standard' theme visual
    const visualDiff = activeMode === 'Daily' ? 'Standard' : activeMode;
    setThemeDifficulty(visualDiff as any);
  }, [activeMode, setThemeDifficulty]);

  const startNewGame = useCallback(() => {
    const shouldResume = searchParams.get("resume") === "true";
    const storeState = useStore.getState();
    const savedGame = storeState.activeGame;

    if (shouldResume && savedGame) {
      console.log("Resuming saved game...");
      // Cast difficulty safely in case saved game has old type
      setActiveMode(savedGame.difficulty as GameMode);
      setInitialBoard(savedGame.initialBoard);
      setSolution(savedGame.solution);
      setBoardState(savedGame.boardState);
      setMistakes(savedGame.mistakes);
      
      setTimeElapsed(savedGame.timeElapsed);
      timeRef.current = savedGame.timeElapsed;
      cellTimesRef.current = savedGame.cellTimes || {};

      setNotes(savedGame.notes);
      setHistory(savedGame.history);
      
      setErrorCells(new Set());
      setSelectedCell(null);
      setActiveNumber(null); 
      setIsNoteMode(false);
      setIsWon(false);
      setRewards(null);
      setShowLevelUp(false); 
      prevRegionsRef.current = new Set();
    } else {
      console.log(`Generating new ${searchMode} game...`);
      setActiveMode(searchMode); 
      
      if (savedGame && !savedGame.isGameOver && !savedGame.isWon && savedGame.mistakes > 0) {
        storeState.updateElo(-5);
      }

      // [UPDATED] Daily vs Standard Generation
      let initialGrid, solvedGrid;
      
      if (searchMode === 'Daily') {
          // Generate deterministic board based on today's date
          const todayStr = new Date().toISOString().split('T')[0]; // "2024-05-20"
          const result = generateDailyBoard(todayStr);
          initialGrid = result.initial;
          solvedGrid = result.solved;
      } else {
          // Standard Random Generation
          const result = generateSudoku(GAME_CONFIG[searchMode].holes);
          initialGrid = result.initial;
          solvedGrid = result.solved;
      }
      
      setInitialBoard(initialGrid);
      setSolution(solvedGrid);
      setBoardState(initialGrid.map(row => [...row]));
      setMistakes(0);
      setErrorCells(new Set());
      setNotes({});
      setHistory([]);
      
      cellTimesRef.current = {};
      timeRef.current = 0;
      setTimeElapsed(0);

      setSelectedCell(null);
      setActiveNumber(null); 
      setIsNoteMode(false);
      setIsWon(false);
      setRewards(null);
      setShowLevelUp(false);
      prevRegionsRef.current = new Set();
      
      clearGame();
    }
  }, [searchParams, clearGame, searchMode]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // --- AUTO-SAVE ---
  const getGameState = useCallback((): GameState | null => {
    if (!boardState || !initialBoard || !solution) return null;
    return {
        initialBoard,
        boardState,
        solution,
        notes,
        history,
        mistakes,
        timeElapsed: timeRef.current, 
        // Cast Daily back to Standard for type safety if needed, 
        // OR update GameState interface to include 'Daily'.
        // For now, we assume GameState.difficulty supports 'Daily' (updated in Step 1 of phase 4)
        difficulty: activeMode, 
        cellTimes: cellTimesRef.current,
        isGameOver, 
        isWon
    };
  }, [boardState, initialBoard, solution, notes, history, mistakes, activeMode, isGameOver, isWon]);

  useEffect(() => {
    if (isGameActive) {
      const state = getGameState();
      if (state) saveGame(state);
    }
  }, [boardState, notes, mistakes, isGameActive, getGameState, saveGame]); 

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

  // --- GAME OVER ---
  useEffect(() => {
    if (isGameOver) {
      playSfx('gameover'); 
      // NOTE: Daily Challenge failure could potentially just end the run 
      // without affecting ELO heavily, or treat it like Standard. 
      // Treating as Standard for now.
      const result = calculateGameRewards({
        mode: activeMode === 'Daily' ? 'Standard' : activeMode,
        timeElapsed: timeRef.current,
        mistakes,
        isWin: false,
        currentElo: elo
      });

      updateElo(result.eloChange);
      addXp(result.xp); 
      incrementStats(false, activeMode === 'Daily' ? 'Standard' : activeMode, timeRef.current, mistakes);
      clearGame();
      
      pushSync(); 
    }
  }, [isGameOver, clearGame, activeMode, mistakes, elo, updateElo, addXp, incrementStats, pushSync]);

  // --- TIMERS ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGameActive && boardState) {
      interval = setInterval(() => {
        timeRef.current += 1;
        setTimeElapsed(timeRef.current);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGameActive, boardState]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGameActive && selectedCell) {
      interval = setInterval(() => {
        const key = `${selectedCell.row}-${selectedCell.col}`;
        cellTimesRef.current[key] = (cellTimesRef.current[key] || 0) + 1;
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

  // --- INPUT & VICTORY LOGIC ---
  const handleInput = useCallback((num: number, target?: {row: number, col: number}) => {
    const cell = target || selectedCell;
    if (!isGameActive || !cell || !boardState || !initialBoard || !solution) return;
    const { row, col } = cell;

    if (initialBoard[row][col] !== 0) {
      playSfx('error');
      return;
    }

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

    if (num === solution[row][col]) {
      playSfx('input'); 

      const newBoard = boardState.map(r => [...r]);
      newBoard[row][col] = num;
      setBoardState(newBoard);
      
      const newErrors = new Set(errorCells);
      newErrors.delete(`${row}-${col}`);
      setErrorCells(newErrors);

      setNotes(prevNotes => {
        const nextNotes = { ...prevNotes };
        delete nextNotes[`${row}-${col}`];
        if (autoEraseNotes) {
            for (let i = 0; i < 9; i++) {
                const rKey = `${row}-${i}`;
                const cKey = `${i}-${col}`;
                if (nextNotes[rKey]) nextNotes[rKey] = nextNotes[rKey].filter(n => n !== num);
                if (nextNotes[cKey]) nextNotes[cKey] = nextNotes[cKey].filter(n => n !== num);
            }
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
        
        // 1. Calculate Rewards (Standard Logic)
        const baseRewards = calculateGameRewards({
          mode: activeMode === 'Daily' ? 'Standard' : activeMode,
          timeElapsed: timeRef.current,
          mistakes,
          isWin: true,
          currentElo: elo
        });

        // 2. [NEW] DAILY CHALLENGE SUBMISSION
        if (activeMode === 'Daily') {
            const todayStr = new Date().toISOString().split('T')[0];
            
            // Fire and forget submission
            fetch('/api/daily/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: todayStr,
                    timeSeconds: timeRef.current,
                    mistakes: mistakes
                })
            }).then(res => res.json())
              .then(data => console.log("Daily Submitted:", data))
              .catch(err => console.error("Daily Submit Failed", err));
        }

        // 3. Apply Local Progression
        addHistoryStar();
        updateElo(baseRewards.eloChange);
        addXp(baseRewards.xp); 
        addCurrency('stardust', baseRewards.stardust);
        if (baseRewards.cometShards > 0) {
            addCurrency('cometShards', baseRewards.cometShards);
        }
        
        incrementStats(true, activeMode === 'Daily' ? 'Standard' : activeMode, timeRef.current, mistakes);
        updateStreak(); 

        const bonuses: string[] = [...(baseRewards.bonuses || [])];
        let uiXp = baseRewards.xp;
        let uiStardust = baseRewards.stardust;

        if (isNodeUnlocked('mercury')) {
            uiStardust = Math.floor(uiStardust * 1.10);
            bonuses.push("Mercury Bonus");
        }
        if (isNodeUnlocked('mars')) {
            uiXp = Math.floor(uiXp * 1.15);
            bonuses.push("Mars Bonus");
        }

        const currentXp = useStore.getState().xp; 
        const nextXp = currentXp + uiXp;
        const oldRank = [...RANKS].reverse().find(r => currentXp >= r.minXp);
        const newRank = [...RANKS].reverse().find(r => nextXp >= r.minXp);

        if (oldRank && newRank && newRank.id !== oldRank.id) {
          setNewRankId(newRank.id);
          setShowLevelUp(true);
        }

        setRewards({
            ...baseRewards,
            xp: uiXp,
            stardust: uiStardust,
            bonuses: bonuses
        });
        
        setIsWon(true);
        clearGame(); 
        
        // 4. Force Sync
        pushSync();
      }

    } else {
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
    autoEraseNotes, addHistoryStar, isNodeUnlocked, pushSync
  ]);

  const handleCellClick = (row: number, col: number) => {
    if (inputMode === 'digit-first' && activeNumber !== null) {
       handleInput(activeNumber, { row, col });
       setSelectedCell({ row, col });
    } else {
       playSfx('click'); 
       setSelectedCell({ row, col });
    }
  };

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
    if (!isGameActive) return; 
    if (!selectedCell) return; 

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

  const handleNumberPadClick = (num: number) => {
      if (inputMode === 'digit-first') {
          playSfx('click');
          setActiveNumber(prev => prev === num ? null : num);
      } else {
          handleInput(num);
      }
  };

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
      {showDailyRewardModal && <DailyRewardModal />}
      {showLevelUp && newRankId && <LevelUpModal newRankId={newRankId} onClose={() => setShowLevelUp(false)} />}
      {isGameOver && <GameOverModal onRetry={startNewGame} />}
      {isWon && <VictoryModal timeElapsed={timeRef.current} mistakes={mistakes} onRetry={startNewGame} cellTimes={cellTimesRef.current} finalBoard={boardState ?? undefined} rewards={rewards} />}
      {showSettings && <GameSettingsModal onClose={() => setShowSettings(false)} />}

      {/* TOP BAR */}
      <div className="flex w-full max-w-lg items-center justify-between mb-6 px-1">
        <button onClick={handleExit} className="text-white/50 hover:text-white transition">← Exit</button>
        
        <div className="flex items-center gap-4">
          <div className="text-white/50 font-sans text-sm capitalize">{activeMode}</div>
          
          <div className="font-mono text-sm text-white/80 w-16 text-center">
             {mounted && timerVisible 
                ? formatTime(timeElapsed) 
                : <span className="text-white/20 text-xs">HIDDEN</span>
             }
          </div>
          
          {currentMaxLives === Infinity ? (
             <div className="text-neon-cyan text-xl">∞</div>
          ) : (
            <div className={`font-mono text-sm font-bold ${mistakes >= currentMaxLives ? "text-neon-red" : "text-neon-cyan"}`}>
              {mistakes}/{currentMaxLives}
            </div>
          )}

          <button 
             onClick={() => setShowSettings(true)}
             className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
             <Settings size={20} />
          </button>
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
          transientRegions={highlightCompletions ? transientRegions : undefined}
          activeNumber={activeNumber}
        />
      </div>

      {/* INPUTS */}
      <div className={`
        w-full max-w-lg flex flex-col gap-6 mt-6 mx-auto items-center 
        transition-all duration-500 
        ${!isGameActive ? "opacity-0 pointer-events-none translate-y-10" : ""}
      `}>
        <NumberPad 
          onNumberClick={handleNumberPadClick} 
          onDelete={handleDelete} 
          completedNumbers={completedNumbers}
          activeNumber={activeNumber}
          inputMode={inputMode}
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