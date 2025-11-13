-- Migration 013: Progresso de Dungeons
-- Rastreamento de progresso em dungeons

ALTER TABLE game_saves 
ADD COLUMN IF NOT EXISTS dungeon_progress JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS stamina INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS last_stamina_regen TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_game_saves_dungeons ON game_saves USING GIN (dungeon_progress);

COMMENT ON COLUMN game_saves.dungeon_progress IS 'Progresso do jogador em cada dungeon';
COMMENT ON COLUMN game_saves.stamina IS 'Stamina atual para explorações (máx 100)';
COMMENT ON COLUMN game_saves.last_stamina_regen IS 'Última regeneração de stamina';

