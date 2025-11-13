-- Migration para Sistema de Eventos de Calendário
-- Tabela para rastrear eventos já processados

BEGIN;

-- Tabela de log de eventos de calendário
CREATE TABLE IF NOT EXISTS calendar_events_log (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(100) NOT NULL,
  event_date VARCHAR(10) NOT NULL, -- Formato: YYYY-MM-DD
  processed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_name, event_date)
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events_log(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_name ON calendar_events_log(event_name);

COMMIT;

