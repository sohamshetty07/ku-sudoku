import { generateSudoku } from "@/lib/sudoku/generator";

self.onmessage = (e: MessageEvent) => {
  const { type, holes, seed } = e.data;

  if (type === 'GENERATE') {
    // Perform the heavy calculation off the main thread
    const result = generateSudoku(holes, seed);
    
    // Send the result back to the UI
    self.postMessage({ type: 'GENERATED', result });
  }
};