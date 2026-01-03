import { isValid, solveSudoku, type Grid } from "./solver";

// Helper: Generates an empty 9x9 grid
function getEmptyGrid(): Grid {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

// Helper: Shuffles an array (Fisher-Yates algorithm)
// We need this to randomize which numbers we try, ensuring unique puzzles.
function shuffle(array: number[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * 1. THE SEED
 * Fills the diagonal 3x3 boxes first (independent of each other),
 * then solves the rest to create a valid complete board.
 */
function generateFullBoard(): Grid {
  const board = getEmptyGrid();

  // Step A: Fill the 3 diagonal boxes (Top-Left, Center, Bottom-Right)
  // Because they don't share rows/cols, we can fill them randomly without checks.
  for (let i = 0; i < 9; i = i + 3) {
    fillBox(board, i, i);
  }

  // Step B: Solve the rest of the board to make it valid
  solveSudoku(board); // We use our existing solver!
  
  return board;
}

// Fills a 3x3 box with random unique numbers 1-9
function fillBox(board: Grid, startRow: number, startCol: number) {
  let num = 0;
  // Create array [1..9] and shuffle it
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      board[startRow + i][startCol + j] = nums[num];
      num++;
    }
  }
}

/**
 * 2. THE CARVER
 * Removes 'k' numbers from the board to create the puzzle.
 * @param difficulty - How many numbers to remove (e.g., 40 for Easy)
 */
export function generateSudoku(difficulty: number = 40): { initial: Grid; solved: Grid } {
  // 1. Generate a complete, valid solution
  const solved = generateFullBoard();

  // 2. Clone it so we don't mess up the solution reference
  // (In JS, arrays are passed by reference, so we need a deep copy)
  const initial = solved.map((row) => [...row]);

  // 3. Remove numbers
  let attempts = difficulty;
  while (attempts > 0) {
    let row = Math.floor(Math.random() * 9);
    let col = Math.floor(Math.random() * 9);

    // If strictly adhering to PDD "Unique Solution" check, 
    // we would run a solver here to ensure removing this doesn't create ambiguity.
    // For this Phase 2.1 "Hello World" of logic, we will just remove it.
    
    if (initial[row][col] !== 0) {
      initial[row][col] = 0; // 0 represents an empty cell
      attempts--;
    }
  }

  return { initial, solved };
}