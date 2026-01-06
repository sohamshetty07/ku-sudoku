"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import Button from "@/components/ui/Button";
import { Trophy, Play, Lock, Zap, Clock } from "lucide-react";

export default function Dashboard() {
  // 1. Swap local state for Global Store state
  // This ensures the background changes immediately when clicked
  const { elo, activeGame, themeDifficulty, setThemeDifficulty } = useStore();

  // Logic to lock Mastery mode
  const isMasteryLocked = elo < 1500;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      
      {/* GLASS CONTAINER */}
      <div className="w-full max-w-md bg-glass border border-glass-border backdrop-blur-xl rounded-3xl p-8 shadow-2xl flex flex-col items-center space-y-8">

        {/* 1. Header & Elo Display */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold text-white tracking-widest font-mono">Ku</h1>
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10">
            <Trophy size={14} className="text-neon-amber" />
            <span className="text-neon-amber font-mono font-bold">{elo}</span>
            <span className="text-xs text-white/50 uppercase tracking-wider">Rating</span>
          </div>
        </div>

        {/* 2. Resume Card */}
        {activeGame && (
          <div className="w-full">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:border-neon-cyan/50 group cursor-pointer hover:bg-white/10">
              <div className="absolute top-0 left-0 w-1 h-full bg-neon-cyan" />
              
              <div className="flex justify-between items-start mb-2">
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

              <Link href="/game?resume=true" className="absolute inset-0 z-10" />
            </div>
          </div>
        )}

        {/* 3. Difficulty Dial / Selector */}
        <div className="w-full space-y-3">
          <p className="text-xs text-white/40 font-sans uppercase tracking-widest text-center mb-4">
            Select Difficulty
          </p>

          {/* Relaxed */}
          <button
            onClick={() => setThemeDifficulty('Relaxed')} // Updates Global Store -> Updates Background
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
              themeDifficulty === 'Relaxed' 
                ? 'bg-neon-cyan/10 border-neon-cyan ring-1 ring-neon-cyan' 
                : 'bg-white/5 border-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors ${themeDifficulty === 'Relaxed' ? 'bg-neon-cyan text-midnight' : 'bg-white/10 text-white/50'}`}>
                <Clock size={18} />
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-sm">Relaxed</div>
                <div className="text-[10px] text-white/50">Untimed • Unrated</div>
              </div>
            </div>
          </button>

          {/* Standard */}
          <button
            onClick={() => setThemeDifficulty('Standard')}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
              themeDifficulty === 'Standard' 
                ? 'bg-neon-cyan/10 border-neon-cyan ring-1 ring-neon-cyan' 
                : 'bg-white/5 border-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors ${themeDifficulty === 'Standard' ? 'bg-neon-cyan text-midnight' : 'bg-white/10 text-white/50'}`}>
                <Zap size={18} />
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-sm">Standard</div>
                <div className="text-[10px] text-white/50">Rated • 3 Mistakes</div>
              </div>
            </div>
            {themeDifficulty === 'Standard' && <div className="h-2 w-2 rounded-full bg-neon-cyan shadow-[0_0_10px_#06B6D4]" />}
          </button>

          {/* Mastery */}
          <button
            disabled={isMasteryLocked}
            onClick={() => !isMasteryLocked && setThemeDifficulty('Mastery')}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
              themeDifficulty === 'Mastery'
                ? 'bg-neon-cyan/10 border-neon-cyan ring-1 ring-neon-cyan'
                : 'bg-white/5 border-white/5 opacity-80'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors ${!isMasteryLocked && themeDifficulty === 'Mastery' ? 'bg-neon-cyan text-midnight' : 'bg-white/10 text-white/50'}`}>
                {isMasteryLocked ? <Lock size={18} /> : <Trophy size={18} />}
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-sm">Mastery</div>
                <div className="text-[10px] text-white/50">
                  {isMasteryLocked ? 'Requires Rating 1500+' : 'Rated • 1 Mistake'}
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* 4. Action Button */}
        <div className="w-full pt-2">
          {/* We use themeDifficulty here to start the game with the selected mode */}
          <Link href={`/game?mode=${themeDifficulty}`} className="block w-full">
              <Button variant="primary" fullWidth className="h-12 text-lg">
                Start Game
              </Button>
          </Link>
        </div>

      </div>
    </main>
  );
}