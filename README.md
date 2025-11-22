# FindUrFood

**Your AI-powered companion for discovering the perfect meal**

Built at the Vibeathon 2024

---

## What is FindUrFood?

FindUrFood is an intelligent food discovery app that helps you answer the age-old question: *"What should I eat?"*

Whether you're craving something specific, looking for nearby options, or want recommendations based on your mood, FindUrFood has you covered.

## The Problem

We've all been there:
- Scrolling endlessly through delivery apps with decision paralysis
- Standing in front of the fridge with no inspiration
- Wanting to try something new but not knowing where to start
- Having dietary restrictions that make finding food frustrating

## Our Solution

FindUrFood uses AI to understand your cravings, preferences, and context to suggest the perfect meal. Just tell it how you're feeling, and let the magic happen.

## Features

- **Mood-Based Recommendations** - Tell us how you're feeling, we'll tell you what to eat
- **Smart Filters** - Dietary restrictions, budget, cuisine type, and more
- **Location-Aware** - Find options near you or for delivery
- **Learn Your Taste** - Gets smarter with every interaction
- **Quick Decisions** - No more endless scrolling

## Tech Stack

*Coming soon as we build this out!*

## Getting Started

```bash
# Clone the repository
git clone https://github.com/Ariel-azhe/findurfood.git

# Navigate to the project
cd findurfood

# Install dependencies (coming soon)
# npm install

# Run the app (coming soon)
# npm start
```

## Roadmap

- [ ] Core recommendation engine
- [ ] User preference system
- [ ] Location services integration
- [ ] Restaurant/recipe database
- [ ] Mobile-friendly UI
- [ ] AI chat interface

## Team

Built with vibes at the Vibeathon

## Contributing

This project was born at a vibeathon and we'd love contributions! Feel free to:
1. Fork the repo
2. Create a feature branch
3. Submit a PR

## License

MIT License - Vibe freely!

---

*Made with good vibes and hungry stomachs*
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

4. **Set up Google Maps API:**
   - Get a Google Maps API key (see `GOOGLE_MAPS_SETUP.md` for instructions)
   - Replace `YOUR_API_KEY` in `index.html` with your actual API key

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
