"use client";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      
      {/* Background FX */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse-slow" />
         <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div>

      <div className="z-10 space-y-6 max-w-md animate-fade-in">
        <div className="flex justify-center">
            <div className="p-6 rounded-full bg-slate-800/50 border border-white/10 shadow-2xl shadow-indigo-500/20">
                <AlertTriangle size={48} className="text-indigo-400" />
            </div>
        </div>

        <div className="space-y-2">
            <h1 className="text-4xl font-bold font-mono text-white tracking-widest">404</h1>
            <h2 className="text-xl font-bold text-indigo-200">COORDINATES NOT FOUND</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
                The sector you are trying to reach does not exist in the known universe. It may have been consumed by the Void.
            </p>
        </div>

        <Link href="/dashboard" className="block">
            <Button variant="primary" fullWidth className="h-12 border-indigo-500/30 hover:bg-indigo-500/10">
                <div className="flex items-center justify-center gap-2">
                    <Home size={18} />
                    <span>Return to Sanctuary</span>
                </div>
            </Button>
        </Link>
      </div>
    </main>
  );
}