// src/lib/sudoku/generator.ts

export type Grid = number[][];

// --- UTILITY: Check if placing num at board[row][col] is valid ---
function isValid(board: number[][], row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    // Check Row & Column
    if (board[row][i] === num && i !== col) return false;
    if (board[i][col] === num && i !== row) return false;
    
    // Check 3x3 Box
    const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
    const boxCol = 3 * Math.floor(col / 3) + (i % 3);
    if (board[boxRow][boxCol] === num && (boxRow !== row || boxCol !== col)) return false;
  }
  return true;
}

// --- SOLVER: Count Number of Solutions (Capped at 2) ---
// Returns: 0 (impossible), 1 (unique), 2 (ambiguous/multiple)
function countSolutions(board: number[][]): number {
  let count = 0;

  function solve(r: number, c: number): boolean {
    // If we found more than 1 solution, stop immediately (optimization)
    if (count > 1) return true;

    // If we reached past the last row, we found a valid solution
    if (r === 9) {
      count++;
      return false; // Continue searching to see if there is a 2nd solution
    }

    const nextR = c === 8 ? r + 1 : r;
    const nextC = c === 8 ? 0 : c + 1;

    // Skip filled cells
    if (board[r][c] !== 0) {
      return solve(nextR, nextC);
    }

    // Try numbers 1-9
    for (let num = 1; num <= 9; num++) {
      if (isValid(board, r, c, num)) {
        board[r][c] = num;
        if (solve(nextR, nextC)) return true; // Early exit if >1 found
        board[r][c] = 0; // Backtrack
      }
    }
    return false;
  }

  // Use the board directly since the caller passes a clone now
  solve(0, 0);
  return count;
}

// --- GENERATOR: Create a Full Valid Seed ---
function fillBoard(board: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        // Randomize order of numbers to ensure unique puzzles every time
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        
        for (const num of nums) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// --- HELPER: Dig Holes ---
// Attempts to remove 'target' number of holes from the board
// Returns the carved board and the actual number of holes removed
function digHoles(solvedBoard: Grid, targetHoles: number): { board: Grid, holesRemoved: number } {
  const board = solvedBoard.map(row => [...row]);
  let holesRemoved = 0;

  // Generate list of all positions [0,0] to [8,8]
  const positions = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push({ r, c });
    }
  }
  
  // Shuffle positions to remove randomly
  positions.sort(() => Math.random() - 0.5);

  for (const pos of positions) {
    if (holesRemoved >= targetHoles) break;

    const { r, c } = pos;
    const removedVal = board[r][c];
    
    // Temporarily remove
    board[r][c] = 0;

    // CHECK: Is it still unique? 
    // Clone board for solver so we don't mutate our working copy
    const solutionsCount = countSolutions(board.map(row => [...row]));

    if (solutionsCount !== 1) {
      // Ambiguous or invalid -> Put it back
      board[r][c] = removedVal;
    } else {
      // Valid removal -> Keep it
      holesRemoved++;
    }
  }

  return { board, holesRemoved };
}

// --- MAIN EXPORT ---
export function generateSudoku(holes: number): { initial: Grid; solved: Grid } {
  let bestBoard: Grid | null = null;
  let bestSolved: Grid | null = null;
  let maxHolesFound = -1;

  // RETRY LOGIC:
  // If we can't carve enough holes, the seed might be too "rigid".
  // We try up to 5 times to generate a board that supports the requested difficulty.
  const MAX_RETRIES = 5;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // 1. Create Empty Board & Fill it
    const initial = Array.from({ length: 9 }, () => Array(9).fill(0));
    fillBoard(initial);
    const solved = initial.map(row => [...row]);

    // 2. Try to dig holes
    const result = digHoles(solved, holes);

    // 3. Check if we met the target
    if (result.holesRemoved >= holes) {
      // Perfect run! Return immediately.
      return { initial: result.board, solved };
    }

    // 4. Keep track of the best attempt so far (fallback)
    if (result.holesRemoved > maxHolesFound) {
      maxHolesFound = result.holesRemoved;
      bestBoard = result.board;
      bestSolved = solved;
    }
  }

  // If we exhaust retries, return the best we found (even if slightly easier than requested)
  // This prevents infinite loops or crashes.
  return { 
    initial: bestBoard!, 
    solved: bestSolved! 
  };
}