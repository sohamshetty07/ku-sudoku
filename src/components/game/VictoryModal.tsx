"use client";
import React, { useMemo, useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Trophy, Clock, Zap, Activity, ArrowUp } from "lucide-react";
import { useStore } from "@/lib/store";

type VictoryModalProps = {
  timeElapsed: number;
  mistakes: number;
  onRetry: () => void;
  // New Props for Analysis
  cellTimes?: Record<string, number>; 
  finalBoard?: number[][];
  score: number; // <--- NEW: The score calculated in GamePage
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export default function VictoryModal({ 
  timeElapsed, 
  mistakes, 
  onRetry,
  cellTimes = {}, 
  score,
}: VictoryModalProps) {
  
  const [showHeatmap, setShowHeatmap] = useState(false);
  const { elo } = useStore(); // Get current global Elo
  
  // Rolling Counter State
  const [displayedScore, setDisplayedScore] = useState(0);
  // We assume the 'elo' in store is already updated, so we animate TO it.
  const [displayedElo, setDisplayedElo] = useState(elo - score); 

  // Animation Effect
  useEffect(() => {
    // 1. Animate Game Score (0 -> score)
    const scoreInterval = setInterval(() => {
      setDisplayedScore(prev => {
        if (prev < score) return prev + 1;
        clearInterval(scoreInterval);
        return score;
      });
    }, 20); // Fast roll (20ms)

    // 2. Animate Total Elo (Old -> New)
    const eloInterval = setInterval(() => {
      setDisplayedElo(prev => {
        if (prev < elo) return prev + 1;
        clearInterval(eloInterval);
        return elo;
      });
    }, 20);

    return () => {
      clearInterval(scoreInterval);
      clearInterval(eloInterval);
    };
  }, [score, elo]);

  // Heatmap Logic
  const maxTime = useMemo(() => {
    const times = Object.values(cellTimes);
    if (times.length === 0) return 1;
    return Math.max(...times);
  }, [cellTimes]);

  const getHeatColor = (row: number, col: number) => {
    const time = cellTimes[`${row}-${col}`] || 0;
    const intensity = time / maxTime; 

    if (intensity === 0) return "rgba(255, 255, 255, 0.05)"; 
    if (intensity < 0.2) return `rgba(6, 182, 212, ${0.1 + intensity})`; 
    if (intensity < 0.5) return `rgba(168, 85, 247, ${intensity})`; 
    return `rgba(239, 68, 68, ${intensity})`; 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/80 backdrop-blur-sm transition-all duration-500 animate-in fade-in">
      
      <div className="w-[90%] max-w-sm transform rounded-2xl border border-neon-cyan/30 bg-midnight/90 p-6 text-center shadow-[0_0_50px_rgba(6,182,212,0.4)] backdrop-blur-2xl">
        
        {/* VIEW TOGGLE */}
        <div className="flex justify-end mb-2">
           <button 
             onClick={() => setShowHeatmap(!showHeatmap)}
             className="text-xs text-neon-cyan/60 hover:text-neon-cyan uppercase tracking-wider flex items-center gap-1 transition-colors"
           >
             <Activity size={12} />
             {showHeatmap ? "View Stats" : "View Heatmap"}
           </button>
        </div>

        {!showHeatmap ? (
          /* --- STATE 1: SCORECARD --- */
          <>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neon-cyan/10 ring-1 ring-neon-cyan/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Trophy size={40} className="text-neon-cyan" />
            </div>

            <h2 className="mb-1 text-2xl font-bold text-white tracking-wide">Pure Logic</h2>
            
            {/* DYNAMIC SCORE DISPLAY */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-4xl font-mono font-bold text-neon-cyan">+{displayedScore}</span>
              <span className="text-xs text-neon-cyan/60 uppercase font-sans tracking-widest">PTS</span>
            </div>

            {/* ELO ROLLER BOX */}
            <div className="bg-white/5 rounded-lg p-3 mb-6 border border-white/10 flex justify-between items-center">
               <span className="text-xs text-white/50 uppercase tracking-wider">Total Rank</span>
               <div className="flex items-center gap-2 text-white font-mono">
                  <span className="text-lg">{displayedElo}</span>
                  <ArrowUp size={14} className="text-neon-cyan animate-bounce" />
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex flex-col items-center p-3 rounded-lg bg-white/5 border border-white/10">
                <Clock size={16} className="text-white/50 mb-1" />
                <span className="text-xl font-mono font-bold text-white">{formatTime(timeElapsed)}</span>
                <span className="text-[10px] text-white/40 uppercase">Time</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-white/5 border border-white/10">
                <Zap size={16} className="text-white/50 mb-1" />
                <span className="text-xl font-mono font-bold text-white">{mistakes}/3</span>
                <span className="text-[10px] text-white/40 uppercase">Mistakes</span>
              </div>
            </div>
          </>
        ) : (
          /* --- STATE 2: HEATMAP --- */
          <div className="mb-8 animate-in zoom-in duration-300">
            <h3 className="text-white mb-4 font-bold">Focus Heatmap</h3>
            <p className="text-xs text-white/50 mb-4">Red zones indicate hesitation.</p>
            
            <div className="grid grid-cols-9 gap-[2px] border-2 border-white/10 p-1 bg-black/20 rounded-lg aspect-square">
              {Array.from({ length: 9 }).map((_, r) => (
                Array.from({ length: 9 }).map((_, c) => (
                  <div 
                    key={`${r}-${c}`}
                    className="w-full h-full rounded-[1px] transition-all duration-500"
                    style={{ backgroundColor: getHeatColor(r, c) }}
                  />
                ))
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <Button variant="primary" fullWidth onClick={onRetry}>New Game</Button>
          <Link href="/" className="block w-full">
            <Button variant="secondary" fullWidth>Return to Sanctuary</Button>
          </Link>
        </div>

      </div>
    </div>
  );
}