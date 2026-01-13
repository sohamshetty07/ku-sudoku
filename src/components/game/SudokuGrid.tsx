"use client";
import React, { useMemo, useCallback, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store"; 
import { getThemeById } from "@/lib/store/theme"; 

interface SudokuGridProps {
  initialBoard: number[][] | null;
  boardState: number[][] | null;
  selectedCell: { row: number; col: number } | null;
  onCellClick: (row: number, col: number) => void;
  onCellNote?: (row: number, col: number) => void; // [NEW] Smart Note Callback
  errorCells: Set<string>;
  notes: Record<string, number[]>;
  transientRegions?: Set<string>; 
  activeNumber?: number | null;
}

// Helper to generate dynamic cursor for digit-first mode
const getCursorStyle = (num: number | null | undefined, themeColor: string) => {
  if (!num) return {};
  // Create a dynamic SVG cursor with the number inside
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>
      <circle cx='16' cy='16' r='14' fill='${encodeURIComponent(themeColor)}' fill-opacity='0.2' stroke='${encodeURIComponent(themeColor)}' stroke-width='2'/>
      <text x='50%' y='50%' dy='.35em' text-anchor='middle' font-family='monospace' font-weight='bold' font-size='20' fill='white'>${num}</text>
    </svg>
  `;
  const url = `data:image/svg+xml;utf8,${svg}`;
  return { cursor: `url("${url}") 16 16, auto` };
};

// --- MEMOIZED CELL COMPONENT ---
interface SudokuCellProps {
  rowIndex: number;
  colIndex: number;
  cellValue: number;
  isFixed: boolean;
  isSelected: boolean;
  isError: boolean;
  isSameValue: boolean;
  isRelated: boolean;
  isFlashing: boolean;
  borderClasses: string;
  notes: number[];
  textSize: string;
  theme: any;
  onClick: (row: number, col: number) => void;
  onNote: (row: number, col: number) => void; // [NEW]
}

const SudokuCell = React.memo(({
  rowIndex,
  colIndex,
  cellValue,
  isFixed,
  isSelected,
  isError,
  isSameValue,
  isRelated,
  isFlashing,
  borderClasses,
  notes,
  textSize,
  theme,
  onClick,
  onNote
}: SudokuCellProps) => {
  
  // Text Color Logic
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

  const fontSizeClass = textSize === 'large' 
    ? "text-3xl sm:text-4xl md:text-5xl p-0" 
    : "text-xl sm:text-2xl md:text-3xl";

  // Dynamic Notes
  const noteCount = notes.length;
  const useLargeNotes = noteCount > 0 && noteCount <= 4;
  const noteGridClass = useLargeNotes 
    ? "grid-cols-2 place-content-center" 
    : "grid-cols-3";
  const noteTextClass = useLargeNotes
    ? "text-[10px] sm:text-[12px] font-bold text-white/90"
    : "text-[6px] sm:text-[8px] text-white/60";

  // --- SMART INTERACTION LOGIC ---
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => {
      onNote(rowIndex, colIndex);
      // Optional: Add haptic feedback call here if available
      if (navigator.vibrate) navigator.vibrate(10);
    }, 500); // 500ms Long Press
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onNote(rowIndex, colIndex);
  };

  return (
    <div
      onClick={() => onClick(rowIndex, colIndex)}
      onDoubleClick={() => onNote(rowIndex, colIndex)} // Double Tap
      onContextMenu={handleContextMenu} // Right Click
      onPointerDown={handlePointerDown} // Start Long Press
      onPointerUp={handlePointerUp}     // Cancel Long Press
      onPointerLeave={handlePointerUp}  // Cancel if dragged away
      className={`
        relative flex items-center justify-center 
        w-full h-full
        font-mono transition-colors duration-200
        
        ${borderClasses}
        ${fontSizeClass}
        
        ${isSelected ? "bg-white/10 z-10" : ""}
        ${isError && !isSelected ? "bg-neon-red/10" : ""}
        ${!isSelected && !isError && isFlashing ? "animate-flash-fade z-20" : ""}
        ${!isSelected && !isError && !isFlashing && isSameValue ? "bg-amber-500/20 shadow-[inset_0_0_10px_rgba(245,158,11,0.2)]" : ""}
        ${!isSelected && !isError && !isFlashing && !isSameValue && isRelated ? "bg-white/5" : ""}
        ${!isSelected && !isError && !isFlashing && !isSameValue && !isRelated ? "hover:bg-white/5" : ""}
        
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
        <div className={`grid w-full h-full p-[1px] pointer-events-none ${noteGridClass}`}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
            const hasNote = notes.includes(n);
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
}, (prev, next) => {
  return (
    prev.cellValue === next.cellValue &&
    prev.isFixed === next.isFixed &&
    prev.isSelected === next.isSelected &&
    prev.isError === next.isError &&
    prev.isSameValue === next.isSameValue &&
    prev.isRelated === next.isRelated &&
    prev.isFlashing === next.isFlashing &&
    prev.textSize === next.textSize &&
    prev.theme.id === next.theme.id && 
    prev.notes === next.notes
  );
});


// --- MAIN GRID COMPONENT ---
export default function SudokuGrid({
  initialBoard,
  boardState,
  selectedCell,
  onCellClick,
  onCellNote,
  errorCells,
  notes,
  transientRegions,
  activeNumber
}: SudokuGridProps) {
  const { activeThemeId, textSize, inputMode } = useStore();
  const theme = getThemeById(activeThemeId);

  // Stable Click Handlers
  const onCellClickRef = useRef(onCellClick);
  const onCellNoteRef = useRef(onCellNote);
  
  useEffect(() => { 
    onCellClickRef.current = onCellClick; 
    onCellNoteRef.current = onCellNote;
  });

  const handleProxyClick = useCallback((row: number, col: number) => {
    onCellClickRef.current(row, col);
  }, []);

  const handleProxyNote = useCallback((row: number, col: number) => {
    if (onCellNoteRef.current) onCellNoteRef.current(row, col);
  }, []);

  // Visuals for Digit-First Mode
  const cursorStyle = useMemo(() => {
    if (inputMode === 'digit-first' && activeNumber) {
      return getCursorStyle(activeNumber, theme.accentHex);
    }
    return { cursor: 'pointer' }; // Default
  }, [inputMode, activeNumber, theme.accentHex]);

  if (!boardState || !initialBoard) return null;

  const highlightValue = activeNumber ?? (
    selectedCell && boardState[selectedCell.row][selectedCell.col] !== 0
      ? boardState[selectedCell.row][selectedCell.col]
      : null
  );

  return (
    <div 
      className="grid grid-cols-9 grid-rows-9 w-full max-w-lg aspect-square bg-white/5 border-2 border-white/20 rounded-xl overflow-hidden shadow-2xl select-none mx-auto isolate transform-gpu z-0"
      style={{ 
        WebkitBackfaceVisibility: "hidden", 
        WebkitTransform: "translate3d(0, 0, 0)",
        ...cursorStyle 
      }}
    >
      {boardState.map((row, rowIndex) =>
        row.map((cellValue, colIndex) => {
          
          const isFixed = initialBoard[rowIndex][colIndex] !== 0;
          const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
          const isError = errorCells.has(`${rowIndex}-${colIndex}`);
          const isSameValue = highlightValue !== null && cellValue === highlightValue && !isSelected;

          const isRelated = selectedCell 
            ? (selectedCell.row === rowIndex || selectedCell.col === colIndex) && !isSelected
            : false;

          let isFlashing = false;
          if (transientRegions) {
             const rKey = `row-${rowIndex}`;
             const cKey = `col-${colIndex}`;
             const bKey = `box-${Math.floor(rowIndex/3)}-${Math.floor(colIndex/3)}`;
             if (transientRegions.has(rKey) || transientRegions.has(cKey) || transientRegions.has(bKey)) {
                isFlashing = true;
             }
          }

          const isRightEdge = colIndex === 8;
          const isBottomEdge = rowIndex === 8;
          const isThickRight = (colIndex + 1) % 3 === 0 && !isRightEdge;
          const isThickBottom = (rowIndex + 1) % 3 === 0 && !isBottomEdge;

          const borderClasses = `
            ${!isRightEdge ? (isThickRight ? "border-r border-r-white/50" : "border-r border-r-white/10") : ""}
            ${!isBottomEdge ? (isThickBottom ? "border-b border-b-white/50" : "border-b border-b-white/10") : ""}
          `;

          const cellNotes = notes[`${rowIndex}-${colIndex}`] || [];

          return (
            <SudokuCell 
              key={`${rowIndex}-${colIndex}`}
              rowIndex={rowIndex}
              colIndex={colIndex}
              cellValue={cellValue}
              isFixed={isFixed}
              isSelected={isSelected}
              isError={isError}
              isSameValue={isSameValue}
              isRelated={isRelated}
              isFlashing={isFlashing}
              borderClasses={borderClasses}
              notes={cellNotes}
              textSize={textSize}
              theme={theme}
              onClick={handleProxyClick}
              onNote={handleProxyNote}
            />
          );
        })
      )}
    </div>
  );
}