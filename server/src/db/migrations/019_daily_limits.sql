-- Migration 019: Daily limits for beasts

ALTER TABLE beasts
ADD COLUMN IF NOT EXISTS daily_training_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_potion_used BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS exploration_count INTEGER NOT NULL DEFAULT 0;

UPDATE beasts
SET daily_training_count = 0
WHERE daily_training_count IS NULL;

UPDATE beasts
SET daily_potion_used = false
WHERE daily_potion_used IS NULL;

UPDATE beasts
SET exploration_count = 0
WHERE exploration_count IS NULL;

