"use client";
import React from "react";
import { Star, X, CheckCircle, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import { useStore } from "@/lib/store";

export default function DailyRewardModal() {
  const { closeDailyRewardModal } = useStore();

  return (
    // Z-Index 60 ensures it appears ABOVE the Victory Modal (Z-50)
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      
      <div className="relative w-[90%] max-w-sm overflow-hidden rounded-3xl border border-amber-500/30 bg-[#0F172A] p-6 text-center shadow-[0_0_60px_rgba(245,158,11,0.2)]">
        
        {/* Background Glow */}
        <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-amber-500/20 blur-[60px]" />
        <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-yellow-500/10 blur-[60px]" />

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                <Sparkles size={32} className="text-amber-400 fill-amber-400 animate-pulse" />
            </div>
            
            <h2 className="text-2xl font-bold text-white tracking-wide font-mono">SUPPLY DROP</h2>
            <p className="text-xs text-amber-400/80 font-bold uppercase tracking-widest mt-1 mb-6">
                Venus Beacon Active
            </p>
        </div>

        {/* Reward Box */}
        <div className="relative z-10 mb-8 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-white/10 p-6">
            <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Daily Allocation</span>
                <div className="flex items-center gap-3">
                    <Star size={28} className="text-amber-400 fill-amber-400 drop-shadow-md" />
                    <span className="text-4xl font-mono font-bold text-white">+50</span>
                </div>
            </div>
        </div>

        {/* Action */}
        <div className="relative z-10">
            <Button 
                variant="primary" 
                fullWidth 
                onClick={closeDailyRewardModal}
                className="bg-amber-600 hover:bg-amber-500 text-white border-amber-500/50"
            >
                <div className="flex items-center gap-2">
                    <CheckCircle size={18} />
                    <span>CLAIM RESOURCES</span>
                </div>
            </Button>
        </div>

      </div>
    </div>
  );
}