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
// This is the "Uniqueness Checker".
// Returns: 0 (impossible), 1 (unique), 2 (ambiguous/multiple)
function countSolutions(board: number[][]): number {
  let count = 0;

  function solve(r: number, c: number): boolean {
    // If we reached past the last row, we found a valid solution
    if (r === 9) {
      count++;
      return count > 1; // Stop searching if we found more than 1 solution
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

  // Create a copy to solve so we don't mutate the checked board reference
  const boardCopy = board.map(row => [...row]);
  solve(0, 0);
  return count;
}

// --- GENERATOR: Create a Full Valid Seed ---
// Uses backtracking to fill an empty board completely
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

// --- MAIN EXPORT ---
export function generateSudoku(holes: number): { initial: Grid; solved: Grid } {
  // 1. Create Empty Board
  const initial = Array.from({ length: 9 }, () => Array(9).fill(0));

  // 2. Fill it completely (The "Solution")
  fillBoard(initial);
  
  // Clone the solution to keep as our Answer Key
  const solved = initial.map(row => [...row]);

  // 3. Remove numbers (Carve holes) WITH Uniqueness Check
  let attempts = holes;
  
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
    if (attempts <= 0) break;

    const { r, c } = pos;
    const removedVal = initial[r][c];
    
    // Temporarily remove the number
    initial[r][c] = 0;

    // CHECK: Does this board still have exactly 1 solution?
    // We clone 'initial' because countSolutions mutates its input during recursion
    const solutionsCount = countSolutions(initial.map(row => [...row]));

    if (solutionsCount !== 1) {
      // If 0 solutions (error) or >1 (ambiguous), put the number back!
      initial[r][c] = removedVal;
    } else {
      // Valid removal (still unique), count it as a hole
      attempts--;
    }
  }

  return { initial, solved };
}