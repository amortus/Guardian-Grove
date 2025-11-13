-- Migration para Sistema de Chat
-- Tabela para armazenar mensagens de chat e manter histórico

BEGIN;

-- Tabela de mensagens de chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  channel VARCHAR(50) NOT NULL,
  sender_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sender_username VARCHAR(100) NOT NULL,
  recipient_username VARCHAR(100),
  message TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_channel_timestamp ON chat_messages(channel, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_whisper ON chat_messages(sender_user_id, recipient_username) WHERE recipient_username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_messages(sender_user_id);

-- Função para limpar mensagens antigas (manter apenas últimas 100 por canal)
CREATE OR REPLACE FUNCTION cleanup_old_chat_messages()
RETURNS void AS $$
BEGIN
  -- Deletar mensagens antigas além das últimas 100 de cada canal
  DELETE FROM chat_messages
  WHERE id NOT IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY channel ORDER BY timestamp DESC) as rn
      FROM chat_messages
    ) ranked
    WHERE rn <= 100
  );
END;
$$ LANGUAGE plpgsql;

COMMIT;

