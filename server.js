const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Dietary options with their associated colors for map markers
const DIETARY_COLORS = {
    halal: '#2E7D32',       // Green
    kosher: '#1565C0',      // Blue
    vegetarian: '#7CB342',  // Light Green
    vegan: '#43A047',       // Medium Green
    glutenFree: '#F9A825',  // Amber/Yellow
    dairyFree: '#00ACC1',   // Cyan
    nutFree: '#8E24AA',     // Purple
    none: '#FF5722'         // Orange (default - no specific diet)
};

// API endpoint to get dietary color mappings
app.get('/api/dietary-colors', (req, res) => {
    res.json(DIETARY_COLORS);
});

// API Routes
app.get('/api/events', (req, res) => {
    // Placeholder data - replace with actual data source
    const events = [
        {
            id: 1,
            title: 'Halal Food Friday',
            date: new Date('2024-01-15').toISOString(),
            location: 'Frist Campus Center',
            description: 'Free halal chicken and rice available for all students.',
            coordinates: { lat: 40.3480, lng: -74.6550 },
            dietary: ['halal']
        },
        {
            id: 2,
            title: 'Vegetarian Lunch Buffet',
            date: new Date('2024-01-16').toISOString(),
            location: 'Nassau Hall',
            description: 'Free lunch buffet with vegetarian options.',
            coordinates: { lat: 40.3487, lng: -74.6590 },
            dietary: ['vegetarian', 'glutenFree']
        },
        {
            id: 3,
            title: 'Kosher Deli Night',
            date: new Date('2024-01-17').toISOString(),
            location: 'Center for Jewish Life',
            description: 'Free kosher deli sandwiches and sides.',
            coordinates: { lat: 40.3465, lng: -74.6575 },
            dietary: ['kosher']
        },
        {
            id: 4,
            title: 'Vegan Pizza Party',
            date: new Date('2024-01-18').toISOString(),
            location: 'Forbes College',
            description: 'Free vegan pizza with dairy-free cheese.',
            coordinates: { lat: 40.3445, lng: -74.6620 },
            dietary: ['vegan', 'dairyFree']
        },
        {
            id: 5,
            title: 'Free Pizza & Soda',
            date: new Date('2024-01-19').toISOString(),
            location: 'Engineering Quad',
            description: 'Regular pizza and soda for everyone!',
            coordinates: { lat: 40.3505, lng: -74.6515 },
            dietary: []
        }
    ];

    res.json(events);
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
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

