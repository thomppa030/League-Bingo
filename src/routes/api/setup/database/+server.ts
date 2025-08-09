import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Pool } from 'pg';
import { env } from '$env/dynamic/private';

const createTablesSQL = `
-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'setup',
    gm_player_id VARCHAR(255),
    allow_late_join BOOLEAN DEFAULT true,
    require_gm_confirmation BOOLEAN DEFAULT true,
    enable_pattern_bonuses BOOLEAN DEFAULT true,
    custom_rules TEXT DEFAULT '[]',
    time_limit INTEGER,
    max_players INTEGER DEFAULT 8,
    min_players INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_gm BOOLEAN DEFAULT false,
    is_ready BOOLEAN DEFAULT false,
    connection_status VARCHAR(50) DEFAULT 'connected',
    total_score INTEGER DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Create game_events table
CREATE TABLE IF NOT EXISTS game_events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    player_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    event_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_players_session_id ON players(session_id);
CREATE INDEX IF NOT EXISTS idx_game_events_session_id ON game_events(session_id);

-- Add updated_at trigger for sessions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_sessions_updated_at 
    BEFORE UPDATE ON sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

export const POST: RequestHandler = async () => {
  try {
    const databaseUrl = env.DATABASE_URL;
    
    if (!databaseUrl) {
      return json({
        success: false,
        error: 'DATABASE_URL environment variable is not set',
        timestamp: new Date()
      }, { status: 500 });
    }

    const pool = new Pool({
      connectionString: databaseUrl,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    const client = await pool.connect();
    
    try {
      console.log('Creating database tables...');
      
      // Execute the schema creation SQL
      await client.query(createTablesSQL);
      
      // Verify tables were created
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);
      
      const tables = tablesResult.rows.map(row => row.table_name);
      
      console.log('Database setup completed successfully');
      console.log('Created tables:', tables);
      
      return json({
        success: true,
        message: 'Database schema created successfully',
        tables_created: tables,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Database setup error:', error);
      return json({
        success: false,
        error: 'Failed to create database schema',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }, { status: 500 });
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (error) {
    console.error('Database connection error:', error);
    return json({
      success: false,
      error: 'Failed to connect to database',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    }, { status: 500 });
  }
};