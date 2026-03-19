const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001/api/approved-properties' : 'https://api.roomhy.com/api/approved-properties';
        let allProperties = [];
        let filteredProperties = [];

        async function loadProperties() {
            try {
                const response = await fetch(`${API_BASE_URL}/website/live`);
                const result = await response.json();

                if (result.success) {
                    allProperties = result.properties || [];
                    filteredProperties = allProperties;
                    populateCityFilter();
                    displayProperties(allProperties);
                } else {
                    document.getElementById('propertiesContainer').innerHTML = 
                        '<div class="col-span-full text-red-600 text-center py-8">Failed to load properties</div>';
                }
            } catch (error) {
                console.error('Error loading properties:', error);
                document.getElementById('propertiesContainer').innerHTML = 
                    '<div class="col-span-full text-red-600 text-center py-8">Error: ' + error.message + '</div>';
            }
        }

        function populateCityFilter() {
            const cities = [...new Set(allProperties.map(p => p.city))].sort();
            const citySelect = document.getElementById('cityFilter');
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
        }

        function filterByCity() {
            const city = document.getElementById('cityFilter').value;
            filteredProperties = city ? allProperties.filter(p => p.city === city) : allProperties;
            filterByType();
        }

        function filterByType() {
            const type = document.getElementById('typeFilter').value;
            let result = filteredProperties;
            if (type) {
                result = filteredProperties.filter(p => p.propertyType === type);
            }
            displayProperties(result);
        }

        function displayProperties(properties) {
            const container = document.getElementById('propertiesContainer');

            if (properties.length === 0) {
                container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">No properties found</div>';
                return;
            }

            container.innerHTML = properties.map((prop, idx) => `
                <div class="bg-white rounded-lg shadow-lg overflow-hidden property-card">
                    <div class="carousel" id="carousel-${idx}">
                        <div class="carousel-container" id="container-${idx}">
                            ${(prop.photos && prop.photos.length > 0 
                                ? prop.photos 
                                : prop.professionalPhotos && prop.professionalPhotos.length > 0 
                                ? prop.professionalPhotos 
                                : ['https://via.placeholder.com/400x250?text=No+Photos']
                            ).map((photo, i) => `
                                <div class="carousel-slide">
                                    <img src="${photo}" alt="Property photo">
                                </div>
                            `).join('')}
                        </div>
                        ${(prop.photos && prop.photos.length > 1 || prop.professionalPhotos && prop.professionalPhotos.length > 1) ? `
                            <button class="carousel-nav prev" onclick="prevSlide(${idx})">❮</button>
                            <button class="carousel-nav next" onclick="nextSlide(${idx})">❯</button>
                        ` : ''}
                    </div>

                    <div class="p-4">
                        <h3 class="text-xl font-bold text-gray-800 mb-2">${prop.propertyName}</h3>
                        <p class="text-gray-600 mb-4">${prop.city}${prop.area ? ', ' + prop.area : ''}</p>

                        <div class="space-y-2 mb-4 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Type:</span>
                                <span class="font-semibold">${prop.propertyType}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Rent:</span>
                                <span class="font-semibold text-blue-600">₹${prop.monthlyRent || 'N/A'}/month</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Suitable For:</span>
                                <span class="font-semibold">${prop.genderSuitability || 'N/A'}</span>
                            </div>
                        </div>

                        <button onclick="showDetails('${prop.propertyId}')" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                            View Details
                        </button>
                    </div>
                </div>
            `).join('');
        }

        function prevSlide(carouselId) {
            const container = document.getElementById(`container-${carouselId}`);
            const offset = container.offsetWidth;
            container.style.transform = `translateX(${offset}px)`;
            setTimeout(() => {
                container.style.transition = 'none';
                container.appendChild(container.firstElementChild);
                container.style.transform = 'translateX(0)';
                setTimeout(() => {
                    container.style.transition = 'transform 0.3s';
                }, 0);
            }, 300);
        }

        function nextSlide(carouselId) {
            const container = document.getElementById(`container-${carouselId}`);
            const lastChild = container.lastElementChild;
            container.style.transition = 'none';
            container.insertBefore(lastChild, container.firstElementChild);
            container.style.transform = `translateX(-100%)`;
            setTimeout(() => {
                container.style.transition = 'transform 0.3s';
                container.style.transform = 'translateX(0)';
            }, 0);
        }

        function showDetails(propertyId) {
            const prop = allProperties.find(p => p.propertyId === propertyId);
            if (!prop) return;

            const modal = document.getElementById('detailsModal');
            const content = document.getElementById('modalContent');
            const title = document.getElementById('modalTitle');

            title.textContent = prop.propertyName;
            content.innerHTML = `
                <div class="space-y-4">
                    <div>
                        <h4 class="font-bold text-gray-800 mb-2">Property Details</h4>
                        <div class="bg-gray-50 p-4 rounded space-y-2">
                            <p><strong>Type:</strong> ${prop.propertyType}</p>
                            <p><strong>Address:</strong> ${prop.address || 'N/A'}</p>
                            <p><strong>City:</strong> ${prop.city}</p>
                            <p><strong>Area:</strong> ${prop.area || 'N/A'}</p>
                            <p><strong>Pincode:</strong> ${prop.pincode || 'N/A'}</p>
                            <p><strong>Description:</strong> ${prop.description || 'N/A'}</p>
                            <p><strong>Monthly Rent:</strong> ₹${prop.monthlyRent || 'N/A'}</p>
                            <p><strong>Deposit:</strong> ${prop.deposit || 'N/A'}</p>
                            <p><strong>Gender Suitability:</strong> ${prop.genderSuitability || 'N/A'}</p>
                            <p><strong>Amenities:</strong> ${(prop.amenities || []).join(', ') || 'N/A'}</p>
                        </div>
                    </div>

                    <div>
                        <h4 class="font-bold text-gray-800 mb-2">Contact Owner</h4>
                        <div class="bg-gray-50 p-4 rounded space-y-2">
                            <p><strong>Name:</strong> ${prop.ownerName}</p>
                            <p><strong>Email:</strong> <a href="mailto:${prop.ownerEmail}" class="text-blue-600">${prop.ownerEmail}</a></p>
                            <p><strong>Phone:</strong> <a href="tel:${prop.ownerPhone}" class="text-blue-600">${prop.ownerPhone}</a></p>
                        </div>
                    </div>
                </div>
            `;

            modal.classList.remove('hidden');
        }

        function closeModal() {
            document.getElementById('detailsModal').classList.add('hidden');
        }

        // Load on page load
        window.addEventListener('load', loadProperties);