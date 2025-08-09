// PostgreSQL-based session store to replace in-memory storage
import { 
  SessionModel, 
  PlayerModel, 
  GameEventModel,
  BingoCardModel,
  BingoSquareModel,
  generateId,
  generateSessionCode,
  type DBSession,
  type DBPlayer,
  type DBGameEvent
} from "./models.ts";
import { dbNotifier, query } from "./db.ts";

// Import existing types from the main application
import type { 
  Session, 
  Player, 
  SessionStatus, 
  Role,
  CreateSessionRequest,
  JoinSessionRequest,
  ApiResponse
} from "../src/lib/types.ts";

// Conversion functions between database models and application models
function dbSessionToSession(dbSession: DBSession, players: DBPlayer[] = []): Session {
  return {
    id: dbSession.id,
    code: dbSession.code,
    name: dbSession.name,
    status: dbSession.status as SessionStatus,
    gmId: dbSession.gm_player_id || '',
    players: players.map(dbPlayerToPlayer),
    cards: [], // Cards will be loaded separately if needed
    settings: {
      allowLateJoin: dbSession.allow_late_join,
      requireGMConfirmation: dbSession.require_gm_confirmation,
      enablePatternBonuses: dbSession.enable_pattern_bonuses,
      customRules: dbSession.custom_rules,
      timeLimit: dbSession.time_limit
    },
    maxPlayers: dbSession.max_players,
    minPlayers: dbSession.min_players,
    createAt: dbSession.created_at,
    updatedAt: dbSession.updated_at
  };
}

function dbPlayerToPlayer(dbPlayer: DBPlayer): Player {
  return {
    id: dbPlayer.id,
    sessionId: dbPlayer.session_id,
    name: dbPlayer.name,
    role: dbPlayer.role as Role,
    selectedCategories: dbPlayer.selected_categories,
    isGM: dbPlayer.is_gm,
    isReady: dbPlayer.is_ready,
    joinedAt: dbPlayer.joined_at,
    connectionStatus: dbPlayer.connection_status as 'connected' | 'disconnected',
    totalScore: dbPlayer.total_score
  };
}

function sessionToDbSession(session: Session): Omit<DBSession, 'created_at' | 'updated_at'> {
  return {
    id: session.id,
    code: session.code,
    name: session.name,
    status: session.status,
    gm_player_id: session.gmId,
    max_players: session.maxPlayers,
    min_players: session.minPlayers,
    allow_late_join: session.settings.allowLateJoin,
    require_gm_confirmation: session.settings.requireGMConfirmation,
    enable_pattern_bonuses: session.settings.enablePatternBonuses,
    custom_rules: session.settings.customRules,
    time_limit: session.settings.timeLimit
  };
}

function playerToDbPlayer(player: Player): Omit<DBPlayer, 'joined_at' | 'last_activity'> {
  return {
    id: player.id,
    session_id: player.sessionId,
    name: player.name,
    role: player.role,
    is_gm: player.isGM,
    is_ready: player.isReady,
    selected_categories: player.selectedCategories,
    total_score: player.totalScore,
    connection_status: player.connectionStatus
  };
}

// PostgreSQL-based session store
export class PostgreSQLSessionStore {
  private eventListeners = new Map<string, ((session: Session) => void)[]>();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Start listening for database notifications
    await dbNotifier.start();
    
    // Listen for session changes
    await dbNotifier.listen('session_changes', (notification) => {
      this.handleDatabaseNotification(notification);
    });

    this.initialized = true;
    console.log('[SessionStore] PostgreSQL session store initialized');
  }

  private handleDatabaseNotification(notification: any): void {
    const { table, action, session_id, data } = notification;
    
    console.log(`[SessionStore] Database notification: ${table} ${action} for session ${session_id}`);
    
    // Emit events to listeners
    const listeners = this.eventListeners.get(session_id) || [];
    listeners.forEach(listener => {
      // Fetch fresh session data and notify
      this.getSessionById(session_id).then(session => {
        if (session) {
          listener(session);
        }
      }).catch(error => {
        console.error('[SessionStore] Error fetching session for notification:', error);
      });
    });
  }

  // Event subscription for real-time updates
  subscribe(sessionId: string, callback: (session: Session) => void): () => void {
    const existing = this.eventListeners.get(sessionId) || [];
    this.eventListeners.set(sessionId, [...existing, callback]);

    // Return unsubscribe function
    return () => {
      const current = this.eventListeners.get(sessionId) || [];
      const filtered = current.filter(cb => cb !== callback);
      if (filtered.length === 0) {
        this.eventListeners.delete(sessionId);
      } else {
        this.eventListeners.set(sessionId, filtered);
      }
    };
  }

  // Core session operations
  async createSession(request: CreateSessionRequest): Promise<ApiResponse<Session>> {
    try {
      const sessionId = generateId('session');
      const playerId = generateId('player');
      const code = generateSessionCode();

      // Check if code is unique (in practice, you'd retry if not)
      const existing = await SessionModel.findByCode(code);
      if (existing) {
        throw new Error('Session code collision');
      }

      // Create GM player
      const gmPlayer: Omit<DBPlayer, 'joined_at' | 'last_activity'> = {
        id: playerId,
        session_id: sessionId,
        name: request.gmName.trim(),
        role: 'MID', // Default role for GM
        is_gm: true,
        is_ready: true,
        selected_categories: [],
        total_score: 0,
        connection_status: 'connected'
      };

      // Create session
      const dbSession: Omit<DBSession, 'created_at' | 'updated_at'> = {
        id: sessionId,
        code,
        name: request.sessionName.trim(),
        status: 'setup',
        gm_player_id: playerId,
        max_players: request.maxPlayers || 8,
        min_players: request.minPlayers || 1,
        allow_late_join: request.settings?.allowLateJoin ?? true,
        require_gm_confirmation: request.settings?.requireGMConfirmation ?? true,
        enable_pattern_bonuses: request.settings?.enablePatternBonuses ?? true,
        custom_rules: request.settings?.customRules || [],
        time_limit: request.settings?.timeLimit
      };

      // Create session and GM player in transaction
      const createdSession = await SessionModel.create(dbSession);
      const createdPlayer = await PlayerModel.create(gmPlayer);

      // Log event
      await GameEventModel.create({
        session_id: sessionId,
        player_id: playerId,
        event_type: 'session_created',
        event_data: { 
          session_name: request.sessionName,
          gm_name: request.gmName,
          max_players: request.maxPlayers
        }
      });

      // Send PostgreSQL notification
      await this.notifySessionChange(sessionId, 'session_created', { sessionId, session });

      const session = dbSessionToSession(createdSession, [createdPlayer]);

      console.log(`[SessionStore] Created session ${sessionId} with code ${code}`);

      return {
        success: true,
        data: session,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('[SessionStore] Error creating session:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create session'
        },
        timestamp: new Date()
      };
    }
  }

  async joinSession(request: JoinSessionRequest): Promise<ApiResponse<{ session: Session; player: Player }>> {
    try {
      const { code, playerName, role } = request;

      // Find session by code
      const dbSession = await SessionModel.findByCode(code.trim().toUpperCase());
      if (!dbSession) {
        return {
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Invalid session code'
          },
          timestamp: new Date()
        };
      }

      // Get current players
      const currentPlayers = await PlayerModel.findBySessionId(dbSession.id);

      // Check session capacity
      if (currentPlayers.length >= dbSession.max_players) {
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
      const nameExists = !await PlayerModel.checkNameUnique(dbSession.id, playerName.trim());
      if (nameExists) {
        return {
          success: false,
          error: {
            code: 'DUPLICATE_PLAYER_NAME',
            message: 'A player with that name already exists'
          },
          timestamp: new Date()
        };
      }

      // Check game status for late join
      if (dbSession.status !== 'setup' && !dbSession.allow_late_join) {
        return {
          success: false,
          error: {
            code: 'GAME_ALREADY_STARTED',
            message: 'Game has started and late join is disabled'
          },
          timestamp: new Date()
        };
      }

      // Create new player
      const playerId = generateId('player');
      const newPlayer: Omit<DBPlayer, 'joined_at' | 'last_activity'> = {
        id: playerId,
        session_id: dbSession.id,
        name: playerName.trim(),
        role: role,
        is_gm: false,
        is_ready: false,
        selected_categories: [],
        total_score: 0,
        connection_status: 'connected'
      };

      const createdPlayer = await PlayerModel.create(newPlayer);

      // Log event
      await GameEventModel.create({
        session_id: dbSession.id,
        player_id: playerId,
        event_type: 'player_joined',
        event_data: { 
          player_name: playerName,
          role: role
        }
      });

      // Get updated session with all players
      const allPlayers = await PlayerModel.findBySessionId(dbSession.id);
      const session = dbSessionToSession(dbSession, allPlayers);
      const player = dbPlayerToPlayer(createdPlayer);

      // Send PostgreSQL notification
      await this.notifyPlayerChange(dbSession.id, playerId, 'player_joined', { player, session });

      console.log(`[SessionStore] Player ${playerName} joined session ${dbSession.code}`);

      return {
        success: true,
        data: { session, player },
        timestamp: new Date()
      };

    } catch (error) {
      console.error('[SessionStore] Error joining session:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to join session'
        },
        timestamp: new Date()
      };
    }
  }

  async updatePlayerReady(sessionId: string, playerId: string, ready: boolean): Promise<ApiResponse<boolean>> {
    try {
      const updatedPlayer = await PlayerModel.updateReadyStatus(playerId, ready);
      
      if (!updatedPlayer) {
        return {
          success: false,
          error: {
            code: 'PLAYER_NOT_FOUND',
            message: 'Player not found'
          },
          timestamp: new Date()
        };
      }

      // Log event
      await GameEventModel.create({
        session_id: sessionId,
        player_id: playerId,
        event_type: 'player_ready_changed',
        event_data: { 
          is_ready: ready
        }
      });

      // Send PostgreSQL notification
      await this.notifyPlayerChange(sessionId, playerId, 'player_ready_changed', { ready, playerId });

      console.log(`[SessionStore] Player ${playerId} ready status: ${ready}`);

      return {
        success: true,
        data: true,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('[SessionStore] Error updating ready status:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update ready status'
        },
        timestamp: new Date()
      };
    }
  }

  async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<ApiResponse<boolean>> {
    try {
      const updatedSession = await SessionModel.update(sessionId, { status });
      
      if (!updatedSession) {
        return {
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Session not found'
          },
          timestamp: new Date()
        };
      }

      // Log event
      await GameEventModel.create({
        session_id: sessionId,
        event_type: 'game_started', // Or other appropriate event
        event_data: { 
          new_status: status
        }
      });

      // Send PostgreSQL notification
      await this.notifySessionChange(sessionId, 'status_changed', { status, sessionId });

      console.log(`[SessionStore] Session ${sessionId} status updated to ${status}`);

      return {
        success: true,
        data: true,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('[SessionStore] Error updating session status:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update session status'
        },
        timestamp: new Date()
      };
    }
  }

  async getSessionById(sessionId: string): Promise<Session | null> {
    try {
      const sessionWithPlayers = await SessionModel.findWithPlayers(sessionId);
      
      if (!sessionWithPlayers) {
        return null;
      }

      return dbSessionToSession(sessionWithPlayers, sessionWithPlayers.players);

    } catch (error) {
      console.error('[SessionStore] Error getting session:', error);
      return null;
    }
  }

  async getSessionByCode(code: string): Promise<Session | null> {
    try {
      const dbSession = await SessionModel.findByCode(code);
      
      if (!dbSession) {
        return null;
      }

      const players = await PlayerModel.findBySessionId(dbSession.id);
      return dbSessionToSession(dbSession, players);

    } catch (error) {
      console.error('[SessionStore] Error getting session by code:', error);
      return null;
    }
  }

  async getAllActiveSessions(): Promise<Session[]> {
    try {
      const activeSessions = await SessionModel.findActive();
      const sessions: Session[] = [];

      for (const dbSession of activeSessions) {
        const players = await PlayerModel.findBySessionId(dbSession.id);
        sessions.push(dbSessionToSession(dbSession, players));
      }

      return sessions;

    } catch (error) {
      console.error('[SessionStore] Error getting active sessions:', error);
      return [];
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      // Log event before deletion
      await GameEventModel.create({
        session_id: sessionId,
        event_type: 'session_created', // Reusing enum value
        event_data: { action: 'deleted' }
      });

      const deleted = await SessionModel.delete(sessionId);
      
      if (deleted) {
        console.log(`[SessionStore] Deleted session ${sessionId}`);
      }

      return deleted;

    } catch (error) {
      console.error('[SessionStore] Error deleting session:', error);
      return false;
    }
  }

  async removePlayer(sessionId: string, playerId: string): Promise<boolean> {
    try {
      // Log event before removal
      await GameEventModel.create({
        session_id: sessionId,
        player_id: playerId,
        event_type: 'player_left',
        event_data: {}
      });

      const removed = await PlayerModel.delete(playerId);
      
      if (removed) {
        console.log(`[SessionStore] Removed player ${playerId} from session ${sessionId}`);
      }

      return removed;

    } catch (error) {
      console.error('[SessionStore] Error removing player:', error);
      return false;
    }
  }

  // Debug and maintenance methods
  async getSessionEvents(sessionId: string, limit = 50): Promise<DBGameEvent[]> {
    return await GameEventModel.findBySessionId(sessionId, limit);
  }

  async cleanup(): Promise<void> {
    try {
      // This would run periodically to clean up old data
      console.log('[SessionStore] Running cleanup...');
      
      // Implementation would depend on your cleanup requirements
      
    } catch (error) {
      console.error('[SessionStore] Error during cleanup:', error);
    }
  }

  async getStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    totalPlayers: number;
    recentEvents: number;
  }> {
    try {
      // This is a simplified version - you'd write more efficient queries
      const activeSessions = await SessionModel.findActive();
      const allPlayers = await Promise.all(
        activeSessions.map(s => PlayerModel.findBySessionId(s.id))
      );
      
      return {
        totalSessions: activeSessions.length,
        activeSessions: activeSessions.filter(s => s.status === 'playing').length,
        totalPlayers: allPlayers.flat().length,
        recentEvents: 0 // Would query game_events table
      };

    } catch (error) {
      console.error('[SessionStore] Error getting stats:', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        totalPlayers: 0,
        recentEvents: 0
      };
    }
  }

  // PostgreSQL notification methods for real-time updates
  private async notifySessionChange(sessionId: string, action: string, data: any): Promise<void> {
    try {
      const notification = {
        table: 'sessions',
        action,
        session_id: sessionId,
        data,
        timestamp: new Date()
      };

      // Use raw SQL to send the notification
      await query(`SELECT pg_notify('session_changes', $1)`, [JSON.stringify(notification)]);
      
      console.log(`[SessionStore] Sent PostgreSQL notification for session ${sessionId}: ${action}`);
    } catch (error) {
      console.error('[SessionStore] Error sending PostgreSQL notification:', error);
    }
  }

  private async notifyPlayerChange(sessionId: string, playerId: string, action: string, data: any): Promise<void> {
    try {
      const notification = {
        table: 'players',
        action,
        session_id: sessionId,
        player_id: playerId,
        data,
        timestamp: new Date()
      };

      await query(`SELECT pg_notify('player_changes', $1)`, [JSON.stringify(notification)]);
      
      console.log(`[SessionStore] Sent PostgreSQL notification for player ${playerId}: ${action}`);
    } catch (error) {
      console.error('[SessionStore] Error sending PostgreSQL notification:', error);
    }
  }
}

// Create singleton instance
export const postgresSessionStore = new PostgreSQLSessionStore();