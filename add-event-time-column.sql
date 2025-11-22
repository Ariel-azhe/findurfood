-- Add event_time column to free_food_events table
-- Run this in your Supabase SQL Editor
-- Time format: "9:00PM", "2:30PM", "11:00AM", etc.

ALTER TABLE free_food_events 
ADD COLUMN IF NOT EXISTS event_time TEXT;

-- Create index for sorting by time
CREATE INDEX IF NOT EXISTS idx_free_food_events_event_time ON free_food_events(event_time);

