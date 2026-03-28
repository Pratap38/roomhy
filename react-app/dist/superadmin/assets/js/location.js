const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const API_URL = isLocalHost ? 'http://localhost:5001/api' : 'https://api.roomhy.com/api';
        let currentCityIndex = 0;
        let citiesData = [];
        let areasData = [];

        lucide.createIcons();

        document.addEventListener('DOMContentLoaded', async () => {
            await loadCities();
            await loadAreas();
            await loadCarousel();  // Load carousel after both cities and areas are loaded
        });

        // --- API Functions ---

        /**
         * GET ALL CITIES from MongoDB
         */
        async function loadCities() {
            try {
                const response = await fetch(`${API_URL}/locations/cities`);
                if (!response.ok) throw new Error('Failed to fetch cities');
                
                const result = await response.json();
                citiesData = (result.data || []).map(city => ({
                    _id: city._id || city.id,
                    name: city.name,
                    state: city.state,
                    imageUrl: city.imageUrl || city.image,
                    imagePublicId: city.imagePublicId,
                    status: city.status,
                    ...city
                }));
                // Sync to localStorage for manager compatibility
                localStorage.setItem('roomhy_cities', JSON.stringify(citiesData));
                renderCitiesTable();
            } catch (error) {
                console.error('Error loading cities:', error);
                showError('Failed to load cities: ' + error.message);
            }
        }

        /**
         * GET ALL AREAS from MongoDB
         */
        async function loadAreas() {
            try {
                const response = await fetch(`${API_URL}/locations/areas`);
                if (!response.ok) throw new Error('Failed to fetch areas');
                
                const result = await response.json();
                areasData = (result.data || []).map(area => ({
                    _id: area._id || area.id,
                    name: area.name,
                    city: area.city,
                    cityId: (area.city && area.city._id) ? area.city._id : (typeof area.city === 'string' ? area.city : ''),
                    cityName: area.cityName || (area.city && area.city.name) || '',
                    imageUrl: area.imageUrl || area.image,
                    imagePublicId: area.imagePublicId,
                    status: area.status,
                    ...area
                }));
                // Sync to localStorage for manager compatibility
                localStorage.setItem('roomhy_areas', JSON.stringify(areasData));
                renderAreasTable();
            } catch (error) {
                console.error('Error loading areas:', error);
                showError('Failed to load areas: ' + error.message);
            }
        }

        /**
         * CREATE CITY with image upload to Cloudinary
         */
        function saveLocation() {
            const type = document.getElementById('locationTypeInput').value;
            const name = document.getElementById('locationName').value.trim();
            
            if (type === 'city') {
                const state = document.getElementById('locationState').value.trim();
                const photoFile = document.getElementById('locationPhoto').files[0];
                
                if (!name || !state) return alert("Please fill all fields");

                const formData = new FormData();
                formData.append('name', name);
                formData.append('state', state);
                if (photoFile) {
                    formData.append('image', photoFile);
                }

                fetch(`${API_URL}/locations/cities`, {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert('City Added Successfully!');
                        loadCities();
                        notifyLocationChange();
                        toggleModal('addLocationModal');
                        document.getElementById('locationForm').reset();
                    } else {
                        alert('Error: ' + data.message);
                    }
                })
                .catch(err => alert('Error creating city: ' + err.message));
            } else {
                const cityId = document.getElementById('parentCitySelect').value;
                const photoFile = document.getElementById('locationPhoto').files[0];
                
                if (!name || !cityId) return alert("Please fill all fields");

                const formData = new FormData();
                formData.append('name', name);
                formData.append('cityId', cityId);
                if (photoFile) {
                    formData.append('image', photoFile);
                }

                fetch(`${API_URL}/locations/areas`, {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert('Area Added Successfully!');
                        loadAreas();
                        notifyLocationChange();
                        toggleModal('addLocationModal');
                        document.getElementById('locationForm').reset();
                    } else {
                        alert('Error: ' + data.message);
                    }
                })
                .catch(err => alert('Error creating area: ' + err.message));
            }
        }

        /**
         * DELETE CITY
         */
        async function deleteCity(cityId) {
            if (!confirm("Delete this city? This will not delete associated areas automatically.")) return;

            try {
                const response = await fetch(`${API_URL}/locations/cities/${cityId}`, {
                    method: 'DELETE'
                });

                const data = await response.json();
                if (data.success) {
                    alert('City deleted successfully');
                    loadCities();
                    notifyLocationChange();
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                alert('Error deleting city: ' + error.message);
            }
        }

        /**
         * DELETE AREA
         */
        async function deleteArea(areaId) {
            if (!confirm("Delete this area?")) return;

            try {
                const response = await fetch(`${API_URL}/locations/areas/${areaId}`, {
                    method: 'DELETE'
                });

                const data = await response.json();
                if (data.success) {
                    alert('Area deleted successfully');
                    loadAreas();
                    notifyLocationChange();
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                alert('Error deleting area: ' + error.message);
            }
        }

        /**
         * EDIT CITY IMAGE
         */
        function editCityImage(cityId) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const formData = new FormData();
                formData.append('image', file);

                fetch(`${API_URL}/locations/cities/${cityId}`, {
                    method: 'PUT',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert('City image updated successfully');
                        loadCities();
                        notifyLocationChange();
                    } else {
                        alert('Error: ' + data.message);
                    }
                })
                .catch(err => alert('Error updating city image: ' + err.message));
            };
            input.click();
        }

        // --- Render Functions ---

        /**
         * Render Cities Table
         */
        function renderCitiesTable() {
            const tbody = document.getElementById('citiesTableBody');
            tbody.innerHTML = citiesData.map(city => `
                <tr class="hover:bg-gray-50">
                    <td><span class="font-medium text-gray-900">${city.name}</span></td>
                    <td>${city.state}</td>
                    <td>
                        ${city.imageUrl 
                            ? `<img src="${city.imageUrl}" alt="${city.name}" class="h-10 w-16 rounded object-cover">` 
                            : '<span class="text-gray-400 text-sm">No image</span>'
                        }
                    </td>
                    <td><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">${city.status}</span></td>
                    <td class="text-right">
                        <button class="text-blue-400 hover:text-blue-600 mx-1" onclick="editCityImage('${city._id}')"><i data-lucide="image" class="w-4 h-4"></i></button>
                        <button class="text-gray-400 hover:text-red-600 mx-1" onclick="deleteCity('${city._id}')"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </td>
                </tr>
            `).join('');
            lucide.createIcons();
        }

        /**
         * Render Areas Table
         */
        function renderAreasTable() {
            const tbody = document.getElementById('areasTableBody');
            tbody.innerHTML = areasData.map(area => `
                <tr class="hover:bg-gray-50">
                    <td><span class="font-medium text-gray-900">${area.name}</span></td>
                    <td>${area.cityName}</td>
                    <td>
                        ${area.imageUrl 
                            ? `<img src="${area.imageUrl}" alt="${area.name}" class="h-10 w-16 rounded object-cover">` 
                            : '<span class="text-gray-400 text-sm">No photo</span>'
                        }
                    </td>
                    <td><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">${area.status}</span></td>
                    <td class="text-right">
                        <button class="text-gray-400 hover:text-red-600 mx-1" onclick="deleteArea('${area._id}')"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </td>
                </tr>
            `).join('');
            lucide.createIcons();
        }

        // --- Carousel Functions ---
        /**
         * Load carousel with alternating city and area images
         * 1st image = City
         * 2nd image = Area from that city
         * 3rd image = Next city, etc.
         */
        async function loadCarousel() {
            const carousel = document.getElementById('citiesCarousel');
            
            // Filter cities with images
            const citiesToDisplay = citiesData.filter(c => c.imageUrl);
            
            if (citiesToDisplay.length === 0) {
                carousel.innerHTML = '<div class="w-full flex items-center justify-center text-gray-400"><span>No city images added yet</span></div>';
                return;
            }

            // Build carousel with alternating city and area images
            let carouselItems = [];

            for (const city of citiesToDisplay) {
                // Add city image
                carouselItems.push(`
                    <div class="carousel-item min-w-full h-full relative flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity" onclick="viewCityProperties('${city.name}')">
                        <img src="${city.imageUrl}" alt="${city.name}" class="w-full h-full object-cover">
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                            <h4 class="text-white text-xl font-bold">${city.name}</h4>
                            <p class="text-gray-300 text-sm">${city.state}</p>
                        </div>
                    </div>
                `);

                // Add first area image for this city
                const cityId = String(city._id || '');
                const cityName = String(city.name || '').toLowerCase();
                const cityAreas = areasData.filter(a => {
                    if (!a.imageUrl) return false;
                    const areaCityRaw = a.cityId || a.city || '';
                    const areaCityId = String((areaCityRaw && areaCityRaw._id) ? areaCityRaw._id : areaCityRaw);
                    const areaCityName = String(a.cityName || (areaCityRaw && areaCityRaw.name) || '').toLowerCase();
                    return areaCityId === cityId || (cityName && areaCityName === cityName);
                });
                if (cityAreas.length > 0) {
                    const area = cityAreas[0];
                    carouselItems.push(`
                        <div class="carousel-item min-w-full h-full relative flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                            <img src="${area.imageUrl}" alt="${area.name}" class="w-full h-full object-cover">
                            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                                <h4 class="text-white text-xl font-bold">${area.name}</h4>
                                <p class="text-gray-300 text-sm">${city.name}</p>
                            </div>
                        </div>
                    `);
                }
            }

            if (carouselItems.length === 0) {
                carousel.innerHTML = '<div class="w-full flex items-center justify-center text-gray-400"><span>No images available</span></div>';
                return;
            }

            carousel.innerHTML = carouselItems.join('');
            currentCityIndex = 0;
            updateCarouselPosition();
        }

        // --- Modal Logic ---
        function openAddModal(type) {
            document.getElementById('locationTypeInput').value = type;
            const form = document.getElementById('locationForm');
            form.reset();
            document.getElementById('photoPreview').classList.add('hidden');

            const title = document.getElementById('modalTitle');
            const nameLabel = document.getElementById('nameLabel');
            const parentField = document.getElementById('parentCityField');
            const stateField = document.getElementById('stateField');
            const photoField = document.getElementById('pincodeField');
            const parentSelect = document.getElementById('parentCitySelect');

            if (type === 'city') {
                title.innerText = 'Add New City';
                nameLabel.innerText = 'City Name';
                parentField.classList.add('hidden');
                photoField.classList.remove('hidden');
                stateField.classList.remove('hidden');
                document.getElementById('locationState').required = true;
            } else {
                title.innerText = 'Add New Area';
                nameLabel.innerText = 'Area Name';
                parentField.classList.remove('hidden');
                photoField.classList.remove('hidden'); // Show photo for areas too
                stateField.classList.add('hidden');
                document.getElementById('locationState').required = false;

                // Populate Parent Cities Dropdown
                parentSelect.innerHTML = '<option value="">Select City</option>';
                citiesData.forEach(c => {
                    parentSelect.add(new Option(c.name, c._id));
                });
            }

            toggleModal('addLocationModal');
            enableDraggableModal();
        }

        // Handle photo upload preview
        document.getElementById('locationPhoto')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('previewImage').src = event.target.result;
                    document.getElementById('photoPreview').classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });

        // --- UI Helpers ---
        function switchTab(tabName) {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`${tabName}-content`).classList.add('active');
        }

        // Broadcast location change to other tabs and same-tab listeners
        function notifyLocationChange(){
            try{
                if(typeof BroadcastChannel !== 'undefined'){
                    const ch = new BroadcastChannel('roomhy_locations');
                    ch.postMessage({ type: 'locations-updated', timestamp: Date.now() });
                    ch.close();
                }
            }catch(e){/* ignore */}
            // Also write timestamp to localStorage for same-tab listeners
            try{ localStorage.setItem('roomhy_locations_updated_at', Date.now().toString()); }catch(e){}
        }

        // Utility: Show error message
        function showError(message) {
            alert('Error: ' + message);
            console.error(message);
        }

        function viewCityProperties(cityName) {
            sessionStorage.setItem('filterByCity', cityName);
            window.location.href = 'properties';
        }

        function updateCarouselPosition() {
            const carousel = document.getElementById('citiesCarousel');
            const carouselItems = carousel.querySelectorAll('.carousel-item');
            if (carouselItems.length > 0) {
                carousel.style.transform = `translateX(-${currentCityIndex * 100}%)`;
            }
        }

        function nextCity() {
            const carousel = document.getElementById('citiesCarousel');
            const carouselItems = carousel.querySelectorAll('.carousel-item');
            if (carouselItems.length > 0) {
                currentCityIndex = (currentCityIndex + 1) % carouselItems.length;
                updateCarouselPosition();
            }
        }

        function prevCity() {
            const carousel = document.getElementById('citiesCarousel');
            const carouselItems = carousel.querySelectorAll('.carousel-item');
            if (carouselItems.length > 0) {
                currentCityIndex = (currentCityIndex - 1 + carouselItems.length) % carouselItems.length;
                updateCarouselPosition();
            }
        }

        function toggleModal(modalID){
            const modal = document.getElementById(modalID);
            if(modal.classList.contains('hidden')){
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            } else {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }

        function enableDraggableModal() {
            const modal = document.getElementById('addLocationModal');
            if (!modal) return;
            const panel = modal.querySelector('.draggable-modal');
            const handle = modal.querySelector('.modal-drag-handle');
            if (!panel || !handle) return;
            if (panel.dataset.dragInit === 'true') return;
            panel.dataset.dragInit = 'true';

            // Make panel movable
            panel.style.position = 'fixed';
            panel.style.margin = '0';
            panel.style.maxWidth = '640px';
            panel.style.width = '90%';
            panel.style.zIndex = '60';

            // Center it initially
            const centerPanel = () => {
                const rect = panel.getBoundingClientRect();
                const left = Math.max(8, (window.innerWidth - rect.width) / 2);
                const top = Math.max(24, (window.innerHeight - rect.height) / 2);
                panel.style.left = `${left}px`;
                panel.style.top = `${top}px`;
            };
            if (!panel.style.left || !panel.style.top) {
                centerPanel();
            }

            let dragging = false;
            let offsetX = 0;
            let offsetY = 0;

            handle.addEventListener('mousedown', (e) => {
                dragging = true;
                const rect = panel.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                document.body.style.userSelect = 'none';
            });

            document.addEventListener('mousemove', (e) => {
                if (!dragging) return;
                const nextLeft = e.clientX - offsetX;
                const nextTop = e.clientY - offsetY;
                panel.style.left = `${Math.max(8, Math.min(nextLeft, window.innerWidth - panel.offsetWidth - 8))}px`;
                panel.style.top = `${Math.max(8, Math.min(nextTop, window.innerHeight - panel.offsetHeight - 8))}px`;
            });

            document.addEventListener('mouseup', () => {
                if (!dragging) return;
                dragging = false;
                document.body.style.userSelect = '';
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            enableDraggableModal();
        });
        
        function toggleSubmenu(id, element) {
            const submenu = document.getElementById(id);
            const chevron = element.querySelector('.lucide-chevron-down');
            if (submenu.classList.contains('open')) {
                submenu.classList.remove('open');
                if(chevron) chevron.style.transform = 'rotate(0deg)';
            } else {
                submenu.classList.add('open');
                if(chevron) chevron.style.transform = 'rotate(180deg)';
            }
        }

        // Mobile Menu
        document.getElementById('mobile-menu-open').addEventListener('click', () => {
             const sidebar = document.querySelector('aside');
             const overlay = document.getElementById('mobile-sidebar-overlay');
             sidebar.classList.remove('hidden');
             sidebar.classList.add('flex', 'absolute', 'inset-y-0', 'left-0', 'w-72', 'z-40');
             if(overlay) overlay.classList.remove('hidden');
        });
