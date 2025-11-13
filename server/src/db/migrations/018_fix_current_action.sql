-- Fix: Adicionar coluna current_action caso não exista
-- Migration 018: Correção para sistema de ações em tempo real

ALTER TABLE beasts
ADD COLUMN IF NOT EXISTS current_action JSONB DEFAULT NULL;

-- Criar índice GIN para busca eficiente em current_action
CREATE INDEX IF NOT EXISTS idx_beasts_current_action ON beasts USING GIN (current_action);

-- Garantir que last_exploration e exploration_count existem
ALTER TABLE beasts
ADD COLUMN IF NOT EXISTS last_exploration BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS exploration_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_beasts_last_exploration ON beasts(last_exploration);

