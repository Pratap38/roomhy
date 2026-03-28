lucide.createIcons();

        // Load cities from MongoDB database
        async function loadDynamicCities() {
            try {
                // Get API base URL - support both local and production
                const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                    ? 'http://localhost:5001'
                    : 'https://api.roomhy.com';
                
                const response = await fetch(`${apiBase}/api/locations/cities`);
                if (!response.ok) throw new Error('Failed to fetch cities from MongoDB');
                
                const data = await response.json();
                let cityInfo = (data.data || []).map(city => {
                    // Support both old format (id, image) and new format (_id, imageUrl)
                    return {
                        _id: city._id || city.id,
                        name: city.name || city.cityName,
                        img: city.imageUrl || city.image || 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=2070&auto:format&fit=crop',
                        icon: city.icon || 'map-pin'
                    };
                });

                if (cityInfo.length > 0) {
                    rebuildCityList(cityInfo);
                } else {
                    console.log('No cities found in MongoDB');
                }
            } catch (error) {
                console.log('Could not load cities from MongoDB:', error.message);
                // Try fallback from localStorage
                try {
                    const citiesData = JSON.parse(localStorage.getItem('roomhy_cities') || '[]');
                    
                    // Extract city names and full objects
                    let cityInfo = citiesData.map(city => {
                        if (typeof city === 'string') {
                            return { name: city, img: '', icon: 'map-pin' };
                        }
                        if (typeof city === 'object' && city.name) {
                            return { name: city.name, img: '', icon: 'map-pin' };
                        }
                        return null;
                    }).filter(city => city !== null);

                    if (cityInfo.length > 0) {
                        rebuildCityList(cityInfo);
                    } else {
                        console.log('No cities configured');
                    }
                } catch (fallbackError) {
                    console.log('Fallback also failed:', fallbackError.message);
                }
            }
        }

        // ======================================================
        // START: `rebuildCityList` FUNCTION (Matching index with carousel)
        // ======================================================
        async function rebuildCityList(data) {
            const slider = document.getElementById('cities-category-slider');
            if (!slider) return;

            // Ensure data is valid
            if (!data || !Array.isArray(data) || data.length === 0) {
                console.warn('No city data provided to rebuildCityList, using defaults');
                data = [
                    { name: "Kota", img: "https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990262/roomhy/website/OIP.jpg", icon: "university" },
                    { name: "Sikar", img: "https://images.unsplash.com/photo-1549487560-671520624a9e?q=80&w=2070&auto:format&fit=crop", icon: "building-2" },
                    { name: "Indore", img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=2070&auto:format&fit=crop", icon: "landmark" }
                ];
            }

            // Fetch areas to get area images for each city
            let areasByCity = {};
            try {
                const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                    ? 'http://localhost:5001'
                    : 'https://api.roomhy.com';
                const response = await fetch(`${apiBase}/api/locations/areas`);
                if (response.ok) {
                    const areaData = await response.json();
                    (areaData.data || []).forEach(area => {
                        const cityName = area.city || area.cityName;
                        if (cityName) {
                            if (!areasByCity[cityName]) {
                                areasByCity[cityName] = [];
                            }
                            if (area.imageUrl || area.image) {
                                areasByCity[cityName].push({
                                    name: area.name,
                                    img: area.imageUrl || area.image
                                });
                            }
                        }
                    });
                }
            } catch (error) {
                console.log('Could not fetch areas:', error.message);
            }

            // Function to generate a single city card HTML with carousel
            const generateCityCard = (city, areaImages) => {
                const areaList = areaImages || areasByCity[city.name] || [];
                const carouselId = `carousel-${city.name.replace(/\s+/g, '-')}`;
                
                return `
                <div class="city-filter group flex flex-col items-center justify-start text-center flex-shrink-0 w-28 space-y-2">
                    <div class="w-24 h-24 rounded-full relative overflow-hidden neon-border cursor-pointer" id="${carouselId}" onmouseenter="startAreaCarousel(this);" onmouseleave="stopAreaCarousel(this);">
                        <!-- City Image (always visible initially) -->
                        <img src="${city.img || ''}" alt="Photo of ${city.name}" class="absolute inset-0 w-full h-full object-cover city-main-image transition-opacity duration-500" data-index="0">
                        
                        <!-- Area Images (carousel, hidden initially) -->
                        ${areaList.map((area, idx) => `
                            <img src="${area.img}" alt="Area: ${area.name}" class="absolute inset-0 w-full h-full object-cover city-area-image opacity-0 transition-opacity duration-500" data-index="${idx + 1}" data-area-name="${area.name}">
                        `).join('')}
                        
                        <!-- Fallback avatar -->
                        <div class="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 text-3xl font-bold text-gray-700 city-avatar hidden"></div>
                        <!-- Icon overlay -->
                        <div class="absolute inset-0 z-20 w-full h-full bg-white flex items-center justify-center transition-opacity duration-500 ease-in-out group-hover:opacity-0 group-focus:opacity-0 city-overlay-icon">
                            <i data-lucide="${city.icon || 'map-pin'}" class="w-9 h-9 text-gray-600"></i>
                        </div>
                    </div>
                    <h3 class="text-sm font-medium text-gray-800 leading-tight cursor-pointer" onclick="window.location.href = \`ourproperty?city=\${encodeURIComponent('${city.name}')}\`">${city.name}</h3>
                </div>
                `;
            };

            // Build the cards with carousel support
            let cardsHTML = '';
            data.forEach(city => {
                cardsHTML += generateCityCard(city, areasByCity[city.name] || []);
            });

            slider.innerHTML = cardsHTML;

            // Re-run lucide icons for the new elements
            lucide.createIcons();

            // Setup carousel rotation functions
            window.startAreaCarousel = function(element) {
                const carouselId = element.id;
                const container = document.getElementById(carouselId);
                if (!container) return;
                
                const areaImages = container.querySelectorAll('.city-area-image');
                if (areaImages.length === 0) return;

                // Start rotating through area images every 1.5 seconds
                const rotationKey = `carousel-${carouselId}`;
                if (window[rotationKey]) clearInterval(window[rotationKey]);
                
                let currentIndex = 0;
                window[rotationKey] = setInterval(() => {
                    // Hide all area images
                    areaImages.forEach(img => img.classList.add('opacity-0'));
                    
                    // Show next area image
                    currentIndex = (currentIndex + 1) % areaImages.length;
                    areaImages[currentIndex].classList.remove('opacity-0');
                }, 1500);
                
                // Show first area image immediately
                areaImages[0].classList.remove('opacity-0');
            };

            window.stopAreaCarousel = function(element) {
                const carouselId = element.id;
                const container = document.getElementById(carouselId);
                if (!container) return;

                const rotationKey = `carousel-${carouselId}`;
                if (window[rotationKey]) {
                    clearInterval(window[rotationKey]);
                    window[rotationKey] = null;
                }

                // Hide all area images and show city image
                const mainImage = container.querySelector('.city-main-image');
                const areaImages = container.querySelectorAll('.city-area-image');
                areaImages.forEach(img => img.classList.add('opacity-0'));
                if (mainImage) mainImage.classList.remove('opacity-0');
            };

            // Show letter-avatar fallback when image missing or fails to load
            document.querySelectorAll('.city-main-image').forEach(img => {
                const card = img.closest('.city-filter');
                const name = card.querySelector('h3').textContent.trim();
                const fallback = card.querySelector('.city-avatar');
                const overlay = card.querySelector('.city-overlay-icon');

                function showFallback(){
                    if(fallback){ fallback.textContent = name ? name[0].toUpperCase() : '?'; fallback.classList.remove('hidden'); }
                    img.classList.add('hidden');
                    if(overlay) overlay.classList.remove('hidden');
                }

                const src = img.getAttribute('src') || img.src || '';
                const isLocalPlaceholder = src && src.toString().toLowerCase().includes('images/');
                
                if(!src || isLocalPlaceholder){
                    showFallback();
                } else {
                    if(img.complete){
                        if(img.naturalWidth === 0) showFallback();
                    } else {
                        img.addEventListener('error', showFallback);
                        img.addEventListener('load', () => { 
                            if(fallback) fallback.classList.add('hidden'); 
                            img.classList.remove('hidden'); 
                        });
                    }
                }
            });

            // Re-attach click listeners to navigate to property page
            document.querySelectorAll('.city-filter h3').forEach(heading => {
                heading.addEventListener('click', function(e) {
                    const cityName = this.textContent.trim();
                    window.location.href = `ourproperty?city=${encodeURIComponent(cityName)}`;
                });
            });
        };
                }

                const src = img && (img.getAttribute('src') || img.src || '');
                // Treat local placeholder images (e.g., paths under `images/`) as missing so avatar is shown
                const isLocalPlaceholder = src && src.toString().toLowerCase().includes('images/');
                if(!img || !src || isLocalPlaceholder){
                    showFallback();
                } else {
                    if(img.complete){
                        if(img.naturalWidth === 0) showFallback();
                    } else {
                        img.addEventListener('error', showFallback);
                        img.addEventListener('load', () => { if(fallback) fallback.classList.add('hidden'); if(overlay) overlay.classList.remove('hidden'); img.classList.remove('hidden'); });
                    }
                }
            });

            // Re-attach click listeners to the dynamically created elements
            document.querySelectorAll('.city-filter').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const city = this.dataset.city;
                    if (city) {
                        // Navigate to ourproperty with city parameter
                        window.location.href = `ourproperty?city=${encodeURIComponent(city)}`;
                    }
                });
            });
        }
        // ======================================================
        // END: `rebuildCityList` FUNCTION
        // ======================================================

        // START: DYNAMIC TOP SPACES LOADER (FROM LOCALSTORAGE)
        // ======================================================
        function loadDynamicTopSpaces() {
            // Get cities from localStorage (added via location)
            let citiesData = JSON.parse(localStorage.getItem('roomhy_cities') || '[]');
            
            // Extract city names - handle both string and object formats
            let cityNames = citiesData.map(city => {
                if (typeof city === 'string') return city;
                if (typeof city === 'object' && city.name) return city.name;
                return null;
            }).filter(city => city !== null);
            
            // Filter out hardcoded cities (Indore and Kota)
            const customCities = cityNames.filter(city => 
                city.toLowerCase() !== 'indore' && city.toLowerCase() !== 'kota'
            );
            
            if (customCities.length === 0) {
                console.log('No custom cities configured. Top Spaces sections hidden.');
                return;
            }
            
            // Find the city with the most properties
            const promises = customCities.map(city => 
                fetch(`${API_URL}/api/website-enquiry/city/${encodeURIComponent(city)}`)
                    .then(res => res.json())
                    .then(data => ({
                        city: city,
                        count: (data.enquiries || []).length,
                        enquiries: data.enquiries || []
                    }))
                    .catch(err => {
                        console.error(`Error fetching data for ${city}:`, err);
                        return {
                            city: city,
                            count: 0,
                            enquiries: []
                        };
                    })
            );
            
            Promise.all(promises).then(results => {
                // Filter out cities with no properties
                const validResults = results.filter(r => r.count > 0);
                
                if (validResults.length === 0) {
                    console.log('No properties found in any city.');
                    return;
                }
                
                // Find city with highest property count
                const topCity = validResults.reduce((max, current) => 
                    current.count > max.count ? current : max
                );
                
                // Find the container to insert the section
                const topSpacesContainer = document.getElementById('dynamic-top-spaces-container');
                if (!topSpacesContainer) {
                    console.log('Could not find dynamic-top-spaces-container');
                    return;
                }
                
                const sectionId = `top-spaces-${topCity.city.toLowerCase().replace(/\s+/g, '-')}`;
                const sliderId = `spaces-slider-${topCity.city.toLowerCase().replace(/\s+/g, '-')}`;
                
                // Check if section already exists
                if (document.getElementById(sectionId)) return;
                
                const sectionHTML = `
                    <section id="${sectionId}" class="light-card rounded-2xl p-6">
                        <h2 id="${sectionId}-title" class="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Top Spaces in ${topCity.city}</h2>
                        <div class="relative -m-2">
                            <button class="spaces-prev-btn hidden absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 text-gray-700 sm:block lg:hidden" data-slider="${sliderId}">
                                <i data-lucide="chevron-left" class="w-6 h-6"></i>
                            </button>
                            <div id="${sliderId}" class="flex gap-6 overflow-x-auto pb-2 pt-2 -mx-4 px-4 snap-x snap-mandatory scroll-smooth horizontal-slider lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:p-0 lg:m-0">
                                <!-- Dynamic content will be loaded here -->
                            </div>
                            <button class="spaces-next-btn hidden absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 text-gray-700 sm:block lg:hidden" data-slider="${sliderId}">
                                <i data-lucide="chevron-right" class="w-6 h-6"></i>
                            </button>
                        </div>
                    </section>
                `;
                
                // Insert into the container
                topSpacesContainer.innerHTML = sectionHTML;
                
                // Render properties for the top city
                const slider = document.getElementById(sliderId);
                if (slider && topCity.enquiries.length > 0) {
                    const spaces = topCity.enquiries.slice(0, 4).map(enq => ({
                        img: enq.photos && enq.photos.length > 0 ? enq.photos[0] : 'https://via.placeholder.com/300x200?text=Property',
                        title: enq.property_name,
                        location: `${enq.locality || ''}, ${enq.city}`.trim(),
                        price: enq.rent || 'Contact',
                        facilities: enq.amenities || [],
                        id: enq.enquiry_id
                    }));
                    renderPropertySlider(spaces, slider);
                    // Re-run lucide icons for the new HTML
                    lucide.createIcons();
                } else {
                    slider.innerHTML = '<p class="text-gray-500 px-4">No properties available for this city yet.</p>';
                }
            });
        }

        // ======================================================
        // RENDER PROPERTY SLIDER
        // ======================================================
        function renderPropertySlider(spaces, slider) {
            let html = '';
            spaces.forEach(space => {
                let facilitiesHTML = '';
                if (space.facilities && space.facilities.length > 0) {
                    const amenitiesList = Array.isArray(space.facilities) ? space.facilities : [];
                    facilitiesHTML = amenitiesList.slice(0, 3).map(amenity => {
                        const iconMap = {
                            'wifi': 'wifi', 'ac': 'wind', 'tv': 'tv', 'laundry': 'shirt',
                            'parking': 'car', 'food': 'utensils', 'gym': 'dumbbell'
                        };
                        const icon = iconMap[amenity.toLowerCase()] || 'star';
                        return `<i data-lucide="${icon}" class="w-4 h-4"></i>`;
                    }).join('');
                }

                let oldPriceHTML = '';
                if (space.oldPrice) {
                    oldPriceHTML = `<p class="text-xs text-gray-500 line-through">?${space.oldPrice}</p>`;
                }

                const price = typeof space.price === 'number' ? space.price.toLocaleString() : space.price;

                html += `
                    <div class="group flex-shrink-0 snap-start w-80 lg:w-full">
                        <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
                            <div class="relative">
                                <img src="${space.img}" alt="${space.title}" class="w-full h-48 object-cover">
                                <div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5">
                                    <span class="w-2 h-2 bg-white rounded-full opacity-90"></span>
                                    <span class="w-2 h-2 bg-white rounded-full opacity-50"></span>
                                    <span class="w-2 h-2 bg-white rounded-full opacity-50"></span>
                                    <span class="w-2 h-2 bg-white rounded-full opacity-50"></span>
                                </div>
                            </div>

                            <div class="p-4 flex flex-col flex-grow">
                                <div class="flex justify-between items-start">
                                    <h3 class="font-bold text-lg text-gray-900">${space.title}</h3>
                                    <div class="text-right flex-shrink-0 ml-2">
                                        <p class="font-bold text-blue-600 text-lg">?${price}</p>
                                        ${oldPriceHTML}
                                        <p class="text-xs text-gray-500">onwards</p>
                                    </div>
                                </div>

                                <p class="text-gray-600 text-sm mt-1">${space.location}</p>

                                <div class="mt-4 pt-4 border-t border-gray-100">
                                    <h4 class="text-xs font-semibold text-gray-500 mb-2">Key Facilities</h4>
                                    <div class="flex items-center space-x-3 text-gray-600">
                                        ${facilitiesHTML}
                                    </div>
                                </div>

                                <a href="property?id=${space.id || ''}" class="block w-full text-center bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg text-sm hover:bg-blue-700 transition-colors mt-4">
                                    View Details
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            slider.innerHTML = html;
            lucide.createIcons();
        }

        // Load cities and top spaces on page load
        document.addEventListener('DOMContentLoaded', () => {
            loadDynamicCities();
            loadDynamicTopSpaces();
        });
        
        /*
        ============================================================
        JavaScript for Mobile Side Menu
        ============================================================
        */
        const menuToggle = document.getElementById('menu-toggle');
        const menuClose = document.getElementById('menu-close');
        const mobileMenu = document.getElementById('mobile-menu');
        const menuOverlay = document.getElementById('menu-overlay');

        if (menuToggle && mobileMenu && menuClose && menuOverlay) {
            menuToggle.addEventListener('click', () => {
                mobileMenu.classList.remove('translate-x-full');
                menuOverlay.classList.remove('hidden');
            });

            const closeMenu = () => {
                mobileMenu.classList.add('translate-x-full');
                menuOverlay.classList.add('hidden');
            };

            menuClose.addEventListener('click', closeMenu);
            menuOverlay.addEventListener('click', closeMenu);

            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', (e) => {
                    if (link.href.includes('#')) {
                        setTimeout(closeMenu, 100);
                    }
                    closeMenu();
                });
            });
        }
        
        /*
        ============================================================
        Top Spaces Slider Navigation
        ============================================================
        */
        document.addEventListener('click', (e) => {
            if (e.target.closest('.spaces-prev-btn') || e.target.closest('.spaces-next-btn')) {
                const btn = e.target.closest('button');
                const sliderId = btn.dataset.slider;
                if (sliderId) {
                    const slider = document.getElementById(sliderId);
                    if (slider) {
                        const isNext = btn.classList.contains('spaces-next-btn');
                        slider.scrollBy({
                            left: isNext ? 300 : -300,
                            behavior: 'smooth'
                        });
                    }
                }
            }
        });

        /*
        ============================================================
        Hero Slideshow
        ============================================================
        */
        const heroWrapper = document.getElementById('hero-image-wrapper');
        if (heroWrapper) {
            const heroImages = heroWrapper.querySelectorAll('img');
            const totalHeroImages = heroImages.length;
            let currentHeroIndex = 0;

            if (totalHeroImages > 1) {
                setInterval(() => {
                    const nextHeroIndex = (currentHeroIndex + 1) % totalHeroImages;
                    
                    heroImages[currentHeroIndex].classList.remove('opacity-100');
                    heroImages[currentHeroIndex].classList.add('opacity-0');
                    
                    heroImages[nextHeroIndex].classList.remove('opacity-0');
                    heroImages[nextHeroIndex].classList.add('opacity-100');
                    
                    currentHeroIndex = nextHeroIndex;
                }, 5000);
            }
        }

        /*
        ============================================================
        Load and Display Favorites
        ============================================================
        */
        function loadAndDisplayFavorites() {
            const favoritesGrid = document.getElementById('favorites-grid');
            const noFavoritesDiv = document.getElementById('no-favorites');
            
            // Get all favorites from localStorage
            const favorites = favoritesManager.getAllFavorites();
            
            if (!favorites || favorites.length === 0) {
                // Show no favorites message
                noFavoritesDiv.classList.remove('hidden');
                favoritesGrid.innerHTML = '';
                return;
            }
            
            // Hide no favorites message
            noFavoritesDiv.classList.add('hidden');
            
            // Render favorites
            favoritesGrid.innerHTML = favorites.map(property => {
                const propertyId = property._id || property.enquiry_id;
                const propertyImage = property.property_image || property.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image';
                const propertyName = property.property_name || property.title || 'Property';
                const propertyLocation = property.location || property.city || 'Location';
                const propertyPrice = property.price || 'Price Not Available';
                const propertyType = property.property_type || 'Residential';
                const bedrooms = property.bedrooms || 0;
                const bathrooms = property.bathrooms || 0;
                
                return `
                    <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
                        <div class="relative overflow-hidden h-48 bg-gray-200">
                            <img src="${propertyImage}" alt="${propertyName}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
                            <button class="favorite-btn absolute top-3 left-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition-colors" 
                                    data-property-id="${propertyId}" 
                                    title="Remove from favorites">
                                <i data-lucide="heart" class="w-5 h-5 fill-current"></i>
                            </button>
                        </div>
                        <div class="p-4">
                            <h3 class="text-lg font-semibold text-gray-800 mb-1 truncate">${propertyName}</h3>
                            <p class="text-sm text-gray-500 mb-2 flex items-center">
                                <i data-lucide="map-pin" class="w-4 h-4 mr-1"></i>
                                ${propertyLocation}
                            </p>
                            <p class="text-sm text-gray-600 mb-3">
                                <span class="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded">${propertyType}</span>
                            </p>
                            <div class="flex justify-between items-center text-sm text-gray-600 mb-3 pb-3 border-b">
                                <span class="flex items-center">
                                    <i data-lucide="bed" class="w-4 h-4 mr-1"></i>
                                    ${bedrooms} Beds
                                </span>
                                <span class="flex items-center">
                                    <i data-lucide="droplet" class="w-4 h-4 mr-1"></i>
                                    ${bathrooms} Baths
                                </span>
                            </div>
                            <div class="flex justify-between items-center">
                                <p class="text-lg font-bold text-blue-600">?${propertyPrice}</p>
                                <a href="property?id=${propertyId}" class="text-blue-600 hover:text-blue-700 font-medium text-sm">
                                    View Details
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Initialize lucide icons for newly added elements
            if (window.lucide) {
                lucide.createIcons();
            }
            
            // Add event listeners to remove buttons
            document.querySelectorAll('.favorite-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const propertyId = this.dataset.propertyId;
                    favoritesManager.removeFavorite(propertyId);
                    loadAndDisplayFavorites(); // Refresh the display
                    showNotification('Removed from favorites', 'info');
                });
            });
        }
        
        // Load favorites when page loads
        document.addEventListener('DOMContentLoaded', () => {
            loadAndDisplayFavorites();
        });
        
        // Also reload favorites if localStorage changes (e.g., from another tab)
        window.addEventListener('storage', (e) => {
            if (e.key === 'roomhy_favorites') {
                loadAndDisplayFavorites();
            }
        });
        
        // Helper function for notifications
        function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
                type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            } text-white font-medium`;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
