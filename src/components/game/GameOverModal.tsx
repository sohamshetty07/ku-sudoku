"use client";
import React from "react";
import Button from "@/components/ui/Button";
import Link from "next/link";

type GameOverModalProps = {
  onRetry: () => void;
};

export default function GameOverModal({ onRetry }: GameOverModalProps) {
  return (
    // 1. The Backdrop (Darkens the game behind it)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/80 backdrop-blur-sm transition-all duration-500">
      
      {/* 2. The Modal Card */}
      <div className="w-[90%] max-w-sm transform rounded-2xl border border-white/20 bg-midnight/50 p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl animate-in fade-in zoom-in duration-300">
        
        {/* Icon or Visual Cue */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neon-red/10 text-3xl">
          ✖
        </div>

        <h2 className="mb-2 text-3xl font-bold text-white tracking-wide">
          Game Over
        </h2>
        
        <p className="mb-8 text-sm text-white/50 font-sans leading-relaxed">
          Too many mistakes. The Void remains unsolved.
        </p>
        
        <div className="space-y-3">
          {/* Retry Button */}
          <Button variant="primary" fullWidth onClick={onRetry}>
            Try New Puzzle
          </Button>

          {/* Exit Link */}
          <Link href="/" className="block w-full">
            <Button variant="secondary" fullWidth>
              Return to Sanctuary
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}