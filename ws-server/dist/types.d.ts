import type { WebSocket } from 'ws';
export interface WSMessage {
    type: WSMessageType;
    sessionId: string;
    playerId?: string;
    data: any;
    timestamp: Date;
}
export declare enum WSMessageType {
    CONNECT = "connect",
    DISCONNECT = "disconnect",
    HEARTBEAT = "heartbeat",
    JOIN_SESSION = "join_session",
    LEAVE_SESSION = "leave_session",
    SESSION_UPDATED = "session_updated",
    PLAYER_JOINED = "player_joined",
    PLAYER_LEFT = "player_left",
    PLAYER_UPDATED = "player_updated",
    CATEGORIES_SELECTED = "categories_selected",
    CARDS_GENERATED = "cards_generated",
    GAME_STARTED = "game_started",
    GAME_ENDED = "game_ended",
    SQUARE_CLAIMED = "square_claimed",
    SQUARE_CONFIRMED = "square_confirmed",
    SQUARE_REJECTED = "square_rejected",
    PATTERN_COMPLETED = "pattern_completed",
    SCORE_UPDATED = "score_updated",
    ERROR = "error"
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
//# sourceMappingURL=types.d.ts.map