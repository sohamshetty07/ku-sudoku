"use client"; // <--- THIS IS THE MAGIC LINE

import Button from "@/components/ui/Button";
import Link from "next/link";

export default function Home() {
  
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      
      {/* 1. Background Effects (The 'Abstract Caustics') */}
      <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-violet/30 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-neon-cyan/10 blur-[120px]" />

      {/* 2. The Main Content Card */}
      <div className="z-10 flex w-full max-w-sm flex-col items-center text-center space-y-8">
        
        {/* Branding */}
        <div className="space-y-2">
          <h1 className="text-7xl font-bold tracking-widest text-white drop-shadow-2xl">
            Ku
          </h1>
          <p className="text-lg text-white/60 font-sans tracking-wide">
            Sudoku Game
          </p>
        </div>

        {/* Action Area */}
        <div className="w-full pt-8">
  
          <Link href="/dashboard" className="block w-full mb-4">
           <Button variant="primary" fullWidth>
              Play as Guest
           </Button>
          </Link>

          <Button variant="glass" fullWidth>
            Sign In / Sync
          </Button>
  
        </div>

        {/* Footer info */}
        <p className="text-xs text-white/20 font-mono mt-8">
          v1.0 • AD Free • Open Source
        </p>
      </div>

    </main>
  );
}