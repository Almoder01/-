/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Undo2, Award, Info, Smile } from 'lucide-react';
import { playSound } from '../utils/audio';
import { addScore, getHighScore } from '../utils/leaderboardHelper';

interface Game2048Props {
  username: string;
  soundEnabled: boolean;
  onScoreSubmitted: () => void;
}

type Board = number[][];

interface GameHistory {
  board: Board;
  score: number;
}

export default function Game2048({ username, soundEnabled, onScoreSubmitted }: Game2048Props) {
  const [board, setBoard] = useState<Board>([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [hasWonBefore, setHasWonBefore] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Load high score
  useEffect(() => {
    setHighScore(getHighScore('game2048', username));
  }, [username]);

  // Init/Restart Board
  const initGame = () => {
    playSound('click', soundEnabled);
    let newBoard = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    // Spawn two tiles
    newBoard = spawnTile(newBoard);
    newBoard = spawnTile(newBoard);
    
    setBoard(newBoard);
    setScore(0);
    setHistory([]);
    setGameOver(false);
    setIsWinner(false);
    setHasWonBefore(false);
    setIsNewRecord(false);
    setIsPlaying(true);
  };

  // Helper to spawn a 2 or 4 in a random empty cell
  const spawnTile = (currentBoard: Board): Board => {
    const copy = currentBoard.map((row) => [...row]);
    const emptyCells: { r: number; c: number }[] = [];

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (copy[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }

    if (emptyCells.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      const { r, c } = emptyCells[randomIndex];
      copy[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
    return copy;
  };

  // Save state for undo function
  const pushToHistory = (currentBoard: Board, currentScore: number) => {
    const backupBoard = currentBoard.map((row) => [...row]);
    setHistory((prev) => [...prev, { board: backupBoard, score: currentScore }]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    playSound('click', soundEnabled);
    const prev = history[history.length - 1];
    setBoard(prev.board);
    setScore(prev.score);
    setHistory((prevHistory) => prevHistory.slice(0, prevHistory.length - 1));
    setGameOver(false);
    setIsWinner(false);
  };

  // Check if moves are possible
  const canMove = (currentBoard: Board): boolean => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] === 0) return true;
        if (c < 3 && currentBoard[r][c] === currentBoard[r][c + 1]) return true;
        if (r < 3 && currentBoard[r][c] === currentBoard[r + 1][c]) return true;
      }
    }
    return false;
  };

  // Slide logic for rows (Left direction as baseline)
  const slideRowLeft = (row: number[]): { newRow: number[]; gainedScore: number; merged: boolean } => {
    // 1. Filter out zeros
    const filtered = row.filter((num) => num !== 0);
    const newRow: number[] = [];
    let gainedScore = 0;
    let merged = false;

    // 2. Combine equal adjacent tiles
    let i = 0;
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        const combined = filtered[i] * 2;
        newRow.push(combined);
        gainedScore += combined;
        merged = true;
        i += 2;
      } else {
        newRow.push(filtered[i]);
        i++;
      }
    }

    // 3. Pad with zeros to keep length 4
    while (newRow.length < 4) {
      newRow.push(0);
    }

    return { newRow, gainedScore, merged };
  };

  // Rotate Board 90 degrees clockwise (helps simplify coding other directions)
  const rotateClockwise = (currentBoard: Board): Board => {
    const size = 4;
    const rotated = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        rotated[c][size - 1 - r] = currentBoard[r][c];
      }
    }
    return rotated;
  };

  // Main slide driver
  const move = (direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN') => {
    if (gameOver || !isPlaying) return;

    let tempBoard = board.map((row) => [...row]);
    let numRotations = 0;

    // Transform directions to LEFT by rotating
    switch (direction) {
      case 'LEFT':
        numRotations = 0;
        break;
      case 'UP':
        numRotations = 3; // 270 deg
        break;
      case 'RIGHT':
        numRotations = 2; // 180 deg
        break;
      case 'DOWN':
        numRotations = 1; // 90 deg
        break;
    }

    // Rotate board to face left
    for (let i = 0; i < numRotations; i++) {
      tempBoard = rotateClockwise(tempBoard);
    }

    // Slide and combine left
    let totalGained = 0;
    let anyMerged = false;
    let boardChanged = false;

    for (let r = 0; r < 4; r++) {
      const { newRow, gainedScore, merged } = slideRowLeft(tempBoard[r]);
      if (gainedScore > 0) totalGained += gainedScore;
      if (merged) anyMerged = true;
      if (JSON.stringify(tempBoard[r]) !== JSON.stringify(newRow)) {
        boardChanged = true;
      }
      tempBoard[r] = newRow;
    }

    // Rotate board back to its original orientation
    const reverseRotations = (4 - numRotations) % 4;
    for (let i = 0; i < reverseRotations; i++) {
      tempBoard = rotateClockwise(tempBoard);
    }

    // Process result
    if (boardChanged) {
      // Save for Undo
      pushToHistory(board, score);

      // Apply new board and score
      let finalBoard = spawnTile(tempBoard);
      const newScore = score + totalGained;
      setBoard(finalBoard);
      setScore(newScore);

      // Play sound
      if (anyMerged) {
        playSound('score2048', soundEnabled);
      } else {
        playSound('move', soundEnabled);
      }

      // Check Win Condition (tile 2048)
      if (!hasWonBefore) {
        const win = finalBoard.some((row) => row.some((tile) => tile === 2048));
        if (win) {
          setIsWinner(true);
          setHasWonBefore(true);
          playSound('gold', soundEnabled);
        }
      }

      // Check Game Over Condition
      if (!canMove(finalBoard)) {
        handleGameOver(finalBoard, newScore);
      }
    }
  };

  const handleGameOver = (finalBoard: Board, finalScore: number) => {
    setGameOver(true);
    playSound('gameover', soundEnabled);

    // Save score to leaderboard
    const previousHighScore = getHighScore('game2048', username);
    addScore('game2048', username, finalScore);

    if (finalScore > previousHighScore && finalScore > 0) {
      setIsNewRecord(true);
      setHighScore(finalScore);
    }
    onScoreSubmitted();
  };

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          move('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          move('RIGHT');
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          move('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          move('DOWN');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, score, isPlaying, gameOver, soundEnabled, hasWonBefore]);

  // Styling helper for tile values
  const getTileStyles = (val: number): string => {
    if (val === 0) return 'bg-slate-900/60 border border-slate-800/40';

    const base = 'flex flex-col items-center justify-center font-black rounded-2xl shadow-md select-none transition-all duration-200 animate-scale-up';
    
    switch (val) {
      case 2: return `${base} bg-slate-800 text-slate-100 text-2xl border border-slate-700/60 shadow-[0_0_10px_rgba(255,255,255,0.03)]`;
      case 4: return `${base} bg-slate-700 text-orange-200 text-2xl border border-orange-500/10`;
      case 8: return `${base} bg-orange-600 text-white text-2xl shadow-[0_0_12px_rgba(234,88,12,0.15)]`;
      case 16: return `${base} bg-amber-600 text-white text-2xl shadow-[0_0_12px_rgba(217,119,6,0.2)]`;
      case 32: return `${base} bg-rose-600 text-white text-2xl shadow-[0_0_15px_rgba(225,29,72,0.25)]`;
      case 64: return `${base} bg-red-600 text-white text-2xl shadow-[0_0_15px_rgba(220,38,38,0.3)]`;
      case 128: return `${base} bg-yellow-500 text-slate-950 text-2xl border border-yellow-300/30 shadow-[0_0_18px_rgba(234,179,8,0.35)]`;
      case 256: return `${base} bg-yellow-400 text-slate-950 text-2xl border border-yellow-200/50 shadow-[0_0_20px_rgba(250,204,21,0.45)] font-extrabold`;
      case 512: return `${base} bg-emerald-500 text-white text-2xl border border-emerald-400/40 shadow-[0_0_22px_rgba(16,185,129,0.4)]`;
      case 1024: return `${base} bg-cyan-500 text-slate-950 text-xl border border-cyan-400/40 shadow-[0_0_25px_rgba(6,182,212,0.5)]`;
      case 2048: return `${base} bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white text-xl animate-pulse shadow-[0_0_30px_rgba(168,85,247,0.7)] border border-purple-400`;
      default: return `${base} bg-gradient-to-r from-red-600 to-rose-600 text-white text-lg border border-red-500 shadow-[0_0_35px_rgba(225,29,72,0.8)]`;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center justify-center py-2 animate-fade-in" id="game2048-screen">
      {/* Game Stage Area */}
      <div className="flex flex-col items-center">
        {/* Scores & Buttons */}
        <div className="flex items-center justify-between w-full max-w-[340px] sm:max-w-[380px] mb-4 bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800" id="game2048-stats-header">
          <div>
            <div className="text-[10px] font-mono text-slate-500">SCORE</div>
            <div className="text-xl font-black font-mono text-amber-400">{score}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                history.length > 0
                  ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800 hover:border-amber-500/30 active:scale-95 cursor-pointer'
                  : 'bg-slate-950 border-slate-900 text-slate-700 cursor-not-allowed'
              }`}
              title="悔一步 (撤销上一动)"
              id="btn-undo-move"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-500">MY HIGH SCORE</div>
            <div className="text-lg font-black font-mono text-slate-300">{highScore}</div>
          </div>
        </div>

        {/* 4x4 Puzzle grid viewport */}
        <div className="relative w-[340px] h-[340px] sm:w-[380px] sm:h-[380px] p-3.5 bg-slate-950 rounded-3xl border border-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.08)] flex items-center justify-center">
          
          {/* Grid Blocks */}
          <div className="grid grid-cols-4 grid-rows-4 gap-2.5 w-full h-full" id="puzzle-grid-blocks">
            {board.map((row, rIdx) =>
              row.map((val, cIdx) => (
                <div key={`${rIdx}-${cIdx}`} className={getTileStyles(val)}>
                  {val > 0 && (
                    <span className="font-extrabold tracking-tight scale-100 hover:scale-110 transition-transform">
                      {val}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Intro Screen Overlay */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-3xl">
              <div className="w-16 h-16 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400 border border-amber-500/30 mb-4 animate-bounce">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-wide mb-1">2048 智力拼图</h3>
              <p className="text-xs text-slate-400 max-w-[280px] mb-6">
                使用方向键或 <span className="text-amber-400 font-bold font-mono">W A S D</span> 滑动拼图，合并相同数字以达成极客之证：2048！
              </p>
              
              <button
                onClick={initGame}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-300 scale-100 hover:scale-105 active:scale-95 text-sm"
                id="start-2048-btn"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                启动大脑
              </button>
            </div>
          )}

          {/* Winner Midgame Overlay (Allows infinite play) */}
          {isWinner && (
            <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-3xl border-2 border-amber-400 animate-fade-in z-20">
              <h3 className="text-3xl font-black text-amber-300 drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">🎉 达成 2048！</h3>
              <p className="text-white text-xs max-w-[240px] mt-1 mb-6 drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]">
                你太强了！你可以现在收手，也可以挑战更高级别的 4096 极星！
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsWinner(false)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition-colors"
                  id="btn-continue-2048"
                >
                  继续无限挑战
                </button>
                <button
                  onClick={initGame}
                  className="bg-slate-900/90 hover:bg-slate-900 border border-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors"
                  id="btn-restart-2048"
                >
                  重开一局
                </button>
              </div>
            </div>
          )}

          {/* Game Over Screen Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-3xl animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/30 mb-4">
                <Info className="w-8 h-8" />
              </div>
              
              {isNewRecord ? (
                <div className="animate-pulse mb-1">
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono tracking-wider font-bold px-2.5 py-1 rounded-full uppercase">
                    ✨ NEW HIGH SCORE ✨
                  </span>
                </div>
              ) : null}

              <h3 className="text-3xl font-black text-rose-500 mb-1">NO MORE MOVES</h3>
              <p className="text-slate-400 text-sm mb-4">棋盘已满且无法合并！你最终得到了</p>
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-3.5 mb-6 shadow-inner">
                <div className="text-3xl font-black font-mono text-amber-400">{score.toLocaleString()}</div>
                <div className="text-xs text-slate-500 font-mono mt-1">分数已自动记录至排行榜</div>
              </div>

              <button
                onClick={initGame}
                className="flex items-center gap-2 bg-slate-850 hover:bg-slate-850 border border-slate-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
                id="replay-2048-btn"
              >
                <RotateCcw className="w-4 h-4" />
                重新挑战
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Control Panel / Swipe buttons for Touch UI */}
      <div className="flex flex-col items-center w-full max-w-[340px]" id="game2048-controls">
        <div className="w-full bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 mb-4 text-xs text-slate-400">
          <h4 className="text-xs font-bold text-slate-300 tracking-wider uppercase mb-2 flex items-center gap-1.5">
            <Smile className="w-3.5 h-3.5 text-amber-400" />
            2048 技巧指引
          </h4>
          <p className="leading-relaxed">
            1. 尽量把<b>最大数放在任意一个角</b>上（例如左下角），并且不再随意移动该位置。<br />
            2. 利用<b>悔一步</b>撤销意外合并。<br />
            3. 保持一排数字递减，能大幅提高高阶拼图产出概率。
          </p>
        </div>

        {/* Swipe Button Pad for touch device fallback */}
        <div className="flex flex-col items-center gap-1.5 p-4 bg-slate-950/70 border border-slate-800 rounded-3xl shadow-xl w-full">
          <div className="text-[10px] font-mono text-slate-500 tracking-wider uppercase mb-1">触屏滑动控制器</div>
          
          <button
            onClick={() => move('UP')}
            className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-400 flex items-center justify-center transition-all active:scale-90 shadow-md"
            id="v2048-up"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-6">
            <button
              onClick={() => move('LEFT')}
              className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-400 flex items-center justify-center transition-all active:scale-90 shadow-md"
              id="v2048-left"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-900/80 flex items-center justify-center text-slate-700">
              🔳
            </div>
            <button
              onClick={() => move('RIGHT')}
              className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-400 flex items-center justify-center transition-all active:scale-90 shadow-md"
              id="v2048-right"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={() => move('DOWN')}
            className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-400 flex items-center justify-center transition-all active:scale-90 shadow-md"
            id="v2048-down"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
