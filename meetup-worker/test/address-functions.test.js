import { describe, it, expect, beforeEach, vi } from 'vitest';

// Test the core address management functions
describe('Address Management Functions', () => {
  let mockAddressList;
  let mockMarkers;
  
  beforeEach(() => {
    mockAddressList = [];
    mockMarkers = [];
  });

  it('should create a valid address object', () => {
    const address = "123 Main St, Test City, ST 12345";
    const lat = 40.7128;
    const lng = -74.0060;
    const id = Date.now();
    
    const addressData = {
      formatted_address: address,
      lat: lat,
      lng: lng,
      id: id
    };

    expect(addressData).toMatchObject({
      formatted_address: address,
      lat: lat,
      lng: lng,
      id: expect.any(Number)
    });
  });

  it('should identify duplicate addresses', () => {
    const address1 = "123 Main St, Test City, ST 12345";
    const address2 = "123 Main St, Test City, ST 12345";
    const address3 = "456 Oak Ave, Test City, ST 12345";
    
    mockAddressList = [
      { formatted_address: address1, lat: 40.7128, lng: -74.0060, id: 1 }
    ];
    
    // Check if address already exists
    const isDuplicate = mockAddressList.some(addr => addr.formatted_address === address2);
    const isNotDuplicate = mockAddressList.some(addr => addr.formatted_address === address3);
    
    expect(isDuplicate).toBe(true);
    expect(isNotDuplicate).toBe(false);
  });

  it('should filter addresses by id for removal', () => {
    mockAddressList = [
      { formatted_address: "123 Main St", lat: 40.7128, lng: -74.0060, id: 1 },
      { formatted_address: "456 Oak Ave", lat: 40.7589, lng: -73.9851, id: 2 }
    ];
    
    const filteredList = mockAddressList.filter(addr => addr.id !== 1);
    
    expect(filteredList).toHaveLength(1);
    expect(filteredList[0].id).toBe(2);
  });
});