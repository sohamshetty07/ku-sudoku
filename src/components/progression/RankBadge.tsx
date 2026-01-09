import React from "react";
import { RANKS } from "@/lib/progression/constants";

export default function RankBadge({ xp }: { xp: number }) {
  // Find current rank based on XP
  const currentRank = [...RANKS].reverse().find(r => xp >= r.minXp) || RANKS[0];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
      {/* Simple Dot Icon for now - can replace with SVG later */}
      <div className={`w-2 h-2 rounded-full bg-current ${currentRank.color}`} />
      
      <span className={`text-xs font-bold uppercase tracking-wider ${currentRank.color}`}>
        {currentRank.title}
      </span>
    </div>
  );
}