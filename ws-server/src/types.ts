import type { WebSocket } from 'ws';

// Re-export types from main project (in production, share these via package)
export interface WSMessage {
  type: WSMessageType;
  sessionId: string;
  playerId?: string;
  data: any;
  timestamp: Date;
}

export enum WSMessageType {
  // Connection
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  HEARTBEAT = "heartbeat",
  
  // Session
  JOIN_SESSION = "join_session",
  LEAVE_SESSION = "leave_session",
  SESSION_UPDATED = "session_updated",
  
  // Players
  PLAYER_JOINED = "player_joined",
  PLAYER_LEFT = "player_left",
  PLAYER_UPDATED = "player_updated",
  
  // Game
  CATEGORIES_SELECTED = "categories_selected",
  CARDS_GENERATED = "cards_generated",
  GAME_STARTED = "game_started",
  GAME_ENDED = "game_ended",
  
  // Bingo
  SQUARE_CLAIMED = "square_claimed",
  SQUARE_CONFIRMED = "square_confirmed",
  SQUARE_REJECTED = "square_rejected",
  PATTERN_COMPLETED = "pattern_completed",
  SCORE_UPDATED = "score_updated",
  
  // System
  ERROR = "error",
}

export interface AuthenticatedWebSocket extends WebSocket {
  sessionId?: string;
  playerId?: string;
  isAlive?: boolean;
  ip?: string;
}

export interface SessionConnection {
  sessionId: string;
  connections: Set<AuthenticatedWebSocket>;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
}