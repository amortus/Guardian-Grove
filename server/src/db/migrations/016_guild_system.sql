-- Migration 016: Sistema de Guildas

-- Tabela de guildas
CREATE TABLE IF NOT EXISTS guilds (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  leader_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  emblem JSONB DEFAULT '{"icon": "⚔️", "color": "#ffffff"}'::jsonb,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  total_members INTEGER DEFAULT 1,
  max_members INTEGER DEFAULT 30,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de membros de guilda
CREATE TABLE IF NOT EXISTS guild_members (
  guild_id INTEGER REFERENCES guilds(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- leader, officer, member
  contribution_points INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (guild_id, user_id)
);

-- Tabela de guerras de guilda
CREATE TABLE IF NOT EXISTS guild_wars (
  id SERIAL PRIMARY KEY,
  guild1_id INTEGER REFERENCES guilds(id) ON DELETE CASCADE,
  guild2_id INTEGER REFERENCES guilds(id) ON DELETE CASCADE,
  winner_id INTEGER REFERENCES guilds(id) ON DELETE SET NULL,
  guild1_points INTEGER DEFAULT 0,
  guild2_points INTEGER DEFAULT 0,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_guilds_name ON guilds(name);
CREATE INDEX IF NOT EXISTS idx_guilds_level ON guilds(level DESC);
CREATE INDEX IF NOT EXISTS idx_guild_members_user ON guild_members(user_id);
CREATE INDEX IF NOT EXISTS idx_guild_wars_guilds ON guild_wars(guild1_id, guild2_id);

-- Comentários
COMMENT ON TABLE guilds IS 'Guildas (clãs) de jogadores';
COMMENT ON TABLE guild_members IS 'Membros das guildas';
COMMENT ON TABLE guild_wars IS 'Guerras entre guildas';

