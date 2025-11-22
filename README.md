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
