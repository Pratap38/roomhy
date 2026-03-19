lucide.createIcons();

        // API_URL is already defined in api-config.js

        // ======================================================
        // START: Filter Properties by Type & City from URL Parameters
        // ======================================================
        
        function getUrlParam(param) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(param);
        }

        function filterPropertiesByTypeAndCity() {
            const typeParam = getUrlParam('type'); // Get 'type' from URL
            const cityParam = getUrlParam('city'); // Get 'city' from URL
            const searchParam = getUrlParam('search'); // Get 'search' from URL

            // Get all property cards
            const properties = document.querySelectorAll('a.group[href*="#"]');
            let visibleCount = 0;

            properties.forEach(card => {
                const badge = card.querySelector('span');
                const locationText = card.textContent;
                
                if (!badge) return;

                const badgeText = badge.textContent.toLowerCase();
                let matchesType = true;
                let matchesCity = true;
                let matchesSearch = true;

                // ===== FILTER BY TYPE =====
                if (typeParam) {
                    if (typeParam === 'hostel' && !badgeText.includes('hostel')) {
                        matchesType = false;
                    } else if (typeParam === 'pg' && !(badgeText.includes('pg') || badgeText.includes('co-living'))) {
                        matchesType = false;
                    } else if (typeParam === 'apartment' && !(badgeText.includes('apartment') || badgeText.includes('studio') || badgeText.includes('flat'))) {
                        matchesType = false;
                    }
                }

                // ===== FILTER BY CITY =====
                if (cityParam) {
                    const cityLower = cityParam.toLowerCase();
                    // Check if city name appears in the location text
                    if (!locationText.toLowerCase().includes(cityLower)) {
                        matchesCity = false;
                    }
                }

                // ===== FILTER BY AREA =====
                let matchesArea = true;
                const mobileAreaSelect = document.getElementById('mobile-select-area');
                const desktopAreaSelect = document.getElementById('desktop-select-area');
                const areaValue = (mobileAreaSelect?.value || desktopAreaSelect?.value || '').toLowerCase();
                
                if (areaValue) {
                    // Check if the selected area appears in the location text
                    if (!locationText.toLowerCase().includes(areaValue)) {
                        matchesArea = false;
                    }
                }

                // ===== FILTER BY SEARCH =====
                if (searchParam) {
                    const searchLower = searchParam.toLowerCase();
                    if (!locationText.toLowerCase().includes(searchLower)) {
                        matchesSearch = false;
                    }
                }

                // Show card only if it matches all applied filters
                const shouldShow = matchesType && matchesCity && matchesArea && matchesSearch;
                card.style.display = shouldShow ? 'block' : 'none';
                if (shouldShow) visibleCount++;
            });

            // Update the count
            const countHeader = document.querySelector('h2');
            if (countHeader) {
                let filterText = '';
                const mobileAreaSelect = document.getElementById('mobile-select-area');
                const desktopAreaSelect = document.getElementById('desktop-select-area');
                const areaValue = (mobileAreaSelect?.value || desktopAreaSelect?.value || '').toLowerCase();
                
                if (typeParam && cityParam && areaValue) {
                    filterText = `${visibleCount} ${typeParam.charAt(0).toUpperCase() + typeParam.slice(1)} Properties in ${cityParam} (${areaValue.charAt(0).toUpperCase() + areaValue.slice(1)})`;
                } else if (typeParam && cityParam) {
                    filterText = `${visibleCount} ${typeParam.charAt(0).toUpperCase() + typeParam.slice(1)} Properties in ${cityParam}`;
                } else if (cityParam && areaValue) {
                    filterText = `${visibleCount} Properties in ${cityParam} (${areaValue.charAt(0).toUpperCase() + areaValue.slice(1)})`;
                } else if (typeParam) {
                    filterText = `${visibleCount} ${typeParam.charAt(0).toUpperCase() + typeParam.slice(1)} Properties Found`;
                } else if (cityParam) {
                    filterText = `${visibleCount} Properties in ${cityParam}`;
                } else if (searchParam) {
                    filterText = `${visibleCount} Results for "${searchParam}"`;
                } else {
                    filterText = `${visibleCount} Properties Found`;
                }
                countHeader.textContent = filterText;
            }
        }

        // ======================================================
        // Load Cities from API and populate dropdowns
        // ======================================================
        async function loadCities() {
            try {
                const response = await fetch(`${API_URL}/api/locations/cities`);
                if (!response.ok) {
                    throw new Error('Failed to fetch cities');
                }
                const data = await response.json();
                const cities = data.success ? data.data : data;

                // Populate desktop city dropdown
                const desktopSelect = document.getElementById('desktop-select-city');
                if (desktopSelect) {
                    desktopSelect.innerHTML = '<option value="">Select a city</option>';
                    cities.forEach(city => {
                        const option = document.createElement('option');
                        option.value = city._id || city.id || city.name.toLowerCase().replace(/\s+/g, '-');
                        option.dataset.cityName = city.name || '';
                        option.textContent = `${city.name}, ${city.state}`;
                        desktopSelect.appendChild(option);
                    });
                    desktopSelect.dataset.source = 'locations-api';
                }

                // Populate mobile city dropdown
                const mobileSelect = document.getElementById('mobile-select-city');
                if (mobileSelect) {
                    mobileSelect.innerHTML = '<option value="">Select a city</option>';
                    cities.forEach(city => {
                        const option = document.createElement('option');
                        option.value = city._id || city.id || city.name.toLowerCase().replace(/\s+/g, '-');
                        option.dataset.cityName = city.name || '';
                        option.textContent = `${city.name}, ${city.state}`;
                        mobileSelect.appendChild(option);
                    });
                    mobileSelect.dataset.source = 'locations-api';
                }

                console.log('Cities loaded successfully:', cities.length);
            } catch (error) {
                console.error('Error loading cities:', error);
                // Fallback to hardcoded cities
                const fallbackCities = [
                    { name: 'Bangalore', state: 'Karnataka' },
                    { name: 'Chennai', state: 'Tamil Nadu' },
                    { name: 'Coimbatore', state: 'Tamil Nadu' }
                ];

                const desktopSelect = document.getElementById('desktop-select-city');
                const mobileSelect = document.getElementById('mobile-select-city');

                [desktopSelect, mobileSelect].forEach(select => {
                    if (select) {
                        select.innerHTML = '<option value="">Select a city</option>';
                        fallbackCities.forEach(city => {
                            const option = document.createElement('option');
                            option.value = city._id || city.id || city.name.toLowerCase().replace(/\s+/g, '-');
                            option.dataset.cityName = city.name || '';
                            option.textContent = `${city.name}, ${city.state}`;
                            select.appendChild(option);
                        });
                        select.dataset.source = 'locations-api';
                    }
                });
            }
        }

        // ======================================================
        // Load Areas based on selected city
        // ======================================================
        async function loadAreasForCity(cityId) {
            if (!cityId) {
                // Reset area dropdowns
                const desktopAreaSelect = document.getElementById('desktop-select-area');
                const mobileAreaSelect = document.getElementById('mobile-select-area');
                if (desktopAreaSelect) desktopAreaSelect.innerHTML = '<option value="">First select a city</option>';
                if (mobileAreaSelect) mobileAreaSelect.innerHTML = '<option value="">First select a city</option>';
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/locations/areas`);
                if (!response.ok) {
                    throw new Error('Failed to fetch areas');
                }
                const data = await response.json();
                const allAreas = data.success ? data.data : data;
                const areas = (Array.isArray(allAreas) ? allAreas : []).filter(a => (a.city && a.city._id) === cityId);

                // Populate desktop area dropdown
                const desktopAreaSelect = document.getElementById('desktop-select-area');
                if (desktopAreaSelect) {
                    desktopAreaSelect.innerHTML = '<option value="">Select an area</option>';
                    areas.forEach(area => {
                        const option = document.createElement('option');
                        option.value = area._id || area.id || area.name.toLowerCase().replace(/\s+/g, '-');
                        option.dataset.areaName = area.name || '';
                        option.textContent = area.name;
                        desktopAreaSelect.appendChild(option);
                    });
                }

                // Populate mobile area dropdown
                const mobileAreaSelect = document.getElementById('mobile-select-area');
                if (mobileAreaSelect) {
                    mobileAreaSelect.innerHTML = '<option value="">Select an area</option>';
                    areas.forEach(area => {
                        const option = document.createElement('option');
                        option.value = area._id || area.id || area.name.toLowerCase().replace(/\s+/g, '-');
                        option.dataset.areaName = area.name || '';
                        option.textContent = area.name;
                        mobileAreaSelect.appendChild(option);
                    });
                }

                console.log('Areas loaded for city ID:', cityId, areas.length);
            } catch (error) {
                console.error('Error loading areas:', error);
                // Fallback to empty areas
                const desktopAreaSelect = document.getElementById('desktop-select-area');
                const mobileAreaSelect = document.getElementById('mobile-select-area');
                if (desktopAreaSelect) desktopAreaSelect.innerHTML = '<option value="">No areas available</option>';
                if (mobileAreaSelect) mobileAreaSelect.innerHTML = '<option value="">No areas available</option>';
            }
        }

        // Call on page load
        document.addEventListener('DOMContentLoaded', async function() {
            // Load cities first
            await loadCities();
            
            // Then auto-select city if URL has city parameter
            autoSelectCityInDropdowns();
            
            // Get the selected city and populate areas
            const cityValue = document.getElementById('desktop-select-city')?.value || document.getElementById('mobile-select-city')?.value || '';
            if (cityValue) {
                await loadAreasForCity(cityValue);
                updateAreaDropdown(cityValue);
            }
            
            // Load and filter properties with URL parameters
            loadWebsiteListing();
        });

        // ======================================================
        // Event Listeners for Filter Dropdowns
        // ======================================================
        
        // Desktop city dropdown change handler
        document.getElementById('desktop-select-city')?.addEventListener('change', async function() {
            const selectedCity = this.value;
            await loadAreasForCity(selectedCity);
            
            // Sync mobile dropdown
            const mobileSelect = document.getElementById('mobile-select-city');
            if (mobileSelect) mobileSelect.value = selectedCity;
            
            // Apply filters
            applyFilters();
        });

        // Mobile city dropdown change handler
        document.getElementById('mobile-select-city')?.addEventListener('change', async function() {
            const selectedCity = this.value;
            await loadAreasForCity(selectedCity);
            
            // Sync desktop dropdown
            const desktopSelect = document.getElementById('desktop-select-city');
            if (desktopSelect) desktopSelect.value = selectedCity;
            
            // Apply filters
            applyFilters();
        });

        // Desktop area dropdown change handler
        document.getElementById('desktop-select-area')?.addEventListener('change', function() {
            // Sync mobile dropdown
            const mobileSelect = document.getElementById('mobile-select-area');
            if (mobileSelect) mobileSelect.value = this.value;
            
            // Apply filters
            applyFilters();
        });

        // Mobile area dropdown change handler
        document.getElementById('mobile-select-area')?.addEventListener('change', function() {
            // Sync desktop dropdown
            const desktopSelect = document.getElementById('desktop-select-area');
            if (desktopSelect) desktopSelect.value = this.value;
            
            // Apply filters
            applyFilters();
        });

        // Price range change handlers
        document.getElementById('desktop-min-price')?.addEventListener('change', applyFilters);
        document.getElementById('desktop-max-price')?.addEventListener('change', applyFilters);
        document.getElementById('mobile-min-price')?.addEventListener('change', applyFilters);
        document.getElementById('mobile-max-price')?.addEventListener('change', applyFilters);

        // Gender change handlers
        document.getElementById('desktop-gender')?.addEventListener('change', applyFilters);
        document.getElementById('mobile-gender')?.addEventListener('change', applyFilters);

        // Property type change handlers
        document.getElementById('desktop-property-type')?.addEventListener('change', applyFilters);
        document.getElementById('mobile-property-type')?.addEventListener('change', applyFilters);

        // ======================================================
        // Apply Filters Function
        // ======================================================
        function applyFilters() {
            // Get values from whichever element is visible/has value
            const getFilterValue = (desktopId, mobileId) => {
                const desktopEl = document.getElementById(desktopId);
                const mobileEl = document.getElementById(mobileId);
                return (desktopEl?.value || mobileEl?.value || '').trim();
            };

            const filters = {
                city: getFilterValue('desktop-select-city', 'mobile-select-city'),
                area: getFilterValue('desktop-select-area', 'mobile-select-area'),
                minPrice: getFilterValue('desktop-min-price', 'mobile-min-price'),
                maxPrice: getFilterValue('desktop-max-price', 'mobile-max-price'),
                gender: getFilterValue('desktop-gender', 'mobile-gender'),
                propertyType: getFilterValue('desktop-property-type', 'mobile-property-type')
            };

            console.log('🔍 Filters applied:', filters);

            // Reload properties with filters
            loadWebsiteListing(filters);
        }

        // ======================================================
        // Auto-select City in Dropdown if URL has city parameter
        // ======================================================
        function autoSelectCityInDropdowns() {
            const cityParam = getUrlParam('city');
            if (!cityParam) return;
            const normalized = cityParam.toLowerCase().trim();
            const desktopSelect = document.getElementById('desktop-select-city');
            const mobileSelect = document.getElementById('mobile-select-city');

            const pickMatchingValue = (selectEl) => {
                if (!selectEl) return '';
                let matched = '';
                for (const opt of Array.from(selectEl.options)) {
                    const text = (opt.textContent || '').toLowerCase();
                    const cityName = (opt.dataset.cityName || '').toLowerCase();
                    if (text.includes(normalized) || cityName.includes(normalized) || normalized.includes(cityName)) {
                        matched = opt.value;
                        break;
                    }
                }
                if (matched) selectEl.value = matched;
                return matched;
            };

            const selected = pickMatchingValue(desktopSelect) || pickMatchingValue(mobileSelect);
            if (selected) {
                if (desktopSelect) desktopSelect.value = selected;
                if (mobileSelect) mobileSelect.value = selected;
            }
        }

        // Called from main DOMContentLoaded handler above
        // This function auto-selects city in dropdowns if URL has city parameter

        // ======================================================
        // START: Dynamic Live Properties Rendering (from localStorage)
        // ======================================================

        function getVisitsFromStorage() {
            try {
                const local = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
                if (Array.isArray(local) && local.length) return local;
            } catch (e) {}
            try {
                const session = JSON.parse(sessionStorage.getItem('roomhy_visits') || '[]');
                if (Array.isArray(session)) return session;
            } catch (e) {}
            return [];
        }

        function normalizeGenderValue(value) {
            const v = (value || '').toString().toLowerCase().trim();
            if (!v) return '';
            if (v.includes('co-ed') || v.includes('coed') || v.includes('co ed') || v.includes('any') || v.includes('all') || v === 'other') return 'co-ed';
            if (
                v.includes('male') ||
                v.includes('boy') ||
                v.includes('man') ||
                v.includes('men') ||
                v.includes('gent') ||
                v === 'm'
            ) return 'male';
            if (
                v.includes('female') ||
                v.includes('girl') ||
                v.includes('woman') ||
                v.includes('women') ||
                v.includes('lad') ||
                v === 'f'
            ) return 'female';
            return v;
        }

        function isGenderMatch(propertyGender, selectedGender) {
            const prop = normalizeGenderValue(propertyGender);
            const selected = normalizeGenderValue(selectedGender);
            if (!selected) return true;
            if (!prop) return true; // don't reject missing data
            if (prop === 'co-ed' || selected === 'co-ed') return true;
            return prop === selected;
        }

        function slimPropertyForCache(p) {
            const prop = p.propertyInfo || {};
            const photos = (p.professionalPhotos && p.professionalPhotos.length)
                ? p.professionalPhotos
                : (p.photos || prop.photos || []);
            const firstPhoto = photos[0] || '';

            return {
                _id: p._id,
                enquiry_id: p.enquiry_id,
                status: p.status,
                isLiveOnWebsite: p.isLiveOnWebsite,
                city: p.city || prop.city || '',
                locality: p.locality || prop.area || '',
                rent: p.rent || p.monthlyRent || prop.rent || prop.monthlyRent || 0,
                monthlyRent: p.monthlyRent || p.rent || prop.monthlyRent || prop.rent || 0,
                property_type: p.property_type || p.type || prop.property_type || prop.type || '',
                gender: p.gender || prop.gender || prop.genderSuitability || '',
                isVerified: !!p.isVerified,
                rating: p.rating || 0,
                reviewsCount: p.reviewsCount || 0,
                propertyInfo: {
                    name: p.property_name || prop.name || p.title || prop.title || '',
                    title: p.title || prop.title || '',
                    city: p.city || prop.city || '',
                    area: p.locality || prop.area || '',
                    rent: p.rent || p.monthlyRent || prop.rent || prop.monthlyRent || 0,
                    monthlyRent: p.monthlyRent || p.rent || prop.monthlyRent || prop.rent || 0,
                    propertyType: prop.propertyType || prop.property_type || p.property_type || p.type || '',
                    type: p.type || prop.type || p.property_type || prop.property_type || '',
                    genderSuitability: prop.genderSuitability || p.gender || prop.gender || ''
                },
                // Keep at most one preview image to avoid quota overflow
                photos: firstPhoto ? [firstPhoto] : [],
                professionalPhotos: firstPhoto ? [firstPhoto] : []
            };
        }

        function cachePropertiesSafely(properties) {
            const payload = properties.map(slimPropertyForCache);
            const serialized = JSON.stringify(payload);
            try {
                localStorage.setItem('roomhy_visits', serialized);
                return true;
            } catch (e) {
                // localStorage can fail due to quota/tracking prevention, fallback to sessionStorage
                try {
                    sessionStorage.setItem('roomhy_visits', serialized);
                    return false;
                } catch (e2) {
                    console.warn('Storage unavailable for property cache; proceeding without cache');
                    return false;
                }
            }
        }

        // Fetch properties from approval API (MongoDB) - only approved properties
        async function fetchPropertiesFromAPI(filters = {}) {
            try {
                // Fetch only approved properties from MongoDB
                const url = `${API_URL}/api/approved-properties/public/approved`;

                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!response.ok) {
                    console.error('API Error fetching approved properties:', response.status);
                    return getVisitsFromStorage();
                }

                const data = await response.json();
                let properties = [];

                // API returns array of properties directly
                if (Array.isArray(data)) {
                    properties = data;
                } else if (data && data.properties && Array.isArray(data.properties)) {
                    properties = data.properties;
                } else if (data && typeof data === 'object') {
                    // Handle case where data is a single object
                    properties = [data];
                } else {
                    console.warn('Unexpected API response format:', typeof data, Array.isArray(data));
                    return getVisitsFromStorage();
                }
                
                console.log('✅ Fetched', properties.length, 'properties from API');
                
                // Log first property to debug
                if (properties.length > 0) {
                    console.log('First property:', properties[0]);
                    console.log('First property isLiveOnWebsite:', properties[0].isLiveOnWebsite);
                    console.log('First property status:', properties[0].status);
                }

                // Keep only live properties (isLiveOnWebsite = true) OR approved status
                const beforeLive = properties.length;
                properties = properties.filter(p => {
                    const isLive = p.isLiveOnWebsite === true;
                    const isApproved = p.status === 'live' || p.status === 'approved';
                    const result = isLive || isApproved;
                    if (properties.indexOf(p) === 0) {
                        console.log('Filter check - isLive:', isLive, 'isApproved:', isApproved, 'result:', result);
                    }
                    return result;
                });
                console.log('After live filter: ', beforeLive, '→', properties.length, 'properties');

                // Apply client-side filters
                const beforeClientFilter = properties.length;
                console.log('🔍 Filter object:', filters);
                console.log('🔍 All filter keys:', Object.keys(filters));
                
                if (beforeClientFilter > 0) {
                    console.log('🔍 First property FULL structure:', {
                        _id: properties[0]._id,
                        city: properties[0].city,
                        propInfoCity: properties[0].propertyInfo?.city,
                        locality: properties[0].locality,
                        propInfoArea: properties[0].propertyInfo?.area,
                        propertyInfo_keys: properties[0].propertyInfo ? Object.keys(properties[0].propertyInfo) : 'no propertyInfo'
                    });
                }
                
                properties = properties.filter((prop, idx) => {
                    const propInfo = prop.propertyInfo || {};
                    const desktopCitySelect = document.getElementById('desktop-select-city');
                    const mobileCitySelect = document.getElementById('mobile-select-city');
                    const activeCitySelect = desktopCitySelect && desktopCitySelect.value ? desktopCitySelect : mobileCitySelect;
                    const citySelectedOption = activeCitySelect ? activeCitySelect.options[activeCitySelect.selectedIndex] : null;
                    const filterCityName = citySelectedOption
                        ? (citySelectedOption.dataset.cityName || citySelectedOption.textContent || '')
                        : '';

                    const desktopAreaSelect = document.getElementById('desktop-select-area');
                    const mobileAreaSelect = document.getElementById('mobile-select-area');
                    const activeAreaSelect = desktopAreaSelect && desktopAreaSelect.value ? desktopAreaSelect : mobileAreaSelect;
                    const areaSelectedOption = activeAreaSelect ? activeAreaSelect.options[activeAreaSelect.selectedIndex] : null;
                    const filterAreaName = areaSelectedOption
                        ? (areaSelectedOption.dataset.areaName || areaSelectedOption.textContent || '')
                        : '';
                    
                    // City filter using selected option text (fast-bidding style)
                    if (filters.city && filters.city !== '') {
                        const propCity = (prop.city || propInfo.city || '').toString().toLowerCase().trim();
                        const filterCity = (filterCityName || filters.city || '').toString().toLowerCase().trim();
                        if (propCity) {  // Only apply filter if property has city data
                            const cityMatch = propCity.includes(filterCity) || filterCity.includes(propCity);
                            if (idx === 0) console.log('🏙️ City filter: prop="' + propCity + '" filter="' + filterCity + '" match=' + cityMatch);
                            if (!cityMatch) return false;
                        }
                        // If property has no city data, don't filter (pass through)
                    }
                    
                    // Area filter using selected option text (fast-bidding style)
                    if (filters.area && filters.area !== '') {
                        const propArea = (prop.locality || propInfo.area || '').toString().toLowerCase().trim();
                        const filterArea = (filterAreaName || filters.area || '').toString().toLowerCase().trim();
                        if (propArea) {  // Only apply filter if property has area data
                            const areaMatch = propArea.includes(filterArea) || filterArea.includes(propArea);
                            if (idx === 0) console.log('📍 Area filter: prop="' + propArea + '" filter="' + filterArea + '" match=' + areaMatch);
                            if (!areaMatch) return false;
                        }
                        // If property has no area data, don't filter (pass through)
                    }

                    // Gender
                    if (filters.gender) {
                        const propGender = (
                            prop.gender ||
                            propInfo.gender ||
                            prop.genderSuitability ||
                            propInfo.genderSuitability ||
                            prop.property_type ||
                            prop.type ||
                            propInfo.propertyType ||
                            propInfo.type ||
                            ''
                        ).toString();
                        if (!isGenderMatch(propGender, filters.gender)) return false;
                    }

                    // Property type
                    if (filters.propertyType) {
                        const propType = (propInfo.propertyType || '').toString().toLowerCase();
                        if (!propType.includes(filters.propertyType.toString().toLowerCase())) return false;
                    }

                    // Price range - only filter if property HAS rent data
                    if (filters.minPrice || filters.maxPrice) {
                        const rent = parseInt(prop.monthlyRent || prop.rent || propInfo.rent || propInfo.monthlyRent) || null;
                        if (rent !== null) {  // Only apply price filter if property has rent data
                            if (filters.minPrice && rent < parseInt(filters.minPrice)) return false;
                            if (filters.maxPrice && filters.maxPrice !== '50000_plus' && rent > parseInt(filters.maxPrice)) return false;
                        }
                        // If property has no rent data, don't filter (pass through)
                    }

                    return true;
                });
                console.log('After client filter:', beforeClientFilter, '→', properties.length);

                // Cache lightweight payload to avoid quota overflow from image-heavy objects
                cachePropertiesSafely(properties);
                return properties;

            } catch (err) {
                console.error('Error fetching website enquiries:', err);
                return getVisitsFromStorage();
            }
        }

        function populateAreaOptionsFromVisits(cityValue) {
            // Keep behavior aligned with fast-bidding: areas come from locations API by selected city ID
            return loadAreasForCity(cityValue || '');
        }

        function renderPropertyCard(v) {
            // Handle WebsiteEnquiry data structure from MongoDB (primary) and VisitReport fallback
            const prop = v.propertyInfo || {};
            const title = v.property_name || prop.name || v.title || prop.title || 'Property';
            const area = v.locality || prop.area || prop.locality || v.area || '';
            const city = v.city || prop.city || v.location || '';
            const rent = v.rent || v.monthlyRent || prop.rent || prop.monthlyRent || 0;
            const badge = v.property_type || v.type || prop.property_type || prop.type || 'Room';
            const photos = (v.professionalPhotos && v.professionalPhotos.length) ? v.professionalPhotos : (v.photos || []);
            const img = photos && photos[0] ? photos[0] : 'https://images.unsplash.com/photo-1567016432779-1fee749a1532?q=80&w=1974&auto=format&fit=crop';
            const propertyId = encodeURIComponent(v._id || v.enquiry_id);
            const rawPropertyId = v._id || v.enquiry_id;

            // Build thumbnail scroller (up to 4 thumbnails)
            const thumbs = (photos && photos.length) ? photos.slice(0,4).map(s => `<img src="${s}" class="h-20 w-28 object-cover rounded cursor-pointer">`).join('') : '';

            // Prepare property data for favorite toggle
            const propertyDataStr = JSON.stringify({
                _id: rawPropertyId,
                enquiry_id: v.enquiry_id,
                property_name: title,
                property_image: img,
                city: city,
                location: city,
                locality: area,
                rent: rent,
                price: rent,
                property_type: badge,
                photos: photos,
                bedrooms: v.bedrooms || 0,
                bathrooms: v.bathrooms || 0,
                isVerified: v.isVerified,
                rating: v.rating,
                reviewsCount: v.reviewsCount
            }).replace(/"/g, '&quot;');

            return `
                <div class="property-card-pro h-full flex flex-col">
                    <a href="property?id=${propertyId}" class="group block flex-grow">
                        <div class="property-image-wrap">
                            <img src="${img}" alt="${title}" class="w-full h-44 sm:h-52 object-cover">
                            <button class="favorite-btn absolute top-3 left-3 bg-white/95 hover:bg-red-50 text-gray-600 hover:text-red-500 p-2 rounded-full shadow-sm transition-colors" data-property-id="${rawPropertyId}" data-property='${propertyDataStr}' title="Add to favorites">
                                <i data-lucide="heart" class="w-4 h-4"></i>
                            </button>
                            ${v.isVerified ? '<div class="absolute top-3 right-3 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"><i data-lucide="shield-check" class="w-3.5 h-3.5"></i><span>Verified</span></div>' : ''}
                        </div>

                        <div class="p-4">
                            <div class="flex items-start justify-between gap-3 mb-2">
                                <span class="property-chip">${badge}</span>
                                <p class="price-pill">₹${rent}<span> / month</span></p>
                            </div>

                            <h3 class="text-lg font-bold text-slate-900 line-clamp-2">${title}</h3>
                            <p class="mt-2 text-sm text-slate-600 flex items-start">
                                <i data-lucide="map-pin" class="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0"></i>
                                <span class="line-clamp-1">${area}${city ? ', ' + city : ''}</span>
                            </p>

                            <div class="mt-3 flex items-center justify-between">
                                <div class="flex items-center text-sm text-slate-600">
                                    <i data-lucide="star" class="w-4 h-4 text-amber-500 fill-amber-500 mr-1"></i>
                                    <span class="font-semibold text-slate-800">${v.rating || '4.5'}</span>
                                    <span class="ml-1">(${v.reviewsCount || 0})</span>
                                </div>
                                <span class="text-xs text-slate-500">Updated listing</span>
                            </div>

                            ${ thumbs ? `<div class="mt-3 overflow-x-auto horizontal-slider flex gap-2 pb-1"><div class="flex gap-2">${thumbs}</div></div>` : '' }
                        </div>
                    </a>

                    <div class="px-4 pb-4">
                        <a href="property?id=${propertyId}" class="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm">
                            <i data-lucide="message-square" class="w-4 h-4"></i>
                            View & Bid
                        </a>
                    </div>
                </div>`;
        }

        function loadWebsiteListing(providedFilters = null) {
            // If filters are provided, use them; otherwise read from DOM
            let filters;
            
            if (providedFilters) {
                // Use provided filters directly
                filters = providedFilters;
            } else {
                // Read from DOM elements
                const getFilterValue = (desktopId, mobileId) => {
                    const desktopEl = document.getElementById(desktopId);
                    const mobileEl = document.getElementById(mobileId);
                    return (desktopEl?.value || mobileEl?.value || '').trim();
                };
                
                filters = {
                    city: getFilterValue('desktop-select-city', 'mobile-select-city'),
                    area: getFilterValue('desktop-select-area', 'mobile-select-area'),
                    minPrice: getFilterValue('desktop-min-price', 'mobile-min-price'),
                    maxPrice: getFilterValue('desktop-max-price', 'mobile-max-price'),
                    gender: getFilterValue('desktop-gender', 'mobile-gender'),
                    propertyType: getFilterValue('desktop-property-type', 'mobile-property-type')
                };
            }

            // Check if this is the initial load with URL parameters
            // Note: Don't use URL params as API filters since properties don't have city data
            // URL params are only for UI filtering after data loads
            const typeParam = getUrlParam('type') || '';
            const cityParam = getUrlParam('city') || '';
            
            console.log('🔗 URL params detected - type:', typeParam, 'city:', cityParam);
            console.log('💭 Skipping URL params as API filters (properties lack city data in DB)');

            console.log('📦 Loading website listing with filters:', filters);
            console.log('📦 Starting fetchPropertiesFromAPI...');

            // Fetch from API with filters
            const fetchPromise = fetchPropertiesFromAPI(filters);
            console.log('📦 fetchPromise created:', fetchPromise instanceof Promise);
            
            fetchPromise
                .then(visits => {
                    console.log('✅ Promise resolved! visits:', visits);
                    return visits;
                })
                .then(filtered => {
                    console.log('After API fetch, filtered.length:', filtered?.length);

                    // Show all properties (even without professional photos - use regular photos as fallback)
                    // filtered = filtered.filter(v => v.professionalPhotos && v.professionalPhotos.length > 0);

                    const grid = document.getElementById('propertiesGrid');
                    if (!grid) {
                        console.error('❌ Grid element not found!');
                        return;
                    }
                    console.log('✅ Grid element found');
                    
                    if (!filtered || !filtered.length) {
                        console.warn('⚠️ No properties after filtering - showing empty message');
                        grid.innerHTML = '<p class="text-gray-500 px-4">No properties found for selected filters.</p>';
                        document.getElementById('showingTotal').innerText = '0';
                        return;
                    }

                    console.log('🎨 Rendering', filtered.length, 'properties');
                    const htmlArray = [];
                    for (let idx = 0; idx < filtered.length; idx++) {
                        const v = filtered[idx];
                        const card = renderPropertyCard(v);
                        console.log('🎨 Rendered property', idx, ':', v.propertyInfo?.name || v.property_name || 'Unknown');
                        htmlArray.push(card);
                    }
                    
                    const htmlCards = htmlArray.join('');
                    console.log('💾 Total HTML length:', htmlCards.length, 'properties count:', filtered.length);
                    grid.innerHTML = htmlCards;
                    console.log('✅ HTML inserted into grid, grid.innerHTML.length:', grid.innerHTML.length);
                    lucide.createIcons();
                    document.getElementById('showingTotal').innerText = filtered.length;
                    document.getElementById('showingFrom').innerText = filtered.length ? '1' : '0';
                    document.getElementById('showingTo').innerText = filtered.length;
                    
                    // Update property count display
                    updatePropertyCount(filtered.length);
                    
                    // Store current filters in window for "Bid to all" modal
                    window.currentFilters = filters;
                    console.log('✅ Current filters stored for bidding:', window.currentFilters);
                })
                .catch(err => {
                    console.error('❌ Error loading properties:', err);
                    console.error('Error stack:', err.stack);
                    const grid = document.getElementById('propertiesGrid');
                    if (grid) {
                        grid.innerHTML = '<p class="text-red-500 px-4">Error loading properties. Please try again.</p>';
                    }
                    updatePropertyCount(0);
                });
        }

        // Update property count in header
        function updatePropertyCount(count) {
            const mobileCount = document.getElementById('mobile-property-count');
            const desktopCount = document.getElementById('desktop-property-count');
            
            const countText = count === 1 ? `${count} Property Found` : `${count} Properties Found`;
            
            if (mobileCount) mobileCount.textContent = countText;
            if (desktopCount) desktopCount.textContent = countText;
        }

        // Wire up selects to reload list
        // Note: Event listeners moved to main event listener section above
        document.getElementById('desktop-property-type')?.addEventListener('change', loadWebsiteListing);
        document.getElementById('mobile-property-type')?.addEventListener('change', loadWebsiteListing);
        
        // Wire up occupancy filters
        document.getElementById('desktop-occupancy')?.addEventListener('change', loadWebsiteListing);
        document.getElementById('mobile-occupancy')?.addEventListener('change', loadWebsiteListing);

        // Function to populate cities from MongoDB
        function populateCities() {
            // Use same source/model as fast-bidding (locations API)
            return loadCities();
        }

        // Initialize on load
        document.addEventListener('DOMContentLoaded', function(){ 
            populateCities();
            populateAreaOptionsFromVisits(''); 
            loadWebsiteListing(); 
        });

        // ======================================================
        // END: Dynamic Live Properties Rendering
        // ======================================================

        // ======================================================
        // END: Auto-select City in Dropdown
        // ======================================================

        // ======================================================
        // START: Area Extraction and Dropdown Population
        // ======================================================

        // Map of cities and their areas extracted from properties
        const cityAreaMap = {
            'kota': ['Mahaveer Nagar', 'CP Nagar'],
            'indore': ['Vijay Nagar', 'Bhawarkua', 'Saket Nagar'],
            'sikar': ['Station Road'],
            'pune': ['Hinjewadi'],
            'bangalore': ['Koramangala'],
            'delhi': ['North Campus']
        };

        // Function to populate area dropdown based on selected city
        function updateAreaDropdown(cityValue) {
            // Keep area behavior aligned with fast-bidding (areas by selected city ID)
            return loadAreasForCity(cityValue || '');
        }

        // Add change event listeners to city and area dropdowns
        document.addEventListener('DOMContentLoaded', () => {
            const mobileSelectCity = document.getElementById('mobile-select-city');
            const desktopSelectCity = document.getElementById('desktop-select-city');
            const mobileSelectArea = document.getElementById('mobile-select-area');
            const desktopSelectArea = document.getElementById('desktop-select-area');

            if (mobileSelectCity) {
                mobileSelectCity.addEventListener('change', (e) => {
                    updateAreaDropdown(e.target.value);
                    populateAreaOptionsFromVisits(e.target.value);
                    loadWebsiteListing(); // Reload properties when city changes
                });
            }

            if (desktopSelectCity) {
                desktopSelectCity.addEventListener('change', (e) => {
                    updateAreaDropdown(e.target.value);
                    populateAreaOptionsFromVisits(e.target.value);
                    loadWebsiteListing(); // Reload properties when city changes
                });
            }

            // Add change event listeners to area dropdowns to trigger re-filtering
            if (mobileSelectArea) {
                mobileSelectArea.addEventListener('change', () => {
                    loadWebsiteListing(); // Reload properties when area changes
                });
            }

            if (desktopSelectArea) {
                desktopSelectArea.addEventListener('change', () => {
                    loadWebsiteListing(); // Reload properties when area changes
                });
            }

            // If city is already selected (from URL), populate areas
            const selectedCity = mobileSelectCity ? mobileSelectCity.value : desktopSelectCity.value;
            if (selectedCity) {
                updateAreaDropdown(selectedCity);
            }
        });

        // ======================================================
        // END: Area Extraction and Dropdown Population
        // ======================================================

        // ======================================================
        // START: Search Functionality
        // ======================================================

        function performSearch() {
            const searchInput = document.getElementById('property-search-input');
            
            if (!searchInput) return;

            const searchTerm = searchInput.value.toLowerCase().trim();
            if (!searchTerm) {
                // Show all properties if search is empty
                document.querySelectorAll('a.group[href*="#"]').forEach(card => {
                    card.style.display = 'block';
                });
                return;
            }

            let visibleCount = 0;
            document.querySelectorAll('a.group[href*="#"]').forEach(card => {
                const cardText = card.textContent.toLowerCase();
                const matches = cardText.includes(searchTerm);
                card.style.display = matches ? 'block' : 'none';
                if (matches) visibleCount++;
            });

            // Update count
            const countHeader = document.querySelector('h2');
            if (countHeader) {
                countHeader.textContent = `${visibleCount} Properties Found for "${searchTerm}"`;
            }
        }

        // Handle initial search from URL parameter
        document.addEventListener('DOMContentLoaded', () => {
            const searchParam = getUrlParam('search');
            if (searchParam) {
                const searchInput = document.getElementById('property-search-input');
                if (searchInput) {
                    searchInput.value = decodeURIComponent(searchParam);
                    performSearch();
                }
            }

            // Add search button functionality
            const searchButton = document.getElementById('property-search-btn');
            const searchInputField = document.getElementById('property-search-input');

            if (searchButton && searchInputField) {
                searchButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    performSearch();
                });

                searchInputField.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        performSearch();
                    }
                });
            }
        });

        // ======================================================
        // END: Search Functionality
        // ======================================================

        // Simple toast helper (used for notifications across this page)
        window.showToast = function(message, type='info', duration=3500){
            try{
                const toast = document.createElement('div');
                toast.className = 'fixed z-50 right-6 bottom-6 max-w-xs px-4 py-3 rounded shadow-lg text-sm text-white';
                toast.style.transition = 'transform 240ms ease, opacity 240ms ease';
                toast.style.opacity = '0';
                if(type === 'success') toast.style.background = 'linear-gradient(90deg,#10b981,#059669)';
                else if(type === 'error') toast.style.background = 'linear-gradient(90deg,#ef4444,#dc2626)';
                else toast.style.background = 'linear-gradient(90deg,#3b82f6,#06b6d4)';
                toast.textContent = message;
                document.body.appendChild(toast);
                requestAnimationFrame(()=>{ toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; });
                setTimeout(()=>{ toast.style.opacity = '0'; toast.style.transform = 'translateY(10px)'; setTimeout(()=>toast.remove(),300); }, duration);
            }catch(e){ console.warn('showToast failed', e); }
        };

        // Listen for localStorage changes (admin/backend fallback) to reload listings and show notifications
        window.addEventListener('storage', function(ev){
            try{
                if (!ev) return;
                if (ev.key === 'roomhy_visits' || ev.key === 'new_property_added') {
                    // reload area options and listings
                    populateAreaOptionsFromVisits('');
                    loadWebsiteListing();
                    showToast('New property added', 'info');
                }
                // Optional: show toast for enquiries/bids saved in localStorage keys
                if (ev.key && ev.key.indexOf('owner_enquiries') === 0) {
                    showToast('New request received', 'info');
                }
                if (ev.key && ev.key.indexOf('owner_property_bids') === 0) {
                    showToast('New bid placed', 'info');
                }
            }catch(e){/* ignore */}
        });

        // ======================================================
        // START: Populate City Selects (dynamic from MongoDB and admin locations)
        // ======================================================
        (function(){
            // First, try to populate from MongoDB approved properties
            async function populateCitiesFromMongoDB(){
                try{
                    const desktopExisting = document.getElementById('desktop-select-city');
                    if (desktopExisting && desktopExisting.dataset.source === 'locations-api') {
                        return;
                    }
                    const response = await fetch(`${API_URL}/api/approved-properties/public/approved`);
                    if (!response.ok) throw new Error('Failed to fetch');
                    
                    const data = await response.json();
                    let properties = Array.isArray(data) ? data : (data.properties || []);
                    
                    // Extract unique cities from approved properties
                    const citiesSet = new Set();
                    properties.forEach(prop => {
                        const city = prop.city || (prop.propertyInfo && prop.propertyInfo.city);
                        if (city) {
                            citiesSet.add(city);
                        }
                    });
                    
                    // If we found cities, populate the selects
                    if (citiesSet.size > 0) {
                        const cities = Array.from(citiesSet).sort();
                        const desktop = document.getElementById('desktop-select-city');
                        const mobile = document.getElementById('mobile-select-city');
                        const opts = '<option value="">Select a city</option>' + cities.map(c => `<option value="${c.toLowerCase()}">${c}</option>`).join('');
                        if(desktop) desktop.innerHTML = opts;
                        if(mobile) mobile.innerHTML = opts;
                    }
                } catch(e){
                    console.log('Could not fetch cities from MongoDB, trying locations-sync.js');
                    loadCitiesFromLocationsSync();
                }
            }

            // Fallback: Load from locations-sync.js if available
            function loadCitiesFromLocationsSync(){
                var s = document.createElement('script');
                s.src = 'js/locations-sync.js';
                s.onload = function(){
                    function fillCitySelects(){
                        try{
                            var cities = (window.roomhyLocations && typeof window.roomhyLocations.getCities === 'function') ? window.roomhyLocations.getCities() : [];
                            var desktop = document.getElementById('desktop-select-city');
                            var mobile = document.getElementById('mobile-select-city');
                            var opts = '<option value="">Select a city</option>' + (cities.length ? cities.map(function(c){ return '<option value="'+c.name.toLowerCase()+'">'+c.name+'</option>'; }).join('') : '');
                            if(desktop) desktop.innerHTML = opts;
                            if(mobile) mobile.innerHTML = opts;
                        }catch(e){/* ignore */}
                    }
                    fillCitySelects();
                    if(window.roomhyLocations && typeof window.roomhyLocations.onChange === 'function'){
                        window.roomhyLocations.onChange(fillCitySelects);
                    }
                };
                document.head.appendChild(s);
            }

            // Load cities from MongoDB on page load
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', populateCitiesFromMongoDB);
            } else {
                populateCitiesFromMongoDB();
            }
        })();
        // ======================================================
        // END: Populate City Selects
        // ======================================================

        /* Mobile Side Menu JS (Existing Logic) */
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
            mobileMenu.querySelectorAll('a').forEach(link => { link.addEventListener('click', closeMenu); });
            // Handle logout button click
            const logoutButton = mobileMenu.querySelector('button[onclick="globalLogout()"]');
            if (logoutButton) {
                logoutButton.addEventListener('click', closeMenu);
            }
        }
        
        // ======================================================
        // GLOBAL LOGOUT FUNCTION - Clears all storage and redirects
        // ======================================================
        function globalLogout() {
            // Use AuthUtils if available, otherwise do it manually
            if (typeof AuthUtils !== 'undefined' && AuthUtils.logout) {
                AuthUtils.logout('login');
            } else {
                // Manual logout
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = 'signup';
            }
        }
        
        // ======================================================
        // UPDATE MOBILE MENU BASED ON LOGIN STATE
        // ======================================================
        function updateMobileMenuState() {
            const menuLoggedIn = document.getElementById('menu-logged-in');
            const menuLoggedOut = document.getElementById('menu-logged-out');
            
            if (typeof AuthUtils !== 'undefined' && AuthUtils.isLoggedIn()) {
                // Show logged-in menu
                if (menuLoggedIn) menuLoggedIn.classList.remove('hidden');
                if (menuLoggedOut) menuLoggedOut.classList.add('hidden');
                
                // Update user info
                updateWelcomeMessage();
            } else {
                // Show logged-out menu
                if (menuLoggedIn) menuLoggedIn.classList.add('hidden');
                if (menuLoggedOut) menuLoggedOut.classList.remove('hidden');
            }
        }
        
        // ======================================================
        // UPDATE WELCOME MESSAGE WITH USER ID
        // ======================================================
        function updateWelcomeMessage() {
            // Use AuthUtils for consistency
            if (typeof AuthUtils !== 'undefined' && AuthUtils.isLoggedIn()) {
                const userId = AuthUtils.getUserId();
                const userName = AuthUtils.getUserName();
                
                const welcomeName = document.getElementById('welcomeUserName');
                const userIdDisplay = document.getElementById('userIdDisplay');
                
                if (welcomeName) {
                    welcomeName.textContent = `Hi, ${userName}`;
                }
                if (userIdDisplay) {
                    userIdDisplay.textContent = `ID: ${userId}`;
                }
            }
        }
        
        // Call on page load
        updateMobileMenuState();
        
        // Listen for storage changes (logout from other tabs)
        window.addEventListener('storage', updateMobileMenuState);
        
        /* Apply and Clear Filters Functionality */
        function clearAllFilters() {
            // Reset all filter dropdowns to default values
            document.getElementById('desktop-select-city').value = '';
            document.getElementById('mobile-select-city').value = '';
            document.getElementById('desktop-select-area').value = '';
            document.getElementById('mobile-select-area').value = '';
            document.getElementById('desktop-min-price').value = '';
            document.getElementById('mobile-min-price').value = '';
            document.getElementById('desktop-max-price').value = '50000_plus';
            document.getElementById('mobile-max-price').value = '50000_plus';
            document.getElementById('desktop-gender').value = '';
            document.getElementById('mobile-gender').value = '';
            document.getElementById('desktop-property-type').value = '';
            document.getElementById('mobile-property-type').value = '';
            document.getElementById('desktop-occupancy').value = '';
            document.getElementById('mobile-occupancy').value = '';

            // Reload listings
            populateAreaOptionsFromVisits('');
            loadWebsiteListing();
        }
        
        // Wire up Apply Filters buttons (close mobile drawer after applying)
        const mobileApplyFilterBtn = document.querySelector('#mobile-filter-drawer button:nth-child(1)');
        if (mobileApplyFilterBtn && mobileApplyFilterBtn.textContent.includes('Apply Filters')) {
            mobileApplyFilterBtn.addEventListener('click', loadWebsiteListing);
        }

        // Wire up desktop Apply Filters buttons
        document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent.includes('Apply Filters')) {
                btn.addEventListener('click', loadWebsiteListing);
            }
        });
        
        // Wire up Clear Filters buttons (desktop and mobile)
        document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent.includes('Clear Filters')) {
                btn.addEventListener('click', clearAllFilters);
            }
        });
        
        /* Filter Toggle JS (Mobile & Desktop) - UPDATED LOGIC */
        const filterToggleMobile = document.getElementById('filter-toggle'); 
        const filterToggleDesktop = document.getElementById('filter-toggle-desktop'); 
        const filterSidebar = document.getElementById('filter-sidebar'); 
        const mainContentArea = document.getElementById('main-content-area'); 
        
        // New variables for the mobile drawer
        const mobileFilterDrawer = document.getElementById('mobile-filter-drawer');
        const closeFilterMobile = document.getElementById('close-filter-mobile');
        const filterOverlay = document.getElementById('filter-overlay');

        // Toggle function for the mobile drawer (Slide-in/out from right)
        function toggleMobileFilterDrawer() {
            if (!mobileFilterDrawer || !filterOverlay) return;
            const isHidden = mobileFilterDrawer.classList.contains('translate-x-full');
            
            if (isHidden) {
                // Show drawer
                mobileFilterDrawer.classList.remove('translate-x-full');
                mobileFilterDrawer.classList.add('translate-x-0');
                filterOverlay.classList.remove('hidden');
            } else {
                // Hide drawer
                mobileFilterDrawer.classList.remove('translate-x-0');
                mobileFilterDrawer.classList.add('translate-x-full');
                filterOverlay.classList.add('hidden');
            }
            lucide.createIcons();
        }
        
        // Toggle function for the desktop sidebar (Show/Hide)
        function toggleDesktopSidebar() {
            if (!filterSidebar || !mainContentArea || !filterToggleDesktop) return;
            
            const isNowHidden = filterSidebar.classList.toggle('hidden');
            
            // On desktop, adjust grid
            if (window.innerWidth >= 1024) {
                // When sidebar is hidden, main content spans full width
                mainContentArea.classList.toggle('lg:col-span-12', isNowHidden);
                // When sidebar is visible, main content uses 9/12 split
                mainContentArea.classList.toggle('lg:col-span-9', !isNowHidden);
                // Ensure sidebar is shown/hidden correctly on desktop
                filterSidebar.classList.toggle('lg:block', !isNowHidden);
            }
            
            // Update desktop button style
            filterToggleDesktop.classList.toggle('bg-blue-50', !isNowHidden);
            filterToggleDesktop.classList.toggle('text-blue-600', !isNowHidden);
            
            lucide.createIcons();
        }

        // --- Attach Event Listeners ---
        if (filterToggleMobile) {
            filterToggleMobile.addEventListener('click', toggleMobileFilterDrawer);
        }
        if (closeFilterMobile) {
            closeFilterMobile.addEventListener('click', toggleMobileFilterDrawer);
        }
        if (filterOverlay) {
            filterOverlay.addEventListener('click', toggleMobileFilterDrawer);
        }
        // Also attach the apply button to close the drawer for convenience
        const mobileApplyFilters = document.getElementById('mobile-apply-filters');
        if (mobileApplyFilters) {
            mobileApplyFilters.addEventListener('click', () => {
                applyFilters();
                toggleMobileFilterDrawer();
            });
        }
        
        if (filterToggleDesktop) {
            filterToggleDesktop.addEventListener('click', toggleDesktopSidebar);
        }

        // Desktop apply filters button
        const desktopApplyFilters = document.getElementById('desktop-apply-filters');
        if (desktopApplyFilters) {
            desktopApplyFilters.addEventListener('click', applyFilters);
        }
        
        /* Hero Slideshow JS */
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

        // ======================================================
        // REQUEST ON ALL FUNCTIONALITY
        // ======================================================

        let currentFilteredProperties = [];

        // Store filtered properties whenever loadWebsiteListing is called
        // We'll modify the original function to also store filtered properties
        const originalLoadWebsiteListing = window.loadWebsiteListing;
        window.loadWebsiteListing = function(providedFilters = null) {
            // Call original function but intercept to store properties
            const typeParam = getUrlParam('type') || '';
            const cityParam = getUrlParam('city') || '';

            let desktopCity = document.getElementById('desktop-select-city')?.value || '';
            let mobileCity = document.getElementById('mobile-select-city')?.value || '';

            if (cityParam && !desktopCity && !mobileCity) {
                desktopCity = cityParam;
                const desktopSelect = document.getElementById('desktop-select-city');
                const mobileSelect = document.getElementById('mobile-select-city');
                if (desktopSelect) desktopSelect.value = cityParam;
                if (mobileSelect) mobileSelect.value = cityParam;
            }

            const cityValue = (desktopCity || mobileCity || '').toString().trim();

            const desktopArea = document.getElementById('desktop-select-area')?.value || '';
            const mobileArea = document.getElementById('mobile-select-area')?.value || '';
            const areaValue = (desktopArea || mobileArea).toString();

            const desktopMinPrice = document.getElementById('desktop-min-price')?.value || '';
            const mobileMinPrice = document.getElementById('mobile-min-price')?.value || '';
            const minPrice = desktopMinPrice || mobileMinPrice || '';

            const desktopMaxPrice = document.getElementById('desktop-max-price')?.value || '';
            const mobileMaxPrice = document.getElementById('mobile-max-price')?.value || '';
            const maxPrice = desktopMaxPrice || mobileMaxPrice || '';

            const desktopGender = document.getElementById('desktop-gender')?.value || '';
            const mobileGender = document.getElementById('mobile-gender')?.value || '';
            const genderValue = desktopGender || mobileGender || '';

            const desktopPropertyType = document.getElementById('desktop-property-type')?.value || '';
            const mobilePropertyType = document.getElementById('mobile-property-type')?.value || '';
            const propertyTypeValue = (desktopPropertyType || mobilePropertyType || typeParam || '').toString().toLowerCase();

            const desktopOccupancy = document.getElementById('desktop-occupancy')?.value || '';
            const mobileOccupancy = document.getElementById('mobile-occupancy')?.value || '';
            const occupancyValue = desktopOccupancy || mobileOccupancy || '';

            const filters = {};
            if (cityValue) filters.city = cityValue;
            if (areaValue) filters.area = areaValue;
            if (genderValue) filters.gender = genderValue;
            if (propertyTypeValue) filters.propertyType = propertyTypeValue;
            if (minPrice) filters.minPrice = minPrice;
            if (maxPrice && maxPrice !== '50000_plus') filters.maxPrice = maxPrice;
            if (occupancyValue) filters.occupancy = occupancyValue;

            fetchPropertiesFromAPI(filters).then(visits => {
                let filtered = visits;
                // Show all properties (even without professional photos - use regular photos as fallback)
                // filtered = filtered.filter(v => v.professionalPhotos && v.professionalPhotos.length > 0);

                // Store filtered properties for "Request on all" feature
                currentFilteredProperties = filtered;

                const grid = document.getElementById('propertiesGrid');
                if (!grid) return;

                if (!filtered.length) {
                    grid.innerHTML = '<p class="text-gray-500 px-4">No properties found for selected filters.</p>';
                    document.getElementById('showingTotal').innerText = '0';
                    return;
                }

                grid.innerHTML = filtered.map(v => renderPropertyCard(v)).join('');
                lucide.createIcons();
                document.getElementById('showingTotal').innerText = filtered.length;
                document.getElementById('showingFrom').innerText = filtered.length ? '1' : '0';
                document.getElementById('showingTo').innerText = filtered.length;

                // Update property count display
                updatePropertyCount(filtered.length);

                // Store current filters in window for "Bid to all" modal
                window.currentFilters = filters;
                console.log('✅ Current filters stored for bidding:', window.currentFilters);
            }).catch(err => {
                console.error('Error loading properties:', err);
                const grid = document.getElementById('propertiesGrid');
                if (grid) {
                    grid.innerHTML = '<p class="text-red-500 px-4">Error loading properties. Please try again.</p>';
                }
                updatePropertyCount(0);
            });
        };

        // Request on all button handlers - works exactly like property request button
        // ===== BIDDING FILTER FORM ENHANCEMENT =====
        // Handle bidding filter form submission
        async function submitBiddingFilterForm(isDesktop) {
            const prefix = isDesktop ? 'desktop' : 'mobile';
            
            // Get user info
            const user = (typeof AuthUtils !== 'undefined' && AuthUtils.getCurrentUser) ? AuthUtils.getCurrentUser() : null;
            if (!user || !user.loginId) {
                if (typeof AuthUtils !== 'undefined' && AuthUtils.showAuthPromptModal) {
                    AuthUtils.showAuthPromptModal('Please login/signup to submit a bidding request.');
                }
                return;
            }

            // Collect form data
            const city = document.getElementById(`${prefix}-select-city`)?.value || '';
            const area = document.getElementById(`${prefix}-select-area`)?.value || '';
            const minPrice = document.getElementById(`${prefix}-min-price`)?.value || '';
            const maxPrice = document.getElementById(`${prefix}-max-price`)?.value || '';
            const gender = document.getElementById(`${prefix}-gender`)?.value || '';
            const propertyType = document.getElementById(`${prefix}-property-type`)?.value || '';
            const occupancy = document.getElementById(`${prefix}-occupancy`)?.value || '';
            const bidMin = document.getElementById(`${prefix}-bid-min`)?.value || '';
            const bidMax = document.getElementById(`${prefix}-bid-max`)?.value || '';
            const message = document.getElementById(`${prefix}-bid-message`)?.value || '';

            // Validation
            if (!city) {
                alert('Please select a city');
                return;
            }

            if (!bidMin || !bidMax) {
                alert('Please enter bidding range');
                return;
            }

            try {
                // Create bidding filter data
                const biddingData = {
                    userId: user.loginId,
                    userName: user.name || 'User',
                    userEmail: user.email || '',
                    city: city,
                    area: area || 'Any',
                    minRent: parseInt(minPrice) || 0,
                    maxRent: parseInt(maxPrice) || 0,
                    gender: gender || 'Any',
                    propertyType: propertyType || 'Any',
                    occupancy: occupancy || 'Any',
                    bidMin: parseInt(bidMin),
                    bidMax: parseInt(bidMax),
                    message: message,
                    submittedAt: new Date().toISOString(),
                    status: 'active'
                };

                // Send to API
                const response = await fetch(`${API_URL}/api/bidding-filters`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(biddingData)
                }).catch(() => {
                    console.log('API not available, using localStorage');
                    return null;
                });

                // Save locally
                const savedFilters = JSON.parse(localStorage.getItem('my_bidding_filters') || '[]');
                savedFilters.push(biddingData);
                localStorage.setItem('my_bidding_filters', JSON.stringify(savedFilters));

                alert('✅ Bidding filter submitted successfully! Property owners will see your requirements.');
                
                // Close drawer
                if (!isDesktop) {
                    document.getElementById('mobile-filter-drawer')?.classList.add('translate-x-full');
                    document.getElementById('filter-overlay')?.classList.add('hidden');
                }
                
            } catch (error) {
                console.error('Error submitting bidding filter:', error);
                alert('Error submitting bidding filter. Please try again.');
            }
        }

        // ===== REQUEST ALL FUNCTIONS =====
        function showRequestAllModal() {
            if (currentFilteredProperties.length === 0) {
                alert('No properties to request. Please apply filters and try again.');
                return;
            }

            const user = (typeof AuthUtils !== 'undefined' && AuthUtils.getCurrentUser) ? AuthUtils.getCurrentUser() : null;
            if (!user || !user.loginId) {
                if (typeof AuthUtils !== 'undefined' && AuthUtils.showAuthPromptModal) {
                    AuthUtils.showAuthPromptModal('Please login/signup to submit requests.');
                }
                return;
            }

            // Update property count and show modal
            document.getElementById('property-count').innerText = currentFilteredProperties.length;
            
            const modal = document.getElementById('request-all-modal');
            if (modal) modal.classList.remove('hidden');
        }

        // Bid on All - Opens the request modal for bidding
        function openBidOnAllModal() {
            // Get current filter values
            const city = document.getElementById('desktop-select-city')?.value || document.getElementById('mobile-select-city')?.value || '';
            const area = document.getElementById('desktop-select-area')?.value || document.getElementById('mobile-select-area')?.value || '';
            const minPrice = document.getElementById('desktop-min-price')?.value || document.getElementById('mobile-min-price')?.value || '';
            const maxPrice = document.getElementById('desktop-max-price')?.value || document.getElementById('mobile-max-price')?.value || '';
            const gender = document.getElementById('desktop-gender')?.value || document.getElementById('mobile-gender')?.value || '';
            
            // Check if filters are applied
            if (!city && !area && !minPrice && !maxPrice) {
                alert('Please select filters first to find matching properties.');
                return;
            }

            // Show the request all modal (reusing existing functionality)
            showRequestAllModal();
        }

        function closeBidOnAllModal() {
            closeRequestAllModal();
        }

        function closeRequestAllModal() {
            const modal = document.getElementById('request-all-modal');
            if (modal) modal.classList.add('hidden');
        }

        async function submitRequestAll() {
            console.log('Submit request all clicked');
            const submitBtn = document.getElementById('submit-request-all');
            const user = (typeof AuthUtils !== 'undefined' && AuthUtils.getCurrentUser) ? AuthUtils.getCurrentUser() : null;

            if (!user || !user.loginId) {
                if (typeof AuthUtils !== 'undefined' && AuthUtils.showAuthPromptModal) {
                    AuthUtils.showAuthPromptModal('Please login/signup to submit requests.');
                }
                return;
            }

            // Get form values - SIMPLIFIED: Name, Email, Bid Range, Message only
            const name = document.getElementById('request-all-name')?.value || '';
            const email = document.getElementById('request-all-email')?.value || '';
            const message = document.getElementById('request-all-message')?.value || '';
            const bidMin = document.getElementById('request-all-bid-min')?.value || '';
            const bidMax = document.getElementById('request-all-bid-max')?.value || '';

            // Get filter criteria
            const city = document.getElementById('desktop-select-city')?.value || document.getElementById('mobile-select-city')?.value || '';
            const area = document.getElementById('desktop-select-area')?.value || document.getElementById('mobile-select-area')?.value || '';
            const minPrice = document.getElementById('desktop-min-price')?.value || document.getElementById('mobile-min-price')?.value || '';
            const maxPrice = document.getElementById('desktop-max-price')?.value || document.getElementById('mobile-max-price')?.value || '';
            const gender = document.getElementById('desktop-gender')?.value || document.getElementById('mobile-gender')?.value || '';
            const propertyType = document.getElementById('desktop-property-type')?.value || document.getElementById('mobile-property-type')?.value || '';
            const occupancy = document.getElementById('desktop-occupancy')?.value || document.getElementById('mobile-occupancy')?.value || '';

            console.log('Form values:', { name, email, message, bidMin, bidMax });

            // Validation
            if (!name) {
                alert('Please fill in your name');
                return;
            }

            if (!email) {
                alert('Please fill in your email address');
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please provide a valid email address');
                return;
            }

            if (!bidMin || !bidMax) {
                alert('Please fill in your bid range (minimum and maximum)');
                return;
            }

            try {
                // Disable button and show loading state
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i>Sending...</span>';
                    lucide.createIcons();
                }

                let successCount = 0;
                let failureCount = 0;

                console.log('Submitting requests for', currentFilteredProperties.length, 'properties');

                // Submit request for each property
                for (const property of currentFilteredProperties) {
                    try {
                        const propertyName = property.property_name || property.propertyInfo?.name || 'Property';
                        const propArea = property.locality || property.propertyInfo?.area || 'Unknown';
                        const propType = property.property_type || property.propertyInfo?.propertyType || 'PG';
                        const rentAmount = property.rent || property.monthlyRent || property.propertyInfo?.monthlyRent || 0;

                        // Get property owner ID directly from property (ApprovedProperty document from API)
                        let propertyOwnerId = null;
                        
                        // First try direct property fields
                        propertyOwnerId = property.generatedCredentials?.loginId ||
                                        property.ownerLoginId ||
                                        property.createdBy ||
                                        property.owner ||
                                        property.propertyOwnerId ||
                                        property.propertyInfo?.ownerId;

                        // If not found in property, check status - properties should have status='approved' or status='live'
                        // Both indicate they are approved and live
                        if (property.status && property.status !== 'approved' && property.status !== 'live') {
                            console.warn('Skipping property with status:', property.status, '-', propertyName);
                            failureCount++;
                            continue;
                        }

                        if (!propertyOwnerId) {
                            console.warn('Could not identify property owner for:', propertyName, '- Property data:', property);
                            failureCount++;
                            continue;
                        }

                        console.log('Submitting request for property:', propertyName, 'to owner:', propertyOwnerId);

                        const response = await fetch(`${API_URL}/api/booking/create`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                property_id: property._id || property.enquiry_id,
                                property_name: propertyName,
                                area: propArea,
                                property_type: propType,
                                rent_amount: parseInt(rentAmount),
                                user_id: user.loginId,
                                owner_id: propertyOwnerId,
                                name: name,
                                email: email,
                                phone: '',
                                request_type: 'bid',
                                message: message || '',
                                bid_min: bidMin ? parseInt(bidMin) : null,
                                bid_max: bidMax ? parseInt(bidMax) : null,
                                filter_criteria: {
                                    city: city,
                                    area: area,
                                    min_price: minPrice,
                                    max_price: maxPrice,
                                    gender: gender,
                                    property_type: propertyType,
                                    occupancy: occupancy
                                }
                            })
                        });

                        if (response.ok) {
                            const result = await response.json();
                            console.log('Request successful for', propertyName);
                            successCount++;
                            
                            // Save to localStorage as backup for property owner's panel
                            const bidData = {
                                _id: result._id || result.bookingId || `bid_${Date.now()}_${Math.random()}`,
                                property_id: property._id || property.enquiry_id,
                                property_name: propertyName,
                                area: propArea,
                                property_type: propType,
                                user_id: user.loginId,
                                owner_id: propertyOwnerId,
                                name: name,
                                email: email,
                                phone: '',
                                request_type: 'bid',
                                message: message || '',
                                bid_min: bidMin ? parseInt(bidMin) : null,
                                bid_max: bidMax ? parseInt(bidMax) : null,
                                status: 'pending',
                                created_at: new Date().toISOString()
                            };
                            
                            // Add to roomhy_booking_requests array
                            const bookings = JSON.parse(localStorage.getItem('roomhy_booking_requests') || '[]');
                            bookings.push(bidData);
                            localStorage.setItem('roomhy_booking_requests', JSON.stringify(bookings));
                            console.log('✅ Bid saved to localStorage for property owner');
                        } else {
                            const errorData = await response.json().catch(() => ({ message: response.statusText }));
                            console.error('Request failed for', propertyName, ':', response.status, errorData);
                            failureCount++;
                        }
                    } catch (err) {
                        console.error('Error submitting request for property:', err);
                        failureCount++;
                    }
                }

                // Show result
                console.log('Final result - Success:', successCount, 'Failures:', failureCount);

                if (successCount > 0) {
                    alert(`Thank you ${name}! Your bid request has been sent to ${successCount} property owner(s). We'll contact you soon.${failureCount > 0 ? ' ' + failureCount + ' request(s) failed.' : ''}`);
                    closeRequestAllModal();

                    // Close mobile drawer if open
                    document.getElementById('mobile-filter-drawer')?.classList.add('translate-x-full');
                    document.getElementById('filter-overlay')?.classList.add('hidden');

                    // Reset form
                    document.getElementById('request-all-form')?.reset();
                } else {
                    alert('Failed to submit requests. Please try again. Check browser console (F12) for details.');
                    console.error('All requests failed. API_URL:', API_URL);
                }
            } catch (error) {
                console.error('Outer error:', error);
                alert('Error submitting requests. Details: ' + error.message);
            } finally {
                // Re-enable button and reset text
                const submitBtn = document.getElementById('submit-request-all');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Send Requests';
                }
            }
        }

        // Wire up button handlers - wrapped in setTimeout to ensure DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                document.getElementById('mobile-request-all')?.addEventListener('click', showRequestAllModal);
                document.getElementById('desktop-request-all')?.addEventListener('click', showRequestAllModal);
                document.getElementById('close-request-all-modal')?.addEventListener('click', closeRequestAllModal);
                document.getElementById('close-request-all-modal-btn')?.addEventListener('click', closeRequestAllModal);
                document.getElementById('submit-request-all')?.addEventListener('click', submitRequestAll);
                
                // Close modal when clicking outside
                document.getElementById('request-all-modal')?.addEventListener('click', (e) => {
                    if (e.target.id === 'request-all-modal') {
                        closeRequestAllModal();
                    }
                });

                // Add favorite button click handlers
                document.addEventListener('click', (e) => {
                    if (e.target.closest('.favorite-btn')) {
                        const btn = e.target.closest('.favorite-btn');
                        const propertyId = btn.dataset.propertyId;
                        const propertyDataStr = btn.dataset.property;
                        
                        if (!propertyDataStr) {
                            console.error('Property data not found');
                            return;
                        }
                        
                        try {
                            const propertyData = JSON.parse(propertyDataStr);
                            toggleFavorite(e, propertyData);
                        } catch (err) {
                            console.error('Error parsing property data:', err);
                        }
                    }
                });
            });
        } else {
            document.getElementById('mobile-request-all')?.addEventListener('click', showRequestAllModal);
            document.getElementById('desktop-request-all')?.addEventListener('click', showRequestAllModal);
            document.getElementById('close-request-all-modal')?.addEventListener('click', closeRequestAllModal);
            document.getElementById('close-request-all-modal-btn')?.addEventListener('click', closeRequestAllModal);
            document.getElementById('submit-request-all')?.addEventListener('click', submitRequestAll);
            
            // Close modal when clicking outside
            document.getElementById('request-all-modal')?.addEventListener('click', (e) => {
                if (e.target.id === 'request-all-modal') {
                    closeRequestAllModal();
                }
            });

            // Add favorite button click handlers
            document.addEventListener('click', (e) => {
                if (e.target.closest('.favorite-btn')) {
                    const btn = e.target.closest('.favorite-btn');
                    const propertyId = btn.dataset.propertyId;
                    const propertyDataStr = btn.dataset.property;
                    
                    if (!propertyDataStr) {
                        console.error('Property data not found');
                        return;
                    }
                    
                    try {
                        const propertyData = JSON.parse(propertyDataStr);
                        toggleFavorite(e, propertyData);
                    } catch (err) {
                        console.error('Error parsing property data:', err);
                    }
                }
            });
        }
