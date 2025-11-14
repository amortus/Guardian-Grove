-- Hub Positions Table for Ghost System
-- Stores recent player positions in the hub

CREATE TABLE IF NOT EXISTS hub_positions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  player_name VARCHAR(100) NOT NULL,
  beast_line VARCHAR(50) NOT NULL,
  position_x REAL NOT NULL,
  position_y REAL NOT NULL,
  position_z REAL NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast recent visitor queries
CREATE INDEX idx_hub_positions_created_at ON hub_positions(created_at DESC);
CREATE INDEX idx_hub_positions_user_id ON hub_positions(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_hub_positions_updated_at BEFORE UPDATE ON hub_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Clean up old positions (older than 1 hour) automatically
CREATE OR REPLACE FUNCTION cleanup_old_hub_positions()
RETURNS void AS $$
BEGIN
  DELETE FROM hub_positions WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

