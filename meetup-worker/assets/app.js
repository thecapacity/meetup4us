// Meetup4.us — free, key-less mapping stack:
//   Map:     MapLibre GL JS + OpenFreeMap vector tiles (https://openfreemap.org)
//   Search:  Photon geocoder (https://photon.komoot.io), OpenStreetMap data

const PHOTON_URL = 'https://photon.komoot.io/api/';
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const US_CENTER = [-98.5795, 39.8283]; // [lng, lat]

let map;
let addressList = [];      // { id, formatted_address, lat, lng, placeName, type, marker }
let centerMarker = null;
let searchRadius = null;   // meters
let nearMode = false;      // restrict search to the meetup circle
let suggestTimer = null;
let suggestAbort = null;
let suggestions = [];
let activeIndex = -1;

// ---------- Map setup ----------

function initMap() {
    map = new maplibregl.Map({
        container: 'map',
        style: MAP_STYLE,
        center: US_CENTER,
        zoom: 3,
        attributionControl: { compact: true }
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
        map.addSource('radius', { type: 'geojson', data: emptyGeoJSON() });
        map.addLayer({
            id: 'radius-fill', type: 'fill', source: 'radius',
            paint: { 'fill-color': '#4285f4', 'fill-opacity': 0.1 }
        });
        map.addLayer({
            id: 'radius-line', type: 'line', source: 'radius',
            paint: { 'line-color': '#4285f4', 'line-opacity': 0.4, 'line-width': 2 }
        });
        applyURLParameters();
    }); // end map load

    setupSearchInput();
    document.getElementById('near-toggle').addEventListener('click', toggleNearMode);
    document.getElementById('share-btn').addEventListener('click', shareLink);
    updateAddressListDisplay();
}

function emptyGeoJSON() {
    return { type: 'FeatureCollection', features: [] };
}

// ---------- Search (Photon) ----------

function setupSearchInput() {
    const input = document.getElementById('address-input');

    input.addEventListener('input', () => {
        clearTimeout(suggestTimer);
        const q = input.value.trim();
        if (q.length < 3) { hideSuggestions(); return; }
        suggestTimer = setTimeout(() => fetchSuggestions(q), 300); // debounce: be kind to Photon
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            if (!suggestions.length) return;
            e.preventDefault();
            const step = e.key === 'ArrowDown' ? 1 : -1;
            activeIndex = (activeIndex + step + suggestions.length) % suggestions.length;
            renderSuggestions();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && suggestions[activeIndex]) {
                selectSuggestion(suggestions[activeIndex]);
            } else {
                searchAndAddAddress();
            }
        } else if (e.key === 'Escape') {
            hideSuggestions();
        }
    });

    input.addEventListener('blur', () => setTimeout(hideSuggestions, 150));
}

function buildSearchURL(q, limit) {
    const params = new URLSearchParams({ q, limit: String(limit), lang: 'en' });
    const center = getCenter();

    if (nearMode && center && searchRadius) {
        // Hard-limit results to the box around the meetup circle
        const dLat = searchRadius / 111320;
        const dLng = searchRadius / (111320 * Math.cos(center.lat * Math.PI / 180));
        params.set('bbox', [center.lng - dLng, center.lat - dLat, center.lng + dLng, center.lat + dLat].join(','));
        params.set('lat', center.lat);
        params.set('lon', center.lng);
    } else if (center) {
        // Soft bias toward the group, without excluding far-away addresses
        params.set('lat', center.lat);
        params.set('lon', center.lng);
        params.set('location_bias_scale', '0.3');
    }
    return PHOTON_URL + '?' + params.toString();
}

async function photonSearch(q, limit = 6, signal) {
    const res = await fetch(buildSearchURL(q, limit), { signal });
    if (!res.ok) throw new Error('Search failed: ' + res.status);
    const data = await res.json();
    let results = (data.features || []).map(featureToPlace);

    // bbox is a square; trim corners so "near" really means inside the circle
    const center = getCenter();
    if (nearMode && center && searchRadius) {
        results = results.filter(r => haversineDistance(center.lat, center.lng, r.lat, r.lng) <= searchRadius);
    }
    return results;
}

function featureToPlace(f) {
    const p = f.properties || {};
    const [lng, lat] = f.geometry.coordinates;
    const street = [p.housenumber, p.street].filter(Boolean).join(' ');
    const parts = [street, p.city || p.town || p.village || p.district, p.state, p.postcode]
        .filter(Boolean);
    // Avoid repeating the name when it's just the street address
    const address = parts.join(', ') || p.country || '';
    const isPOI = !!p.name && p.osm_key !== 'place' && p.osm_key !== 'highway' && p.osm_key !== 'boundary';
    return {
        lat, lng,
        name: p.name || null,
        address: address || p.name || 'Unknown location',
        type: isPOI ? 'poi' : 'address',
        kind: p.osm_value ? p.osm_value.replace(/_/g, ' ') : ''
    };
}

async function fetchSuggestions(q) {
    if (suggestAbort) suggestAbort.abort();
    suggestAbort = new AbortController();
    try {
        suggestions = await photonSearch(q, 6, suggestAbort.signal);
        activeIndex = -1;
        renderSuggestions();
    } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
    }
}

function renderSuggestions() {
    const box = document.getElementById('suggestions');
    box.innerHTML = '';
    if (!suggestions.length) {
        const empty = document.createElement('div');
        empty.className = 'suggestion empty';
        empty.textContent = nearMode ? 'Nothing found inside the meetup circle' : 'No matches';
        box.appendChild(empty);
        box.hidden = false;
        return;
    }
    suggestions.forEach((s, i) => {
        const item = document.createElement('div');
        item.className = 'suggestion' + (i === activeIndex ? ' active' : '');
        item.setAttribute('role', 'option');

        const title = document.createElement('div');
        title.className = 'suggestion-title';
        title.textContent = (s.type === 'poi' ? '⭐ ' : '📍 ') + (s.name || s.address);
        item.appendChild(title);

        const sub = document.createElement('div');
        sub.className = 'suggestion-sub';
        sub.textContent = s.name ? [s.kind, s.address].filter(Boolean).join(' · ') : '';
        if (sub.textContent) item.appendChild(sub);

        // mousedown fires before input blur, so the click isn't lost
        item.addEventListener('mousedown', (e) => { e.preventDefault(); selectSuggestion(s); });
        box.appendChild(item);
    }); // end suggestions.forEach
    box.hidden = false;
}

function hideSuggestions() {
    const box = document.getElementById('suggestions');
    box.hidden = true;
    suggestions = [];
    activeIndex = -1;
}

function selectSuggestion(s) {
    const display = s.name && s.type === 'poi' ? `${s.name}, ${s.address}` : (s.name && !s.address.startsWith(s.name) ? `${s.name}, ${s.address}` : s.address);
    addToList(display, s.lat, s.lng, s.type === 'poi' ? s.name : null, s.type);
    clearAddressInput();
}

async function searchAndAddAddress() {
    const searchTerm = document.getElementById('address-input').value.trim();
    if (!searchTerm) return;
    try {
        const results = await photonSearch(searchTerm, 1);
        if (!results.length) {
            showToast(nearMode ? 'Nothing found inside the meetup circle' : 'No match for that address');
            return;
        }
        selectSuggestion(results[0]);
    } catch (err) {
        console.error(err);
        showToast('Search is unavailable right now');
    }
}

function clearAddressInput() {
    const input = document.getElementById('address-input');
    input.value = '';
    hideSuggestions();
}

function toggleNearMode() {
    nearMode = !nearMode;
    updateNearToggle();
    const input = document.getElementById('address-input');
    if (input.value.trim().length >= 3) fetchSuggestions(input.value.trim());
    input.focus();
}

function updateNearToggle() {
    const btn = document.getElementById('near-toggle');
    const canUse = addressList.length > 1 && searchRadius;
    btn.hidden = !canUse;
    if (!canUse) nearMode = false;
    btn.classList.toggle('on', nearMode);
    btn.setAttribute('aria-pressed', String(nearMode));
    btn.textContent = nearMode ? '◎ Searching inside circle' : '◎ Search near center';
    document.getElementById('address-input').placeholder = nearMode
        ? 'Find cafes, parks, restaurants near the center…'
        : 'Add an address or place…';
}

// ---------- List + markers ----------

function addToList(formattedAddress, lat, lng, placeName = null, type = 'address', options = {}) {
    if (addressList.some(addr => addr.formatted_address === formattedAddress)) {
        if (!options.silent) showToast('Already in the list');
        return;
    }

    const addressData = {
        formatted_address: formattedAddress,
        lat, lng,
        id: Date.now() + Math.random(),
        placeName,
        type
    };
    addressData.marker = createMarker(addressData);
    addressList.push(addressData);

    updateAddressListDisplay();
    updateCenterOfInterest();
    if (!options.skipFit) fitToAll();
    if (!options.skipURL) updateURLParameters();
}

function createMarker(addr) {
    let marker;
    if (addr.type === 'poi') {
        const el = document.createElement('div');
        el.className = 'poi-dot';
        marker = new maplibregl.Marker({ element: el });
    } else {
        marker = new maplibregl.Marker({ color: '#ea4335' });
    }
    const popup = new maplibregl.Popup({ offset: 20 }).setDOMContent(popupContent(addr.placeName || addr.formatted_address, addr.placeName ? addr.formatted_address : ''));
    return marker.setLngLat([addr.lng, addr.lat]).setPopup(popup).addTo(map);
}

function popupContent(title, subtitle) {
    const div = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = title;
    div.appendChild(strong);
    if (subtitle) {
        const small = document.createElement('small');
        small.textContent = subtitle;
        div.appendChild(document.createElement('br'));
        div.appendChild(small);
    }
    return div;
}

function fitToAll() {
    if (!addressList.length) return;
    if (addressList.length === 1) {
        map.flyTo({ center: [addressList[0].lng, addressList[0].lat], zoom: 14 });
        return;
    }
    const bounds = new maplibregl.LngLatBounds();
    addressList.forEach(a => bounds.extend([a.lng, a.lat]));
    map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
}

function updateAddressListDisplay() {
    const listElement = document.getElementById('address-list');
    listElement.innerHTML = '';

    document.getElementById('list-count').textContent = addressList.length ? `(${addressList.length})` : '';
    document.getElementById('share-btn').hidden = addressList.length === 0;

    if (addressList.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.className = 'empty-list';
        emptyMessage.textContent = 'Add 2+ addresses to find your midpoint';
        listElement.appendChild(emptyMessage);
        return;
    }

    addressList.forEach(addr => {
        const li = document.createElement('li');
        li.className = 'address-item' + (addr.type === 'poi' ? ' is-poi' : '');

        const text = document.createElement('button');
        text.className = 'address-text';
        text.textContent = (addr.type === 'poi' ? '⭐ ' : '📍 ') + addr.formatted_address;
        text.addEventListener('click', () => focusOnAddress(addr));

        const remove = document.createElement('button');
        remove.className = 'remove-btn';
        remove.title = 'Remove';
        remove.setAttribute('aria-label', 'Remove ' + addr.formatted_address);
        remove.textContent = '✕';
        remove.addEventListener('click', () => removeFromList(addr.id));

        li.appendChild(text);
        li.appendChild(remove);
        listElement.appendChild(li);
    }); // end addressList.forEach
}

function focusOnAddress(addr) {
    map.flyTo({ center: [addr.lng, addr.lat], zoom: 15 });
    if (!addr.marker.getPopup().isOpen()) addr.marker.togglePopup();
}

function removeFromList(id) {
    const addr = addressList.find(a => a.id === id);
    if (!addr) return;
    addr.marker.remove();
    addressList = addressList.filter(a => a.id !== id);
    updateAddressListDisplay();
    updateCenterOfInterest();
    updateURLParameters();
}

// ---------- Center + radius ----------

function getCenter() {
    if (!addressList.length) return null;
    return calculateCenter(addressList.filter(a => a.type !== 'poi').length ? addressList.filter(a => a.type !== 'poi') : addressList);
}

function updateCenterOfInterest() {
    // POIs are candidate venues, so only people's addresses define the midpoint
    const people = addressList.filter(a => a.type !== 'poi');
    const basis = people.length ? people : addressList;

    if (basis.length === 0) {
        if (centerMarker) { centerMarker.remove(); centerMarker = null; }
        searchRadius = null;
        drawSearchRadius(null);
        updateNearToggle();
        return;
    }

    const center = calculateCenter(basis);
    placeCenterMarker(center);

    if (basis.length === 1) {
        searchRadius = null;
        drawSearchRadius(null);
    } else {
        const maxDistance = Math.max(...calculateDistances(center, basis));
        searchRadius = Math.max(maxDistance * 0.8, 1000); // 80% of max distance, minimum 1km
        drawSearchRadius(center, searchRadius);
    }
    updateNearToggle();
}

function calculateCenter(addresses) {
    const totalLat = addresses.reduce((sum, addr) => sum + addr.lat, 0);
    const totalLng = addresses.reduce((sum, addr) => sum + addr.lng, 0);
    return { lat: totalLat / addresses.length, lng: totalLng / addresses.length };
}

function calculateDistances(center, addresses) {
    return addresses.map(addr => haversineDistance(center.lat, center.lng, addr.lat, addr.lng));
}

function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function placeCenterMarker(center) {
    if (centerMarker) {
        centerMarker.setLngLat([center.lng, center.lat]);
        return;
    }
    const el = document.createElement('div');
    el.className = 'center-dot';
    centerMarker = new maplibregl.Marker({ element: el })
        .setLngLat([center.lng, center.lat])
        .setPopup(new maplibregl.Popup({ offset: 14 }).setDOMContent(popupContent('📍 Meetup Center', 'Midpoint of your group')))
        .addTo(map);
}

function drawSearchRadius(center, radius) {
    const source = map.getSource('radius');
    if (!source) return;
    if (!center) { source.setData(emptyGeoJSON()); return; }

    // Approximate the circle as a 64-point polygon
    const coords = [];
    const latR = radius / 111320;
    const lngR = radius / (111320 * Math.cos(center.lat * Math.PI / 180));
    for (let i = 0; i <= 64; i++) {
        const t = (i / 64) * 2 * Math.PI;
        coords.push([center.lng + lngR * Math.cos(t), center.lat + latR * Math.sin(t)]);
    }
    source.setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } }]
    });
}

// ---------- Sharing via URL ----------
// Format: ?addy=<address>|<lat>,<lng>&poi=<name>|<lat>,<lng>
// Coordinates are embedded so shared links open instantly without re-geocoding.
// Legacy links (?addy=<address> without coords) are still geocoded on load.

function updateURLParameters() {
    const url = new URL(window.location.href);
    url.searchParams.delete('addy');
    url.searchParams.delete('poi');
    addressList.forEach(addr => {
        const coords = `${addr.lat.toFixed(6)},${addr.lng.toFixed(6)}`;
        if (addr.type === 'poi') {
            url.searchParams.append('poi', `${addr.placeName || addr.formatted_address}|${coords}`);
        } else {
            url.searchParams.append('addy', `${addr.formatted_address}|${coords}`);
        }
    }); // end addressList.forEach
    window.history.replaceState({}, '', url);
}

function parseEntry(raw) {
    const sep = raw.lastIndexOf('|');
    if (sep === -1) return { name: raw, lat: NaN, lng: NaN };
    const [lat, lng] = raw.slice(sep + 1).split(',').map(Number);
    return { name: raw.slice(0, sep), lat, lng };
}

async function applyURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const entries = [
        ...urlParams.getAll('addy').map(raw => ({ ...parseEntry(raw), type: 'address' })),
        ...urlParams.getAll('poi').map(raw => ({ ...parseEntry(raw), type: 'poi' }))
    ];
    if (!entries.length) return;

    for (const e of entries) {
        let { name, lat, lng } = e;
        if (isNaN(lat) || isNaN(lng)) {
            // Legacy link: look it up (sequentially, to stay polite to Photon)
            try {
                const [hit] = await photonSearch(name, 1);
                if (!hit) { console.warn('Could not find', name); continue; }
                ({ lat, lng } = hit);
            } catch (err) {
                console.error('Lookup failed for', name, err);
                continue;
            }
        }
        if (e.type === 'poi') {
            addToList(name, lat, lng, name, 'poi', { skipFit: true, skipURL: true, silent: true });
        } else {
            addToList(name, lat, lng, null, 'address', { skipFit: true, skipURL: true, silent: true });
        }
    } // end for entries

    fitToAll();
    updateURLParameters(); // upgrade legacy links to include coordinates
}

async function shareLink() {
    const url = window.location.href;
    try {
        if (navigator.share) {
            await navigator.share({ title: 'Our meetup spot', url });
            return;
        }
        await navigator.clipboard.writeText(url);
        showToast('Link copied!');
    } catch (err) {
        if (err.name !== 'AbortError') showToast('Copy the link from the address bar');
    }
}

// ---------- UI helpers ----------

let toastTimer = null;
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
}

window.addEventListener('DOMContentLoaded', initMap);
