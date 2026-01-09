"use client"; 

import Button from "@/components/ui/Button";
import AuthButton from "@/components/ui/AuthButton";
import Link from "next/link";
import { useSession } from "next-auth/react"; // <--- 1. Import Hook

export default function Home() {
  // 2. Check Login Status
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-violet/30 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-neon-cyan/10 blur-[120px]" />

      {/* Main Content Card */}
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
        <div className="w-full pt-8 space-y-4">
  
          {/* 3. Dynamic Play Button 
              - Points to /dashboard so you can choose difficulty/resume.
              - Text changes based on login status. 
          */}
          <Link href="/dashboard" className="block w-full">
           <Button variant="primary" fullWidth>
              {isLoggedIn ? "Enter the Void" : "Play as Guest"}
           </Button>
          </Link>

          {/* 4. Smart Login/Sync Button */}
          <div className="w-full">
            <AuthButton />
          </div>
  
        </div>

        {/* Footer info */}
        <p className="text-xs text-white/20 font-mono mt-8">
          v1.0 • AD Free • Open Source
        </p>
      </div>

    </main>
  );
}