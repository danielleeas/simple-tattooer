-- Migration: Add reference_photos and healed_photos columns to clients table
-- Date: 2025-01-27

-- Add reference_photos column
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS reference_photos TEXT[] NOT NULL DEFAULT '{}';

-- Add healed_photos column
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS healed_photos TEXT[] NOT NULL DEFAULT '{}';

-- Note: The indexes for these columns already exist in your schema:
-- CREATE INDEX IF NOT EXISTS idx_clients_reference_photos ON clients(reference_photos);
-- CREATE INDEX IF NOT EXISTS idx_clients_healed_photos ON clients(healed_photos);

