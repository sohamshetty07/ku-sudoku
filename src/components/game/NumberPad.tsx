"use client";

import React from "react";
import { Delete } from "lucide-react"; // We need an icon for the delete button

type NumberPadProps = {
  onNumberClick: (num: number) => void;
  onDelete: () => void;
};

export default function NumberPad({ onNumberClick, onDelete }: NumberPadProps) {
  
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="grid grid-cols-5 gap-3 w-full max-w-md mt-6 px-2">
      {/* Map numbers 1-9 */}
      {numbers.map((num) => (
        <button
          key={num}
          onClick={() => onNumberClick(num)}
          className="
            flex h-14 items-center justify-center rounded-xl 
            bg-glass border border-glass-border 
            text-2xl font-mono text-neon-cyan font-bold
            shadow-lg backdrop-blur-md transition-all
            active:scale-95 active:bg-neon-cyan/20
            hover:bg-white/5
          "
        >
          {num}
        </button>
      ))}

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