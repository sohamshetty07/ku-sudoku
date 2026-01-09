"use client";
import React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { ArrowLeft, Trophy, Clock, Target, Zap, Activity } from "lucide-react";

const formatTime = (seconds: number | null) => {
  if (seconds === null) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

export default function StatsPage() {
  const { 
    gamesPlayed, 
    gamesWon, 
    flawlessWins, 
    bestTimes, 
    elo, 
    currentStreak 
  } = useStore();

  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#0F172A] p-4 md:p-8 animate-fade-in pb-20">
      
      {/* HEADER */}
      <div className="max-w-2xl mx-auto flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
          <ArrowLeft size={24} className="text-white/70" />
        </Link>
        <h1 className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-widest">
          NEURAL ARCHIVES
        </h1>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* 1. OVERVIEW GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Trophy size={16} />} label="Win Rate" value={`${winRate}%`} color="text-neon-cyan" />
          <StatCard icon={<Target size={16} />} label="Games" value={gamesPlayed} color="text-white" />
          <StatCard icon={<Zap size={16} />} label="Streak" value={currentStreak} color="text-orange-500" />
          <StatCard icon={<Activity size={16} />} label="Skill" value={elo} color="text-purple-400" />
        </div>

        {/* 2. SPEED RECORDS */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Clock size={14} /> Temporal Records (Best Times)
          </h2>
          
          <div className="space-y-4">
            <RecordRow label="Relaxed" time={bestTimes.Relaxed} color="bg-teal-500" />
            <RecordRow label="Standard" time={bestTimes.Standard} color="bg-blue-500" />
            <RecordRow label="Mastery" time={bestTimes.Mastery} color="bg-rose-500" />
          </div>
        </div>

        {/* 3. PERFECTION METRIC */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <div className="text-amber-400 font-bold text-lg mb-1">Flawless Victories</div>
            <div className="text-white/50 text-xs">Games won with 0 mistakes</div>
          </div>
          <div className="text-4xl font-mono font-bold text-amber-500">
            {flawlessWins}
          </div>
        </div>

      </div>
    </main>
  );
}

// --- SUBCOMPONENTS ---

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
      <div className={`p-2 rounded-full bg-white/5 ${color}`}>{icon}</div>
      <div className="text-2xl font-mono font-bold text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-white/40">{label}</div>
    </div>
  );
}

function RecordRow({ label, time, color }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${color} shadow-[0_0_8px_currentColor]`} />
        <span className="text-sm font-medium text-white/80">{label}</span>
      </div>
      <div className="font-mono text-xl text-white group-hover:text-neon-cyan transition-colors">
        {formatTime(time)}
      </div>
    </div>
  );
}