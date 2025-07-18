import { describe, it, expect } from 'vitest';

describe('POI URL Loading', () => {
  it('should parse POI parameters from URL correctly', () => {
    const urlString = 'http://localhost:8080/?addy=Alexandria%2C+VA%2C+USA&poi=Settle+Down+Easy+Brewing+Co.&poi=Country+Club+of+Fairfax';
    const url = new URL(urlString);
    
    const addresses = url.searchParams.getAll('addy');
    const pois = url.searchParams.getAll('poi');
    
    expect(addresses).toHaveLength(1);
    expect(pois).toHaveLength(2);
    expect(addresses[0]).toBe('Alexandria, VA, USA');
    expect(pois[0]).toBe('Settle Down Easy Brewing Co.');
    expect(pois[1]).toBe('Country Club of Fairfax');
  });

  it('should handle URL decoding correctly', () => {
    const encoded = 'Settle+Down+Easy+Brewing+Co.';
    const decoded = encoded.replace(/\+/g, ' ');
    expect(decoded).toBe('Settle Down Easy Brewing Co.');
  });

  it('should create proper POI data structure from URL', () => {
    const poiName = 'Settle Down Easy Brewing Co.';
    const formattedAddress = '123 Example St, Fairfax, VA';
    const lat = 38.8462;
    const lng = -77.3064;
    
    const poiData = {
      formatted_address: formattedAddress,
      lat: lat,
      lng: lng,
      id: Date.now() + Math.random(),
      placeName: poiName,
      type: 'poi'
    };
    
    expect(poiData.type).toBe('poi');
    expect(poiData.placeName).toBe(poiName);
    expect(poiData.formatted_address).toBe(formattedAddress);
  });
});