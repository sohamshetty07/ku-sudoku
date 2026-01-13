"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Crown, Medal, User as UserIcon, 
  RefreshCw, Trophy, ShieldAlert, Globe, Clock, Sparkles 
} from "lucide-react";

// --- TYPES ---
type LeaderboardEntry = {
  _id: string;
  name: string;
  image?: string;
  isDaily?: boolean; 
  progression: {
    elo: number; // Holds ELO or Time (in seconds) depending on mode
    xp: number;
  };
};

type UserRank = {
  rank: number;
  elo: number;
  isInTop10: boolean;
};

// --- HELPERS ---
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const getRankTitle = (elo: number) => {
    if (elo >= 2500) return "Voidwalker";
    if (elo >= 2000) return "Grandmaster";
    if (elo >= 1500) return "Master";
    if (elo >= 1200) return "Adept";
    return "Novice";
};

// --- COMPONENTS ---
const RankFlame = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <defs>
      <linearGradient id="rank1Gradient" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#fcd34d" />
      </linearGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
        <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path 
      fill="url(#rank1Gradient)"
      filter="url(#glow)"
      d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 10.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM12 21.75c4.97 0 9-4.03 9-9 0-1.74-.49-3.37-1.34-4.76l.01-.01a.75.75 0 0 0-1.28-.54l-.46.45A7.46 7.46 0 0 0 12 16.5a7.46 7.46 0 0 0-5.93-8.61l-.46-.45a.75.75 0 0 0-1.28.54l.01.01A10.47 10.47 0 0 0 3 12.75c0 4.97 4.03 9 9 9Z" 
    />
  </svg>
);

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [viewMode, setViewMode] = useState<'all-time' | 'daily'>('all-time');

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/leaderboard?type=${viewMode}`, { cache: 'no-store' });
      if (!res.ok) throw new Error("API Error");
      
      const data = await res.json();
      if (data.topPlayers) setLeaders(data.topPlayers);
      setUserRank(data.userRank || null);
      
    } catch (err) {
      console.error("Failed to load leaderboard", err);
      setError(true);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [viewMode]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLeaderboard();
  };

  return (
    <main className="relative min-h-screen bg-midnight text-slate-200 animate-fade-in pb-[calc(140px+env(safe-area-inset-bottom))] overflow-hidden">
      
      {/* --- BACKGROUND FX --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-20%] w-[600px] h-[600px] bg-violet-900/20 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-20%] w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-[100px]" />
          <div className="absolute top-0 left-0 w-full h-full bg-noise opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* --- HEADER --- */}
      <div className="sticky top-0 z-50 bg-midnight/80 backdrop-blur-xl border-b border-white/5 pt-[env(safe-area-inset-top)] shadow-lg shadow-black/20">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link 
                    href="/dashboard" 
                    className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all active:scale-95"
                >
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-neon-amber via-yellow-200 to-neon-amber">
                        THE APEX
                    </h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Global Rankings</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* TOGGLE SWITCH */}
                <div className="flex bg-slate-900/80 rounded-lg p-1 border border-white/10 mr-2">
                    <button 
                        onClick={() => setViewMode('all-time')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'all-time' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Globe size={14} /> <span className="hidden sm:inline">Global</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('daily')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'daily' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Clock size={14} /> <span className="hidden sm:inline">Daily</span>
                    </button>
                </div>
                
                <button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={20} />
                </button>
            </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="relative z-10 max-w-xl mx-auto px-4 py-8 space-y-3">
        
        {/* ERROR STATE */}
        {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-4 rounded-full bg-neon-red/10 text-neon-red">
                    <ShieldAlert size={32} />
                </div>
                <div>
                    <p className="text-white font-bold">Signal Lost</p>
                    <p className="text-sm text-slate-500">Could not retrieve rankings from the void.</p>
                </div>
                <button onClick={handleRefresh} className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold transition-colors">
                    Retry Connection
                </button>
            </div>
        )}

        {/* LOADING SKELETON */}
        {loading && (
            <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-white/10" />
                            <div className="space-y-2">
                                <div className="w-24 h-3 rounded bg-white/10" />
                                <div className="w-12 h-2 rounded bg-white/5" />
                            </div>
                        </div>
                        <div className="w-10 h-5 rounded bg-white/10" />
                    </div>
                ))}
            </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && leaders.length === 0 && (
            <div className="text-center py-20 opacity-50 flex flex-col items-center">
                <Trophy size={48} className="mb-4 text-slate-600" />
                <p className="font-mono text-lg">The Void is silent.</p>
                <p className="text-xs uppercase tracking-widest mt-1">Be the first to claim a rank.</p>
            </div>
        )}

        {/* LEADERBOARD LIST */}
        {!loading && !error && leaders.map((player, index) => {
            const rank = index + 1;
            const isRank1 = rank === 1;
            const isRank2 = rank === 2;
            const isRank3 = rank === 3;
            
            // Dynamic Styles
            let cardStyle = "bg-white/5 border-white/5 hover:bg-white/10";
            let rankColor = "text-slate-500";
            let glow = "";
            
            if (isRank1) {
                cardStyle = "bg-gradient-to-r from-neon-amber/20 to-orange-900/20 border-neon-amber/40 scale-[1.02] shadow-[0_0_30px_rgba(245,158,11,0.15)] mb-6";
                rankColor = "text-neon-amber";
                glow = "drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]";
            } else if (isRank2) {
                cardStyle = "bg-gradient-to-r from-slate-400/10 to-slate-600/5 border-slate-400/30 mb-2";
                rankColor = "text-slate-300";
            } else if (isRank3) {
                cardStyle = "bg-gradient-to-r from-orange-800/20 to-orange-900/10 border-orange-700/30 mb-2";
                rankColor = "text-orange-400";
            }

            return (
                <div 
                    key={player._id}
                    className={`
                        relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300 group
                        ${cardStyle}
                    `}
                >
                    {isRank1 && (
                        <div className="absolute top-[-10px] right-[-10px] p-2 opacity-10 pointer-events-none">
                            <Crown size={80} className="text-neon-amber rotate-12" />
                        </div>
                    )}

                    <div className="flex items-center gap-4 relative z-10">
                        {/* RANK INDICATOR */}
                        <div className={`
                            w-10 h-10 flex items-center justify-center font-mono font-bold text-xl
                            ${rankColor} ${glow}
                        `}>
                            {isRank1 ? <RankFlame className="w-8 h-8 text-neon-amber animate-pulse-slow" /> : 
                             isRank2 ? <Medal size={24} /> : 
                             isRank3 ? <Medal size={24} /> : 
                             <span className="opacity-40 text-sm">#{rank}</span>}
                        </div>
                        
                        {/* USER INFO */}
                        <div className="flex items-center gap-3">
                            <div className={`
                                w-10 h-10 rounded-full overflow-hidden border
                                ${isRank1 ? 'border-neon-amber shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'border-white/10 bg-slate-900'}
                            `}>
                                {player.image ? (
                                    <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/20">
                                        <UserIcon size={18} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className={`font-bold text-sm ${isRank1 ? 'text-amber-100' : 'text-slate-200'} tracking-wide`}>
                                    {player.name || `Seeker ${player._id.slice(-4)}`}
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    {viewMode === 'all-time' 
                                        ? getRankTitle(player.progression.elo) 
                                        : <span className="flex items-center gap-1 text-emerald-400"><Clock size={10}/> Daily Challenger</span>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SCORE */}
                    <div className="text-right relative z-10">
                        <div className={`font-mono font-bold text-lg ${isRank1 ? 'text-neon-amber' : (viewMode === 'daily' ? 'text-emerald-400' : 'text-neon-cyan')}`}>
                            {player.isDaily 
                                ? formatTime(player.progression.elo) 
                                : player.progression.elo
                            }
                        </div>
                        <div className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">
                            {viewMode === 'daily' ? 'TIME' : 'ELO'}
                        </div>
                    </div>
                </div>
            );
        })}

      </div>

      {/* --- STICKY USER RANK (If not in top 10) --- */}
      {!loading && !error && userRank && !userRank.isInTop10 && (
          <div className="fixed bottom-0 left-0 w-full z-40">
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-midnight via-midnight/90 to-transparent pointer-events-none" />
              
              <div className="relative pb-[calc(1rem+env(safe-area-inset-bottom))] px-4 pt-4">
                <div className="max-w-xl mx-auto flex items-center justify-between p-4 bg-violet-600/10 backdrop-blur-md border border-violet-500/30 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                    
                    <div className="absolute inset-0 bg-violet-500/5 animate-pulse-slow" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="flex flex-col items-center justify-center w-10">
                             <div className="text-violet-300 font-mono font-bold text-xl">#{userRank.rank}</div>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white group-hover:text-violet-200 transition-colors">
                                Your Position
                            </div>
                            <div className="text-[10px] text-violet-400/60 uppercase tracking-widest">
                                Keep Climbing
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 text-right">
                        <div className="font-mono font-bold text-white text-lg">
                            {viewMode === 'daily' ? formatTime(userRank.elo) : userRank.elo}
                        </div>
                        <div className="text-[10px] text-violet-300 uppercase font-bold tracking-widest">
                            {viewMode === 'daily' ? 'TIME' : 'ELO'}
                        </div>
                    </div>
                </div>
              </div>
          </div>
      )}

    </main>
  );
}