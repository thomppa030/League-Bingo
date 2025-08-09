import { WebSocketServer } from 'ws';
import http from 'http';
import { URL } from 'url';
import { config } from './config.js';
import { ConnectionManager } from './ConnectionManager.js';
import { MessageHandler } from './MessageHandler.js';
import { SessionValidator } from './SessionValidator.js';
import { RateLimiter } from './RateLimiter.js';
import type { AuthenticatedWebSocket, WSMessage } from './types.js';
import { WSMessageType } from './types.js';

// Initialize components
const connectionManager = new ConnectionManager();
const sessionValidator = new SessionValidator();
const messageHandler = new MessageHandler(connectionManager, sessionValidator);
const rateLimiter = new RateLimiter();

// Create HTTP server with error handling
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

  // Debug endpoint for connection diagnostics
  if (req.url === '/debug/connection' && req.method === 'GET') {
    const ip = req.headers['x-forwarded-for'] as string || 
               req.socket.remoteAddress || 
               'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const origin = req.headers.origin;
    
    const diagnostics = {
      server: {
        port: config.port,
        environment: config.nodeEnv,
        corsOrigins: config.cors.allowedOrigins,
        maxConnectionsPerIp: config.security.maxConnectionsPerIp
      },
      client: {
        ip,
        userAgent,
        origin,
        headers: req.headers,
        connectionAllowed: !origin || config.cors.allowedOrigins.includes(origin),
        ipConnectionCount: 0 // TODO: get from connection manager
      },
      timestamp: new Date()
    };

    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(diagnostics, null, 2));
    return;
  }

  // Webhook endpoint for broadcasts
  if (req.url === '/webhook/broadcast' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const { sessionId, message } = JSON.parse(body);
        console.log(`[Webhook] Received broadcast request for session ${sessionId}:`, message.type);
        
        // Broadcast to all connections in the session
        connectionManager.broadcastToSession(sessionId, message);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('[Webhook] Error processing broadcast:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
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
  const userAgent = request.headers['user-agent'] || 'unknown';
  
  // Get client IP
  const ip = request.headers['x-forwarded-for'] as string || 
             request.socket.remoteAddress || 
             'unknown';

  console.log(`[Upgrade] WebSocket upgrade request from ${ip}:`);
  console.log(`  Origin: ${origin || 'none'}`);
  console.log(`  User-Agent: ${userAgent}`);
  console.log(`  URL: ${request.url}`);
  console.log(`  Headers:`, Object.keys(request.headers));
  
  // Check CORS with detailed logging
  if (origin && !config.cors.allowedOrigins.includes(origin)) {
    console.log(`[Upgrade] ❌ CORS rejection: Origin "${origin}" not in allowed origins:`, config.cors.allowedOrigins);
    socket.write('HTTP/1.1 403 Forbidden\r\nContent-Type: text/plain\r\n\r\nCORS: Origin not allowed\r\n');
    socket.destroy();
    return;
  }

  // Parse URL with error handling
  let url: URL;
  try {
    url = new URL(request.url!, `http://${request.headers.host}`);
  } catch (error) {
    console.log(`[Upgrade] ❌ Invalid URL: ${request.url}`, error);
    socket.write('HTTP/1.1 400 Bad Request\r\nContent-Type: text/plain\r\n\r\nInvalid URL format\r\n');
    socket.destroy();
    return;
  }
  
  const sessionId = url.searchParams.get('sessionId');
  const playerId = url.searchParams.get('playerId');

  console.log(`  SessionId: ${sessionId}`);
  console.log(`  PlayerId: ${playerId}`);

  // Validate required parameters
  if (!sessionId || !playerId) {
    console.log(`[Upgrade] ❌ Missing parameters: sessionId=${sessionId}, playerId=${playerId}`);
    socket.write('HTTP/1.1 400 Bad Request\r\nContent-Type: text/plain\r\n\r\nMissing sessionId or playerId parameters\r\n');
    socket.destroy();
    return;
  }

  // Validate session and player with detailed error handling
  try {
    console.log(`[Upgrade] 🔍 Validating session ${sessionId} for player ${playerId}...`);
    const isValid = await sessionValidator.validateSession(sessionId, playerId);
    if (!isValid) {
      console.log(`[Upgrade] ❌ Session validation failed: sessionId=${sessionId}, playerId=${playerId}`);
      socket.write('HTTP/1.1 401 Unauthorized\r\nContent-Type: text/plain\r\n\r\nInvalid session or player\r\n');
      socket.destroy();
      return;
    }
    console.log(`[Upgrade] ✅ Session validation passed`);
  } catch (error) {
    console.log(`[Upgrade] ❌ Session validation error:`, error);
    socket.write('HTTP/1.1 500 Internal Server Error\r\nContent-Type: text/plain\r\n\r\nSession validation failed\r\n');
    socket.destroy();
    return;
  }

  // Accept WebSocket connection with error handling
  try {
    console.log(`[Upgrade] ✅ Accepting WebSocket connection...`);
    wss.handleUpgrade(request, socket, head, (ws) => {
      console.log(`[Upgrade] ✅ WebSocket upgrade successful, emitting connection event`);
      wss.emit('connection', ws, sessionId, playerId, ip);
    });
  } catch (error) {
    console.error(`[Upgrade] ❌ WebSocket upgrade failed:`, error);
    socket.write('HTTP/1.1 500 Internal Server Error\r\nContent-Type: text/plain\r\n\r\nWebSocket upgrade failed\r\n');
    socket.destroy();
  }
});

// Handle new WebSocket connections
wss.on('connection', (ws: AuthenticatedWebSocket, sessionId: string, playerId: string, ip: string) => {
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

      const message: WSMessage = JSON.parse(data.toString());
      await messageHandler.handleMessage(ws, message);
    } catch (error) {
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

// Add server error handling
server.on('error', (error) => {
  console.error('[Server] HTTP server error:', error);
});

server.on('clientError', (error, socket) => {
  console.error('[Server] Client connection error:', error);
  console.error('[Server] Client IP:', (socket as any).remoteAddress || 'unknown');
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

// Add WebSocket server error handling
wss.on('error', (error) => {
  console.error('[WSS] WebSocket server error:', error);
});

// Start server
server.listen(config.port, () => {
  console.log(`[Server] WebSocket server running on port ${config.port}`);
  console.log(`[Server] Environment: ${config.nodeEnv}`);
  console.log(`[Server] CORS origins: ${config.cors.allowedOrigins.join(', ')}`);
  console.log(`[Server] Max connections per IP: ${config.security.maxConnectionsPerIp}`);
  console.log(`[Server] Rate limit: ${config.security.rateLimitMessagesPerMinute} messages/minute`);
});