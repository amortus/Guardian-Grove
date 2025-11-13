-- Migration 010: Sistema de Ciclo de Vida das Bestas
-- Histórico de bestas falecidas e memoriais

-- Adicionar colunas para rastreamento de bestas
ALTER TABLE game_saves 
ADD COLUMN IF NOT EXISTS beast_memorials JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS current_beast_lineage INTEGER DEFAULT 0;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_game_saves_memorials ON game_saves USING GIN (beast_memorials);

-- Comentários
COMMENT ON COLUMN game_saves.beast_memorials IS 'Array de memoriais de bestas falecidas';
COMMENT ON COLUMN game_saves.current_beast_lineage IS 'Contador de gerações de bestas (reencarnações)';

