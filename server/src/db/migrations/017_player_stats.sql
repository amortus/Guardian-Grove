-- Migration 017: Estatísticas Detalhadas do Jogador

ALTER TABLE game_saves 
ADD COLUMN IF NOT EXISTS stats_tracker JSONB DEFAULT '{
  "totalDefeats": 0,
  "longestStreak": 0,
  "totalDamageDealt": 0,
  "totalDamageTaken": 0,
  "totalHealing": 0,
  "criticalHits": 0,
  "perfectWins": 0,
  "comebackWins": 0,
  "techniqueUsage": {},
  "favoriteElement": "",
  "totalPlayTime": 0,
  "lastLoginDate": "",
  "loginStreak": 1
}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_game_saves_stats ON game_saves USING GIN (stats_tracker);

COMMENT ON COLUMN game_saves.stats_tracker IS 'Rastreamento detalhado de estatísticas do jogador';

