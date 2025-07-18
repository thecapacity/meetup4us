import { describe, it, expect } from 'vitest';

describe('POI Search Logic', () => {
  it('should identify business places vs addresses', () => {
    // Mock place data for a real business
    const businessPlace = {
      name: "Joe's Pizza",
      formatted_address: "123 Main St, New York, NY 10001",
      geometry: { location: { lat: () => 40.7128, lng: () => -74.0060 } }
    };
    
    // Mock place data for just an address
    const addressPlace = {
      name: "123 Main St, New York, NY 10001",
      formatted_address: "123 Main St, New York, NY 10001",
      geometry: { location: { lat: () => 40.7128, lng: () => -74.0060 } }
    };
    
    // Mock place data for "Restaurant Depot" (address-like business)
    const depotPlace = {
      name: "Restaurant Depot",
      formatted_address: "456 Industrial Blvd, Queens, NY 11101",
      geometry: { location: { lat: () => 40.7589, lng: () => -73.9851 } }
    };
    
    // Test business detection logic
    const isBusinessPlace = (place) => {
      return !!(place.name && place.name !== place.formatted_address);
    };
    
    expect(isBusinessPlace(businessPlace)).toBe(true);
    expect(isBusinessPlace(addressPlace)).toBe(false);
    expect(isBusinessPlace(depotPlace)).toBe(true);
  });
  
  it('should handle missing place data gracefully', () => {
    const incompletePlaceData = {
      formatted_address: "123 Main St, New York, NY 10001",
      geometry: { location: { lat: () => 40.7128, lng: () => -74.0060 } }
    };
    
    const isBusinessPlace = (place) => {
      return !!(place.name && place.name !== place.formatted_address);
    };
    
    expect(isBusinessPlace(incompletePlaceData)).toBe(false);
  });
});