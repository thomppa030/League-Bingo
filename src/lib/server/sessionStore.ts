import type { Session } from '$lib/types';

// Shared in-memory storage for all session-related endpoints
export const sessions = new Map<string, Session>();
export const sessionsByCode = new Map<string, string>(); // code -> sessionId

// WebSocket connections mapped by session ID
export const wsConnections = new Map<string, Set<any>>(); // Using any for now since WebSocket isn't available in Node

// Helper to broadcast to all connections in a session
export function broadcastToSession(sessionId: string, message: any) {
  const connections = wsConnections.get(sessionId);
  if (connections) {
    const messageStr = JSON.stringify(message);
    connections.forEach((ws: any) => {
      if (ws.readyState === 1) { // WebSocket.OPEN = 1
        ws.send(messageStr);
      }
    });
  }
}

// Session store object with methods for managing sessions
export const sessionStore = {
  getSession(sessionId: string): Session | undefined {
    return sessions.get(sessionId);
  },
  
  updateSession(sessionId: string, session: Session): void {
    sessions.set(sessionId, session);
    
    // Broadcast the update to all connected clients
    broadcastToSession(sessionId, {
      type: 'session_updated',
      data: session,
      timestamp: new Date()
    });
  },
  
  deleteSession(sessionId: string): void {
    const session = sessions.get(sessionId);
    if (session && session.code) {
      sessionsByCode.delete(session.code);
    }
    sessions.delete(sessionId);
    wsConnections.delete(sessionId);
  }
};