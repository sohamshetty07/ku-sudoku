"use client";

import { useEffect, useState, useCallback, Suspense, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation"; 
import { useStore, type GameState } from "@/lib/store"; 
import { useGalaxyStore } from "@/lib/store/galaxy"; 
import SudokuGrid from "@/components/game/SudokuGrid";
import NumberPad from "@/components/game/NumberPad";
import GameOverModal from "@/components/game/GameOverModal";
import VictoryModal, { type RewardSummary } from "@/components/game/VictoryModal"; 
import LevelUpModal from "@/components/progression/LevelUpModal";
import DailyRewardModal from "@/components/game/DailyRewardModal"; 
import GameSettingsModal from "@/components/game/GameSettingsModal";
import ExpeditionIntermissionModal from "@/components/game/ExpeditionIntermissionModal";
import ArtifactInfoModal from "@/components/game/ArtifactInfoModal"; 
import GameTimer from "@/components/game/GameTimer"; 
import Button from "@/components/ui/Button";
import { calculateGameRewards } from "@/lib/progression/rewards"; 
import { RANKS, ARTIFACTS, type Artifact } from "@/lib/progression/constants";
import { playSfx } from "@/lib/audio"; 
import { Settings, Hexagon, Shield, Zap, Skull, Hourglass, Eye, Anchor, Sparkles, Heart } from "lucide-react";

// --- CONFIGURATION RULES ---
const GAME_CONFIG = {
  Relaxed:  { holes: 30, parTime: 600 },
  Standard: { holes: 40, parTime: 300 },
  Mastery:  { holes: 55, parTime: 900 },
  Daily:    { holes: 40, parTime: 450 },
  Expedition: { holes: 52, parTime: 600 }, 
};

type GameMode = keyof typeof GAME_CONFIG;

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
    pushSync,
    zenMode, // [NEW] Zen Mode Setting
    // EXPEDITION STORE
    expedition,
    updateExpedition,
    endExpedition
  } = useStore();

  const { addHistoryStar, isNodeUnlocked } = useGalaxyStore();

  const rawMode = searchParams.get("mode");
  const searchMode: GameMode = (rawMode && rawMode in GAME_CONFIG) 
    ? (rawMode as GameMode) 
    : "Standard";

  const [activeMode, setActiveMode] = useState<GameMode>(searchMode);
  const isExpedition = activeMode === 'Expedition';
  
  // Calculate Max Lives based on Mode
  const currentMaxLives = isExpedition 
      ? expedition.maxLives 
      : activeMode === 'Relaxed' ? Infinity : (activeMode === 'Mastery' ? 2 : maxMistakes);

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
  const [initialTime, setInitialTime] = useState<number>(0);
  const workerRef = useRef<Worker | null>(null);

  const [isWon, setIsWon] = useState<boolean>(false);
  const [rewards, setRewards] = useState<RewardSummary | null>(null);
  
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newRankId, setNewRankId] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showIntermission, setShowIntermission] = useState(false);
  const [gameOverProcessed, setGameOverProcessed] = useState(false);

  // Artifact State
  const [frozenUntil, setFrozenUntil] = useState(0); 
  const [lensNumber, setLensNumber] = useState<number | null>(null); 
  const [viewingArtifact, setViewingArtifact] = useState<string | null>(null); 
  
  // [NEW] Zen Mode UI State
  const [isUIHidden, setIsUIHidden] = useState(false);

  // Game Over Logic
  const isGameOver = isExpedition 
     ? expedition.lives <= 0 
     : (currentMaxLives !== Infinity && mistakes >= currentMaxLives);
     
  const isGameActive = !isGameOver && !isWon;
  const isTimerFrozen = Date.now() < frozenUntil;

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

  // Logic: Stellar Siphon
  useEffect(() => {
    const current = completedRegions;
    const prev = prevRegionsRef.current;
    if (current.size > prev.size) {
        const diff = new Set([...current].filter(x => !prev.has(x)));
        
        if (diff.size > 0 && highlightCompletions && isGameActive && mounted) {
            playSfx('chord'); 
            setTransientRegions(prevTr => { const next = new Set(prevTr); diff.forEach(d => next.add(d)); return next; });
            setTimeout(() => { setTransientRegions(prevTr => { const next = new Set(prevTr); diff.forEach(d => next.delete(d)); return next; }); }, 1500);
        }

        if (isExpedition && isGameActive) {
            const hasSiphon = expedition.artifacts.includes('stellar_siphon');
            if (hasSiphon) {
                const newBoxes = [...diff].filter(r => r.startsWith('box-'));
                if (newBoxes.length > 0) {
                    playSfx('success');
                    addCurrency('stardust', newBoxes.length * 10);
                }
            }
        }
    }
    prevRegionsRef.current = current;
  }, [completedRegions, highlightCompletions, isGameActive, mounted, isExpedition, expedition.artifacts, addCurrency]);

  // --- WORKER & INIT ---
  useEffect(() => {
    workerRef.current = new Worker(new URL('./sudoku.worker.ts', import.meta.url));
    workerRef.current.onmessage = (event) => {
      const { type, result } = event.data;
      if (type === 'GENERATED') {
        const { initial, solved } = result;
        setInitialBoard(initial);
        setSolution(solved);
        setBoardState(initial.map((row: number[]) => [...row]));
      }
    };
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    refreshPerks(); 
  }, [refreshPerks]);

  useEffect(() => {
    const visualDiff = (activeMode === 'Daily' || activeMode === 'Expedition') ? 'Standard' : activeMode;
    setThemeDifficulty(visualDiff as any);
  }, [activeMode, setThemeDifficulty]);

  // --- ZEN MODE LOGIC ---
  useEffect(() => {
    if (!zenMode) {
      setIsUIHidden(false);
      return;
    }

    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      setIsUIHidden(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Only hide if game is active and not won/lost
        if (isGameActive) setIsUIHidden(true);
      }, 5000); // 5 seconds inactivity
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    
    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [zenMode, isGameActive]);

  const startNewGame = useCallback(() => {
    const shouldResume = searchParams.get("resume") === "true";
    const storeState = useStore.getState();
    const savedGame = storeState.activeGame;

    if (shouldResume && savedGame) {
      console.log("Resuming saved game...");
      setActiveMode(savedGame.difficulty as GameMode);
      setInitialBoard(savedGame.initialBoard);
      setSolution(savedGame.solution);
      setBoardState(savedGame.boardState);
      setMistakes(savedGame.mistakes);
      
      setInitialTime(savedGame.timeElapsed);
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
      setShowIntermission(false); 
      setGameOverProcessed(false);
      prevRegionsRef.current = new Set();
    } else {
      console.log(`Requesting new ${searchMode} game from worker...`);
      setActiveMode(searchMode); 
      
      if (savedGame && !savedGame.isGameOver && !savedGame.isWon && savedGame.mistakes > 0) {
        storeState.updateElo(-5);
      }

      setInitialBoard(null);
      setBoardState(null);
      setSolution(null);

      let holes = GAME_CONFIG[searchMode].holes;
      let seed: string | undefined = undefined;

      if (searchMode === 'Daily') {
          seed = new Date().toISOString().split('T')[0];
          holes = 40; 
      } else if (searchMode === 'Expedition') {
          const sector = useStore.getState().expedition.sector || 1;
          holes = Math.min(60, 52 + Math.floor(sector / 2));
      }

      workerRef.current?.postMessage({
        type: 'GENERATE',
        holes,
        seed
      });
      
      setMistakes(0);
      setErrorCells(new Set());
      setNotes({});
      setHistory([]);
      
      cellTimesRef.current = {};
      timeRef.current = 0;
      setInitialTime(0);
      setFrozenUntil(0);
      setLensNumber(null);

      setSelectedCell(null);
      setActiveNumber(null); 
      setIsNoteMode(false);
      setIsWon(false);
      setRewards(null);
      setShowLevelUp(false);
      setShowIntermission(false);
      setGameOverProcessed(false);
      prevRegionsRef.current = new Set();
      
      clearGame();

      if (searchMode === 'Expedition') {
          const arts = useStore.getState().expedition.artifacts;
          if (arts.includes('blood_pact')) {
              useStore.getState().updateExpedition({ maxLives: 1, lives: 1 });
          }
      }
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
    if (isGameOver && !gameOverProcessed) {
      setGameOverProcessed(true); 
      playSfx('gameover'); 
      
      if (activeMode === 'Expedition') {
         endExpedition();
         clearGame();
         return;
      }

      const currentElo = useStore.getState().elo;

      const result = calculateGameRewards({
        mode: activeMode === 'Daily' ? 'Standard' : (activeMode as any),
        timeElapsed: timeRef.current,
        mistakes,
        isWin: false,
        currentElo: currentElo
      });

      updateElo(result.eloChange);
      addXp(result.xp); 
      incrementStats(false, activeMode === 'Daily' ? 'Standard' : (activeMode as any), timeRef.current, mistakes);
      clearGame();
      
      pushSync(); 
    }
  }, [isGameOver, gameOverProcessed, clearGame, activeMode, mistakes, updateElo, addXp, incrementStats, pushSync, endExpedition]);

  // --- TIMERS ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGameActive && selectedCell) {
      interval = setInterval(() => {
        if (Date.now() < frozenUntil) return;
        const key = `${selectedCell.row}-${selectedCell.col}`;
        cellTimesRef.current[key] = (cellTimesRef.current[key] || 0) + 1;
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGameActive, selectedCell, frozenUntil]);

  // --- ARTIFACT HANDLERS ---
  const handleArtifactUse = (artifact: Artifact) => {
    if (!isExpedition || !artifact) return;
    
    if (artifact.type === 'Passive' || artifact.type === 'Cursed') {
        setViewingArtifact(artifact.id);
        return;
    }

    const state = expedition.artifactState[artifact.id] || {};
    if (artifact.maxUses && (state.usesLeft || 0) <= 0 && state.usesLeft !== undefined) {
         playSfx('error');
         return;
    }

    if (artifact.effectId === 'freeze') {
        playSfx('ice-shatter'); 
        setFrozenUntil(Date.now() + 30000); 
        consumeCharge(artifact.id, state, artifact.maxUses);
    }
    else if (artifact.effectId === 'reveal_number') {
        if (activeNumber === null) {
            playSfx('error');
            return;
        }
        playSfx('scan');
        setLensNumber(activeNumber);
        setTimeout(() => setLensNumber(null), 10000); 
        consumeCharge(artifact.id, state, artifact.maxUses);
    }
    else if (artifact.effectId === 'auto_notes') {
        if (!solution || !boardState) return;
        playSfx('scan');
        
        const newNotes = { ...notes };
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (boardState[r][c] === 0) {
                    const validNums = [];
                    for (let n = 1; n <= 9; n++) {
                        let valid = true;
                        if (boardState[r].includes(n)) valid = false;
                        if (valid) { for(let i=0; i<9; i++) if(boardState[i][c] === n) valid = false; }
                        if (valid) {
                           const br = Math.floor(r/3)*3; const bc = Math.floor(c/3)*3;
                           for(let i=0;i<3;i++) for(let j=0;j<3;j++) if(boardState[br+i][bc+j] === n) valid = false;
                        }
                        if (valid) validNums.push(n);
                    }
                    newNotes[`${r}-${c}`] = validNums;
                }
            }
        }
        setNotes(newNotes);
        consumeCharge(artifact.id, state, artifact.maxUses);
    }
    else if (artifact.effectId === 'auto_solve_1') {
        if (!solution || !boardState) return;
        
        const empties = [];
        for(let r=0;r<9;r++) for(let c=0;c<9;c++) if(boardState[r][c] === 0) empties.push({r,c});
        
        if (empties.length > 0) {
            const pick = empties[Math.floor(Math.random() * empties.length)];
            handleInput(solution[pick.r][pick.c], { row: pick.r, col: pick.c });
            playSfx('heavy-impact');
            consumeCharge(artifact.id, state, artifact.maxUses);
        }
    }
    else if (artifact.effectId === 'validate_board') {
        playSfx('scan');
        consumeCharge(artifact.id, state, artifact.maxUses);
    }
  };

  const consumeCharge = (id: string, state: any, maxUses?: number) => {
      const newUses = (state.usesLeft ?? maxUses ?? 1) - 1;
      updateExpedition({
          artifactState: {
              ...expedition.artifactState,
              [id]: { ...state, usesLeft: newUses }
          }
      });
  };

  const handleExit = () => {
    router.push('/dashboard');
  };

  const handleNextSector = () => {
     const nextArtifactState = { ...expedition.artifactState };
     expedition.artifacts.forEach(id => {
        const art = ARTIFACTS.find(a => a.id === id);
        if (art && art.cooldownType === 'PerPuzzle' && art.maxUses) {
            nextArtifactState[id] = { 
                ...nextArtifactState[id], 
                usesLeft: art.maxUses 
            };
        }
     });
     updateExpedition({ 
         sector: expedition.sector + 1,
         artifactState: nextArtifactState
     });
     startNewGame(); 
  };

  const handleCashOut = () => {
      const sector = expedition.sector;
      const payoutStardust = 100 + (sector * 50);
      const payoutShards = Math.floor(sector / 2) + 1;
      addCurrency('stardust', payoutStardust);
      addCurrency('cometShards', payoutShards);
      addXp(sector * 100);
      endExpedition();
      pushSync();
      router.push('/dashboard');
  };

  const handleVictoryContinue = () => {
      if (isExpedition) {
          setShowIntermission(true);
          setIsWon(false); 
      } else {
          startNewGame();
      }
  };

  const saveToHistory = useCallback(() => {
    if (!boardState) return;
    setHistory(p => {
        // [ROBUSTNESS] Cap history at 50 moves to prevent LocalStorage quota exceeded errors
        const newHistory = [...p, { board: boardState.map(r => [...r]), notes: { ...notes } }];
        if (newHistory.length > 50) {
            return newHistory.slice(newHistory.length - 50);
        }
        return newHistory;
    });
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

  // [NEW] Smart Note Handler
  const handleCellNote = useCallback((row: number, col: number) => {
      if (!isGameActive || !boardState || boardState[row][col] !== 0) return;

      // Logic: If in digit-first mode with a number selected, toggle that specific note
      if (inputMode === 'digit-first' && activeNumber) {
          playSfx('click');
          saveToHistory();
          const key = `${row}-${col}`;
          const curr = notes[key] || [];
          const newNotes = curr.includes(activeNumber)
              ? curr.filter(n => n !== activeNumber)
              : [...curr, activeNumber];
          setNotes(p => ({ ...p, [key]: newNotes }));
      } else {
          // Otherwise, select the cell and toggle Global Note Mode so user can type
          playSfx('click');
          setSelectedCell({ row, col });
          setIsNoteMode(prev => !prev);
      }
  }, [isGameActive, boardState, inputMode, activeNumber, notes, saveToHistory]);

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
        const baseRewards = calculateGameRewards({
          mode: activeMode === 'Daily' ? 'Standard' : (activeMode as any),
          timeElapsed: timeRef.current,
          mistakes,
          isWin: true,
          currentElo: elo
        });

        if (activeMode === 'Daily') {
            const todayStr = new Date().toISOString().split('T')[0];
            fetch('/api/daily/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: todayStr,
                    timeSeconds: timeRef.current,
                    mistakes: mistakes
                })
            }).catch(err => console.error("Daily Submit Failed", err));
        }

        if (!isExpedition) {
            addHistoryStar();
            updateElo(baseRewards.eloChange);
            addXp(baseRewards.xp); 
            addCurrency('stardust', baseRewards.stardust);
            if (baseRewards.cometShards > 0) {
                addCurrency('cometShards', baseRewards.cometShards);
            }
            incrementStats(true, activeMode as any, timeRef.current, mistakes);
            updateStreak(); 
        } else {
             let xpMult = 1;
             let dustMult = 1;
             const artifacts = useStore.getState().expedition.artifacts;
             artifacts.forEach(id => {
                 const a = ARTIFACTS.find(art => art.id === id);
                 if (a?.rewardMultiplier) {
                     if (a.rewardMultiplier.xp) xpMult *= a.rewardMultiplier.xp;
                     if (a.rewardMultiplier.stardust) dustMult *= a.rewardMultiplier.stardust;
                 }
             });
             addXp(50 * xpMult);
             addCurrency('stardust', 20 * dustMult);
        }

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
        pushSync();
      }

    } else {
      let blocked = false;
      if (isExpedition) {
          const aegisId = expedition.artifacts.find(id => id.includes('aegis')); 
          if (aegisId) {
             const state = expedition.artifactState[aegisId] || {};
             const uses = state.usesLeft ?? 3;
             if (uses > 0) {
                 playSfx('shield-block');
                 blocked = true;
                 updateExpedition({
                     artifactState: {
                         ...expedition.artifactState,
                         [aegisId]: { ...state, usesLeft: uses - 1 }
                     }
                 });
             }
          }
      }

      if (!blocked) {
          playSfx('error'); 
          if (isExpedition) {
              const newLives = expedition.lives - 1;
              if (newLives <= 0) {
                  const anchorId = expedition.artifacts.find(id => id.includes('anchor'));
                  if (anchorId) {
                      const state = expedition.artifactState[anchorId] || {};
                      const uses = state.usesLeft ?? 1;
                      if (uses > 0) {
                          playSfx('revive');
                          updateExpedition({
                              lives: 1, 
                              artifactState: {
                                  ...expedition.artifactState,
                                  [anchorId]: { ...state, usesLeft: 0 }
                              }
                          });
                      } else {
                          updateExpedition({ lives: 0 });
                      }
                  } else {
                      updateExpedition({ lives: 0 });
                  }
              } else {
                  updateExpedition({ lives: newLives });
              }
          } else {
              setMistakes(m => m + 1);
          }
      }
      
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
    autoEraseNotes, addHistoryStar, isNodeUnlocked, pushSync, isExpedition, 
    expedition, updateExpedition
  ]);

  const showNoteButton = !isExpedition || !expedition.artifacts.includes('blind_fold');

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

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

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
      className="relative flex min-h-screen flex-col items-center justify-center px-1 py-4 md:p-4 pb-8 transition-colors duration-1000 overflow-hidden"
    >
      {isExpedition && (
         <div className="absolute inset-0 pointer-events-none bg-indigo-900/10 animate-pulse-slow" />
      )}

      {showDailyRewardModal && <DailyRewardModal />}
      {showLevelUp && newRankId && <LevelUpModal newRankId={newRankId} onClose={() => setShowLevelUp(false)} />}
      
      {isGameOver && <GameOverModal onRetry={startNewGame} isExpedition={isExpedition} />}
      
      {showIntermission && (
          <ExpeditionIntermissionModal 
             sector={expedition.sector}
             onContinue={handleNextSector}
             onCashOut={handleCashOut}
          />
      )}
      
      {isWon && !showIntermission && (
         <VictoryModal 
            timeElapsed={timeRef.current} 
            mistakes={mistakes} 
            onRetry={handleVictoryContinue} 
            cellTimes={cellTimesRef.current} 
            finalBoard={boardState ?? undefined} 
            rewards={rewards} 
            isExpedition={isExpedition}
            nextSector={expedition.sector + 1}
         />
      )}

      {showSettings && <GameSettingsModal onClose={() => setShowSettings(false)} />}

      {viewingArtifact && <ArtifactInfoModal artifactId={viewingArtifact} onClose={() => setViewingArtifact(null)} />}

      {/* TOP BAR - [UPDATED] Zen Mode Visibilty */}
      <div className={`flex w-full max-w-lg items-center justify-between mb-6 px-1 relative z-10 transition-all duration-500 ${isUIHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <button onClick={handleExit} className="text-white/50 hover:text-white transition">← Exit</button>
        
        <div className="flex items-center gap-4">
          <div className="text-white/50 font-sans text-sm capitalize">
              {isExpedition ? `Sector ${expedition.sector}` : activeMode}
          </div>
          
          <div className={`font-mono text-sm w-16 text-center ${isTimerFrozen ? 'text-blue-400 animate-pulse' : 'text-white/80'}`}>
             {mounted && timerVisible 
                ? <GameTimer 
                    start={initialTime} 
                    isPaused={!isGameActive || isTimerFrozen} 
                    onTimeUpdate={(s) => timeRef.current = s} 
                  />
                : <span className="text-white/20 text-xs">HIDDEN</span>
             }
          </div>
          
          {/* LIVES INDICATOR - [UPDATED] Visual Hearts for Expedition */}
          <div className={`font-mono text-sm font-bold flex items-center gap-1 ${isExpedition ? 'text-indigo-400' : (mistakes >= currentMaxLives ? "text-neon-red" : "text-neon-cyan")}`}>
              {isExpedition ? (
                  <div className="flex gap-1 items-center" title={`${expedition.lives} Lives Remaining`}>
                    {/* Render up to 5 visual hearts */}
                    {Array.from({ length: Math.min(5, expedition.maxLives) }).map((_, i) => (
                        <Heart
                            key={i}
                            size={16}
                            className={`${i < expedition.lives ? "fill-neon-red text-neon-red" : "fill-none text-white/20"}`}
                        />
                    ))}
                    {/* Text fallback for high health */}
                    {expedition.maxLives > 5 && <span className="text-xs ml-1">+{Math.max(0, expedition.lives - 5)}</span>}
                  </div>
              ) : currentMaxLives === Infinity ? (
                 <span className="text-xl">∞</span>
              ) : (
                <span>{mistakes}/{currentMaxLives}</span>
              )}
          </div>

          <button 
             onClick={() => setShowSettings(true)}
             className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
             <Settings size={20} />
          </button>
        </div>
      </div>

      {isExpedition && expedition.artifacts.length > 0 && (
         <div className={`flex gap-2 mb-4 animate-slide-down transition-opacity duration-500 ${isUIHidden ? 'opacity-0' : 'opacity-100'}`}>
             {expedition.artifacts.map(id => {
                 const art = ARTIFACTS.find(a => a.id === id);
                 if (!art) return null;
                 const state = expedition.artifactState[id] || {};
                 const uses = state.usesLeft ?? art.maxUses ?? 0;
                 const isActive = art.type === 'Active' && uses > 0;
                 
                 let Icon = Hexagon;
                 if (art.effectId === 'freeze') Icon = Hourglass;
                 if (art.effectId === 'reveal_number') Icon = Eye;
                 if (art.effectId === 'shield_pool') Icon = Shield;
                 if (art.effectId === 'revive') Icon = Anchor;
                 if (art.effectId === 'auto_notes') Icon = Sparkles;
                 if (art.effectId === 'curse_1hp' || art.effectId === 'curse_decay') Icon = Skull;

                 return (
                     <button
                        key={id}
                        onClick={() => handleArtifactUse(art)}
                        disabled={!isActive && art.type === 'Active'}
                        className={`
                            relative p-2 rounded-lg border flex items-center gap-1 transition-all
                            ${isActive 
                                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/30' 
                                : 'bg-slate-800/50 border-white/5 text-slate-500 cursor-default hover:bg-slate-700/50'}
                        `}
                        title={art.description}
                     >
                        <Icon size={14} />
                        {art.maxUses && <span className="text-[10px] font-bold">{uses}</span>}
                     </button>
                 )
             })}
         </div>
      )}

      <div className={`
        w-full relative
        transition-all duration-1000 
        ${!isGameActive && !isWon ? "opacity-30 pointer-events-none filter blur-sm" : ""}
        ${isWon ? "scale-105" : ""}
      `}>
        {isTimerFrozen && (
            <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                 <div className="bg-blue-900/80 text-blue-200 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl animate-pulse">
                    Time Frozen
                 </div>
            </div>
        )}

        <SudokuGrid 
          initialBoard={initialBoard}
          boardState={boardState}
          selectedCell={selectedCell}
          onCellClick={handleCellClick}
          onCellNote={handleCellNote} // [NEW] Pass Smart Note Handler
          errorCells={errorCells}
          notes={notes}
          transientRegions={highlightCompletions ? transientRegions : undefined}
          activeNumber={lensNumber !== null ? lensNumber : activeNumber} 
        />
      </div>

      {/* CONTROLS - [UPDATED] Zen Mode Visibility */}
      <div className={`
        w-full max-w-lg flex flex-col gap-6 mt-6 mx-auto items-center 
        transition-all duration-500 
        ${!isGameActive ? "opacity-0 pointer-events-none translate-y-10" : ""}
        ${isUIHidden ? "opacity-0 pointer-events-none translate-y-4" : ""}
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
          
          {showNoteButton && (
             <Button variant={isNoteMode ? "primary" : "secondary"} className="w-1/3" onClick={() => setIsNoteMode(!isNoteMode)}>
                {isNoteMode ? "Note: ON" : "Note"}
             </Button>
          )}
        </div>
      </div>
    </main>
  );
}

export default function GamePage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white/20">Loading...</div>}>
      <GameContent />
    </Suspense>
  );
}