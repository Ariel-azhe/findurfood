# Google Maps API Setup

## Getting Your API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Maps JavaScript API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Maps JavaScript API"
   - Click "Enable"

4. Create an API Key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

5. (Recommended) Restrict your API key:
   - Click on the API key you just created
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain (e.g., `localhost:3000/*`, `yourdomain.com/*`)
   - Under "API restrictions", select "Restrict key" and choose "Maps JavaScript API"
   - Save

## Adding the API Key to Your Project

1. Open `index.html`
2. Find this line:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap" async defer></script>
   ```
3. Replace `YOUR_API_KEY` with your actual Google Maps API key

## Free Tier Limits

Google Maps offers a free tier with:
- $200 free credit per month
- Maps JavaScript API: Free for up to 28,000 map loads per month
- This should be more than enough for development and moderate usage

## Testing

After adding your API key, refresh your browser. You should see:
- A Google Map centered on Princeton University
- Markers for each free food event
- Clickable markers with info windows
- Clicking events in the sidebar centers the map on that location

## Troubleshooting

**Map not showing:**
- Check browser console for errors
- Verify API key is correct
- Ensure Maps JavaScript API is enabled
- Check that your API key restrictions allow your domain

**"This page can't load Google Maps correctly" error:**
- Your API key might be restricted incorrectly
- Check API key restrictions in Google Cloud Console
- Make sure `localhost:3000` is allowed if testing locally

