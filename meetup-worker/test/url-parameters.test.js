import { describe, it, expect, beforeEach } from 'vitest';

describe('URL Parameter Functions', () => {
  let mockAddressList;
  
  beforeEach(() => {
    mockAddressList = [
      { formatted_address: "123 Main St, New York, NY 10001", lat: 40.7128, lng: -74.0060, id: 1 },
      { formatted_address: "456 Oak Ave, Brooklyn, NY 11201", lat: 40.6892, lng: -73.9442, id: 2 }
    ];
  });

  it('should encode addresses for URL parameters', () => {
    const address = "123 Main St, New York, NY 10001";
    const encoded = encodeURIComponent(address);
    
    expect(encoded).toBe("123%20Main%20St%2C%20New%20York%2C%20NY%2010001");
  });

  it('should decode addresses from URL parameters', () => {
    const encoded = "123%20Main%20St%2C%20New%20York%2C%20NY%2010001";
    const decoded = decodeURIComponent(encoded);
    
    expect(decoded).toBe("123 Main St, New York, NY 10001");
  });

  it('should construct proper URL with multiple addresses', () => {
    const url = new URL('http://localhost:8080');
    
    mockAddressList.forEach(addr => {
      url.searchParams.append('addy', addr.formatted_address); // URLSearchParams handles encoding
    });
    
    expect(url.toString()).toBe('http://localhost:8080/?addy=123+Main+St%2C+New+York%2C+NY+10001&addy=456+Oak+Ave%2C+Brooklyn%2C+NY+11201');
  });

  it('should parse multiple addresses from URL', () => {
    const urlString = 'http://localhost:8080/?addy=123%20Main%20St%2C%20New%20York%2C%20NY%2010001&addy=456%20Oak%20Ave%2C%20Brooklyn%2C%20NY%2011201';
    const url = new URL(urlString);
    const addresses = url.searchParams.getAll('addy');
    
    expect(addresses).toHaveLength(2);
    expect(decodeURIComponent(addresses[0])).toBe("123 Main St, New York, NY 10001");
    expect(decodeURIComponent(addresses[1])).toBe("456 Oak Ave, Brooklyn, NY 11201");
  });

  it('should handle empty URL parameters', () => {
    const url = new URL('http://localhost:8080');
    const addresses = url.searchParams.getAll('addy');
    const pois = url.searchParams.getAll('poi');
    
    expect(addresses).toHaveLength(0);
    expect(pois).toHaveLength(0);
  });
});