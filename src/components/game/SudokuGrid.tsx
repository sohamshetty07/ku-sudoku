"use client";
import React from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store"; 
import { getThemeById } from "@/lib/store/theme"; 

interface SudokuGridProps {
  initialBoard: number[][] | null;
  boardState: number[][] | null;
  selectedCell: { row: number; col: number } | null;
  onCellClick: (row: number, col: number) => void;
  errorCells: Set<string>;
  notes: Record<string, number[]>;
  // [UPDATED] Use transientRegions to handle the one-time flash logic
  transientRegions?: Set<string>; 
  activeNumber?: number | null;
}

export default function SudokuGrid({
  initialBoard,
  boardState,
  selectedCell,
  onCellClick,
  errorCells,
  notes,
  transientRegions, // [UPDATED]
  activeNumber
}: SudokuGridProps) {
  // Get Active Theme & Text Settings
  const { activeThemeId, textSize } = useStore();
  const theme = getThemeById(activeThemeId);

  if (!boardState || !initialBoard) return null;

  // Determine which number to highlight
  // Priority: Active Number (Digit-First) -> Selected Cell's Value (Standard) -> Null
  const highlightValue = activeNumber ?? (
    selectedCell && boardState[selectedCell.row][selectedCell.col] !== 0
      ? boardState[selectedCell.row][selectedCell.col]
      : null
  );

  return (
    <div 
      className="grid grid-cols-9 grid-rows-9 w-full max-w-lg aspect-square bg-white/5 border-2 border-white/20 rounded-xl overflow-hidden shadow-2xl select-none mx-auto isolate transform-gpu z-0"
      style={{ WebkitBackfaceVisibility: "hidden", WebkitTransform: "translate3d(0, 0, 0)" }}
    >
      {boardState.map((row, rowIndex) =>
        row.map((cellValue, colIndex) => {
          
          const isFixed = initialBoard[rowIndex][colIndex] !== 0;
          const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
          const isError = errorCells.has(`${rowIndex}-${colIndex}`);
          
          // Related highlighting now uses the calculated highlightValue
          const isSameValue = highlightValue !== null && cellValue === highlightValue && !isSelected;

          const isRelated = selectedCell 
            ? (selectedCell.row === rowIndex || selectedCell.col === colIndex) && !isSelected
            : false;

          // [UPDATED] Check Transient Completion (Flash) Status
          // We check if this cell belongs to a region that JUST completed
          let isFlashing = false;
          if (transientRegions) {
             const rKey = `row-${rowIndex}`;
             const cKey = `col-${colIndex}`;
             const bKey = `box-${Math.floor(rowIndex/3)}-${Math.floor(colIndex/3)}`;
             if (transientRegions.has(rKey) || transientRegions.has(cKey) || transientRegions.has(bKey)) {
                isFlashing = true;
             }
          }

          // --- BORDER LOGIC ---
          const isRightEdge = colIndex === 8;
          const isBottomEdge = rowIndex === 8;
          const isThickRight = (colIndex + 1) % 3 === 0 && !isRightEdge;
          const isThickBottom = (rowIndex + 1) % 3 === 0 && !isBottomEdge;

          const borderClasses = `
            ${!isRightEdge ? (isThickRight ? "border-r border-r-white/50" : "border-r border-r-white/10") : ""}
            ${!isBottomEdge ? (isThickBottom ? "border-b border-b-white/50" : "border-b border-b-white/10") : ""}
          `;

          // --- TEXT COLOR PRIORITY ---
          let textColorClass = "";
          if (isError) {
            textColorClass = "text-neon-red font-bold";
          } else if (isSameValue && !isSelected) {
            textColorClass = "text-amber-400 font-bold"; 
          } else if (isFixed) {
            textColorClass = "text-white/90 font-bold";
          } else {
            textColorClass = `${theme.numColor} font-semibold`; 
          }

          // Big Text / Standard Text Logic
          const fontSizeClass = textSize === 'large' 
            ? "text-3xl sm:text-4xl md:text-5xl p-0" 
            : "text-xl sm:text-2xl md:text-3xl";

          // Dynamic Note Sizing
          const cellNotes = notes[`${rowIndex}-${colIndex}`] || [];
          const noteCount = cellNotes.length;
          const useLargeNotes = noteCount > 0 && noteCount <= 4;
          const noteGridClass = useLargeNotes 
            ? "grid-cols-2 place-content-center" 
            : "grid-cols-3";
          const noteTextClass = useLargeNotes
            ? "text-[10px] sm:text-[12px] font-bold text-white/90"
            : "text-[6px] sm:text-[8px] text-white/60";

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              onClick={() => onCellClick(rowIndex, colIndex)}
              className={`
                relative flex items-center justify-center 
                w-full h-full
                font-mono cursor-pointer transition-colors duration-200
                
                ${borderClasses}
                ${fontSizeClass}
                
                ${/* BACKGROUND STATES */ ""}
                ${isSelected ? "bg-white/10 z-10" : ""}
                ${/* Highlight Value Match */ ""}
                ${!isSelected && isSameValue ? "bg-amber-500/20 shadow-[inset_0_0_10px_rgba(245,158,11,0.2)]" : ""}
                ${isError && !isSelected ? "bg-neon-red/10" : ""}
                ${/* Related Row/Col Highlight */ ""}
                ${!isSelected && !isSameValue && isRelated ? "bg-white/5" : ""}
                
                ${/* [UPDATED] Completion Glow using Animation */ ""}
                ${!isSelected && !isSameValue && !isRelated && isFlashing ? "animate-flash-fade" : ""}
                
                ${/* Hover State */ ""}
                ${!isSelected && !isRelated && !isSameValue && !isFlashing ? "hover:bg-white/5" : ""}
                
                ${textColorClass}
              `}
            >
              {isSelected && (
                <motion.div 
                  layoutId="selection-ring" 
                  className="absolute inset-0 border-2 z-20 pointer-events-none" 
                  style={{ borderColor: theme.accentHex }}
                  transition={{ duration: 0.15 }} 
                />
              )}

              {cellValue !== 0 ? (
                cellValue
              ) : (
                // Dynamic Notes Renderer
                <div className={`grid w-full h-full p-[1px] pointer-events-none ${noteGridClass}`}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                    const hasNote = cellNotes.includes(n);
                    if (!hasNote && useLargeNotes) return null; 
                    
                    return (
                      <div key={n} className="flex items-center justify-center">
                        {hasNote && (
                          <span className={`leading-none font-sans ${noteTextClass}`}>
                            {n}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}