-- League Bingo PostgreSQL Schema
-- Comprehensive database design for persistent game state

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom enum types
CREATE TYPE session_status AS ENUM (
  'setup',
  'category_selection', 
  'playing',
  'completed',
  'cancelled'
);

CREATE TYPE player_role AS ENUM (
  'TOP',
  'JUNGLE', 
  'MID',
  'ADC',
  'SUPPORT'
);

CREATE TYPE game_event_type AS ENUM (
  'session_created',
  'player_joined',
  'player_left',
  'player_ready_changed',
  'categories_selected',
  'game_started',
  'square_claimed',
  'square_confirmed',
  'square_rejected',
  'pattern_completed',
  'game_completed'
);

-- Main sessions table
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  code VARCHAR(6) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  status session_status NOT NULL DEFAULT 'setup',
  gm_player_id VARCHAR(255), -- Will be set after GM player is created
  
  -- Session settings
  max_players INTEGER NOT NULL DEFAULT 8,
  min_players INTEGER NOT NULL DEFAULT 1,
  allow_late_join BOOLEAN NOT NULL DEFAULT TRUE,
  require_gm_confirmation BOOLEAN NOT NULL DEFAULT TRUE,
  enable_pattern_bonuses BOOLEAN NOT NULL DEFAULT TRUE,
  custom_rules TEXT[],
  time_limit INTEGER, -- in minutes
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_player_count CHECK (min_players <= max_players),
  CONSTRAINT valid_min_players CHECK (min_players >= 1),
  CONSTRAINT valid_max_players CHECK (max_players <= 20)
);

-- Players table
CREATE TABLE players (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role player_role NOT NULL,
  is_gm BOOLEAN NOT NULL DEFAULT FALSE,
  is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Game state
  selected_categories TEXT[] DEFAULT '{}',
  total_score INTEGER NOT NULL DEFAULT 0,
  connection_status VARCHAR(50) DEFAULT 'connected',
  
  -- Timestamps
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(session_id, name), -- Unique names per session
  CONSTRAINT valid_score CHECK (total_score >= 0)
);

-- Bingo cards table
CREATE TABLE bingo_cards (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id VARCHAR(255) NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  -- Card metadata
  seed VARCHAR(255) NOT NULL, -- For reproducible card generation
  pattern_type VARCHAR(50) DEFAULT 'standard',
  
  -- Timestamps
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(session_id, player_id) -- One card per player per session
);

-- Individual bingo squares
CREATE TABLE bingo_squares (
  id VARCHAR(255) PRIMARY KEY,
  card_id VARCHAR(255) NOT NULL REFERENCES bingo_cards(id) ON DELETE CASCADE,
  position_row INTEGER NOT NULL CHECK (position_row BETWEEN 0 AND 4),
  position_col INTEGER NOT NULL CHECK (position_col BETWEEN 0 AND 4),
  
  -- Square content
  challenge_text TEXT NOT NULL,
  challenge_category VARCHAR(100),
  points INTEGER NOT NULL DEFAULT 1,
  
  -- Completion state
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  evidence TEXT,
  
  -- Timestamps
  completed_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_by VARCHAR(255) REFERENCES players(id),
  
  -- Constraints
  UNIQUE(card_id, position_row, position_col),
  CONSTRAINT valid_points CHECK (points > 0),
  CONSTRAINT completion_logic CHECK (
    (is_completed = FALSE AND completed_at IS NULL) OR
    (is_completed = TRUE AND completed_at IS NOT NULL)
  ),
  CONSTRAINT confirmation_logic CHECK (
    (is_confirmed = FALSE AND confirmed_at IS NULL AND confirmed_by IS NULL) OR
    (is_confirmed = TRUE AND confirmed_at IS NOT NULL AND confirmed_by IS NOT NULL)
  )
);

-- Pattern completions (for tracking bingo patterns)
CREATE TABLE pattern_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id VARCHAR(255) NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  card_id VARCHAR(255) NOT NULL REFERENCES bingo_cards(id) ON DELETE CASCADE,
  
  pattern_name VARCHAR(100) NOT NULL, -- 'row', 'column', 'diagonal', 'full_card', etc.
  pattern_data JSONB NOT NULL, -- Store which squares completed the pattern
  points_awarded INTEGER NOT NULL DEFAULT 0,
  
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_pattern_points CHECK (points_awarded >= 0)
);

-- Game events audit log
CREATE TABLE game_events (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id VARCHAR(255) REFERENCES players(id) ON DELETE SET NULL,
  
  event_type game_event_type NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX (session_id, created_at),
  INDEX (event_type, created_at)
);

-- Challenge categories table (for managing available challenges)
CREATE TABLE challenge_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual challenges
CREATE TABLE challenges (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES challenge_categories(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Metadata
  tags TEXT[],
  min_game_time INTEGER, -- Minimum game time in minutes before this challenge becomes available
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_challenge_points CHECK (points > 0)
);

-- Create indexes for performance
CREATE INDEX idx_sessions_code ON sessions(code);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);

CREATE INDEX idx_players_session_id ON players(session_id);
CREATE INDEX idx_players_is_gm ON players(is_gm);
CREATE INDEX idx_players_is_ready ON players(is_ready);

CREATE INDEX idx_bingo_cards_session_id ON bingo_cards(session_id);
CREATE INDEX idx_bingo_cards_player_id ON bingo_cards(player_id);

CREATE INDEX idx_bingo_squares_card_id ON bingo_squares(card_id);
CREATE INDEX idx_bingo_squares_is_completed ON bingo_squares(is_completed);
CREATE INDEX idx_bingo_squares_is_confirmed ON bingo_squares(is_confirmed);

CREATE INDEX idx_pattern_completions_session_id ON pattern_completions(session_id);
CREATE INDEX idx_pattern_completions_player_id ON pattern_completions(player_id);

CREATE INDEX idx_game_events_session_id ON game_events(session_id);
CREATE INDEX idx_game_events_type ON game_events(event_type);
CREATE INDEX idx_game_events_created_at ON game_events(created_at);

-- Add foreign key constraint for GM after players table exists
ALTER TABLE sessions 
ADD CONSTRAINT fk_sessions_gm_player 
FOREIGN KEY (gm_player_id) REFERENCES players(id) ON DELETE SET NULL;

-- Create trigger functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER challenge_categories_updated_at
  BEFORE UPDATE ON challenge_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Real-time notification functions
CREATE OR REPLACE FUNCTION notify_session_changes()
RETURNS TRIGGER AS $$
DECLARE
  notification JSON;
BEGIN
  -- Build notification payload
  notification = json_build_object(
    'table', TG_TABLE_NAME,
    'action', TG_OP,
    'session_id', COALESCE(NEW.session_id, OLD.session_id),
    'data', CASE 
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
      ELSE row_to_json(NEW)
    END
  );

  -- Send notification
  PERFORM pg_notify('session_changes', notification::text);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for real-time notifications
CREATE TRIGGER session_changes_notify
  AFTER INSERT OR UPDATE OR DELETE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_session_changes();

CREATE TRIGGER player_changes_notify
  AFTER INSERT OR UPDATE OR DELETE ON players
  FOR EACH ROW
  EXECUTE FUNCTION notify_session_changes();

CREATE TRIGGER bingo_square_changes_notify
  AFTER INSERT OR UPDATE OR DELETE ON bingo_squares
  FOR EACH ROW
  EXECUTE FUNCTION notify_session_changes();

-- Function to clean up old sessions
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete sessions older than 24 hours that are still in setup
  DELETE FROM sessions 
  WHERE created_at < NOW() - INTERVAL '24 hours' 
    AND status = 'setup';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup
  INSERT INTO game_events (session_id, event_type, event_data)
  SELECT 
    NULL,
    'session_created', -- Reusing enum, could add 'cleanup' type
    json_build_object('cleanup_count', deleted_count, 'cleanup_type', 'old_sessions')
  WHERE deleted_count > 0;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insert initial challenge categories
INSERT INTO challenge_categories (name, description, sort_order) VALUES
('Early Game', 'Challenges related to the early game phase (0-15 minutes)', 1),
('Mid Game', 'Challenges related to the mid game phase (15-30 minutes)', 2),
('Late Game', 'Challenges related to the late game phase (30+ minutes)', 3),
('Objectives', 'Dragon, Baron, and other objective-based challenges', 4),
('Combat', 'Fighting, kills, and combat-related challenges', 5),
('Items', 'Item purchases and builds', 6),
('Map Control', 'Vision, positioning, and map control', 7),
('Team Play', 'Team coordination and group activities', 8),
('Individual Performance', 'Personal achievements and milestones', 9),
('Misc', 'Fun and miscellaneous challenges', 10);

-- Sample challenges (you can expand this)
INSERT INTO challenges (category_id, text, points, difficulty_level) VALUES
(1, 'Get first blood', 2, 3),
(1, 'Place 3 wards before 10 minutes', 1, 2),
(1, 'Kill a jungle monster before 2 minutes', 1, 1),
(2, 'Get a double kill', 3, 3),
(2, 'Destroy first tower', 2, 2),
(2, 'Participate in first dragon kill', 2, 2),
(3, 'Survive for 40+ minutes', 1, 1),
(3, 'Get a pentakill', 5, 5),
(4, 'Steal dragon or baron', 4, 4),
(4, 'Kill baron', 3, 3),
(5, 'Win a 1v2 fight', 3, 4),
(5, 'Get 10+ kills', 3, 3),
(6, 'Complete your full build (6 items)', 2, 2),
(6, 'Buy boots before 5 minutes', 1, 1),
(7, 'Place 20+ wards in a game', 2, 2),
(7, 'Clear 5+ enemy wards', 2, 3),
(8, 'Get an assist on every team member', 2, 3),
(8, 'Participate in an ace (kill entire enemy team)', 3, 3),
(9, 'Have the highest CS in the game', 2, 2),
(9, 'Die less than 3 times', 2, 2),
(10, 'Dance with an enemy player', 1, 1),
(10, 'Use recall in enemy base', 2, 4);