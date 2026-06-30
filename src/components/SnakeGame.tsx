/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Trophy, Heart } from 'lucide-react';
import { playSound } from '../utils/audio';
import { addScore, getHighScore } from '../utils/leaderboardHelper';

interface SnakeGameProps {
  username: string;
  soundEnabled: boolean;
  onScoreSubmitted: () => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
interface Point { x: number; y: number; }
interface FoodItem {
  x: number;
  y: number;
  type: 'normal' | 'gold' | 'potion';
}

const GRID_SIZE = 20; // 20x20 blocks
const INITIAL_SPEED = 140; // milliseconds

export default function SnakeGame({ username, soundEnabled, onScoreSubmitted }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [direction, setDirection] = useState<Direction>('UP');
  const [food, setFood] = useState<FoodItem>({ x: 5, y: 5, type: 'normal' });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const directionRef = useRef<Direction>('UP');
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load high score
  useEffect(() => {
    setHighScore(getHighScore('snake', username));
  }, [username]);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;

      let newDir: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (directionRef.current !== 'DOWN') newDir = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (directionRef.current !== 'UP') newDir = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (directionRef.current !== 'RIGHT') newDir = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (directionRef.current !== 'LEFT') newDir = 'RIGHT';
          break;
      }

      if (newDir) {
        e.preventDefault();
        setDirection(newDir);
        directionRef.current = newDir;
        playSound('move', soundEnabled);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver, soundEnabled]);

  // Generate random food position not on snake
  const generateFood = (currentSnake: Point[]): FoodItem => {
    let newFood: Point;
    let attempts = 0;
    while (attempts < 400) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const onSnake = currentSnake.some((cell) => cell.x === newFood.x && cell.y === newFood.y);
      if (!onSnake) break;
      attempts++;
    }

    // Determine type (15% Gold, 10% Potion, 75% Normal)
    const rand = Math.random();
    let type: 'normal' | 'gold' | 'potion' = 'normal';
    if (rand < 0.15) {
      type = 'gold';
    } else if (rand < 0.25) {
      type = 'potion';
    }

    return { ...newFood!, type };
  };

  // Start/Restart Game
  const startGame = () => {
    playSound('click', soundEnabled);
    setSnake([
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ]);
    setDirection('UP');
    directionRef.current = 'UP';
    const initialSnake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
    setFood(generateFood(initialSnake));
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameOver(false);
    setIsNewRecord(false);
    setIsPlaying(true);
  };

  // Game Loop movement logic
  const moveSnake = () => {
    if (gameOver || !isPlaying) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      let newHead = { ...head };

      switch (directionRef.current) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // 1. Collision detection (walls or self)
      const hitWall = newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE;
      const hitSelf = prevSnake.some((cell) => cell.x === newHead.x && cell.y === newHead.y);

      if (hitWall || hitSelf) {
        handleGameOver();
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // 2. Food collision detection
      if (newHead.x === food.x && newHead.y === food.y) {
        // Trigger eat sound
        if (food.type === 'gold') {
          playSound('gold', soundEnabled);
          setScore((s) => s + 30);
        } else if (food.type === 'potion') {
          playSound('eat', soundEnabled);
          setScore((s) => s + 20);
          // Speed up the game momentarily (decrease interval)
          setSpeed((prev) => Math.max(prev - 15, 60));
        } else {
          playSound('eat', soundEnabled);
          setScore((s) => s + 10);
        }

        // Set food to a new spot
        setFood(generateFood(newSnake));

        // Gradually speed up snake (normal pacing)
        setSpeed((prev) => Math.max(prev - 2, 70));
      } else {
        // Remove tail
        newSnake.pop();
      }

      return newSnake;
    });
  };

  const handleGameOver = () => {
    setIsPlaying(false);
    setGameOver(true);
    playSound('gameover', soundEnabled);

    // Save Score to leaderboard
    const previousHighScore = getHighScore('snake', username);
    const savedEntry = addScore('snake', username, score);
    
    if (score > previousHighScore && score > 0) {
      setIsNewRecord(true);
      setHighScore(score);
    }
    
    onScoreSubmitted(); // Refresh leaderboards elsewhere if needed
  };

  // Run interval based on speed
  useEffect(() => {
    if (isPlaying && !gameOver) {
      gameIntervalRef.current = setInterval(moveSnake, speed);
    }
    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    };
  }, [isPlaying, gameOver, speed, food, direction]);

  // Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw background
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid board subtle lines
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)'; // slate-800
    ctx.lineWidth = 1;
    const cellWidth = canvas.width / GRID_SIZE;
    const cellHeight = canvas.height / GRID_SIZE;

    for (let i = 0; i < GRID_SIZE; i++) {
      // Horizontal
      ctx.beginPath();
      ctx.moveTo(0, i * cellHeight);
      ctx.lineTo(canvas.width, i * cellHeight);
      ctx.stroke();
      // Vertical
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, canvas.height);
      ctx.stroke();
    }

    // Draw food with glowing circle
    const fx = food.x * cellWidth + cellWidth / 2;
    const fy = food.y * cellHeight + cellHeight / 2;
    const radius = cellWidth / 2 - 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(fx, fy, radius, 0, Math.PI * 2);

    if (food.type === 'gold') {
      ctx.fillStyle = '#f59e0b'; // amber-500
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 12;
    } else if (food.type === 'potion') {
      ctx.fillStyle = '#a855f7'; // purple-500
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = '#ef4444'; // red-500
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 6;
    }
    ctx.fill();
    ctx.restore();

    // Draw snake with round joints and gradient color
    snake.forEach((cell, index) => {
      const cx = cell.x * cellWidth;
      const cy = cell.y * cellHeight;

      ctx.save();
      ctx.beginPath();
      
      // Make head slightly larger and rounder
      if (index === 0) {
        ctx.fillStyle = '#10b981'; // emerald-500
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 8;
        // Rounded head
        ctx.arc(cx + cellWidth / 2, cy + cellHeight / 2, cellWidth / 2 - 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw cute little eyes facing movement direction
        ctx.fillStyle = '#ffffff';
        const eyeRadius = cellWidth / 8;
        let leftEye = { x: 0, y: 0 };
        let rightEye = { x: 0, y: 0 };

        if (directionRef.current === 'UP') {
          leftEye = { x: cx + cellWidth * 0.3, y: cy + cellHeight * 0.35 };
          rightEye = { x: cx + cellWidth * 0.7, y: cy + cellHeight * 0.35 };
        } else if (directionRef.current === 'DOWN') {
          leftEye = { x: cx + cellWidth * 0.3, y: cy + cellHeight * 0.65 };
          rightEye = { x: cx + cellWidth * 0.7, y: cy + cellHeight * 0.65 };
        } else if (directionRef.current === 'LEFT') {
          leftEye = { x: cx + cellWidth * 0.35, y: cy + cellHeight * 0.3 };
          rightEye = { x: cx + cellWidth * 0.35, y: cy + cellHeight * 0.7 };
        } else if (directionRef.current === 'RIGHT') {
          leftEye = { x: cx + cellWidth * 0.65, y: cy + cellHeight * 0.3 };
          rightEye = { x: cx + cellWidth * 0.65, y: cy + cellHeight * 0.7 };
        }

        ctx.beginPath();
        ctx.arc(leftEye.x, leftEye.y, eyeRadius, 0, Math.PI * 2);
        ctx.arc(rightEye.x, rightEye.y, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(leftEye.x, leftEye.y, eyeRadius / 2, 0, Math.PI * 2);
        ctx.arc(rightEye.x, rightEye.y, eyeRadius / 2, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Body gradient (emerald-500 fading into teal-500)
        const ratio = index / snake.length;
        ctx.fillStyle = `rgb(${Math.floor(16 + ratio * 4)}, ${Math.floor(185 - ratio * 40)}, ${Math.floor(129 + ratio * 80)})`;
        ctx.roundRect ? ctx.roundRect(cx + 1, cy + 1, cellWidth - 2, cellHeight - 2, 4) : ctx.rect(cx + 1, cy + 1, cellWidth - 2, cellHeight - 2);
        ctx.fill();
      }
      ctx.restore();
    });

  }, [snake, food]);

  // Virtual controller triggers
  const handleVirtualDirection = (newDir: Direction) => {
    if (!isPlaying || gameOver) return;
    
    let opposite: Direction;
    switch (newDir) {
      case 'UP': opposite = 'DOWN'; break;
      case 'DOWN': opposite = 'UP'; break;
      case 'LEFT': opposite = 'RIGHT'; break;
      case 'RIGHT': opposite = 'LEFT'; break;
    }

    if (directionRef.current !== opposite) {
      setDirection(newDir);
      directionRef.current = newDir;
      playSound('move', soundEnabled);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center justify-center py-2 animate-fade-in" id="snake-game-screen">
      {/* Game Stage Area */}
      <div className="flex flex-col items-center">
        {/* Scores & Stats */}
        <div className="flex items-center justify-between w-full max-w-[400px] mb-3 bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800" id="snake-stats-header">
          <div>
            <div className="text-[10px] font-mono text-slate-500">CURRENT SCORE</div>
            <div className="text-xl font-black font-mono text-emerald-400">{score}</div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full font-mono flex items-center gap-1 border border-emerald-800/40">
              <Zap className="w-3 h-3 animate-pulse" /> Speed: {Math.round(200 - speed)}
            </span>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-500">MY HIGH SCORE</div>
            <div className="text-lg font-black font-mono text-slate-300">{highScore}</div>
          </div>
        </div>

        {/* Canvas Display Viewport */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.15)] bg-slate-950">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="block max-w-full aspect-square bg-slate-900"
            id="snake-canvas"
          />

          {/* Intro Overlay / Game Start overlay */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/30 mb-4 animate-bounce">
                <Heart className="w-8 h-8 fill-emerald-500/10" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-wide mb-1">贪吃蛇大作战</h3>
              <p className="text-xs text-slate-400 max-w-[280px] mb-6">
                使用 <span className="text-emerald-400 font-bold font-mono">W A S D</span> 或方向键操控。吃掉苹果和药水，挑战更高纪录！
              </p>
              
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={startGame}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300 scale-100 hover:scale-105 active:scale-95 text-sm"
                  id="start-snake-btn"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  开始挑战
                </button>
              </div>
            </div>
          )}

          {/* Game Over Screen */}
          {gameOver && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/30 mb-4">
                <Trophy className="w-8 h-8" />
              </div>
              
              {isNewRecord ? (
                <div className="animate-pulse mb-1">
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono tracking-wider font-bold px-2.5 py-1 rounded-full uppercase">
                    ✨ NEW HIGH SCORE ✨
                  </span>
                </div>
              ) : null}

              <h3 className="text-3xl font-black text-rose-500 mb-1">GAME OVER</h3>
              <p className="text-slate-400 text-sm mb-4">挑战结束！你最终吃到了</p>
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-3.5 mb-6 shadow-inner">
                <div className="text-4xl font-black font-mono text-emerald-400">{score}</div>
                <div className="text-xs text-slate-500 font-mono mt-1">分数已自动同步到排行榜</div>
              </div>

              <button
                onClick={startGame}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl border border-slate-700 transition-colors text-sm"
                id="replay-snake-btn"
              >
                <RotateCcw className="w-4 h-4" />
                重新挑战
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Control Panel / Instructions / Mobile Virtual D-Pad */}
      <div className="flex flex-col items-center w-full max-w-[340px]" id="snake-control-pad">
        {/* Game instructions */}
        <div className="w-full bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 mb-4">
          <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">食物特权说明</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/20 shadow-[0_0_4px_red]" />
              <span className="text-slate-300">红苹果：得分 +10（标准苹果）</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20 shadow-[0_0_6px_#fbbf24]" />
              <span className="text-amber-400 font-semibold">黄金星：得分 +30（高分奖励）</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-500/20 shadow-[0_0_6px_#c084fc]" />
              <span className="text-purple-400">紫药水：得分 +20（并加快蛇的速度！）</span>
            </div>
          </div>
        </div>

        {/* Mobile D-Pad */}
        <div className="flex flex-col items-center gap-1.5 p-4 bg-slate-950/70 border border-slate-800 rounded-3xl shadow-xl w-full">
          <div className="text-[10px] font-mono text-slate-500 tracking-wider uppercase mb-1">触屏虚拟摇杆</div>
          
          <button
            onClick={() => handleVirtualDirection('UP')}
            className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400 flex items-center justify-center transition-all active:scale-90 shadow-md"
            id="vpad-up"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleVirtualDirection('LEFT')}
              className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400 flex items-center justify-center transition-all active:scale-90 shadow-md"
              id="vpad-left"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-900/80 flex items-center justify-center text-slate-700">
              🕹️
            </div>
            <button
              onClick={() => handleVirtualDirection('RIGHT')}
              className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400 flex items-center justify-center transition-all active:scale-90 shadow-md"
              id="vpad-right"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={() => handleVirtualDirection('DOWN')}
            className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400 flex items-center justify-center transition-all active:scale-90 shadow-md"
            id="vpad-down"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
