# Building Coordinate Picker

## How to Get Building Coordinates

### Method 1: Click on Map (Easiest)

1. Open your app at http://localhost:3000
2. Open browser console (F12 or Cmd+Option+I)
3. Type: `enableCoordinatePicker()`
4. Click on the map where each building is located
5. Coordinates will be logged to the console
6. Copy the coordinates for each building
7. Type: `disableCoordinatePicker()` when done

### Method 2: Use Google Maps

1. Go to https://www.google.com/maps
2. Search for the building (e.g., "Butler College Princeton")
3. Right-click on the building location
4. Click the coordinates at the top of the popup menu
5. Copy the coordinates (they'll be in decimal format)

### Method 3: Use Geocoding API (Automated)

You can also use Google's Geocoding API to search for building names:

```javascript
// In browser console
async function getBuildingCoords(buildingName) {
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(buildingName + ' Princeton University')}&key=YOUR_API_KEY`
    );
    const data = await response.json();
    if (data.results[0]) {
        const location = data.results[0].geometry.location;
        console.log(`${buildingName}: lat: ${location.lat}, lng: ${location.lng}`);
    }
}

// Then call for each building:
getBuildingCoords('Butler College');
getBuildingCoords('Forbes College');
// etc...
```

## Quick Reference

After getting coordinates, update them in `app.js` in the `addBuildingLabels()` function:

```javascript
const buildings = [
    { name: 'Butler', lat: YOUR_LAT, lng: YOUR_LNG },
    { name: 'Forbes', lat: YOUR_LAT, lng: YOUR_LNG },
    // etc...
];
```

