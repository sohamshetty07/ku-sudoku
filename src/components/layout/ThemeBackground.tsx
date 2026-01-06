"use client";

import React from "react";
import { useStore } from "@/lib/store";

export default function ThemeBackground() {
  // Use the new themeDifficulty state
  const themeDifficulty = useStore((state) => state.themeDifficulty);

  const gradients = {
    Relaxed: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/40 via-[#0F172A] to-[#0F172A]",
    Standard: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/40 via-[#0F172A] to-[#0F172A]",
    Mastery: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-950/30 via-[#0F172A] to-[#0F172A]",
  };
  
  const baseClasses = "fixed inset-0 -z-50 transition-all duration-1000 ease-in-out pointer-events-none";

  return (
    <>
      <div className="fixed inset-0 -z-50 bg-[#0F172A]" />
      <div className={`${baseClasses} ${gradients[themeDifficulty]}`} />
      <div className="fixed inset-0 -z-40 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
    </>
  );
}