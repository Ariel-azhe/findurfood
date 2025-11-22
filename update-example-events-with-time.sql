-- Update example events with event_time
-- Run this in your Supabase SQL Editor after adding the event_time column

-- Update existing events with example times
UPDATE free_food_events
SET event_time = '9:00PM'
WHERE event_name = 'Thai Food Night at Frist Campus Center';

UPDATE free_food_events
SET event_time = '2:30PM'
WHERE event_name = 'Free Pizza at Nassau Hall';

-- Example format: "9:00PM", "2:30PM", "11:00AM", "12:00PM", etc.

