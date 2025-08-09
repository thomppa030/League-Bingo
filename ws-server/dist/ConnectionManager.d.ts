import type { AuthenticatedWebSocket, WSMessage } from './types.js';
export declare class ConnectionManager {
    private sessions;
    private connectionsByPlayer;
    private ipConnectionCount;
    addConnection(ws: AuthenticatedWebSocket, sessionId: string, playerId: string, ip: string): boolean;
    removeConnection(ws: AuthenticatedWebSocket): void;
    broadcastToSession(sessionId: string, message: WSMessage, excludePlayerId?: string): void;
    sendToPlayer(playerId: string, message: WSMessage): boolean;
    getSessionConnections(sessionId: string): number;
    getAllSessions(): string[];
    disconnectSession(sessionId: string): void;
    markAlive(ws: AuthenticatedWebSocket): void;
    checkHeartbeats(): void;
}
//# sourceMappingURL=ConnectionManager.d.ts.map