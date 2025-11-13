-- Migration 020: Add avatar selection flag to game saves

ALTER TABLE game_saves
ADD COLUMN IF NOT EXISTS needs_avatar_selection BOOLEAN DEFAULT true;

-- Ensure existing saves default to false (they already have a guardian)
UPDATE game_saves
SET needs_avatar_selection = false
WHERE needs_avatar_selection IS NULL;
