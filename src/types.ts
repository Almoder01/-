/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameType = 'snake' | 'game2048' | 'memory' | 'minesweeper' | 'spider';

export interface LeaderboardEntry {
  id: string;
  gameId: GameType;
  username: string;
  score: number;
  date: string;
  isAI?: boolean;
}

export interface PlayerProfile {
  username: string;
  avatar: string; // emoji character or pre-selected avatar identifier
}

export interface GameScoreState {
  currentScore: number;
  highScore: number;
  gameOver: boolean;
  isPlaying: boolean;
}
