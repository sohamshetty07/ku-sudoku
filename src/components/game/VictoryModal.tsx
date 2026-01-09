"use client";
import React, { useMemo, useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { Trophy, Clock, Zap, Activity, ArrowUp, Star, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { RewardSummary } from "@/lib/progression/rewards"; // Import the type

type VictoryModalProps = {
  timeElapsed: number;
  mistakes: number;
  onRetry: () => void;
  cellTimes?: Record<string, number>; 
  finalBoard?: number[][];
  rewards?: RewardSummary | null; // <--- The new Rewards Data
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
  rewards,
}: VictoryModalProps) {
  
  const [showHeatmap, setShowHeatmap] = useState(false);
  const { elo } = useStore(); // Current global Elo (already updated)
  
  // Rolling Counters
  const [displayedXp, setDisplayedXp] = useState(0);
  const [displayedStardust, setDisplayedStardust] = useState(0);

  // Animation Effect
  useEffect(() => {
    if (!rewards) return;

    // 1. Animate XP
    const xpStep = Math.ceil(rewards.xp / 20);
    const xpInterval = setInterval(() => {
      setDisplayedXp(prev => {
        if (prev + xpStep >= rewards.xp) {
            clearInterval(xpInterval);
            return rewards.xp;
        }
        return prev + xpStep;
      });
    }, 30);

    // 2. Animate Stardust
    const dustStep = Math.max(1, Math.ceil(rewards.stardust / 20));
    const dustInterval = setInterval(() => {
      setDisplayedStardust(prev => {
        if (prev + dustStep >= rewards.stardust) {
            clearInterval(dustInterval);
            return rewards.stardust;
        }
        return prev + dustStep;
      });
    }, 40);

    return () => {
      clearInterval(xpInterval);
      clearInterval(dustInterval);
    };
  }, [rewards]);

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
          /* --- STATE 1: REWARDS --- */
          <>
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neon-cyan/10 ring-1 ring-neon-cyan/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Trophy size={40} className="text-neon-cyan" />
            </div>

            <h2 className="mb-1 text-2xl font-bold text-white tracking-wide">VICTORY</h2>
            <p className="text-white/40 text-sm mb-6 font-mono">The Void accepts your logic.</p>
            
            {/* REWARDS GRID */}
            {rewards && (
              <div className="space-y-4 mb-6">
                
                {/* PRIMARY STATS (ELO & XP) */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col items-center">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Skill</span>
                        <div className="flex items-center gap-1">
                            <span className="text-xl font-mono font-bold text-white">
                                {rewards.eloChange >= 0 ? "+" : ""}{rewards.eloChange}
                            </span>
                            <span className="text-xs text-white/60">ELO</span>
                        </div>
                    </div>
                    <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/20 flex flex-col items-center">
                        <span className="text-[10px] text-purple-300/60 uppercase tracking-widest mb-1">Experience</span>
                        <div className="flex items-center gap-1">
                            <span className="text-xl font-mono font-bold text-purple-400">
                                +{displayedXp}
                            </span>
                            <span className="text-xs text-purple-400/60">XP</span>
                        </div>
                    </div>
                </div>

                {/* CURRENCY BOX */}
                <div className="bg-amber-500/5 rounded-xl p-3 border border-amber-500/10 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <Star size={16} className="text-amber-400 fill-amber-400" />
                        <span className="text-xl font-mono font-bold text-amber-100">+{displayedStardust}</span>
                    </div>
                    {rewards.cometShards > 0 && (
                         <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-rose-500 fill-rose-500" />
                            <span className="text-xl font-mono font-bold text-rose-100">+{rewards.cometShards}</span>
                        </div>
                    )}
                </div>

                {/* BONUSES PILLS */}
                {rewards.bonuses.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                        {rewards.bonuses.map((bonus, i) => (
                            <span key={i} className="text-[10px] bg-neon-cyan/5 text-neon-cyan px-2 py-1 rounded-full border border-neon-cyan/10">
                                {bonus}
                            </span>
                        ))}
                    </div>
                )}
              </div>
            )}
            
            {/* MINI STATS - Updated styles here */}
            <div className="flex justify-center gap-6 text-white font-mono mb-6 font-bold text-lg">
                <span className="flex items-center gap-2">
                    <Clock size={16} className="text-white/80" /> {formatTime(timeElapsed)}
                </span>
                <span className="flex items-center gap-2">
                    <Zap size={16} className="text-white/80" /> {mistakes} Mistakes
                </span>
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
            <Button variant="secondary" fullWidth>Return to Void</Button>
          </Link>
        </div>

      </div>
    </div>
  );
}