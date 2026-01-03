// src/lib/sudoku/solver.ts

// A Grid is a 9x9 array of numbers. 0 represents an empty cell.
export type Grid = number[][];

/**
 * Checks if placing a number at board[row][col] is valid
 * according to Sudoku rules.
 */
export function isValid(board: Grid, row: number, col: number, num: number): boolean {
  
  // 1. Check the Row
  // We scan across the current 'row' to see if 'num' already exists.
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }

  // 2. Check the Column
  // We scan down the current 'col' to see if 'num' already exists.
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false;
  }

  // 3. Check the 3x3 Box
  // This involves a bit of math.
  // If we are at row 4, col 4, we are in the middle box.
  // The box starts at row 3, col 3.
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[startRow + i][startCol + j] === num) return false;
    }
  }

  // If it passed all three checks, the move is valid!
  return true;
}

/**
 * Solves the Sudoku board using the Backtracking algorithm.
 * WARNING: This modifies the 'board' array directly (in-place).
 * Returns true if solved, false if unsolvable.
 */
export function solveSudoku(board: Grid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      
      // 1. Find an empty cell (represented by 0)
      if (board[row][col] === 0) {
        
        // 2. Try numbers 1 through 9
        for (let num = 1; num <= 9; num++) {
          
          if (isValid(board, row, col, num)) {
            // 3. If valid, place the number
            board[row][col] = num;

            // 4. RECURSION: Try to solve the rest of the board
            // If the recursive call returns true, we found the solution!
            if (solveSudoku(board)) {
              return true;
            }

            // 5. BACKTRACK: If we hit a dead end later,
            // reset this cell to 0 and try the next number.
            board[row][col] = 0;
          }
        }
        
        // If we tried 1-9 and nothing worked, this path is dead.
        return false;
      }
    }
  }
  
  // If we loop through the whole board and find no zeros, it's solved!
  return true;
}

/**
 * Checks for conflicts for a specific cell.
 * Returns a Set of strings "row-col" representing all conflicting cells.
 */
export function getConflicts(board: Grid, row: number, col: number, num: number): Set<string> {
  const conflicts = new Set<string>();
  
  if (num === 0) return conflicts; // No conflicts for empty cells

  // 1. Check Row & Column
  for (let i = 0; i < 9; i++) {
    // Check Row
    if (board[row][i] === num && i !== col) {
      conflicts.add(`${row}-${i}`); // Add the conflicting cell
      conflicts.add(`${row}-${col}`); // Add the current cell (it is now in error)
    }
    // Check Column
    if (board[i][col] === num && i !== row) {
      conflicts.add(`${i}-${col}`);
      conflicts.add(`${row}-${col}`);
    }
  }

  // 2. Check 3x3 Box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const currentRow = startRow + i;
      const currentCol = startCol + j;
      
      if (board[currentRow][currentCol] === num && (currentRow !== row || currentCol !== col)) {
        conflicts.add(`${currentRow}-${currentCol}`);
        conflicts.add(`${row}-${col}`);
      }
    }
  }

  return conflicts;
}