-- Migration para Sistema de Tempo Real
-- Adiciona campos para ações cronometradas e remove sistema de semanas

BEGIN;

-- ===== BEASTS TABLE =====

-- Adicionar campos de ações em tempo real
ALTER TABLE beasts 
ADD COLUMN IF NOT EXISTS current_action JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_exploration BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_tournament BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS exploration_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_update BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS work_bonus_count INTEGER DEFAULT 0;

-- Adicionar campo de nascimento (timestamp)
ALTER TABLE beasts
ADD COLUMN IF NOT EXISTS birth_date BIGINT DEFAULT 0;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_beasts_current_action ON beasts USING GIN (current_action);
CREATE INDEX IF NOT EXISTS idx_beasts_last_exploration ON beasts(last_exploration);
CREATE INDEX IF NOT EXISTS idx_beasts_last_tournament ON beasts(last_tournament);
CREATE INDEX IF NOT EXISTS idx_beasts_birth_date ON beasts(birth_date);

-- ===== GAME_SAVES TABLE =====

-- Remover campos de sistema semanal (se existirem)
ALTER TABLE game_saves
DROP COLUMN IF EXISTS week,
DROP COLUMN IF EXISTS year,
DROP COLUMN IF EXISTS total_weeks;

-- Adicionar timestamp de última sincronização
ALTER TABLE game_saves
ADD COLUMN IF NOT EXISTS last_sync BIGINT DEFAULT 0;

COMMIT;

