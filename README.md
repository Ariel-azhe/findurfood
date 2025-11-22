# Find Your Food

A web application to visualize Princeton's free food email list events on an interactive map.

## Structure

- `index.html` - Main HTML structure
- `styles.css` - Styling and responsive design
- `app.js` - Application logic and event handling
- `server.js` - Express.js backend server with Supabase integration
- `supabase.js` - Supabase client configuration
- `database-schema.sql` - Database schema for Supabase
- `SETUP.md` - Detailed setup instructions
- `API_DOCUMENTATION.md` - Complete API documentation for developers and AI assistants

## Features

- Interactive map display (placeholder ready for map library integration)
- Event list sidebar with search functionality
- Filter events by date (All, Today, This Week)
- Responsive design for mobile and desktop
- Modern, clean UI

## Getting Started

### Prerequisites

1. A Supabase account and project
2. Node.js installed

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Create a `.env` file in the root directory
   - Add your Supabase credentials (see `SETUP.md` for details)

3. **Set up the database:**
   - Run the SQL script from `database-schema.sql` in your Supabase SQL Editor

### Running the Application

```bash
npm start
```

This will start both the backend server and serve the frontend at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api/events
- **Health Check**: http://localhost:3000/api/health

### API Endpoints

- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get a specific event
- `POST /api/events` - Create a new event
- `PUT /api/events/:id` - Update an event
- `DELETE /api/events/:id` - Delete an event

**📖 For complete API documentation, see [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md)** - This includes detailed request/response examples, data formats, and is optimized for AI assistants.

See `SETUP.md` for detailed setup instructions.

The framework is ready for:
- Map library integration (Leaflet, Google Maps, Mapbox, etc.) via MCP
- Data source connection (email parsing, API, etc.)
- Event marker rendering on the map

## Next Steps

1. Integrate a map library (e.g., Leaflet, Google Maps, Mapbox)
2. Connect to data source (email parsing or API)
3. Add event markers to the map
4. Implement click interactions between map and event list