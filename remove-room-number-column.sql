-- Migration: Remove room_number column from free_food_events
-- Run this SQL in your Supabase SQL Editor to drop the room_number column
-- Room number information should now be included in the place_name field

-- Drop the index on room_number (if it exists)
DROP INDEX IF EXISTS idx_free_food_events_room_number;

-- Drop the room_number column (if it exists)
ALTER TABLE free_food_events DROP COLUMN IF EXISTS room_number;
