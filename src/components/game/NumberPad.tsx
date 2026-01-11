"use client";

import React from "react";
import { Delete } from "lucide-react"; 

type NumberPadProps = {
  onNumberClick: (num: number) => void;
  onDelete: () => void;
  completedNumbers?: number[]; 
  // [NEW] Props for Digit-First Mode
  activeNumber?: number | null;
  inputMode?: 'cell-first' | 'digit-first';
};

export default function NumberPad({ 
  onNumberClick, 
  onDelete, 
  completedNumbers = [],
  activeNumber,
  inputMode
}: NumberPadProps) {
  
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="grid grid-cols-5 gap-3 w-full max-w-md mt-6 px-2">
      {/* Map numbers 1-9 */}
      {numbers.map((num) => {
        // Check if this number is "done" (appears 9 times on board)
        const isHidden = completedNumbers.includes(num);
        
        // [NEW] Check if this number is currently "loaded" in Digit-First mode
        const isActive = inputMode === 'digit-first' && activeNumber === num;

        return (
          <div key={num} className={isHidden ? "invisible pointer-events-none" : ""}>
            <button
              onClick={() => onNumberClick(num)}
              className={`
                flex h-14 w-full items-center justify-center rounded-xl 
                text-2xl font-mono font-bold
                shadow-lg backdrop-blur-md transition-all duration-200
                
                ${isActive 
                  ? "bg-neon-cyan text-midnight scale-110 border-2 border-white shadow-[0_0_20px_rgba(6,182,212,0.6)] z-10" 
                  : "bg-glass border border-glass-border text-neon-cyan active:scale-95 active:bg-neon-cyan/20 hover:bg-white/5"
                }
              `}
            >
              {num}
            </button>
          </div>
        );
      })}

      {/* The Delete Button (Takes the last slot) */}
      <button
        onClick={onDelete}
        className="
          flex h-14 items-center justify-center rounded-xl 
          bg-red-500/10 border border-red-500/30
          text-neon-red shadow-lg backdrop-blur-md transition-all
          active:scale-95 active:bg-red-500/20
          hover:bg-red-500/20
        "
        aria-label="Delete Number"
      >
        <Delete size={24} />
      </button>
    </div>
  );
}