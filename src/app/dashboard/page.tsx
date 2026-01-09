"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import Button from "@/components/ui/Button";
// 1. IMPORT SETTINGS ICON
import { Play, Lock, Zap, Clock, Trophy, Star, Sparkles, ShoppingBag, Settings } from "lucide-react";
import RankBadge from "@/components/progression/RankBadge";
import XpProgressBar from "@/components/progression/XpProgressBar";
import RankInfoModal from "@/components/progression/RankInfoModal";

// --- NEW PREMIUM FLAME COMPONENT ---
const PremiumFlame = ({ className, isActive }: { className?: string, isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="activeFlameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="10%" stopColor="#ea580c" />
        <stop offset="90%" stopColor="#fbbf24" />
      </linearGradient>
      
      <linearGradient id="inactiveFlameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#4b5563" />
        <stop offset="100%" stopColor="#9ca3af" />
      </linearGradient>

      <filter id="innerFlameGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="blur"/>
        <feOffset dx="0" dy="0"/>
        <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"/>
        <feFlood floodColor={isActive ? "#fcd34d" : "#ffffff"} floodOpacity="0.7"/> 
        <feComposite in2="shadowDiff" operator="in"/>
        <feComposite in2="SourceGraphic" operator="over"/>
      </filter>
    </defs>

    <path 
      fill={`url(#${isActive ? 'activeFlameGradient' : 'inactiveFlameGradient'})`}
      filter="url(#innerFlameGlow)"
      d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 10.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM12 21.75c4.97 0 9-4.03 9-9 0-1.74-.49-3.37-1.34-4.76l.01-.01a.75.75 0 0 0-1.28-.54l-.46.45A7.46 7.46 0 0 0 12 16.5a7.46 7.46 0 0 0-5.93-8.61l-.46-.45a.75.75 0 0 0-1.28.54l.01.01A10.47 10.47 0 0 0 3 12.75c0 4.97 4.03 9 9 9Z" 
    />
  </svg>
);
// ------------------------------------

export default function Dashboard() {
  const {
    elo,
    xp,
    stardust,
    cometShards,
    currentStreak,
    lastPlayedDate,
    activeGame,
    themeDifficulty,
    setThemeDifficulty
  } = useStore();

  const [showRankInfo, setShowRankInfo] = useState(false);

  // LOGIC
  const isMasteryLocked = xp < 1500;
  const isShopUnlocked = xp >= 500;
  const today = new Date().toISOString().split('T')[0];
  const hasPlayedToday = lastPlayedDate === today;

  const streakFontSize = currentStreak >= 100 ? "text-base" : "text-xl";

  useEffect(() => {
    setThemeDifficulty(themeDifficulty);
  }, [themeDifficulty, setThemeDifficulty]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 animate-fade-in">
      
      <RankInfoModal 
        isOpen={showRankInfo} 
        onClose={() => setShowRankInfo(false)} 
        currentXp={xp} 
      />

      <div className="w-full max-w-md bg-glass border border-glass-border backdrop-blur-xl rounded-3xl p-6 shadow-2xl flex flex-col items-center space-y-6">

        {/* 1. IDENTITY HEADER */}
        <div className="w-full space-y-4">
            
            {/* TOP ROW: LOGO + STREAK + ACTIONS */}
            <div className="flex items-center justify-between">
                
                {/* LEFT: KU + STREAK */}
                <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-bold text-white tracking-widest font-mono">KU</h1>
                    
                    {/* THE ETERNAL EMBER */}
                    <div 
                      className={`
                        relative flex items-center justify-center w-12 h-14
                        transition-all duration-500
                        ${hasPlayedToday 
                          ? "drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse-slow" 
                          : "opacity-50 grayscale drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]"
                        }
                      `}
                      title={hasPlayedToday ? "Streak Active" : "Play a game to keep the flame alive"}
                    >
                        <PremiumFlame
                            isActive={hasPlayedToday}
                            className="absolute inset-0 w-full h-full" 
                        />
                        <span className={`
                            relative z-10 font-bold mt-1 font-mono
                            ${streakFontSize}
                            ${hasPlayedToday 
                              ? "text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]" 
                              : "text-white/70"
                            }
                        `}>
                            {currentStreak}
                        </span>
                    </div>
                </div>
                
                {/* RIGHT: SETTINGS + RANK */}
                <div className="flex items-center gap-3">
                    {/* 2. SETTINGS BUTTON */}
                    <Link href="/settings" className="group">
                        <div className="p-2 rounded-full bg-white/5 border border-white/5 text-white/40 group-hover:text-white group-hover:bg-white/10 group-hover:rotate-90 transition-all duration-500">
                            <Settings size={20} />
                        </div>
                    </Link>

                    {/* RANK BADGE */}
                    <button 
                    onClick={() => setShowRankInfo(true)}
                    className="hover:opacity-80 transition-opacity active:scale-95"
                    >
                        <RankBadge xp={xp} />
                    </button>
                </div>
            </div>
            
            {/* XP Bar */}
            <div className="relative group">
               <XpProgressBar xp={xp} />
            </div>

            {/* Stats Row - CLICKABLE */}
            <Link href="/stats" className="block w-full">
                <div className="grid grid-cols-3 gap-2 pt-2 cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 group">
                    <div className="flex flex-col items-center p-2 bg-white/5 rounded-xl border border-white/5 group-hover:bg-white/10 transition-colors">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">Skill</span>
                        <div className="flex items-center gap-1 text-neon-cyan">
                            <Trophy size={12} />
                            <span className="font-mono font-bold text-sm">{elo}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-white/5 rounded-xl border border-white/5 group-hover:bg-white/10 transition-colors">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">Dust</span>
                        <div className="flex items-center gap-1 text-amber-400">
                            <Star size={12} className="fill-current" />
                            <span className="font-mono font-bold text-sm">{stardust}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-white/5 rounded-xl border border-white/5 group-hover:bg-white/10 transition-colors">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">Shards</span>
                        <div className="flex items-center gap-1 text-rose-500">
                            <Sparkles size={12} className="fill-current" />
                            <span className="font-mono font-bold text-sm">{cometShards}</span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* SHOP BUTTON */}
            {isShopUnlocked ? (
              <Link href="/observatory" className="block w-full">
                <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 hover:border-indigo-400/40 hover:from-indigo-500/20 hover:to-purple-500/20 transition-all group">
                  <ShoppingBag size={16} className="text-indigo-400 group-hover:text-indigo-300" />
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-100/80 group-hover:text-white">
                    Visit Observatory
                  </span>
                </button>
              </Link>
            ) : (
              <div className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 opacity-50 cursor-not-allowed">
                <Lock size={16} className="text-white/40" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/40">
                  Observatory (Requires Seeker)
                </span>
              </div>
            )}
        </div>

        {/* 2. RESUME CARD */}
        {activeGame && (
          <div className="w-full animate-slide-up">
            <Link href="/game?resume=true" className="block relative overflow-hidden rounded-2xl border border-neon-cyan/30 bg-neon-cyan/5 p-4 transition-all hover:bg-neon-cyan/10 group cursor-pointer">
              <div className="absolute top-0 left-0 w-1 h-full bg-neon-cyan" />
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                     <span className="inline-block w-2 h-2 rounded-full bg-neon-cyan animate-pulse"/>
                     <h3 className="text-white font-bold text-sm uppercase tracking-wide">Session Active</h3>
                  </div>
                  <p className="text-xs text-white/50 font-mono">
                    {activeGame.difficulty} • {Math.floor(activeGame.timeElapsed / 60)}m {activeGame.timeElapsed % 60}s
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-neon-cyan/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play size={18} className="text-neon-cyan fill-current ml-1" />
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* 3. DIFFICULTY SELECTOR */}
        <div className="w-full space-y-3">
          <p className="text-xs text-white/30 font-sans uppercase tracking-widest text-center mb-2">
            Select Protocol
          </p>

          <button
            onClick={() => setThemeDifficulty('Relaxed')} 
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
              themeDifficulty === 'Relaxed' 
                ? 'bg-teal-500/10 border-teal-500 ring-1 ring-teal-500' 
                : 'bg-white/5 border-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-lg ${themeDifficulty === 'Relaxed' ? 'bg-teal-500 text-midnight' : 'bg-white/10 text-white/50'}`}>
                <Clock size={20} />
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-sm">Relaxed</div>
                <div className="text-[10px] text-white/50">Untimed • 50% XP</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setThemeDifficulty('Standard')}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
              themeDifficulty === 'Standard' 
                ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500' 
                : 'bg-white/5 border-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-lg ${themeDifficulty === 'Standard' ? 'bg-blue-500 text-midnight' : 'bg-white/10 text-white/50'}`}>
                <Zap size={20} />
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-sm">Standard</div>
                <div className="text-[10px] text-white/50">Rated • 100% XP</div>
              </div>
            </div>
            {themeDifficulty === 'Standard' && <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3B82F6]" />}
          </button>

          <button
            disabled={isMasteryLocked}
            onClick={() => !isMasteryLocked && setThemeDifficulty('Mastery')}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
              themeDifficulty === 'Mastery'
                ? 'bg-rose-500/10 border-rose-500 ring-1 ring-rose-500'
                : 'bg-white/5 border-white/5 opacity-60'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-lg ${!isMasteryLocked && themeDifficulty === 'Mastery' ? 'bg-rose-500 text-midnight' : 'bg-white/10 text-white/50'}`}>
                {isMasteryLocked ? <Lock size={20} /> : <Trophy size={20} />}
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-sm">Mastery</div>
                <div className="text-[10px] text-white/50">
                  {isMasteryLocked ? 'Requires Rank: Adept' : 'High Risk • 200% XP'}
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* 4. START BUTTON */}
        <div className="w-full pt-2">
          <Link href={`/game?mode=${themeDifficulty}`} className="block w-full">
              <Button variant="primary" fullWidth className="h-12 text-lg shadow-lg shadow-neon-cyan/20">
                Enter the Void
              </Button>
          </Link>
        </div>

        {/* DEV ONLY: CHEAT BUTTON */}
        {process.env.NODE_ENV === 'development' && (
          <button 
           onClick={() => useStore.setState({ stardust: 5000, cometShards: 100 })}
            className="text-[10px] text-white/20 hover:text-red-500 mt-4 uppercase tracking-widest"
          >
            [DEV] Inject Resources
          </button>
        )}
        
        <Link href="/" className="text-xs text-white/30 hover:text-white transition-colors pb-2">
            ← Return Home
        </Link>

      </div>
    </main>
  );
}