"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { SHOP_THEMES } from "@/lib/store/theme"; 
import ThemeCard from "@/components/shop/ThemeCard";
import { Star, Sparkles, ArrowLeft, Telescope } from "lucide-react";

export default function ObservatoryPage() {
  const { stardust, cometShards } = useStore();
  const [mounted, setMounted] = useState(false);

  // Prevent Hydration Mismatch for Currency
  useEffect(() => {
    setMounted(true);
  }, []);

  // Separate themes by type for organized display
  const standardThemes = SHOP_THEMES.filter(t => t.type === 'Standard');
  const premiumThemes = SHOP_THEMES.filter(t => t.type !== 'Standard');

  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-200 animate-fade-in pb-[calc(80px+env(safe-area-inset-bottom))]">
      
      {/* --- HEADER: WALLET & NAV ---
        Sticky positioning ensures it's always accessible. 
        'pt-[env...]' handles the iPhone Notch/Dynamic Island.
      */}
      <div className="sticky top-0 z-50 w-full bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/5 pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            
            <Link 
                href="/dashboard" 
                className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all active:scale-95"
            >
                <ArrowLeft size={24} />
            </Link>
            
            <div className="flex gap-3">
                {/* Stardust Pill */}
                <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-amber-500/20 shadow-lg shadow-amber-900/10">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-amber-100 font-mono font-bold text-sm min-w-[2ch] text-right">
                        {mounted ? stardust : "-"}
                    </span>
                </div>

                {/* Shards Pill */}
                <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-rose-500/20 shadow-lg shadow-rose-900/10">
                    <Sparkles size={14} className="text-rose-500 fill-rose-500" />
                    <span className="text-rose-100 font-mono font-bold text-sm min-w-[2ch] text-right">
                        {mounted ? cometShards : "-"}
                    </span>
                </div>
            </div>

        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-12 pt-8">
        
        {/* SECTION: HERO TITLE */}
        <div className="text-center space-y-4 py-4">
           <div className="inline-flex justify-center items-center p-4 bg-indigo-500/10 rounded-full mb-2">
                <Telescope size={32} className="text-indigo-400" />
           </div>
           <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 via-cyan-300 to-sky-300 tracking-widest font-mono">
            OBSERVATORY
           </h1>
           <p className="text-slate-400 max-w-md mx-auto text-sm md:text-base leading-relaxed">
             Acquire visual protocols to augment your interface. <br/>
             <span className="text-slate-600 text-xs uppercase tracking-widest">Syncs across all devices</span>
           </p>
        </div>

        {/* SECTION: STANDARD THEMES */}
        <section>
          <div className="flex items-center gap-4 mb-6">
              <h2 className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
                Standard Protocols
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-neon-cyan/50 to-transparent" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {standardThemes.map(theme => (
              <ThemeCard 
                key={theme.id}
                theme={theme}
              />
            ))}
          </div>
        </section>

        {/* SECTION: ELITE THEMES */}
        <section>
          <div className="flex items-center gap-4 mb-6">
              <h2 className="text-rose-400/60 text-xs font-bold uppercase tracking-[0.2em]">
                Anomaly Class (Rare)
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-rose-500/50 to-transparent" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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