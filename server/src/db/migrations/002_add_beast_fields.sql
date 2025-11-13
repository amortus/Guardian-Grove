-- Add missing fields to beasts table for full Beast system
-- Migration: 002_add_beast_fields.sql

-- Add blood rarity column
ALTER TABLE beasts 
ADD COLUMN IF NOT EXISTS blood VARCHAR(20) DEFAULT 'common';

-- Add elemental affinity column
ALTER TABLE beasts 
ADD COLUMN IF NOT EXISTS affinity VARCHAR(20) DEFAULT 'earth';

-- Add personality traits column (JSON array)
ALTER TABLE beasts 
ADD COLUMN IF NOT EXISTS traits JSONB DEFAULT '[]';

-- Add level column
ALTER TABLE beasts 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Add experience column
ALTER TABLE beasts 
ADD COLUMN IF NOT EXISTS experience INTEGER DEFAULT 0;

-- Add age column
ALTER TABLE beasts 
ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 0;

-- Add max_age column
ALTER TABLE beasts 
ADD COLUMN IF NOT EXISTS max_age INTEGER DEFAULT 100;

-- Create index on blood for filtering
CREATE INDEX IF NOT EXISTS idx_beasts_blood ON beasts(blood);

-- Create index on level for sorting
CREATE INDEX IF NOT EXISTS idx_beasts_level ON beasts(level);

COMMIT;

