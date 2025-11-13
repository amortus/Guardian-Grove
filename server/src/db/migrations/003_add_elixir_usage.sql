-- Add elixir usage tracking to beasts table
-- Migration: 003_add_elixir_usage.sql

-- Add elixir usage column (JSON object to track usage counts)
ALTER TABLE beasts 
ADD COLUMN IF NOT EXISTS elixir_usage JSONB DEFAULT '{}';

-- Create index on elixir_usage for efficient queries
CREATE INDEX IF NOT EXISTS idx_beasts_elixir_usage ON beasts USING GIN (elixir_usage);

COMMIT;
