"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Crown, Medal, User as UserIcon, 
  RefreshCw, Trophy, ShieldAlert, Globe, Clock 
} from "lucide-react";

type LeaderboardEntry = {
  _id: string;
  name: string;
  image?: string;
  isDaily?: boolean; // [NEW] Flag to determine formatting
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

// [NEW] Helper to format seconds to MM:SS
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // [NEW] View Mode State
  const [viewMode, setViewMode] = useState<'all-time' | 'daily'>('all-time');

  // 1. ROBUST DATA FETCHING
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      // [UPDATED] Pass viewMode to API
      const res = await fetch(`/api/leaderboard?type=${viewMode}`, { cache: 'no-store' });
      if (!res.ok) throw new Error("API Error");
      
      const data = await res.json();
      if (data.topPlayers) setLeaders(data.topPlayers);
      
      // Handle user rank separately or null it if not present
      setUserRank(data.userRank || null);
      
    } catch (err) {
      console.error("Failed to load leaderboard", err);
      setError(true);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [viewMode]); // [UPDATED] Re-fetch when mode changes

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLeaderboard();
  };

  return (
    <main className="relative min-h-screen bg-[#0F172A] text-slate-200 animate-fade-in pb-[calc(140px+env(safe-area-inset-bottom))] overflow-hidden">
      
      {/* --- DYNAMIC BACKGROUND LAYERS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-20%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-20%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,#0F172A_100%)] opacity-80" />
      </div>

      {/* --- HEADER --- */}
      <div className="sticky top-0 z-50 bg-[#0F172A]/70 backdrop-blur-xl border-b border-white/5 pt-[env(safe-area-inset-top)] shadow-lg shadow-black/20">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link 
                    href="/dashboard" 
                    className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all active:scale-95"
                >
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">
                        THE APEX
                    </h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Global Rankings</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* [NEW] TOGGLE SWITCH */}
                <div className="flex bg-slate-800/50 rounded-lg p-1 border border-white/5 mr-2">
                    <button 
                        onClick={() => setViewMode('all-time')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'all-time' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Globe size={14} /> <span className="hidden sm:inline">Global</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('daily')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'daily' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
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
                <div className="p-4 rounded-full bg-red-500/10 text-red-400">
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

        {/* LOADING STATE */}
        {loading && (
            <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-md bg-white/10" />
                            <div className="space-y-2">
                                <div className="w-32 h-4 rounded bg-white/10" />
                                <div className="w-16 h-2 rounded bg-white/5" />
                            </div>
                        </div>
                        <div className="w-12 h-6 rounded bg-white/10" />
                    </div>
                ))}
            </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && leaders.length === 0 && (
            <div className="text-center py-20 opacity-50">
                <Trophy size={48} className="mx-auto mb-4 text-slate-600" />
                <p>The Void is silent.</p>
                <p className="text-sm">Be the first to claim a rank.</p>
            </div>
        )}

        {/* LEADERBOARD LIST */}
        {!loading && !error && leaders.map((player, index) => {
            const rank = index + 1;
            const isRank1 = rank === 1;
            const isRank2 = rank === 2;
            const isRank3 = rank === 3;
            
            // Dynamic Styles based on Rank
            let cardStyle = "bg-slate-900/40 border-white/5 hover:bg-white/5";
            let rankColor = "text-slate-500";
            let glow = "";
            
            if (isRank1) {
                cardStyle = "bg-gradient-to-r from-amber-500/20 to-amber-900/10 border-amber-500/30 scale-[1.02] shadow-[0_0_30px_rgba(245,158,11,0.15)] mb-6";
                rankColor = "text-amber-400";
                glow = "drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]";
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
                        <div className="absolute top-0 right-0 p-2 opacity-20">
                            <Crown size={64} className="text-amber-500 rotate-12" />
                        </div>
                    )}

                    <div className="flex items-center gap-4 relative z-10">
                        {/* RANK */}
                        <div className={`
                            w-10 h-10 flex items-center justify-center font-mono font-bold text-xl
                            ${rankColor} ${glow}
                        `}>
                            {isRank1 ? <Crown size={28} fill="currentColor" /> : 
                             isRank2 ? <Medal size={24} /> : 
                             isRank3 ? <Medal size={24} /> : 
                             <span className="opacity-40 text-sm">#{rank}</span>}
                        </div>
                        
                        {/* USER INFO */}
                        <div className="flex items-center gap-3">
                            <div className={`
                                w-10 h-10 rounded-full overflow-hidden border
                                ${isRank1 ? 'border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'border-white/10 bg-slate-800'}
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
                                    {/* [UPDATED] Show Rank Title only in All-Time Mode */}
                                    {viewMode === 'all-time' 
                                        ? getRankTitle(player.progression.elo) 
                                        : "Daily Challenger"
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SCORE (ELO or TIME) */}
                    <div className="text-right relative z-10">
                        <div className={`font-mono font-bold ${isRank1 ? 'text-amber-400' : (viewMode === 'daily' ? 'text-emerald-400' : 'text-neon-cyan')}`}>
                            {/* [UPDATED] Format score based on mode */}
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

      {/* --- STICKY USER RANK --- */}
      {!loading && !error && userRank && !userRank.isInTop10 && (
          <div className="fixed bottom-0 left-0 w-full z-40">
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/90 to-transparent pointer-events-none" />
              
              <div className="relative pb-[calc(1rem+env(safe-area-inset-bottom))] px-4 pt-4">
                <div className="max-w-xl mx-auto flex items-center justify-between p-4 bg-indigo-500/10 backdrop-blur-md border border-indigo-500/30 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                    
                    <div className="absolute inset-0 bg-indigo-400/5 animate-pulse-slow" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="flex flex-col items-center justify-center w-10">
                             <div className="text-indigo-400 font-mono font-bold text-lg">#{userRank.rank}</div>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                                Your Ranking
                            </div>
                            <div className="text-[10px] text-indigo-400/60 uppercase tracking-widest">
                                Current Position
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 text-right">
                        <div className="font-mono font-bold text-white text-lg">
                            {viewMode === 'daily' ? formatTime(userRank.elo) : userRank.elo}
                        </div>
                        <div className="text-[10px] text-indigo-300 uppercase font-bold tracking-widest">
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

// Helper for Rank Titles
function getRankTitle(elo: number) {
    if (elo >= 2500) return "Voidwalker";
    if (elo >= 2000) return "Grandmaster";
    if (elo >= 1500) return "Master";
    if (elo >= 1200) return "Adept";
    return "Novice";
}