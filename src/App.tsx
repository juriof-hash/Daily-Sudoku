import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateSudoku, validateBoard } from './sudoku';
import { BoardState, GridSize, SelectedCell } from './types';
import { SudokuBoard } from './components/SudokuBoard';
import confetti from 'canvas-confetti';
import { Timer as TimerIcon, Printer, CheckCircle2, RotateCcw, Trophy, X } from 'lucide-react';

export default function App() {
  const [size, setSize] = useState<GridSize>(9);
  const [board, setBoard] = useState<BoardState>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const timerRef = useRef<number | null>(null);

  const startNewGame = useCallback((newSize: GridSize = size) => {
    setSize(newSize);
    setSelectedCell(null);
    
    // Adjust difficulty (number of holes) based on size
    let holes = 40; // Default 9x9
    if (newSize === 4) holes = 8;
    else if (newSize === 6) holes = 20;
    
    const { puzzle } = generateSudoku(newSize, holes);
    
    const newBoard: BoardState = puzzle.map(row => 
      row.map(val => ({
        value: val,
        isInitial: val !== null,
        isValid: undefined
      }))
    );
    
    setBoard(newBoard);
    setTime(0);
    setIsPlaying(true);
    setShowModal(false);
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTime(t => t + 1);
    }, 1000);
  }, [size]);

  useEffect(() => {
    startNewGame(9);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleCellChange = (r: number, c: number, val: number | null) => {
    if (!isPlaying) return;
    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      newBoard[r][c] = { ...newBoard[r][c], value: val, isValid: undefined };
      return newBoard;
    });
  };

  const handlePadClick = (val: number | null) => {
    if (!isPlaying || !selectedCell) return;
    const { row, col } = selectedCell;
    const cell = board[row]?.[col];
    if (cell && !cell.isInitial) {
      handleCellChange(row, col, val);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || !selectedCell) return;
      const { row, col } = selectedCell;
      const cell = board[row]?.[col];
      if (!cell || cell.isInitial) return;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        handleCellChange(row, col, null);
      } else if (e.key >= '1' && e.key <= size.toString()) {
        handleCellChange(row, col, parseInt(e.key, 10));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, selectedCell, size, board]);

  const handleCheck = () => {
    const currentValues = board.map(row => row.map(c => c.value));
    const { isComplete, errorCells } = validateBoard(currentValues, size);
    
    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      // Reset all non-initial validity
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!newBoard[r][c].isInitial) {
            newBoard[r][c].isValid = undefined;
          }
        }
      }
      
      // Mark errors
      for (const {r, c} of errorCells) {
        if (!newBoard[r][c].isInitial) {
          newBoard[r][c].isValid = false;
        }
      }
      
      return newBoard;
    });

    if (isComplete && errorCells.length === 0) {
      handleWin();
    }
  };

  const handleWin = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setShowModal(true);
    
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#4DD0E1', '#FF8A65', '#E8EAF6']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#4DD0E1', '#FF8A65', '#E8EAF6']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen py-8 px-4 flex flex-col items-center">
      {/* Header - No print */}
      <header className="no-print w-full max-w-4xl flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm mb-8 space-y-6 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-mint/20 rounded-2xl flex items-center justify-center">
            <Trophy className="text-mint-dark w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Daily Sudoku</h1>
            <p className="text-slate-500 font-medium text-sm">Pastel Edition</p>
          </div>
        </div>

        <div className="flex bg-lavender/50 p-1.5 rounded-2xl">
          {[4, 6, 9].map(s => (
            <button
              key={s}
              onClick={() => startNewGame(s as GridSize)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                size === s 
                  ? 'bg-white shadow-sm text-mint-dark' 
                  : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
              }`}
            >
              {s}x{s}
            </button>
          ))}
        </div>
      </header>

      {/* Main Game Area */}
      <main className="w-full flex-grow flex flex-col items-center justify-center relative">
        
        {/* Top bar over board */}
        <div className="no-print w-full max-w-2xl flex justify-between items-end mb-4 px-4">
          <div className="flex items-center space-x-2 text-slate-600 bg-white/60 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white">
            <TimerIcon className="w-5 h-5 text-mint" />
            <span className="font-mono text-lg font-medium tracking-wider">{formatTime(time)}</span>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-white text-slate-600 px-4 py-2 rounded-2xl font-medium shadow-sm hover:shadow hover:-translate-y-0.5 transition-all outline-none border border-transparent focus:border-mint"
              title="Print Board"
            >
              <Printer className="w-5 h-5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={() => startNewGame(size)}
              className="flex items-center space-x-2 bg-white text-slate-600 px-4 py-2 rounded-2xl font-medium shadow-sm hover:shadow hover:-translate-y-0.5 transition-all outline-none border border-transparent focus:border-mint"
              title="Reset Game"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Board */}
        {board.length > 0 && (
          <SudokuBoard 
            board={board} 
            size={size} 
            onChange={handleCellChange} 
            disabled={!isPlaying}
            selectedCell={selectedCell}
            onSelectCell={(row, col) => setSelectedCell({row, col})}
          />
        )}

        {/* Bottom Actions */}
        <div className="no-print mt-6 mb-8 w-full max-w-3xl px-2 sm:px-4 flex flex-col items-center">
          {/* Virtual Keypad */}
          <div className="flex flex-nowrap justify-center gap-1 sm:gap-2 mb-8 w-full">
            {Array.from({ length: size }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => handlePadClick(i + 1)}
                disabled={!isPlaying || !selectedCell}
                className="flex-1 aspect-square max-w-[64px] min-w-[32px] flex items-center justify-center bg-mint-light/40 text-mint-dark font-bold text-lg sm:text-xl md:text-2xl rounded-xl sm:rounded-2xl shadow-sm hover:-translate-y-[2px] hover:shadow-md hover:bg-mint-light/60 active:translate-y-[1px] active:scale-95 transition-all disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-sm disabled:cursor-not-allowed outline-none select-none"
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePadClick(null)}
              disabled={!isPlaying || !selectedCell}
              className="flex-1 aspect-square max-w-[64px] min-w-[32px] flex items-center justify-center bg-peach-light/40 text-peach-dark font-bold text-lg sm:text-xl md:text-2xl rounded-xl sm:rounded-2xl shadow-sm hover:-translate-y-[2px] hover:shadow-md hover:bg-peach-light/60 active:translate-y-[1px] active:scale-95 transition-all disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-sm disabled:cursor-not-allowed outline-none select-none"
              aria-label="Clear cell"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3px]" />
            </button>
          </div>

          <button
            onClick={handleCheck}
            disabled={!isPlaying}
            className="group relative flex items-center space-x-3 bg-mint-dark text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg overflow-hidden outline-none ring-offset-2 focus:ring-2 focus:ring-mint-dark"
          >
            <div className="absolute inset-0 bg-white/20 w-0 group-hover:w-full transition-all duration-300 ease-out"></div>
            <CheckCircle2 className="w-6 h-6 relative z-10" />
            <span className="relative z-10">Check Answer</span>
          </button>
        </div>

      </main>

      {/* Win Modal */}
      {showModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowModal(false)} />
          <div className="relative bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-300 ease-out">
            <div className="w-20 h-20 bg-mint-light/30 text-mint-dark rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Excellent!</h2>
            <p className="text-slate-600 mb-8 text-lg">You solved the {size}x{size} puzzle in <span className="font-bold text-mint-dark">{formatTime(time)}</span>.</p>
            
            <button
              onClick={() => startNewGame(size)}
              className="w-full bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-700 transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

