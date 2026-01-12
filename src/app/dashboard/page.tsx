"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import { 
  Play, Lock, Zap, Clock, Trophy, Star, Sparkles, 
  Settings, AlertCircle, Telescope, Palette, Globe 
} from "lucide-react";
import RankBadge from "@/components/progression/RankBadge";
import XpProgressBar from "@/components/progression/XpProgressBar";
import RankInfoModal from "@/components/progression/RankInfoModal";

// --- COMPONENTS (Unchanged) ---
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

const StatSkeleton = () => (
  <div className="animate-pulse bg-white/5 rounded-md h-5 w-12" />
);

export default function Dashboard() {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  const {
    elo,
    xp,
    stardust,
    cometShards,
    currentStreak,
    lastPlayedDate,
    activeGame,
    themeDifficulty,
    setThemeDifficulty,
    pushSync
  } = useStore();

  const [showRankInfo, setShowRankInfo] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Daily Completion State
  // Default to LOADING (true) to prevent click-through exploits
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [isDailyLoading, setIsDailyLoading] = useState(true);

  // LOGIC
  const isMasteryLocked = xp < 1500;
  const isShopUnlocked = xp >= 500; 
  const isGalaxyUnlocked = true; 

  const today = new Date().toISOString().split('T')[0];
  const hasPlayedToday = lastPlayedDate === today;
  const streakFontSize = currentStreak >= 100 ? "text-base" : "text-xl";

  // --- MOUNT & SYNC LOGIC ---
  useEffect(() => {
    setMounted(true);
    
    // 1. Sync on Focus
    const onFocus = () => {
      if (isLoggedIn) {
         pushSync();
      }
    };

    window.addEventListener("focus", onFocus);

    // 2. [UPDATED] Check Real Daily Status Robustly
    if (status === 'loading') {
       // Do nothing, wait for auth to settle. 
       // isDailyLoading defaults to true, so UI is safe.
    } else if (isLoggedIn) {
      // User is authenticated, check server
      fetch('/api/daily/status')
        .then((res) => res.json())
        .then((data) => {
          if (data.completed) {
            setDailyCompleted(true);
          }
        })
        .catch((err) => console.error("Failed to check daily status:", err))
        .finally(() => setIsDailyLoading(false));
    } else {
       // Not logged in, stop loading (allow default behavior or login redirect flow)
       setIsDailyLoading(false);
    }

    return () => window.removeEventListener("focus", onFocus);
  }, [pushSync, isLoggedIn, status]);

  return (
    <main 
      className="
        relative w-full h-screen overflow-y-auto overflow-x-hidden
        flex flex-col items-center 
        p-4 pb-24
        bg-[#0F172A]
        pt-[max(2rem,env(safe-area-inset-top))]
        animate-fade-in
      "
    >
      
      <RankInfoModal 
        isOpen={showRankInfo} 
        onClose={() => setShowRankInfo(false)} 
        currentXp={xp} 
      />

      <div className="w-full max-w-md bg-white/5 border border-white/5 backdrop-blur-xl rounded-3xl p-6 shadow-2xl flex flex-col items-center space-y-6 mb-safe">

        {/* 1. IDENTITY HEADER */}
        <div className="w-full space-y-4">
            
            {/* TOP ROW */}
            <div className="flex items-center justify-between">
                
                {/* LEFT: KU + STREAK */}
                <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-bold text-white tracking-widest font-mono">KU</h1>
                    
                    <div 
                      className={`
                        relative flex items-center justify-center w-12 h-14
                        transition-all duration-500
                        ${hasPlayedToday 
                          ? "drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse-slow scale-105" 
                          : "opacity-50 grayscale drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]"
                        }
                      `}
                      title={hasPlayedToday ? "Streak Active" : "Play a game to keep the flame alive"}
                    >
                        <PremiumFlame
                            isActive={mounted && hasPlayedToday}
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
                            {mounted ? currentStreak : "-"}
                        </span>
                    </div>
                </div>
                
                {/* RIGHT: SETTINGS + LEADERBOARD + RANK */}
                <div className="flex items-center gap-3">
                    <Link href="/settings" className="group">
                        <div className="p-2.5 rounded-full bg-white/5 border border-white/5 text-white/40 group-hover:text-white group-hover:bg-white/10 group-hover:rotate-90 transition-all duration-500">
                            <Settings size={20} />
                        </div>
                    </Link>

                    <Link href="/leaderboard" className="group">
                        <div className="p-2.5 rounded-full bg-white/5 border border-white/5 text-amber-400/60 group-hover:text-amber-400 group-hover:bg-amber-400/10 transition-all duration-500">
                            <Trophy size={20} />
                        </div>
                    </Link>

                    <button 
                      onClick={() => setShowRankInfo(true)}
                      className="hover:opacity-80 transition-opacity active:scale-95"
                    >
                        <RankBadge xp={mounted ? xp : 0} />
                    </button>
                </div>
            </div>
            
            {/* XP Bar */}
            <div className="relative group">
               <XpProgressBar xp={mounted ? xp : 0} />
            </div>

            {/* Stats Row */}
            <Link href="/stats" className="block w-full">
                <div className="grid grid-cols-3 gap-2 pt-2 cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 group">
                    <div className="flex flex-col items-center p-2 bg-white/5 rounded-xl border border-white/5 group-hover:bg-white/10 transition-colors">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">Skill</span>
                        <div className="flex items-center gap-1 text-neon-cyan">
                            <Trophy size={12} />
                            <span className="font-mono font-bold text-sm">
                              {mounted ? elo : <StatSkeleton />}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-white/5 rounded-xl border border-white/5 group-hover:bg-white/10 transition-colors">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">Dust</span>
                        <div className="flex items-center gap-1 text-amber-400">
                            <Star size={12} className="fill-current" />
                            <span className="font-mono font-bold text-sm">
                              {mounted ? stardust : <StatSkeleton />}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-white/5 rounded-xl border border-white/5 group-hover:bg-white/10 transition-colors">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">Shards</span>
                        <div className="flex items-center gap-1 text-rose-500">
                            <Sparkles size={12} className="fill-current" />
                            <span className="font-mono font-bold text-sm">
                              {mounted ? cometShards : <StatSkeleton />}
                            </span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* 2. THE META-HUB (Split: Shop vs Map) */}
            <div className="grid grid-cols-2 gap-3 w-full pt-1">
                {mounted && isShopUnlocked ? (
                  <Link href="/observatory" className="block w-full">
                    <button className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-900/10 border border-indigo-500/20 hover:border-indigo-400/40 hover:from-indigo-500/20 hover:to-purple-900/20 transition-all group">
                      <Palette size={20} className="text-indigo-400 group-hover:text-indigo-300 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-100/80 group-hover:text-white">
                        Themes
                      </span>
                    </button>
                  </Link>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 opacity-50 cursor-not-allowed">
                    <Lock size={16} className="text-white/40" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                        Themes <br/>
                    </span>
                  </div>
                )}

                {mounted && isGalaxyUnlocked ? (
                  <Link href="/astral" className="block w-full">
                    <button className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-900/10 border border-cyan-500/20 hover:border-cyan-400/40 hover:from-cyan-500/20 hover:to-blue-900/20 transition-all group">
                      <Telescope size={20} className="text-cyan-400 group-hover:text-cyan-300 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-100/80 group-hover:text-white">
                        Galaxy Map
                      </span>
                    </button>
                  </Link>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 opacity-50 cursor-not-allowed">
                    <Lock size={16} className="text-white/40" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Galaxy</span>
                  </div>
                )}
            </div>
            
        </div>

        {/* 3. RESUME CARD (Session Protection) */}
        {mounted && activeGame && (
          <div className="w-full animate-slide-up space-y-2">
            <Link href="/game?resume=true" className="block relative overflow-hidden rounded-2xl border border-neon-cyan/50 bg-neon-cyan/10 p-4 transition-all hover:bg-neon-cyan/20 group cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.1)] hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]">
              <div className="absolute top-0 left-0 w-1 h-full bg-neon-cyan shadow-[0_0_10px_#22d3ee]" />
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                     <span className="inline-block w-2 h-2 rounded-full bg-neon-cyan animate-pulse"/>
                     <h3 className="text-white font-bold text-sm uppercase tracking-wide">Resume Protocol</h3>
                  </div>
                  <p className="text-xs text-cyan-200/60 font-mono">
                    {activeGame.difficulty} • {Math.floor(activeGame.timeElapsed / 60)}m {activeGame.timeElapsed % 60}s
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-neon-cyan/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play size={20} className="text-neon-cyan fill-current ml-1" />
                </div>
              </div>
            </Link>
            
            <div className="flex items-center gap-2 py-2 opacity-50">
               <div className="h-px bg-white/10 flex-1"/>
               <span className="text-[10px] text-white/40 uppercase tracking-widest">OR</span>
               <div className="h-px bg-white/10 flex-1"/>
            </div>
          </div>
        )}

        {/* 4. DAILY CHALLENGE CARD */}
        <div className="w-full">
            {isDailyLoading ? (
                 /* LOADING STATE */
                 <div className="block relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-4 animate-pulse select-none cursor-wait">
                    <div className="flex items-center justify-between opacity-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-white/10">
                                <Globe size={20} className="text-white/20" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="h-3 w-24 bg-white/10 rounded" />
                                <div className="h-2 w-16 bg-white/5 rounded" />
                            </div>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-white/5" />
                    </div>
                </div>
            ) : dailyCompleted ? (
                 /* COMPLETED STATE (Locked) */
                 <div className="block relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-900/10 p-4 opacity-75 cursor-default">
                    <div className="flex items-center justify-between opacity-80">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400">
                                <Clock size={20} />
                            </div>
                            <div>
                                <h3 className="text-emerald-100 font-bold text-sm uppercase tracking-wide line-through decoration-emerald-500/50">Daily Challenge</h3>
                                <p className="text-[10px] text-emerald-200/60 uppercase tracking-widest">Completed</p>
                            </div>
                        </div>
                        <div className="px-3 py-1 bg-emerald-500/20 rounded-full text-xs font-mono font-bold text-emerald-400">
                            DONE
                        </div>
                    </div>
                </div>
            ) : (
                /* ACTIVE STATE */
                <Link href="/game?mode=Daily" className="block relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-900/10 p-4 transition-all hover:bg-emerald-900/20 group cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                                <Globe size={20} className="animate-spin-slow" />
                            </div>
                            <div>
                                <h3 className="text-emerald-100 font-bold text-sm uppercase tracking-wide group-hover:text-emerald-50 transition-colors">Daily Challenge</h3>
                                <p className="text-[10px] text-emerald-200/60 uppercase tracking-widest group-hover:text-emerald-200/80">Compete Globally</p>
                            </div>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <Play size={14} className="fill-current ml-0.5" />
                        </div>
                    </div>
                </Link>
            )}
        </div>

        {/* 5. DIFFICULTY SELECTOR */}
        <div className="w-full space-y-3 mt-4">
          <p className="text-xs text-white/30 font-sans uppercase tracking-widest text-center mb-2">
            Initialize Standard Protocol
          </p>

          <button
            onClick={() => setThemeDifficulty('Relaxed')} 
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
              mounted && themeDifficulty === 'Relaxed' 
                ? 'bg-teal-500/10 border-teal-500 ring-1 ring-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.1)]' 
                : 'bg-white/5 border-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-lg ${mounted && themeDifficulty === 'Relaxed' ? 'bg-teal-500 text-midnight' : 'bg-white/10 text-white/50'}`}>
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
              mounted && themeDifficulty === 'Standard' 
                ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                : 'bg-white/5 border-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-lg ${mounted && themeDifficulty === 'Standard' ? 'bg-blue-500 text-midnight' : 'bg-white/10 text-white/50'}`}>
                <Zap size={20} />
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-sm">Standard</div>
                <div className="text-[10px] text-white/50">Rated • 100% XP</div>
              </div>
            </div>
            {mounted && themeDifficulty === 'Standard' && <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3B82F6]" />}
          </button>

          <button
            disabled={!mounted || isMasteryLocked}
            onClick={() => mounted && !isMasteryLocked && setThemeDifficulty('Mastery')}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
              mounted && themeDifficulty === 'Mastery'
                ? 'bg-rose-500/10 border-rose-500 ring-1 ring-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                : 'bg-white/5 border-white/5 opacity-60'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-lg ${mounted && !isMasteryLocked && themeDifficulty === 'Mastery' ? 'bg-rose-500 text-midnight' : 'bg-white/10 text-white/50'}`}>
                {mounted && isMasteryLocked ? <Lock size={20} /> : <Trophy size={20} />}
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-sm">Mastery</div>
                <div className="text-[10px] text-white/50">
                  {mounted && isMasteryLocked ? 'Requires Rank: Adept' : 'High Risk • 200% XP'}
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* 6. START BUTTON (With Warnings) */}
        <div className="w-full pt-2">
          <Link href={`/game?mode=${themeDifficulty}`} className="block w-full">
              <Button 
                variant={mounted && activeGame ? "secondary" : "primary"} 
                fullWidth 
                className={`h-12 text-lg ${mounted && activeGame ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'shadow-lg shadow-neon-cyan/20'}`}
              >
                {mounted && activeGame ? "Start New (Overwrite)" : "Enter the Void"}
              </Button>
          </Link>
          
          {mounted && activeGame && (
             <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-red-400/60 font-mono">
                <AlertCircle size={10} />
                <span>Warning: Starting new game clears active session</span>
             </div>
          )}
        </div>

        {mounted && process.env.NODE_ENV === 'development' && (
          <button 
           onClick={() => useStore.setState({ stardust: 20000, cometShards: 100 })}
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