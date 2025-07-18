/**
 * Manual test instructions for address search functionality
 * 
 * To test the fixed functionality:
 * 1. Start the dev server: npm run dev
 * 2. Open http://localhost:8080 in your browser
 * 3. Test the following scenarios:
 * 
 * SCENARIO 1: Autocomplete Selection
 * - Type "123 Main St" in the address input
 * - Click on one of the autocomplete suggestions
 * - Expected: Address should be added to the "Planning List" with an X button
 * 
 * SCENARIO 2: Manual Entry with Enter Key
 * - Type "456 Oak Ave, San Francisco, CA" in the address input
 * - Press Enter key
 * - Expected: Address should be geocoded and added to the "Planning List"
 * 
 * SCENARIO 3: Address Removal
 * - Click the X button on any address in the Planning List
 * - Expected: Address should be removed from the list and map
 * 
 * SCENARIO 4: Duplicate Prevention
 * - Try to add the same address twice
 * - Expected: Alert saying "Address already in list!"
 * 
 * All tests should pass before proceeding to POI functionality.
 */

console.log('Manual test instructions loaded. See test/manual-test.js for details.');