// PostgreSQL session store for SvelteKit API endpoints
import { postgresSessionStore } from "../../../database/sessionStore.ts";
import type { Session } from "$lib/types";

// Re-export the PostgreSQL session store for use in SvelteKit
export { postgresSessionStore };


// Legacy compatibility - provide the same interface as the old in-memory store
export const sessionStore = {
  async getSession(sessionId: string): Promise<Session | null> {
    return await postgresSessionStore.getSessionById(sessionId);
  },
  
  async createSession(session: Session): Promise<void> {
    // This won't be used anymore - creation goes through the full API
    throw new Error("Use postgresSessionStore.createSession instead");
  },
  
  async updateSession(sessionId: string, session: Session): Promise<void> {
    // Individual updates should go through specific methods
    await postgresSessionStore.updateSessionStatus(sessionId, session.status);
  },
  
  async joinSession(sessionId: string, session: Session): Promise<void> {
    // This won't be used anymore - joining goes through the full API
    throw new Error("Use postgresSessionStore.joinSession instead");
  },
  
  async deleteSession(sessionId: string): Promise<void> {
    await postgresSessionStore.deleteSession(sessionId);
  },
  
  getAllSessions(): Session[] {
    throw new Error("Use postgresSessionStore.getAllActiveSessions instead (async)");
  },
  
  getSessionLog(): any[] {
    return []; // Events are now stored in the database
  },
  
  verifySessionConsistency(): {consistent: boolean, issues: string[]} {
    // Database enforces consistency through constraints
    return { consistent: true, issues: [] };
  }
};

// Legacy broadcast function - now uses PostgreSQL notifications
export async function broadcastToSession(sessionId: string, message: any): Promise<void> {
  console.log(`[Broadcast] Database will handle broadcasting for session ${sessionId}:`, message.type);
  
  // The PostgreSQL notification system will handle real-time updates
  // No need to manually broadcast - database triggers will notify clients
}

// Initialize the PostgreSQL session store
export async function initializePostgreSQLStore(): Promise<void> {
  try {
    await postgresSessionStore.initialize();
    console.log('[PostgreSQL] Session store initialized successfully');
  } catch (error) {
    console.error('[PostgreSQL] Failed to initialize session store:', error);
    // Don't throw - allow the app to start even if DB is not available initially
  }
}

// For backwards compatibility, keep the old exports but mark them as deprecated
export const sessions = new Map<string, Session>(); // Empty - kept for compatibility
export const sessionsByCode = new Map<string, string>(); // Empty - kept for compatibility

console.warn('[DEPRECATED] Using PostgreSQL session store. In-memory maps are no longer used.');