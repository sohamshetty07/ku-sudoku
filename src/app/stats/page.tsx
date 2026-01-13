"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { RANKS } from "@/lib/progression/constants";
import { 
  ArrowLeft, Trophy, Clock, Target, Zap, Activity, 
  Medal, TrendingUp, Skull, Hourglass, Hash, Crown, Info, BarChart3
} from "lucide-react";

// --- HELPERS ---
const formatTime = (seconds: number | null) => {
  if (!seconds) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
};

// Calculate Grade based on Win Rate
const calculateGrade = (winRate: number, gamesPlayed: number) => {
    if (gamesPlayed < 5) return { letter: "N/A", color: "text-slate-500", glow: "shadow-none" };
    if (winRate >= 80) return { letter: "S", color: "text-amber-400", glow: "shadow-amber-500/50" };
    if (winRate >= 60) return { letter: "A", color: "text-emerald-400", glow: "shadow-emerald-500/50" };
    if (winRate >= 40) return { letter: "B", color: "text-cyan-400", glow: "shadow-cyan-500/50" };
    return { letter: "C", color: "text-slate-400", glow: "shadow-slate-500/50" };
};

// Generate Dynamic Insight
const getAnalystInsight = (winRate: number, streak: number, gamesPlayed: number) => {
    if (gamesPlayed < 5) return "Insufficient data. Complete more sectors to calibrate your neural profile.";
    if (streak > 3) return "Momentum detected. Your neural synchronization is peaking. Recommendation: Attempt 'Mastery' difficulty immediately.";
    if (winRate >= 80) return "Exceptional efficiency. Your cognitive throughput exceeds 98% of pilots. You are ready for the Void Expedition.";
    if (winRate >= 50) return "Stable performance. Error rates are within acceptable parameters. Focus on speed to increase your ELO rating.";
    return "Pattern recognition fluctuation detected. Suggest engaging 'Relaxed' protocol to reinforce core logic techniques.";
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
    const rawWinRate = gamesPlayed > 0 ? (gamesWon / gamesPlayed) * 100 : 0;
    const winRateStr = rawWinRate.toFixed(1);
    
    // Rank Progress
    const currentRankIndex = [...RANKS].reverse().findIndex(r => xp >= r.minXp);
    const currentRank = [...RANKS].reverse()[currentRankIndex] || RANKS[0];
    const nextRank = [...RANKS].reverse()[currentRankIndex - 1]; 
    
    let progress = 100;
    let xpNeeded = 0;
    if (nextRank) {
        const totalGap = nextRank.minXp - currentRank.minXp;
        const currentGap = xp - currentRank.minXp;
        progress = Math.min(100, Math.max(0, (currentGap / totalGap) * 100));
        xpNeeded = nextRank.minXp - xp;
    }

    const totalPlaytimeMinutes = gamesPlayed * 5; 
    const hours = Math.floor(totalPlaytimeMinutes / 60);
    const grade = calculateGrade(rawWinRate, gamesPlayed);
    const insight = getAnalystInsight(rawWinRate, currentStreak, gamesPlayed);

    return {
        losses,
        winRateStr,
        rawWinRate,
        currentRank,
        nextRank,
        progress,
        xpNeeded,
        hoursPlayed: hours > 0 ? `${hours}h ${(totalPlaytimeMinutes % 60)}m` : `${totalPlaytimeMinutes}m`,
        grade,
        insight
    };
  }, [gamesPlayed, gamesWon, xp, currentStreak]);

  if (!mounted) {
    return (
        <main className="min-h-screen bg-[#0F172A] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 opacity-50">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-xs font-mono text-cyan-500 uppercase tracking-widest">Accessing Archives...</div>
            </div>
        </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020408] text-slate-200 p-4 md:p-8 pb-[calc(100px+env(safe-area-inset-bottom))]">
      
      {/* 1. HEADER */}
      <header className="max-w-5xl mx-auto flex items-center gap-4 mb-8 pt-[calc(env(safe-area-inset-top)+2rem)]">
        <Link href="/dashboard" className="p-3 rounded-full bg-slate-900 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 group">
          <ArrowLeft size={20} className="text-slate-400 group-hover:text-white" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-blue-400 to-indigo-400 tracking-widest">
            NEURAL ARCHIVES
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-1 flex items-center gap-2">
            <Activity size={10} className="text-emerald-500" /> Performance Analytics
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* 2. RANK & GRADE CARD */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-6 md:p-8 shadow-2xl group">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />
            
            <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                {/* Left: Grade & Rank */}
                <div className="flex items-center gap-6">
                    {/* Dynamic Grade Box */}
                    <div className={`
                        w-20 h-20 rounded-2xl bg-slate-950 border border-white/10 flex flex-col items-center justify-center shadow-lg
                        ${stats.grade.glow} transition-shadow duration-500
                    `}>
                        <span className={`text-4xl font-black ${stats.grade.color} drop-shadow-md`}>
                            {stats.grade.letter}
                        </span>
                        <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold mt-1">Grade</span>
                    </div>
                    
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl font-bold text-white tracking-wide">
                                {stats.currentRank.title}
                            </h2>
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] text-indigo-300 font-mono uppercase tracking-wider">
                                Lvl {Math.floor(xp / 1000)}
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 max-w-sm leading-snug">
                            {stats.currentRank.benefit}
                        </p>
                    </div>
                </div>

                {/* Right: XP Stats */}
                <div className="flex flex-col justify-center w-full md:w-auto">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Experience</span>
                        <div className="text-right">
                            <span className="text-xl font-mono font-bold text-white">{Math.floor(xp).toLocaleString()}</span>
                            <span className="text-xs text-slate-500 ml-1">XP</span>
                        </div>
                    </div>
                    
                    {/* XP Bar */}
                    <div className="relative h-3 w-full md:w-64 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.progress}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 via-cyan-500 to-emerald-400"
                        />
                    </div>
                    
                    <div className="mt-2 text-right">
                        {stats.nextRank ? (
                            <span className="text-[10px] text-indigo-400 font-mono">
                                {stats.xpNeeded} XP to <span className="text-white font-bold">{stats.nextRank.title}</span>
                            </span>
                        ) : (
                            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Max Rank Achieved</span>
                        )}
                    </div>
                </div>
            </div>
        </section>

        {/* 3. KPI GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={<Target size={20} />} 
            label="Win Efficiency" 
            value={`${stats.winRateStr}%`} 
            color="text-emerald-400" 
            borderColor="border-emerald-500/20"
            subContent={
                <div className="mt-3">
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                        <div style={{ width: `${stats.rawWinRate}%` }} className="bg-emerald-500 h-full" />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-400">
                        <span>Win Rate</span>
                        <span><strong className="text-white">{gamesWon}</strong> / {gamesPlayed} Games</span>
                    </div>
                </div>
            }
          />
          <StatCard 
            icon={<Activity size={20} />} 
            label="Skill Rating" 
            value={elo} 
            color="text-cyan-400" 
            borderColor="border-cyan-500/20"
            subContent={<span className="text-[10px] text-slate-500 mt-1 block">Global ELO System</span>}
          />
          <StatCard 
            icon={<Zap size={20} />} 
            label="Active Streak" 
            value={currentStreak} 
            color="text-amber-400" 
            borderColor="border-amber-500/20"
            subContent={<span className="text-[10px] text-amber-500/60 mt-1 block">Keep the momentum</span>}
          />
          <StatCard 
            icon={<Hourglass size={20} />} 
            label="Total Playtime" 
            value={stats.hoursPlayed} 
            color="text-indigo-400" 
            borderColor="border-indigo-500/20"
            subContent={<span className="text-[10px] text-slate-500 mt-1 block">Cumulative flight time</span>}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 4. COMBAT RECORD */}
            <section className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col h-full">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Hash size={14} /> Combat Record
               </h3>
               
               <div className="space-y-4 flex-1">
                  <RecordRow icon={Trophy} label="Victories" value={gamesWon} color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" />
                  <RecordRow icon={Skull} label="Defeats" value={stats.losses} color="text-red-400" bg="bg-red-500/10" border="border-red-500/20" />
                  <RecordRow icon={Medal} label="Flawless" value={flawlessWins} color="text-amber-400" bg="bg-amber-500/10" border="border-amber-500/20" />
               </div>
            </section>

            {/* 5. MASTERY & INSIGHT */}
            <div className="md:col-span-2 flex flex-col gap-6">
                
                {/* Mastery Badges */}
                <section className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Clock size={14} /> Protocol Mastery (Best Times)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <MasteryCard label="Relaxed" time={bestTimes.Relaxed} color="cyan" desc="Casual synchronization." />
                        <MasteryCard label="Standard" time={bestTimes.Standard} color="blue" desc="Standard operating procedure." />
                        <MasteryCard label="Mastery" time={bestTimes.Mastery} color="rose" desc="Elite cognitive performance." />
                    </div>
                </section>

                {/* Tactical Assessment */}
                <section className="flex-1 p-5 rounded-3xl bg-gradient-to-r from-indigo-900/10 to-slate-900/40 border border-indigo-500/20 flex items-start gap-5">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 shrink-0 border border-indigo-500/20">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-2 flex items-center gap-2">
                            System Analysis <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                            {stats.insight}
                        </p>
                    </div>
                </section>

            </div>
        </div>

      </div>
    </main>
  );
}

// --- SUBCOMPONENTS ---

function StatCard({ icon, label, value, color, borderColor, subContent }: any) {
  return (
    <div className={`
      relative overflow-hidden rounded-2xl p-5 border bg-slate-900/40 backdrop-blur-sm
      transition-all duration-300 hover:bg-slate-800/60 hover:-translate-y-1
      ${borderColor}
    `}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-black/30 ${color}`}>
            {icon}
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      
      <div className="text-3xl font-mono font-bold text-white tracking-tight">
          {value}
      </div>
      
      {subContent}
    </div>
  );
}

function RecordRow({ icon: Icon, label, value, color, bg, border }: any) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors hover:bg-white/5 ${bg} ${border}`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-black/20 ${color}`}><Icon size={16} /></div>
                <span className="text-sm font-bold text-slate-200">{label}</span>
            </div>
            <span className={`text-lg font-mono font-bold ${color}`}>{value}</span>
        </div>
    )
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
            relative p-4 rounded-xl border transition-all duration-500 overflow-hidden group
            ${hasRecord 
                ? `bg-gradient-to-br ${activeColor} shadow-lg` 
                : "bg-slate-900/50 border-white/5 grayscale opacity-60"
            }
        `}>
            <div className="flex justify-between items-start mb-4">
                <span className={`text-xs font-bold uppercase tracking-widest ${hasRecord ? 'text-white' : 'text-slate-500'}`}>
                    {label}
                </span>
                {hasRecord ? <Medal size={16} className="fill-current" /> : <Crown size={14} className="opacity-20" />}
            </div>

            <div className="text-2xl font-mono font-bold text-white mb-1">
                {formatTime(time)}
            </div>
            
            <div className="text-[10px] text-white/50 leading-tight">
                {desc}
            </div>
            
            {hasRecord && <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingUp size={40} /></div>}
        </div>
    );
}