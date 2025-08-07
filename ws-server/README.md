# League Bingo WebSocket Server

This is the dedicated WebSocket server for League Bingo, handling real-time communication between players.

## Features

- ✅ Real-time bidirectional communication
- ✅ Session-based connection management
- ✅ Player authentication via API validation
- ✅ Rate limiting and security measures
- ✅ Automatic reconnection support
- ✅ Heartbeat/ping-pong for connection health
- ✅ CORS support for cross-origin connections
- ✅ Horizontal scaling ready (with Redis)

## Setup

### 1. Install Dependencies

```bash
cd ws-server
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and adjust settings:

```bash
cp .env.example .env
```

Key configurations:
- `PORT`: WebSocket server port (default: 8080)
- `API_URL`: SvelteKit API server URL for session validation
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins

### 3. Run Development Server

```bash
npm run dev
```

The server will start on `ws://localhost:8080`

### 4. Build for Production

```bash
npm run build
npm start
```

## Architecture

### Connection Flow

1. Client connects with `?sessionId=XXX&playerId=YYY`
2. Server validates session/player with API
3. Connection added to session pool
4. Player receives connection confirmation
5. Other players notified of new player

### Message Types

**Client → Server:**
- `heartbeat`: Keep connection alive
- `square_claimed`: Claim a bingo square
- `player_updated`: Update player state

**Server → Client:**
- `connect`: Connection established
- `player_joined`: New player in session
- `player_left`: Player disconnected
- `square_claimed`: Square claim broadcast
- `square_confirmed`: GM approved square
- `pattern_completed`: Bingo achieved

### Security

- **Rate Limiting**: 60 messages/minute per IP
- **Connection Limits**: 10 connections per IP
- **Session Validation**: All connections verified
- **CORS Protection**: Only allowed origins

## Deployment

### Option 1: Railway.app

1. Create new project on Railway
2. Connect GitHub repo
3. Set root directory to `ws-server`
4. Add environment variables
5. Deploy!

### Option 2: Fly.io

Create `fly.toml`:
```toml
app = "league-bingo-ws"

[env]
  PORT = "8080"

[services]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http", "tls"]
    port = "443"
```

Deploy:
```bash
fly launch
fly deploy
```

### Option 3: Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["node", "dist/server.js"]
```

## Scaling

### Single Server
- Good for ~1,000 concurrent connections
- Simple deployment
- No additional dependencies

### Multi-Server with Redis
1. Uncomment Redis code in server
2. Set `REDIS_URL` in environment
3. Deploy multiple instances
4. Load balance with sticky sessions

### Monitoring

Health check endpoint: `GET /health`

Returns:
```json
{
  "status": "healthy",
  "connections": 42,
  "timestamp": "2024-01-20T10:30:00Z"
}
```

## Development Tips

### Testing WebSocket Connection

Using `wscat`:
```bash
npm install -g wscat
wscat -c "ws://localhost:8080?sessionId=XXX&playerId=YYY"
```

### Debug Logging

The server logs all major events:
- `[WS]` - WebSocket events
- `[Connection]` - Connection management
- `[Message]` - Message handling
- `[Validator]` - Session validation
- `[Server]` - Server lifecycle

### Common Issues

1. **Connection Rejected**: Check session/player IDs are valid
2. **CORS Error**: Add origin to `ALLOWED_ORIGINS`
3. **Rate Limit**: Reduce message frequency
4. **Connection Drops**: Check heartbeat is working

## Integration with SvelteKit

In your SvelteKit app, set the WebSocket URL:

```env
VITE_WS_URL=ws://localhost:8080  # Development
VITE_WS_URL=wss://ws.your-domain.com  # Production
```

The session store will automatically connect when a player joins a session.