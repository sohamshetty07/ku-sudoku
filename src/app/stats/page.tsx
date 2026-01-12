"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { RANKS } from "@/lib/progression/constants";
import { 
  ArrowLeft, Trophy, Clock, Target, Zap, Activity, 
  Medal, TrendingUp, Skull, Hourglass, Hash, Crown 
} from "lucide-react";

// --- HELPERS ---
const formatTime = (seconds: number | null) => {
  if (!seconds) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
};

export default function StatsPage() {
  const [mounted, setMounted] = useState(false);
  
  const { 
    gamesPlayed, 
    gamesWon, 
    flawlessWins, 
    bestTimes, 
    elo, 
    xp,
    currentStreak 
  } = useStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- DERIVED ANALYTICS ---
  const stats = useMemo(() => {
    const losses = gamesPlayed - gamesWon;
    const winRate = gamesPlayed > 0 ? ((gamesWon / gamesPlayed) * 100).toFixed(1) : "0.0";
    
    // Calculate Rank Progress
    const currentRankIndex = [...RANKS].reverse().findIndex(r => xp >= r.minXp);
    const currentRank = [...RANKS].reverse()[currentRankIndex] || RANKS[0];
    const nextRank = [...RANKS].reverse()[currentRankIndex - 1]; // Reverse logic because we reversed array
    
    // Progress to next rank
    let progress = 100;
    let xpNeeded = 0;
    if (nextRank) {
        const totalGap = nextRank.minXp - currentRank.minXp;
        const currentGap = xp - currentRank.minXp;
        progress = Math.min(100, Math.max(0, (currentGap / totalGap) * 100));
        xpNeeded = nextRank.minXp - xp;
    }

    // Est. Playtime (Avg 5 mins per game approx)
    const totalPlaytimeMinutes = gamesPlayed * 5; 
    const hours = Math.floor(totalPlaytimeMinutes / 60);
    
    return {
        losses,
        winRate,
        currentRank,
        nextRank,
        progress,
        xpNeeded,
        hoursPlayed: hours > 0 ? `${hours}h ${(totalPlaytimeMinutes % 60)}m` : `${totalPlaytimeMinutes}m`
    };
  }, [gamesPlayed, gamesWon, xp]);

  // --- LOADING STATE ---
  if (!mounted) {
    return (
        <main className="min-h-screen bg-[#0F172A] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 opacity-50">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-xs font-mono text-cyan-500 uppercase tracking-widest">
                    Accessing Archives...
                </div>
            </div>
        </main>
    );
  }

  return (
    <main 
      className="
        min-h-screen bg-[#020408] text-slate-200 
        p-4 md:p-8 pb-[calc(100px+env(safe-area-inset-bottom))]
      "
    >
      
      {/* 1. HEADER */}
      <header className="max-w-5xl mx-auto flex items-center gap-4 mb-8 pt-[calc(env(safe-area-inset-top)+2rem)]">
        <Link 
          href="/dashboard" 
          className="p-3 rounded-full bg-slate-900 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 group"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft size={20} className="text-slate-400 group-hover:text-white" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-blue-400 to-indigo-400 tracking-widest">
            NEURAL ARCHIVES
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-1 flex items-center gap-2">
            <Activity size={10} className="text-emerald-500" />
            Performance Analytics
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* 2. RANK PROGRESSION CARD */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                        <Crown size={18} className="text-amber-400" />
                        {stats.currentRank.title}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">Current Clearance Level</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-white tracking-tighter">
                        {Math.floor(xp).toLocaleString()} <span className="text-sm text-slate-500">XP</span>
                    </div>
                    {stats.nextRank && (
                        <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-wide">
                            {stats.xpNeeded} XP to {stats.nextRank.title}
                        </p>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-4 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 via-cyan-500 to-emerald-400"
                />
                {/* Scanline Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] w-full h-full animate-shimmer" />
            </div>
        </section>

        {/* 3. KPI GRID (Stats at a glance) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={<Target size={20} />} 
            label="Win Ratio" 
            value={`${stats.winRate}%`} 
            color="text-emerald-400" 
            borderColor="group-hover:border-emerald-500/30"
            subContent={
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden flex">
                    <div style={{ width: `${stats.winRate}%` }} className="bg-emerald-500 h-full" />
                </div>
            }
          />
          <StatCard 
            icon={<Activity size={20} />} 
            label="Skill Rating" 
            value={elo} 
            color="text-cyan-400" 
            borderColor="group-hover:border-cyan-500/30"
            subContent={<span className="text-[10px] text-slate-500">Global ELO System</span>}
          />
          <StatCard 
            icon={<Zap size={20} />} 
            label="Active Streak" 
            value={currentStreak} 
            color="text-amber-400" 
            borderColor="group-hover:border-amber-500/30"
            subContent={<span className="text-[10px] text-amber-500/60">Keep the momentum</span>}
          />
          <StatCard 
            icon={<Hourglass size={20} />} 
            label="Total Playtime" 
            value={stats.hoursPlayed} 
            color="text-indigo-400" 
            borderColor="group-hover:border-indigo-500/30"
            subContent={<span className="text-[10px] text-slate-500">Estimated duration</span>}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 4. COMBAT RECORD (Detailed Breakdown) */}
            <section className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col justify-between h-full">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Hash size={14} /> Combat Record
               </h3>
               
               <div className="space-y-6">
                  {/* Wins */}
                  <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><Trophy size={18} /></div>
                          <span className="text-sm font-bold text-emerald-100">Victories</span>
                      </div>
                      <span className="text-xl font-mono font-bold text-emerald-400">{gamesWon}</span>
                  </div>

                  {/* Losses */}
                  <div className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-500/10 rounded-lg text-red-400"><Skull size={18} /></div>
                          <span className="text-sm font-bold text-red-100">Defeats</span>
                      </div>
                      <span className="text-xl font-mono font-bold text-red-400">{stats.losses}</span>
                  </div>

                   {/* Flawless */}
                   <div className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400"><Medal size={18} /></div>
                          <span className="text-sm font-bold text-amber-100">Flawless</span>
                      </div>
                      <span className="text-xl font-mono font-bold text-amber-400">{flawlessWins}</span>
                  </div>
               </div>
            </section>

            {/* 5. MODE MASTERY (Badges) */}
            <section className="md:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Clock size={14} /> Protocol Mastery (Best Times)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MasteryCard 
                    label="Relaxed" 
                    time={bestTimes.Relaxed} 
                    color="cyan" 
                    desc="Casual synchronization."
                />
                <MasteryCard 
                    label="Standard" 
                    time={bestTimes.Standard} 
                    color="blue" 
                    desc="Standard operating procedure."
                />
                <MasteryCard 
                    label="Mastery" 
                    time={bestTimes.Mastery} 
                    color="rose" 
                    desc="Elite cognitive performance."
                />
              </div>

              {/* Data Vis / Insight */}
              <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/5 flex items-start gap-4">
                 <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300 mt-1">
                    <TrendingUp size={20} />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-white">Analyst Insight</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        

[Image of ELO rating distribution curve]

                        <br/>
                        Your win rate of <span className="text-emerald-400">{stats.winRate}%</span> suggests 
                        {Number(stats.winRate) > 60 ? " high proficiency. Consider attempting Mastery protocols more frequently." : " room for optimization. Focus on minimizing errors in Standard mode."}
                    </p>
                 </div>
              </div>
            </section>
        </div>

      </div>
    </main>
  );
}

// --- ROBUST SUBCOMPONENTS ---

function StatCard({ icon, label, value, color, borderColor, subContent }: any) {
  return (
    <div className={`
      group relative overflow-hidden rounded-2xl p-5 border border-white/5 
      bg-gradient-to-b from-slate-800/40 to-slate-900/40 backdrop-blur-sm
      transition-all duration-300 hover:-translate-y-1 hover:border-white/10
      ${borderColor}
    `}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-black/30 ${color} group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      
      <div className="text-3xl font-mono font-bold text-white tracking-tight">
          {value}
      </div>
      
      <div className="mt-2">
          {subContent}
      </div>
    </div>
  );
}

function MasteryCard({ label, time, color, desc }: { label: string, time: number | null, color: 'cyan'|'blue'|'rose', desc: string }) {
    const hasRecord = time !== null;
    
    const colors = {
        cyan: "from-cyan-500/20 to-cyan-900/10 border-cyan-500/30 text-cyan-400",
        blue: "from-blue-500/20 to-blue-900/10 border-blue-500/30 text-blue-400",
        rose: "from-rose-500/20 to-rose-900/10 border-rose-500/30 text-rose-400",
    };

    const activeColor = colors[color];

    return (
        <div className={`
            relative p-4 rounded-xl border transition-all duration-500 overflow-hidden
            ${hasRecord 
                ? `bg-gradient-to-br ${activeColor} shadow-lg` 
                : "bg-slate-900/50 border-white/5 grayscale opacity-60"
            }
        `}>
            <div className="flex justify-between items-start mb-4">
                <span className={`text-sm font-bold uppercase tracking-widest ${hasRecord ? 'text-white' : 'text-slate-500'}`}>
                    {label}
                </span>
                {hasRecord ? <Medal size={16} className="fill-current" /> : <LockIcon />}
            </div>

            <div className="text-2xl font-mono font-bold text-white mb-1">
                {formatTime(time)}
            </div>
            
            <div className="text-[10px] text-white/50 leading-tight">
                {desc}
            </div>

            {/* Decorative Shine if unlocked */}
            {hasRecord && (
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
            )}
        </div>
    );
}

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
);