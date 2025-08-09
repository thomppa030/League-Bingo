#!/usr/bin/env node

// Simple script to set up the database schema locally
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:VJQfrMxyFyLGeOKSYzNuEKUkgEiFoJRY@switchyard.proxy.rlwy.net:56496/railway';

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
`;

async function setupDatabase() {
  console.log('🗄️ Setting up database schema...');
  
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    await client.query(createTablesSQL);
    console.log('✅ Database schema created successfully');
    
    // List created tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables created:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();