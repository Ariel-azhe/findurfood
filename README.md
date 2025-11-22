# Find Your Food

A web application to visualize Princeton's free food email list events on an interactive map.

## Structure

- `index.html` - Main HTML structure
- `styles.css` - Styling and responsive design
- `app.js` - Application logic and event handling

## Features

- Interactive map display (placeholder ready for map library integration)
- Event list sidebar with search functionality
- Filter events by date (All, Today, This Week)
- Responsive design for mobile and desktop
- Modern, clean UI

## Getting Started

### Installation

```bash
npm install
```

### Running the Application

```bash
npm start
```

This will start both the backend server and serve the frontend at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api/events
- **Health Check**: http://localhost:3000/api/health

The framework is ready for:
- Map library integration (Leaflet, Google Maps, Mapbox, etc.) via MCP
- Data source connection (email parsing, API, etc.)
- Event marker rendering on the map

## Next Steps

1. Integrate a map library (e.g., Leaflet, Google Maps, Mapbox)
2. Connect to data source (email parsing or API)
3. Add event markers to the map
4. Implement click interactions between map and event list