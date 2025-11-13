-- Migration 011: Histórico de Relíquias de Eco
-- Rastreamento de relíquias usadas

ALTER TABLE game_saves 
ADD COLUMN IF NOT EXISTS relic_history JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_game_saves_relics ON game_saves USING GIN (relic_history);

COMMENT ON COLUMN game_saves.relic_history IS 'Histórico de relíquias usadas pelo jogador';

