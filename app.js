// Application State
const state = {
    events: [],
    filteredEvents: [],
    currentFilter: 'all',
    searchQuery: '',
    map: null,
    markers: [] // Store Google Maps markers
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
    // Map will be initialized by Google Maps callback
    // If callback already fired, initialize manually
    if (typeof google !== 'undefined' && google.maps) {
        initMap();
    }
    await loadEvents();
    renderEvents();
    // Markers will be updated by loadEvents() and updateMapMarkers()
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
            date: event.created_at ? new Date(event.created_at) : new Date()
        }));
        state.filteredEvents = [...state.events];
        updateMapMarkers(); // Update markers when events load
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
            event.event_name.toLowerCase().includes(state.searchQuery) ||
            (event.cuisine && event.cuisine.toLowerCase().includes(state.searchQuery)) ||
            (event.diet_type && event.diet_type.toLowerCase().includes(state.searchQuery))
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
    updateMapMarkers(); // Update markers when filters change
}

// Render events list
function renderEvents() {
    if (state.filteredEvents.length === 0) {
        elements.eventsList.innerHTML = '<p class="no-events">No events found.</p>';
        return;
    }

    elements.eventsList.innerHTML = state.filteredEvents.map(event => {
        const dateStr = formatDate(event.date);
        const cuisineText = event.cuisine ? ` • ${event.cuisine}` : '';
        const dietText = event.diet_type ? ` • ${event.diet_type}` : '';
        return `
            <div class="event-item" data-event-id="${event.id}">
                <div class="event-header">
                    <h3>${escapeHtml(event.event_name)}</h3>
                    <span class="event-date">${dateStr}</span>
                </div>
                <p class="event-location">${escapeHtml(event.cuisine || 'Various')}${dietText}</p>
            </div>
        `;
    }).join('');

    // Add click handlers to event items
    document.querySelectorAll('.event-item').forEach(item => {
        item.addEventListener('click', () => {
            const eventId = item.dataset.eventId;
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
    if (!state.map || !event.location) return;
    
    const position = {
        lat: event.location.lat,
        lng: event.location.lng
    };
    
    // Center map on event location
    state.map.setCenter(position);
    state.map.setZoom(17);
    
    // Highlight the marker (you can add animation here)
    const marker = state.markers.find(m => m.eventId === event.id);
    if (marker) {
        // Optional: bounce animation
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 2000);
    }
}

// Initialize Google Maps
function initMap() {
    if (typeof google === 'undefined' || !google.maps) {
        console.error('Google Maps API not loaded');
        return;
    }

    // Remove placeholder
    const placeholder = elements.map.querySelector('.map-placeholder');
    if (placeholder) {
        placeholder.remove();
    }

    // Princeton University campus boundaries
    const princetonBounds = {
        north: 40.352976625343786,  // Upper right corner latitude
        east: -74.6495295699663,     // Upper right corner longitude
        south: 40.3411045338348,     // Lower left corner latitude
        west: -74.66298403123385     // Lower left corner longitude
    };

    // Calculate center point for initial view
    const princetonCenter = {
        lat: (princetonBounds.north + princetonBounds.south) / 2,
        lng: (princetonBounds.east + princetonBounds.west) / 2
    };

    // Initialize map with custom styles to hide street labels
    const mapStyles = [
        {
            featureType: "all",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "road",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "transit",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        }
    ];

    state.map = new google.maps.Map(elements.map, {
        center: princetonCenter,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        styles: mapStyles // Hide all labels
    });

    // Set default bounds to Princeton campus
    const bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(princetonBounds.south, princetonBounds.west), // Southwest corner
        new google.maps.LatLng(princetonBounds.north, princetonBounds.east)   // Northeast corner
    );
    
    // Fit map to Princeton campus bounds
    state.map.fitBounds(bounds);

    // If events are already loaded, add markers now
    if (state.events.length > 0) {
        updateMapMarkers();
    }
}

// Update map markers based on filtered events
function updateMapMarkers() {
    if (!state.map) {
        console.log('Map not initialized yet, markers will be added when map loads');
        return;
    }

    // Clear existing markers
    state.markers.forEach(marker => marker.setMap(null));
    state.markers = [];

    // Add markers for filtered events
    state.filteredEvents.forEach(event => {
        if (!event.location || !event.location.lat || !event.location.lng) return;

        const position = {
            lat: event.location.lat,
            lng: event.location.lng
        };

        // Create custom icon based on cuisine or use default
        const iconColor = getMarkerColor(event.cuisine);
        
        // Create large, obvious marker
        const marker = new google.maps.Marker({
            position: position,
            map: state.map,
            title: event.event_name,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 20, // Much larger - was 10, now 20
                fillColor: iconColor,
                fillOpacity: 0.9,
                strokeColor: '#ffffff',
                strokeWeight: 4 // Thicker white border for visibility
            },
            label: {
                text: '🍽️', // Food emoji as label
                color: '#ffffff',
                fontSize: '20px', // Larger label
                fontWeight: 'bold'
            },
            animation: google.maps.Animation.DROP,
            zIndex: 1000 // Ensure markers appear on top
        });

        // Store event ID for reference
        marker.eventId = event.id;

        // Create info window content with all Supabase data
        const infoContent = `
            <div style="padding: 12px; min-width: 220px; font-family: Arial, sans-serif;">
                <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #333; font-weight: bold;">${escapeHtml(event.event_name)}</h3>
                ${event.cuisine ? `<p style="margin: 6px 0; color: #555; font-size: 14px;"><strong>Cuisine:</strong> ${escapeHtml(event.cuisine)}</p>` : ''}
                ${event.diet_type ? `<p style="margin: 6px 0; color: #555; font-size: 14px;"><strong>Diet Type:</strong> ${escapeHtml(event.diet_type)}</p>` : ''}
                ${event.created_at ? `<p style="margin: 6px 0; color: #888; font-size: 12px;">Added: ${formatDate(new Date(event.created_at))}</p>` : ''}
            </div>
        `;

        const infoWindow = new google.maps.InfoWindow({
            content: infoContent
        });

        // Add click listener to marker
        marker.addListener('click', () => {
            infoWindow.open(state.map, marker);
            focusOnEvent(event);
        });

        state.markers.push(marker);
    });

    // Fit map to show all markers, but respect Princeton campus boundaries
    if (state.markers.length > 0) {
        const markerBounds = new google.maps.LatLngBounds();
        state.markers.forEach(marker => {
            markerBounds.extend(marker.getPosition());
        });
        
        // Princeton campus boundaries
        const campusBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(40.3411045338348, -74.66298403123385),  // Southwest
            new google.maps.LatLng(40.352976625343786, -74.6495295699663)   // Northeast
        );
        
        // Extend marker bounds to include campus bounds (ensures campus is always visible)
        markerBounds.extend(campusBounds.getSouthWest());
        markerBounds.extend(campusBounds.getNorthEast());
        
        state.map.fitBounds(markerBounds);
        
        // Don't zoom in too much if there's only one marker
        if (state.markers.length === 1) {
            // Still show campus context
            state.map.fitBounds(campusBounds);
        }
    } else {
        // If no markers, show default campus view
        const campusBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(40.3411045338348, -74.66298403123385),  // Southwest
            new google.maps.LatLng(40.352976625343786, -74.6495295699663)   // Northeast
        );
        state.map.fitBounds(campusBounds);
    }
}

// Make initMap globally accessible for Google Maps callback
window.initMap = initMap;

// Get marker color based on cuisine type
function getMarkerColor(cuisine) {
    if (!cuisine) return '#4285F4'; // Default blue
    
    const colorMap = {
        'Thai': '#FF6B6B',
        'Italian': '#4ECDC4',
        'Mexican': '#FFE66D',
        'Chinese': '#FF6B9D',
        'Japanese': '#C44569',
        'Indian': '#F8B500',
        'American': '#95E1D3'
    };
    
    return colorMap[cuisine] || '#4285F4';
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
    // If Google Maps is already loaded, initialize immediately
    if (typeof google !== 'undefined' && google.maps) {
        init();
    } else {
        // Otherwise wait for Google Maps callback
        init();
    }
}

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { init, loadEvents, filterEvents, renderEvents };
}

