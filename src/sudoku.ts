import { GridSize } from './types';

// Dimensions of a sub-box for a given grid size.
export function getBoxDimensions(size: GridSize) {
  if (size === 4) return { r: 2, c: 2 };
  if (size === 6) return { r: 2, c: 3 };
  if (size === 9) return { r: 3, c: 3 };
  throw new Error("Invalid size");
}

export function isValidPlacement(grid: (number | null)[][], row: number, col: number, num: number, size: GridSize): boolean {
  // Check row
  for (let x = 0; x < size; x++) {
    if (grid[row][x] === num) return false;
  }
  // Check col
  for (let x = 0; x < size; x++) {
    if (grid[x][col] === num) return false;
  }
  // Check box
  const { r: boxR, c: boxC } = getBoxDimensions(size);
  const startRow = row - (row % boxR);
  const startCol = col - (col % boxC);
  
  for (let i = 0; i < boxR; i++) {
    for (let j = 0; j < boxC; j++) {
      if (grid[i + startRow][j + startCol] === num) return false;
    }
  }
  
  return true;
}

// Backtracking solver to fill the grid.
export function solveGrid(grid: (number | null)[][], size: GridSize): boolean {
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (grid[row][col] === null) {
        // Try digits in random order for variety
        const digits = Array.from({ length: size }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
        for (const num of digits) {
          if (isValidPlacement(grid, row, col, num, size)) {
            grid[row][col] = num;
            if (solveGrid(grid, size)) {
              return true;
            }
            grid[row][col] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
}

export function generateSudoku(size: GridSize, numHoles: number): { solution: number[][], puzzle: (number | null)[][] } {
  // 1. Create empty grid
  const grid: (number | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  
  // 2. Solve to get a complete valid grid
  solveGrid(grid, size);
  const solution = grid.map(row => [...row]) as number[][];
  
  // 3. Remove elements to create puzzle
  let holes = 0;
  let attempts = size * size;
  
  while (holes < numHoles && attempts > 0) {
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);
    
    if (grid[row][col] !== null) {
      grid[row][col] = null;
      holes++;
    }
    attempts--;
  }
  
  return { solution, puzzle: grid };
}

export function validateBoard(
  current: (number | null)[][],
  size: GridSize
): { isComplete: boolean, errorCells: {r: number, c: number}[] } {
  const errorCells: {r: number, c: number}[] = [];
  let isComplete = true;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const val = current[row][col];
      if (val === null) {
        isComplete = false;
        continue;
      }
      
      // Temporarily clear the cell to check if its placement is valid among others
      current[row][col] = null;
      const valid = isValidPlacement(current, row, col, val, size);
      current[row][col] = val; // restore
      
      if (!valid) {
        errorCells.push({ r: row, c: col });
      }
    }
  }
  
  return {
    isComplete: isComplete && errorCells.length === 0,
    errorCells
  };
}
