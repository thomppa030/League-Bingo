import { WebSocketServer } from 'ws';
import http from 'http';
import { URL } from 'url';
import { config } from './config.js';
import { ConnectionManager } from './ConnectionManager.js';
import { MessageHandler } from './MessageHandler.js';
import { SessionValidator } from './SessionValidator.js';
import { RateLimiter } from './RateLimiter.js';
import { WSMessageType } from './types.js';
// Initialize components
const connectionManager = new ConnectionManager();
const sessionValidator = new SessionValidator();
const messageHandler = new MessageHandler(connectionManager, sessionValidator);
const rateLimiter = new RateLimiter();
// Create HTTP server
const server = http.createServer((req, res) => {
    // Health check endpoint
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            connections: connectionManager.getAllSessions().length,
            timestamp: new Date()
        }));
        return;
    }
    // CORS headers for non-WebSocket requests
    const origin = req.headers.origin;
    if (origin && config.cors.allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    res.writeHead(404);
    res.end('Not found');
});
// Create WebSocket server
const wss = new WebSocketServer({ noServer: true });
// Handle WebSocket upgrade
server.on('upgrade', async (request, socket, head) => {
    const origin = request.headers.origin;
    // Check CORS
    if (origin && !config.cors.allowedOrigins.includes(origin)) {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
    }
    // Parse URL
    const url = new URL(request.url, `http://${request.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    const playerId = url.searchParams.get('playerId');
    // Validate required parameters
    if (!sessionId || !playerId) {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
    }
    // Get client IP
    const ip = request.headers['x-forwarded-for'] ||
        request.socket.remoteAddress ||
        'unknown';
    // Validate session and player
    const isValid = await sessionValidator.validateSession(sessionId, playerId);
    if (!isValid) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
    }
    // Accept WebSocket connection
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, sessionId, playerId, ip);
    });
});
// Handle new WebSocket connections
wss.on('connection', (ws, sessionId, playerId, ip) => {
    console.log(`[WS] New connection: session=${sessionId}, player=${playerId}`);
    // Add connection
    const added = connectionManager.addConnection(ws, sessionId, playerId, ip);
    if (!added) {
        ws.close(1008, 'Too many connections');
        return;
    }
    // Send connection confirmation
    ws.send(JSON.stringify({
        type: WSMessageType.CONNECT,
        sessionId,
        playerId,
        timestamp: new Date()
    }));
    // Notify others in session
    connectionManager.broadcastToSession(sessionId, {
        type: WSMessageType.PLAYER_JOINED,
        sessionId,
        playerId,
        data: { playerId },
        timestamp: new Date()
    }, playerId);
    // Set up heartbeat
    ws.isAlive = true;
    ws.on('pong', () => {
        connectionManager.markAlive(ws);
    });
    // Handle messages
    ws.on('message', async (data) => {
        try {
            // Rate limiting
            if (!rateLimiter.checkLimit(ip)) {
                ws.send(JSON.stringify({
                    type: WSMessageType.ERROR,
                    error: 'Rate limit exceeded',
                    timestamp: new Date()
                }));
                return;
            }
            const message = JSON.parse(data.toString());
            await messageHandler.handleMessage(ws, message);
        }
        catch (error) {
            console.error('[WS] Error handling message:', error);
            ws.send(JSON.stringify({
                type: WSMessageType.ERROR,
                error: 'Invalid message format',
                timestamp: new Date()
            }));
        }
    });
    // Handle disconnection
    ws.on('close', () => {
        console.log(`[WS] Connection closed: session=${sessionId}, player=${playerId}`);
        connectionManager.removeConnection(ws);
        // Notify others
        connectionManager.broadcastToSession(sessionId, {
            type: WSMessageType.PLAYER_LEFT,
            sessionId,
            playerId,
            data: { playerId },
            timestamp: new Date()
        });
    });
    // Handle errors
    ws.on('error', (error) => {
        console.error(`[WS] WebSocket error:`, error);
    });
});
// Heartbeat interval
const heartbeatInterval = setInterval(() => {
    connectionManager.checkHeartbeats();
}, config.heartbeat.interval);
// Cleanup on server shutdown
process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received, shutting down...');
    clearInterval(heartbeatInterval);
    wss.close(() => {
        server.close(() => {
            process.exit(0);
        });
    });
});
// Start server
server.listen(config.port, () => {
    console.log(`[Server] WebSocket server running on port ${config.port}`);
    console.log(`[Server] Environment: ${config.nodeEnv}`);
    console.log(`[Server] CORS origins: ${config.cors.allowedOrigins.join(', ')}`);
});
//# sourceMappingURL=server.js.map