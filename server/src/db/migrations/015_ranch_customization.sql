-- Migration 015: Customização do Rancho

ALTER TABLE game_saves 
ADD COLUMN IF NOT EXISTS ranch_decorations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ranch_theme VARCHAR(50) DEFAULT 'default';

CREATE INDEX IF NOT EXISTS idx_game_saves_ranch ON game_saves USING GIN (ranch_decorations);

COMMENT ON COLUMN game_saves.ranch_decorations IS 'Decorações colocadas no rancho';
COMMENT ON COLUMN game_saves.ranch_theme IS 'Tema visual do rancho';

