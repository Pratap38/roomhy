// Test script to validate Fast Bidding API integration
// Run this in browser console on the fast-bidding.html page

console.log('🧪 Fast Bidding API Integration Test');
console.log('=====================================\n');

// Test 1: Check API_URL is defined
console.log('Test 1: API_URL Configuration');
console.log('API_URL:', API_URL);
console.log('✓ API_URL defined\n');

// Test 2: Fetch approved properties
console.log('Test 2: Fetch Approved Properties');
fetch(`${API_URL}/api/approved-properties/public/approved`)
    .then(res => res.json())
    .then(data => {
        console.log('✓ Properties API Response:');
        console.log(`  - Total properties: ${Array.isArray(data) ? data.length : 0}`);
        if (Array.isArray(data) && data.length > 0) {
            console.log(`  - First property:`, data[0]);
            console.log(`    - Name: ${data[0].propertyInfo?.name || 'N/A'}`);
            console.log(`    - Area: ${data[0].locality || data[0].propertyInfo?.area || 'N/A'}`);
            console.log(`    - Rent: ${data[0].monthlyRent || data[0].rent || 'N/A'}`);
            console.log(`    - Gender: ${data[0].gender || data[0].propertyInfo?.gender || 'N/A'}`);
            console.log(`    - Status: ${data[0].status}`);
            console.log(`    - Live: ${data[0].isLiveOnWebsite}`);
        }
    })
    .catch(err => console.error('✗ Error fetching properties:', err));

// Test 3: Check cities API
console.log('\nTest 3: Fetch Cities');
fetch(`${API_URL}/api/locations/cities`)
    .then(res => res.json())
    .then(data => {
        const cities = data.data || [];
        console.log(`✓ Cities API Response:`);
        console.log(`  - Total cities: ${cities.length}`);
        if (cities.length > 0) {
            console.log(`  - First city: ${cities[0].name} (ID: ${cities[0]._id})`);
        }
    })
    .catch(err => console.error('✗ Error fetching cities:', err));

// Test 4: Check areas API
console.log('\nTest 4: Fetch Areas');
fetch(`${API_URL}/api/locations/areas`)
    .then(res => res.json())
    .then(data => {
        const areas = data.data || [];
        console.log(`✓ Areas API Response:`);
        console.log(`  - Total areas: ${areas.length}`);
        if (areas.length > 0) {
            console.log(`  - First area: ${areas[0].name}`);
            console.log(`    - City ID: ${areas[0].city?._id}`);
            console.log(`    - City Name: ${areas[0].city?.name}`);
        }
    })
    .catch(err => console.error('✗ Error fetching areas:', err));

// Test 5: Form validation check
console.log('\nTest 5: Form Elements');
const formElements = [
    'fullName', 'gmail', 'userId', 'gender', 'city', 'area', 'minPrice', 'maxPrice'
];
formElements.forEach(id => {
    const el = document.getElementById(id);
    console.log(`  ${id}: ${el ? '✓ Found' : '✗ Missing'}`);
});

console.log('\n✓ All tests completed. Check results above.');
console.log('=====================================');
