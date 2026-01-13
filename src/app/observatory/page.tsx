"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { SHOP_THEMES } from "@/lib/store/theme"; 
import ThemeCard from "@/components/shop/ThemeCard";
import { Star, Sparkles, ArrowLeft, Telescope, RefreshCw } from "lucide-react";

export default function ObservatoryPage() {
  const { stardust, cometShards, pushSync } = useStore();
  const [mounted, setMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. ROBUSTNESS: Sync on Mount & Fix Hydration
  useEffect(() => {
    setMounted(true);
    
    // Ensure wallet is up-to-date with server
    const initShop = async () => {
      setIsSyncing(true);
      await pushSync();
      setIsSyncing(false);
    };
    
    initShop();
  }, [pushSync]);

  // Separate themes by type
  const standardThemes = SHOP_THEMES.filter(t => t.type === 'Standard');
  const premiumThemes = SHOP_THEMES.filter(t => t.type !== 'Standard');

  return (
    <main className="min-h-screen bg-midnight text-slate-200 animate-fade-in pb-[calc(120px+env(safe-area-inset-bottom))]">
      
      {/* --- STICKY HEADER: WALLET & NAV --- */}
      <div className="sticky top-0 z-50 w-full bg-midnight/80 backdrop-blur-xl border-b border-white/5 pt-[env(safe-area-inset-top)] shadow-2xl shadow-black/20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center h-16">
            
            <Link 
                href="/dashboard" 
                className="p-3 -ml-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all active:scale-95"
                aria-label="Return to Dashboard"
            >
                <ArrowLeft size={24} />
            </Link>
            
            {/* CURRENCY PILLS */}
            <div className="flex gap-3">
                
                {/* Sync Status Indicator (Subtle) */}
                <div className={`flex items-center text-white/20 transition-opacity ${isSyncing ? "opacity-100" : "opacity-0"}`}>
                    <RefreshCw size={14} className="animate-spin" />
                </div>

                {/* Stardust */}
                <div className="flex items-center gap-2 bg-slate-900/60 px-4 py-2 rounded-full border border-neon-amber/20 shadow-[0_0_15px_rgba(245,158,11,0.1)] backdrop-blur-md">
                    <Star size={14} className="text-neon-amber fill-neon-amber" />
                    <span 
                        key={stardust} // Triggers animation on change
                        className="text-amber-100 font-mono font-bold text-sm min-w-[3ch] text-right animate-bump"
                    >
                        {mounted ? stardust : <div className="h-4 w-8 bg-white/10 rounded animate-pulse inline-block" />}
                    </span>
                </div>

                {/* Shards */}
                <div className="flex items-center gap-2 bg-slate-900/60 px-4 py-2 rounded-full border border-neon-red/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] backdrop-blur-md">
                    <Sparkles size={14} className="text-neon-red fill-neon-red" />
                    <span 
                        key={cometShards} 
                        className="text-red-100 font-mono font-bold text-sm min-w-[3ch] text-right animate-bump"
                    >
                        {mounted ? cometShards : <div className="h-4 w-8 bg-white/10 rounded animate-pulse inline-block" />}
                    </span>
                </div>
            </div>

        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-16 pt-8">
        
        {/* SECTION: HERO TITLE */}
        <div className="text-center space-y-6 py-8 relative">
           {/* Decorative Background Glow */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-900/20 blur-[100px] rounded-full pointer-events-none" />
           
           <div className="relative inline-flex justify-center items-center p-5 bg-gradient-to-br from-violet-900/20 to-purple-900/20 border border-violet-500/20 rounded-full mb-2 ring-4 ring-violet-500/5">
                <Telescope size={40} className="text-violet-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
           </div>
           
           <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-200 via-cyan-200 to-sky-200 tracking-[0.1em] font-mono drop-shadow-sm">
                    OBSERVATORY
                </h1>
                <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
                    Unlock visual protocols to customize the neural interface.
                    <br/>
                    <span className="inline-block mt-2 text-violet-400/60 text-[10px] uppercase tracking-[0.2em] font-bold border border-violet-500/20 px-2 py-1 rounded">
                        Cloud Sync Active
                    </span>
                </p>
           </div>
        </div>

        {/* SECTION: STANDARD THEMES */}
        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-4 mb-8">
              <h2 className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] whitespace-nowrap">
                Standard Protocols
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {standardThemes.map(theme => (
              <ThemeCard 
                key={theme.id}
                theme={theme}
              />
            ))}
          </div>
        </section>

        {/* SECTION: PREMIUM THEMES */}
        <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-4 mb-8">
              <h2 className="text-neon-red/80 text-xs font-bold uppercase tracking-[0.2em] whitespace-nowrap flex items-center gap-2">
                <Sparkles size={12} /> Anomaly Class (Rare)
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-neon-red/30 to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {premiumThemes.map(theme => (
              <ThemeCard 
                key={theme.id}
                theme={theme}
              />
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}