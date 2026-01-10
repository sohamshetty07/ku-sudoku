"use client"; 

import React from "react";
import Button from "@/components/ui/Button";
import AuthButton from "@/components/ui/AuthButton";
import Link from "next/link";
import { useSession } from "next-auth/react"; 
import { Gamepad2, Sparkles, Github } from "lucide-react";

export default function Home() {
  const { status } = useSession();
  const isLoading = status === "loading";
  const isLoggedIn = status === "authenticated";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      
      {/* --- BACKGROUND ATMOSPHERE --- */}
      {/* Top Left Glow (Pulsing) */}
      <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px] animate-pulse-slow" />
      {/* Bottom Right Glow (Static Anchor) */}
      <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />

      {/* --- CONTENT CARD --- */}
      <div className="z-10 flex w-full max-w-sm flex-col items-center text-center space-y-10 p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/5 shadow-2xl animate-fade-in-up">
        
        {/* 1. BRANDING */}
        <div className="space-y-4">
          <div className="relative inline-block">
            <h1 className="text-8xl font-bold font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 drop-shadow-2xl">
              Ku
            </h1>
            {/* Decorative dot */}
            <div className="absolute -top-2 -right-4 h-4 w-4 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-bounce-slow" />
          </div>
          
          <p className="text-sm text-cyan-200/60 font-mono tracking-[0.3em] uppercase border-t border-white/10 pt-4 mx-8">
            Sudoku Game
          </p>
        </div>

        {/* 2. ACTION AREA */}
        <div className="w-full space-y-4">
  
          {/* Main Play Button */}
          {isLoading ? (
             // Skeleton Loader prevents layout shift
             <div className="h-12 w-full rounded-xl bg-white/10 animate-pulse" />
          ) : (
             <Link href="/dashboard" className="block w-full group">
               <Button variant="primary" fullWidth className="h-14 shadow-[0_0_30px_rgba(6,182,212,0.15)] group-hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all">
                  <div className="flex items-center justify-center gap-3">
                    {isLoggedIn ? <Sparkles size={20} /> : <Gamepad2 size={20} />}
                    <span className="text-lg tracking-wide">
                      {isLoggedIn ? "ENTER THE VOID" : "PLAY AS GUEST"}
                    </span>
                  </div>
               </Button>
             </Link>
          )}

          {/* Sync / Login Button */}
          <div className="w-full relative">
            {/* Visual separator */}
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0F172A]/70 px-2 text-white/50 backdrop-blur-md">
                {isLoggedIn ? "Account Active" : "Or Sync Progress"}
              </span>
            </div>
          </div>

          <div className="w-full">
            <AuthButton />
          </div>
  
        </div>
      </div>

      {/* --- MINIMAL FOOTER --- */}
      <div className="absolute bottom-8 text-center space-y-2 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <a 
          href="https://github.com/sohamshetty07/ku-sudoku" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white"
        >
          <Github size={16} />
        </a>
      </div>

    </main>
  );
}