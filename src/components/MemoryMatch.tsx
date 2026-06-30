/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Timer, RefreshCw, Eye, Sparkles, Smile, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSound } from '../utils/audio';
import { addScore, getHighScore } from '../utils/leaderboardHelper';

interface MemoryMatchProps {
  username: string;
  soundEnabled: boolean;
  onScoreSubmitted: () => void;
}

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const THEMES = {
  animals: {
    name: '神奇动物 🐼',
    emojis: ['🐶', '🐱', '🦊', '🐼', '🐯', '🦁', '🐸', '🐵'],
    color: 'from-emerald-500/10 to-teal-500/10 hover:border-emerald-500/40',
    accent: 'bg-emerald-500',
  },
  food: {
    name: '美味甜点 🍰',
    emojis: ['🍕', '🍔', '🍟', '🍩', '🍰', '🍣', '🍓', '🍦'],
    color: 'from-amber-500/10 to-orange-500/10 hover:border-amber-500/40',
    accent: 'bg-amber-500',
  },
  gaming: {
    name: '极客电玩 👾',
    emojis: ['🎮', '👾', '🕹️', '⚔️', '🔮', '🚀', '💀', '💎'],
    color: 'from-cyan-500/10 to-indigo-500/10 hover:border-cyan-500/40',
    accent: 'bg-cyan-500',
  },
};

type ThemeKey = keyof typeof THEMES;

export default function MemoryMatch({ username, soundEnabled, onScoreSubmitted }: MemoryMatchProps) {
  const [theme, setTheme] = useState<ThemeKey>('animals');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [combo, setCombo] = useState(0);
  const [showComboAlert, setShowComboAlert] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const comboResetRef = useRef<NodeJS.Timeout | null>(null);

  // Load high score
  useEffect(() => {
    setHighScore(getHighScore('memory', username));
  }, [username]);

  // Game timer
  useEffect(() => {
    if (isPlaying && !gameOver) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, gameOver]);

  // Create shuffled deck
  const initGame = (selectedTheme: ThemeKey = theme) => {
    playSound('click', soundEnabled);
    const themeData = THEMES[selectedTheme];
    
    // Duplicate emojis to make pairs
    const doubleEmojis = [...themeData.emojis, ...themeData.emojis];
    
    // Fisher-Yates Shuffle
    for (let i = doubleEmojis.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [doubleEmojis[i], doubleEmojis[j]] = [doubleEmojis[j], doubleEmojis[i]];
    }

    const newCards: Card[] = doubleEmojis.map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false,
    }));

    setCards(newCards);
    setFlippedIndices([]);
    setScore(0);
    setMoves(0);
    setTime(0);
    setCombo(0);
    setShowComboAlert(false);
    setGameOver(false);
    setIsNewRecord(false);
    setIsPlaying(true);
  };

  // Card Flip Action
  const handleCardClick = (clickedIndex: number) => {
    if (!isPlaying || gameOver || cards[clickedIndex].isFlipped || cards[clickedIndex].isMatched) return;
    if (flippedIndices.length >= 2) return; // Prevent clicking during flip back

    playSound('flip', soundEnabled);
    const updatedCards = [...cards];
    updatedCards[clickedIndex].isFlipped = true;
    setCards(updatedCards);

    const nextFlipped = [...flippedIndices, clickedIndex];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = nextFlipped;

      if (cards[firstIdx].emoji === cards[secondIdx].emoji) {
        // MATCH FOUND!
        setTimeout(() => {
          handleMatch(firstIdx, secondIdx);
        }, 300);
      } else {
        // NO MATCH! Flip back after delay
        setTimeout(() => {
          handleMismatch(firstIdx, secondIdx);
        }, 1000);
      }
    }
  };

  const handleMatch = (firstIdx: number, secondIdx: number) => {
    playSound('match', soundEnabled);
    
    const updatedCards = [...cards];
    updatedCards[firstIdx].isMatched = true;
    updatedCards[secondIdx].isMatched = true;
    setCards(updatedCards);
    setFlippedIndices([]);

    // Combo system
    const newCombo = combo + 1;
    setCombo(newCombo);

    let matchPoints = 150;
    if (newCombo > 1) {
      matchPoints += (newCombo - 1) * 50; // extra points per combo tier
      setShowComboAlert(true);
      if (comboResetRef.current) clearTimeout(comboResetRef.current);
      comboResetRef.current = setTimeout(() => {
        setShowComboAlert(false);
      }, 1500);
    }
    setScore((s) => s + matchPoints);

    // Reset combo timer: if 6 seconds pass without a match, combo drops to 0
    if (comboResetRef.current) clearTimeout(comboResetRef.current);
    comboResetRef.current = setTimeout(() => {
      setCombo(0);
    }, 6000);

    // Check complete win condition
    const allMatched = updatedCards.every((card) => card.isMatched);
    if (allMatched) {
      handleWin();
    }
  };

  const handleMismatch = (firstIdx: number, secondIdx: number) => {
    const updatedCards = [...cards];
    updatedCards[firstIdx].isFlipped = false;
    updatedCards[secondIdx].isFlipped = false;
    setCards(updatedCards);
    setFlippedIndices([]);
    setCombo(0); // Break combo chain
  };

  const handleWin = () => {
    setGameOver(true);
    playSound('gameover', soundEnabled);

    // Calculate dynamic time bonus (the faster the completion, the more bonus)
    // Speed Target: completed within 45 seconds is considered extremely fast
    const speedBonus = Math.max(1000 - time * 6, 100);
    const finalScore = score + speedBonus;
    setScore(finalScore);

    // Submit score
    const previousHighScore = getHighScore('memory', username);
    addScore('memory', username, finalScore);

    if (finalScore > previousHighScore && finalScore > 0) {
      setIsNewRecord(true);
      setHighScore(finalScore);
    }
    onScoreSubmitted();
  };

  // Format time (MM:SS)
  const formatTime = (totalSeconds: number): string => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center justify-center py-2 animate-fade-in" id="memory-game-screen">
      {/* Game Stage Area */}
      <div className="flex flex-col items-center">
        {/* Scores, moves, timer stats */}
        <div className="flex items-center justify-between w-full max-w-[420px] mb-4 bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800" id="memory-stats-header">
          <div className="flex items-center gap-1">
            <Timer className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-mono text-sm font-semibold text-slate-300">{formatTime(time)}</span>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-mono text-slate-500">SCORE</div>
            <div className="text-xl font-black font-mono text-cyan-400">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-mono text-slate-500">MOVES</div>
            <span className="font-mono text-sm font-semibold text-slate-300">{moves} 步</span>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-500">HIGH SCORE</div>
            <div className="text-sm font-black font-mono text-slate-400">{highScore}</div>
          </div>
        </div>

        {/* 4x4 card board viewport */}
        <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] p-4 bg-slate-950 rounded-3xl border border-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.08)] flex items-center justify-center">
          
          {/* Card grid layout */}
          <div className="grid grid-cols-4 grid-rows-4 gap-2.5 w-full h-full" id="card-matching-grid">
            {cards.map((card, idx) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(idx)}
                className="relative perspective-1000 w-full h-full cursor-pointer select-none"
              >
                <motion.div
                  initial={false}
                  animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="w-full h-full relative"
                >
                  {/* Card Front (Face down retro pattern) */}
                  <div className="absolute inset-0 backface-hidden flex items-center justify-center bg-slate-900 border-2 border-slate-800/80 hover:border-cyan-500/40 rounded-xl sm:rounded-2xl shadow-inner transition-colors duration-200">
                    <div className="text-lg sm:text-2xl text-slate-700 font-black font-mono">
                      ?
                    </div>
                  </div>

                  {/* Card Back (Face up Emoji) */}
                  <div
                    style={{ transform: 'rotateY(180deg)' }}
                    className={`absolute inset-0 backface-hidden flex items-center justify-center rounded-xl sm:rounded-2xl border-2 shadow-lg ${
                      card.isMatched
                        ? 'bg-emerald-950/40 border-emerald-500/40'
                        : 'bg-slate-800 border-cyan-500/30'
                    }`}
                  >
                    <span className="text-2xl sm:text-4xl filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                      {card.emoji}
                    </span>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Combo Floating Alert */}
          <AnimatePresence>
            {showComboAlert && combo > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -20, scale: 1.1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 text-xs font-black px-3.5 py-1.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)] z-20 pointer-events-none"
              >
                🔥 COMBO x{combo}!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Intro Screen Overlay */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-3xl">
              <div className="w-16 h-16 rounded-full bg-cyan-500/15 flex items-center justify-center text-cyan-400 border border-cyan-500/30 mb-4 animate-bounce">
                <Eye className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-wide mb-1">脑力卡片翻翻乐</h3>
              <p className="text-xs text-slate-400 max-w-[280px] mb-6">
                翻开卡片找到两个相同的Emoji。连续配对可触发<b>狂热连击（Combo）</b>分数翻倍！
              </p>
              
              <button
                onClick={() => initGame(theme)}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-300 scale-100 hover:scale-105 active:scale-95 text-sm"
                id="start-memory-btn"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                脑力全开
              </button>
            </div>
          )}

          {/* Game Over Screen Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-3xl animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/30 mb-4">
                <Trophy className="w-8 h-8" />
              </div>
              
              {isNewRecord ? (
                <div className="animate-pulse mb-1">
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono tracking-wider font-bold px-2.5 py-1 rounded-full uppercase">
                    ✨ NEW HIGH SCORE ✨
                  </span>
                </div>
              ) : null}

              <h3 className="text-3xl font-black text-emerald-400 mb-1">ALL MATCHED!</h3>
              <p className="text-slate-400 text-sm mb-4">恭喜你完成脑力挑战！用时 <span className="font-mono text-cyan-400 font-bold">{formatTime(time)}</span></p>
              
              <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-3.5 mb-6 shadow-inner">
                <div className="text-3xl font-black font-mono text-cyan-400">{score.toLocaleString()}</div>
                <div className="text-xs text-slate-500 font-mono mt-1">包含时间速度及连击奖励</div>
              </div>

              <button
                onClick={() => initGame(theme)}
                className="flex items-center gap-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
                id="replay-memory-btn"
              >
                <RotateCcw className="w-4 h-4" />
                重新挑战
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Control Panel / Theme Selection */}
      <div className="flex flex-col items-center w-full max-w-[340px]" id="memory-controls">
        {/* Theme select panel */}
        <div className="w-full bg-slate-950/70 border border-slate-800 p-5 rounded-3xl shadow-xl">
          <div className="text-[10px] font-mono text-slate-500 tracking-wider uppercase mb-3 text-center">切换卡牌主题</div>
          
          <div className="space-y-2" id="memory-theme-buttons">
            {(Object.keys(THEMES) as ThemeKey[]).map((themeKey) => {
              const th = THEMES[themeKey];
              const isSelected = theme === themeKey;
              return (
                <button
                  key={themeKey}
                  onClick={() => {
                    setTheme(themeKey);
                    if (isPlaying) {
                      initGame(themeKey);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-sm font-semibold transition-all duration-300 ${
                    isSelected
                      ? 'bg-cyan-600/10 border-cyan-500/40 text-cyan-200'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700/60'
                  }`}
                  id={`theme-btn-${themeKey}`}
                >
                  <span className="flex items-center gap-2">
                    {th.name}
                  </span>
                  {isSelected && (
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Game Info tips */}
        <div className="w-full bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 mt-4 text-xs text-slate-400">
          <h4 className="text-xs font-bold text-slate-300 tracking-wider uppercase mb-2 flex items-center gap-1.5">
            <Smile className="w-3.5 h-3.5 text-cyan-400" />
            配对技巧指引
          </h4>
          <p className="leading-relaxed">
            1. 每次成功配对，继续配对可触发<b>连击加成</b>。连击在6秒未配对后会被重置。<br />
            2. 用时越短，完成时的速度分数奖励越高。
          </p>
        </div>
      </div>
    </div>
  );
}
