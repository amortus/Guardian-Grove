-- Migration 009: Sistema de Desafios Diários e Semanais
-- Adiciona colunas para desafios e streaks

-- Adicionar colunas para desafios diários ao game_saves
ALTER TABLE game_saves 
ADD COLUMN IF NOT EXISTS daily_challenges JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS challenge_streak JSONB DEFAULT '{"currentStreak": 0, "longestStreak": 0, "lastCompletionDate": "", "totalDaysCompleted": 0}'::jsonb;

-- Índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_game_saves_challenges ON game_saves USING GIN (daily_challenges);

-- Comentários
COMMENT ON COLUMN game_saves.daily_challenges IS 'Array de desafios diários e semanais ativos';
COMMENT ON COLUMN game_saves.challenge_streak IS 'Informações de streak de conclusão de desafios';

