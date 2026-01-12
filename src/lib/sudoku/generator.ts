// src/lib/sudoku/generator.ts

export type Grid = number[][];

// --- RNG UTILITIES ---

/**
 * Mulberry32 is a fast, deterministic pseudo-random number generator.
 * It takes a seed (number) and returns a function that generates numbers between 0 and 1.
 */
function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

/**
 * Converts a string (e.g. "2024-05-20") into a numeric seed.
 */
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Fisher-Yates Shuffle: Randomly shuffles an array using a specific RNG source.
 * This replaces 'sort(() => Math.random() - 0.5)' which is biased and not seedable.
 */
function shuffle<T>(array: T[], rng: () => number): T[] {
  let currentIndex = array.length, randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(rng() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
}

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
    if (count > 1) return true; // Stop early if ambiguous

    if (r === 9) {
      count++;
      return false; // Continue searching
    }

    const nextR = c === 8 ? r + 1 : r;
    const nextC = c === 8 ? 0 : c + 1;

    if (board[r][c] !== 0) {
      return solve(nextR, nextC);
    }

    for (let num = 1; num <= 9; num++) {
      if (isValid(board, r, c, num)) {
        board[r][c] = num;
        if (solve(nextR, nextC)) return true;
        board[r][c] = 0;
      }
    }
    return false;
  }

  solve(0, 0);
  return count;
}

// --- GENERATOR: Create a Full Valid Seed ---
// Now accepts an RNG function to support seeding
function fillBoard(board: number[][], rng: () => number): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        // Use Fisher-Yates shuffle with our specific RNG
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
        
        for (const num of nums) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board, rng)) return true;
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
// Accepts RNG to ensure the holes are removed in a deterministic order for daily challenges
function digHoles(solvedBoard: Grid, targetHoles: number, rng: () => number): { board: Grid, holesRemoved: number } {
  const board = solvedBoard.map(row => [...row]);
  let holesRemoved = 0;

  const positions = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push({ r, c });
    }
  }
  
  // Shuffle positions deterministically
  shuffle(positions, rng);

  for (const pos of positions) {
    if (holesRemoved >= targetHoles) break;

    const { r, c } = pos;
    const removedVal = board[r][c];
    
    board[r][c] = 0;

    // We clone the board for the solver so we don't mutate our working copy
    // Note: Solver doesn't need RNG, it just finds solutions logically
    const solutionsCount = countSolutions(board.map(row => [...row]));

    if (solutionsCount !== 1) {
      board[r][c] = removedVal; // Put it back
    } else {
      holesRemoved++;
    }
  }

  return { board, holesRemoved };
}

// --- MAIN EXPORT ---
// Added optional 'seed' parameter
export function generateSudoku(holes: number, seed?: string): { initial: Grid; solved: Grid } {
  let bestBoard: Grid | null = null;
  let bestSolved: Grid | null = null;
  let maxHolesFound = -1;

  // If a seed is provided (e.g. "2024-05-20"), use Mulberry32.
  // Otherwise, use standard Math.random.
  const rng = seed ? mulberry32(stringToSeed(seed)) : Math.random;

  // RETRY LOGIC:
  // For Daily Challenges (Seeded), we usually want to avoid retries that change the seed 
  // because that would break consistency. However, since fillBoard is deterministic 
  // with the *same* seed, running it multiple times yields the same result unless 
  // we advance the RNG state. 
  // By passing the *same* RNG instance, the state advances naturally on every call.
  
  const MAX_RETRIES = 5;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // 1. Create & Fill
    const initial = Array.from({ length: 9 }, () => Array(9).fill(0));
    fillBoard(initial, rng);
    const solved = initial.map(row => [...row]);

    // 2. Dig Holes
    const result = digHoles(solved, holes, rng);

    // 3. Success Check
    if (result.holesRemoved >= holes) {
      return { initial: result.board, solved };
    }

    // 4. Fallback Tracking
    if (result.holesRemoved > maxHolesFound) {
      maxHolesFound = result.holesRemoved;
      bestBoard = result.board;
      bestSolved = solved;
    }
  }

  return { 
    initial: bestBoard!, 
    solved: bestSolved! 
  };
}

// --- DAILY HELPER ---
// Standardizes the difficulty for daily challenges (usually 40-45 holes)
export function generateDailyBoard(dateStr: string) {
    // We use 45 holes for daily challenges to make it challenging but fair
    return generateSudoku(40, dateStr); 
}