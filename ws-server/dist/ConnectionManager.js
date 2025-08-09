export class ConnectionManager {
    sessions = new Map();
    connectionsByPlayer = new Map();
    ipConnectionCount = new Map();
    addConnection(ws, sessionId, playerId, ip) {
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
    removeConnection(ws) {
        if (!ws.sessionId || !ws.playerId)
            return;
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
            }
            else {
                this.ipConnectionCount.delete(ws.ip);
            }
        }
        console.log(`[Connection] Removed: session=${ws.sessionId}, player=${ws.playerId}`);
    }
    broadcastToSession(sessionId, message, excludePlayerId) {
        const connections = this.sessions.get(sessionId);
        if (!connections)
            return;
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
    sendToPlayer(playerId, message) {
        const ws = this.connectionsByPlayer.get(playerId);
        if (!ws || ws.readyState !== ws.OPEN)
            return false;
        ws.send(JSON.stringify(message));
        return true;
    }
    getSessionConnections(sessionId) {
        return this.sessions.get(sessionId)?.size || 0;
    }
    getAllSessions() {
        return Array.from(this.sessions.keys());
    }
    disconnectSession(sessionId) {
        const connections = this.sessions.get(sessionId);
        if (!connections)
            return;
        connections.forEach(ws => {
            ws.close(1000, 'Session ended');
        });
    }
    // Heartbeat management
    markAlive(ws) {
        ws.isAlive = true;
    }
    checkHeartbeats() {
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
//# sourceMappingURL=ConnectionManager.js.map