-- Migration para Sistema de Ciclo Diário
-- Adiciona campos para rastreamento de idade em dias e processamento de meia-noite

BEGIN;

-- ===== BEASTS TABLE =====

-- Adicionar campos de ciclo diário
ALTER TABLE beasts
ADD COLUMN IF NOT EXISTS age_in_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_day_processed BIGINT DEFAULT 0;

-- Criar índice para performance nas queries de ciclo diário
CREATE INDEX IF NOT EXISTS idx_beasts_last_day_processed ON beasts(last_day_processed) WHERE is_active = true;

COMMIT;

