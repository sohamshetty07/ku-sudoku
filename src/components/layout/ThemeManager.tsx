"use client";

import React, { useEffect } from "react";
import { useStore } from "@/lib/store";
// Ensure this path matches where you saved your theme definitions
import { getThemeById } from "@/lib/store/theme"; // Ensure file is theme.ts

export default function ThemeManager() {
  const { activeThemeId } = useStore();
  const activeTheme = getThemeById(activeThemeId);

  // --- 1. CHAMELEON EFFECT (Meta Tag Update) ---
  // This updates the browser address bar color on mobile devices 
  // to match the active theme's primary color.
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Find or create the meta tag
    let metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    
    // Update it to the theme's preview color
    metaThemeColor.setAttribute("content", activeTheme.previewColor);
  }, [activeTheme.previewColor]);

  return (
    <>
      {/* BASE LAYER (Solid Fallback) 
         Prevents transparency issues while the gradient transitions.
      */}
      <div className="fixed inset-0 -z-50 bg-[#0F172A]" />

      {/* DYNAMIC THEME LAYER
         We use inline styles for the 'background' because the gradients 
         are dynamic strings from our database.
      */}
      <div 
        className="fixed inset-0 -z-50 transition-[background] duration-1000 ease-in-out pointer-events-none"
        style={{ background: activeTheme.background }}
      />

      {/* NOISE OVERLAY 
         Keeps the textured 'film grain' look regardless of which theme is active.
         The mix-blend-overlay ensures it looks good on both dark and light themes.
      */}
      <div className="fixed inset-0 -z-40 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay" />
    </>
  );
}