"use client";

import React, { useEffect } from "react";
import { useStore } from "@/lib/store";
import { getThemeById } from "@/lib/store/theme"; 

export default function ThemeManager() {
  const { activeThemeId } = useStore();
  const activeTheme = getThemeById(activeThemeId);

  // --- 1. CHAMELEON EFFECT (Meta Tag Update) ---
  // Updates browser address bar color on mobile to match theme
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    let metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.setAttribute("content", activeTheme.previewColor);
  }, [activeTheme.previewColor]);

  return (
    <>
      {/* BASE LAYER (Solid Fallback) */}
      <div className="fixed inset-0 -z-50 bg-[#0F172A]" />

      {/* DYNAMIC THEME LAYER 
          [UPDATED] Check 'isDynamic' to trigger the gradient-xy animation
      */}
      <div 
        className={`
            fixed inset-0 -z-50 transition-[background] duration-1000 ease-in-out pointer-events-none
            ${activeTheme.isDynamic ? 'animate-gradient-xy' : ''}
        `}
        style={{ background: activeTheme.background }}
      />

      {/* CONTRAST PRESERVATION LAYER 
          If the theme is very bright (like Lumina), we add a semi-transparent dark overlay.
      */}
      <div 
        className={`
            fixed inset-0 -z-40 pointer-events-none transition-opacity duration-1000
            ${activeTheme.requiresDimming ? 'bg-black/60' : 'opacity-0'}
        `}
      />

      {/* NOISE OVERLAY */}
      <div className="fixed inset-0 -z-40 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay" />
    </>
  );
}