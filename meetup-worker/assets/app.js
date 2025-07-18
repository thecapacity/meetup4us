let map;
let geocoder;
let autocomplete;
let addressList = [];
let markers = [];

function initMap() {
    // Initialize map centered on US
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: { lat: 39.8283, lng: -98.5795 }, // Center of US
        mapId: 'DEMO_MAP_ID' // Required for Advanced Markers
    });

    // Initialize geocoder
    geocoder = new google.maps.Geocoder();

    // Initialize autocomplete with new Places API
    setupAutocomplete();

    // Set up event listeners
    setupEventListeners();
    
    // Load saved addresses after map is initialized
    loadSavedAddresses();
}

async function setupAutocomplete() {
    const addressInput = document.getElementById('address-input');
    
    try {
        // Use the new PlaceAutocompleteElement
        const { PlaceAutocompleteElement } = await google.maps.importLibrary("places");
        
        // Create the autocomplete element
        autocomplete = new PlaceAutocompleteElement({
            componentRestrictions: { country: 'us' },
            types: ['address']
        });

        // Replace the input with the autocomplete element
        const inputContainer = addressInput.parentNode;
        inputContainer.replaceChild(autocomplete, addressInput);
        
        // Style the autocomplete element to match our input
        autocomplete.style.width = '100%';
        autocomplete.style.padding = '0.5rem';
        autocomplete.style.marginTop = '0.5rem';
        autocomplete.style.boxSizing = 'border-box';
        autocomplete.style.border = '1px solid #ccc';
        autocomplete.style.borderRadius = '4px';
        autocomplete.placeholder = '123 Main St';

        // Listen for place selection using Google's recommended event
        autocomplete.addEventListener('gmp-select', async (event) => {
            const { placePrediction } = event;
            
            if (!placePrediction) {
                console.log("No place prediction available");
                return;
            }

            // Convert prediction to place and fetch details
            const place = placePrediction.toPlace();
            await place.fetchFields({ 
                fields: ['displayName', 'formattedAddress', 'location'] 
            });

            // Convert to the expected format for our existing function
            const placeData = {
                name: place.displayName,
                formatted_address: place.formattedAddress,
                geometry: {
                    location: place.location
                }
            };

            handleSelectedPlace(placeData);
        });
        
        // Add Enter key support for manual entry fallback
        autocomplete.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Small delay to allow autocomplete to process first
                setTimeout(() => {
                    const currentValue = autocomplete.value?.trim();
                    if (currentValue) {
                        searchAndAddAddress();
                    }
                }, 100);
            }
        });
    } catch (error) {
        console.log('Places API not available, falling back to manual entry only:', error);
        // Graceful fallback - manual entry still works
    }
}

function handleSelectedPlace(place) {
    const position = place.geometry.location;
    const name = place.name || place.formatted_address;
    
    if (isPlanning) {
        // In planning mode - add POI marker
        // Check if this is actually a business/POI vs just an address
        if (place.name && place.name !== place.formatted_address) {
            // This looks like a real business with a name
            addPOIMarker(place, position);
        } else {
            // This looks like just an address, try to search for POIs nearby
            alert('Please select a specific business or venue, not just an address.');
        }
    } else {
        // In address mode - add to address list
        const address = place.formatted_address || name;
        addToList(address, position.lat(), position.lng(), name);
    }
    
    // Clear input
    clearAddressInput();
}

function addPOIMarker(place, position) {
    // Create POI marker with different styling
    const poiIcon = document.createElement('div');
    poiIcon.style.width = '16px';
    poiIcon.style.height = '16px';
    poiIcon.style.borderRadius = '50%';
    poiIcon.style.backgroundColor = '#ea4335';
    poiIcon.style.border = '2px solid white';
    poiIcon.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    
    const marker = new google.maps.marker.AdvancedMarkerElement({
        position: position,
        map: map,
        content: poiIcon,
        title: place.name || 'Venue'
    });
    
    // Generate unique ID first
    const markerId = Date.now() + Math.random(); // Make it more unique
    marker.id = markerId;
    
    // Add info window with venue details
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div>
                <strong>🏪 ${place.name || 'Venue'}</strong><br>
                <small>${place.formatted_address || 'Address not available'}</small><br>
                ${place.rating ? `⭐ ${place.rating}/5` : ''}<br>
                <button onclick="removePOIMarker('${markerId}')" style="margin-top: 0.5rem; padding: 0.3rem 0.5rem; background: #ea4335; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    Remove
                </button>
            </div>
        `
    });
    
    marker.addListener('click', () => {
        infoWindow.open(map, marker);
    });
    
    // Store POI marker
    poiMarkers.push(marker);
    
    // Show info window immediately for new POIs
    setTimeout(() => {
        infoWindow.open(map, marker);
    }, 100);
}

function removePOIMarker(markerId) {
    console.log('Removing POI marker with ID:', markerId);
    console.log('Current POI markers:', poiMarkers.map(m => m.id));
    
    const markerIndex = poiMarkers.findIndex(marker => marker.id == markerId);
    if (markerIndex !== -1) {
        console.log('Found marker at index:', markerIndex);
        poiMarkers[markerIndex].map = null; // Remove from map
        poiMarkers.splice(markerIndex, 1);   // Remove from array
        console.log('POI marker removed successfully');
    } else {
        console.log('POI marker not found');
    }
}

function setupEventListeners() {
    const planBtn = document.getElementById('plan-btn');

    // Plan button functionality 
    planBtn.addEventListener('click', planMeetup);
}

function getAddressInputValue() {
    // Get the current input value from the PlaceAutocompleteElement
    if (autocomplete) {
        // From the debug output, we can see the input element is stored in the 'Dg' property
        if (autocomplete.Dg && autocomplete.Dg.value !== undefined) {
            return autocomplete.Dg.value;
        }
        
        // Also try accessing the closed shadow root if available
        if (autocomplete.Ki) {
            const shadowInput = autocomplete.Ki.querySelector && autocomplete.Ki.querySelector('input');
            if (shadowInput && shadowInput.value !== undefined) {
                return shadowInput.value;
            }
        }
        
        // Try other internal properties that might contain the input
        const possibleInputProps = ['Dg', 'mh', 'inputElement'];
        for (const prop of possibleInputProps) {
            if (autocomplete[prop] && autocomplete[prop].value !== undefined) {
                return autocomplete[prop].value;
            }
            // If it's a container, look for input inside it
            if (autocomplete[prop] && autocomplete[prop].querySelector) {
                const input = autocomplete[prop].querySelector('input');
                if (input && input.value !== undefined) {
                    return input.value;
                }
            }
        }
    }
    
    // Fallback to original input if autocomplete failed to load
    const addressInput = document.getElementById('address-input');
    if (addressInput) {
        return addressInput.value;
    }
    
    return '';
}

function clearAddressInput() {
    // Clear the input value from the PlaceAutocompleteElement
    if (autocomplete && autocomplete.value !== undefined) {
        autocomplete.value = '';
        return;
    }
    
    // Fallback to original input if autocomplete failed to load
    const addressInput = document.getElementById('address-input');
    if (addressInput) {
        addressInput.value = '';
    }
}

function searchAndAddAddress() {
    const searchTerm = autocomplete?.value?.trim() || '';

    if (!searchTerm) {
        const message = isPlanning ? 'Please enter a venue name or type' : 'Please enter an address';
        alert(message);
        return;
    }

    if (isPlanning) {
        // Search for POIs near the center point
        searchPOIsNearCenter(searchTerm);
    } else {
        // Use Google Geocoding API to find the location
        geocoder.geocode({ address: searchTerm }, (results, status) => {
            if (status === 'OK') {
                const location = results[0];
                const position = location.geometry.location;

                // Automatically add to planning list when manually geocoded
                addToList(location.formatted_address, position.lat(), position.lng());

                // Clear input
                clearAddressInput();
            } else {
                alert('Geocode was not successful: ' + status);
            }
        });
    }
}

async function searchPOIsNearCenter(query) {
    if (!centerMarker) {
        alert('No meetup center found. Please plan meetup first.');
        return;
    }

    try {
        // Use Places API to search for POIs near the center
        const { PlacesService } = await google.maps.importLibrary("places");
        const service = new PlacesService(map);
        
        // Map common queries to specific place types for better results
        const placeTypeMap = {
            'restaurants': 'restaurant',
            'cafes': 'cafe',
            'bars': 'bar',
            'parks': 'park',
            'museums': 'museum',
            'shopping': 'shopping_mall',
            'entertainment': 'movie_theater',
            'gyms': 'gym'
        };
        
        // Determine search type and parameters
        const specificType = placeTypeMap[query.toLowerCase()];
        let searchRequest;
        
        if (specificType) {
            // Use nearbySearch for specific place types
            searchRequest = {
                location: centerMarker.position,
                radius: searchRadius,
                type: specificType
            };
            
            service.nearbySearch(searchRequest, (results, status) => {
                handlePOISearchResults(results, status, query);
            });
        } else {
            // Use textSearch for general queries
            searchRequest = {
                location: centerMarker.position,
                radius: searchRadius,
                query: query,
                type: 'establishment'
            };
            
            service.textSearch(searchRequest, (results, status) => {
                handlePOISearchResults(results, status, query);
            });
        }
    } catch (error) {
        console.error('Error searching for POIs:', error);
        alert('Unable to search for venues at this time.');
    }
}

function handlePOISearchResults(results, status, query) {
    if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
        // Add multiple results if available (up to 3)
        const resultsToShow = results.slice(0, 3);
        
        resultsToShow.forEach((place, index) => {
            // Add slight delay to stagger marker appearance
            setTimeout(() => {
                addPOIMarker(place, place.geometry.location);
            }, index * 200);
        });
        
        // Clear input
        clearAddressInput();
        
        // Show success message
        const searchModeIndicator = document.getElementById('search-mode-indicator');
        const originalText = searchModeIndicator.textContent;
        searchModeIndicator.textContent = `✅ Found ${resultsToShow.length} ${query}`;
        
        // Reset after 2 seconds
        setTimeout(() => {
            searchModeIndicator.textContent = originalText;
        }, 2000);
        
    } else {
        alert(`No ${query} found near your meetup center.`);
    }
}

function addToList(formattedAddress, lat, lng, placeName = null) {
    // Check if address is already in list
    if (addressList.some(addr => addr.formatted_address === formattedAddress)) {
        alert('Address already in list!');
        return;
    }

    // Add to address list
    const addressData = {
        formatted_address: formattedAddress,
        lat: lat,
        lng: lng,
        id: Date.now() // Simple ID generation
    };

    addressList.push(addressData);
    updateAddressListDisplay();
    
    // Create marker for the address
    const position = { lat: lat, lng: lng };
    const marker = new google.maps.marker.AdvancedMarkerElement({
        position: position,
        map: map,
        title: formattedAddress,
    });

    // Add info window with place name and address
    const infoWindow = new google.maps.InfoWindow({
        content: `<div><strong>${placeName || formattedAddress}</strong><br><small>${placeName ? formattedAddress : ''}</small></div>`
    });

    marker.addListener('click', () => {
        infoWindow.open(map, marker);
    });

    // Store marker reference
    markers.push(marker);

    // Adjust map bounds to show all markers
    if (markers.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(marker => {
            bounds.extend(marker.position);
        });
        map.fitBounds(bounds);
    } else {
        map.setCenter(position);
        map.setZoom(15);
    }
    
    // Save to localStorage for persistence
    localStorage.setItem('meetupAddresses', JSON.stringify(addressList));
}

function updateAddressListDisplay() {
    const listElement = document.getElementById('address-list');
    
    if (!listElement) {
        console.error('Could not find address-list element!');
        return;
    }
    
    listElement.innerHTML = '';

    if (addressList.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-list';
        emptyMessage.textContent = 'No addresses added yet';
        listElement.appendChild(emptyMessage);
        return;
    }

    addressList.forEach(addr => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="address-item">
                <div class="address-text" onclick="focusOnAddress(${addr.lat}, ${addr.lng})">
                    📍 ${addr.formatted_address}
                </div>
                <button class="remove-btn" onclick="removeFromList(${addr.id})" title="Remove address">
                    ✕
                </button>
            </div>
        `;
        listElement.appendChild(li);
    });
}

function focusOnAddress(lat, lng) {
    map.setCenter({ lat: lat, lng: lng });
    map.setZoom(15);
}

function removeFromList(id) {
    // Find the address before removing it
    const addressToRemove = addressList.find(addr => addr.id === id);
    if (!addressToRemove) return;
    
    // Remove from address list
    addressList = addressList.filter(addr => addr.id !== id);
    
    // Remove corresponding marker from map
    const markerIndex = markers.findIndex(marker => {
        const markerLat = marker.position.lat();
        const markerLng = marker.position.lng();
        return Math.abs(markerLat - addressToRemove.lat) < 0.0001 && 
               Math.abs(markerLng - addressToRemove.lng) < 0.0001;
    });
    
    if (markerIndex !== -1) {
        markers[markerIndex].map = null; // Remove marker from map
        markers.splice(markerIndex, 1); // Remove from markers array
    }
    
    updateAddressListDisplay();
    localStorage.setItem('meetupAddresses', JSON.stringify(addressList));
}

let centerMarker = null;
let searchRadius = null;
let isPlanning = false;

function planMeetup() {
    if (addressList.length === 0) {
        alert('Please add some addresses first!');
        return;
    }

    if (addressList.length === 1) {
        alert('Please add at least 2 addresses to find a meetup center!');
        return;
    }

    // Calculate center point of all addresses
    const center = calculateCenter(addressList);
    
    // Calculate distances to determine search radius
    const distances = calculateDistances(center, addressList);
    const maxDistance = Math.max(...distances);
    const minDistance = Math.min(...distances);
    searchRadius = Math.max(maxDistance * 0.8, 1000); // Use 80% of max distance, minimum 1km
    
    // Place blue center marker
    placeCenterMarker(center);
    
    // Draw search radius circle
    drawSearchRadius(center, searchRadius);
    
    // Change UI to POI search mode
    switchToPOISearchMode();
    
    // Center map on the meetup center
    map.setCenter(center);
    map.setZoom(12);
    
    isPlanning = true;
}

function calculateCenter(addresses) {
    // Calculate the geometric center (centroid) of all addresses
    const totalLat = addresses.reduce((sum, addr) => sum + addr.lat, 0);
    const totalLng = addresses.reduce((sum, addr) => sum + addr.lng, 0);
    
    return {
        lat: totalLat / addresses.length,
        lng: totalLng / addresses.length
    };
}

function calculateDistances(center, addresses) {
    // Calculate distance from center to each address using Haversine formula
    return addresses.map(addr => {
        return haversineDistance(center.lat, center.lng, addr.lat, addr.lng);
    });
}

function haversineDistance(lat1, lng1, lat2, lng2) {
    // Calculate distance between two points in meters
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function placeCenterMarker(center) {
    // Remove existing center marker if any
    if (centerMarker) {
        centerMarker.map = null;
    }
    
    // Create blue center marker
    const blueIcon = document.createElement('div');
    blueIcon.style.width = '20px';
    blueIcon.style.height = '20px';
    blueIcon.style.borderRadius = '50%';
    blueIcon.style.backgroundColor = '#4285f4';
    blueIcon.style.border = '3px solid white';
    blueIcon.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    
    centerMarker = new google.maps.marker.AdvancedMarkerElement({
        position: center,
        map: map,
        content: blueIcon,
        title: 'Meetup Center'
    });
    
    // Add info window
    const infoWindow = new google.maps.InfoWindow({
        content: `<div><strong>📍 Meetup Center</strong><br><small>Optimal location for your group</small></div>`
    });
    
    centerMarker.addListener('click', () => {
        infoWindow.open(map, centerMarker);
    });
}

let searchCircle = null;

function drawSearchRadius(center, radius) {
    // Remove existing circle if any
    if (searchCircle) {
        searchCircle.setMap(null);
    }
    
    // Draw circle showing search radius
    searchCircle = new google.maps.Circle({
        center: center,
        radius: radius,
        strokeColor: '#4285f4',
        strokeOpacity: 0.3,
        strokeWeight: 2,
        fillColor: '#4285f4',
        fillOpacity: 0.1,
        map: map
    });
}

let poiMarkers = [];

function switchToPOISearchMode() {
    // Update UI to indicate planning mode
    const heading = document.querySelector('#sidebar h2');
    heading.textContent = '🎯 Find Venues';
    heading.style.color = '#4285f4';
    
    // Update search mode indicator
    const searchModeIndicator = document.getElementById('search-mode-indicator');
    searchModeIndicator.textContent = '🎯 POI Search Mode';
    searchModeIndicator.classList.add('poi-mode');
    
    // POI categories removed - using search bar only
    
    // Update input placeholder
    if (autocomplete && autocomplete.placeholder !== undefined) {
        autocomplete.placeholder = 'Search for restaurants, cafes, bars...';
    }
    
    // Update plan button
    const planBtn = document.getElementById('plan-btn');
    planBtn.textContent = 'Reset Planning';
    planBtn.style.backgroundColor = '#ea4335';
    planBtn.onclick = resetPlanning;
    
    // Update autocomplete to search for places instead of addresses
    updateAutocompleteForPOI();
}

function resetPlanning() {
    // Reset to address mode
    const heading = document.querySelector('#sidebar h2');
    heading.textContent = 'Enter Addresses';
    heading.style.color = '#333';
    
    // Reset search mode indicator
    const searchModeIndicator = document.getElementById('search-mode-indicator');
    searchModeIndicator.textContent = '🏠 Address Search Mode';
    searchModeIndicator.classList.remove('poi-mode');
    
    // POI categories removed - using search bar only
    
    // Reset input placeholder
    if (autocomplete && autocomplete.placeholder !== undefined) {
        autocomplete.placeholder = '123 Main St';
    }
    
    // Reset plan button
    const planBtn = document.getElementById('plan-btn');
    planBtn.textContent = 'Plan Meetup';
    planBtn.style.backgroundColor = '#34a853';
    planBtn.onclick = planMeetup;
    
    // Remove center marker and circle
    if (centerMarker) {
        centerMarker.map = null;
        centerMarker = null;
    }
    
    if (searchCircle) {
        searchCircle.setMap(null);
        searchCircle = null;
    }
    
    // Remove POI markers
    poiMarkers.forEach(marker => {
        marker.map = null;
    });
    poiMarkers = [];
    
    // Reset autocomplete to address mode
    updateAutocompleteForAddresses();
    
    isPlanning = false;
}

async function updateAutocompleteForPOI() {
    if (!autocomplete) {
        console.log("No autocomplete element found");
        return;
    }
    
    try {
        console.log("Switching to POI mode - recreating autocomplete element");
        
        // Store the parent container
        const inputContainer = autocomplete.parentNode;
        if (!inputContainer) {
            console.log("No parent container found");
            return;
        }
        
        // Remove existing autocomplete
        inputContainer.removeChild(autocomplete);
        
        // Create new autocomplete optimized for POI search
        const { PlaceAutocompleteElement } = await google.maps.importLibrary("places");
        
        autocomplete = new PlaceAutocompleteElement({
            componentRestrictions: { country: 'us' },
            types: ['establishment']
        });
        
        // Style the autocomplete element
        autocomplete.style.width = '100%';
        autocomplete.style.padding = '0.5rem';
        autocomplete.style.marginTop = '0.5rem';
        autocomplete.style.boxSizing = 'border-box';
        autocomplete.style.border = '1px solid #4285f4';
        autocomplete.style.borderRadius = '4px';
        autocomplete.placeholder = 'Search for restaurants, cafes, bars...';
        
        // Add it back to the container
        inputContainer.appendChild(autocomplete);
        
        // Listen for place selection using Google's recommended event
        autocomplete.addEventListener('gmp-select', async (event) => {
            const { placePrediction } = event;
            
            if (!placePrediction) {
                console.log("No place prediction available");
                return;
            }

            // Convert prediction to place and fetch details
            const place = placePrediction.toPlace();
            await place.fetchFields({ 
                fields: ['displayName', 'formattedAddress', 'location'] 
            });

            // Convert to the expected format for our existing function
            const placeData = {
                name: place.displayName,
                formatted_address: place.formattedAddress,
                geometry: {
                    location: place.location
                }
            };

            handleSelectedPlace(placeData);
        });
        
        // Add Enter key support with POI search
        autocomplete.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                setTimeout(() => {
                    const currentValue = autocomplete.value?.trim();
                    if (currentValue) {
                        searchPOIsNearCenter(currentValue);
                    }
                }, 100);
            }
        });
        
        console.log("POI mode activated successfully");
        
    } catch (error) {
        console.error('Error updating autocomplete for POI:', error);
    }
}

async function updateAutocompleteForAddresses() {
    if (!autocomplete) return;
    
    try {
        console.log("Switching to address mode - recreating autocomplete element");
        
        // Store the parent container
        const inputContainer = autocomplete.parentNode;
        if (!inputContainer) {
            console.log("No parent container found");
            return;
        }
        
        // Remove existing autocomplete
        inputContainer.removeChild(autocomplete);
        
        // Create new autocomplete optimized for address search
        const { PlaceAutocompleteElement } = await google.maps.importLibrary("places");
        
        autocomplete = new PlaceAutocompleteElement({
            componentRestrictions: { country: 'us' },
            types: ['address']
        });
        
        // Style the autocomplete element
        autocomplete.style.width = '100%';
        autocomplete.style.padding = '0.5rem';
        autocomplete.style.marginTop = '0.5rem';
        autocomplete.style.boxSizing = 'border-box';
        autocomplete.style.border = '1px solid #ccc';
        autocomplete.style.borderRadius = '4px';
        autocomplete.placeholder = '123 Main St';
        
        // Add it back to the container
        inputContainer.appendChild(autocomplete);
        
        // Listen for place selection using Google's recommended event
        autocomplete.addEventListener('gmp-select', async (event) => {
            const { placePrediction } = event;
            
            if (!placePrediction) {
                console.log("No place prediction available");
                return;
            }

            // Convert prediction to place and fetch details
            const place = placePrediction.toPlace();
            await place.fetchFields({ 
                fields: ['displayName', 'formattedAddress', 'location'] 
            });

            // Convert to the expected format for our existing function
            const placeData = {
                name: place.displayName,
                formatted_address: place.formattedAddress,
                geometry: {
                    location: place.location
                }
            };

            handleSelectedPlace(placeData);
        });
        
        // Add Enter key support for address search
        autocomplete.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                setTimeout(() => {
                    const currentValue = autocomplete.value?.trim();
                    if (currentValue) {
                        searchAndAddAddress();
                    }
                }, 100);
            }
        });
        
        console.log("Address mode activated successfully");
        
    } catch (error) {
        console.error('Error updating autocomplete for addresses:', error);
    }
}

function loadSavedAddresses() {
    const saved = localStorage.getItem('meetupAddresses');
    if (saved) {
        addressList = JSON.parse(saved);
        updateAddressListDisplay();
        
        // Add markers for saved addresses
        addressList.forEach(addr => {
            const marker = new google.maps.marker.AdvancedMarkerElement({
                position: { lat: addr.lat, lng: addr.lng },
                map: map,
                title: addr.formatted_address,
            });

            const infoWindow = new google.maps.InfoWindow({
                content: `<strong>${addr.formatted_address}</strong><br><small>Saved Address</small>`
            });

            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });

            markers.push(marker);
        });

        // Fit map to show all saved addresses
        if (addressList.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            addressList.forEach(addr => {
                bounds.extend({ lat: addr.lat, lng: addr.lng });
            });
            map.fitBounds(bounds);
        }
    }
}


// Make functions available globally for Google Maps callback and onclick handlers
window.initMap = initMap;
window.removePOIMarker = removePOIMarker;