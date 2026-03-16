-- Add duration and resolves_at columns to ai_trades
ALTER TABLE ai_trades 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS resolves_at TIMESTAMPTZ;

-- Update existing trades to have a resolves_at based on created_at + 60s
UPDATE ai_trades 
SET duration = 60, resolves_at = created_at + interval '60 seconds'
WHERE resolves_at IS NULL;
