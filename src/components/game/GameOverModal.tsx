"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { XCircle, RefreshCw, Home } from "lucide-react";

type GameOverModalProps = {
  onRetry: () => void;
  isExpedition?: boolean;
};

export default function GameOverModal({ onRetry, isExpedition = false }: GameOverModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    // 1. Backdrop (High Z-Index to cover everything)
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
      
      {/* 2. Modal Card */}
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
            
            <p className="mb-8 text-sm text-slate-400 font-sans leading-relaxed max-w-[240px] mx-auto">
                {isExpedition 
                  ? "Your vessel's integrity has been compromised. The expedition ends here." 
                  : "Too many errors detected. The Void has consumed this pattern."}
            </p>
            
            <div className="space-y-3">
                {/* Retry Button - Only available for standard modes (Not Roguelike) */}
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

                {/* Exit Link - Dynamic destination */}
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