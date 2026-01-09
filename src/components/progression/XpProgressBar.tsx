import React from "react";
import { RANKS } from "@/lib/progression/constants";

export default function XpProgressBar({ xp }: { xp: number }) {
  // Logic to find current and next rank
  const currentRankIndex = RANKS.findIndex(r => xp < r.minXp) - 1;
  // If max rank, use last index
  const safeIndex = currentRankIndex < 0 ? RANKS.length - 1 : currentRankIndex;
  
  const currentRank = RANKS[safeIndex];
  const nextRank = RANKS[safeIndex + 1];

  let progress = 0;
  let nextXpTarget = 0;

  if (!nextRank) {
    progress = 100; // Max level
    nextXpTarget = xp; 
  } else {
    // Calculate percentage between current rank floor and next rank ceiling
    const range = nextRank.minXp - currentRank.minXp;
    const earned = xp - currentRank.minXp;
    progress = Math.min(100, Math.max(0, (earned / range) * 100));
    nextXpTarget = nextRank.minXp;
  }

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-[10px] text-white/40 font-mono">
        <span>{xp} XP</span>
        <span>{nextRank ? `NEXT: ${nextRank.title} (${nextXpTarget})` : "MAX LEVEL"}</span>
      </div>
      
      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-purple-500 transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}