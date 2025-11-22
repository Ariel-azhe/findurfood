-- Ensure UPDATE policy exists for food_percentage updates
-- Run this in your Supabase SQL Editor

-- First, drop the existing policy if it exists (to recreate it properly)
DROP POLICY IF EXISTS "Allow public update access" ON free_food_events;

-- Create the UPDATE policy with both USING and WITH CHECK clauses
-- USING: determines which rows can be updated
-- WITH CHECK: determines which values can be set
CREATE POLICY "Allow public update access" ON free_food_events
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Verify the policy exists
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'free_food_events' AND policyname = 'Allow public update access';

