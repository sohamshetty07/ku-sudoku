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
    // Container: Removed 'aspect-square' and 'w-full' reliability. 
    // We let the fixed-size cells define the total size, wrapped in a fit-content border.
    <div className="grid grid-cols-9 bg-white/5 border-2 border-white/20 rounded-xl overflow-hidden shadow-2xl select-none mx-auto">
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
          
          // Thicker borders for 3x3 sections
          const isThickRight = (colIndex + 1) % 3 === 0 && !isRightEdge;
          const isThickBottom = (rowIndex + 1) % 3 === 0 && !isBottomEdge;

          const borderClasses = `
            ${!isRightEdge ? (isThickRight ? "border-r-2 border-r-white/30" : "border-r border-r-white/10") : ""}
            ${!isBottomEdge ? (isThickBottom ? "border-b-2 border-b-white/30" : "border-b border-b-white/10") : ""}
          `;

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              onClick={() => onCellClick(rowIndex, colIndex)}
              // RESTORED: Fixed width/height classes to prevent collapse
              className={`
                relative flex items-center justify-center 
                w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 
                text-lg sm:text-xl md:text-2xl font-mono cursor-pointer transition-colors duration-75
                ${borderClasses}
                
                ${/* STATES */ ""}
                ${isSelected ? "bg-neon-cyan/20 z-10" : ""}
                ${!isSelected && isSameValue ? "bg-neon-cyan/10 text-neon-cyan font-bold" : ""}
                ${isError && !isSelected ? "bg-neon-red/10 text-neon-red" : ""}
                ${!isSelected && !isSameValue && isRelated ? "bg-white/5" : ""}
                ${!isSelected && !isRelated && !isSameValue ? "hover:bg-white/5" : ""}
                
                ${/* TYPOGRAPHY */ ""}
                ${isFixed ? "font-bold text-white/90" : "font-semibold text-neon-cyan"}
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