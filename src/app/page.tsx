"use client"; 

import React from "react";
import Button from "@/components/ui/Button";
import AuthButton from "@/components/ui/AuthButton";
import Link from "next/link";
import { useSession } from "next-auth/react"; 
import { Gamepad2, Sparkles, Github, ArrowRight } from "lucide-react";

export default function Home() {
  const { status } = useSession();
  const isLoading = status === "loading";
  const isLoggedIn = status === "authenticated";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 bg-midnight text-slate-200 selection:bg-neon-cyan/30">
      
      {/* --- BACKGROUND ATMOSPHERE --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          {/* Top Left Glow (Deep Violet) */}
          <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-violet-900/20 blur-[120px] animate-pulse-slow" />
          {/* Bottom Right Glow (Neon Cyan) */}
          <div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-neon-cyan/10 blur-[120px]" />
          {/* Noise Overlay for Texture */}
          <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* --- CONTENT CARD --- */}
      <div className="z-10 flex w-full max-w-sm flex-col items-center text-center space-y-10 p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl animate-fade-in">
        
        {/* 1. BRANDING */}
        <div className="space-y-4">
          <div className="relative inline-block group cursor-default">
            <h1 className="text-8xl font-bold font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 drop-shadow-2xl transition-all group-hover:scale-105">
              Ku
            </h1>
            {/* Decorative dot - Neon Cyan */}
            <div className="absolute -top-2 -right-4 h-4 w-4 rounded-full bg-neon-cyan shadow-[0_0_20px_rgba(6,182,212,0.8)] animate-bounce-slow" />
          </div>
          
          <div className="flex items-center justify-center gap-3 opacity-60">
             <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/50" />
             <p className="text-xs font-mono tracking-[0.4em] uppercase text-cyan-100">
               Sudoku Game
             </p>
             <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/50" />
          </div>
        </div>

        {/* 2. ACTION AREA */}
        <div className="w-full space-y-5">
  
          {/* Main Play Button */}
          {isLoading ? (
             <div className="h-14 w-full rounded-xl bg-white/5 animate-pulse border border-white/5" />
          ) : (
             <Link href="/dashboard" className="block w-full group">
               <Button 
                 variant="primary" 
                 fullWidth 
                 className="h-14 bg-neon-cyan hover:bg-cyan-400 text-midnight font-bold tracking-widest shadow-[0_0_30px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] border-transparent transition-all duration-300 transform group-hover:-translate-y-1"
               >
                  <div className="flex items-center justify-center gap-3">
                    {isLoggedIn ? <Sparkles size={20} className="animate-pulse" /> : <Gamepad2 size={20} />}
                    <span className="text-sm md:text-base">
                      {isLoggedIn ? "ENTER THE VOID" : "PLAY AS GUEST"}
                    </span>
                    <ArrowRight size={18} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  </div>
               </Button>
             </Link>
          )}

          {/* Sync / Login Divider */}
          <div className="w-full relative py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-[#0F172A] px-3 text-slate-500">
                {isLoggedIn ? "Identity Confirmed" : "Or Sync Progress"}
              </span>
            </div>
          </div>

          <div className="w-full transform transition-all duration-300 hover:scale-[1.02]">
            <AuthButton />
          </div>
  
        </div>
      </div>

      {/* --- MINIMAL FOOTER --- */}
      <div className="absolute bottom-8 text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <a 
          href="https://github.com/sohamshetty07/ku-sudoku" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all hover:border-white/20"
        >
          <Github size={16} className="text-slate-400 group-hover:text-white transition-colors" />
        </a>
      </div>

    </main>
  );
}