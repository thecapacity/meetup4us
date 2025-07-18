import { describe, it, expect, beforeEach } from 'vitest';

describe('Address Removal Functionality', () => {
  let mockAddressList;
  let mockMarkers;
  
  beforeEach(() => {
    mockAddressList = [
      { formatted_address: "123 Main St", lat: 40.7128, lng: -74.0060, id: 1 },
      { formatted_address: "456 Oak Ave", lat: 40.7589, lng: -73.9851, id: 2 }
    ];
    mockMarkers = [
      { position: { lat: () => 40.7128, lng: () => -74.0060 }, map: 'mock-map' },
      { position: { lat: () => 40.7589, lng: () => -73.9851 }, map: 'mock-map' }
    ];
  });

  it('should remove address from list by id', () => {
    const idToRemove = 1;
    const filteredList = mockAddressList.filter(addr => addr.id !== idToRemove);
    
    expect(filteredList).toHaveLength(1);
    expect(filteredList[0].id).toBe(2);
    expect(filteredList[0].formatted_address).toBe("456 Oak Ave");
  });

  it('should find correct marker for removal', () => {
    const addressToRemove = mockAddressList[0]; // 123 Main St
    
    const markerIndex = mockMarkers.findIndex(marker => {
      const markerLat = marker.position.lat();
      const markerLng = marker.position.lng();
      return Math.abs(markerLat - addressToRemove.lat) < 0.0001 && 
             Math.abs(markerLng - addressToRemove.lng) < 0.0001;
    });
    
    expect(markerIndex).toBe(0);
  });

  it('should not find marker for non-existent address', () => {
    const nonExistentAddress = { lat: 50.0, lng: 50.0 };
    
    const markerIndex = mockMarkers.findIndex(marker => {
      const markerLat = marker.position.lat();
      const markerLng = marker.position.lng();
      return Math.abs(markerLat - nonExistentAddress.lat) < 0.0001 && 
             Math.abs(markerLng - nonExistentAddress.lng) < 0.0001;
    });
    
    expect(markerIndex).toBe(-1);
  });
});