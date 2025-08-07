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