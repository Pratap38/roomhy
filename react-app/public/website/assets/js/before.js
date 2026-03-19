document.addEventListener("DOMContentLoaded", function() {
            lucide.createIcons();
        });
        lucide.createIcons();
        
        // ======================================================
        // START: CITY CLICK HANDLER WITH AUTH CHECK
        // ======================================================
        function handleCityClick(cityName) {
            // Check if user is logged in (check for valid token or user object)
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const userObj = localStorage.getItem('user') || sessionStorage.getItem('user');
            const isLoggedIn = !!(token || (userObj && userObj !== 'undefined' && userObj.length > 0));
            
            console.log('City clicked:', cityName);
            console.log('Token:', token);
            console.log('UserObj:', userObj);
            console.log('Is Logged In:', isLoggedIn);
            
            if (isLoggedIn) {
                // User is logged in, redirect to index
                window.location.href = 'index';
            } else {
                // User is not logged in, show signup modal
                showSignupModal(cityName);
            }
        }
        
        function showSignupModal(cityName) {
            const modal = document.getElementById('signupPromptModal');
            const cityNameSpan = document.getElementById('selectedCityName');
            const redirectBtn = document.getElementById('signupRedirectBtn');
            
            if (modal && cityNameSpan) {
                cityNameSpan.textContent = cityName;
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                
                // Update button click handler
                redirectBtn.onclick = function() {
                    window.location.href = 'signup';
                };
            }
        }
        
        function closeSignupModal() {
            const modal = document.getElementById('signupPromptModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }
        // ======================================================
        // END: CITY CLICK HANDLER WITH AUTH CHECK
        // ======================================================
        
        // ======================================================
        // START: JAVASCRIPT CITY DATA (Dynamically loads from MongoDB)
        // Fetches approved properties and extracts unique cities
        // ======================================================
        (function(){
            var defaultCities = [
                { name: "Kota", img: "https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990262/roomhy/website/OIP.jpg", icon: "university" },
                { name: "Sikar", img: "https://images.unsplash.com/photo-1549487560-671520624a9e?q=80&w=2070&auto:format&fit=crop", icon: "building-2" },
                { name: "Indore", img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=2070&auto:format&fit=crop", icon: "landmark" }
            ];

            // Initialize with defaults immediately
            window.cityInfo = defaultCities;

            // Fetch cities from MongoDB database
            async function loadCitiesFromProperties() {
                try {
                    // Get API base URL - support both local and production
                    const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                        ? 'http://localhost:5001'
                        : 'https://api.roomhy.com';
                    
                    const response = await fetch(`${apiBase}/api/locations/cities`);
                    if (!response.ok) throw new Error('Failed to fetch cities from MongoDB');
                    
                    const data = await response.json();
                    let cities = (data.data || []).map(city => {
                        // Support both old format (id, image) and new format (_id, imageUrl)
                        return {
                            _id: city._id || city.id,
                            name: city.name || city.cityName,
                            img: city.imageUrl || city.image || 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=2070&auto:format&fit=crop',
                            icon: city.icon || 'map-pin'
                        };
                    });
                    
                    if (cities.length > 0) {
                        window.cityInfo = cities;
                        if (typeof rebuildCityList === 'function') {
                            rebuildCityList(window.cityInfo);
                        }
                    } else {
                        window.cityInfo = defaultCities;
                    }
                } catch (error) {
                    console.log('Could not fetch from MongoDB, using default cities:', error.message);
                    // Fallback: Try to fetch from approved properties
                    try {
                        const response = await fetch(`${apiBase}/api/website-enquiry/all`);
                        if (!response.ok) throw new Error('Failed to fetch properties');
                        
                        const data = await response.json();
                        let properties = (data.enquiries || []).filter(p => p.status === 'completed');
                        
                        // Extract unique cities from approved properties
                        const citiesMap = new Map();
                        properties.forEach(prop => {
                            const city = prop.city;
                            if (city && !citiesMap.has(city)) {
                                // Try to find a matching default city for consistent images/icons
                                const defaultCity = defaultCities.find(c => c.name.toLowerCase() === city.toLowerCase());
                                citiesMap.set(city, defaultCity || {
                                    name: city,
                                    img: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=2070&auto:format&fit=crop',
                                    icon: 'map-pin'
                                });
                            }
                        });
                        
                        const cities = Array.from(citiesMap.values());
                        if (cities.length > 0) {
                            window.cityInfo = cities;
                            if (typeof rebuildCityList === 'function') {
                                rebuildCityList(window.cityInfo);
                            }
                        } else {
                            window.cityInfo = defaultCities;
                        }
                    } catch (fallbackError) {
                        console.log('Using default cities:', fallbackError.message);
                        window.cityInfo = defaultCities;
                    }
                }
            }

            // Load cities on page load
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', loadCitiesFromProperties);
            } else {
                loadCitiesFromProperties();
            }

            // Also try to load helper script if available
            var s = document.createElement('script');
            s.src = 'js/locations-sync.js';
            s.onload = function(){
                var cities = (window.roomhyLocations && typeof window.roomhyLocations.getCities === 'function') ? window.roomhyLocations.getCities() : [];
                if (cities && cities.length) {
                    window.cityInfo = cities;
                    if (typeof rebuildCityList === 'function') rebuildCityList(window.cityInfo);
                }
                // subscribe for updates from admin UI
                if (window.roomhyLocations && typeof window.roomhyLocations.onChange === 'function') {
                    window.roomhyLocations.onChange(function(c){
                        window.cityInfo = (c && c.length) ? c : defaultCities;
                        if (typeof rebuildCityList === 'function') rebuildCityList(window.cityInfo);
                    });
                }
            };
            s.onerror = function(){ window.cityInfo = defaultCities; };
            document.head.appendChild(s);
        })();
        // ======================================================
        // END: JAVASCRIPT CITY DATA
        // ======================================================
        
        // ======================================================
        // START: JAVASCRIPT PROPERTY DATA (Existing data maintained)
        // ======================================================
        const propertyData = {
            "Indore": [
                { 
                    img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=2070&auto:format&fit=crop", 
                    title: "Urban Stay PG", 
                    location: "Chandan Nagar, Indore", 
                    price: "7,999", 
                    oldPrice: "11,999",
                    facilities: ['wifi', 'wind', 'tv'],
                    moreFacilities: 11
                },
                { 
                    img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto:format&fit=crop", 
                    title: "Skyline Heights", 
                    location: "Chandan Nagar, Indore", 
                    price: "12,000", 
                    oldPrice: "14,500",
                    facilities: ['wifi', 'wind', 'utensils'],
                    moreFacilities: 19
                },
                { 
                    img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1974&auto:format&fit=crop", 
                    title: "Student Hostel", 
                    location: "Landmark, Indore", 
                    price: "6,000", 
                    oldPrice: "6,500",
                    facilities: ['wifi', 'tv', 'utensils'],
                    moreFacilities: 0 
                },
                { 
                    img: "https://images.unsplash.com/photo-1600585154340-be6161a5b4a4c?q=80&w=2070&auto:format&fit=crop", 
                    title: "Cozy Backpackers Hostel", 
                    location: "Landmark, Indore",
                    price: "4,500", 
                    oldPrice: "5,999",
                    facilities: ['wifi', 'wind', 'tv'],
                    moreFacilities: 13
                }
            ],
            "Kota": [
                { 
                    img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=2070&auto:format&fit=crop", 
                    title: "Urban Stay PG", 
                    location: "Chandan Nagar, Indore", 
                    price: "7,999", 
                    oldPrice: "11,999",
                    facilities: ['wifi', 'wind', 'tv'],
                    moreFacilities: 11
                },
                { 
                    img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto:format&fit=crop", 
                    title: "Skyline Heights", 
                    location: "Chandan Nagar, Indore", 
                    price: "12,000", 
                    oldPrice: "14,500",
                    facilities: ['wifi', 'wind', 'utensils'],
                    moreFacilities: 19
                },
                { 
                    img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1974&auto:format&fit=crop", 
                    title: "Student Hostel", 
                    location: "Landmark, Indore", 
                    price: "6,000", 
                    oldPrice: "6,500",
                    facilities: ['wifi', 'tv', 'utensils'],
                    moreFacilities: 0 
                },
                { 
                    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto:format&fit=crop", 
                    title: "Cozy Backpackers Hostel", 
                    location: "Landmark, Indore",
                    price: "4,500", 
                    oldPrice: "5,999",
                    facilities: ['wifi', 'wind', 'tv'],
                    moreFacilities: 13
                }       
            ],
            // New City added: Sikkar
            "Sikkar": [
                { 
                    img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=2070&auto:format&fit=crop", 
                    title: "Rao's PG Hub", 
                    location: "Piprali Rd, Sikar", 
                    price: "5,999", 
                    oldPrice: "7,000",
                    facilities: ['wifi', 'tv', 'dumbbell'],
                    moreFacilities: 8
                },
                { 
                    img: "https://images.unsplash.com/photo-1557425956-783307221319?q=80&w=2070&auto:format&fit=crop", 
                    title: "Coaching Lane Hostel", 
                    location: "Fatehpur Rd, Sikar", 
                    price: "4,500", 
                    oldPrice: null,
                    facilities: ['wifi', 'wind'],
                    moreFacilities: 0 
                },
                { 
                    img: "https://images.unsplash.com/photo-1517404215738-15263e9f9178?q=80&w=2070&auto:format&fit=crop", 
                    title: "Vidya Vihar PG", 
                    location: "Bajor, Sikar",
                    price: "6,500", 
                    oldPrice: "8,000",
                    facilities: ['wifi', 'tv'],
                    moreFacilities: 13
                }
            ],
            "Gurugram": [
                { img: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?q=80&w=2070&auto:format&fit=crop", title: "Cyber Hub Co-Living", location: "DLF Phase 3, Gurugram", price: "15,000", oldPrice: "16,000", facilities: ['wifi', 'wind', 'dumbbell'], moreFacilities: 8 },
                { img: "https://images.unsplash.com/photo-1613553483054-c3b6c5c84c6c?q=80&w=1974&auto:format&fit=crop", title: "Sector 44 Student PG", location: "Sector 44, Gurugram", price: "11,000", oldPrice: null, facilities: ['wifi', 'tv'], moreFacilities: 0 }
            ],
            "Mumbai": [
                { img: "https://images.unsplash.com/photo-1560185007-c5ca9d2c01f8?q=80&w=1974&auto:format&fit=crop", title: "Vile Parle Student Stay", location: "Vile Parle, Mumbai", price: "20,000", oldPrice: "21,500", facilities: ['wifi', 'wind'], moreFacilities: 3 },
                { img: "https://images.unsplash.com/photo-1574873215043-4411946153bc?q=80&w=2071&auto:format&fit=crop", title: "Andheri West Hostel", location: "Andheri West, Mumbai", price: "18,500", oldPrice: null, facilities: ['wifi'], moreFacilities: 0 },
                { img: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=2070&auto:format&fit=crop", title: "Powai Lake View PG", location: "Powai, Mumbai", price: "22,000", oldPrice: "24,000", facilities: ['wifi', 'wind', 'tv'], moreFacilities: 7 }
            ],
            "Bangalore": [
                { img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1916&auto:format&fit=crop", title: "The Scholar's Loft", location: "Koramangala, BLR", price: "16,500", oldPrice: "17,000", facilities: ['wifi', 'wind', 'tv'], moreFacilities: 10 },
                { img: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069&auto:format&fit=crop", title: "Electronic City Hub", location: "Electronic City, BLR", price: "14,000", oldPrice: null, facilities: ['wifi', 'tv'], moreFacilities: 4 }
            ],
            "Delhi": [
                { img: "https://images.unsplash.com/photo-1567016432779-1fee749a1532?q=80&w=1974&auto:format&fit=crop", title: "Campus Corner", location: "North Campus, Delhi", price: "13,000", oldPrice: "14,000", facilities: ['wifi', 'wind'], moreFacilities: 6 },
                { img: "https://images.unsplash.com/photo-1600607687930-1e3c3b9b4a4c?q=80&w=1974&auto:format&fit=crop", title: "South Ex Luxury Stay", location: "South Extension, Delhi", price: "17,000", oldPrice: "18,500", facilities: ['wifi', 'wind', 'tv'], moreFacilities: 9 }
            ]
        };
        // ======================================================
        // END: JAVASCRIPT PROPERTY DATA
        // ======================================================

        // ======================================================
        // START: JAVASCRIPT TESTIMONIAL DATA
        // ======================================================
        const testimonialData = [
            {
                img: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
                name: "Priya Sharma",
                location: "Engineering Student, Christ University",
                text: "Roomhy made finding a PG in Bangalore so easy! The place was exactly as shown online. Totally trustworthy and a lifsaver for a first-timer like me."
            },
            {
                img: "https://i.pravatar.cc/150?u=a042581f4e29026704a",
                name: "Rohan Mehra",
                location: "Medical Student, AIIMS",
                text: "I was worried about finding a good hostel in Delhi. The verified listings and clear pricing on Roomhy gave me confidence. Found a great place near my campus."
            },
            {
                img: "https://i.pravatar.cc/150?u=a042581f4e29026704b",
                name: "Anjali Singh",
                location: "Design Student, NIFT",
                text: "The customer support is amazing! They helped me with all my queries before booking. The apartment I found is perfect and exactly what I needed."
            },
            {
                img: "https://i.pravatar.cc/150?u=a042581f4e29026704c",
                name: "Vikram Kumar",
                location: "IIT Student, Mumbai",
                text: "Finding a place in Mumbai within budget seemed impossible. Roomhy's map search and filter options were super helpful. Got a shared flat with great roommates."
            },
            {
                img: "https://i.pravatar.cc/150?u=a042581f4e29026704e",
                name: "Sneha Patel",
                location: "Law Student, Pune",
                text: "The zero brokerage is a huge plus. Saved a lot of money which I could use for my deposits. The platform is very transparent and easy to use."
            },
            {
                img: "https://i.pravatar.cc/150?u=a042581f4e29026704f",
                name: "Arjun Reddy",
                location: "MBA Student, ISB",
                text: "As an international student, the process was seamless. Verified properties gave me peace of mind. Booked my studio apartment from my home country."
            }
        ];
        // ======================================================
        // END: JAVASCRIPT TESTIMONIAL DATA
        // ======================================================

        // ======================================================
        // START: `rebuildCityList` FUNCTION (Replaces the infinite slider logic)
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
                <div class="city-filter group flex flex-col items-center justify-start text-center flex-shrink-0 w-28 space-y-2 cursor-pointer" onclick="handleCityClick('${city.name}')">
                    <div class="w-24 h-24 rounded-full relative overflow-hidden neon-border" id="${carouselId}" onmouseenter="startAreaCarousel(this);" onmouseleave="stopAreaCarousel(this);">
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
                    <h3 class="text-sm font-medium text-gray-800 leading-tight">${city.name}</h3>
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
        }
        // ======================================================
        // END: `rebuildCityList` FUNCTION
        // ======================================================

        // ======================================================
        // START: AREA CAROUSEL FUNCTIONS
        // ======================================================
        let carouselIntervals = new Map();

        function startAreaCarousel(element) {
            const images = element.querySelectorAll('img');
            if (images.length <= 1) return; // No area images to carousel

            let currentIndex = 1; // Start from first area image (index 1)
            const totalAreaImages = images.length - 1; // Exclude city image

            // Clear any existing interval for this element
            if (carouselIntervals.has(element)) {
                clearInterval(carouselIntervals.get(element));
            }

            // Immediately show first area image
            images.forEach((img, idx) => {
                img.style.opacity = idx === 1 ? '1' : '0';
            });

            const interval = setInterval(() => {
                // Hide all images
                images.forEach(img => img.style.opacity = '0');

                // Show next area image
                currentIndex = ((currentIndex - 1 + 1) % totalAreaImages) + 1; // Cycle from 1 to total-1
                images[currentIndex].style.opacity = '1';
            }, 2000); // Change image every 2 seconds

            carouselIntervals.set(element, interval);
        }

        function stopAreaCarousel(element) {
            // Clear interval
            if (carouselIntervals.has(element)) {
                clearInterval(carouselIntervals.get(element));
                carouselIntervals.delete(element);
            }

            // Reset to first image (city image)
            const images = element.querySelectorAll('img');
            images.forEach((img, index) => {
                img.style.opacity = index === 0 ? '1' : '0';
            });
        }
        // ======================================================
        // END: AREA CAROUSEL FUNCTIONS
        // ======================================================

        // ======================================================
        // START: `selectCity` FUNCTION (Filter properties by city on page)
        // ======================================================
        function selectCity(city) {
            const topSpaces = document.getElementById('top-spaces');
            if (topSpaces) {
                topSpaces.style.display = 'block';
                const title = document.getElementById('top-spaces-title');
                if (title) title.textContent = `Top Spaces in ${city}`;
                loadPropertiesForCity(city, 'spaces-slider');
                // Scroll to the section smoothly
                topSpaces.scrollIntoView({ behavior: 'smooth' });
            }
        }
        // ======================================================
        // END: `selectCity` FUNCTION
        // ======================================================


        // ======================================================
        // START: `updateTopSpaces` FUNCTION (FOR INDORE)
        // ======================================================
        function updateTopSpaces(cityName) {
            const spacesTitle = document.getElementById('top-spaces-title');
            const spacesSlider = document.querySelector('#top-spaces #spaces-slider');
            
            if (!spacesTitle || !spacesSlider) {
                console.error("Could not find 'top-spaces-title' or 'spaces-slider'.");
                return;
            }

            // Fallback to Indore if city data is missing
            const spaces = propertyData[cityName] || propertyData["Indore"]; 
            
            spacesTitle.innerText = `Top Spaces in ${cityName}`;
            spacesSlider.innerHTML = '';
            
            if (!spaces || spaces.length === 0) {
                spacesSlider.innerHTML = '<p class="text-gray-500 px-4">No properties found for this city.</p>';
                return;
            }
            
            let newSlidesHTML = '';
            spaces.forEach(space => {
                let facilitiesHTML = '';
                if (space.facilities && space.facilities.length > 0) {
                    facilitiesHTML = space.facilities.map(icon => 
                        `<i data-lucide="${icon}" class="w-4 h-4"></i>`
                    ).join('');
                }
                
                let moreFacilitiesHTML = '';
                if (space.moreFacilities && space.moreFacilities > 0) {
                    moreFacilitiesHTML = `<span class="text-xs font-bold text-blue-600 bg-blue-100 py-0.5 px-1.5 rounded">+${space.moreFacilities}</span>`;
                }

                let oldPriceHTML = '';
                if (space.oldPrice) {
                    oldPriceHTML = `<p class="text-xs text-gray-500 line-through">?${space.oldPrice}</p>`;
                }

                newSlidesHTML += `
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
                                        <p class="font-bold text-blue-600 text-lg">?${space.price}</p>
                                        ${oldPriceHTML}
                                        <p class="text-xs text-gray-500">onwards</p>
                                    </div>
                                </div>

                                <p class="text-gray-600 text-sm mt-1">${space.location}</p>

                                <div class="mt-4 pt-4 border-t border-gray-100">
                                    <h4 class="text-xs font-semibold text-gray-500 mb-2">Key Facilities</h4>
                                    <div class="flex items-center space-x-3 text-gray-600">
                                        ${facilitiesHTML}
                                        ${moreFacilitiesHTML}
                                    </div>
                                    </div>

                                <a href="#" class="block w-full text-center bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg text-sm hover:bg-blue-700 transition-colors mt-4">
                                    View Details
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            spacesSlider.innerHTML = newSlidesHTML;
            lucide.createIcons();
        }
        // ======================================================
        // END: `updateTopSpaces` FUNCTION
        // ======================================================

        // ======================================================
        // START: `updateTopSpacesKota` FUNCTION (FOR KOTA)
        // ======================================================
        function updateTopSpacesKota(cityName) {
            const spacesTitle = document.getElementById('top-spaces-title-kota');
            const spacesSlider = document.querySelector('#top-spaces-kota #spaces-slider-kota');
            
            if (!spacesTitle || !spacesSlider) {
                console.error("Could not find 'top-spaces-title-kota' or 'spaces-slider-kota'.");
                return;
            }

            const spaces = propertyData[cityName] || propertyData["Kota"]; // Fallback to Kota
            
            spacesTitle.innerText = `Top Spaces in ${cityName}`;
            spacesSlider.innerHTML = '';
            
            if (!spaces || spaces.length === 0) {
                spacesSlider.innerHTML = '<p class="text-gray-500 px-4">No properties found for this city.</p>';
                return;
            }
            
            let newSlidesHTML = '';
            spaces.forEach(space => {
                let facilitiesHTML = '';
                if (space.facilities && space.facilities.length > 0) {
                    facilitiesHTML = space.facilities.map(icon => 
                        `<i data-lucide="${icon}" class="w-4 h-4"></i>`
                    ).join('');
                }
                
                let moreFacilitiesHTML = '';
                if (space.moreFacilities && space.moreFacilities > 0) {
                    moreFacilitiesHTML = `<span class="text-xs font-bold text-blue-600 bg-blue-100 py-0.5 px-1.5 rounded">+${space.moreFacilities}</span>`;
                }

                let oldPriceHTML = '';
                if (space.oldPrice) {
                    oldPriceHTML = `<p class="text-xs text-gray-500 line-through">?${space.oldPrice}</p>`;
                }

                newSlidesHTML += `
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
                                        <p class="font-bold text-blue-600 text-lg">?${space.price}</p>
                                        ${oldPriceHTML}
                                        <p class="text-xs text-gray-500">onwards</p>
                                    </div>
                                </div>

                                <p class="text-gray-600 text-sm mt-1">${space.location}</p>

                                <div class="mt-4 pt-4 border-t border-gray-100">
                                    <h4 class="text-xs font-semibold text-gray-500 mb-2">Key Facilities</h4>
                                    <div class="flex items-center space-x-3 text-gray-600">
                                        ${facilitiesHTML}
                                        ${moreFacilitiesHTML}
                                    </div>
                                    </div>

                                <a href="#" class="block w-full text-center bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg text-sm hover:bg-blue-700 transition-colors mt-4">
                                    View Details
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            spacesSlider.innerHTML = newSlidesHTML;
            lucide.createIcons();
        }
        // ======================================================
        // END: `updateTopSpacesKota` FUNCTION
        // ======================================================

        // ======================================================
        // START: `updateFeaturedProperties` FUNCTION (Button Text Changed, Desktop Slider changed)
        // ======================================================
        function updateFeaturedProperties() {
            const spacesSlider = document.querySelector('#featured #featured-slider');
            
            if (!spacesSlider) {
                console.error("Could not find '#featured-slider'.");
                return;
            }

            // Fetch trending enquiries from MongoDB API
            fetch(API_URL + '/api/website-enquiry/all')
                .then(response => {
                    if (!response.ok) throw new Error('Failed to fetch properties');
                    return response.json();
                })
                .then(data => {
                    const enquiries = data.enquiries || [];
                    
                    if (enquiries.length === 0) {
                        spacesSlider.innerHTML = '<p class="text-gray-500 px-4">No properties available at the moment.</p>';
                        return;
                    }

                    // Convert enquiries to property format (just use first 4 for trending)
                    const properties = enquiries.slice(0, 8).map((enq, idx) => ({
                        img: enq.photos && enq.photos.length > 0 ? enq.photos[0] : 'https://images.unsplash.com/photo-1567016432779-1fee749a1532?q=80&w=1974&auto=format&fit=crop',
                        title: enq.property_name,
                        location: `${enq.locality || ''}, ${enq.city}`.trim(),
                        price: enq.rent || 'Contact',
                        facilities: enq.amenities || [],
                        id: enq.enquiry_id
                    }));

                    renderTrendingProperties(properties, spacesSlider);
                })
                .catch(error => {
                    console.error('Error fetching trending properties:', error);
                    // Fallback to hardcoded data
                    const fallbackSpaces = propertyData["Indore"] || [];
                    if (fallbackSpaces.length > 0) {
                        renderTrendingProperties(fallbackSpaces, spacesSlider);
                    } else {
                        spacesSlider.innerHTML = '<p class="text-gray-500 px-4">Unable to load properties at the moment.</p>';
                    }
                });
        }

        // ======================================================
        // RENDER TRENDING PROPERTIES
        // ======================================================
        function renderTrendingProperties(spaces, spacesSlider) {
            if (!spaces || spaces.length === 0) {
                spacesSlider.innerHTML = '<p class="text-gray-500 px-4">No properties found.</p>';
                return;
            }

            let newSlidesHTML = '';
            spaces.forEach(space => {
                let facilitiesHTML = '';
                if (space.facilities && space.facilities.length > 0) {
                    const amenitiesList = Array.isArray(space.facilities) ? space.facilities : [];
                    facilitiesHTML = amenitiesList.slice(0, 3).map(amenity => {
                        // Map amenity names to lucide icons
                        const iconMap = {
                            'wifi': 'wifi', 'ac': 'wind', 'tv': 'tv', 'laundry': 'shirt',
                            'parking': 'car', 'food': 'utensils', 'gym': 'dumbbell'
                        };
                        const icon = iconMap[amenity.toLowerCase()] || 'star';
                        return `<i data-lucide="${icon}" class="w-4 h-4"></i>`;
                    }).join('');
                }

                const price = typeof space.price === 'number' ? space.price.toLocaleString() : space.price;
                
                newSlidesHTML += `
                    <div class="group flex-shrink-0 snap-start w-80 lg:w-96">
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
                                    <div>
                                        <h3 class="font-bold text-lg text-gray-900">${space.title}</h3>
                                        <p class="text-gray-600 text-sm mt-1">${space.location}</p>
                                    </div>
                                    <div class="text-right flex-shrink-0 ml-2">
                                        <p class="font-bold text-gray-900 text-lg">?${price}</p>
                                        <p class="text-xs text-gray-500">onwards</p>
                                    </div>
                                </div>

                                <div class="mt-4 pt-4 border-t border-gray-100">
                                    <h4 class="text-xs font-semibold text-gray-500 mb-2">Key Facilities</h4>
                                    <div class="flex items-center space-x-3 text-gray-600">
                                        ${facilitiesHTML}
                                    </div>
                                </div>

                                <a href="property?id=${space.id || ''}" class="block w-full text-center bg-blue-600 text-white font-medium py-2 px-4 rounded-lg text-sm hover:bg-blue-700 transition-colors mt-auto pt-2.5">
                                    View Details
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            spacesSlider.innerHTML = newSlidesHTML;
            lucide.createIcons();
        }
        // ======================================================
        // END: RENDER TRENDING PROPERTIES
        // ======================================================

        // ======================================================
        // START: DYNAMIC TOP SPACES LOADER (FROM API)
        // ======================================================
        function loadDynamicTopSpaces() {
            // Get cities from MongoDB API (with localStorage fallback)
            async function getCities() {
                try {
                    const response = await fetch(`${API_URL}/api/cities`);
                    if (!response.ok) throw new Error('API failed');
                    const data = await response.json();
                    return (data.data || []).map(c => c.name);
                } catch (err) {
                    console.log('Fallback to localStorage for cities:', err);
                    // Fallback: Get cities from localStorage
                    let citiesData = JSON.parse(localStorage.getItem('roomhy_cities') || '[]');
                    return citiesData.map(city => {
                        if (typeof city === 'string') return city;
                        if (typeof city === 'object' && city.name) return city.name;
                        return null;
                    }).filter(city => city !== null);
                }
            }

            getCities().then(cityNames => {
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
                const topSpacesKotaSection = document.getElementById('top-spaces-kota');
                if (!topSpacesKotaSection) {
                    console.log('Could not find top-spaces-kota container');
                    return;
                }
                
                const container = topSpacesKotaSection.parentElement;
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
                
                // Insert before the 'why-choose-us' section
                const whyChooseUs = document.getElementById('why-choose-us');
                if (whyChooseUs) {
                    whyChooseUs.insertAdjacentHTML('beforebegin', sectionHTML);
                } else {
                    container.appendChild(new DOMParser().parseFromString(sectionHTML, 'text/html').body.firstChild);
                }
                
                // Render properties for the top city
                const slider = document.getElementById(sliderId);
                if (slider && topCity.enquiries.length > 0) {
                    const spaces = topCity.enquiries.slice(0, 4).map(enq => ({
                        img: enq.photos && enq.photos.length > 0 ? enq.photos[0] : 'https://images.unsplash.com/photo-1567016432779-1fee749a1532?q=80&w=1974&auto=format&fit=crop',
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
            }).catch(err => {
                console.error('Error loading cities:', err);
                // If all fails, just don't show the dynamic section
            });
        }
        
        // ======================================================
        // LOAD PROPERTIES FOR A SPECIFIC CITY
        // ======================================================
        function loadPropertiesForCity(city, sliderId) {
            const slider = document.getElementById(sliderId);
            
            if (!slider) return;
            
            // Fetch properties from MongoDB API for this specific city
            fetch(`${API_URL}/api/website-enquiry/city/${encodeURIComponent(city)}`)
                .then(response => {
                    if (!response.ok) throw new Error('Failed to fetch properties');
                    return response.json();
                })
                .then(data => {
                    const enquiries = data.enquiries || [];
                    
                    if (enquiries.length === 0) {
                        slider.innerHTML = '<p class="text-gray-500 px-4">No properties available for this city yet.</p>';
                        return;
                    }
                    
                    // Convert enquiries to property format
                    const spaces = enquiries.slice(0, 4).map(enq => ({
                        img: enq.photos && enq.photos.length > 0 ? enq.photos[0] : 'https://images.unsplash.com/photo-1567016432779-1fee749a1532?q=80&w=1974&auto=format&fit=crop',
                        title: enq.property_name,
                        location: `${enq.locality || ''}, ${enq.city}`.trim(),
                        price: enq.rent || 'Contact',
                        facilities: enq.amenities || [],
                        id: enq.enquiry_id
                    }));
                    
                    renderPropertySlider(spaces, slider);
                })
                .catch(error => {
                    console.error(`Error fetching properties for ${city}:`, error);
                    // Try fallback to propertyData
                    const spaces = propertyData[city];
                    if (spaces && spaces.length > 0) {
                        renderPropertySlider(spaces, slider);
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
                    facilitiesHTML = space.facilities.map(icon => 
                        `<i data-lucide="${icon}" class="w-4 h-4"></i>`
                    ).join('');
                }
                
                let moreFacilitiesHTML = '';
                if (space.moreFacilities && space.moreFacilities > 0) {
                    moreFacilitiesHTML = `<span class="text-xs font-bold text-blue-600 bg-blue-100 py-0.5 px-1.5 rounded">+${space.moreFacilities}</span>`;
                }

                let oldPriceHTML = '';
                if (space.oldPrice) {
                    oldPriceHTML = `<p class="text-xs text-gray-500 line-through">?${space.oldPrice}</p>`;
                }

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
                                        <p class="font-bold text-blue-600 text-lg">?${space.price}</p>
                                        ${oldPriceHTML}
                                        <p class="text-xs text-gray-500">onwards</p>
                                    </div>
                                </div>

                                <p class="text-gray-600 text-sm mt-1">${space.location}</p>

                                <div class="mt-4 pt-4 border-t border-gray-100">
                                    <h4 class="text-xs font-semibold text-gray-500 mb-2">Key Facilities</h4>
                                    <div class="flex items-center space-x-3 text-gray-600">
                                        ${facilitiesHTML}
                                        ${moreFacilitiesHTML}
                                    </div>
                                </div>

                                <a href="#" class="block w-full text-center bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg text-sm hover:bg-blue-700 transition-colors mt-4">
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
        // ======================================================
        // END: `renderTrendingProperties` FUNCTION
        // ======================================================

        // ======================================================
        // START: `buildTestimonialRow` FUNCTION (Updated for size/text box)
        // ======================================================
        function buildTestimonialRow(data, containerId) {
            const track = document.getElementById(containerId);
            if (!track) return;

            let cardsHTML = '';
            data.forEach(item => {
                cardsHTML += `
                    <div class="testimonial-card">
                        <div class="flex items-start mb-4">
                            <img src="${item.img}" alt="${item.name}" class="w-12 h-12 rounded-full mr-4 flex-shrink-0">
                            <div>
                                <h4 class="font-bold text-gray-900">${item.name}</h4>
                                <p class="text-sm text-gray-500">${item.location}</p>
                            </div>
                        </div>
                        <div class="flex mb-3">
                            <i data-lucide="star" class="w-5 h-5 text-yellow-400 fill-current"></i>
                            <i data-lucide="star" class="w-5 h-5 text-yellow-400 fill-current"></i>
                            <i data-lucide="star" class="w-5 h-5 text-yellow-400 fill-current"></i>
                            <i data-lucide="star" class="w-5 h-5 text-yellow-400 fill-current"></i>
                            <i data-lucide="star" class="w-5 h-5 text-yellow-400 fill-current"></i>
                        </div>
                        <p class="text-gray-600 text-base break-words whitespace-normal">${item.text}</p>
                    </div>
                `;
            });
            
            // Duplicate the cards to create a seamless loop
            track.innerHTML = cardsHTML + cardsHTML;
        }
        // ======================================================
        // END: `buildTestimonialRow` FUNCTION
        // ======================================================


        /*
         * Original logic to enable tap-to-toggle visual effect on touch devices.
         * This function IS NOT running now.
         */
        function enableTouchCityEffects(){
            const cityEls = document.querySelectorAll('.city-filter');
            if (!cityEls || cityEls.length === 0) return;

            // Apply pointerdown so it works for touch and mouse (quick visual feedback)
            cityEls.forEach(el => {
                el.addEventListener('pointerdown', (ev) => {
                    // Remove active from others
                    document.querySelectorAll('.city-filter.is-active').forEach(a => a.classList.remove('is-active'));
                    // Add to this element
                    el.classList.add('is-active');
                });

                // After click, keep the visual for a short moment so it's noticeable on mobile
                el.addEventListener('click', (ev) => {
                    setTimeout(() => el.classList.remove('is-active'), 600);
                });
            });

            // Remove active class when tapping/clicking outside the city items
            document.addEventListener('click', (ev) => {
                if (!ev.target.closest || !ev.target.closest('.city-filter')) {
                    document.querySelectorAll('.city-filter.is-active').forEach(a => a.classList.remove('is-active'));
                }
            });
        }
        

        // ======================================================
        // START: HOW IT WORKS SCROLL ANIMATION LOGIC
        // (UPDATED to use DOTTED lines and manage dasharray/dashoffset)
        // ======================================================

        const howItWorksSection = document.getElementById('how-it-works');
        const path1 = document.getElementById('path1');
        const path2 = document.getElementById('path2');
        const stepCards = document.querySelectorAll('.step-card-3d');

        // Initial setup function
        function setupHowItWorksPaths() {
            if (!path1 || !path2) return;
            
            if (window.innerWidth < 1024) {
                // Mobile: Enable infinite flow animation
                path1.classList.add('flow-infinite');
                path2.classList.add('flow-infinite');
                path1.classList.remove('draw-on-scroll');
                path2.classList.remove('draw-on-scroll');
                path1.style.strokeDashoffset = '0'; // Reset offset for infinite animation
                path2.style.strokeDashoffset = '0';
                return; 
            }
            
            // Desktop: Enable scroll drawing
            path1.classList.add('draw-on-scroll');
            path2.classList.add('draw-on-scroll');
            path1.classList.remove('flow-infinite');
            path2.classList.remove('flow-infinite');
            
            // Calculate total length
            const path1Length = path1.getTotalLength();
            const path2Length = path2.getTotalLength();
            
            // Hide the line initially by setting offset = length
            path1.style.strokeDashoffset = path1Length; 
            path2.style.strokeDashoffset = path2Length; 
            
            // Store lengths for use in scroll listener
            path1.dataset.length = path1Length;
            path2.dataset.length = path2Length;
            
            // Re-check visibility after resize/setup to correctly position lines
            updatePathDrawing();
        }

        function updatePathDrawing() {
            if (!path1 || !path2 || window.innerWidth < 1024) {
                return; // Only run on desktop screens (lg: breakpoint)
            }
            
            // Get lengths from data attributes
            const path1Length = parseFloat(path1.dataset.length);
            const path2Length = parseFloat(path2.dataset.length);

            const scrollY = window.scrollY;
            const sectionTop = howItWorksSection.offsetTop;
            const sectionHeight = howItWorksSection.offsetHeight;
            const viewportHeight = window.innerHeight;

            // Define the scroll window where the animation runs
            const scrollRange = sectionHeight * 1.5; // Start drawing earlier
            const scrollStart = sectionTop - viewportHeight + 100; // Start drawing when the section is about 100px from the bottom of the viewport
            
            let scrollProgress = (scrollY - scrollStart) / scrollRange;
            scrollProgress = Math.min(1, Math.max(0, scrollProgress)); // Clamp 0 to 1

            // Line 1 should be fully drawn by 50% scroll progress (0 to 0.5)
            let progress1 = Math.min(1, scrollProgress * 2); 
            
            // Line 2 starts drawing at 50% and should be fully drawn by 100% scroll progress (0.5 to 1.0)
            let progress2 = Math.min(1, Math.max(0, (scrollProgress - 0.5) * 2)); 

            // Calculate offset based on progress (Drawn line's dashoffset decreases from Length to 0)
            path1.style.strokeDashoffset = path1Length * (1 - progress1);
            path2.style.strokeDashoffset = path2Length * (1 - progress2);
        }

        // Intersection Observer for Step Card Reveal
        const stepCardObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3, rootMargin: '0px 0px -50px 0px' });

        stepCards.forEach(card => {
            stepCardObserver.observe(card);
        });

        window.addEventListener('scroll', updatePathDrawing);
        window.addEventListener('resize', setupHowItWorksPaths); // Recalculate on resize
        
        // Initial setup for path lengths and icons
        document.addEventListener('DOMContentLoaded', () => {
            // Build the city list with hover effects
            rebuildCityList(window.cityInfo);

            // Hide hardcoded Indore and Kota sections
            const topSpacesIndore = document.getElementById('top-spaces');
            const topSpacesKota = document.getElementById('top-spaces-kota');
            if (topSpacesIndore) topSpacesIndore.style.display = 'none';
            if (topSpacesKota) topSpacesKota.style.display = 'none';

            // Load dynamic Top Spaces sections for each city from localStorage
            loadDynamicTopSpaces();

            // Load featured/trending properties from MongoDB
            updateFeaturedProperties();

            // Build testimonial rows
            buildTestimonialRow(testimonialData.slice(0, 3), 'testimonial-track-1');
            buildTestimonialRow(testimonialData.slice(3, 6), 'testimonial-track-2');
            
            // Re-run lucide.createIcons() after dynamic content
            lucide.createIcons();
            
            // Initial call to set path lengths and positions for DOTTED SCROLL DRAWING/FLOWING
            setupHowItWorksPaths();
            // Initial call to draw path based on current scroll position
            updatePathDrawing(); 
        });

        // ======================================================
        // END: HOW IT WORKS SCROLL ANIMATION LOGIC
        // ======================================================

        // ======================================================
        // DYNAMIC SLIDER NAVIGATION (Top Spaces & Featured)
        // ======================================================
        document.addEventListener('click', (e) => {
            // Handle slider navigation buttons
            const prevBtn = e.target.closest('.spaces-prev-btn, .offer-prev, #offer-prev, #featured-prev');
            const nextBtn = e.target.closest('.spaces-next-btn, .offer-next, #offer-next, #featured-next');
            
            if (prevBtn) {
                const sliderId = prevBtn.dataset.slider || prevBtn.closest('.relative')?.querySelector('[class*="slider"]')?.id;
                const slider = document.getElementById(sliderId);
                if (slider) {
                    slider.scrollBy({ left: -300, behavior: 'smooth' });
                }
            }
            
            if (nextBtn) {
                const sliderId = nextBtn.dataset.slider || nextBtn.closest('.relative')?.querySelector('[class*="slider"]')?.id;
                const slider = document.getElementById(sliderId);
                if (slider) {
                    slider.scrollBy({ left: 300, behavior: 'smooth' });
                }
            }
        });

        // ======================================================
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
                link.addEventListener('click', closeMenu);
            });
        }
        
        // Intersection Observer for general animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-slide-in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('section > div:not(.relative):not(#hero-content-wrapper), section > h2').forEach(el => {
            // Exclude the step cards which have their own observer
            if (!el.closest('#how-it-works') && !el.classList.contains('animate-slide-in')) {
                 el.style.opacity = '0';
                 observer.observe(el);
            }
        });


        // Intersection Observer for offering cards
        const cardObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    entry.target.style.animationDelay = `${index * 100}ms`;
                    entry.target.classList.add('card-animate');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        document.querySelectorAll('.offering-card-item').forEach(card => {
            cardObserver.observe(card);
        });

        // Offerings Slider
        const offerSlider = document.getElementById('offerings-slider');
        const offerPrev = document.getElementById('offer-prev');
        const offerNext = document.getElementById('offer-next');
        if(offerSlider && offerPrev && offerNext) {
            const offerCardWidth = 240 + 20; // w-48 (192px) + gap-5 (20px)
            offerNext.addEventListener('click', () => {
                offerSlider.scrollBy({ left: offerCardWidth, behavior: 'smooth' });
            });
            offerPrev.addEventListener('click', () => {
                offerSlider.scrollBy({ left: -offerCardWidth, behavior: 'smooth' });
            });
        }

        // ======================================================
        // "TOP SPACES (INDORE)" SLIDER JAVASCRIPT
        // ======================================================
        const spacesSlider = document.getElementById('spaces-slider');
        const spacesPrev = document.getElementById('spaces-prev');
        const spacesNext = document.getElementById('spaces-next');
        if(spacesSlider && spacesPrev && spacesNext) {
            const spaceCardWidth = 320 + 24; // w-80 (320px) + gap-6 (24px)
            spacesNext.addEventListener('click', () => {
                spacesSlider.scrollBy({ left: spaceCardWidth, behavior: 'smooth' });
            });
            spacesPrev.addEventListener('click', () => {
                spacesSlider.scrollBy({ left: -spaceCardWidth, behavior: 'smooth' });
            });
        }
        // ======================================================
        // "TOP SPACES (KOTA)" SLIDER JAVASCRIPT
        // ======================================================
        const spacesSliderKota = document.getElementById('spaces-slider-kota');
        const spacesPrevKota = document.getElementById('spaces-prev-kota');
        const spacesNextKota = document.getElementById('spaces-next-kota');
        if(spacesSliderKota && spacesPrevKota && spacesNextKota) {
            const spaceCardWidth = 320 + 24; // w-80 (320px) + gap-6 (24px)
            spacesNextKota.addEventListener('click', () => {
                spacesSliderKota.scrollBy({ left: spaceCardWidth, behavior: 'smooth' });
            });
            spacesPrevKota.addEventListener('click', () => {
                spacesSliderKota.scrollBy({ left: -spaceCardWidth, behavior: 'smooth' });
            });
        }
        
        // Featured Stays Slider
        const featuredSlider = document.getElementById('featured-slider');
        const featuredPrev = document.getElementById('featured-prev');
        const featuredNext = document.getElementById('featured-next');
        if(featuredSlider && featuredPrev && featuredNext) {
            // Note: Updated `featuredNext` and `featuredPrev` to use `scrollBy` method correctly
            const featuredCardWidth = 384 + 24; // w-96 (384px) + gap-6 (24px) for desktop/wider cards
            featuredNext.addEventListener('click', () => {
                featuredSlider.scrollBy({ left: featuredCardWidth, behavior: 'smooth' });
            });
            featuredPrev.addEventListener('click', () => {
                featuredSlider.scrollBy({ left: -featuredCardWidth, behavior: 'smooth' });
            });
        }

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
        FAQ Accordion Logic
        ============================================================
        */
        document.querySelectorAll('.faq-item').forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            const chevron = item.querySelector('.chevron');
            
            question.addEventListener('click', () => {
                // Close all other open answers
                document.querySelectorAll('.faq-answer.active').forEach(activeAnswer => {
                    if (activeAnswer !== answer) {
                        activeAnswer.classList.remove('active');
                        activeAnswer.previousElementSibling.querySelector('.chevron').classList.remove('rotated');
                    }
                });

                // Toggle the clicked answer
                answer.classList.toggle('active');
                chevron.classList.toggle('rotated');
            });
        });

        /*
        ============================================================
        Hero Search Functionality
        ============================================================
        */
        const heroSearchBtn = document.getElementById('hero-search-btn');
        const heroSearchInput = document.getElementById('hero-search-input');

        if (heroSearchBtn && heroSearchInput) {
            // Handle button click
            heroSearchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const searchTerm = heroSearchInput.value.trim();
                if (searchTerm) {
                    window.location.href = `ourproperty?search=${encodeURIComponent(searchTerm)}`;
                }
            });

            // Handle Enter key
            heroSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const searchTerm = heroSearchInput.value.trim();
                    if (searchTerm) {
                        window.location.href = `ourproperty?search=${encodeURIComponent(searchTerm)}`;
                    }
                }
            });
        }
