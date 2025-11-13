-- Migration 012: Sistema de PvP
-- Rankings, ELO e temporadas

-- Tabela de rankings PvP
CREATE TABLE IF NOT EXISTS pvp_rankings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  elo_rating INTEGER DEFAULT 1000,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  highest_elo INTEGER DEFAULT 1000,
  season_number INTEGER DEFAULT 1,
  last_match_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de histórico de batalhas PvP
CREATE TABLE IF NOT EXISTS pvp_battles (
  id SERIAL PRIMARY KEY,
  player1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  player2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  elo_change_p1 INTEGER,
  elo_change_p2 INTEGER,
  battle_data JSONB,
  season_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de temporadas PvP
CREATE TABLE IF NOT EXISTS pvp_seasons (
  season_number INTEGER PRIMARY KEY,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  top_players JSONB DEFAULT '[]'::jsonb,
  rewards_distributed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pvp_rankings_elo ON pvp_rankings(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_pvp_rankings_season ON pvp_rankings(season_number);
CREATE INDEX IF NOT EXISTS idx_pvp_battles_player1 ON pvp_battles(player1_id);
CREATE INDEX IF NOT EXISTS idx_pvp_battles_player2 ON pvp_battles(player2_id);
CREATE INDEX IF NOT EXISTS idx_pvp_battles_season ON pvp_battles(season_number);

-- Comentários
COMMENT ON TABLE pvp_rankings IS 'Rankings e estatísticas PvP dos jogadores';
COMMENT ON TABLE pvp_battles IS 'Histórico de batalhas PvP';
COMMENT ON TABLE pvp_seasons IS 'Temporadas de PvP';

