// Database models and types for League Bingo PostgreSQL implementation
import { query, transaction } from "./db.ts";
import type { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// Database row interfaces (matching PostgreSQL schema)
export interface DBSession {
  id: string;
  code: string;
  name: string;
  status: 'setup' | 'category_selection' | 'playing' | 'completed' | 'cancelled';
  gm_player_id?: string;
  max_players: number;
  min_players: number;
  allow_late_join: boolean;
  require_gm_confirmation: boolean;
  enable_pattern_bonuses: boolean;
  custom_rules: string[];
  time_limit?: number;
  created_at: Date;
  updated_at: Date;
}

export interface DBPlayer {
  id: string;
  session_id: string;
  name: string;
  role: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';
  is_gm: boolean;
  is_ready: boolean;
  selected_categories: string[];
  total_score: number;
  connection_status: string;
  joined_at: Date;
  last_activity: Date;
}

export interface DBBingoCard {
  id: string;
  session_id: string;
  player_id: string;
  seed: string;
  pattern_type: string;
  generated_at: Date;
}

export interface DBBingoSquare {
  id: string;
  card_id: string;
  position_row: number;
  position_col: number;
  challenge_text: string;
  challenge_category?: string;
  points: number;
  is_completed: boolean;
  is_confirmed: boolean;
  evidence?: string;
  completed_at?: Date;
  confirmed_at?: Date;
  confirmed_by?: string;
}

export interface DBPatternCompletion {
  id: string;
  session_id: string;
  player_id: string;
  card_id: string;
  pattern_name: string;
  pattern_data: any;
  points_awarded: number;
  completed_at: Date;
}

export interface DBGameEvent {
  id: number;
  session_id: string;
  player_id?: string;
  event_type: string;
  event_data: any;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface DBChallenge {
  id: number;
  category_id: number;
  text: string;
  description?: string;
  points: number;
  difficulty_level?: number;
  is_active: boolean;
  tags: string[];
  min_game_time?: number;
  created_at: Date;
  updated_at: Date;
}

export interface DBChallengeCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

// Domain model classes with database operations
export class SessionModel {
  static async findById(id: string): Promise<DBSession | null> {
    const result = await query<DBSession>(
      "SELECT * FROM sessions WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByCode(code: string): Promise<DBSession | null> {
    const result = await query<DBSession>(
      "SELECT * FROM sessions WHERE code = $1",
      [code.toUpperCase()]
    );
    return result.rows[0] || null;
  }

  static async create(session: Omit<DBSession, 'created_at' | 'updated_at'>): Promise<DBSession> {
    const result = await query<DBSession>(`
      INSERT INTO sessions (
        id, code, name, status, gm_player_id, max_players, min_players,
        allow_late_join, require_gm_confirmation, enable_pattern_bonuses,
        custom_rules, time_limit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      session.id,
      session.code,
      session.name,
      session.status,
      session.gm_player_id,
      session.max_players,
      session.min_players,
      session.allow_late_join,
      session.require_gm_confirmation,
      session.enable_pattern_bonuses,
      session.custom_rules,
      session.time_limit
    ]);
    
    return result.rows[0];
  }

  static async update(id: string, updates: Partial<DBSession>): Promise<DBSession | null> {
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at')
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    if (!setClause) return null;

    const values = Object.values(updates).filter((_, index) => {
      const key = Object.keys(updates)[index];
      return key !== 'id' && key !== 'created_at' && key !== 'updated_at';
    });

    const result = await query<DBSession>(`
      UPDATE sessions 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `, [id, ...values]);

    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(
      "DELETE FROM sessions WHERE id = $1",
      [id]
    );
    return result.rowCount > 0;
  }

  static async findActive(): Promise<DBSession[]> {
    const result = await query<DBSession>(
      "SELECT * FROM sessions WHERE status IN ('setup', 'category_selection', 'playing') ORDER BY created_at DESC"
    );
    return result.rows;
  }

  static async findWithPlayers(id: string): Promise<(DBSession & { players: DBPlayer[] }) | null> {
    return await transaction(async (client) => {
      const sessionResult = await client.queryObject<DBSession>(
        "SELECT * FROM sessions WHERE id = $1",
        [id]
      );

      if (sessionResult.rows.length === 0) {
        return null;
      }

      const playersResult = await client.queryObject<DBPlayer>(
        "SELECT * FROM players WHERE session_id = $1 ORDER BY joined_at ASC",
        [id]
      );

      return {
        ...sessionResult.rows[0],
        players: playersResult.rows
      };
    });
  }
}

export class PlayerModel {
  static async findById(id: string): Promise<DBPlayer | null> {
    const result = await query<DBPlayer>(
      "SELECT * FROM players WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  }

  static async findBySessionId(sessionId: string): Promise<DBPlayer[]> {
    const result = await query<DBPlayer>(
      "SELECT * FROM players WHERE session_id = $1 ORDER BY joined_at ASC",
      [sessionId]
    );
    return result.rows;
  }

  static async create(player: Omit<DBPlayer, 'joined_at' | 'last_activity'>): Promise<DBPlayer> {
    const result = await query<DBPlayer>(`
      INSERT INTO players (
        id, session_id, name, role, is_gm, is_ready,
        selected_categories, total_score, connection_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      player.id,
      player.session_id,
      player.name,
      player.role,
      player.is_gm,
      player.is_ready,
      player.selected_categories,
      player.total_score,
      player.connection_status
    ]);
    
    return result.rows[0];
  }

  static async update(id: string, updates: Partial<DBPlayer>): Promise<DBPlayer | null> {
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'joined_at')
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    if (!setClause) return null;

    const values = Object.values(updates).filter((_, index) => {
      const key = Object.keys(updates)[index];
      return key !== 'id' && key !== 'joined_at';
    });

    const result = await query<DBPlayer>(`
      UPDATE players 
      SET ${setClause}, last_activity = NOW() 
      WHERE id = $1 
      RETURNING *
    `, [id, ...values]);

    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query(
      "DELETE FROM players WHERE id = $1",
      [id]
    );
    return result.rowCount > 0;
  }

  static async updateReadyStatus(id: string, isReady: boolean): Promise<DBPlayer | null> {
    const result = await query<DBPlayer>(`
      UPDATE players 
      SET is_ready = $2, last_activity = NOW() 
      WHERE id = $1 
      RETURNING *
    `, [id, isReady]);

    return result.rows[0] || null;
  }

  static async checkNameUnique(sessionId: string, name: string, excludePlayerId?: string): Promise<boolean> {
    const params = excludePlayerId 
      ? [sessionId, name.toLowerCase(), excludePlayerId]
      : [sessionId, name.toLowerCase()];
    
    const query_text = excludePlayerId
      ? "SELECT COUNT(*) as count FROM players WHERE session_id = $1 AND LOWER(name) = $2 AND id != $3"
      : "SELECT COUNT(*) as count FROM players WHERE session_id = $1 AND LOWER(name) = $2";

    const result = await query<{ count: string }>(query_text, params);
    return parseInt(result.rows[0].count) === 0;
  }
}

export class GameEventModel {
  static async create(event: Omit<DBGameEvent, 'id' | 'created_at'>): Promise<DBGameEvent> {
    const result = await query<DBGameEvent>(`
      INSERT INTO game_events (
        session_id, player_id, event_type, event_data, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      event.session_id,
      event.player_id,
      event.event_type,
      JSON.stringify(event.event_data),
      event.ip_address,
      event.user_agent
    ]);
    
    return result.rows[0];
  }

  static async findBySessionId(sessionId: string, limit = 100): Promise<DBGameEvent[]> {
    const result = await query<DBGameEvent>(
      "SELECT * FROM game_events WHERE session_id = $1 ORDER BY created_at DESC LIMIT $2",
      [sessionId, limit]
    );
    return result.rows;
  }

  static async findByType(eventType: string, limit = 50): Promise<DBGameEvent[]> {
    const result = await query<DBGameEvent>(
      "SELECT * FROM game_events WHERE event_type = $1 ORDER BY created_at DESC LIMIT $2",
      [eventType, limit]
    );
    return result.rows;
  }
}

export class BingoCardModel {
  static async create(card: Omit<DBBingoCard, 'generated_at'>): Promise<DBBingoCard> {
    const result = await query<DBBingoCard>(`
      INSERT INTO bingo_cards (id, session_id, player_id, seed, pattern_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [card.id, card.session_id, card.player_id, card.seed, card.pattern_type]);
    
    return result.rows[0];
  }

  static async findBySessionId(sessionId: string): Promise<DBBingoCard[]> {
    const result = await query<DBBingoCard>(
      "SELECT * FROM bingo_cards WHERE session_id = $1",
      [sessionId]
    );
    return result.rows;
  }

  static async findByPlayerId(playerId: string): Promise<DBBingoCard | null> {
    const result = await query<DBBingoCard>(
      "SELECT * FROM bingo_cards WHERE player_id = $1",
      [playerId]
    );
    return result.rows[0] || null;
  }
}

export class BingoSquareModel {
  static async createMany(squares: Omit<DBBingoSquare, 'is_completed' | 'is_confirmed'>[]): Promise<DBBingoSquare[]> {
    return await transaction(async (client) => {
      const results: DBBingoSquare[] = [];
      
      for (const square of squares) {
        const result = await client.queryObject<DBBingoSquare>(`
          INSERT INTO bingo_squares (
            id, card_id, position_row, position_col, 
            challenge_text, challenge_category, points
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [
          square.id,
          square.card_id,
          square.position_row,
          square.position_col,
          square.challenge_text,
          square.challenge_category,
          square.points
        ]);
        
        results.push(result.rows[0]);
      }
      
      return results;
    });
  }

  static async findByCardId(cardId: string): Promise<DBBingoSquare[]> {
    const result = await query<DBBingoSquare>(
      "SELECT * FROM bingo_squares WHERE card_id = $1 ORDER BY position_row, position_col",
      [cardId]
    );
    return result.rows;
  }

  static async updateCompletion(
    id: string, 
    isCompleted: boolean, 
    evidence?: string
  ): Promise<DBBingoSquare | null> {
    const result = await query<DBBingoSquare>(`
      UPDATE bingo_squares 
      SET is_completed = $2, evidence = $3, completed_at = CASE WHEN $2 THEN NOW() ELSE NULL END
      WHERE id = $1 
      RETURNING *
    `, [id, isCompleted, evidence]);

    return result.rows[0] || null;
  }

  static async updateConfirmation(
    id: string, 
    isConfirmed: boolean, 
    confirmedBy?: string
  ): Promise<DBBingoSquare | null> {
    const result = await query<DBBingoSquare>(`
      UPDATE bingo_squares 
      SET is_confirmed = $2, confirmed_by = $3, confirmed_at = CASE WHEN $2 THEN NOW() ELSE NULL END
      WHERE id = $1 
      RETURNING *
    `, [id, isConfirmed, confirmedBy]);

    return result.rows[0] || null;
  }
}

export class ChallengeModel {
  static async findByCategory(categoryId: number): Promise<DBChallenge[]> {
    const result = await query<DBChallenge>(
      "SELECT * FROM challenges WHERE category_id = $1 AND is_active = true ORDER BY difficulty_level, text",
      [categoryId]
    );
    return result.rows;
  }

  static async findActive(): Promise<DBChallenge[]> {
    const result = await query<DBChallenge>(
      "SELECT * FROM challenges WHERE is_active = true ORDER BY category_id, difficulty_level, text"
    );
    return result.rows;
  }

  static async findRandom(count: number, categoryIds?: number[]): Promise<DBChallenge[]> {
    let query_text = "SELECT * FROM challenges WHERE is_active = true";
    const params: any[] = [count];
    
    if (categoryIds && categoryIds.length > 0) {
      query_text += ` AND category_id = ANY($2)`;
      params.push(categoryIds);
    }
    
    query_text += " ORDER BY RANDOM() LIMIT $1";
    
    const result = await query<DBChallenge>(query_text, params);
    return result.rows;
  }
}

export class ChallengeCategoryModel {
  static async findAll(): Promise<DBChallengeCategory[]> {
    const result = await query<DBChallengeCategory>(
      "SELECT * FROM challenge_categories WHERE is_active = true ORDER BY sort_order, name"
    );
    return result.rows;
  }

  static async findById(id: number): Promise<DBChallengeCategory | null> {
    const result = await query<DBChallengeCategory>(
      "SELECT * FROM challenge_categories WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  }
}

// Utility functions for data conversion
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (false); // In practice, you'd check for uniqueness in database
  
  return code;
}

// Cleanup utilities
export class DatabaseCleanup {
  static async cleanupOldSessions(): Promise<number> {
    const result = await query(`
      DELETE FROM sessions 
      WHERE created_at < NOW() - INTERVAL '24 hours' 
        AND status = 'setup'
    `);
    
    console.log(`[DB] Cleaned up ${result.rowCount} old sessions`);
    return result.rowCount;
  }

  static async cleanupInactivePlayers(): Promise<number> {
    const result = await query(`
      UPDATE players 
      SET connection_status = 'disconnected' 
      WHERE last_activity < NOW() - INTERVAL '1 hour' 
        AND connection_status = 'connected'
    `);
    
    console.log(`[DB] Updated ${result.rowCount} inactive players`);
    return result.rowCount;
  }
}