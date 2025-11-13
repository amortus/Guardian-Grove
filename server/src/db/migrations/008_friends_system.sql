BEGIN;

-- Tabela de amizades
CREATE TABLE IF NOT EXISTS friendships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, blocked
  requested_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id, status);

COMMIT;

