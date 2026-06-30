/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Gamepad2, ArrowLeft, Volume2, Star, Target, Info, Flame } from 'lucide-react';
import Header from './components/Header';
import Leaderboard from './components/Leaderboard';
import SnakeGame from './components/SnakeGame';
import Game2048 from './components/Game2048';
import MemoryMatch from './components/MemoryMatch';
import Minesweeper from './components/Minesweeper';
import SpiderSolitaire from './components/SpiderSolitaire';
import { PlayerProfile, GameType } from './types';
import { getHighScore } from './utils/leaderboardHelper';
import { playSound } from './utils/audio';

const DEFAULT_PROFILE: PlayerProfile = {
  username: '像素玩家 👾',
  avatar: '🎮',
};

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    const saved = localStorage.getItem('arcade_player_profile');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const [activeTab, setActiveTab] = useState<'games' | 'leaderboard'>('games');
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('arcade_sound_enabled');
    return saved ? JSON.parse(saved) === true : true;
  });

  // Track key highlights to display on the menu
  const [snakeHighScore, setSnakeHighScore] = useState(0);
  const [game2048HighScore, setGame2048HighScore] = useState(0);
  const [memoryHighScore, setMemoryHighScore] = useState(0);
  const [minesweeperHighScore, setMinesweeperHighScore] = useState(0);
  const [spiderHighScore, setSpiderHighScore] = useState(0);

  const loadAllHighScores = () => {
    setSnakeHighScore(getHighScore('snake', profile.username));
    setGame2048HighScore(getHighScore('game2048', profile.username));
    setMemoryHighScore(getHighScore('memory', profile.username));
    setMinesweeperHighScore(getHighScore('minesweeper', profile.username));
    setSpiderHighScore(getHighScore('spider', profile.username));
  };

  // Sync profile to localStorage
  useEffect(() => {
    localStorage.setItem('arcade_player_profile', JSON.stringify(profile));
    loadAllHighScores();
  }, [profile]);

  // Sync sound setting to localStorage
  useEffect(() => {
    localStorage.setItem('arcade_sound_enabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  // Load high scores on load
  useEffect(() => {
    loadAllHighScores();
  }, []);

  const handleSelectGame = (game: GameType) => {
    playSound('click', soundEnabled);
    setActiveGame(game);
    setActiveTab('games');
  };

  const handleBackToLobby = () => {
    playSound('click', soundEnabled);
    setActiveGame(null);
    loadAllHighScores();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden" id="arcade-app-root">
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(30,41,59,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,41,59,0.2)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="fixed top-12 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-12 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />

      {/* Main Header Component */}
      <Header
        profile={profile}
        onChangeProfile={setProfile}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          playSound('click', soundEnabled);
          setActiveTab(tab);
        }}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      {/* Primary Layout Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 md:py-12 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'games' ? (
            activeGame === null ? (
              /* --- Game Lobby Selection Grid --- */
              <motion.div
                key="lobby"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-10"
                id="arcade-lobby"
              >
                {/* Hero welcoming section */}
                <div className="text-center space-y-3">
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-400 font-mono"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    欢迎来到复古游戏街机大厅
                  </motion.div>
                  <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                    请选择你的游戏挑战
                  </h2>
                  <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
                    无需下载，即点即玩！创造属于你的个人得分记录，并在殿堂排行榜上击败其他玩家吧！
                  </p>
                </div>

                {/* Game Cards Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-4">
                  
                  {/* Card: Snake Game */}
                  <motion.div
                    whileHover={{ y: -6 }}
                    className="group bg-slate-900/60 rounded-3xl border border-slate-800/80 hover:border-emerald-500/40 p-6 flex flex-col justify-between shadow-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-300 relative overflow-hidden"
                    id="game-card-snake"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
                    
                    <div>
                      {/* Badge / Stats */}
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-3xl p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                          🐍
                        </span>
                        {snakeHighScore > 0 ? (
                          <div className="text-right">
                            <p className="text-[10px] font-mono text-slate-500">MY RECORD</p>
                            <p className="text-sm font-black font-mono text-emerald-400">{snakeHighScore}</p>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500 border border-slate-800 px-2 py-1 rounded-full bg-slate-950/40">
                            未挑战
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                        贪吃蛇大作战
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-6">
                        复古像素风街机神作！操控贪吃蛇躲避障碍与墙壁，吞噬各色高分食物药水，挑战灵活身手！
                      </p>
                    </div>

                    <button
                      onClick={() => handleSelectGame('snake')}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black py-3 px-4 rounded-2xl shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.35)] transition-all duration-300 flex items-center justify-center gap-1.5 text-xs tracking-wider"
                      id="play-snake-btn"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      开始街机游戏
                    </button>
                  </motion.div>

                  {/* Card: 2048 Puzzle */}
                  <motion.div
                    whileHover={{ y: -6 }}
                    className="group bg-slate-900/60 rounded-3xl border border-slate-800/80 hover:border-amber-500/40 p-6 flex flex-col justify-between shadow-lg hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] transition-all duration-300 relative overflow-hidden"
                    id="game-card-2048"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
                    
                    <div>
                      {/* Badge / Stats */}
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-3xl p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                          🔳
                        </span>
                        {game2048HighScore > 0 ? (
                          <div className="text-right">
                            <p className="text-[10px] font-mono text-slate-500">MY RECORD</p>
                            <p className="text-sm font-black font-mono text-amber-400">{game2048HighScore.toLocaleString()}</p>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500 border border-slate-800 px-2 py-1 rounded-full bg-slate-950/40">
                            未挑战
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                        2048 智力拼图
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-6">
                        风靡全球的数字合并益智棋盘。在 4x4 的格子中合理计算与滑动。合并方块直至获得闪耀的 2048！
                      </p>
                    </div>

                    <button
                      onClick={() => handleSelectGame('game2048')}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black py-3 px-4 rounded-2xl shadow-[0_4px_12px_rgba(245,158,11,0.2)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.35)] transition-all duration-300 flex items-center justify-center gap-1.5 text-xs tracking-wider"
                      id="play-2048-btn"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      开始智力谜题
                    </button>
                  </motion.div>

                  {/* Card: Memory Match */}
                  <motion.div
                    whileHover={{ y: -6 }}
                    className="group bg-slate-900/60 rounded-3xl border border-slate-800/80 hover:border-cyan-500/40 p-6 flex flex-col justify-between shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] transition-all duration-300 relative overflow-hidden"
                    id="game-card-memory"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
                    
                    <div>
                      {/* Badge / Stats */}
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-3xl p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                          🃏
                        </span>
                        {memoryHighScore > 0 ? (
                          <div className="text-right">
                            <p className="text-[10px] font-mono text-slate-500">MY RECORD</p>
                            <p className="text-sm font-black font-mono text-cyan-400">{memoryHighScore}</p>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500 border border-slate-800 px-2 py-1 rounded-full bg-slate-950/40">
                            未挑战
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                        脑力卡片翻翻乐
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-6">
                        极致的脑力集中与记忆大碰撞！翻开精美的卡片收集配对，利用快速的连续配对维持巨额连击得分！
                      </p>
                    </div>

                    <button
                      onClick={() => handleSelectGame('memory')}
                      className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black py-3 px-4 rounded-2xl shadow-[0_4px_12px_rgba(6,182,212,0.2)] hover:shadow-[0_6px_20px_rgba(6,182,212,0.35)] transition-all duration-300 flex items-center justify-center gap-1.5 text-xs tracking-wider"
                      id="play-memory-btn"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      开始记忆挑战
                    </button>
                  </motion.div>

                  {/* Card: Minesweeper */}
                  <motion.div
                    whileHover={{ y: -6 }}
                    className="group bg-slate-900/60 rounded-3xl border border-slate-800/80 hover:border-rose-500/40 p-6 flex flex-col justify-between shadow-lg hover:shadow-[0_0_30px_rgba(244,63,94,0.1)] transition-all duration-300 relative overflow-hidden"
                    id="game-card-minesweeper"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-2xl pointer-events-none group-hover:bg-rose-500/10 transition-colors" />
                    
                    <div>
                      {/* Badge / Stats */}
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-3xl p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                          💣
                        </span>
                        {minesweeperHighScore > 0 ? (
                          <div className="text-right">
                            <p className="text-[10px] font-mono text-slate-500">MY RECORD</p>
                            <p className="text-sm font-black font-mono text-rose-400">{minesweeperHighScore}</p>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500 border border-slate-800 px-2 py-1 rounded-full bg-slate-950/40">
                            未挑战
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-rose-400 transition-colors">
                        经典扫雷
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-6">
                        怀旧而紧张的地雷排查游戏！找出所有地雷而不将其引爆，考验你严密的逻辑推理与敏锐的判断。
                      </p>
                    </div>

                    <button
                      onClick={() => handleSelectGame('minesweeper')}
                      className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-slate-950 font-black py-3 px-4 rounded-2xl shadow-[0_4px_12px_rgba(244,63,94,0.2)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.35)] transition-all duration-300 flex items-center justify-center gap-1.5 text-xs tracking-wider"
                      id="play-minesweeper-btn"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      开始排雷挑战
                    </button>
                  </motion.div>

                  {/* Card: Spider Solitaire */}
                  <motion.div
                    whileHover={{ y: -6 }}
                    className="group bg-slate-900/60 rounded-3xl border border-slate-800/80 hover:border-indigo-500/40 p-6 flex flex-col justify-between shadow-lg hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all duration-300 relative overflow-hidden"
                    id="game-card-spider"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
                    
                    <div>
                      {/* Badge / Stats */}
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-3xl p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                          🕷️
                        </span>
                        {spiderHighScore > 0 ? (
                          <div className="text-right">
                            <p className="text-[10px] font-mono text-slate-500">MY RECORD</p>
                            <p className="text-sm font-black font-mono text-indigo-400">{spiderHighScore}</p>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500 border border-slate-800 px-2 py-1 rounded-full bg-slate-950/40">
                            未挑战
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                        蜘蛛纸牌
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-6">
                        经典的单人纸牌排雷大作！按降序花色对齐叠放，把它们理顺成为成套的黑桃牌堆进行消除。
                      </p>
                    </div>

                    <button
                      onClick={() => handleSelectGame('spider')}
                      className="w-full bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-400 hover:to-cyan-500 text-slate-950 font-black py-3 px-4 rounded-2xl shadow-[0_4px_12px_rgba(99,102,241,0.2)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.35)] transition-all duration-300 flex items-center justify-center gap-1.5 text-xs tracking-wider"
                      id="play-spider-btn"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      开始纸牌对决
                    </button>
                  </motion.div>

                </div>
              </motion.div>
            ) : (
              /* --- Active Game Workspace Screen --- */
              <motion.div
                key="active-game-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
                id="active-game-stage"
              >
                {/* Back to Lobby Action */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <button
                    onClick={handleBackToLobby}
                    className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl transition-all duration-300 active:scale-95"
                    id="back-lobby-btn"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    返回游戏大厅
                  </button>

                  <div className="text-xs font-mono text-slate-500 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>正在以 <b>{profile.username} {profile.avatar}</b> 身份参赛</span>
                  </div>
                </div>

                {/* Direct Rendering of selected mini game screen */}
                <div className="bg-slate-900/30 border border-slate-900/80 p-4 sm:p-8 rounded-3xl shadow-2xl relative">
                  {activeGame === 'snake' && (
                    <SnakeGame
                      username={profile.username}
                      soundEnabled={soundEnabled}
                      onScoreSubmitted={loadAllHighScores}
                    />
                  )}
                  {activeGame === 'game2048' && (
                    <Game2048
                      username={profile.username}
                      soundEnabled={soundEnabled}
                      onScoreSubmitted={loadAllHighScores}
                    />
                  )}
                  {activeGame === 'memory' && (
                    <MemoryMatch
                      username={profile.username}
                      soundEnabled={soundEnabled}
                      onScoreSubmitted={loadAllHighScores}
                    />
                  )}
                  {activeGame === 'minesweeper' && (
                    <Minesweeper
                      username={profile.username}
                      soundEnabled={soundEnabled}
                      onScoreSubmitted={loadAllHighScores}
                    />
                  )}
                  {activeGame === 'spider' && (
                    <SpiderSolitaire
                      username={profile.username}
                      soundEnabled={soundEnabled}
                      onScoreSubmitted={loadAllHighScores}
                    />
                  )}
                </div>
              </motion.div>
            )
          ) : (
            /* --- Leaderboards Tab Dashboard --- */
            <motion.div
              key="leaderboards"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              id="leaderboards-tab-view"
            >
              <Leaderboard 
                currentUsername={profile.username} 
                onResetFinished={loadAllHighScores}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer copyright */}
      <footer className="w-full border-t border-slate-900/80 py-6 mt-8">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-mono text-center sm:text-left">
          <p>© 2026 Arcade Mini-Game Arena. Designed for casual retro gaming.</p>
          <p>Local Persistent Storage Active 💾</p>
        </div>
      </footer>
    </div>
  );
}
