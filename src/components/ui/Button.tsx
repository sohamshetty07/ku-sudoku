"use client"; // This tells Next.js this component handles user interaction (clicking)

import React from "react";

// We define what "props" (options) this button accepts
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass"; // Three visual styles
  fullWidth?: boolean; // Should it stretch across the screen?
}

export default function Button({ 
  children, 
  variant = "primary", 
  fullWidth = false, 
  className = "",
  ...props 
}: ButtonProps) {
  
  // 1. Base styles (applies to all buttons)
  const baseStyles = "relative inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:ring-offset-2 focus:ring-offset-midnight";
  
  // 2. Variants (The different 'flavours' of buttons)
  const variants = {
    primary: "bg-neon-cyan text-midnight hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] font-bold",
    secondary: "bg-charcoal text-white hover:bg-white/10 border border-white/10",
    glass: "bg-glass border border-glass-border text-white hover:bg-white/20 backdrop-blur-md",
  };

  // 3. Width logic
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}