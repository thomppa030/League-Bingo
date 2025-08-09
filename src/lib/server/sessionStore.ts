import type { Session } from '$lib/types';

// Shared in-memory storage for all session-related endpoints
export const sessions = new Map<string, Session>();
export const sessionsByCode = new Map<string, string>(); // code -> sessionId

// WebSocket connections mapped by session ID
export const wsConnections = new Map<string, Set<any>>(); // Using any for now since WebSocket isn't available in Node

// Helper to broadcast to all connections in a session
export async function broadcastToSession(sessionId: string, message: any) {
  console.log(`[Broadcast] Attempting to broadcast to session ${sessionId}:`, message.type);
  
  // First try direct WebSocket broadcast (for local development)
  const connections = wsConnections.get(sessionId);
  
  if (connections && connections.size > 0) {
    console.log(`[Broadcast] Found ${connections.size} direct connections for session ${sessionId}`);
    const messageStr = JSON.stringify(message);
    connections.forEach((ws: any) => {
      if (ws.readyState === 1) { // WebSocket.OPEN = 1
        ws.send(messageStr);
        console.log(`[Broadcast] Message sent to direct connection`);
      } else {
        console.log(`[Broadcast] Skipping connection with readyState: ${ws.readyState}`);
      }
    });
  } else {
    console.log(`[Broadcast] No direct WebSocket connections found for session ${sessionId}`);
    
    // Try to notify the remote WebSocket server via HTTP webhook
    try {
      const wsServerUrl = 'https://league-bingo-webservice-production.up.railway.app';
      const webhookResponse = await fetch(`${wsServerUrl}/webhook/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message
        }),
      });
      
      if (webhookResponse.ok) {
        console.log(`[Broadcast] Successfully notified WebSocket server via webhook`);
      } else {
        console.log(`[Broadcast] Webhook failed: ${webhookResponse.status}`);
      }
    } catch (error) {
      console.log(`[Broadcast] Webhook error:`, error);
    }
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