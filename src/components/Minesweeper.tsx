/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Timer, Flag, Bomb, HelpCircle, Smile, Frown, Trophy, Sparkles } from 'lucide-react';
import { playSound } from '../utils/audio';
import { addScore, getHighScore } from '../utils/leaderboardHelper';

interface MinesweeperProps {
  username: string;
  soundEnabled: boolean;
  onScoreSubmitted: () => void;
}

interface Cell {
  r: number;
  c: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

const DIFFICULTIES = {
  easy: { name: '新手探雷 🟩', rows: 9, cols: 9, mines: 10, multiplier: 1 },
  medium: { name: '中级排雷 🟨', rows: 12, cols: 12, mines: 20, multiplier: 1.5 },
  expert: { name: '精锐对决 🟥', rows: 14, cols: 14, mines: 35, multiplier: 2.2 },
};

type DiffKey = keyof typeof DIFFICULTIES;

export default function Minesweeper({ username, soundEnabled, onScoreSubmitted }: MinesweeperProps) {
  const [difficulty, setDifficulty] = useState<DiffKey>('easy');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [minesCount, setMinesCount] = useState(0);
  const [flagsCount, setFlagsCount] = useState(0);
  const [time, setTime] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  
  // Mobile-friendly Flag Mode toggle
  const [flagMode, setFlagMode] = useState(false);
  
  const [firstClick, setFirstClick] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load high score
  useEffect(() => {
    setHighScore(getHighScore('minesweeper', username));
  }, [username]);

  // Game timer loop
  useEffect(() => {
    if (isPlaying && !gameOver && !isWinner) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, gameOver, isWinner]);

  // Initialize Board
  const initBoard = (selectedDiff: DiffKey = difficulty) => {
    playSound('click', soundEnabled);
    const config = DIFFICULTIES[selectedDiff];
    
    // Create empty cells
    const newGrid: Cell[][] = [];
    for (let r = 0; r < config.rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < config.cols; c++) {
        row.push({
          r,
          c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      newGrid.push(row);
    }

    setGrid(newGrid);
    setMinesCount(config.mines);
    setFlagsCount(0);
    setTime(0);
    setScore(0);
    setFirstClick(true);
    setGameOver(false);
    setIsWinner(false);
    setIsNewRecord(false);
    setIsPlaying(true);
  };

  // Generate Mines on board after first click
  const generateMinesAndNumbers = (currentGrid: Cell[][], startRow: number, startCol: number) => {
    const config = DIFFICULTIES[difficulty];
    const totalCells = config.rows * config.cols;
    const placedMines: { r: number; c: number }[] = [];
    
    // Plant mines avoiding first clicked cell and its direct neighbors
    while (placedMines.length < config.mines) {
      const r = Math.floor(Math.random() * config.rows);
      const c = Math.floor(Math.random() * config.cols);
      
      // Keep safety circle: first clicked block and its immediate 8 neighbors should NOT have mines
      const isStartArea = Math.abs(r - startRow) <= 1 && Math.abs(c - startCol) <= 1;
      const alreadyHasMine = currentGrid[r][c].isMine;
      
      if (!isStartArea && !alreadyHasMine) {
        currentGrid[r][c].isMine = true;
        placedMines.push({ r, c });
      }
    }

    // Compute neighbor mine count
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (currentGrid[r][c].isMine) continue;
        
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
              if (currentGrid[nr][nc].isMine) count++;
            }
          }
        }
        currentGrid[r][c].neighborMines = count;
      }
    }
  };

  // Safe Reveal adjacent cells recursively (Flood Fill)
  const revealCell = (currentGrid: Cell[][], r: number, c: number) => {
    const config = DIFFICULTIES[difficulty];
    if (r < 0 || r >= config.rows || c < 0 || c >= config.cols) return;
    
    const cell = currentGrid[r][c];
    if (cell.isRevealed || cell.isFlagged) return;

    cell.isRevealed = true;

    // Expand empty blocks
    if (cell.neighborMines === 0 && !cell.isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          revealCell(currentGrid, r + dr, c + dc);
        }
      }
    }
  };

  // Perform a Left Click Action to reveal
  const handleCellClick = (r: number, c: number) => {
    if (!isPlaying || gameOver || isWinner) return;

    const updatedGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    const cell = updatedGrid[r][c];

    if (cell.isRevealed) return;

    // If Flag Mode is ON, toggle flag instead
    if (flagMode) {
      handleToggleFlag(r, c);
      return;
    }

    if (cell.isFlagged) return;

    // First Click Safety Guard
    if (firstClick) {
      setFirstClick(false);
      generateMinesAndNumbers(updatedGrid, r, c);
      revealCell(updatedGrid, r, c);
      setGrid(updatedGrid);
      playSound('flip', soundEnabled);
      return;
    }

    // Hit a Mine -> Game Over
    if (cell.isMine) {
      revealAllMines(updatedGrid, false);
      setGrid(updatedGrid);
      handleGameOver();
      return;
    }

    // Standard reveal
    revealCell(updatedGrid, r, c);
    playSound('flip', soundEnabled);
    
    // Check Win Condition
    checkWinCondition(updatedGrid);
  };

  // Toggle Flag on cell
  const handleToggleFlag = (r: number, c: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault(); // Prevent browser right-click context menu
    }
    if (!isPlaying || gameOver || isWinner) return;

    const updatedGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    const cell = updatedGrid[r][c];

    if (cell.isRevealed) return;

    // Toggle Flag state
    const nextFlagged = !cell.isFlagged;
    
    // Check maximum flag limit
    const config = DIFFICULTIES[difficulty];
    if (nextFlagged && flagsCount >= config.mines) {
      // cannot add more flags than available mines
      return;
    }

    cell.isFlagged = nextFlagged;
    setFlagsCount((f) => f + (nextFlagged ? 1 : -1));
    setGrid(updatedGrid);
    playSound('click', soundEnabled);
  };

  // Reveal all mines on board
  const revealAllMines = (currentGrid: Cell[][], won: boolean) => {
    currentGrid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.isMine) {
          cell.isRevealed = true;
        }
      });
    });
  };

  // Check if player successfully defused or avoided all mines
  const checkWinCondition = (currentGrid: Cell[][]) => {
    const config = DIFFICULTIES[difficulty];
    let revealedCount = 0;
    const totalNonMines = config.rows * config.cols - config.mines;

    currentGrid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.isRevealed && !cell.isMine) {
          revealedCount++;
        }
      });
    });

    if (revealedCount === totalNonMines) {
      handleWin(currentGrid);
    } else {
      setGrid(currentGrid);
    }
  };

  // Game Win State
  const handleWin = (finalGrid: Cell[][]) => {
    setIsWinner(true);
    revealAllMines(finalGrid, true);
    setGrid(finalGrid);
    playSound('match', soundEnabled);

    // Score calculation
    // Base score based on difficulty and time spent
    const config = DIFFICULTIES[difficulty];
    const baseScore = config.mines * 30;
    const speedBonus = Math.max(500 - time * 2, 50);
    const finalScore = Math.round((baseScore + speedBonus) * config.multiplier);
    setScore(finalScore);

    // Save Score
    const previousHighScore = getHighScore('minesweeper', username);
    addScore('minesweeper', username, finalScore);

    if (finalScore > previousHighScore && finalScore > 0) {
      setIsNewRecord(true);
      setHighScore(finalScore);
    }
    onScoreSubmitted();
  };

  // Game Over State
  const handleGameOver = () => {
    setGameOver(true);
    playSound('gameover', soundEnabled);
  };

  // Format digital timers
  const formatTimer = (secs: number) => {
    return secs.toString().padStart(3, '0');
  };

  // Colors for cell numbers
  const getNumberColor = (num: number) => {
    switch (num) {
      case 1: return 'text-indigo-400 font-bold';
      case 2: return 'text-emerald-400 font-bold';
      case 3: return 'text-rose-400 font-bold';
      case 4: return 'text-purple-400 font-bold';
      case 5: return 'text-amber-400 font-bold';
      case 6: return 'text-cyan-400 font-bold';
      case 7: return 'text-orange-400 font-bold';
      default: return 'text-pink-400 font-black';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center justify-center py-2 animate-fade-in" id="minesweeper-screen">
      {/* Game Board Column */}
      <div className="flex flex-col items-center">
        {/* Retro Header Stats Panel */}
        <div className="flex items-center justify-between w-full max-w-[460px] mb-4 bg-slate-950/80 px-4 py-3 rounded-2xl border border-slate-800" id="minesweeper-header-stats">
          
          {/* Flags remaining indicator */}
          <div className="flex flex-col items-start bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
            <span className="text-[9px] text-slate-500 font-mono">BOMBS / FLAGS</span>
            <div className="flex items-center gap-1 text-rose-400 font-mono font-bold text-lg">
              <Bomb className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>{minesCount - flagsCount}</span>
            </div>
          </div>

          {/* Smiley Face restart button */}
          <button
            onClick={() => initBoard(difficulty)}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/30 flex items-center justify-center text-xl transition-all hover:scale-105 active:scale-95 shadow-md"
            title="重开一局"
            id="minesweeper-smiley-btn"
          >
            {gameOver ? <Frown className="w-5 h-5 text-rose-400" /> : isWinner ? <Smile className="w-5 h-5 text-amber-400" /> : <Smile className="w-5 h-5 text-indigo-400" />}
          </button>

          {/* Elapsed Time indicator */}
          <div className="flex flex-col items-end bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
            <span className="text-[9px] text-slate-500 font-mono">TIME SPENT</span>
            <div className="flex items-center gap-1 text-cyan-400 font-mono font-bold text-lg">
              <Timer className="w-4 h-4 text-cyan-500" />
              <span>{formatTimer(time)}</span>
            </div>
          </div>
        </div>

        {/* Minesweeper Grid Card Container */}
        <div className="relative p-4 bg-slate-950 rounded-3xl border border-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.06)] flex flex-col items-center justify-center">
          
          {/* Main Board Grid */}
          <div 
            className="grid gap-1.5" 
            style={{ 
              gridTemplateColumns: `repeat(${DIFFICULTIES[difficulty].cols}, minmax(0, 1fr))`,
              width: difficulty === 'easy' ? '320px' : difficulty === 'medium' ? '380px' : '440px',
              height: difficulty === 'easy' ? '320px' : difficulty === 'medium' ? '380px' : '440px',
            }}
            id="minesweeper-grid"
          >
            {grid.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                let cellStyle = 'w-full h-full rounded-lg flex items-center justify-center text-sm font-black transition-all duration-200 select-none cursor-pointer ';
                
                if (cell.isRevealed) {
                  if (cell.isMine) {
                    cellStyle += 'bg-rose-500/25 border border-rose-500/40 text-rose-400 shadow-inner animate-shake';
                  } else {
                    cellStyle += 'bg-slate-900 border border-slate-850 text-slate-100 shadow-inner';
                  }
                } else {
                  // Unrevealed state
                  cellStyle += 'bg-slate-800 border border-slate-700/60 hover:bg-slate-700/80 active:scale-95 hover:border-indigo-400/30 ';
                  if (cell.isFlagged) {
                    cellStyle += 'shadow-[0_0_8px_rgba(239,68,68,0.15)]';
                  }
                }

                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => handleCellClick(cell.r, cell.c)}
                    onContextMenu={(e) => handleToggleFlag(cell.r, cell.c, e)}
                    className={cellStyle}
                  >
                    {cell.isRevealed ? (
                      cell.isMine ? (
                        <Bomb className="w-4 h-4 text-rose-400" />
                      ) : cell.neighborMines > 0 ? (
                        <span className={getNumberColor(cell.neighborMines)}>
                          {cell.neighborMines}
                        </span>
                      ) : (
                        ''
                      )
                    ) : cell.isFlagged ? (
                      <Flag className="w-3.5 h-3.5 text-rose-500 fill-rose-500/10 animate-pulse" />
                    ) : (
                      ''
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Start Screen Overlay */}
          {!isPlaying && !gameOver && !isWinner && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-3xl">
              <div className="w-16 h-16 rounded-full bg-indigo-500/15 flex items-center justify-center text-indigo-400 border border-indigo-500/30 mb-4 animate-bounce">
                <Bomb className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-wide mb-1">经典扫雷</h3>
              <p className="text-xs text-slate-400 max-w-[280px] mb-6">
                避开地雷，解开格子！点击排雷，右键（或开启插旗模式）插旗锁定地雷。首发点击绝对安全！
              </p>
              
              <button
                onClick={() => initBoard(difficulty)}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-400 hover:to-cyan-500 text-slate-950 font-black px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300 scale-100 hover:scale-105 active:scale-95 text-sm"
                id="start-minesweeper-btn"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                排雷开始
              </button>
            </div>
          )}

          {/* Win Screen Overlay */}
          {isWinner && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-3xl border-2 border-indigo-500/30 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/30 mb-4">
                <Trophy className="w-8 h-8 text-emerald-400" />
              </div>
              
              {isNewRecord && (
                <div className="animate-pulse mb-1">
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono tracking-wider font-bold px-2.5 py-1 rounded-full uppercase">
                    ✨ NEW HIGH SCORE ✨
                  </span>
                </div>
              )}

              <h3 className="text-3xl font-black text-emerald-400 mb-1">地雷全部清除！</h3>
              <p className="text-slate-400 text-sm mb-4">排雷英雄！你仅用了 <span className="font-mono text-cyan-400 font-bold">{time}秒</span></p>
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-3.5 mb-6 shadow-inner">
                <div className="text-3xl font-black font-mono text-indigo-400">{score.toLocaleString()}</div>
                <div className="text-xs text-slate-500 font-mono mt-1">分数已自动记录至排行榜</div>
              </div>

              <button
                onClick={() => initBoard(difficulty)}
                className="flex items-center gap-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
                id="win-replay-sweeper-btn"
              >
                <RotateCcw className="w-4 h-4" />
                再玩一局
              </button>
            </div>
          )}

          {/* Game Over Screen Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-3xl animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/30 mb-4">
                <HelpCircle className="w-8 h-8 text-rose-400" />
              </div>

              <h3 className="text-3xl font-black text-rose-500 mb-1">BOOM! 触发触雷</h3>
              <p className="text-slate-400 text-sm mb-4">你触碰到了隐藏的电子诡雷！游戏结束</p>
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-3 mb-6 shadow-inner">
                <p className="text-xs text-slate-400">本次排雷用时：<span className="text-rose-400 font-bold">{time}秒</span></p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">请重整旗鼓，下次注意计算周边数字！</p>
              </div>

              <button
                onClick={() => initBoard(difficulty)}
                className="flex items-center gap-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
                id="replay-sweeper-btn"
              >
                <RotateCcw className="w-4 h-4" />
                重置挑战
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Side Control Panel */}
      <div className="flex flex-col items-center w-full max-w-[340px]" id="minesweeper-sidebar">
        
        {/* Flag Mode Button Toggle (Critical for Touchscreens / Trackpads) */}
        <div className="w-full bg-slate-950/70 border border-slate-800 p-5 rounded-3xl shadow-xl mb-4">
          <div className="text-[10px] font-mono text-slate-500 tracking-wider uppercase mb-3 text-center">操作模式切换 (触屏推荐)</div>
          
          <button
            onClick={() => setFlagMode(!flagMode)}
            className={`w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-sm font-semibold transition-all duration-300 ${
              flagMode
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
            }`}
            id="toggle-flag-mode-btn"
          >
            <Flag className={`w-4 h-4 ${flagMode ? 'animate-bounce' : ''}`} />
            <span>当前模式: {flagMode ? '【标记插旗】' : '【点击挖开】'}</span>
          </button>
        </div>

        {/* Difficulty Selection */}
        <div className="w-full bg-slate-950/70 border border-slate-800 p-5 rounded-3xl shadow-xl">
          <div className="text-[10px] font-mono text-slate-500 tracking-wider uppercase mb-3 text-center">难度与关卡选择</div>
          
          <div className="space-y-2" id="minesweeper-difficulty-group">
            {(Object.keys(DIFFICULTIES) as DiffKey[]).map((key) => {
              const diff = DIFFICULTIES[key];
              const isSelected = difficulty === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setDifficulty(key);
                    if (isPlaying) {
                      initBoard(key);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-sm font-semibold transition-all duration-300 ${
                    isSelected
                      ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-200'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700/60'
                  }`}
                  id={`diff-btn-${key}`}
                >
                  <span>{diff.name}</span>
                  <span className="text-[10px] font-mono text-slate-500">{diff.mines}雷 ({diff.rows}x{diff.cols})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tips Box */}
        <div className="w-full bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 mt-4 text-xs text-slate-400">
          <h4 className="text-xs font-bold text-slate-300 tracking-wider uppercase mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            高级探雷技巧
          </h4>
          <p className="leading-relaxed">
            1. <b>首点安全</b>：你的第一枪永远是空格子，不用担心直接踩雷。<br />
            2. 数字代表<b>相邻八格</b>中的诡雷数量。合理利用排除法插旗子标记它。<br />
            3. 如果玩起来有点卡，可以把浏览器窗口或缩放调至适合尺寸。
          </p>
        </div>
      </div>
    </div>
  );
}
