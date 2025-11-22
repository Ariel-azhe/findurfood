// Application State
const state = {
    events: [],
    filteredEvents: [],
    currentFilter: 'all',
    searchQuery: '',
    userLocation: null, // { lat: number, lng: number }
    locationError: null
};

// DOM Elements
const elements = {
    searchInput: document.getElementById('searchInput'),
    eventsList: document.getElementById('eventsList'),
    map: document.getElementById('map'),
    filterButtons: document.querySelectorAll('.filter-btn')
};

// Initialize the application
async function init() {
    setupEventListeners();
    // Request location permission and load events in parallel
    const [, userLocation] = await Promise.all([
        loadEvents(),
        getUserLocation()
    ]);

    // Re-filter and render to apply distance sorting
    filterEvents();
    renderEvents();

    // Show location status message if there was an error
    if (state.locationError) {
        showLocationStatus(state.locationError);
    }
}

// Show location status message to user
function showLocationStatus(message) {
    const statusEl = document.getElementById('locationStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.display = 'block';
        // Hide after 5 seconds
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Search input
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        filterEvents();
        renderEvents();
    });

    // Filter buttons
    elements.filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            elements.filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update filter
            state.currentFilter = e.target.dataset.filter;
            filterEvents();
            renderEvents();
        });
    });
}

// Load events from backend API
async function loadEvents() {
    try {
        const response = await fetch('/api/events');
        if (!response.ok) {
            throw new Error('Failed to fetch events');
        }
        const events = await response.json();
        // Convert date strings back to Date objects
        state.events = events.map(event => ({
            ...event,
            date: new Date(event.date)
        }));
        state.filteredEvents = [...state.events];
    } catch (error) {
        console.error('Error loading events:', error);
        // Fallback to empty array on error
        state.events = [];
        state.filteredEvents = [];
    }
}

// Filter events based on current filter and search query
function filterEvents() {
    let filtered = [...state.events];

    // Apply search filter
    if (state.searchQuery) {
        filtered = filtered.filter(event => {
            const eventName = (event.event_name || event.title || '').toLowerCase();
            const locationStr = typeof event.location === 'string'
                ? event.location.toLowerCase()
                : '';
            const description = (event.description || '').toLowerCase();
            return eventName.includes(state.searchQuery) ||
                   locationStr.includes(state.searchQuery) ||
                   description.includes(state.searchQuery);
        });
    }

    // Apply date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    switch (state.currentFilter) {
        case 'today':
            filtered = filtered.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate >= today && eventDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
            });
            break;
        case 'this-week':
            filtered = filtered.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate >= today && eventDate < weekFromNow;
            });
            break;
        case 'all':
        default:
            // No date filtering
            break;
    }

    // Calculate distance for each event and sort by distance if user location is available
    if (state.userLocation) {
        filtered = filtered.map(event => {
            let distance = null;
            // Handle both object location { lat, lng } and string location
            if (event.location && typeof event.location === 'object' &&
                event.location.lat != null && event.location.lng != null) {
                distance = calculateDistance(
                    state.userLocation.lat,
                    state.userLocation.lng,
                    event.location.lat,
                    event.location.lng
                );
            }
            return { ...event, distance };
        });

        // Sort by distance (nearest first), events without distance go to end
        filtered.sort((a, b) => {
            if (a.distance === null && b.distance === null) return 0;
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
        });
    }

    state.filteredEvents = filtered;
}

// Render events list
function renderEvents() {
    if (state.filteredEvents.length === 0) {
        elements.eventsList.innerHTML = '<p class="no-events">No events found.</p>';
        return;
    }

    elements.eventsList.innerHTML = state.filteredEvents.map(event => {
        const dateStr = formatDate(event.date);
        // Support both event_name (backend) and title (frontend)
        const title = event.event_name || event.title || 'Untitled Event';
        // Format location for display
        const locationDisplay = typeof event.location === 'object'
            ? `(${event.location.lat.toFixed(4)}, ${event.location.lng.toFixed(4)})`
            : (event.location || 'Unknown location');
        const description = event.description || event.diet_type || '';
        // Distance badge
        const distanceBadge = event.distance != null
            ? `<span class="event-distance">${formatDistance(event.distance)}</span>`
            : '';

        return `
            <div class="event-item" data-event-id="${event.id}">
                <div class="event-header">
                    <h3>${escapeHtml(title)}</h3>
                    <div class="event-meta">
                        ${distanceBadge}
                        <span class="event-date">${dateStr}</span>
                    </div>
                </div>
                <p class="event-location">Location: ${escapeHtml(locationDisplay)}</p>
                ${description ? `<p class="event-description">${escapeHtml(description)}</p>` : ''}
            </div>
        `;
    }).join('');

    // Add click handlers to event items
    document.querySelectorAll('.event-item').forEach(item => {
        item.addEventListener('click', () => {
            const eventId = item.dataset.eventId;
            const event = state.filteredEvents.find(e => e.id === eventId || e.id === parseInt(eventId));
            if (event) {
                focusOnEvent(event);
            }
        });
    });
}

// Format date for display
function formatDate(date) {
    const d = new Date(date);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
}

// Focus on event (for map interaction)
function focusOnEvent(event) {
    // This will be implemented when map is integrated
    console.log('Focus on event:', event);
    // Example: map.setCenter(event.coordinates);
    // Example: map.setZoom(15);
}

// Initialize map (placeholder - will be replaced with actual map library)
function initMap() {
    // This is a placeholder - replace with actual map initialization
    // Example with Leaflet:
    // const map = L.map('map').setView([40.3480, -74.6550], 15);
    // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    
    // Example with Google Maps:
    // const map = new google.maps.Map(document.getElementById('map'), {
    //     center: { lat: 40.3480, lng: -74.6550 },
    //     zoom: 15
    // });
    
    console.log('Map initialization placeholder');
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Request user's geolocation
function getUserLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            state.locationError = 'Geolocation is not supported by your browser';
            console.warn(state.locationError);
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                state.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                state.locationError = null;
                console.log('User location obtained:', state.userLocation);
                resolve(state.userLocation);
            },
            (error) => {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        state.locationError = 'Location permission denied';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        state.locationError = 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        state.locationError = 'Location request timed out';
                        break;
                    default:
                        state.locationError = 'Unknown location error';
                }
                console.warn('Geolocation error:', state.locationError);
                resolve(null);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // Cache location for 5 minutes
            }
        );
    });
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3959; // Earth's radius in miles (use 6371 for kilometers)
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in miles
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Format distance for display
function formatDistance(miles) {
    if (miles < 0.1) {
        return 'Nearby';
    } else if (miles < 1) {
        const feet = Math.round(miles * 5280);
        return `${feet} ft`;
    } else {
        return `${miles.toFixed(1)} mi`;
    }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { init, loadEvents, filterEvents, renderEvents };
}

