const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Routes
app.get('/api/events', (req, res) => {
    // Placeholder data - replace with actual data source
    const events = [
        {
            id: 1,
            title: 'Sample Free Food Event',
            date: new Date('2024-01-15').toISOString(),
            location: 'Frist Campus Center',
            description: 'Free pizza and drinks available for all students.',
            coordinates: { lat: 40.3480, lng: -74.6550 }
        },
        {
            id: 2,
            title: 'Another Event',
            date: new Date('2024-01-16').toISOString(),
            location: 'Nassau Hall',
            description: 'Free lunch buffet with vegetarian options.',
            coordinates: { lat: 40.3487, lng: -74.6590 }
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

