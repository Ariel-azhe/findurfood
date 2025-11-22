// Application State
const state = {
    events: [],
    filteredEvents: [],
    searchQuery: '',
    sortBy: 'time-asc', // Default sort by time ascending
    map: null,
    markers: [], // Store Google Maps markers for events
    buildingMarkers: [], // Store building markers
    userLocationMarker: null, // User's location marker
    userLocation: null, // { lat: number, lng: number }
    locationError: null
};

// DOM Elements
const elements = {
    searchInput: document.getElementById('searchInput'),
    eventsList: document.getElementById('eventsList'),
    map: document.getElementById('map'),
    sortBy: document.getElementById('sortBy'),
    postFoodBtn: document.getElementById('postFoodBtn'),
    postFoodModal: document.getElementById('postFoodModal'),
    postFoodForm: document.getElementById('postFoodForm'),
    closeModal: document.querySelector('.close-modal'),
    cancelBtn: document.getElementById('cancelBtn'),
    photoInput: document.getElementById('photo'),
    photoPreview: document.getElementById('photoPreview'),
    cameraBtn: document.getElementById('cameraBtn'),
    cameraModal: document.getElementById('cameraModal'),
    cameraVideo: document.getElementById('cameraVideo'),
    cameraCanvas: document.getElementById('cameraCanvas'),
    captureBtn: document.getElementById('captureBtn'),
    closeCameraBtn: document.getElementById('closeCameraBtn'),
    closeCameraModal: document.querySelector('.close-camera-modal')
};

// Camera state
let cameraStream = null;
let capturedPhotoBlob = null;

// Initialize the application
async function init() {
    setupEventListeners();
    // Map will be initialized by Google Maps callback
    // If callback already fired, initialize manually
    if (typeof google !== 'undefined' && google.maps) {
        initMap();
    }
    // Request location permission and load events in parallel
    const [, userLocation] = await Promise.all([
        loadEvents(),
        getUserLocation()
    ]);

    // Re-filter and render to apply distance sorting
    filterEvents();
    renderEvents();

    // Location is optional - no need to show errors
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

    // Sort dropdown
    elements.sortBy.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        filterEvents();
        renderEvents();
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

    // Camera button click
    elements.cameraBtn.addEventListener('click', openCamera);

    // Camera modal controls
    elements.captureBtn.addEventListener('click', capturePhoto);
    elements.closeCameraBtn.addEventListener('click', closeCamera);
    elements.closeCameraModal.addEventListener('click', closeCamera);

    // Close camera modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === elements.cameraModal) {
            closeCamera();
        }
    });

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
        filtered = filtered.filter(event => {
            const eventName = (event.event_name || event.title || '').toLowerCase();
            const placeName = (event.place_name || '').toLowerCase();
            const cuisine = (event.cuisine || '').toLowerCase();
            const dietType = (event.diet_type || '').toLowerCase();
            const locationStr = typeof event.location === 'string'
                ? event.location.toLowerCase()
                : '';
            const description = (event.description || '').toLowerCase();
            return eventName.includes(state.searchQuery) ||
                   placeName.includes(state.searchQuery) ||
                   cuisine.includes(state.searchQuery) ||
                   dietType.includes(state.searchQuery) ||
                   locationStr.includes(state.searchQuery) ||
                   description.includes(state.searchQuery);
        });
    }


    // Calculate distance for each event if user location is available
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
    }

    // Sort events based on selected sort option
    filtered.sort((a, b) => {
        switch (state.sortBy) {
            case 'time-asc':
                return sortByTime(a, b, true);
            case 'time-desc':
                return sortByTime(a, b, false);
            case 'distance':
                if (!state.userLocation) return 0;
                if (a.distance === null && b.distance === null) return 0;
                if (a.distance === null) return 1;
                if (b.distance === null) return -1;
                return a.distance - b.distance;
            case 'name':
                const nameA = (a.event_name || '').toLowerCase();
                const nameB = (b.event_name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            default:
                return 0;
        }
    });

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
        const timeStr = event.event_time ? escapeHtml(event.event_time) : formatUploadTime(event.created_at);
        // Use place_name if available, otherwise fall back to building/room_number
        const location = event.place_name || 
            (event.building && event.room_number
                ? `${escapeHtml(event.building)}, Room ${escapeHtml(event.room_number)}`
                : event.building || event.room_number || 'Location not specified');

        const cuisine = event.cuisine ? `<span class="event-tag cuisine-tag">${escapeHtml(capitalizeFirst(event.cuisine))}</span>` : '';
        const dietType = event.diet_type ? `<span class="event-tag diet-tag">${escapeHtml(capitalizeFirst(event.diet_type))}</span>` : '';
        const photo = event.photo ? `<img src="${event.photo}" alt="${escapeHtml(event.event_name)}" class="event-photo">` : '';
        // Support both event_name (backend) and title (frontend)
        const title = event.event_name || event.title || 'Untitled Event';
        // Format location for display
        const locationDisplay = typeof event.location === 'object'
            ? `(${event.location.lat.toFixed(4)}, ${event.location.lng.toFixed(4)})`
            : (event.location || 'Unknown location');
        const description = event.description || '';
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
                        <span class="event-time">${timeStr}</span>
                        ${distanceBadge}
                    </div>
                </div>
                <p class="event-location">📍 ${location}</p>
                <div class="event-tags">${dietType}${cuisine}</div>
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

// Format time from timestamp to 12-hour format with AM/PM
function formatUploadTime(timestamp) {
    if (!timestamp) return 'Time TBD';

    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12

    // Pad minutes with leading zero if needed
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;

    return `${hours}:${minutesStr}${ampm}`;
}

// Convert time string (e.g., "9:00PM") to minutes for sorting
function timeToMinutes(timeStr) {
    if (!timeStr) return Infinity; // Events without time go to end
    
    const match = timeStr.match(/(\d{1,2}):(\d{2})(AM|PM)/i);
    if (!match) return Infinity;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }
    
    return hours * 60 + minutes;
}

// Sort by time
function sortByTime(a, b, ascending = true) {
    const timeA = timeToMinutes(a.event_time);
    const timeB = timeToMinutes(b.event_time);
    
    // Events without time go to end
    if (timeA === Infinity && timeB === Infinity) return 0;
    if (timeA === Infinity) return 1;
    if (timeB === Infinity) return -1;
    
    return ascending ? timeA - timeB : timeB - timeA;
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

    // Initialize map with custom styles - hide most labels but show street labels
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
            stylers: [{ visibility: "on" }] // Show street labels
        },
        {
            featureType: "transit",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#333333" }] // Dark text for street labels
        },
        {
            featureType: "road",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#ffffff" }] // White outline for readability
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

    // Add building labels
    addBuildingLabels();

    // If user location is already available, add marker
    if (state.userLocation) {
        updateUserLocationMarker();
    }

    // If events are already loaded, add markers now
    if (state.events.length > 0) {
        updateMapMarkers();
    }
}

// Update user location marker on the map
function updateUserLocationMarker() {
    if (!state.map || !state.userLocation) return;

    // Remove existing user location marker if it exists
    if (state.userLocationMarker) {
        state.userLocationMarker.setMap(null);
    }

    // Use Google's default red pin marker for user location
    state.userLocationMarker = new google.maps.Marker({
        position: {
            lat: state.userLocation.lat,
            lng: state.userLocation.lng
        },
        map: state.map,
        title: 'Your Location',
        // Use default Google Maps red pin icon (null = default)
        icon: null,
        zIndex: 2000, // Above event markers
        animation: google.maps.Animation.DROP
    });

    // Create info window
    const infoWindow = new google.maps.InfoWindow({
        content: '<div style="padding: 8px; font-weight: bold;">📍 You are here</div>'
    });

    // Show info window on click
    state.userLocationMarker.addListener('click', () => {
        infoWindow.open(state.map, state.userLocationMarker);
    });
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

// Add building labels to the map
function addBuildingLabels() {
    if (!state.map) return;

    // Clear existing building markers
    state.buildingMarkers.forEach(marker => marker.setMap(null));
    state.buildingMarkers = [];

    // Princeton building locations
    const buildings = [
        { name: 'Butler', lat: 40.344288874358114, lng: -74.65565285584785 },
        { name: 'Forbes', lat: 40.342046353353346, lng: -74.66126895549922 },
        { name: 'Mathey', lat: 40.348176659002405, lng: -74.66139263402692 },
        { name: 'NCW', lat: 40.34191339182642, lng: -74.65493571862864 },
        { name: 'Rocky', lat: 40.34781688299055, lng: -74.65999252092115 },
        { name: 'Whitman', lat: 40.34382114812386, lng: -74.65797149877174 },
        { name: 'Yeh', lat: 40.3420851183729, lng: -74.6543885479896 },
        { name: 'E-quad', lat: 40.35058252612208, lng: -74.65100727250744 },
        { name: 'Nassau Hall', lat: 40.34870422311764, lng: -74.65932116334781 },
        { name: 'Frist', lat: 40.346017330234716, lng: -74.65549043275146 },
        { name: 'Fine Hall', lat: 40.345825920837996, lng: -74.65246533124001 }
    ];

    buildings.forEach(building => {
        // Create marker with text label - using invisible marker with visible label
        const marker = new google.maps.Marker({
            position: { lat: building.lat, lng: building.lng },
            map: state.map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 0, // Invisible marker, just for positioning
                fillOpacity: 0,
                strokeOpacity: 0
            },
            label: {
                text: building.name,
                color: '#1a1a1a',
                fontSize: '13px',
                fontWeight: 'bold'
            },
            zIndex: 1, // Below event markers
            optimized: false // Keep labels visible
        });

        state.buildingMarkers.push(marker);
    });
}

// Helper function to get coordinates by clicking on the map
// Usage: Open browser console and type: enableCoordinatePicker()
window.enableCoordinatePicker = function() {
    if (!state.map) {
        console.error('Map not initialized yet');
        return;
    }
    
    console.log('✅ Coordinate picker enabled! Click anywhere on the map to get coordinates.');
    console.log('Click the map and coordinates will be logged to console.');
    console.log('Type disableCoordinatePicker() to stop.');
    
    const clickListener = state.map.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        console.log(`Coordinates: { lat: ${lat}, lng: ${lng} }`);
        console.log(`Copy this: lat: ${lat}, lng: ${lng}`);
        
        // Also show a marker temporarily
        const tempMarker = new google.maps.Marker({
            position: { lat, lng },
            map: state.map,
            label: {
                text: '📍',
                fontSize: '20px'
            },
            title: `${lat}, ${lng}`
        });
        
        // Remove marker after 3 seconds
        setTimeout(() => tempMarker.setMap(null), 3000);
    });
    
    // Store listener so we can remove it later
    window._coordinatePickerListener = clickListener;
};

window.disableCoordinatePicker = function() {
    if (window._coordinatePickerListener) {
        google.maps.event.removeListener(window._coordinatePickerListener);
        window._coordinatePickerListener = null;
        console.log('✅ Coordinate picker disabled');
    }
};

// Make initMap globally accessible for Google Maps callback
window.initMap = initMap;

// Get marker color based on cuisine type - using Princeton Orange variations
function getMarkerColor(cuisine) {
    if (!cuisine) return '#FF8F00'; // Princeton Orange as default
    
    // Use variations of Princeton Orange for different cuisines
    const colorMap = {
        'Thai': '#FF8F00',      // Princeton Orange
        'Italian': '#FFA726',   // Lighter orange
        'Mexican': '#FF9800',   // Orange
        'Chinese': '#FFB74D',   // Light orange
        'Japanese': '#FF8F00',  // Princeton Orange
        'Indian': '#FF6F00',    // Darker orange
        'American': '#FFA000'   // Medium orange
    };
    
    return colorMap[cuisine] || '#FF8F00'; // Default to Princeton Orange
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility function to capitalize first letter
function capitalizeFirst(text) {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// Close modal
function closeModal() {
    elements.postFoodModal.style.display = 'none';
    elements.postFoodForm.reset();
    elements.photoPreview.innerHTML = '';
    elements.photoPreview.style.display = 'none';
}

// Open camera to take a photo
async function openCamera() {
    try {
        // Request camera access
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }, // Use rear camera on mobile
            audio: false
        });

        // Show the camera modal
        elements.cameraModal.style.display = 'flex';

        // Set the video stream
        elements.cameraVideo.srcObject = cameraStream;
    } catch (error) {
        console.error('Error accessing camera:', error);
        if (error.name === 'NotAllowedError') {
            alert('Camera access was denied. Please allow camera access to take photos.');
        } else if (error.name === 'NotFoundError') {
            alert('No camera found on this device.');
        } else {
            alert('Unable to access camera: ' + error.message);
        }
    }
}

// Capture photo from camera stream
function capturePhoto() {
    if (!cameraStream) return;

    // Set canvas size to match video
    const video = elements.cameraVideo;
    const canvas = elements.cameraCanvas;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
        if (!blob) {
            alert('Failed to capture photo');
            return;
        }

        // Store the blob
        capturedPhotoBlob = blob;

        // Create a File object from the blob
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });

        // Create a DataTransfer object to set the file input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        elements.photoInput.files = dataTransfer.files;

        // Trigger the change event to show preview
        const event = new Event('change', { bubbles: true });
        elements.photoInput.dispatchEvent(event);

        // Close the camera
        closeCamera();
    }, 'image/jpeg', 0.9);
}

// Close camera and stop stream
function closeCamera() {
    // Stop all tracks in the stream
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }

    // Clear video source
    if (elements.cameraVideo) {
        elements.cameraVideo.srcObject = null;
    }

    // Hide the camera modal
    if (elements.cameraModal) {
        elements.cameraModal.style.display = 'none';
    }
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

// Geocode a place name to coordinates using Google Maps API
// Restricts search to Princeton University area
async function geocodePlaceName(placeName) {
    if (!placeName || !google || !google.maps) {
        return null;
    }

    return new Promise((resolve) => {
        const geocoder = new google.maps.Geocoder();

        // Princeton University coordinates for biasing results
        const princetonCenter = { lat: 40.3430, lng: -74.6551 };

        // Geocode with bias towards Princeton
        geocoder.geocode({
            address: `${placeName}, Princeton University, Princeton, NJ`,
            componentRestrictions: {
                country: 'US',
                administrativeArea: 'NJ',
                locality: 'Princeton'
            },
            bounds: {
                north: 40.3530,
                south: 40.3330,
                east: -74.6451,
                west: -74.6651
            }
        }, (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
                const location = results[0].geometry.location;
                const coords = {
                    lat: location.lat(),
                    lng: location.lng()
                };

                // Validate that the result is actually near Princeton (within ~5 miles)
                const distanceFromPrinceton = calculateDistance(
                    princetonCenter.lat,
                    princetonCenter.lng,
                    coords.lat,
                    coords.lng
                );

                if (distanceFromPrinceton < 5) {
                    console.log(`Geocoded "${placeName}" to:`, coords);
                    resolve(coords);
                } else {
                    console.warn(`Geocoded location for "${placeName}" is too far from Princeton (${distanceFromPrinceton.toFixed(1)} miles)`);
                    resolve(null);
                }
            } else {
                console.warn(`Geocoding failed for "${placeName}":`, status);
                resolve(null);
            }
        });
    });
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const eventName = formData.get('eventName');
    const placeName = formData.get('placeName');
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

        // Combine place name and room number
        let combinedPlaceName = placeName || '';
        if (roomNumber && roomNumber.trim()) {
            if (combinedPlaceName) {
                combinedPlaceName += `, Room ${roomNumber.trim()}`;
            } else {
                combinedPlaceName = `Room ${roomNumber.trim()}`;
            }
        }

        // Geocode the place name to get actual Princeton coordinates
        let eventLocation = null;
        if (placeName) {
            eventLocation = await geocodePlaceName(placeName);
            if (!eventLocation) {
                // Fallback: try just the building name without "Princeton University"
                console.log('Retrying geocoding with simpler query...');
                eventLocation = await geocodePlaceName(`${placeName}, Princeton, NJ`);
            }
        }

        // If geocoding fails, fall back to user's current location
        if (!eventLocation) {
            console.warn('Geocoding failed, using user location as fallback');
            eventLocation = state.userLocation;
        }

        // Prepare data for API
        const eventData = {
            event_name: eventName,
            place_name: combinedPlaceName || null,
            cuisine: cuisine || null,
            diet_type: dietType || null,
            photo: photoBase64,
            location: eventLocation || null
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
            console.error('Server returned error:', error);
            const errorMessage = error.details || error.error || 'Failed to post event';
            if (error.hint) {
                console.error('Hint:', error.hint);
            }
            throw new Error(errorMessage);
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
                updateUserLocationMarker(); // Add marker to map
                resolve(state.userLocation);
            },
            (error) => {
                // Don't show error messages - location is optional
                // Only log for debugging
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        console.log('Location permission denied - distance sorting disabled');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        console.log('Location unavailable - distance sorting disabled');
                        break;
                    case error.TIMEOUT:
                        console.log('Location request timed out - distance sorting disabled');
                        break;
                    default:
                        console.log('Location error - distance sorting disabled');
                }
                state.locationError = null; // Don't set error, just silently fail
                resolve(null);
            },
            {
                enableHighAccuracy: false, // Less strict - use IP-based location if GPS unavailable
                timeout: 5000, // Shorter timeout
                maximumAge: 60000 // Cache location for 1 minute
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

