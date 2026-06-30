/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameType, LeaderboardEntry } from '../types';

// Seed data to make the leaderboard look lively right away!
const SEED_SCORES: Record<GameType, Array<Omit<LeaderboardEntry, 'id' | 'gameId' | 'date'>>> = {
  snake: [
    { username: 'ArcadeKing 👑', score: 180, isAI: true },
    { username: 'PixelNinja 🥷', score: 145, isAI: true },
    { username: 'SpeedyGamer ⚡', score: 110, isAI: true },
    { username: 'CyberCat 🐱', score: 85, isAI: true },
    { username: 'GreenSlither 🐍', score: 55, isAI: true },
    { username: 'RetroPlayer 🕹️', score: 35, isAI: true },
  ],
  game2048: [
    { username: 'MathWizard 🧙‍♂️', score: 32480, isAI: true },
    { username: 'GridMaster 🔳', score: 20480, isAI: true },
    { username: 'PuzzleQueen 👑', score: 16384, isAI: true },
    { username: 'BlockBuster 🧱', score: 9860, isAI: true },
    { username: 'MergeMania 💥', score: 5120, isAI: true },
    { username: 'NumberCruncher 🔢', score: 3200, isAI: true },
  ],
  memory: [
    { username: 'Brainiac 🧠', score: 2850, isAI: true },
    { username: 'EagleEye 🦅', score: 2420, isAI: true },
    { username: 'ZenFocus 🧘', score: 1980, isAI: true },
    { username: 'MatchMaker 💖', score: 1550, isAI: true },
    { username: 'CardFlipper 🃏', score: 1120, isAI: true },
    { username: 'ElephantMemory 🐘', score: 750, isAI: true },
  ],
  minesweeper: [
    { username: 'SweeperPro 💣', score: 920, isAI: true },
    { username: 'BombDefuser 🚨', score: 810, isAI: true },
    { username: 'GridSeeker 🔍', score: 650, isAI: true },
    { username: 'SafeStep 🥾', score: 510, isAI: true },
    { username: 'LuckyClick 🍀', score: 380, isAI: true },
    { username: 'LogicMaster 🧠', score: 240, isAI: true },
  ],
  spider: [
    { username: 'SolitaireGuru 🃏', score: 1120, isAI: true },
    { username: 'CardMaster 👑', score: 980, isAI: true },
    { username: 'SpiderSlayer 🕷️', score: 840, isAI: true },
    { username: 'SuitDealer ♣️', score: 710, isAI: true },
    { username: 'StackBuilder 🏗️', score: 550, isAI: true },
    { username: 'DeckFlipper 🔄', score: 420, isAI: true },
  ],
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function initializeLeaderboards(): void {
  (Object.keys(SEED_SCORES) as GameType[]).forEach((gameId) => {
    const key = `arcade_leaderboard_${gameId}`;
    if (!localStorage.getItem(key)) {
      const seeded = SEED_SCORES[gameId].map((entry, index) => {
        // Stagger dates in the past slightly
        const date = new Date();
        date.setHours(date.getHours() - index * 6 - Math.random() * 4);
        return {
          ...entry,
          id: `seed_${gameId}_${index}`,
          gameId,
          date: formatDate(date),
        };
      });
      localStorage.setItem(key, JSON.stringify(seeded));
    }
  });
}

export function getLeaderboard(gameId: GameType): LeaderboardEntry[] {
  initializeLeaderboards();
  const key = `arcade_leaderboard_${gameId}`;
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const parsed: LeaderboardEntry[] = JSON.parse(data);
      // Sort descending by score
      return parsed.sort((a, b) => b.score - a.score);
    }
  } catch (e) {
    console.error('Failed to parse leaderboard data', e);
  }
  return [];
}

export function addScore(gameId: GameType, username: string, score: number): LeaderboardEntry {
  initializeLeaderboards();
  const key = `arcade_leaderboard_${gameId}`;
  const leaderboard = getLeaderboard(gameId);

  const cleanUsername = username.trim() || '神秘玩家';
  const newEntry: LeaderboardEntry = {
    id: generateId(),
    gameId,
    username: cleanUsername,
    score,
    date: formatDate(new Date()),
    isAI: false,
  };

  leaderboard.push(newEntry);
  // Sort descending and slice to top 50
  const updated = leaderboard
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  localStorage.setItem(key, JSON.stringify(updated));
  return newEntry;
}

export function clearLeaderboard(gameId?: GameType): void {
  if (gameId) {
    localStorage.removeItem(`arcade_leaderboard_${gameId}`);
  } else {
    localStorage.removeItem('arcade_leaderboard_snake');
    localStorage.removeItem('arcade_leaderboard_game2048');
    localStorage.removeItem('arcade_leaderboard_memory');
    localStorage.removeItem('arcade_leaderboard_minesweeper');
    localStorage.removeItem('arcade_leaderboard_spider');
  }
  initializeLeaderboards();
}

export function getHighScore(gameId: GameType, username?: string): number {
  const leaderboard = getLeaderboard(gameId);
  if (username) {
    const userScores = leaderboard.filter((entry) => entry.username.toLowerCase() === username.toLowerCase());
    if (userScores.length > 0) {
      return Math.max(...userScores.map((entry) => entry.score));
    }
  }
  // Return the top score if no username, or 0
  return leaderboard.length > 0 ? leaderboard[0].score : 0;
}
