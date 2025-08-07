import type { AuthenticatedWebSocket, WSMessage } from './types.js';

export class ConnectionManager {
  private sessions: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private connectionsByPlayer: Map<string, AuthenticatedWebSocket> = new Map();
  private ipConnectionCount: Map<string, number> = new Map();

  addConnection(ws: AuthenticatedWebSocket, sessionId: string, playerId: string, ip: string): boolean {
    // Check IP rate limit
    const ipCount = this.ipConnectionCount.get(ip) || 0;
    if (ipCount >= 10) { // Max connections per IP
      return false;
    }

    // Remove any existing connection for this player
    this.removeConnection(ws);

    // Add to session
    ws.sessionId = sessionId;
    ws.playerId = playerId;
    ws.ip = ip;

    let sessionConnections = this.sessions.get(sessionId);
    if (!sessionConnections) {
      sessionConnections = new Set();
      this.sessions.set(sessionId, sessionConnections);
    }
    sessionConnections.add(ws);

    // Track by player ID
    this.connectionsByPlayer.set(playerId, ws);

    // Update IP count
    this.ipConnectionCount.set(ip, ipCount + 1);

    console.log(`[Connection] Added: session=${sessionId}, player=${playerId}, total=${sessionConnections.size}`);
    return true;
  }

  removeConnection(ws: AuthenticatedWebSocket): void {
    if (!ws.sessionId || !ws.playerId) return;

    // Remove from session
    const sessionConnections = this.sessions.get(ws.sessionId);
    if (sessionConnections) {
      sessionConnections.delete(ws);
      if (sessionConnections.size === 0) {
        this.sessions.delete(ws.sessionId);
      }
    }

    // Remove from player map
    this.connectionsByPlayer.delete(ws.playerId);

    // Update IP count
    if (ws.ip) {
      const ipCount = this.ipConnectionCount.get(ws.ip) || 0;
      if (ipCount > 1) {
        this.ipConnectionCount.set(ws.ip, ipCount - 1);
      } else {
        this.ipConnectionCount.delete(ws.ip);
      }
    }

    console.log(`[Connection] Removed: session=${ws.sessionId}, player=${ws.playerId}`);
  }

  broadcastToSession(sessionId: string, message: WSMessage, excludePlayerId?: string): void {
    const connections = this.sessions.get(sessionId);
    if (!connections) return;

    const messageStr = JSON.stringify(message);
    let sent = 0;

    connections.forEach(ws => {
      if (ws.readyState === ws.OPEN && ws.playerId !== excludePlayerId) {
        ws.send(messageStr);
        sent++;
      }
    });

    console.log(`[Broadcast] session=${sessionId}, type=${message.type}, sent=${sent}/${connections.size}`);
  }

  sendToPlayer(playerId: string, message: WSMessage): boolean {
    const ws = this.connectionsByPlayer.get(playerId);
    if (!ws || ws.readyState !== ws.OPEN) return false;

    ws.send(JSON.stringify(message));
    return true;
  }

  getSessionConnections(sessionId: string): number {
    return this.sessions.get(sessionId)?.size || 0;
  }

  getAllSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  disconnectSession(sessionId: string): void {
    const connections = this.sessions.get(sessionId);
    if (!connections) return;

    connections.forEach(ws => {
      ws.close(1000, 'Session ended');
    });
  }

  // Heartbeat management
  markAlive(ws: AuthenticatedWebSocket): void {
    ws.isAlive = true;
  }

  checkHeartbeats(): void {
    this.sessions.forEach((connections) => {
      connections.forEach(ws => {
        if (ws.isAlive === false) {
          console.log(`[Heartbeat] Terminating inactive connection: ${ws.playerId}`);
          ws.terminate();
          return;
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    });
  }
}