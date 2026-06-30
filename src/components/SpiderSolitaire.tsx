/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RotateCcw, Play, HelpCircle, Trophy, Sparkles, Plus, AlertCircle, ArrowRight } from 'lucide-react';
import { playSound } from '../utils/audio';
import { addScore, getHighScore } from '../utils/leaderboardHelper';

interface SpiderSolitaireProps {
  username: string;
  soundEnabled: boolean;
  onScoreSubmitted: () => void;
}

interface Card {
  id: string;
  suit: '♠' | '♥' | '♣' | '♦';
  value: number; // 1 (A) to 13 (K)
  isFaceUp: boolean;
}

const SUITS: Card['suit'][] = ['♠', '♥', '♣', '♦'];
const VALUE_LABELS: Record<number, string> = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K'
};

export default function SpiderSolitaire({ username, soundEnabled, onScoreSubmitted }: SpiderSolitaireProps) {
  const [columns, setColumns] = useState<Card[][]>(Array.from({ length: 10 }, () => []));
  const [stock, setStock] = useState<Card[]>([]);
  const [completedSuits, setCompletedSuits] = useState<number>(0);
  const [score, setScore] = useState<number>(500);
  const [moves, setMoves] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [isWinner, setIsWinner] = useState<boolean>(false);
  const [highScore, setHighScore] = useState<number>(0);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [selectedCardInfo, setSelectedCardInfo] = useState<{ colIndex: number; cardIndex: number } | null>(null);

  // Load high score
  useEffect(() => {
    setHighScore(getHighScore('spider', username));
  }, [username]);

  // Generate cards and start the game
  const startGame = () => {
    playSound('click', soundEnabled);
    
    // We will use 8 decks of ♠ (Single Suit Mode is highly satisfying and playable)
    // To give a super professional feel, 104 cards in total
    const deck: Card[] = [];
    let idCounter = 0;
    
    for (let deckNum = 0; deckNum < 8; deckNum++) {
      for (let val = 1; val <= 13; val++) {
        deck.push({
          id: `card_${idCounter++}`,
          suit: '♠',
          value: val,
          isFaceUp: false,
        });
      }
    }

    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Deal 54 cards to the 10 columns:
    // Columns 0-3 get 6 cards, Columns 4-9 get 5 cards
    const newColumns: Card[][] = Array.from({ length: 10 }, () => []);
    let deckIndex = 0;

    for (let col = 0; col < 10; col++) {
      const cardsToDeal = col < 4 ? 6 : 5;
      for (let i = 0; i < cardsToDeal; i++) {
        const card = deck[deckIndex++];
        if (i === cardsToDeal - 1) {
          card.isFaceUp = true; // top card is face up
        }
        newColumns[col].push(card);
      }
    }

    // Remaining 50 cards go to the Stock pile
    const remainingStock = deck.slice(deckIndex);

    setColumns(newColumns);
    setStock(remainingStock);
    setCompletedSuits(0);
    setScore(500);
    setMoves(0);
    setSelectedCardInfo(null);
    setGameOver(false);
    setIsWinner(false);
    setIsNewRecord(false);
    setIsPlaying(true);
  };

  // Helper to check if a sequence of cards in a column is valid to move
  // A run is movable if all cards are of the same suit and form a consecutive descending sequence
  const isMovableRun = (col: Card[], startIndex: number): boolean => {
    if (startIndex < 0 || startIndex >= col.length) return false;
    for (let i = startIndex; i < col.length; i++) {
      if (!col[i].isFaceUp) return false;
    }

    for (let i = startIndex; i < col.length - 1; i++) {
      const current = col[i];
      const next = col[i + 1];
      if (current.suit !== next.suit || current.value !== next.value + 1) {
        return false;
      }
    }
    return true;
  };

  // Handle click on card
  const handleCardClick = (colIdx: number, cardIdx: number) => {
    if (!isPlaying || gameOver || isWinner) return;

    const col = columns[colIdx];
    const card = col[cardIdx];

    // If no card is selected, try selecting this card
    if (selectedCardInfo === null) {
      if (!card.isFaceUp) return;
      
      // Verify if the cards from cardIdx to end form a valid run
      if (isMovableRun(col, cardIdx)) {
        setSelectedCardInfo({ colIndex: colIdx, cardIndex: cardIdx });
        playSound('click', soundEnabled);
      }
    } else {
      // A card was already selected.
      // If clicking within the same column or another card, we can either:
      // Case A: Click a different column to move cards
      // Case B: Click the same column to cancel selection or select another card
      
      if (selectedCardInfo.colIndex === colIdx) {
        // Clicked same column, just cancel selection
        setSelectedCardInfo(null);
        playSound('click', soundEnabled);
      } else {
        // Try to move to this column
        attemptMove(selectedCardInfo.colIndex, selectedCardInfo.cardIndex, colIdx);
      }
    }
  };

  // Handle clicking on an empty column space
  const handleColumnHeaderClick = (colIdx: number) => {
    if (!isPlaying || gameOver || isWinner || selectedCardInfo === null) return;
    
    // Attempt to move to this empty column
    attemptMove(selectedCardInfo.colIndex, selectedCardInfo.cardIndex, colIdx);
  };

  // Logic to execute card movement
  const attemptMove = (fromColIdx: number, fromCardIdx: number, toColIdx: number) => {
    const fromCol = columns[fromColIdx];
    const toCol = columns[toColIdx];
    const cardsToMove = fromCol.slice(fromCardIdx);
    const movingCard = cardsToMove[0];

    // Movement Rules:
    // Can move to empty column, or onto a card that is exactly 1 value higher (e.g., 4 onto 5)
    let isLegal = false;
    if (toCol.length === 0) {
      isLegal = true;
    } else {
      const topTargetCard = toCol[toCol.length - 1];
      if (topTargetCard.value === movingCard.value + 1) {
        isLegal = true;
      }
    }

    if (isLegal) {
      // Execute Move
      const updatedColumns = columns.map((col, idx) => {
        if (idx === fromColIdx) {
          const nextCol = col.slice(0, fromCardIdx);
          // If the new top card is face down, flip it face up!
          if (nextCol.length > 0 && !nextCol[nextCol.length - 1].isFaceUp) {
            nextCol[nextCol.length - 1].isFaceUp = true;
          }
          return nextCol;
        }
        if (idx === toColIdx) {
          return [...col, ...cardsToMove];
        }
        return [...col];
      });

      // Deduct 1 score and increment moves
      let nextScore = score - 1;
      let nextMoves = moves + 1;

      // Check for Completed K-A Runs in the target column
      const targetColAfterMove = updatedColumns[toColIdx];
      let hasCompletedRun = false;
      let updatedColumnsAfterClear = updatedColumns;

      if (targetColAfterMove.length >= 13) {
        // Look from the end of the column for 13 cards forming a complete King to Ace run
        for (let i = targetColAfterMove.length - 13; i <= targetColAfterMove.length - 13; i++) {
          if (i >= 0 && isMovableRun(targetColAfterMove, i) && targetColAfterMove[i].value === 13) {
            // Found a full K-A sequence
            hasCompletedRun = true;
            // Clear these 13 cards
            updatedColumnsAfterClear = updatedColumns.map((col, idx) => {
              if (idx === toColIdx) {
                const nextCol = col.slice(0, i);
                if (nextCol.length > 0 && !nextCol[nextCol.length - 1].isFaceUp) {
                  nextCol[nextCol.length - 1].isFaceUp = true;
                }
                return nextCol;
              }
              return [...col];
            });
            break;
          }
        }
      }

      if (hasCompletedRun) {
        setCompletedSuits((prev) => prev + 1);
        nextScore += 100; // Reward for cleared suite
        playSound('match', soundEnabled);
        
        // If 8 completed suits, you win!
        if (completedSuits + 1 === 8) {
          setColumns(updatedColumnsAfterClear);
          handleWin(nextScore, nextMoves);
          return;
        }
      } else {
        playSound('flip', soundEnabled);
      }

      setColumns(updatedColumnsAfterClear);
      setScore(nextScore);
      setMoves(nextMoves);
      setSelectedCardInfo(null);
    } else {
      // Illegal Move: Clear selection with quick warning audio or state clear
      setSelectedCardInfo(null);
    }
  };

  // Deal 10 cards from Stock
  const dealFromStock = () => {
    if (!isPlaying || gameOver || isWinner || stock.length === 0) return;

    // Standard rule constraint: Cannot deal if there are empty columns
    const hasEmptyCol = columns.some((col) => col.length === 0);
    if (hasEmptyCol) {
      alert('库存发牌规则：所有十列必须都有牌，才能从备用堆发牌！');
      return;
    }

    playSound('flip', soundEnabled);

    // Deal 1 card to each column
    const cardsToDeal = stock.slice(0, 10);
    const updatedColumns = columns.map((col, idx) => {
      const newCard = { ...cardsToDeal[idx], isFaceUp: true };
      return [...col, newCard];
    });

    setColumns(updatedColumns);
    setStock(stock.slice(10));
    setMoves((m) => m + 1);
    setSelectedCardInfo(null);
  };

  // Win State handling
  const handleWin = (finalScore: number, finalMoves: number) => {
    setIsWinner(true);
    // Add speed bonus/move count bonus
    const speedBonus = Math.max(1000 - finalMoves * 3, 100);
    const totalWinScore = finalScore + speedBonus;
    setScore(totalWinScore);

    const prevHighScore = getHighScore('spider', username);
    addScore('spider', username, totalWinScore);

    if (totalWinScore > prevHighScore && totalWinScore > 0) {
      setIsNewRecord(true);
      setHighScore(totalWinScore);
    }
    onScoreSubmitted();
  };

  // Utility to find if card is selected
  const isCardSelected = (colIdx: number, cardIdx: number): boolean => {
    if (selectedCardInfo === null) return false;
    return selectedCardInfo.colIndex === colIdx && cardIdx >= selectedCardInfo.cardIndex;
  };

  return (
    <div className="flex flex-col items-center justify-center py-2 animate-fade-in w-full max-w-7xl mx-auto" id="spider-screen">
      
      {/* Top Bar Stats */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-[1000px] gap-4 mb-6 bg-slate-950/80 px-6 py-4 rounded-3xl border border-slate-800" id="spider-header">
        
        {/* Solitaire stats left */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-mono">MOVES COUNT</span>
            <span className="text-xl font-bold font-mono text-indigo-400">{moves}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-mono">CURRENT SCORE</span>
            <span className="text-xl font-bold font-mono text-cyan-400">{score}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-mono">COMPLETED SETS</span>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold font-mono text-emerald-400">{completedSuits}</span>
              <span className="text-xs text-slate-500">/ 8</span>
            </div>
          </div>
        </div>

        {/* Clear suites indicators */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800/80 px-4 py-2 rounded-2xl">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div 
              key={idx}
              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                idx < completedSuits 
                  ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]' 
                  : 'bg-slate-950 text-slate-700 border border-slate-850'
              }`}
            >
              ♠
            </div>
          ))}
        </div>

        {/* Restart Button */}
        <button
          onClick={startGame}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/30 transition-all hover:scale-105"
          id="spider-restart-btn"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm font-semibold">重开局</span>
        </button>
      </div>

      {/* Main Board Table */}
      <div className="relative w-full max-w-[1020px] bg-emerald-950/15 border border-indigo-500/10 rounded-3xl p-6 shadow-2xl mb-6 min-h-[520px] flex flex-col justify-between">
        
        {/* Cards Tableau Grid */}
        <div className="grid grid-cols-10 gap-2 w-full" id="spider-tableau">
          {columns.map((col, colIdx) => (
            <div 
              key={colIdx} 
              className="relative flex flex-col items-center min-h-[380px]"
            >
              {/* Column Click Header for placing on empty column */}
              {col.length === 0 && (
                <button
                  onClick={() => handleColumnHeaderClick(colIdx)}
                  className="w-full aspect-[2/3] max-w-[80px] rounded-xl border-2 border-dashed border-emerald-800/60 hover:border-indigo-500/50 bg-emerald-950/20 flex flex-col items-center justify-center text-emerald-700/80 hover:text-indigo-400 transition-colors cursor-pointer"
                  title="移动至此空列"
                  id={`empty-col-${colIdx}`}
                >
                  <Plus className="w-5 h-5 mb-1" />
                  <span className="text-[9px] font-mono">EMPTY</span>
                </button>
              )}

              {/* Cascade cards */}
              {col.map((card, cardIdx) => {
                const isSelected = isCardSelected(colIdx, cardIdx);
                const topOffset = cardIdx * 18; // Overlap spacing
                
                return (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(colIdx, cardIdx)}
                    style={{ 
                      position: 'absolute',
                      top: `${topOffset}px`,
                      zIndex: cardIdx + 5,
                    }}
                    className={`w-full max-w-[80px] aspect-[2/3] rounded-xl flex flex-col justify-between p-2.5 shadow-md select-none transition-all duration-150 cursor-pointer ${
                      card.isFaceUp 
                        ? isSelected
                          ? 'bg-indigo-900 border-2 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)] translate-y-[-4px]'
                          : 'bg-slate-900 border border-slate-750 text-slate-100 hover:border-slate-600'
                        : 'bg-gradient-to-br from-indigo-850 to-indigo-950 border border-indigo-700/50'
                    }`}
                    id={`card-${colIdx}-${cardIdx}`}
                  >
                    {card.isFaceUp ? (
                      <>
                        {/* Top row */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-black tracking-tighter">
                            {VALUE_LABELS[card.value]}
                          </span>
                          <span className="text-xs">♠</span>
                        </div>
                        
                        {/* Center big symbol */}
                        <div className="text-center text-lg leading-none opacity-90 my-1">
                          ♠
                        </div>

                        {/* Bottom row inverted */}
                        <div className="flex items-center justify-between rotate-180">
                          <span className="font-mono text-sm font-black tracking-tighter">
                            {VALUE_LABELS[card.value]}
                          </span>
                          <span className="text-xs">♠</span>
                        </div>
                      </>
                    ) : (
                      // Card Back Pattern
                      <div className="w-full h-full rounded-md border border-indigo-600/30 bg-indigo-950/40 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:10px_10px] flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-indigo-500/10 border border-indigo-500/20"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Stock Deck and Manual Deal */}
        <div className="flex items-center justify-between w-full mt-24 pt-6 border-t border-slate-900" id="spider-deck-footer">
          
          {/* Deck remaining summary info */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono">STOCK STACK:</span>
            <div className="flex gap-1.5">
              {Array.from({ length: Math.ceil(stock.length / 10) }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={dealFromStock}
                  className="w-12 h-16 rounded-lg bg-gradient-to-br from-indigo-850 to-indigo-950 border border-indigo-700/50 flex items-center justify-center text-white/50 shadow-md hover:scale-105 active:scale-95 hover:border-indigo-400 transition-all"
                  title="点击发新一轮牌"
                >
                  ♠
                </button>
              ))}
              {stock.length === 0 && (
                <span className="text-xs font-mono text-slate-600">（无剩余手牌）</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-400">
              单花色模式：将 <b>K到A</b> 按顺序排成一列即可消除。共 8 组。
            </span>
          </div>
        </div>

        {/* Start Game Screen Overlay */}
        {!isPlaying && !gameOver && !isWinner && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-3xl">
            <div className="w-16 h-16 rounded-full bg-indigo-500/15 flex items-center justify-center text-indigo-400 border border-indigo-500/30 mb-4 animate-bounce">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-black text-white tracking-wide mb-1">蜘蛛纸牌 (单花色)</h3>
            <p className="text-xs text-slate-400 max-w-[340px] mb-6 leading-relaxed">
              点击卡牌选中（支持连牌同花色降序选择），再点击目标列移动。将同一列 ♠ 排成 King(K) 到 Ace(A) 即可自动完成并消除该组！
            </p>
            
            <button
              onClick={startGame}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-400 hover:to-cyan-500 text-slate-950 font-black px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300 scale-100 hover:scale-105 active:scale-95 text-sm"
              id="start-spider-btn"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              开局对决
            </button>
          </div>
        )}

        {/* Win Screen Overlay */}
        {isWinner && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-3xl border-2 border-emerald-500/30 animate-fade-in">
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

            <h3 className="text-3xl font-black text-emerald-400 mb-1">蜘蛛纸牌解密通关！</h3>
            <p className="text-slate-400 text-sm mb-4">顶级纸牌大师！你仅仅用了 <span className="font-mono text-cyan-400 font-bold">{moves} 步</span> 整理出所有牌序！</p>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-3.5 mb-6 shadow-inner">
              <div className="text-3xl font-black font-mono text-indigo-400">{score.toLocaleString()}</div>
              <div className="text-xs text-slate-500 font-mono mt-1">分数已自动记录至排行榜</div>
            </div>

            <button
              onClick={startGame}
              className="flex items-center gap-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
              id="win-replay-spider-btn"
            >
              <RotateCcw className="w-4 h-4" />
              再玩一局
            </button>
          </div>
        )}
      </div>

      {/* Basic Tip Section */}
      <div className="w-full max-w-[1000px] bg-slate-950/40 p-5 rounded-3xl border border-slate-800/50 text-xs text-slate-400 leading-relaxed grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-bold text-slate-300 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            移动牌规则
          </h4>
          <p>
            1. 你可以将任意一张正面朝上的牌（或一连串花色相同且降序连续的牌组）移动到另一张数值大1的牌（不论花色，但本游戏为纯单花色 ♠️）上。例如，将 ♠️4 放在 ♠️5 上。<br />
            2. 空列可以放入任意正面朝上的单张卡牌或合法连续序列。
          </p>
        </div>
        <div>
          <h4 className="font-bold text-slate-300 mb-1.5 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            发牌规则
          </h4>
          <p>
            1. 界面下方有 5 组发牌堆。每当你感到无法继续挪动时，点击它，可将 10 张牌分别发到这 10 个列。<br />
            2. **限制规则**：必须保证当前没有任何空列存在，才可以进行这轮发牌。
          </p>
        </div>
      </div>

    </div>
  );
}
