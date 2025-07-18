import { describe, it, expect } from 'vitest';

describe('Info Window Content', () => {
  it('should show only address when no place name is provided', () => {
    const placeName = null;
    const formattedAddress = "123 Main St, New York, NY 10001";
    
    const content = `<div><strong>${placeName || formattedAddress}</strong><br><small>${placeName ? formattedAddress : ''}</small></div>`;
    
    expect(content).toBe(`<div><strong>123 Main St, New York, NY 10001</strong><br><small></small></div>`);
  });

  it('should show place name and address when both are provided', () => {
    const placeName = "Joe's Pizza";
    const formattedAddress = "123 Main St, New York, NY 10001";
    
    const content = `<div><strong>${placeName || formattedAddress}</strong><br><small>${placeName ? formattedAddress : ''}</small></div>`;
    
    expect(content).toBe(`<div><strong>Joe's Pizza</strong><br><small>123 Main St, New York, NY 10001</small></div>`);
  });

  it('should handle empty place name', () => {
    const placeName = "";
    const formattedAddress = "123 Main St, New York, NY 10001";
    
    const content = `<div><strong>${placeName || formattedAddress}</strong><br><small>${placeName ? formattedAddress : ''}</small></div>`;
    
    expect(content).toBe(`<div><strong>123 Main St, New York, NY 10001</strong><br><small></small></div>`);
  });
});