// Application State
const state = {
    events: [],
    filteredEvents: [],
    currentFilter: 'all',
    searchQuery: ''
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
    await loadEvents();
    renderEvents();
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

// Render events list
function renderEvents() {
    if (state.filteredEvents.length === 0) {
        elements.eventsList.innerHTML = '<p class="no-events">No events found.</p>';
        return;
    }

    elements.eventsList.innerHTML = state.filteredEvents.map(event => {
        const dateStr = formatDate(event.date);
        return `
            <div class="event-item" data-event-id="${event.id}">
                <div class="event-header">
                    <h3>${escapeHtml(event.title)}</h3>
                    <span class="event-date">${dateStr}</span>
                </div>
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

