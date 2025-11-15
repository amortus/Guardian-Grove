-- Migration 009: Add skins columns to game_saves
-- Adds owned_skins (JSONB array) and active_skin_id (VARCHAR)

ALTER TABLE game_saves
ADD COLUMN IF NOT EXISTS owned_skins JSONB DEFAULT '["feralis", "terramor", "aqualis"]'::jsonb,
ADD COLUMN IF NOT EXISTS active_skin_id VARCHAR(50) DEFAULT 'feralis';

-- Update existing rows to have default values if NULL
UPDATE game_saves
SET owned_skins = '["feralis", "terramor", "aqualis"]'::jsonb
WHERE owned_skins IS NULL;

UPDATE game_saves
SET active_skin_id = 'feralis'
WHERE active_skin_id IS NULL;

-- Create an index for faster skin queries
CREATE INDEX IF NOT EXISTS idx_game_saves_active_skin ON game_saves (active_skin_id);

