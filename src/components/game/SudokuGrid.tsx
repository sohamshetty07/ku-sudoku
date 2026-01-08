"use client";
import React from "react";
import { motion } from "framer-motion";

interface SudokuGridProps {
  initialBoard: number[][] | null;
  boardState: number[][] | null;
  selectedCell: { row: number; col: number } | null;
  onCellClick: (row: number, col: number) => void;
  errorCells: Set<string>;
  notes: Record<string, number[]>;
}

export default function SudokuGrid({
  initialBoard,
  boardState,
  selectedCell,
  onCellClick,
  errorCells,
  notes,
}: SudokuGridProps) {
  if (!boardState || !initialBoard) return null;

  const selectedValue =
    selectedCell && boardState[selectedCell.row][selectedCell.col] !== 0
      ? boardState[selectedCell.row][selectedCell.col]
      : null;

  return (
    // Container: Uses max-w-lg to constrain width on desktop, w-full for mobile
    <div className="grid grid-cols-9 w-full max-w-lg bg-white/5 border-2 border-white/20 rounded-xl overflow-hidden shadow-2xl select-none mx-auto">
      {boardState.map((row, rowIndex) =>
        row.map((cellValue, colIndex) => {
          
          const isFixed = initialBoard[rowIndex][colIndex] !== 0;
          const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
          const isError = errorCells.has(`${rowIndex}-${colIndex}`);
          
          const isRelated = selectedCell 
            ? (selectedCell.row === rowIndex || selectedCell.col === colIndex) && !isSelected
            : false;

          const isSameValue = selectedValue !== null && cellValue === selectedValue && !isSelected;

          // --- BORDER LOGIC ---
          const isRightEdge = colIndex === 8;
          const isBottomEdge = rowIndex === 8;
          const isThickRight = (colIndex + 1) % 3 === 0 && !isRightEdge;
          const isThickBottom = (rowIndex + 1) % 3 === 0 && !isBottomEdge;

          const borderClasses = `
            ${!isRightEdge ? (isThickRight ? "border-r-2 border-r-white/30" : "border-r border-r-white/10") : ""}
            ${!isBottomEdge ? (isThickBottom ? "border-b-2 border-b-white/30" : "border-b border-b-white/10") : ""}
          `;

          // --- TEXT COLOR PRIORITY LOGIC ---
          // 1. Error: ALWAYS Red (Even if selected)
          // 2. Matching Value: Amber (Unless selected)
          // 3. Fixed: White
          // 4. Default User Input: Cyan
          let textColorClass = "";
          
          if (isError) {
            textColorClass = "text-neon-red font-bold";
          } else if (isSameValue && !isSelected) {
            textColorClass = "text-amber-400 font-bold";
          } else if (isFixed) {
            textColorClass = "text-white/90 font-bold";
          } else {
            textColorClass = "text-neon-cyan font-semibold";
          }

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              onClick={() => onCellClick(rowIndex, colIndex)}
              className={`
                relative flex items-center justify-center 
                w-full aspect-square
                text-xl sm:text-2xl md:text-3xl font-mono cursor-pointer transition-colors duration-75
                ${borderClasses}
                
                ${/* BACKGROUND STATES */ ""}
                ${isSelected ? "bg-neon-cyan/20 z-10" : ""}
                ${!isSelected && isSameValue ? "bg-amber-500/20 shadow-[inset_0_0_10px_rgba(245,158,11,0.2)]" : ""}
                ${isError && !isSelected ? "bg-neon-red/10" : ""}
                ${!isSelected && !isSameValue && isRelated ? "bg-white/5" : ""}
                ${!isSelected && !isRelated && !isSameValue ? "hover:bg-white/5" : ""}
                
                ${/* TEXT COLOR APPLIED HERE */ ""}
                ${textColorClass}
              `}
            >
              {isSelected && (
                <motion.div 
                  layoutId="selection-ring" 
                  className="absolute inset-0 border-2 border-neon-cyan z-20 pointer-events-none" 
                  transition={{ duration: 0.15 }} 
                />
              )}

              {cellValue !== 0 ? (
                cellValue
              ) : (
                <div className="grid grid-cols-3 w-full h-full p-[1px] pointer-events-none">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <div key={n} className="flex items-center justify-center">
                      {notes[`${rowIndex}-${colIndex}`]?.includes(n) && (
                        <span className="text-[6px] sm:text-[8px] leading-none text-white/60 font-sans">
                          {n}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}