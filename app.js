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
    filterButtons: document.querySelectorAll('.filter-btn'),
    postFoodBtn: document.getElementById('postFoodBtn'),
    postFoodModal: document.getElementById('postFoodModal'),
    postFoodForm: document.getElementById('postFoodForm'),
    closeModal: document.querySelector('.close-modal'),
    cancelBtn: document.getElementById('cancelBtn'),
    photoInput: document.getElementById('photo'),
    photoPreview: document.getElementById('photoPreview')
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

    // Post Free Food button
    elements.postFoodBtn.addEventListener('click', () => {
        elements.postFoodModal.style.display = 'flex';
    });

    // Close modal
    elements.closeModal.addEventListener('click', closeModal);
    elements.cancelBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === elements.postFoodModal) {
            closeModal();
        }
    });

    // Photo input change
    elements.photoInput.addEventListener('change', handlePhotoSelect);

    // Form submission
    elements.postFoodForm.addEventListener('submit', handleFormSubmit);
}

// Load events from backend API
async function loadEvents() {
    try {
        const response = await fetch('/api/events');
        if (!response.ok) {
            throw new Error('Failed to fetch events');
        }
        const events = await response.json();
        state.events = events;
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
            event.event_name.toLowerCase().includes(state.searchQuery) ||
            (event.building && event.building.toLowerCase().includes(state.searchQuery)) ||
            (event.room_number && event.room_number.toLowerCase().includes(state.searchQuery)) ||
            (event.cuisine && event.cuisine.toLowerCase().includes(state.searchQuery)) ||
            (event.diet_type && event.diet_type.toLowerCase().includes(state.searchQuery))
        );
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
                const eventDate = new Date(event.created_at);
                return eventDate >= today && eventDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
            });
            break;
        case 'this-week':
            filtered = filtered.filter(event => {
                const eventDate = new Date(event.created_at);
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
        const dateStr = formatDate(event.created_at || event.date);
        const location = event.building && event.room_number
            ? `${escapeHtml(event.building)}, Room ${escapeHtml(event.room_number)}`
            : event.building || event.room_number || 'Location not specified';

        const cuisine = event.cuisine ? `<span class="event-tag">${escapeHtml(event.cuisine)}</span>` : '';
        const dietType = event.diet_type ? `<span class="event-tag">${escapeHtml(event.diet_type)}</span>` : '';
        const photo = event.photo ? `<img src="${event.photo}" alt="${escapeHtml(event.event_name)}" class="event-photo">` : '';
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
                ${photo}
                <div class="event-header">
                    <h3>${escapeHtml(title)}</h3>
                    <div class="event-meta">
                        ${distanceBadge}
                        <span class="event-date">${dateStr}</span>
                    </div>
                </div>
                <p class="event-location">📍 ${location}</p>
                <div class="event-tags">${cuisine}${dietType}</div>
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

// Close modal
function closeModal() {
    elements.postFoodModal.style.display = 'none';
    elements.postFoodForm.reset();
    elements.photoPreview.innerHTML = '';
    elements.photoPreview.style.display = 'none';
}

// Handle photo selection
function handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (!file) {
        elements.photoPreview.innerHTML = '';
        elements.photoPreview.style.display = 'none';
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        e.target.value = '';
        return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
        elements.photoPreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
        elements.photoPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Convert image to base64
function getBase64FromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const eventName = formData.get('eventName');
    const building = formData.get('building');
    const roomNumber = formData.get('roomNumber');
    const cuisine = formData.get('cuisine');
    const dietType = formData.get('dietType');
    const photoFile = formData.get('photo');

    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Posting...';
        submitBtn.disabled = true;

        // Convert photo to base64 if provided
        let photoBase64 = null;
        if (photoFile && photoFile.size > 0) {
            photoBase64 = await getBase64FromFile(photoFile);
        }

        // Prepare data for API
        const eventData = {
            event_name: eventName,
            building: building,
            room_number: roomNumber,
            cuisine: cuisine || null,
            diet_type: dietType || null,
            photo: photoBase64
        };

        // Submit to API
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to post event');
        }

        // Success - reload events and close modal
        await loadEvents();
        filterEvents();
        renderEvents();
        closeModal();

        // Show success message
        alert('Free food posted successfully!');
    } catch (error) {
        console.error('Error posting event:', error);
        alert('Failed to post event: ' + error.message);
    } finally {
        // Reset button state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Post Free Food';
        submitBtn.disabled = false;
    }
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

