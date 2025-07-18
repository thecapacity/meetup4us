/**
 * URL Sharing Test Instructions
 * 
 * Test the new URL parameter sharing functionality:
 * 
 * 1. Open http://localhost:8080
 * 2. Add a few addresses to the planning list
 * 3. Watch the URL bar - it should update with ?addy=... parameters
 * 4. Copy the URL from the browser address bar
 * 5. Open a new tab and paste the URL
 * 6. The addresses should automatically load and appear on the map!
 * 
 * Example URL format:
 * http://localhost:8080/?addy=123+Main+St%2C+New+York%2C+NY&addy=456+Oak+Ave%2C+Brooklyn%2C+NY
 * 
 * Test Cases:
 * - Add single address → URL should update
 * - Add multiple addresses → URL should have multiple ?addy= parameters
 * - Remove address → URL should update (remove that parameter)
 * - Share URL with someone → They should see the same addresses
 * - Refresh page → Addresses should persist (no more localStorage!)
 * 
 * Key Benefits:
 * - Shareable planning links
 * - No more confusing localStorage persistence
 * - Clean URL-based state management
 * - Easy to bookmark specific meetup plans
 */

console.log('URL sharing test instructions loaded. See test/url-sharing-test.js for details.');