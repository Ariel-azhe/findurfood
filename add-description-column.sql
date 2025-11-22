-- Add description column to free_food_events table
-- Run this in your Supabase SQL Editor

ALTER TABLE free_food_events 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Optional: Add index if you plan to search by description
CREATE INDEX IF NOT EXISTS idx_free_food_events_description ON free_food_events USING gin(to_tsvector('english', description));

