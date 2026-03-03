const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:5001'
            : 'https://api.roomhy.com';
        let citiesData = [];
        let areasData = [];
        
        const debug = (msg) => {
            const el = document.getElementById('debug');
            el.textContent += new Date().toLocaleTimeString() + ' > ' + msg + '\n';
            console.log(msg);
        };

        async function loadCities() {
            debug('Loading cities...');
            try {
                const response = await fetch(`${API_URL}/api/locations/cities`);
                const data = await response.json();
                citiesData = data.data || [];
                debug(`Loaded ${citiesData.length} cities`);
                
                const select = document.getElementById('city');
                select.innerHTML = '<option value="">Select a city</option>';
                citiesData.forEach(city => {
                    const opt = document.createElement('option');
                    opt.value = city._id;
                    opt.textContent = city.name;
                    select.appendChild(opt);
                });
                debug('Cities dropdown populated');
            } catch (e) {
                debug('Error: ' + e.message);
            }
        }

        async function loadAreas() {
            const cityId = document.getElementById('city').value;
            debug(`Loading areas for city: ${cityId}`);
            
            if (!cityId) {
                document.getElementById('area').innerHTML = '<option value="">Select a city first</option>';
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/locations/areas`);
                const data = await response.json();
                const allAreas = data.data || [];
                debug(`Got ${allAreas.length} total areas from API`);
                
                // Log first few areas to see structure
                allAreas.slice(0, 2).forEach(area => {
                    debug(`Area: ${area.name}, City ID: ${area.city?._id}`);
                });
                
                // Filter
                areasData = allAreas.filter(area => area.city?._id === cityId);
                debug(`Filtered to ${areasData.length} areas for this city`);
                
                // Populate
                const select = document.getElementById('area');
                select.innerHTML = '<option value="">Select an area</option>';
                areasData.forEach(area => {
                    const opt = document.createElement('option');
                    opt.value = area._id;
                    opt.textContent = area.name;
                    select.appendChild(opt);
                    debug(`Added area option: ${area.name}`);
                });
            } catch (e) {
                debug('Error: ' + e.message);
            }
        }

        // Initialize
        window.addEventListener('DOMContentLoaded', loadCities);