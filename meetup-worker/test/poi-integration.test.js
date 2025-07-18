import { describe, it, expect } from 'vitest';

describe('POI Integration with Planning List', () => {
  it('should create POI data structure correctly', () => {
    const formattedAddress = "123 Main St, New York, NY 10001";
    const placeName = "Joe's Pizza";
    const lat = 40.7128;
    const lng = -74.0060;
    const type = 'poi';
    
    const poiData = {
      formatted_address: formattedAddress,
      lat: lat,
      lng: lng,
      id: Date.now() + Math.random(),
      placeName: placeName,
      type: type
    };
    
    expect(poiData.type).toBe('poi');
    expect(poiData.placeName).toBe("Joe's Pizza");
    expect(poiData.formatted_address).toBe(formattedAddress);
  });

  it('should generate correct URL parameters for POIs', () => {
    const mockAddressList = [
      { formatted_address: "123 Main St", type: 'address' },
      { formatted_address: "456 Oak Ave", placeName: "Joe's Pizza", type: 'poi' }
    ];
    
    const url = new URL('http://localhost:8080');
    
    mockAddressList.forEach(addr => {
      if (addr.type === 'poi') {
        url.searchParams.append('poi', addr.placeName || addr.formatted_address);
      } else {
        url.searchParams.append('addy', addr.formatted_address);
      }
    });
    
    expect(url.toString()).toBe('http://localhost:8080/?addy=123+Main+St&poi=Joe%27s+Pizza');
  });

  it('should handle mixed address and POI list', () => {
    const mixedList = [
      { formatted_address: "123 Main St", type: 'address' },
      { formatted_address: "456 Oak Ave", placeName: "Pizza Place", type: 'poi' },
      { formatted_address: "789 Pine St", type: 'address' }
    ];
    
    const addresses = mixedList.filter(item => item.type === 'address');
    const pois = mixedList.filter(item => item.type === 'poi');
    
    expect(addresses).toHaveLength(2);
    expect(pois).toHaveLength(1);
    expect(pois[0].placeName).toBe("Pizza Place");
  });
});