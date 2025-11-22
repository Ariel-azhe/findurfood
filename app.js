// Application State
const state = {
    events: [],
    filteredEvents: [],
    currentFilter: 'all',
    searchQuery: '',
    map: null,
    markers: [],
    dietaryColors: {}
};

// Dietary color mapping (matches server-side colors)
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

// Human-readable dietary labels
const DIETARY_LABELS = {
    halal: 'Halal',
    kosher: 'Kosher',
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    glutenFree: 'Gluten-Free',
    dairyFree: 'Dairy-Free',
    nutFree: 'Nut-Free'
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
    initMap();
    setupEventListeners();
    await loadEvents();
    renderEvents();
    renderMarkers();
}

// Set up event listeners
function setupEventListeners() {
    // Search input
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        filterEvents();
        renderEvents();
        renderMarkers();
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
            renderMarkers();
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
        filtered = filtered.filter(event => 
            event.title.toLowerCase().includes(state.searchQuery) ||
            event.location.toLowerCase().includes(state.searchQuery) ||
            event.description.toLowerCase().includes(state.searchQuery)
        );
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

    state.filteredEvents = filtered;
}

// Get dietary badges HTML for an event
function getDietaryBadges(dietary) {
    if (!dietary || dietary.length === 0) {
        return '<span class="dietary-badge" style="background-color: ' + DIETARY_COLORS.none + ';">No Restrictions</span>';
    }
    return dietary.map(diet => {
        const color = DIETARY_COLORS[diet] || DIETARY_COLORS.none;
        const label = DIETARY_LABELS[diet] || diet;
        return `<span class="dietary-badge" style="background-color: ${color};">${label}</span>`;
    }).join('');
}

// Render events list
function renderEvents() {
    if (state.filteredEvents.length === 0) {
        elements.eventsList.innerHTML = '<p class="no-events">No events found.</p>';
        return;
    }

    elements.eventsList.innerHTML = state.filteredEvents.map(event => {
        const dateStr = formatDate(event.date);
        const dietaryBadges = getDietaryBadges(event.dietary);
        return `
            <div class="event-item" data-event-id="${event.id}">
                <div class="event-header">
                    <h3>${escapeHtml(event.title)}</h3>
                    <span class="event-date">${dateStr}</span>
                </div>
                <div class="dietary-badges">${dietaryBadges}</div>
                <p class="event-location">Location: ${escapeHtml(event.location)}</p>
                <p class="event-description">${escapeHtml(event.description)}</p>
            </div>
        `;
    }).join('');

    // Add click handlers to event items
    document.querySelectorAll('.event-item').forEach(item => {
        item.addEventListener('click', () => {
            const eventId = parseInt(item.dataset.eventId);
            const event = state.events.find(e => e.id === eventId);
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
    if (state.map && event.coordinates) {
        state.map.setView([event.coordinates.lat, event.coordinates.lng], 17);
        // Find and open the popup for this event's marker
        state.markers.forEach(markerInfo => {
            if (markerInfo.eventId === event.id) {
                markerInfo.marker.openPopup();
            }
        });
    }
}

// Get the primary color for an event based on its dietary options
function getEventColor(dietary) {
    if (!dietary || dietary.length === 0) {
        return DIETARY_COLORS.none;
    }
    // Return the color of the first dietary option (primary)
    return DIETARY_COLORS[dietary[0]] || DIETARY_COLORS.none;
}

// Create a colored circle marker icon
function createColoredMarker(color) {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div class="marker-pin" style="background-color: ${color}; border-color: ${color};"></div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -42]
    });
}

// Initialize map with Leaflet
function initMap() {
    // Initialize Leaflet map centered on Princeton campus
    state.map = L.map('map').setView([40.3480, -74.6550], 15);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(state.map);
}

// Render markers on the map based on filtered events
function renderMarkers() {
    if (!state.map) return;

    // Clear existing markers
    state.markers.forEach(markerInfo => {
        state.map.removeLayer(markerInfo.marker);
    });
    state.markers = [];

    // Add markers for filtered events
    state.filteredEvents.forEach(event => {
        if (!event.coordinates) return;

        const color = getEventColor(event.dietary);
        const icon = createColoredMarker(color);

        const marker = L.marker([event.coordinates.lat, event.coordinates.lng], { icon })
            .addTo(state.map);

        // Create popup content with dietary badges
        const dietaryBadges = getDietaryBadges(event.dietary);
        const popupContent = `
            <div class="marker-popup">
                <h4>${escapeHtml(event.title)}</h4>
                <div class="popup-dietary">${dietaryBadges}</div>
                <p><strong>Location:</strong> ${escapeHtml(event.location)}</p>
                <p>${escapeHtml(event.description)}</p>
            </div>
        `;

        marker.bindPopup(popupContent);

        state.markers.push({
            eventId: event.id,
            marker: marker
        });
    });

    // Fit map to show all markers if there are any
    if (state.markers.length > 0) {
        const group = L.featureGroup(state.markers.map(m => m.marker));
        state.map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

