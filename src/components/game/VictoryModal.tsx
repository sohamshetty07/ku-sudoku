"use client";
import React, { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Trophy, Clock, Zap, Activity } from "lucide-react";

type VictoryModalProps = {
  timeElapsed: number;
  mistakes: number;
  onRetry: () => void;
  // New Props for Analysis
  cellTimes?: Record<string, number>; 
  finalBoard?: number[][];
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
}: VictoryModalProps) {
  
  const [showHeatmap, setShowHeatmap] = useState(false);

  // 1. Calculate Max Time for Normalization
  const maxTime = useMemo(() => {
    const times = Object.values(cellTimes);
    if (times.length === 0) return 1;
    return Math.max(...times);
  }, [cellTimes]);

  // 2. Helper to determine cell color based on "Heat"
  const getHeatColor = (row: number, col: number) => {
    const time = cellTimes[`${row}-${col}`] || 0;
    const intensity = time / maxTime; // 0.0 to 1.0

    if (intensity === 0) return "rgba(255, 255, 255, 0.05)"; // Untouched
    
    // Low Heat (Cyan) -> High Heat (Hot Pink/Red)
    if (intensity < 0.2) return `rgba(6, 182, 212, ${0.1 + intensity})`; // Subtle Cyan
    if (intensity < 0.5) return `rgba(168, 85, 247, ${intensity})`; // Purple
    return `rgba(239, 68, 68, ${intensity})`; // Red/Pink
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/80 backdrop-blur-sm transition-all duration-500 animate-in fade-in">
      
      <div className="w-[90%] max-w-sm transform rounded-2xl border border-neon-cyan/30 bg-midnight/90 p-6 text-center shadow-[0_0_50px_rgba(6,182,212,0.4)] backdrop-blur-2xl">
        
        {/* VIEW TOGGLE (Summary vs Heatmap) */}
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
          /* --- STATE 1: SUMMARY --- */
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neon-cyan/10 ring-1 ring-neon-cyan/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Trophy size={40} className="text-neon-cyan" />
            </div>

            <h2 className="mb-2 text-3xl font-bold text-white tracking-wide">Pure Logic</h2>
            <p className="mb-8 text-sm text-neon-cyan/80 font-sans tracking-wider uppercase">Puzzle Solved</p>
            
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
            
            {/* MINI GRID */}
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