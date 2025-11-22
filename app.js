// Application State
const state = {
    events: [],
    filteredEvents: [],
    searchQuery: '',
    selectedDietType: '', // Selected diet type filter
    selectedCuisine: '', // Selected cuisine filter
    sortBy: 'time-asc', // Default sort by time ascending
    map: null,
    markers: [], // Store Google Maps markers for events
    buildingMarkers: [], // Store building markers
    userLocationMarker: null, // User's location marker
    userLocation: null, // { lat: number, lng: number }
    locationError: null,
    currentInfoWindow: null // Currently open info window on map
};

// DOM Elements
const elements = {
    searchInput: document.getElementById('searchInput'),
    eventsList: document.getElementById('eventsList'),
    map: document.getElementById('map'),
    sortBy: document.getElementById('sortBy'),
    dietTypeFilter: document.getElementById('dietTypeFilter'),
    cuisineFilter: document.getElementById('cuisineFilter'),
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

    // Diet Type filter
    elements.dietTypeFilter.addEventListener('change', (e) => {
        state.selectedDietType = e.target.value;
        filterEvents();
        renderEvents();
    });

    // Cuisine filter
    elements.cuisineFilter.addEventListener('change', (e) => {
        state.selectedCuisine = e.target.value;
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
    
    // Delete confirmation modal - listeners will be set up in showDeleteConfirmModal
    const deleteModal = document.getElementById('deleteConfirmModal');
    const closeDeleteModal = document.querySelector('.close-delete-modal');
    
    if (closeDeleteModal && deleteModal) {
        closeDeleteModal.addEventListener('click', () => {
            deleteModal.style.display = 'none';
            if (deleteModal._onCancel) {
                deleteModal._onCancel();
            }
        });
    }
    
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    if (cancelDeleteBtn && deleteModal) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.style.display = 'none';
            if (deleteModal._onCancel) {
                deleteModal._onCancel();
            }
        });
    }
    
    // Close delete modal when clicking outside
    if (deleteModal) {
        window.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                deleteModal.style.display = 'none';
                if (deleteModal._onCancel) {
                    deleteModal._onCancel();
                }
            }
        });
    }
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
        
        // Populate filter dropdowns with unique values
        populateFilterDropdowns();
        
        updateMapMarkers(); // Update markers when events load
    } catch (error) {
        console.error('Error loading events:', error);
        // Fallback to empty array on error
        state.events = [];
        state.filteredEvents = [];
    }
}

// Populate filter dropdowns with unique diet types and cuisines
function populateFilterDropdowns() {
    // Get unique diet types
    const dietTypes = [...new Set(state.events
        .map(event => event.diet_type)
        .filter(dt => dt && dt.trim() !== ''))].sort();
    
    // Get unique cuisines
    const cuisines = [...new Set(state.events
        .map(event => event.cuisine)
        .filter(c => c && c.trim() !== ''))].sort();
    
    // Populate diet type filter
    const dietTypeFilter = elements.dietTypeFilter;
    if (dietTypeFilter) {
        // Keep the "All Diet Types" option and add unique values
        const currentValue = dietTypeFilter.value;
        dietTypeFilter.innerHTML = '<option value="">All Diet Types</option>';
        dietTypes.forEach(dietType => {
            const option = document.createElement('option');
            option.value = dietType;
            option.textContent = capitalizeFirst(dietType);
            dietTypeFilter.appendChild(option);
        });
        // Restore previous selection if it still exists
        if (currentValue && dietTypes.includes(currentValue)) {
            dietTypeFilter.value = currentValue;
        }
    }
    
    // Populate cuisine filter
    const cuisineFilter = elements.cuisineFilter;
    if (cuisineFilter) {
        // Keep the "All Cuisines" option and add unique values
        const currentValue = cuisineFilter.value;
        cuisineFilter.innerHTML = '<option value="">All Cuisines</option>';
        cuisines.forEach(cuisine => {
            const option = document.createElement('option');
            option.value = cuisine;
            option.textContent = capitalizeFirst(cuisine);
            cuisineFilter.appendChild(option);
        });
        // Restore previous selection if it still exists
        if (currentValue && cuisines.includes(currentValue)) {
            cuisineFilter.value = currentValue;
        }
    }
}

// Delete an event
async function deleteEvent(eventId, slider, container) {
    try {
        const parsedEventId = typeof eventId === 'string' ? eventId : String(eventId);
        console.log(`Deleting event ${parsedEventId}`);
        
        const response = await fetch(`/api/events/${parsedEventId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            let errorData = {};
            try {
                const text = await response.text();
                errorData = JSON.parse(text);
            } catch (e) {
                // Ignore parse errors
            }
            throw new Error(errorData.details || errorData.error || `Server returned ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Event deleted successfully:', result);

        // Remove event from state
        state.events = state.events.filter(e => 
            String(e.id) !== String(parsedEventId) && 
            e.id !== parseInt(parsedEventId)
        );
        state.filteredEvents = state.filteredEvents.filter(e => 
            String(e.id) !== String(parsedEventId) && 
            e.id !== parseInt(parsedEventId)
        );

        // Remove marker from map
        const markerIndex = state.markers.findIndex(m => {
            if (!m.eventId) return false;
            const markerEventId = String(m.eventId);
            const targetId = String(parsedEventId);
            return markerEventId === targetId;
        });
        if (markerIndex !== -1) {
            state.markers[markerIndex].setMap(null);
            state.markers.splice(markerIndex, 1);
        }

        // Re-render events list
        renderEvents();
        
        // Update map bounds if needed
        if (state.map && state.filteredEvents.length > 0) {
            updateMapMarkers();
        }

        console.log('Event removed from UI and map');
    } catch (error) {
        console.error('Error deleting event:', error);
        alert(`Failed to delete event: ${error.message}`);
        
        // Revert slider to previous value
        const event = state.filteredEvents.find(e => 
            String(e.id) === String(eventId) || 
            e.id === parseInt(eventId)
        );
        const originalPercentage = event?.food_percentage ?? 100;
        
        const valueSpan = container?.querySelector('.food-percentage-value');
        const fillBar = container?.querySelector('.food-percentage-fill');
        
        if (valueSpan) {
            valueSpan.textContent = `${originalPercentage}%`;
            valueSpan.style.opacity = '1';
        }
        if (fillBar) {
            fillBar.style.width = `${originalPercentage}%`;
        }
        if (slider) {
            slider.value = originalPercentage;
        }
    }
}

// Show delete confirmation modal
function showDeleteConfirmModal(eventName, onConfirm, onCancel) {
    const deleteModal = document.getElementById('deleteConfirmModal');
    const deleteMessage = document.getElementById('deleteConfirmMessage');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    if (!deleteModal || !deleteMessage || !confirmDeleteBtn) {
        console.error('Delete modal elements not found');
        // Fallback to browser confirm
        if (confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
            onConfirm();
        } else {
            onCancel();
        }
        return;
    }
    
    // Set the message
    deleteMessage.textContent = `Are you sure you want to delete "${eventName}"? This action cannot be undone.`;
    
    // Store callbacks
    deleteModal._onConfirm = onConfirm;
    deleteModal._onCancel = onCancel;
    
    // Set up confirm button - remove any existing listeners first
    const oldConfirmBtn = document.getElementById('confirmDeleteBtn');
    if (oldConfirmBtn) {
        const newConfirmBtn = oldConfirmBtn.cloneNode(true);
        oldConfirmBtn.parentNode.replaceChild(newConfirmBtn, oldConfirmBtn);
        newConfirmBtn.addEventListener('click', () => {
            deleteModal.style.display = 'none';
            if (deleteModal._onConfirm) {
                deleteModal._onConfirm();
            }
        });
    }
    
    // Show modal
    deleteModal.style.display = 'flex';
}

// Filter events based on current filter and search query
function filterEvents() {
    let filtered = [...state.events];

    // Apply diet type filter
    if (state.selectedDietType) {
        filtered = filtered.filter(event => {
            const eventDietType = (event.diet_type || '').toLowerCase();
            return eventDietType === state.selectedDietType.toLowerCase();
        });
    }

    // Apply cuisine filter
    if (state.selectedCuisine) {
        filtered = filtered.filter(event => {
            const eventCuisine = (event.cuisine || '').toLowerCase();
            return eventCuisine === state.selectedCuisine.toLowerCase();
        });
    }

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
        const relativeTime = event.created_at ? getRelativeTime(event.created_at) : '';
        const timeDisplay = relativeTime ? `${timeStr}<br><small>Since ${relativeTime}</small>` : timeStr;
        // Use place_name
        const location = event.place_name || 'Location not specified';

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
        
        // Food percentage slider
        const foodPercentage = event.food_percentage !== undefined && event.food_percentage !== null 
            ? Math.max(0, Math.min(100, parseInt(event.food_percentage))) 
            : 100;
        const eventIdStr = String(event.id);
        // Store last non-zero value as data attribute (will be set on the slider element)
        const lastNonZero = foodPercentage > 0 ? foodPercentage : 100;
        const foodPercentageDisplay = `
            <div class="food-percentage-container">
                <label class="food-percentage-label">Food Remaining: <span class="food-percentage-value">${foodPercentage}%</span></label>
                <input type="range" 
                       class="food-percentage-slider" 
                       min="0" 
                       max="100" 
                       value="${foodPercentage}" 
                       data-event-id="${eventIdStr}"
                       data-last-non-zero="${lastNonZero}"
                       title="Update food remaining percentage">
                <div class="food-percentage-bar">
                    <div class="food-percentage-fill" style="width: ${foodPercentage}%"></div>
                </div>
            </div>
        `;

        return `
            <div class="event-item" data-event-id="${event.id}">
                ${photo}
                <div class="event-header">
                    <h3>${escapeHtml(title)}</h3>
                    <div class="event-meta">
                        <span class="event-time">${timeDisplay}</span>
                        ${distanceBadge}
                    </div>
                </div>
                <p class="event-location">📍 ${location}</p>
                ${foodPercentageDisplay}
                <div class="event-tags">${dietType}${cuisine}</div>
                ${description ? `<p class="event-description">${escapeHtml(description)}</p>` : ''}
            </div>
        `;
    }).join('');

    // Add click handlers to event items (but not on the slider)
    document.querySelectorAll('.event-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't trigger if clicking on the slider
            if (e.target.closest('.food-percentage-container')) {
                return;
            }
            const eventId = item.dataset.eventId;
            const event = state.filteredEvents.find(e => e.id === eventId || e.id === parseInt(eventId));
            if (event) {
                // Find the corresponding marker and open its info window
                const marker = state.markers.find(m => m.eventId === event.id);
                if (marker) {
                    // Close previous info window if one is open
                    if (state.currentInfoWindow) {
                        state.currentInfoWindow.close();
                    }
                    // Find and open the info window for this marker
                    // We need to recreate the info window since we didn't store it
                    const infoContent = `
                        <div style="padding: 12px; min-width: 220px; font-family: Arial, sans-serif;">
                            ${event.photo ? `<img src="${event.photo}" alt="Food Photo" style="width: 100%; max-width: 280px; height: 150px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">` : ''}
                            <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #333; font-weight: bold;">${escapeHtml(event.event_name)}</h3>
                            ${event.cuisine ? `<p style="margin: 6px 0; color: #555; font-size: 14px;"><strong>Cuisine:</strong> ${escapeHtml(event.cuisine)}</p>` : ''}
                            ${event.diet_type ? `<p style="margin: 6px 0; color: #555; font-size: 14px;"><strong>Diet Type:</strong> ${escapeHtml(event.diet_type)}</p>` : ''}
                            ${event.created_at ? `<p style="margin: 6px 0; color: #888; font-size: 12px;">Added: ${formatDate(new Date(event.created_at))}</p>` : ''}
                        </div>
                    `;
                    const infoWindow = new google.maps.InfoWindow({
                        content: infoContent
                    });
                    infoWindow.open(state.map, marker);
                    state.currentInfoWindow = infoWindow;
                }
                focusOnEvent(event);
            }
        });
    });
    
    // Initialize last non-zero value for all sliders when they're rendered
    document.querySelectorAll('.food-percentage-slider').forEach(slider => {
        const eventId = slider.dataset.eventId;
        if (eventId) {
            const event = state.filteredEvents.find(e => 
                String(e.id) === String(eventId) || 
                e.id === parseInt(eventId)
            );
            if (event) {
                const savedPercentage = event.food_percentage;
                // Initialize with the saved value from server (if > 0) or use data attribute
                if (savedPercentage !== undefined && savedPercentage !== null && savedPercentage > 0) {
                    slider._lastNonZeroValue = savedPercentage;
                } else {
                    const dataLastNonZero = slider.dataset.lastNonZero;
                    slider._lastNonZeroValue = dataLastNonZero ? parseInt(dataLastNonZero) : 100;
                }
            }
        }
    });

    // Add handlers for food percentage sliders using event delegation
    // This prevents duplicate listeners when events are re-rendered
    const eventsList = document.querySelector('.events-list');
    if (eventsList) {
        // Remove old listeners if they exist
        if (eventsList._foodPercentageInputHandler) {
            eventsList.removeEventListener('input', eventsList._foodPercentageInputHandler);
        }
        if (eventsList._foodPercentageChangeHandler) {
            eventsList.removeEventListener('change', eventsList._foodPercentageChangeHandler);
        }
        
        // Handler for 'input' event - only updates visual display during sliding
        eventsList._foodPercentageInputHandler = (e) => {
            if (!e.target.classList.contains('food-percentage-slider')) {
                return;
            }

            const slider = e.target;
            const rawValue = parseFloat(slider.value);
            const newPercentage = Math.max(0, Math.min(100, Math.round(rawValue)));
            
            // Update the display value immediately (visual feedback only)
            const container = slider.closest('.food-percentage-container');
            if (!container) return;
            
            const valueSpan = container.querySelector('.food-percentage-value');
            const fillBar = container.querySelector('.food-percentage-fill');
            
            if (valueSpan) valueSpan.textContent = `${newPercentage}%`;
            if (fillBar) fillBar.style.width = `${newPercentage}%`;
        };
        
        // Handler for 'change' event - updates tracked value and saves to server (on release)
        eventsList._foodPercentageChangeHandler = async (e) => {
            // Only handle events from food percentage sliders
            if (!e.target.classList.contains('food-percentage-slider')) {
                return;
            }

            const slider = e.target;
            const eventId = slider.dataset.eventId;
            
            if (!eventId) {
                console.error('No event ID found on slider');
                return;
            }

            // Get the event data to find the last saved value
            const event = state.filteredEvents.find(e => 
                String(e.id) === String(eventId) || 
                e.id === parseInt(eventId)
            );
            
            // Initialize last non-zero value from event data (the saved value from server)
            // This is the value BEFORE the user started sliding
            if (slider._lastNonZeroValue === undefined) {
                const savedPercentage = event?.food_percentage;
                if (savedPercentage !== undefined && savedPercentage !== null && savedPercentage > 0) {
                    slider._lastNonZeroValue = savedPercentage;
                } else {
                    // Fallback to data attribute or default
                    const dataLastNonZero = slider.dataset.lastNonZero;
                    slider._lastNonZeroValue = dataLastNonZero ? parseInt(dataLastNonZero) : 100;
                }
            }

            // Read slider value - ensure it's a valid number between 0 and 100
            let rawValue = parseFloat(slider.value);
            
            // Ensure we have a valid number
            if (isNaN(rawValue)) {
                // Fallback: try to get from the min/max attributes
                const min = parseFloat(slider.getAttribute('min')) || 0;
                const max = parseFloat(slider.getAttribute('max')) || 100;
                rawValue = (min + max) / 2; // Default to middle if value is invalid
            }
            
            // Clamp to 0-100 range
            const newPercentage = Math.max(0, Math.min(100, Math.round(rawValue)));
            
            // Ensure slider value is set correctly (in case of any browser quirks)
            if (Math.abs(parseFloat(slider.value) - newPercentage) > 0.1) {
                slider.value = newPercentage;
            }
            
            // Update the display value (in case it wasn't updated during input)
            const container = slider.closest('.food-percentage-container');
            if (!container) return;
            
            const valueSpan = container.querySelector('.food-percentage-value');
            const fillBar = container.querySelector('.food-percentage-fill');
            
            if (valueSpan) valueSpan.textContent = `${newPercentage}%`;
            if (fillBar) fillBar.style.width = `${newPercentage}%`;
            
            // Add visual feedback (saving indicator)
            if (valueSpan) {
                valueSpan.style.opacity = '0.7';
            }
            
            // Check if percentage is 0% - if so, show delete confirmation modal
            if (newPercentage === 0) {
                const eventName = event?.event_name || 'this event';
                
                // Show custom delete confirmation modal
                showDeleteConfirmModal(eventName, () => {
                    // User confirmed deletion
                    deleteEvent(eventId, slider, container);
                }, () => {
                    // User cancelled - revert to last saved non-zero value
                    // Use the value from event data (saved on server) or the tracked value
                    const lastNonZero = slider._lastNonZeroValue || event?.food_percentage || 100;
                    if (valueSpan) valueSpan.textContent = `${lastNonZero}%`;
                    if (fillBar) fillBar.style.width = `${lastNonZero}%`;
                    slider.value = lastNonZero;
                    if (valueSpan) valueSpan.style.opacity = '1';
                });
                
                return; // Don't proceed with update
            }
            
            // Don't update _lastNonZeroValue here - we'll update it only after successful server save
            
            // Update on server after a short delay (debounce)
            if (slider._updateTimeout) {
                clearTimeout(slider._updateTimeout);
            }
            
            slider._updateTimeout = setTimeout(async () => {
                try {
                    // Parse event ID - handle both string and number formats
                    const parsedEventId = typeof eventId === 'string' ? eventId : String(eventId);
                    
                    console.log(`Updating food percentage for event ${parsedEventId} to ${newPercentage}%`);
                    
                    const url = `/api/events/${parsedEventId}`;
                    console.log(`Making PUT request to: ${url}`);
                    
                    const response = await fetch(url, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ food_percentage: newPercentage })
                    });

                    console.log(`Response status: ${response.status} ${response.statusText}`);
                    console.log(`Response ok: ${response.ok}`);

                    if (!response.ok) {
                        let errorData = {};
                        try {
                            const text = await response.text();
                            console.error('Error response text:', text);
                            errorData = JSON.parse(text);
                        } catch (e) {
                            console.error('Could not parse error response as JSON');
                        }
                        throw new Error(errorData.details || errorData.error || `Server returned ${response.status}: ${response.statusText}`);
                    }

                    const updatedEvent = await response.json();
                    console.log('Food percentage updated successfully:', updatedEvent);

                    // Update the event in state (both filteredEvents and events arrays)
                    const event = state.filteredEvents.find(e => 
                        String(e.id) === String(parsedEventId) || 
                        e.id === parseInt(parsedEventId)
                    );
                    if (event) {
                        event.food_percentage = newPercentage;
                    }
                    
                    // Also update in the main events array
                    const mainEvent = state.events.find(e => 
                        String(e.id) === String(parsedEventId) || 
                        e.id === parseInt(parsedEventId)
                    );
                    if (mainEvent) {
                        mainEvent.food_percentage = newPercentage;
                    }

                    // Update last non-zero value only after successful save (and only if > 0)
                    if (newPercentage > 0) {
                        slider._lastNonZeroValue = newPercentage;
                    }

                    // Remove saving indicator
                    if (valueSpan) {
                        valueSpan.style.opacity = '1';
                    }
                } catch (error) {
                    console.error('Error updating food percentage:', error);
                    console.error('Error details:', {
                        name: error.name,
                        message: error.message,
                        stack: error.stack,
                        eventId: parsedEventId,
                        newPercentage: newPercentage
                    });
                    
                    // Revert the display
                    const event = state.filteredEvents.find(e => 
                        String(e.id) === String(eventId) || 
                        e.id === parseInt(eventId)
                    );
                    
                    const originalPercentage = event?.food_percentage ?? 100;
                    
                    if (valueSpan) {
                        valueSpan.textContent = `${originalPercentage}%`;
                        valueSpan.style.opacity = '1';
                    }
                    if (fillBar) {
                        fillBar.style.width = `${originalPercentage}%`;
                    }
                    slider.value = originalPercentage;
                    
                    // Show error message to user with more details
                    const errorMsg = error.message || 'Network error';
                    console.error('Showing error to user:', errorMsg);
                    alert(`Failed to update food percentage: ${errorMsg}`);
                }
            }, 500); // Wait 500ms after user stops sliding
        };
        
        // Add both event listeners
        eventsList.addEventListener('input', eventsList._foodPercentageInputHandler, true);
        eventsList.addEventListener('change', eventsList._foodPercentageChangeHandler, true);
    }
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

// Calculate relative time (e.g., "10 minutes ago", "2 hours ago")
function getRelativeTime(timestamp) {
    if (!timestamp) return '';

    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) return '1 week ago';
    return `${diffWeeks} weeks ago`;
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

// Sort by time (using created_at timestamp)
function sortByTime(a, b, ascending = true) {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : Infinity;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : Infinity;

    // Events without timestamp go to end
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
        console.log('Map initialized - adding user location marker');
        updateUserLocationMarker();
    } else {
        console.log('Map initialized - waiting for user location');
    }

    // If events are already loaded, add markers now
    if (state.events.length > 0) {
        updateMapMarkers();
    }
}

// Update user location marker on the map
function updateUserLocationMarker() {
    if (!state.map || !state.userLocation) {
        console.log('Cannot update user location marker - map or location not available');
        return;
    }

    console.log('Updating user location marker at:', state.userLocation);

    // Remove existing user location marker if it exists
    if (state.userLocationMarker) {
        state.userLocationMarker.setMap(null);
    }

    // Create a blue dot marker for user location (like Google Maps "You are here")
    state.userLocationMarker = new google.maps.Marker({
        position: {
            lat: state.userLocation.lat,
            lng: state.userLocation.lng
        },
        map: state.map,
        title: 'Your Location',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#4285F4', // Google blue
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
        },
        zIndex: 2000, // Above event markers
        animation: google.maps.Animation.DROP
    });

    // Create info window
    const infoWindow = new google.maps.InfoWindow({
        content: '<div style="padding: 8px; font-weight: bold; font-family: Lato, sans-serif;">📍 You are here</div>'
    });

    // Show info window on click
    state.userLocationMarker.addListener('click', () => {
        infoWindow.open(state.map, state.userLocationMarker);
    });

    console.log('User location marker added to map');
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
                ${event.photo ? `<img src="${event.photo}" alt="Food Photo" style="width: 100%; max-width: 280px; height: 150px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">` : ''}
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
            // Close previous info window if one is open
            if (state.currentInfoWindow) {
                state.currentInfoWindow.close();
            }
            // Open new info window and store reference
            infoWindow.open(state.map, marker);
            state.currentInfoWindow = infoWindow;
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
    const foodPercentage = formData.get('foodPercentage') || '100';

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
            location: eventLocation || null,
            food_percentage: parseInt(foodPercentage) || 100
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

// Show location status message to user
function showLocationStatus(message, isError = false) {
    const statusEl = document.getElementById('locationStatus');
    if (!statusEl) return;

    if (!message) {
        statusEl.style.display = 'none';
        return;
    }

    statusEl.textContent = message;
    statusEl.className = 'location-status' + (isError ? ' error' : '');
    statusEl.style.display = 'block';

    // Auto-hide success messages after 5 seconds
    if (!isError) {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }
}

// Request user's geolocation
function getUserLocation() {
    // Show requesting message
    showLocationStatus('📍 Requesting your location for distance sorting...');

    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            state.locationError = 'Geolocation is not supported by your browser';
            showLocationStatus('⚠️ Geolocation is not supported by your browser. Distance sorting disabled.', true);
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
                // Hide the location status message
                showLocationStatus('');

                // Add marker to map if map is ready
                if (state.map) {
                    console.log('Map is ready - adding user location marker');
                    updateUserLocationMarker();
                } else {
                    console.log('Map not ready yet - marker will be added when map initializes');
                }

                resolve(state.userLocation);
            },
            (error) => {
                let errorMessage = '';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = '⚠️ Location permission denied. Please enable location access in your browser settings to use distance sorting.';
                        console.log('Location permission denied - distance sorting disabled');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = '⚠️ Location unavailable. Distance sorting is disabled.';
                        console.log('Location unavailable - distance sorting disabled');
                        break;
                    case error.TIMEOUT:
                        errorMessage = '⚠️ Location request timed out. Distance sorting is disabled.';
                        console.log('Location request timed out - distance sorting disabled');
                        break;
                    default:
                        errorMessage = '⚠️ Unable to get your location. Distance sorting is disabled.';
                        console.log('Location error - distance sorting disabled');
                }
                showLocationStatus(errorMessage, true);
                state.locationError = null;
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

