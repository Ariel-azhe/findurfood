const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const supabase = require('./supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.static(path.join(__dirname)));

// API Routes

// Get all events
app.get('/api/events', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('free_food_events')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch events', details: error.message });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Get single event by ID
app.get('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('free_food_events')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch event', details: error.message });
        }

        if (!data) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(data);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Create new event
app.post('/api/events', async (req, res) => {
    try {
        const { event_name, diet_type, cuisine, location, photo, event_time, description, place_name } = req.body;

        // Validate required fields
        if (!event_name || !diet_type) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['event_name', 'diet_type']
            });
        }

        // Validate location format if provided (should have lat and lng)
        if (location && (!location.lat || !location.lng)) {
            return res.status(400).json({
                error: 'Invalid location format',
                expected: { lat: 'number', lng: 'number' }
            });
        }

        const { data, error } = await supabase
            .from('free_food_events')
            .insert([
                {
                    event_name,
                    place_name: place_name || null,
                    diet_type,
                    cuisine: cuisine || null,
                    location: location || null,
                    photo: photo || null,
                    event_time: event_time || null,
                    description: description || null
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating event:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return res.status(500).json({
                error: 'Failed to create event',
                details: error.message,
                hint: error.hint,
                code: error.code
            });
        }

        res.status(201).json(data);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Update event
app.put('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { event_name, diet_type, cuisine, location, photo, event_time, description, place_name } = req.body;

        const updateData = {};
        if (event_name !== undefined) updateData.event_name = event_name;
        if (place_name !== undefined) updateData.place_name = place_name;
        if (diet_type !== undefined) updateData.diet_type = diet_type;
        if (cuisine !== undefined) updateData.cuisine = cuisine;
        if (location !== undefined) updateData.location = location;
        if (photo !== undefined) updateData.photo = photo;
        if (event_time !== undefined) updateData.event_time = event_time;
        if (description !== undefined) updateData.description = description;

        const { data, error } = await supabase
            .from('free_food_events')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to update event', details: error.message });
        }

        if (!data) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(data);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Delete event
app.delete('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('free_food_events')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to delete event', details: error.message });
        }

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Get Google Maps API key (for frontend use)
app.get('/api/config', (req, res) => {
    res.json({ 
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || ''
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📱 Frontend available at http://localhost:${PORT}`);
    console.log(`🔌 API available at http://localhost:${PORT}/api/events`);
});

