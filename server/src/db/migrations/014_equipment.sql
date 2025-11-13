-- Migration 014: Sistema de Equipamentos

ALTER TABLE game_saves 
ADD COLUMN IF NOT EXISTS beast_equipment JSONB DEFAULT '{"mask": null, "armor": null, "weapon": null, "amulet": null}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_game_saves_equipment ON game_saves USING GIN (beast_equipment);

COMMENT ON COLUMN game_saves.beast_equipment IS 'Equipamentos equipados pela besta ativa';

