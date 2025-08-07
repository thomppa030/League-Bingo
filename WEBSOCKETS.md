# WebSockets in League Bingo

## Table of Contents
1. [What are WebSockets?](#what-are-websockets)
2. [Why WebSockets for League Bingo?](#why-websockets-for-league-bingo)
3. [WebSocket Architecture](#websocket-architecture)
4. [Implementation in This Project](#implementation-in-this-project)
5. [Message Types](#message-types)
6. [Connection Lifecycle](#connection-lifecycle)
7. [Error Handling & Reconnection](#error-handling--reconnection)
8. [Testing WebSockets](#testing-websockets)

## What are WebSockets?

WebSockets provide a full-duplex, bidirectional communication channel between a client (browser) and server over a single TCP connection. Unlike traditional HTTP requests which follow a request-response pattern, WebSockets allow both the client and server to send messages to each other at any time.

### Key Differences from HTTP:

| HTTP | WebSocket |
|------|-----------|
| Request-Response model | Full-duplex communication |
| New connection for each request | Persistent connection |
| Higher overhead (headers) | Low overhead after handshake |
| Client initiates all communication | Both sides can initiate |
| Stateless | Stateful connection |

### WebSocket Connection Flow:

```
1. Client sends HTTP request with "Upgrade: websocket" header
2. Server responds with 101 Switching Protocols
3. Connection upgraded to WebSocket protocol
4. Bidirectional communication begins
5. Either side can send messages at any time
6. Connection remains open until explicitly closed
```

## Why WebSockets for League Bingo?

League Bingo requires real-time synchronization across multiple players:

1. **Instant Updates**: When a player marks a square, all players see it immediately
2. **Live Player Status**: See when players join, leave, or change ready status
3. **Synchronized Game State**: All players see the same game state without refreshing
4. **GM Verification**: Real-time approval/rejection of claimed squares
5. **Pattern Detection**: Instant notification when someone achieves a bingo pattern

Without WebSockets, we'd need:
- Polling (constantly asking server for updates) - inefficient
- Long polling (holding requests open) - resource intensive
- Server-Sent Events (one-way only) - limited functionality

## WebSocket Architecture

### Client-Side Architecture

```typescript
// Connection Management
class WebSocketManager {
  - Establishes connection
  - Handles reconnection logic
  - Manages message queue during disconnection
  - Provides connection state to UI
}

// Message Handling
- Parse incoming messages
- Update local state (Svelte stores)
- Trigger UI updates
- Handle different message types

// Sending Messages
- Format outgoing data
- Queue messages if disconnected
- Handle acknowledgments
```

### Server-Side Architecture

```typescript
// Connection Pool
Map<sessionId, Set<WebSocket>>
- Track all connections per session
- Broadcast to session members
- Clean up on disconnect

// Message Router
- Validate incoming messages
- Update server state
- Broadcast to relevant clients
- Handle errors gracefully

// Session Management
- Associate connections with players
- Manage connection lifecycle
- Handle reconnection with same player ID
```

## Implementation in This Project

### Client-Side (SessionStore)

```typescript
// Located in: src/lib/stores/sessionStore.ts

class SessionManager {
  private wsUrl: string;
  private ws: WebSocket | null;
  
  // Connection establishment
  private connectWebSocket(sessionId: string): void {
    const ws = new WebSocket(`${this.wsUrl}?sessionId=${sessionId}`);
    
    ws.onopen = () => {
      // Connection established
      connectionStatus.set("connected");
    };
    
    ws.onmessage = (event) => {
      // Handle incoming messages
      const message = JSON.parse(event.data);
      this.handleWebSocketMessage(message);
    };
    
    ws.onclose = () => {
      // Handle disconnection & reconnection
      this.attemptReconnect(sessionId);
    };
  }
}
```

### Server-Side (WebSocket Endpoint)

```typescript
// Located in: src/routes/ws/+server.ts

export async function GET({ request, url }) {
  // Upgrade HTTP connection to WebSocket
  const sessionId = url.searchParams.get('sessionId');
  
  // Create WebSocket connection
  const ws = new WebSocket();
  
  // Add to connection pool
  addConnection(sessionId, ws);
  
  // Handle messages
  ws.on('message', (data) => {
    handleMessage(sessionId, ws, data);
  });
  
  // Clean up on disconnect
  ws.on('close', () => {
    removeConnection(sessionId, ws);
  });
}
```

## Message Types

All WebSocket messages follow this structure:

```typescript
interface WSMessage {
  type: WSMessageType;
  sessionId: string;
  playerId?: string;
  data: any;
  timestamp: Date;
}
```

### Message Types Used:

| Type | Direction | Purpose | Data |
|------|-----------|---------|------|
| `join_session` | Client→Server | Player joins | Player info |
| `leave_session` | Client→Server | Player leaves | Player ID |
| `session_updated` | Server→Client | Full session sync | Session object |
| `player_joined` | Server→Client | New player alert | Player object |
| `player_left` | Server→Client | Player left alert | Player ID |
| `player_updated` | Server→Client | Player state change | Player object |
| `square_claimed` | Client→Server | Claim bingo square | Square info |
| `square_confirmed` | Server→Client | GM approved square | Confirmation |
| `pattern_completed` | Server→Client | Bingo achieved | Pattern info |

## Connection Lifecycle

### 1. Initial Connection
```
Player joins session → HTTP POST to /api/sessions/join
Server creates player → Returns session data
Client establishes WebSocket → Connects with session ID
Server adds to connection pool → Broadcasts player_joined
```

### 2. During Game
```
Player claims square → Send square_claimed message
Server validates → Updates game state
Server broadcasts → All players receive square update
GM sees claim → Can approve/reject
Server broadcasts result → Updates all clients
```

### 3. Disconnection Handling
```
Connection lost → Client detects onclose
Start reconnection → Exponential backoff
Server marks player disconnected → Notifies others
Client reconnects → Resume with same player ID
Server updates status → Broadcasts reconnection
```

### 4. Clean Disconnect
```
Player clicks leave → Send leave_session
Server removes player → Updates session
Broadcast player_left → Notify others
Close WebSocket → Clean up resources
```

## Error Handling & Reconnection

### Reconnection Strategy

```typescript
private attemptReconnect(sessionId: string): void {
  if (this.reconnectAttempts < this.maxReconnectAttempts) {
    this.reconnectAttempts++;
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      this.connectWebSocket(sessionId);
    }, delay);
  }
}
```

### Message Queuing

During disconnection, messages are queued and sent upon reconnection:

```typescript
private messageQueue: WSMessage[] = [];

private sendMessage(message: WSMessage): void {
  if (this.ws?.readyState === WebSocket.OPEN) {
    this.ws.send(JSON.stringify(message));
  } else {
    this.messageQueue.push(message);
  }
}

// On reconnection
private flushMessageQueue(): void {
  while (this.messageQueue.length > 0) {
    const message = this.messageQueue.shift();
    this.sendMessage(message);
  }
}
```

### Error Types

1. **Connection Errors**: Network issues, server down
2. **Protocol Errors**: Invalid message format
3. **Business Logic Errors**: Invalid game moves
4. **Authentication Errors**: Invalid session/player

## Testing WebSockets

### Manual Testing

1. **Multi-Browser Testing**
   - Open multiple browser windows
   - Join same session
   - Verify real-time updates

2. **Network Conditions**
   - Disable network briefly
   - Verify reconnection
   - Check message queue

3. **Load Testing**
   - Multiple sessions simultaneously
   - Many players per session
   - Rapid message sending

### Debugging Tools

1. **Browser DevTools**
   - Network tab → WS filter
   - See all WebSocket frames
   - Monitor connection status

2. **WebSocket Clients**
   - wscat for command line
   - Postman WebSocket support
   - Browser extensions

3. **Logging**
   ```typescript
   // Client-side
   console.log('[WS] Connected:', sessionId);
   console.log('[WS] Message:', message);
   
   // Server-side
   console.log(`[WS] New connection: ${sessionId}`);
   console.log(`[WS] Broadcasting to ${connections.size} clients`);
   ```

## Best Practices

1. **Keep Messages Small**: Send only necessary data
2. **Use Message Types**: Clear, enumerated message types
3. **Validate Everything**: Never trust client data
4. **Handle Disconnections**: Graceful degradation
5. **Rate Limiting**: Prevent spam/abuse
6. **Security**: Validate session/player IDs
7. **Monitoring**: Log connections and errors
8. **Testing**: Test various network conditions

## Future Enhancements

1. **Binary Messages**: For efficiency with large data
2. **Compression**: Reduce bandwidth usage
3. **Presence System**: Show online/offline/away status
4. **Spectator Mode**: Watch games without participating
5. **Chat System**: In-game communication
6. **Replay System**: Record and replay games