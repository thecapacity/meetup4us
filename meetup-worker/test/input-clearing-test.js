/**
 * Input Clearing Test Instructions
 * 
 * Test that the search box clears after adding items:
 * 
 * 1. Open http://localhost:8080
 * 2. Type "123 Main St" in the search box
 * 3. Select from autocomplete suggestions
 * 4. ✅ Search box should be EMPTY after adding to Planning List
 * 
 * 5. Type "Starbucks" in the search box
 * 6. Select a specific Starbucks location
 * 7. ✅ Search box should be EMPTY after adding to Planning List
 * 
 * 8. Type an address and press Enter (manual entry)
 * 9. ✅ Search box should be EMPTY after adding to Planning List
 * 
 * Expected Behavior:
 * - After any item is added to Planning List, search box should be cleared
 * - User can immediately start typing the next search term
 * - No need to manually clear the previous search
 * 
 * If the search box is not clearing:
 * - Check browser console for any error messages
 * - The clearAddressInput() function tries multiple methods to clear
 * - PlaceAutocompleteElement clearing can be tricky due to shadow DOM
 */

console.log('Input clearing test instructions loaded. See test/input-clearing-test.js for details.');