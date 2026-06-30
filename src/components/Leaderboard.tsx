/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Search, RefreshCw, Star, Flame, Award, Zap, Smile, ShieldAlert } from 'lucide-react';
import { GameType, LeaderboardEntry } from '../types';
import { getLeaderboard, clearLeaderboard } from '../utils/leaderboardHelper';

interface LeaderboardProps {
  currentUsername: string;
  onResetFinished?: () => void;
}

const GAME_NAMES: Record<GameType, string> = {
  snake: '贪吃蛇大作战',
  game2048: '2048 智力拼图',
  memory: '脑力卡片翻翻乐',
  minesweeper: '经典扫雷',
  spider: '蜘蛛纸牌',
};

const GAME_COLORS: Record<GameType, { text: string; bg: string; border: string }> = {
  snake: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  game2048: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  memory: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  minesweeper: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  spider: { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
};

export default function Leaderboard({ currentUsername, onResetFinished }: LeaderboardProps) {
  const [selectedGame, setSelectedGame] = useState<GameType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const loadScores = () => {
    if (selectedGame === 'all') {
      const snakeScores = getLeaderboard('snake');
      const game2048Scores = getLeaderboard('game2048');
      const memoryScores = getLeaderboard('memory');
      const minesweeperScores = getLeaderboard('minesweeper');
      const spiderScores = getLeaderboard('spider');
      
      const combined = [
        ...snakeScores,
        ...game2048Scores,
        ...memoryScores,
        ...minesweeperScores,
        ...spiderScores
      ];
      
      setScores(combined.sort((a, b) => {
        return b.date.localeCompare(a.date);
      }));
    } else {
      setScores(getLeaderboard(selectedGame));
    }
  };

  useEffect(() => {
    loadScores();
  }, [selectedGame]);

  const handleReset = () => {
    clearLeaderboard();
    setShowConfirmReset(false);
    loadScores();
    if (onResetFinished) {
      onResetFinished();
    }
  };

  // Filter scores by search query
  const filteredScores = scores.filter((entry) =>
    entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get podium players for specific games
  const podiumPlayers = selectedGame !== 'all' ? filteredScores.slice(0, 3) : [];
  const listPlayers = selectedGame !== 'all' ? filteredScores.slice(3) : filteredScores;

  return (
    <div className="w-full bg-slate-900/60 rounded-3xl border border-slate-800 p-6 shadow-2xl animate-fade-in" id="leaderboard-container">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
            殿堂级排行榜
          </h2>
          <p className="text-sm text-slate-400">
            {selectedGame === 'all' 
              ? '最新玩家战绩汇总记录' 
              : `正在查看 ${GAME_NAMES[selectedGame]} 的玩家排名`}
          </p>
        </div>

        {/* Search & Reset Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索玩家名字..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-56 bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 placeholder-slate-600 transition-all duration-300"
              id="leaderboard-search"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>

          {/* Reset Action */}
          {showConfirmReset ? (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 p-1.5 rounded-xl animate-shake">
              <span className="text-xs text-rose-300 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                确定重置所有数据？
              </span>
              <button
                onClick={handleReset}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded"
                id="confirm-reset-btn"
              >
                是的
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="text-slate-400 hover:text-slate-200 text-xs px-1.5"
                id="cancel-reset-btn"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-400 border border-slate-800/80 hover:border-rose-500/30 px-3 py-2 rounded-xl transition-all duration-300"
              title="恢复排行榜初始状态"
              id="reset-leaderboard-btn"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重置数据
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/50" id="leaderboard-tabs">
        <button
          onClick={() => setSelectedGame('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
            selectedGame === 'all'
              ? 'bg-slate-850 border border-slate-700/80 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          id="tab-all-scores"
        >
          ⏱️ 最近动态
        </button>
        {(['snake', 'game2048', 'memory', 'minesweeper', 'spider'] as GameType[]).map((gameId) => (
          <button
            key={gameId}
            onClick={() => setSelectedGame(gameId)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
              selectedGame === gameId
                ? 'bg-indigo-600/25 border border-indigo-500/40 text-indigo-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id={`tab-game-${gameId}`}
          >
            <span>
              {gameId === 'snake'
                ? '🐍'
                : gameId === 'game2048'
                ? '🔳'
                : gameId === 'memory'
                ? '🃏'
                : gameId === 'minesweeper'
                ? '💣'
                : '🕷️'}
            </span>
            {GAME_NAMES[gameId]}
          </button>
        ))}
      </div>

      {/* Grid for Podium + List */}
      {filteredScores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center" id="leaderboard-empty">
          <Smile className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
          <p className="text-slate-400 font-medium">暂时没有找到符合条件的记录...</p>
          <p className="text-slate-500 text-xs mt-1">去玩局游戏提交个分数，打破沉默吧！</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Podium Area (Only shown when a specific game is selected) */}
          {selectedGame !== 'all' && podiumPlayers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-6 pb-4" id="leaderboard-podium">
              {/* 2nd Place */}
              {podiumPlayers[1] && (
                <div className="order-2 sm:order-1 flex flex-col items-center group">
                  <div className="relative mb-2 flex items-center justify-center">
                    <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                      {podiumPlayers[1].username.match(/[\uD800-\uDFFF].|./u)?.[0] || '👤'}
                    </span>
                    <Award className="w-5 h-5 text-slate-300 absolute -top-4 -right-2" />
                  </div>
                  <div className="w-full bg-slate-900/80 border border-slate-700/60 p-4 rounded-t-2xl text-center shadow-lg group-hover:-translate-y-1 transition-transform">
                    <div className="text-xs font-mono font-bold text-slate-400 mb-1">2ND PLACE</div>
                    <div className="text-sm font-bold text-slate-200 truncate px-2">
                      {podiumPlayers[1].username}
                      {podiumPlayers[1].username === currentUsername && <span className="ml-1 text-xs bg-indigo-500/20 text-indigo-300 px-1 py-0.2 rounded">我</span>}
                    </div>
                    <div className="text-lg font-black text-slate-300 font-mono mt-1">
                      {podiumPlayers[1].score.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {podiumPlayers[0] && (
                <div className="order-1 sm:order-2 flex flex-col items-center group -translate-y-2 sm:-translate-y-4">
                  <div className="relative mb-3 flex items-center justify-center">
                    <span className="text-4xl filter drop-shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-bounce">
                      {podiumPlayers[0].username.match(/[\uD800-\uDFFF].|./u)?.[0] || '👑'}
                    </span>
                    <Trophy className="w-7 h-7 text-amber-400 absolute -top-5 -right-3 rotate-12" />
                  </div>
                  <div className="w-full bg-gradient-to-b from-indigo-950 to-slate-900 border border-indigo-500/30 p-5 rounded-t-2xl text-center shadow-[0_0_20px_rgba(99,102,241,0.25)] group-hover:-translate-y-1 transition-all duration-300">
                    <div className="text-xs font-mono font-black text-amber-400 mb-1 tracking-wider flex items-center justify-center gap-1">
                      <Flame className="w-3.5 h-3.5 animate-pulse" /> CHAMPION
                    </div>
                    <div className="text-base font-black text-white truncate px-2">
                      {podiumPlayers[0].username}
                      {podiumPlayers[0].username === currentUsername && <span className="ml-1 text-xs bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded">我</span>}
                    </div>
                    <div className="text-2xl font-black text-amber-300 font-mono mt-1 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                      {podiumPlayers[0].score.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {podiumPlayers[2] && (
                <div className="order-3 flex flex-col items-center group">
                  <div className="relative mb-2 flex items-center justify-center">
                    <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(180,83,9,0.2)]">
                      {podiumPlayers[2].username.match(/[\uD800-\uDFFF].|./u)?.[0] || '👤'}
                    </span>
                    <Award className="w-5 h-5 text-amber-700 absolute -top-4 -right-2" />
                  </div>
                  <div className="w-full bg-slate-900/80 border border-slate-700/60 p-4 rounded-t-2xl text-center shadow-lg group-hover:-translate-y-1 transition-transform">
                    <div className="text-xs font-mono font-bold text-amber-700 mb-1">3RD PLACE</div>
                    <div className="text-sm font-bold text-slate-200 truncate px-2">
                      {podiumPlayers[2].username}
                      {podiumPlayers[2].username === currentUsername && <span className="ml-1 text-xs bg-indigo-500/20 text-indigo-300 px-1 py-0.2 rounded">我</span>}
                    </div>
                    <div className="text-lg font-black text-amber-600 font-mono mt-1">
                      {podiumPlayers[2].score.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Table List of ranks */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/40" id="leaderboard-table-wrapper">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs font-mono tracking-wider bg-slate-950/80">
                  <th className="py-3 px-4 font-bold text-center w-16">排名</th>
                  <th className="py-3 px-4 font-bold">玩家</th>
                  {selectedGame === 'all' && <th className="py-3 px-4 font-bold">游戏项目</th>}
                  <th className="py-3 px-4 font-bold text-right pr-6">得分</th>
                  <th className="py-3 px-4 font-bold text-right w-36">比赛时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-sm">
                {listPlayers.map((entry, index) => {
                  // If selectedGame is 'all', ranks are arbitrary, so we just show index + 1 or date bullet
                  // If specific game, index starts from 0 or 3 (since top 3 are on podium)
                  const rank = selectedGame === 'all' ? index + 1 : index + 4;
                  const isCurrentUser = entry.username === currentUsername;
                  const colors = GAME_COLORS[entry.gameId];

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-slate-900/40 transition-colors ${
                        isCurrentUser ? 'bg-indigo-950/20 text-indigo-200 font-medium border-l-2 border-indigo-500' : 'text-slate-300'
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-3.5 px-4 text-center">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs">1</span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs">2</span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-slate-100 font-black text-xs">3</span>
                        ) : (
                          <span className="text-xs font-mono text-slate-500 font-semibold">{rank}</span>
                        )}
                      </td>

                      {/* Player Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base">
                            {entry.isAI ? '🤖' : '👤'}
                          </span>
                          <span className="truncate max-w-[120px] sm:max-w-xs font-medium">
                            {entry.username}
                          </span>
                          {entry.isAI && (
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/30 px-1 py-0.2 rounded">
                              NPC挑战者
                            </span>
                          )}
                          {isCurrentUser && !entry.isAI && (
                            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-800/30 px-1 py-0.2 rounded">
                              我
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Game ID (Only shown on 'all' view) */}
                      {selectedGame === 'all' && (
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                            <span>
                              {entry.gameId === 'snake'
                                ? '🐍'
                                : entry.gameId === 'game2048'
                                ? '🔳'
                                : entry.gameId === 'memory'
                                ? '🃏'
                                : entry.gameId === 'minesweeper'
                                ? '💣'
                                : '🕷️'}
                            </span>
                            {GAME_NAMES[entry.gameId]}
                          </span>
                        </td>
                      )}

                      {/* Score Column */}
                      <td className="py-3.5 px-4 text-right pr-6 font-mono font-bold text-slate-100">
                        {entry.score.toLocaleString()}
                      </td>

                      {/* Date Column */}
                      <td className="py-3.5 px-4 text-right text-xs text-slate-500 font-mono">
                        {entry.date}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
