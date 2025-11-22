# Setup Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3000
```

You can find these values in your Supabase project settings:
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "Project URL" and "anon public" key

## Database Setup

1. Go to your Supabase project SQL Editor
2. Run the SQL script from `database-schema.sql` to create the `free_food_events` table
3. The table will be created with the following structure:
   - `id` (UUID, primary key)
   - `event_name` (TEXT, required)
   - `diet_type` (TEXT, optional)
   - `cuisine` (TEXT, optional)
   - `location` (JSONB, required) - format: `{"lat": 40.3480, "lng": -74.6550}`
   - `photo` (TEXT, optional) - base64 encoded image
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

## Installation

```bash
npm install
```

## Running the Server

```bash
npm start
```

The server will start on http://localhost:3000

