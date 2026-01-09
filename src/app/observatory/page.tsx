"use client";
import React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
// FIXED IMPORT: Point to the new store location
import { SHOP_THEMES } from "@/lib/store/theme"; 
import ThemeCard from "@/components/shop/ThemeCard";
import { Star, Sparkles, ArrowLeft } from "lucide-react";

export default function ObservatoryPage() {
  const { 
    stardust, 
    cometShards, 
    // We don't need the other actions here anymore because ThemeCard handles them
  } = useStore();

  return (
    <main className="min-h-screen bg-[#0F172A] p-4 md:p-8 animate-fade-in pb-20">
      
      {/* HEADER: WALLET */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-8 sticky top-4 z-40 bg-[#0F172A]/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl">
        <Link href="/dashboard" className="text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-amber-500/20">
            <Star size={16} className="text-amber-400 fill-amber-400" />
            <span className="text-amber-100 font-mono font-bold">{stardust}</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-rose-500/20">
            <Sparkles size={16} className="text-rose-500 fill-rose-500" />
            <span className="text-rose-100 font-mono font-bold">{cometShards}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* SECTION: TITLE */}
        <div className="text-center space-y-2">
           <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 tracking-widest font-mono">
            OBSERVATORY
           </h1>
           <p className="text-white/40">Augment your visual interface.</p>
        </div>

        {/* SECTION: STANDARD THEMES */}
        <div>
          <h2 className="text-white/60 text-sm font-bold uppercase tracking-widest mb-4 pl-2 border-l-2 border-neon-cyan">
            Standard Protocols
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SHOP_THEMES.filter(t => t.type === 'Standard').map(theme => (
              <ThemeCard 
                key={theme.id}
                theme={theme}
              />
            ))}
          </div>
        </div>

        {/* SECTION: ELITE THEMES */}
        <div>
          <h2 className="text-white/60 text-sm font-bold uppercase tracking-widest mb-4 pl-2 border-l-2 border-rose-500">
            Anomaly Class (Rare)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SHOP_THEMES.filter(t => t.type !== 'Standard').map(theme => (
              <ThemeCard 
                key={theme.id}
                theme={theme}
              />
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}