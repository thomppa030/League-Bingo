import type { Session } from '$lib/types';

// Shared in-memory storage for all session-related endpoints
export const sessions = new Map<string, Session>();
export const sessionsByCode = new Map<string, string>(); // code -> sessionId

// WebSocket connections mapped by session ID
export const wsConnections = new Map<string, Set<any>>(); // Using any for now since WebSocket isn't available in Node

// Session persistence helpers for debugging
let sessionCreationLog: Array<{timestamp: Date, sessionId: string, code: string, action: string}> = [];

function logSessionAction(sessionId: string, code: string, action: string) {
  sessionCreationLog.push({
    timestamp: new Date(),
    sessionId,
    code,
    action
  });
  
  // Keep only last 50 entries
  if (sessionCreationLog.length > 50) {
    sessionCreationLog = sessionCreationLog.slice(-50);
  }
  
  console.log(`[SessionLog] ${action}: sessionId=${sessionId}, code=${code}, totalSessions=${sessions.size}`);
}

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
    const session = sessions.get(sessionId);
    if (session) {
      logSessionAction(sessionId, session.code || 'unknown', 'GET_SUCCESS');
    } else {
      console.log(`[SessionLog] GET_FAILED: sessionId=${sessionId} not found, totalSessions=${sessions.size}`);
      console.log(`[SessionLog] Available sessions:`, Array.from(sessions.keys()));
      console.log(`[SessionLog] Available codes:`, Array.from(sessionsByCode.keys()));
    }
    return session;
  },
  
  createSession(session: Session): void {
    sessions.set(session.id, session);
    if (session.code) {
      sessionsByCode.set(session.code, session.id);
    }
    logSessionAction(session.id, session.code || 'no-code', 'CREATED');
  },
  
  updateSession(sessionId: string, session: Session): void {
    sessions.set(sessionId, session);
    logSessionAction(sessionId, session.code || 'no-code', 'UPDATED');
    
    // Broadcast the update to all connected clients
    broadcastToSession(sessionId, {
      type: 'session_updated',
      data: session,
      timestamp: new Date()
    });
  },
  
  joinSession(sessionId: string, session: Session): void {
    sessions.set(sessionId, session);
    logSessionAction(sessionId, session.code || 'no-code', 'PLAYER_JOINED');
  },
  
  deleteSession(sessionId: string): void {
    const session = sessions.get(sessionId);
    if (session && session.code) {
      sessionsByCode.delete(session.code);
      logSessionAction(sessionId, session.code, 'DELETED');
    }
    sessions.delete(sessionId);
    wsConnections.delete(sessionId);
  },
  
  // Debug methods
  getAllSessions(): Session[] {
    return Array.from(sessions.values());
  },
  
  getSessionLog(): typeof sessionCreationLog {
    return sessionCreationLog;
  },
  
  verifySessionConsistency(): {consistent: boolean, issues: string[]} {
    const issues: string[] = [];
    
    // Check if all sessions have corresponding code mappings
    sessions.forEach((session, sessionId) => {
      if (session.code) {
        const mappedSessionId = sessionsByCode.get(session.code);
        if (mappedSessionId !== sessionId) {
          issues.push(`Session ${sessionId} has code ${session.code} but code maps to ${mappedSessionId}`);
        }
      }
    });
    
    // Check if all code mappings have corresponding sessions
    sessionsByCode.forEach((sessionId, code) => {
      if (!sessions.has(sessionId)) {
        issues.push(`Code ${code} maps to session ${sessionId} but session doesn't exist`);
      }
    });
    
    return {
      consistent: issues.length === 0,
      issues
    };
  }
};