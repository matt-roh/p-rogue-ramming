
export enum RoomType {
  NORMAL = 'NORMAL',
  ENTRANCE = 'ENTRANCE',
  MINI_BOSS = 'MINI_BOSS',
  ARTIFACT = 'ARTIFACT',
  FINAL_BOSS = 'FINAL_BOSS',
}

export enum GameStatus {
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  GAME_OVER_WIN = 'GAME_OVER_WIN',
  GAME_OVER_LOSS = 'GAME_OVER_LOSS',
}

export interface TagStat {
  chance: number;
  mean: number;
  stdDev: number;
}

export interface Modifier {
  type: 'HP' | 'HARDCORE' | 'GAMBLING' | 'NO_GAMBLING' | 'GAMECHANGER' | 'EQUIVALENT_EXCHANGE';
  tag?: string; // The tag this modifier applies to (if applicable)
  description: string;
}

export interface Problem {
  uid: string; // Unique instance ID
  id: number; // Solved.ac ID
  title: string;
  level: number;
  tags: string[];
  url: string;
  isSolved: boolean; // tracked in game session
  reward?: Modifier; // Pre-calculated reward for this problem (Artifacts)
}

export interface Room {
  x: number;
  y: number;
  type: RoomType;
  visited: boolean;
  revealed: boolean;
  cleared: boolean;
  problems: Problem[]; // Problems generated for this room
  problemsSolvedCount: number;
  adjacent: { x: number; y: number }[];
}

export interface PlayerState {
  hp: number;
  maxHp: number;
  handle: string;
  tier: number; // 1-31
  currentRoom: { x: number; y: number };
  modifiers: Modifier[];
  tagStats: Record<string, TagStat>;
  history: string[]; // Log of events
}

export interface GameConfig {
  gridSize: number;
  testMode: boolean;
}
