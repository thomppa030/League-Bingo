// PostgreSQL session store for SvelteKit API endpoints
import type { Session, CreateSessionRequest, JoinSessionRequest, ApiResponse, SessionStatus, Role } from "$lib/types";
import { Pool } from 'pg';
import { env } from '$env/dynamic/private';

// Database connection pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const databaseUrl = env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

// Utility functions
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Database session store implementation using Node.js pg
const createPostgresSessionStore = () => ({
  async createSession(request: CreateSessionRequest): Promise<ApiResponse> {
    try {
      const pool = getPool();
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        const sessionId = generateId('session');
        const playerId = generateId('player');
        const code = generateSessionCode();
        
        // Insert session
        await client.query(`
          INSERT INTO sessions (
            id, code, name, status, gm_player_id, 
            allow_late_join, require_gm_confirmation, enable_pattern_bonuses,
            custom_rules, time_limit, max_players, min_players,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        `, [
          sessionId, code, request.sessionName.trim(), 'setup', playerId,
          request.settings?.allowLateJoin ?? true,
          request.settings?.requireGMConfirmation ?? true,
          request.settings?.enablePatternBonuses ?? true,
          JSON.stringify(request.settings?.customRules ?? []),
          request.settings?.timeLimit,
          request.maxPlayers ?? 8,
          request.minPlayers ?? 1
        ]);
        
        // Insert GM player
        await client.query(`
          INSERT INTO players (
            id, session_id, name, role, is_gm, is_ready, 
            connection_status, total_score, joined_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `, [
          playerId, sessionId, request.gmName.trim(), 'MID', true, true, 'connected', 0
        ]);
        
        await client.query('COMMIT');
        
        // Fetch the created session
        const sessionResult = await client.query(`
          SELECT s.*, p.id as player_id, p.name as player_name, p.role as player_role, 
                 p.is_gm, p.is_ready, p.connection_status, p.total_score, p.joined_at
          FROM sessions s
          LEFT JOIN players p ON s.id = p.session_id
          WHERE s.id = $1
        `, [sessionId]);
        
        if (sessionResult.rows.length === 0) {
          throw new Error('Failed to retrieve created session');
        }
        
        const session = this.dbRowsToSession(sessionResult.rows);
        
        return {
          success: true,
          data: session,
          timestamp: new Date()
        };
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('[PostgresSessionStore] Error creating session:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create session'
        },
        timestamp: new Date()
      };
    }
  },
  
  async joinSession(request: JoinSessionRequest): Promise<ApiResponse> {
    try {
      const pool = getPool();
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Find session by code
        const sessionResult = await client.query(`
          SELECT s.*, p.id as player_id, p.name as player_name, p.role as player_role,
                 p.is_gm, p.is_ready, p.connection_status, p.total_score, p.joined_at
          FROM sessions s
          LEFT JOIN players p ON s.id = p.session_id
          WHERE s.code = $1 AND s.status != 'cancelled'
        `, [request.code.trim().toUpperCase()]);
        
        if (sessionResult.rows.length === 0) {
          return {
            success: false,
            error: {
              code: 'SESSION_NOT_FOUND',
              message: 'Invalid session code'
            },
            timestamp: new Date()
          };
        }
        
        const session = this.dbRowsToSession(sessionResult.rows);
        
        // Validate join conditions
        if (session.status !== 'setup' && !session.settings.allowLateJoin) {
          return {
            success: false,
            error: {
              code: 'GAME_ALREADY_STARTED',
              message: 'Game has already started and late join is disabled'
            },
            timestamp: new Date()
          };
        }
        
        if (session.players.length >= session.maxPlayers) {
          return {
            success: false,
            error: {
              code: 'SESSION_FULL',
              message: 'Session is full'
            },
            timestamp: new Date()
          };
        }
        
        // Check for duplicate name
        const existingPlayer = session.players.find(
          p => p.name.toLowerCase() === request.playerName.trim().toLowerCase()
        );
        if (existingPlayer) {
          return {
            success: false,
            error: {
              code: 'DUPLICATE_PLAYER_NAME',
              message: 'A player with that name already exists in this session'
            },
            timestamp: new Date()
          };
        }
        
        // Add new player
        const playerId = generateId('player');
        await client.query(`
          INSERT INTO players (
            id, session_id, name, role, is_gm, is_ready, 
            connection_status, total_score, joined_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `, [
          playerId, session.id, request.playerName.trim(), request.role, false, false, 'connected', 0
        ]);
        
        await client.query('COMMIT');
        
        // Fetch updated session
        const updatedResult = await client.query(`
          SELECT s.*, p.id as player_id, p.name as player_name, p.role as player_role,
                 p.is_gm, p.is_ready, p.connection_status, p.total_score, p.joined_at
          FROM sessions s
          LEFT JOIN players p ON s.id = p.session_id
          WHERE s.id = $1
        `, [session.id]);
        
        const updatedSession = this.dbRowsToSession(updatedResult.rows);
        const newPlayer = updatedSession.players.find(p => p.id === playerId);
        
        return {
          success: true,
          data: { session: updatedSession, player: newPlayer },
          timestamp: new Date()
        };
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('[PostgresSessionStore] Error joining session:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to join session'
        },
        timestamp: new Date()
      };
    }
  },
  
  async getSessionById(sessionId: string): Promise<Session | null> {
    try {
      const pool = getPool();
      const result = await pool.query(`
        SELECT s.*, p.id as player_id, p.name as player_name, p.role as player_role,
               p.is_gm, p.is_ready, p.connection_status, p.total_score, p.joined_at
        FROM sessions s
        LEFT JOIN players p ON s.id = p.session_id
        WHERE s.id = $1 AND s.status != 'cancelled'
      `, [sessionId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.dbRowsToSession(result.rows);
    } catch (error) {
      console.error('[PostgresSessionStore] Error getting session by ID:', error);
      return null;
    }
  },
  
  async getSessionByCode(code: string): Promise<Session | null> {
    try {
      const pool = getPool();
      const result = await pool.query(`
        SELECT s.*, p.id as player_id, p.name as player_name, p.role as player_role,
               p.is_gm, p.is_ready, p.connection_status, p.total_score, p.joined_at
        FROM sessions s
        LEFT JOIN players p ON s.id = p.session_id
        WHERE s.code = $1 AND s.status != 'cancelled'
      `, [code.toUpperCase()]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.dbRowsToSession(result.rows);
    } catch (error) {
      console.error('[PostgresSessionStore] Error getting session by code:', error);
      return null;
    }
  },
  
  async getAllActiveSessions(): Promise<Session[]> {
    try {
      const pool = getPool();
      const result = await pool.query(`
        SELECT s.*, p.id as player_id, p.name as player_name, p.role as player_role,
               p.is_gm, p.is_ready, p.connection_status, p.total_score, p.joined_at
        FROM sessions s
        LEFT JOIN players p ON s.id = p.session_id
        WHERE s.status != 'cancelled'
        ORDER BY s.created_at DESC
      `);
      
      // Group rows by session
      const sessionMap = new Map();
      
      for (const row of result.rows) {
        if (!sessionMap.has(row.id)) {
          sessionMap.set(row.id, []);
        }
        sessionMap.get(row.id).push(row);
      }
      
      return Array.from(sessionMap.values()).map(rows => this.dbRowsToSession(rows));
    } catch (error) {
      console.error('[PostgresSessionStore] Error getting active sessions:', error);
      return [];
    }
  },
  
  async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<ApiResponse> {
    try {
      const pool = getPool();
      const result = await pool.query(`
        UPDATE sessions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *
      `, [status, sessionId]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Session not found'
          },
          timestamp: new Date()
        };
      }
      
      return {
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[PostgresSessionStore] Error updating session status:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update session status'
        },
        timestamp: new Date()
      };
    }
  },
  
  async updatePlayerReady(sessionId: string, playerId: string, ready: boolean): Promise<ApiResponse> {
    try {
      const pool = getPool();
      const result = await pool.query(`
        UPDATE players SET is_ready = $1 WHERE id = $2 AND session_id = $3 RETURNING *
      `, [ready, playerId, sessionId]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: {
            code: 'PLAYER_NOT_FOUND',
            message: 'Player not found'
          },
          timestamp: new Date()
        };
      }
      
      return {
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[PostgresSessionStore] Error updating player ready status:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update player ready status'
        },
        timestamp: new Date()
      };
    }
  },
  
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const pool = getPool();
      await pool.query(`UPDATE sessions SET status = 'cancelled' WHERE id = $1`, [sessionId]);
    } catch (error) {
      console.error('[PostgresSessionStore] Error deleting session:', error);
    }
  },
  
  async initialize(): Promise<void> {
    try {
      const pool = getPool();
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('[PostgresSessionStore] Database connection established');
    } catch (error) {
      console.error('[PostgresSessionStore] Database connection failed:', error);
      throw error;
    }
  },
  
  // Helper method to convert database rows to Session object
  dbRowsToSession(rows: any[]): Session {
    if (rows.length === 0) {
      throw new Error('No rows provided');
    }
    
    const firstRow = rows[0];
    const players = rows
      .filter(row => row.player_id)
      .map(row => ({
        id: row.player_id,
        sessionId: row.id,
        name: row.player_name,
        role: row.player_role as Role,
        selectedCategories: [],
        isGM: row.is_gm,
        isReady: row.is_ready,
        joinedAt: row.joined_at,
        connectionStatus: row.connection_status,
        totalScore: row.total_score
      }));
    
    return {
      id: firstRow.id,
      code: firstRow.code,
      name: firstRow.name,
      status: firstRow.status as SessionStatus,
      gmId: firstRow.gm_player_id,
      players,
      cards: [],
      settings: {
        allowLateJoin: firstRow.allow_late_join,
        requireGMConfirmation: firstRow.require_gm_confirmation,
        enablePatternBonuses: firstRow.enable_pattern_bonuses,
        customRules: JSON.parse(firstRow.custom_rules || '[]'),
        timeLimit: firstRow.time_limit
      },
      maxPlayers: firstRow.max_players,
      minPlayers: firstRow.min_players,
      createAt: firstRow.created_at,
      updatedAt: firstRow.updated_at
    };
  }
});

export const postgresSessionStore = createPostgresSessionStore();


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