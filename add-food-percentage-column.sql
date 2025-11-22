-- Add food_percentage column to free_food_events table
-- Run this in your Supabase SQL Editor

ALTER TABLE free_food_events 
ADD COLUMN IF NOT EXISTS food_percentage INTEGER DEFAULT 100 CHECK (food_percentage >= 0 AND food_percentage <= 100);

-- Add index for filtering/sorting by food percentage
CREATE INDEX IF NOT EXISTS idx_free_food_events_food_percentage ON free_food_events(food_percentage);

-- Add comment to column
COMMENT ON COLUMN free_food_events.food_percentage IS 'Percentage of food remaining (0-100)';

-- Ensure UPDATE policy exists and allows updates to food_percentage
-- Drop and recreate to ensure it's properly configured
DROP POLICY IF EXISTS "Allow public update access" ON free_food_events;

CREATE POLICY "Allow public update access" ON free_food_events
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

