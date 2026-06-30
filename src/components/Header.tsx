/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trophy, Gamepad2, User, ChevronRight, Volume2, VolumeX, Sparkles, AlertCircle } from 'lucide-react';
import { PlayerProfile } from '../types';

interface HeaderProps {
  profile: PlayerProfile;
  onChangeProfile: (profile: PlayerProfile) => void;
  activeTab: 'games' | 'leaderboard';
  setActiveTab: (tab: 'games' | 'leaderboard') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const AVATARS = ['🎮', '👾', '🕹️', '🦊', '🐱', '🐼', '🦖', '🚀', '🧙‍♂️', '🦸', '🦄', '🍕', '⚽', '👽', '💀'];

export default function Header({
  profile,
  onChangeProfile,
  activeTab,
  setActiveTab,
  soundEnabled,
  setSoundEnabled,
}: HeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(profile.username);
  const [tempAvatar, setTempAvatar] = useState(profile.avatar);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = tempName.trim() || '神秘玩家';
    onChangeProfile({
      username: finalName,
      avatar: tempAvatar,
    });
    setIsEditing(false);
  };

  return (
    <header className="relative z-10 w-full border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-4 py-3 sm:px-6 shadow-xl">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('games')} 
          className="flex items-center gap-3 cursor-pointer group"
          id="header-brand-logo"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] group-hover:scale-105 transition-transform duration-300">
            <Gamepad2 className="w-6 h-6 animate-pulse" />
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 opacity-30 blur-sm group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent font-sans">
              ARCADE MINI <span className="text-cyan-400">微乐园</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">CLASSIC MINI-GAMES & LEADERBOARDS</p>
          </div>
        </div>

        {/* Middle Navigation */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800" id="header-nav">
          <button
            onClick={() => setActiveTab('games')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeTab === 'games'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="nav-games-btn"
          >
            <Gamepad2 className="w-4 h-4" />
            游戏大厅
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="nav-leaderboard-btn"
          >
            <Trophy className="w-4 h-4" />
            排行榜单
          </button>
        </div>

        {/* User Profile & Controls */}
        <div className="flex items-center gap-4 flex-wrap justify-center" id="header-profile-section">
          {isEditing ? (
            <form onSubmit={handleSave} className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-indigo-500/40 animate-fade-in">
              {/* Avatar Selector Dropdown-like or Simple horizontal scroll */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-[120px] px-1 scrollbar-none py-0.5">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setTempAvatar(emoji)}
                    className={`text-lg p-0.5 rounded transition-transform hover:scale-125 ${
                      tempAvatar === emoji ? 'bg-indigo-600/50 scale-110 ring-1 ring-indigo-400' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <input
                type="text"
                maxLength={10}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-400"
                placeholder="用户名"
              />

              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg transition-colors"
                id="profile-save-btn"
              >
                保存
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempName(profile.username);
                  setTempAvatar(profile.avatar);
                  setIsEditing(false);
                }}
                className="text-slate-400 hover:text-slate-200 text-xs px-1.5"
                id="profile-cancel-btn"
              >
                取消
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-3">
              {/* Profile Card */}
              <div 
                onClick={() => {
                  setTempName(profile.username);
                  setTempAvatar(profile.avatar);
                  setIsEditing(true);
                }}
                className="flex items-center gap-2 bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800 hover:border-indigo-500/30 px-3 py-1.5 rounded-xl cursor-pointer group transition-all duration-300"
                title="修改个人信息"
                id="user-profile-badge"
              >
                <span className="text-xl group-hover:animate-bounce">{profile.avatar}</span>
                <div className="text-left">
                  <p className="text-xs text-slate-500 font-mono leading-none">PLAYER</p>
                  <p className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    {profile.username}
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </div>

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2.5 rounded-xl border transition-all duration-300 ${
                  soundEnabled
                    ? 'bg-slate-950/60 border-slate-800 text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/30'
                    : 'bg-slate-950/20 border-slate-900/60 text-slate-600 hover:text-slate-400'
                }`}
                title={soundEnabled ? '静音' : '开启音效'}
                id="sound-toggle-btn"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
