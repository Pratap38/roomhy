const API_URL = 'http://localhost:5001';

// Test 1: Get cities
console.log('Testing Cities API...');
fetch(`${API_URL}/api/locations/cities`)
    .then(r => r.json())
    .then(data => {
        console.log('✓ Cities loaded:', data.data?.length, 'cities');
        console.log('Cities:', data.data?.map(c => ({ id: c._id, name: c.name })));
        
        // Test 2: Get areas
        if (data.data?.length > 0) {
            const firstCityId = data.data[0]._id;
            console.log('\nTesting Areas API with city:', firstCityId);
            return fetch(`${API_URL}/api/locations/areas`);
        }
    })
    .then(r => r?.json())
    .then(data => {
        if (data) {
            console.log('✓ Areas loaded:', data.data?.length, 'areas');
            console.log('Areas sample:', data.data?.slice(0, 3).map(a => ({ id: a._id, name: a.name, city: a.city?.name })));
        }
    })
    .catch(err => console.error('Error:', err.message));
