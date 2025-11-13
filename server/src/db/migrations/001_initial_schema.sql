-- Beast Keepers Database Schema
-- Initial Migration

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);

-- Game saves table (one per user)
CREATE TABLE IF NOT EXISTS game_saves (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  player_name VARCHAR(100) NOT NULL,
  week INTEGER DEFAULT 1,
  coronas INTEGER DEFAULT 1000,
  victories INTEGER DEFAULT 0,
  current_title VARCHAR(100) DEFAULT 'Guardião Iniciante',
  win_streak INTEGER DEFAULT 0,
  lose_streak INTEGER DEFAULT 0,
  total_trains INTEGER DEFAULT 0,
  total_crafts INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_game_saves_user_id ON game_saves(user_id);

-- Beasts table
CREATE TABLE IF NOT EXISTS beasts (
  id SERIAL PRIMARY KEY,
  game_save_id INTEGER REFERENCES game_saves(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  line VARCHAR(50) NOT NULL,
  blood VARCHAR(50) DEFAULT 'common',
  affinity VARCHAR(50) DEFAULT 'earth',
  is_active BOOLEAN DEFAULT false,
  current_hp INTEGER NOT NULL,
  max_hp INTEGER NOT NULL,
  essence INTEGER DEFAULT 50,
  max_essence INTEGER DEFAULT 99,
  age_weeks INTEGER DEFAULT 0,
  max_age_weeks INTEGER DEFAULT 156,
  -- Attributes
  might INTEGER DEFAULT 20,
  wit INTEGER DEFAULT 20,
  focus INTEGER DEFAULT 20,
  agility INTEGER DEFAULT 20,
  ward INTEGER DEFAULT 20,
  vitality INTEGER DEFAULT 20,
  -- Secondary stats
  loyalty INTEGER DEFAULT 50,
  stress INTEGER DEFAULT 0,
  fatigue INTEGER DEFAULT 0,
  -- Personality traits (JSON array)
  traits JSONB DEFAULT '[]',
  -- Técnicas (JSON array de IDs)
  techniques JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_beasts_game_save_id ON beasts(game_save_id);
CREATE INDEX idx_beasts_is_active ON beasts(is_active);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  game_save_id INTEGER REFERENCES game_saves(id) ON DELETE CASCADE,
  item_id VARCHAR(100) NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_save_id, item_id)
);

CREATE INDEX idx_inventory_game_save_id ON inventory(game_save_id);

-- Quests table
CREATE TABLE IF NOT EXISTS quests (
  id SERIAL PRIMARY KEY,
  game_save_id INTEGER REFERENCES game_saves(id) ON DELETE CASCADE,
  quest_id VARCHAR(100) NOT NULL,
  progress JSONB NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_save_id, quest_id)
);

CREATE INDEX idx_quests_game_save_id ON quests(game_save_id);
CREATE INDEX idx_quests_is_active ON quests(is_active);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  game_save_id INTEGER REFERENCES game_saves(id) ON DELETE CASCADE,
  achievement_id VARCHAR(100) NOT NULL,
  progress INTEGER DEFAULT 0,
  unlocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_save_id, achievement_id)
);

CREATE INDEX idx_achievements_game_save_id ON achievements(game_save_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_saves_updated_at BEFORE UPDATE ON game_saves
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beasts_updated_at BEFORE UPDATE ON beasts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

