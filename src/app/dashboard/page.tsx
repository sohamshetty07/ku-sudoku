"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import Button from "@/components/ui/Button";
import { Trophy, Play, Lock, Zap, Clock } from "lucide-react";

export default function Dashboard() {
  const { elo, activeGame } = useStore();
  const [selectedMode, setSelectedMode] = useState<'Relaxed' | 'Standard' | 'Mastery'>('Standard');

  // Logic to lock Mastery mode
  const isMasteryLocked = elo < 1500;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-midnight p-6 space-y-10">
      
      {/* 1. Header & Elo Display */}
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-bold text-white tracking-widest">Ku</h1>
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10">
          <Trophy size={14} className="text-neon-amber" />
          <span className="text-neon-amber font-mono font-bold">{elo}</span>
          <span className="text-xs text-white/50 uppercase tracking-wider">Rating</span>
        </div>
      </div>

      {/* 2. Resume Card (Only shows if a game is saved) */}
      {activeGame && (
        <div className="w-full max-w-sm">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-glass p-6 backdrop-blur-xl transition-all hover:border-neon-cyan/50 group cursor-pointer">
            <div className="absolute top-0 left-0 w-1 h-full bg-neon-cyan" />
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white font-bold text-lg">Resume Session</h3>
                <p className="text-xs text-white/50 font-mono">
                  {activeGame.difficulty} • {Math.floor(activeGame.timeElapsed / 60)}m {activeGame.timeElapsed % 60}s
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-neon-cyan/20 flex items-center justify-center group-hover:bg-neon-cyan transition-colors">
                <Play size={14} className="text-neon-cyan group-hover:text-midnight fill-current" />
              </div>
            </div>

            {/* Mini Progress Bar based on filled cells could go here */}
            <Link href="/game?resume=true" className="absolute inset-0" />
          </div>
        </div>
      )}

      {/* 3. Difficulty Dial / Selector */}
      <div className="w-full max-w-sm space-y-4">
        <p className="text-sm text-white/40 font-sans uppercase tracking-widest text-center mb-6">
          Select Difficulty
        </p>

        {/* Relaxed */}
        <button
          onClick={() => setSelectedMode('Relaxed')}
          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
            selectedMode === 'Relaxed' 
              ? 'bg-neon-cyan/10 border-neon-cyan ring-1 ring-neon-cyan' 
              : 'bg-white/5 border-white/5 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${selectedMode === 'Relaxed' ? 'bg-neon-cyan text-midnight' : 'bg-white/10 text-white/50'}`}>
              <Clock size={18} />
            </div>
            <div className="text-left">
              <div className="text-white font-bold">Relaxed</div>
              <div className="text-[10px] text-white/50">Untimed • Unrated</div>
            </div>
          </div>
        </button>

        {/* Standard */}
        <button
          onClick={() => setSelectedMode('Standard')}
          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
            selectedMode === 'Standard' 
              ? 'bg-neon-cyan/10 border-neon-cyan ring-1 ring-neon-cyan' 
              : 'bg-white/5 border-white/5 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${selectedMode === 'Standard' ? 'bg-neon-cyan text-midnight' : 'bg-white/10 text-white/50'}`}>
              <Zap size={18} />
            </div>
            <div className="text-left">
              <div className="text-white font-bold">Standard</div>
              <div className="text-[10px] text-white/50">Rated • 3 Mistakes</div>
            </div>
          </div>
          {selectedMode === 'Standard' && <div className="h-2 w-2 rounded-full bg-neon-cyan shadow-[0_0_10px_#06B6D4]" />}
        </button>

        {/* Mastery (Locked) */}
        <button
          disabled={isMasteryLocked}
          onClick={() => !isMasteryLocked && setSelectedMode('Mastery')}
          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
            selectedMode === 'Mastery'
              ? 'bg-neon-cyan/10 border-neon-cyan ring-1 ring-neon-cyan'
              : 'bg-white/5 border-white/5 opacity-60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10 text-white/50">
              {isMasteryLocked ? <Lock size={18} /> : <Trophy size={18} />}
            </div>
            <div className="text-left">
              <div className="text-white font-bold">Mastery</div>
              <div className="text-[10px] text-white/50">
                {isMasteryLocked ? 'Requires Rating 1500+' : 'Rated • 1 Mistake'}
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* 4. Action Button */}
      <div className="w-full max-w-sm pt-4">
        {/* We pass the difficulty via query param for now, or we can use the store next */}
        <Link href={`/game?mode=${selectedMode}`}>
            <Button variant="primary" fullWidth>
            Start {selectedMode} Game
            </Button>
        </Link>
      </div>

    </main>
  );
}