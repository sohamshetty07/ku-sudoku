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

  // 1. Get the value of the currently selected cell (if any)
  // We use this to highlight matching numbers across the board
  const selectedValue =
    selectedCell && boardState[selectedCell.row][selectedCell.col] !== 0
      ? boardState[selectedCell.row][selectedCell.col]
      : null;

  return (
    <div className="grid grid-cols-9 gap-1 p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl select-none">
      {boardState.map((row, rowIndex) =>
        row.map((cellValue, colIndex) => {
          // --- LOGIC: DETERMINE CELL STATUS ---
          
          const isFixed = initialBoard[rowIndex][colIndex] !== 0;
          const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
          const isError = errorCells.has(`${rowIndex}-${colIndex}`);
          
          // Crosshair Logic: Is this cell in the same Row or Col as selection?
          const isRelated = selectedCell 
            ? (selectedCell.row === rowIndex || selectedCell.col === colIndex) && !isSelected
            : false;

          // Match Logic: Does this cell have the same number as the selection?
          const isSameValue = selectedValue !== null && cellValue === selectedValue && !isSelected;

          // Box Borders: Thicker borders for 3x3 grids
          const borderRight = (colIndex + 1) % 3 === 0 && colIndex !== 8 ? "border-r-2 border-r-white/20" : "";
          const borderBottom = (rowIndex + 1) % 3 === 0 && rowIndex !== 8 ? "border-b-2 border-b-white/20" : "";

          // --- STYLING ---
          return (
            <motion.div
              key={`${rowIndex}-${colIndex}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: (rowIndex * 9 + colIndex) * 0.005 }}
              onClick={() => onCellClick(rowIndex, colIndex)}
              className={`
                relative flex items-center justify-center 
                w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 
                text-lg sm:text-xl md:text-2xl font-mono cursor-pointer transition-all duration-200
                rounded-md
                ${borderRight} ${borderBottom}
                
                ${/* 1. SELECTION STATE (High Priority) */ ""}
                ${isSelected ? "bg-neon-cyan/20 ring-2 ring-neon-cyan z-10 scale-105 shadow-[0_0_15px_rgba(6,182,212,0.4)]" : ""}
                
                ${/* 2. MATCHING NUMBER STATE (High Priority) */ ""}
                ${!isSelected && isSameValue ? "bg-neon-cyan/10 text-neon-cyan font-bold shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]" : ""}

                ${/* 3. ERROR STATE */ ""}
                ${isError && !isSelected ? "bg-neon-red/10 text-neon-red animate-pulse" : ""}
                
                ${/* 4. CROSSHAIR GUIDES (Low Priority) */ ""}
                ${!isSelected && !isSameValue && isRelated ? "bg-white/5" : ""}

                ${/* 5. DEFAULT STATES */ ""}
                ${!isSelected && !isRelated && !isSameValue ? "hover:bg-white/5" : ""}
                ${isFixed ? "font-bold" : "font-light"}
                ${!isFixed && !isError && !isSameValue && !isSelected ? "text-neon-cyan" : ""}
                ${isFixed && !isSameValue && !isSelected ? "text-white/80" : ""}
              `}
            >
              {/* RENDER NUMBER OR NOTES */}
              {cellValue !== 0 ? (
                cellValue
              ) : (
                /* Note Grid (3x3 mini grid inside cell) */
                <div className="grid grid-cols-3 gap-[1px] w-full h-full p-[2px] pointer-events-none">
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
            </motion.div>
          );
        })
      )}
    </div>
  );
}