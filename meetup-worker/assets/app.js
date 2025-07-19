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
    
    // Load addresses from URL parameters
    applyURLParameters();
    
    // Load saved addresses from localStorage
    // loadSavedAddresses();
}

async function setupAutocomplete() {
    const addressInput = document.getElementById('address-input');
    
    try {
        // Use the new PlaceAutocompleteElement
        const { PlaceAutocompleteElement } = await google.maps.importLibrary("places");
        
        // Create the autocomplete element
        autocomplete = new PlaceAutocompleteElement({
            componentRestrictions: { country: 'us' },
            types: ['establishment', 'address'] // Allow both businesses and addresses
        });

        // Replace the input with the autocomplete element  
        // The input is now nested inside a label, so we need to replace just the input
        const inputContainer = addressInput.parentNode; // this is the label
        inputContainer.replaceChild(autocomplete, addressInput);
        
        // Style the autocomplete element to match our input
        autocomplete.style.width = '100%';
        autocomplete.style.padding = '0.5rem';
        autocomplete.style.marginTop = '0.25rem';
        autocomplete.style.boxSizing = 'border-box';
        autocomplete.style.border = '1px solid #ccc';
        autocomplete.style.borderRadius = '4px';
        autocomplete.placeholder = 'Enter address or search for places...';
        
        // Preserve accessibility attributes
        autocomplete.id = 'address-input';
        autocomplete.setAttribute('name', 'address-input');
        autocomplete.setAttribute('autocomplete', 'street-address');

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
        // Use both keydown and keypress to catch Enter reliably
        const handleEnterKey = (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                e.stopPropagation();
                // Small delay to allow autocomplete to process first
                setTimeout(() => {
                    const currentValue = getAddressInputValue();
                    if (currentValue && currentValue.trim()) {
                        searchAndAddAddress();
                    }
                }, 150);
            }
        };
        
        autocomplete.addEventListener('keydown', handleEnterKey);
        autocomplete.addEventListener('keypress', handleEnterKey);
    } catch (error) {
        console.log('Places API not available, falling back to manual entry only:', error);
        // Graceful fallback - manual entry still works
    }
}

function handleSelectedPlace(place) {
    const position = place.geometry.location;
    const name = place.name || place.formatted_address;
    
    // Determine if this is a business/POI vs just an address
    if (place.name && place.name !== place.formatted_address) {
        // This looks like a real business with a name - add as POI
        const address = place.formatted_address || place.name;
        addToList(address, position.lat(), position.lng(), place.name, 'poi');
    } else {
        // This looks like just an address - add as address
        const address = place.formatted_address || name;
        addToList(address, position.lat(), position.lng(), name, 'address');
    }
    
    // Clear input
    clearAddressInput();
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
    if (autocomplete) {
        // Try the direct value property first
        try {
            autocomplete.value = '';
        } catch (e) {
            console.log('Direct value clear failed, trying alternative methods');
        }
        
        // Also try to find and clear the internal input elements
        try {
            // Try accessing internal properties that might contain the input
            if (autocomplete.Dg && autocomplete.Dg.value !== undefined) {
                autocomplete.Dg.value = '';
            }
            
            // Try shadow root access
            const shadowInput = autocomplete.shadowRoot?.querySelector('input');
            if (shadowInput) {
                shadowInput.value = '';
            }
            
            // Try other possible internal properties
            const possibleInputProps = ['mh', 'inputElement'];
            for (const prop of possibleInputProps) {
                if (autocomplete[prop] && autocomplete[prop].value !== undefined) {
                    autocomplete[prop].value = '';
                }
                // If it's a container, look for input inside it
                if (autocomplete[prop] && autocomplete[prop].querySelector) {
                    const input = autocomplete[prop].querySelector('input');
                    if (input && input.value !== undefined) {
                        input.value = '';
                    }
                }
            }
        } catch (e) {
            console.log('Alternative clear methods failed:', e);
        }
        
        // Force a focus/blur cycle to help reset the element
        try {
            autocomplete.focus();
            setTimeout(() => autocomplete.blur(), 50);
        } catch (e) {
            // Focus/blur might not work
        }
    }
    
    // Fallback to original input if autocomplete failed to load
    const addressInput = document.getElementById('address-input');
    if (addressInput) {
        addressInput.value = '';
    }
}

function searchAndAddAddress() {
    const searchTerm = getAddressInputValue().trim();

    if (!searchTerm) {
        alert('Please enter an address or place name');
        return;
    }

    console.log('Searching for:', searchTerm);

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

async function searchPOIsNearCenter(query) {
    if (!centerMarker) {
        // Try to generate the center marker if possible
        if (addressList.length > 1) {
            updateCenterOfInterest();
        }
        if (!centerMarker) {
            alert('No meetup center found. Please plan meetup first.');
            return;
        }
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
                const position = place.geometry.location;
                const address = place.formatted_address || place.name;
                addToList(address, position.lat(), position.lng(), place.name, 'poi');
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

function addToList(formattedAddress, lat, lng, placeName = null, type = 'address') {
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
        id: Date.now() + Math.random(), // Simple ID generation
        placeName: placeName,
        type: type
    };

    addressList.push(addressData);
    updateAddressListDisplay();
    
    // Create marker for the address/POI
    const position = { lat: lat, lng: lng };
    
    // Create different marker styling for POIs
    let markerContent = null;
    if (type === 'poi') {
        const poiIcon = document.createElement('div');
        poiIcon.style.width = '16px';
        poiIcon.style.height = '16px';
        poiIcon.style.borderRadius = '50%';
        poiIcon.style.backgroundColor = '#ea4335';
        poiIcon.style.border = '2px solid white';
        poiIcon.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        markerContent = poiIcon;
    }
    
    const marker = new google.maps.marker.AdvancedMarkerElement({
        position: position,
        map: map,
        title: formattedAddress,
        content: markerContent // null for default blue marker (addresses)
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
    
    // Update center of interest marker
    updateCenterOfInterest();
    
    // Save to URL for sharing
    updateURLParameters();
    
    // Save to localStorage for persistence
    // localStorage.setItem('meetupAddresses', JSON.stringify(addressList));
}

function updateAddressListDisplay() {
    const listElement = document.getElementById('address-list');
    
    if (!listElement) {
        console.error('Could not find address-list element!');
        return;
    }
    
    listElement.innerHTML = ''; // NOTE: Why is this here? Won't it nuke the list if something's already there?

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
        const markerLat = typeof marker.position.lat === 'function' ? marker.position.lat() : marker.position.lat;
        const markerLng = typeof marker.position.lng === 'function' ? marker.position.lng() : marker.position.lng;
        return Math.abs(markerLat - addressToRemove.lat) < 0.0001 && 
               Math.abs(markerLng - addressToRemove.lng) < 0.0001;
    });
    
    if (markerIndex !== -1) {
        markers[markerIndex].map = null; // Remove marker from map
        markers.splice(markerIndex, 1); // Remove from markers array
    }
    
    updateAddressListDisplay();
    updateCenterOfInterest();
    updateURLParameters();
    
    // Update localStorage
    // localStorage.setItem('meetupAddresses', JSON.stringify(addressList));
}

let centerMarker = null;
let searchRadius = null;

function updateCenterOfInterest() {
    if (addressList.length === 0) {
        // Remove center marker and circle if no addresses
        if (centerMarker) {
            centerMarker.map = null;
            centerMarker = null;
        }
        if (searchCircle) {
            searchCircle.setMap(null);
            searchCircle = null;
        }
        return;
    }

    if (addressList.length === 1) {
        // For single address, place center marker at that location but no search radius
        const center = { lat: addressList[0].lat, lng: addressList[0].lng };
        placeCenterMarker(center);
        
        // Remove search circle
        if (searchCircle) {
            searchCircle.setMap(null);
            searchCircle = null;
        }
        return;
    }

    // Calculate center point of all addresses
    const center = calculateCenter(addressList);
    
    // Calculate distances to determine search radius
    const distances = calculateDistances(center, addressList);
    const maxDistance = Math.max(...distances);
    searchRadius = Math.max(maxDistance * 0.8, 1000); // Use 80% of max distance, minimum 1km
    
    // Place blue center marker
    placeCenterMarker(center);
    
    // Draw search radius circle
    drawSearchRadius(center, searchRadius);
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

// URL parameter functions for sharing
function updateURLParameters() {
    const url = new URL(window.location.href);
    
    // Clear existing parameters
    url.searchParams.delete('addy');
    url.searchParams.delete('poi');
    
    // Add addresses and POIs to URL separately for better clarity
    addressList.forEach(addr => {
        if (addr.type === 'poi') {
            // Store POI with more specific location info to avoid ambiguity
            const poiData = `${addr.placeName || addr.formatted_address}|${addr.lat},${addr.lng}`;
            url.searchParams.append('poi', poiData);
        } else {
            // Store addresses normally
            url.searchParams.append('addy', addr.formatted_address);
        }
    });
    
    // Update URL without page reload
    window.history.replaceState({}, '', url);
}

function applyURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Load addresses from URL
    const addresses = urlParams.getAll('addy');
    const pois = urlParams.getAll('poi');
    
    // Count total items to process for center calculation timing
    const totalItems = addresses.length + pois.length;
    let processedItems = 0;
    
    const checkAndUpdateCenter = () => {
        processedItems++;
        if (processedItems >= totalItems && addressList.length > 0) {
            // All items processed, update center of interest
            setTimeout(() => {
                updateCenterOfInterest();
            }, 500); // Small delay to ensure all markers are placed
        }
    };
    
    // Process addresses
    addresses.forEach(address => {
        geocodeAndAddAddress(address, checkAndUpdateCenter);
    });
    
    // Process POIs with coordinates
    pois.forEach(poi => {
        const [name, coords] = poi.split('|');
        if (coords) {
            const [lat, lng] = coords.split(',').map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
                // Add POI directly with stored coordinates
                addToListFromURL(name, lat, lng, name, 'poi');
                checkAndUpdateCenter();
            } else {
                // Fallback to geocoding if coordinates are invalid
                geocodeAndAddPOI(name, checkAndUpdateCenter);
            }
        } else {
            // Legacy POI format without coordinates
            geocodeAndAddPOI(name, checkAndUpdateCenter);
        }
    });
    
    // If no items to process, still check for saved addresses
    if (totalItems === 0) {
        setTimeout(() => {
            updateCenterOfInterest();
        }, 100);
    }
}

function geocodeAndAddAddress(address, callback) {
    if (!geocoder) {
        if (callback) callback();
        return;
    }
    
    geocoder.geocode({ address: address }, (results, status) => {
        if (status === 'OK') {
            const location = results[0];
            const position = location.geometry.location;
            
            // Add to list without updating URL (to avoid recursion)
            addToListFromURL(location.formatted_address, position.lat(), position.lng());
        } else {
            console.error('Geocoding failed for:', address, status);
        }
        
        if (callback) callback();
    });
}

function geocodeAndAddPOI(itemName, callback) {
    if (!geocoder) {
        if (callback) callback();
        return;
    }
    
    // Geocode the item name to get its location
    geocoder.geocode({ address: itemName }, (results, status) => {
        if (status === 'OK') {
            const location = results[0];
            const position = location.geometry.location;
            
            // Add as POI
            addToListFromURL(location.formatted_address, position.lat(), position.lng(), itemName, 'poi');
        } else {
            console.error('Geocoding failed for:', itemName, status);
        }
        
        if (callback) callback();
    });
}

function addToListFromURL(formattedAddress, lat, lng, placeName = null, type = 'address') {
    // Check if address is already in list
    if (addressList.some(addr => addr.formatted_address === formattedAddress)) {
        return; // Skip duplicates
    }

    // Add to address list
    const addressData = {
        formatted_address: formattedAddress,
        lat: lat,
        lng: lng,
        id: Date.now() + Math.random(),
        placeName: placeName,
        type: type
    };

    addressList.push(addressData);
    updateAddressListDisplay();
    
    // Create marker for the address/POI
    const position = { lat: lat, lng: lng };
    
    // Create different marker styling for POIs
    let markerContent = null;
    if (type === 'poi') {
        const poiIcon = document.createElement('div');
        poiIcon.style.width = '16px';
        poiIcon.style.height = '16px';
        poiIcon.style.borderRadius = '50%';
        poiIcon.style.backgroundColor = '#ea4335';
        poiIcon.style.border = '2px solid white';
        poiIcon.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        markerContent = poiIcon;
    }
    
    const marker = new google.maps.marker.AdvancedMarkerElement({
        position: position,
        map: map,
        title: formattedAddress,
        content: markerContent // null for default blue marker (addresses)
    });

    // Add info window
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
}

function loadSavedAddresses() {
    const saved = localStorage.getItem('meetupAddresses');
    if (saved) {
        try {
            const savedAddresses = JSON.parse(saved);
            // Only load if we don't already have addresses from URL
            if (addressList.length === 0) {
                savedAddresses.forEach(addr => {
                    addToListFromURL(addr.formatted_address, addr.lat, addr.lng, addr.placeName, addr.type || 'address');
                });
                
                // Fit map to show all saved addresses and calculate center
                if (addressList.length > 0) {
                    const bounds = new google.maps.LatLngBounds();
                    addressList.forEach(addr => {
                        bounds.extend({ lat: addr.lat, lng: addr.lng });
                    });
                    map.fitBounds(bounds);
                    
                    // Calculate center of interest
                    updateCenterOfInterest();
                }
            }
        } catch (e) {
            console.error('Error loading saved addresses:', e);
        }
    }
}

// Make functions available globally for Google Maps callback and onclick handlers
window.initMap = initMap;