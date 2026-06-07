export type GridSize = 4 | 6 | 9;

export interface CellData {
  value: number | null;
  isInitial: boolean;
  isValid?: boolean; // Undefined = neutral, true = correct (green), false = error (red)
}

export type BoardState = CellData[][];

export interface SelectedCell {
  row: number;
  col: number;
}
