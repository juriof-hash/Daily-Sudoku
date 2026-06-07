import React from 'react';
import { BoardState, GridSize, SelectedCell } from '../types';
import { getBoxDimensions } from '../sudoku';
import { cn } from '../lib/utils';

interface SudokuBoardProps {
  board: BoardState;
  size: GridSize;
  onChange: (r: number, c: number, val: number | null) => void;
  disabled: boolean;
  selectedCell: SelectedCell | null;
  onSelectCell: (r: number, c: number) => void;
}

export function SudokuBoard({ board, size, onChange, disabled, selectedCell, onSelectCell }: SudokuBoardProps) {
  const { r: boxR, c: boxC } = getBoxDimensions(size);

  const numBoxRows = size / boxR;
  const numBoxCols = size / boxC;

  return (
    <div className="print-only-board bg-white p-3 sm:p-5 md:p-6 rounded-3xl shadow-xl border border-slate-100 mx-auto w-fit">
      {/* Outer grid creates the thick lines between boxes */}
      <div 
        className="grid gap-[3px] sm:gap-[4px] bg-[#B0BAC5] rounded-xl overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${numBoxCols}, auto)`,
        }}
      >
        {Array.from({ length: numBoxRows }).map((_, br) => 
          Array.from({ length: numBoxCols }).map((_, bc) => (
            // Inner grid creates the thin lines between cells inside a box
            <div 
              key={`${br}-${bc}`}
              className="grid gap-[1px] bg-[#E2E6EF]"
              style={{
                gridTemplateColumns: `repeat(${boxC}, auto)`,
              }}
            >
              {Array.from({ length: boxR }).map((_, rr) => 
                Array.from({ length: boxC }).map((_, cc) => {
                  const r = br * boxR + rr;
                  const c = bc * boxC + cc;
                  const cell = board[r][c];
                  const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                  
                  return (
                    <div
                      key={`${r}-${c}`}
                      role="button"
                      tabIndex={cell.isInitial || disabled ? -1 : 0}
                      onClick={() => !disabled && !cell.isInitial && onSelectCell(r, c)}
                      onFocus={() => !disabled && !cell.isInitial && onSelectCell(r, c)}
                      onKeyDown={(e) => {
                        if (disabled || cell.isInitial) return;
                        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                          e.preventDefault();
                          let nr = r, nc = c;
                          if (e.key === 'ArrowUp') nr = Math.max(0, r - 1);
                          if (e.key === 'ArrowDown') nr = Math.min(size - 1, r + 1);
                          if (e.key === 'ArrowLeft') nc = Math.max(0, c - 1);
                          if (e.key === 'ArrowRight') nc = Math.min(size - 1, c + 1);
                          if (nr !== r || nc !== c) {
                            const nextCell = document.querySelector(`[data-cell="${nr}-${nc}"]`) as HTMLElement;
                            if (nextCell && nextCell.tabIndex === 0) {
                              nextCell.focus();
                            }
                            onSelectCell(nr, nc);
                          }
                        }
                      }}
                      data-cell={`${r}-${c}`}
                      className={cn(
                        "w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center text-xl md:text-2xl font-semibold outline-none transition-colors duration-200 ease-out",
                        "box-border m-0 select-none",
                        cell.isInitial ? "text-slate-800 bg-slate-50" : "text-mint-dark cursor-pointer",
                        !cell.isInitial && !isSelected ? "bg-white hover:bg-slate-100" : "",
                        !cell.isInitial && isSelected ? "bg-[#FFF9C4] ring-2 ring-mint ring-inset" : "",
                        cell.isValid === false && "bg-peach-light text-peach-dark animate-pulse",
                        cell.isValid === true && !cell.isInitial && "bg-mint text-white",
                        disabled && "cursor-default hover:bg-transparent"
                      )}
                    >
                      {cell.value || ''}
                    </div>
                  );
                })
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
