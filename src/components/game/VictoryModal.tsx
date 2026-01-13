"use client";
import React, { useMemo, useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { 
  Trophy, Clock, Zap, Activity, ArrowUp, Star, Sparkles, Globe, 
  ArrowRight, Hexagon, RotateCcw, Home, Flame
} from "lucide-react";

export type RewardSummary = {
  xp: number;
  stardust: number;
  cometShards: number;
  eloChange: number;
  bonuses: string[]; 
};

type VictoryModalProps = {
  timeElapsed: number;
  mistakes: number;
  onRetry: () => void;
  cellTimes?: Record<string, number>; 
  rewards?: RewardSummary | null; 
  finalBoard?: number[][];
  isExpedition?: boolean;
  nextSector?: number; 
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
  isExpedition = false,
  nextSector,
}: VictoryModalProps) {
  
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  // Rolling Counters
  const [displayedXp, setDisplayedXp] = useState(0);
  const [displayedStardust, setDisplayedStardust] = useState(0);

  useEffect(() => {
    if (!rewards) return;

    setDisplayedXp(0);
    setDisplayedStardust(0);

    const xpTarget = rewards.xp;
    const xpStep = Math.max(1, Math.ceil(xpTarget / 25));
    
    const xpInterval = setInterval(() => {
      setDisplayedXp(prev => {
        const next = prev + xpStep;
        if (next >= xpTarget) {
            clearInterval(xpInterval);
            return xpTarget;
        }
        return next;
      });
    }, 20);

    const dustTarget = rewards.stardust;
    const dustStep = Math.max(1, Math.ceil(dustTarget / 25));

    const dustInterval = setInterval(() => {
      setDisplayedStardust(prev => {
        const next = prev + dustStep;
        if (next >= dustTarget) {
            clearInterval(dustInterval);
            return dustTarget;
        }
        return next;
      });
    }, 20);

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
    if (intensity < 0.2) return `rgba(6, 182, 212, ${0.1 + intensity})`; // Cyan
    if (intensity < 0.5) return `rgba(168, 85, 247, ${intensity})`; // Purple
    return `rgba(239, 68, 68, ${intensity})`; // Red
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/80 backdrop-blur-md transition-all duration-500 animate-in fade-in">
      
      <div className="w-[90%] max-w-sm transform rounded-3xl border border-neon-cyan/30 bg-[#0F172A]/95 p-6 text-center shadow-[0_0_50px_rgba(6,182,212,0.2)] backdrop-blur-xl relative">
        
        {/* VIEW TOGGLE */}
        <div className="flex justify-end mb-2 relative z-10">
           <button 
             onClick={() => setShowHeatmap(!showHeatmap)}
             className="text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-neon-cyan flex items-center gap-1 transition-colors"
           >
             <Activity size={12} />
             {showHeatmap ? "VIEW REWARDS" : "ANALYZE FOCUS"}
           </button>
        </div>

        {!showHeatmap ? (
          /* --- STATE 1: REWARDS VIEW --- */
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
            
            {/* ICON */}
            <div className="mx-auto mb-4 flex justify-center relative z-10">
              <div className={`
                p-6 rounded-full border shadow-2xl
                ${isExpedition 
                    ? "bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.4)]" 
                    : "bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.4)]"
                }
              `}>
                {isExpedition ? (
                    <Hexagon size={48} className="text-indigo-400" strokeWidth={1.5} />
                ) : (
                    <Trophy size={48} className="text-cyan-400" strokeWidth={1.5} />
                )}
              </div>
            </div>

            <h2 className="mb-1 text-3xl font-bold text-white tracking-wide font-mono uppercase">
                {isExpedition ? "SECTOR CLEARED" : "VICTORY"}
            </h2>
            <p className="text-slate-400 text-xs mb-8 font-mono tracking-widest uppercase">
                {isExpedition ? "Warp Drive Charging..." : "Logic Stabilized"}
            </p>
            
            {/* REWARDS GRID */}
            {rewards && (
              <div className="space-y-3 mb-8">
                
                <div className="grid grid-cols-2 gap-3">
                    {/* ELO CARD (Hidden in Expedition usually, but flexible) */}
                    {!isExpedition && (
                        <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Rating</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-mono font-bold text-white">
                                    {rewards.eloChange >= 0 ? "+" : ""}{rewards.eloChange}
                                </span>
                                <ArrowUp size={14} className="text-emerald-400" />
                            </div>
                        </div>
                    )}

                    {/* XP CARD */}
                    <div className={`bg-purple-500/10 rounded-xl p-3 border border-purple-500/20 flex flex-col items-center justify-center relative overflow-hidden ${isExpedition ? 'col-span-2' : ''}`}>
                        <div className="absolute inset-0 bg-purple-500/5 blur-xl"></div>
                        <span className="text-[9px] text-purple-300/60 uppercase tracking-widest font-bold mb-1">XP Gained</span>
                        <div className="flex items-center gap-1 relative z-10">
                            <span className="text-xl font-mono font-bold text-purple-300">
                                +{displayedXp}
                            </span>
                        </div>
                    </div>
                </div>

                {/* CURRENCY CARD (Full Width) */}
                <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/10 flex items-center justify-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50"></div>
                    
                    <div className="flex items-center gap-3">
                        <Star size={18} className="text-amber-400 fill-amber-400 animate-pulse-slow" />
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-2xl font-mono font-bold text-amber-100">+{displayedStardust}</span>
                            <span className="text-[9px] text-amber-500/60 font-bold uppercase tracking-widest">Stardust</span>
                        </div>
                    </div>

                    {rewards.cometShards > 0 && (
                         <div className="flex items-center gap-3 border-l border-white/5 pl-8">
                            <Sparkles size={18} className="text-rose-500 fill-rose-500 animate-pulse" />
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-2xl font-mono font-bold text-rose-100">+{rewards.cometShards}</span>
                                <span className="text-[9px] text-rose-500/60 font-bold uppercase tracking-widest">Shards</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* BONUSES PILLS */}
                {rewards.bonuses.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center pt-2">
                        {rewards.bonuses.map((bonus, i) => {
                            let icon = <Sparkles size={10} className="text-amber-400" />;
                            let colorClass = "text-slate-300 border-white/5";

                            if (bonus.includes("Mercury")) {
                                icon = <Globe size={10} className="text-cyan-400" />;
                                colorClass = "text-cyan-100 border-cyan-500/20 bg-cyan-950/30";
                            }
                            if (bonus.includes("Mars")) {
                                icon = <Flame size={10} className="text-red-500" />;
                                colorClass = "text-red-100 border-red-500/20 bg-red-950/30";
                            }

                            return (
                                <div key={i} className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border shadow-sm ${colorClass}`}>
                                    {icon}
                                    {bonus}
                                </div>
                            );
                        })}
                    </div>
                )}
              </div>
            )}
            
            {/* STATS FOOTER */}
            <div className="flex justify-center gap-8 text-slate-400 font-mono mb-6 text-sm border-t border-white/5 pt-4">
                <span className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-600" /> {formatTime(timeElapsed)}
                </span>
                <span className="flex items-center gap-2">
                    <Zap size={14} className="text-slate-600" /> {mistakes} Misses
                </span>
            </div>
          </div>
        ) : (
          /* --- STATE 2: HEATMAP VIEW --- */
          <div className="mb-8 animate-in zoom-in duration-300">
            <h3 className="text-white mb-1 font-bold text-lg">Neural Heatmap</h3>
            <p className="text-[10px] text-slate-500 mb-6 uppercase tracking-widest">Red zones indicate hesitation</p>
            
            <div className="relative mx-auto w-full max-w-[260px]">
                <div className="grid grid-cols-9 gap-[1px] border border-white/10 p-1 bg-black/40 rounded-lg aspect-square shadow-inner">
                {Array.from({ length: 9 }).map((_, r) => (
                    Array.from({ length: 9 }).map((_, c) => (
                    <div 
                        key={`${r}-${c}`}
                        className="w-full h-full rounded-[2px] transition-all duration-500 hover:scale-110 hover:z-10 hover:ring-1 ring-white/50"
                        style={{ backgroundColor: getHeatColor(r, c) }}
                        title={`Cell ${r+1},${c+1}`}
                    />
                    ))
                ))}
                </div>
            </div>
          </div>
        )}
        
        {/* ACTIONS */}
        <div className="space-y-3 relative z-20">
          <Button 
            variant="primary" 
            fullWidth 
            onClick={onRetry} 
            className={`h-12 text-sm font-bold tracking-wider ${isExpedition ? 'bg-indigo-600 hover:bg-indigo-500' : ''}`}
          >
             <div className="flex items-center justify-center gap-2">
                {isExpedition ? <ArrowRight size={18} /> : <RotateCcw size={18} />}
                <span>{isExpedition ? `WARP TO SECTOR ${nextSector}` : "INITIATE NEW SEQUENCE"}</span>
             </div>
          </Button>

          <Link href={isExpedition ? "/expedition" : "/dashboard"} className="block w-full">
            <Button variant="secondary" fullWidth className="h-12 text-xs text-slate-500 hover:text-white border-transparent bg-transparent">
                <div className="flex items-center justify-center gap-2">
                    <Home size={16} />
                    <span>{isExpedition ? "Return to Loadout" : "Return to Void"}</span>
                </div>
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}