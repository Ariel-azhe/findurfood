-- Supabase Database Schema for Free Food Events
-- Run this SQL in your Supabase SQL Editor

-- Create the free_food_events table
CREATE TABLE IF NOT EXISTS free_food_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name TEXT NOT NULL,
    building TEXT, -- Building name/location (e.g., "Frist Campus Center")
    room_number TEXT, -- Room number (e.g., "201", "Main Hall")
    place_name TEXT, -- Place name/location identifier
    diet_type TEXT, -- e.g., "vegetarian", "vegan", "gluten-free", null for no restrictions
    cuisine TEXT, -- e.g., "Thai", "Mexican", "Italian", null if not specified
    location JSONB, -- Optional: Stores { "lat": number, "lng": number } for map display
    photo TEXT, -- Base64 encoded image string, null if no photo
    description TEXT, -- Optional: Additional description/details about the event
    event_time TEXT, -- Event time in format like "9:00PM", "2:30PM", "11:00AM"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index on location for faster geospatial queries (if needed)
CREATE INDEX IF NOT EXISTS idx_free_food_events_location ON free_food_events USING GIN (location);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_free_food_events_created_at ON free_food_events(created_at DESC);

-- Create index on diet_type for filtering
CREATE INDEX IF NOT EXISTS idx_free_food_events_diet_type ON free_food_events(diet_type);

-- Create index on cuisine for filtering
CREATE INDEX IF NOT EXISTS idx_free_food_events_cuisine ON free_food_events(cuisine);

-- Create index on building for filtering
CREATE INDEX IF NOT EXISTS idx_free_food_events_building ON free_food_events(building);

-- Create index on room_number for filtering
CREATE INDEX IF NOT EXISTS idx_free_food_events_room_number ON free_food_events(room_number);

-- Create index on place_name for filtering
CREATE INDEX IF NOT EXISTS idx_free_food_events_place_name ON free_food_events(place_name);

-- Create index on event_time for sorting
CREATE INDEX IF NOT EXISTS idx_free_food_events_event_time ON free_food_events(event_time);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_free_food_events_updated_at 
    BEFORE UPDATE ON free_food_events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional, adjust policies as needed)
ALTER TABLE free_food_events ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read events
CREATE POLICY "Allow public read access" ON free_food_events
    FOR SELECT
    USING (true);

-- Policy to allow public insert access (for testing - adjust based on your security needs)
CREATE POLICY "Allow public insert access" ON free_food_events
    FOR INSERT
    WITH CHECK (true);

-- Policy to allow public update access (for testing - adjust based on your security needs)
CREATE POLICY "Allow public update access" ON free_food_events
    FOR UPDATE
    USING (true);

-- Policy to allow public delete access (for testing - adjust based on your security needs)
CREATE POLICY "Allow public delete access" ON free_food_events
    FOR DELETE
    USING (true);

