-- Add place_name column to free_food_events table
-- Run this in your Supabase SQL Editor

ALTER TABLE free_food_events 
ADD COLUMN IF NOT EXISTS place_name TEXT;

-- Optional: Add index if you plan to search by place_name
CREATE INDEX IF NOT EXISTS idx_free_food_events_place_name ON free_food_events(place_name);

