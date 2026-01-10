"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { ArrowLeft, Trophy, Clock, Target, Zap, Activity, Medal } from "lucide-react";

// Helper: Format seconds into MMm SSs (e.g., "01m 30s")
const formatTime = (seconds: number | null) => {
  if (seconds === null) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
};

export default function StatsPage() {
  // 1. HYDRATION FIX: Wait for mount before showing data
  const [mounted, setMounted] = useState(false);
  
  const { 
    gamesPlayed, 
    gamesWon, 
    flawlessWins, 
    bestTimes, 
    elo, 
    currentStreak 
  } = useStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  // 2. LOADING STATE (Prevents hydration mismatch/flicker)
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
        min-h-screen bg-[#0F172A] text-slate-200 animate-fade-in 
        p-4 md:p-8 
        /* Safe Area Bottom + Nav Spacing */
        pb-[calc(100px+env(safe-area-inset-bottom))]
      "
    >
      
      {/* HEADER FIX: 
          We use calc() to add the Notch Height (env) + 2rem of aesthetic spacing.
          This ensures it NEVER hides behind the camera.
      */}
      <div className="
        max-w-4xl mx-auto flex items-center gap-4 mb-8 
        pt-[calc(env(safe-area-inset-top)+2rem)]
      ">
        <Link 
          href="/dashboard" 
          className="p-3 rounded-full bg-slate-800/50 hover:bg-slate-700 hover:text-white transition-all active:scale-95"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft size={24} className="text-slate-400" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-widest">
            NEURAL ARCHIVES
          </h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">
            Lifetime Performance
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* 1. OVERVIEW GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={<Target size={20} />} 
            label="Win Rate" 
            value={`${winRate}%`} 
            subValue={`${gamesWon}/${gamesPlayed} Won`}
            color="text-neon-cyan" 
            bg="bg-cyan-500/10"
            border="border-cyan-500/20"
          />
          <StatCard 
            icon={<Zap size={20} />} 
            label="Current Streak" 
            value={currentStreak} 
            subValue="Daily Consistency"
            color="text-orange-400" 
            bg="bg-orange-500/10"
            border="border-orange-500/20"
          />
          <StatCard 
            icon={<Activity size={20} />} 
            label="Skill Rating" 
            value={elo} 
            subValue="ELO System"
            color="text-purple-400" 
            bg="bg-purple-500/10"
            border="border-purple-500/20"
          />
          <StatCard 
            icon={<Medal size={20} />} 
            label="Flawless" 
            value={flawlessWins} 
            subValue="Perfect Games"
            color="text-amber-400" 
            bg="bg-amber-500/10"
            border="border-amber-500/20"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 2. SPEED RECORDS */}
            <section className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col h-full shadow-xl">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Clock size={14} /> Best Times
              </h2>
              
              <div className="space-y-4 flex-1 flex flex-col justify-center">
                <RecordRow label="Relaxed" time={bestTimes.Relaxed} color="bg-teal-400" />
                <RecordRow label="Standard" time={bestTimes.Standard} color="bg-blue-500" />
                <RecordRow label="Mastery" time={bestTimes.Mastery} color="bg-rose-500" />
              </div>
            </section>

            {/* 3. RANK ANALYSIS */}
            <section className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col h-full shadow-xl">
               <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Trophy size={14} /> Performance Analysis
              </h2>

              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                 {gamesPlayed > 0 ? (
                    <>
                        <div className="text-5xl font-mono font-bold text-white mb-2">
                            {winRate >= 80 ? "S" : winRate >= 60 ? "A" : winRate >= 40 ? "B" : "C"}
                        </div>
                        <div className="text-sm text-slate-400">
                             Overall Grade
                        </div>
                        <div className="text-xs text-slate-600 max-w-[200px] mt-2">
                             Based on your {winRate}% win rate across all difficulties.
                        </div>
                    </>
                 ) : (
                    <div className="text-slate-600 text-sm">No data available yet.</div>
                 )}
              </div>
            </section>
        </div>

      </div>
    </main>
  );
}

// --- ROBUST SUBCOMPONENTS ---

function StatCard({ icon, label, value, subValue, color, bg, border }: any) {
  return (
    <div className={`
      relative overflow-hidden rounded-2xl p-5 border transition-all duration-300
      hover:scale-[1.02] hover:bg-opacity-20
      bg-slate-900/40 backdrop-blur-sm
      ${border}
    `}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${bg} ${color}`}>
            {icon}
        </div>
      </div>
      
      <div>
        <div className="text-2xl md:text-3xl font-mono font-bold text-white tracking-tight">
            {value}
        </div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
            {label}
        </div>
        <div className="text-[10px] text-slate-600 mt-1 font-mono">
            {subValue}
        </div>
      </div>
    </div>
  );
}

function RecordRow({ label, time, color }: any) {
  return (
    <div className="flex items-center justify-between group p-3 rounded-xl hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-1.5 h-8 rounded-full ${color} shadow-[0_0_10px_currentColor] opacity-80`} />
        <div>
             <span className="block text-sm font-bold text-slate-300">{label}</span>
             <span className="text-[10px] text-slate-600 uppercase tracking-wider font-bold">Protocol</span>
        </div>
      </div>
      <div className={`font-mono text-lg group-hover:text-white transition-colors ${time ? 'text-slate-200' : 'text-slate-700'}`}>
        {formatTime(time)}
      </div>
    </div>
  );
}