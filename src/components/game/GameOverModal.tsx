"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { XCircle, RefreshCw, Home, Hexagon } from "lucide-react";
import { useStore } from "@/lib/store"; // [NEW] Import Store

type GameOverModalProps = {
  onRetry: () => void;
  isExpedition?: boolean;
};

export default function GameOverModal({ onRetry, isExpedition = false }: GameOverModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { expedition } = useStore(); // [NEW] Access Store for stats

  // Trigger animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    // Backdrop
    <div 
        className={`
            fixed inset-0 z-[100] flex items-center justify-center 
            bg-[#0F172A]/95 backdrop-blur-sm 
            transition-opacity duration-500
            ${isVisible ? "opacity-100" : "opacity-0"}
        `}
        role="dialog"
        aria-modal="true"
    >
      
      {/* Modal Card */}
      <div 
        className={`
            w-[90%] max-w-sm transform rounded-3xl 
            border border-white/10 bg-[#0F172A] 
            p-8 text-center shadow-2xl shadow-red-900/20 
            transition-all duration-500 ease-out
            ${isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-8"}
        `}
      >
        
        {/* Decorative Red Glow */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-red-500/10 to-transparent rounded-3xl pointer-events-none" />

        {/* Content Layer */}
        <div className="relative z-10">
            
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <XCircle size={40} strokeWidth={1.5} />
            </div>

            <h2 className="mb-2 text-2xl font-bold font-mono text-white tracking-[0.2em] uppercase">
                {isExpedition ? "SIGNAL LOST" : "PROTOCOL FAILED"}
            </h2>
            
            {/* [NEW] Expedition Stats */}
            {isExpedition && (
                <div className="mb-6 flex items-center justify-center gap-2 text-indigo-300 bg-indigo-500/10 py-1 px-3 rounded-full w-fit mx-auto border border-indigo-500/20">
                    <Hexagon size={14} />
                    <span className="text-xs font-bold tracking-widest uppercase">
                        Reached Sector {expedition.sector}
                    </span>
                </div>
            )}
            
            <p className="mb-8 text-sm text-slate-400 font-sans leading-relaxed max-w-[240px] mx-auto">
                {isExpedition 
                  ? "Your vessel's integrity has been compromised. The Void reclaims your artifacts." 
                  : "Too many errors detected. The Void has consumed this pattern."}
            </p>
            
            <div className="space-y-3">
                {/* Retry Button - Only available for standard modes */}
                {!isExpedition && (
                    <Button 
                        variant="primary" 
                        fullWidth 
                        onClick={onRetry}
                        className="bg-red-600 hover:bg-red-500 border-red-500 shadow-lg shadow-red-900/30"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <RefreshCw size={18} />
                            <span>Retry</span>
                        </div>
                    </Button>
                )}

                {/* Exit Link */}
                <Link href={isExpedition ? "/expedition" : "/dashboard"} className="block w-full">
                    <Button variant="secondary" fullWidth className="border-white/10 hover:bg-white/5 text-slate-400 hover:text-white">
                        <div className="flex items-center justify-center gap-2">
                            <Home size={18} />
                            <span>{isExpedition ? "Return to Loadout" : "Return to Sanctuary"}</span>
                        </div>
                    </Button>
                </Link>
            </div>
        </div>

      </div>
    </div>
  );
}