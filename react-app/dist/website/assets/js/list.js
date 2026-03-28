// ============================================================
        // JavaScript for Mobile Side Menu (from index)
        // ============================================================
        const menuToggle = document.getElementById('menu-toggle');
        const menuClose = document.getElementById('menu-close');
        const mobileMenu = document.getElementById('mobile-menu');
        const menuOverlay = document.getElementById('menu-overlay');

        if (menuToggle && mobileMenu && menuClose && menuOverlay) {
            const openMenu = () => {
                mobileMenu.classList.remove('translate-x-full');
                menuOverlay.classList.remove('hidden');
            };

            const closeMenu = () => {
                mobileMenu.classList.add('translate-x-full');
                menuOverlay.classList.add('hidden');
            };

            menuToggle.addEventListener('click', openMenu);
            menuClose.addEventListener('click', closeMenu);
            menuOverlay.addEventListener('click', closeMenu);
            
            // Close menu when a link inside is clicked
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', closeMenu);
            });
        }

        // ============================================================
        // JavaScript for Hero Image Slideshow (from index)
        // ============================================================
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

        // ============================================================
        // JavaScript for Image Preview Logic (Enhanced from list)
        // ============================================================
        const photoInput = document.getElementById('property-photos');
        const imagePreviews = document.getElementById('image-previews');
        const fileDropArea = photoInput?.closest('.file-drop-area'); 

        if (photoInput && imagePreviews && fileDropArea) { 
            // Clicking the area triggers the input
            fileDropArea.addEventListener('click', (e) => {
                 if (e.target.tagName !== 'BUTTON' && e.target.closest('.relative.group') === null) {
                    photoInput.click();
                }
            });

            // Handle file selection
            photoInput.addEventListener('change', function() {
                // Clear existing previews for simplicity in this update
                imagePreviews.innerHTML = '';
                if (this.files) {
                    Array.from(this.files).forEach(file => {
                        if (file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const div = document.createElement('div');
                                div.className = 'relative group';
                                
                                const img = document.createElement('img');
                                img.src = e.target.result;
                                img.alt = file.name;
                                img.className = 'w-full h-24 object-cover rounded-lg shadow-sm';
                                div.appendChild(img);

                                // Add remove button
                                const removeBtn = document.createElement('button');
                                removeBtn.innerHTML = '<i data-lucide="x" class="w-4 h-4"></i>';
                                removeBtn.classList.add('absolute', 'top-1', 'right-1', 'p-1', 'bg-red-600', 'text-white', 'rounded-full', 'opacity-0', 'group-hover:opacity-100', 'transition-opacity', 'focus:outline-none', 'focus:ring-2', 'focus:ring-red-500');
                                removeBtn.title = 'Remove image';
                                removeBtn.type = 'button'; 
                                removeBtn.onclick = (event) => {
                                    event.stopPropagation();
                                    div.remove();
                                    // Note: This only removes the preview. Full file list management would require more complex JS.
                                };
                                div.appendChild(removeBtn);

                                imagePreviews.appendChild(div);
                                lucide.createIcons(); // Re-render icon
                            };
                            reader.readAsDataURL(file);
                        }
                    });
                }
            });
        }

        // Initialize Lucide icons on DOMContentLoaded for all static and dynamic elements
        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();

            // ============================================================
            // Form Submission Handler for Property Enquiry
            // ============================================================
            const propertyForm = document.getElementById('property-form');
            const submitMessage = document.getElementById('submit-message');

            if (propertyForm) {
                propertyForm.addEventListener('submit', async (e) => {
                    e.preventDefault();

                    // Show loading state
                    const submitBtn = propertyForm.querySelector('button[type="submit"]');
                    const originalText = submitBtn.innerHTML;
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i data-lucide="loader" class="w-5 h-5 inline mr-2 animate-spin"></i><span>Submitting...</span>';

                    try {
                        // Prepare form data
                        const formData = new FormData(propertyForm);

                        // Build enquiry data
                        const ownerName = (formData.get('name') || '').toString().trim();
                        const propertyName = (formData.get('property_name') || '').toString().trim();
                        const city = (formData.get('city') || '').toString().trim();
                        const country = (formData.get('country') || '').toString().trim();
                        const contactName = (formData.get('contact_name') || '').toString().trim();
                        const additionalMessage = (formData.get('additional_message') || '').toString().trim();
                        const tenantsManaged = parseInt(formData.get('tenants_managed'), 10) || 0;

                        const enquiryDescriptionLines = [
                            `Tenants Managed: ${tenantsManaged}`,
                            `Contact Name: ${contactName}`
                        ];
                        if (additionalMessage) {
                            enquiryDescriptionLines.push(`Additional Message: ${additionalMessage}`);
                        }

                        const enquiryData = {
                            property_type: formData.get('property_type') || 'pg',
                            property_name: propertyName,
                            city: city,
                            locality: country,
                            address: '',
                            pincode: '',
                            description: enquiryDescriptionLines.join('\n'),
                            amenities: [],
                            gender_suitability: '',
                            rent: 0,
                            deposit: '',
                            owner_name: ownerName,
                            owner_email: '',
                            owner_phone: (formData.get('owner_phone') || 'NA').toString(),
                            contact_name: contactName,
                            tenants_managed: tenantsManaged,
                            country: country,
                            additional_message: additionalMessage
                        };

                        // Submit to MongoDB via API
                        const response = await fetch(API_URL + '/api/website-enquiry/submit', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(enquiryData)
                        });

                        const result = await response.json();

                        if (!response.ok) {
                            throw new Error(result.message || 'Failed to submit enquiry');
                        }

                        // Show success message
                        submitMessage.innerHTML = `
                            <div class="bg-green-50 border border-green-200 text-green-800">
                                <strong>Success!</strong> Your property enquiry has been submitted successfully.
                                <br>It will be reviewed by our team soon.
                            </div>
                        `;
                        submitMessage.classList.remove('hidden');

                        // Reset form
                        propertyForm.reset();

                        // Clear image previews (if section exists)
                        if (imagePreviews) {
                            imagePreviews.innerHTML = '';
                        }

                        // Re-enable submit button
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                    } catch (error) {
                        console.error('Submission error:', error);
                        submitMessage.innerHTML = `
                            <div class="bg-red-50 border border-red-200 text-red-800">
                                <strong>Error!</strong> ${error.message}. Please try again later.
                            </div>
                        `;
                        submitMessage.classList.remove('hidden');
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                    }
                });
            }
        });


        // Load cities from MongoDB API (with localStorage fallback)
        async function loadCities() {
            const citySelect = document.getElementById('city');
            
            // Clear existing options except "Select City"
            while (citySelect.options.length > 1) {
                citySelect.remove(1);
            }
            
            let citiesData = [];
            
            // Try to fetch from API first
            try {
                const response = await fetch(`${API_URL}/api/cities`);
                if (response.ok) {
                    const data = await response.json();
                    citiesData = (data.data || []).map(c => c.name);
                    console.log('? Cities loaded from API');
                }
            } catch (err) {
                console.log('API fetch failed, trying localStorage:', err);
            }
            
            // If API failed, try localStorage
            if (citiesData.length === 0) {
                const cachedCities = JSON.parse(localStorage.getItem('roomhy_cities') || '[]');
                citiesData = cachedCities.map(city => {
                    if (typeof city === 'string') return city;
                    if (typeof city === 'object' && city.name) return city.name;
                    return null;
                }).filter(c => c !== null);
            }
            
            // If still no cities, use defaults
            if (citiesData.length === 0) {
                citiesData = ['Indore', 'Kota', 'Ahmedabad', 'Delhi'];
            }
            
            // Add cities to dropdown
            citiesData.forEach(city => {
                const option = document.createElement('option');
                option.value = city.toLowerCase();
                option.textContent = city;
                citySelect.appendChild(option);
            });
            
            // Add custom location option
            const customOption = document.createElement('option');
            customOption.value = 'custom';
            customOption.textContent = '+ Add Custom Location';
            citySelect.appendChild(customOption);
        }

        // Load cities when page loads
        document.addEventListener('DOMContentLoaded', function() {
            loadCities();
            
            // Handle custom location selection
            const citySelect = document.getElementById('city');
            citySelect.addEventListener('change', function() {
                if (this.value === 'custom') {
                    const customLocation = prompt('Enter your city/location name:');
                    if (customLocation && customLocation.trim()) {
                        // Create new option with custom location
                        const newOption = document.createElement('option');
                        newOption.value = customLocation.toLowerCase();
                        newOption.textContent = customLocation;
                        newOption.selected = true;
                        
                        // Insert before "custom" option
                        citySelect.insertBefore(newOption, citySelect.options[citySelect.options.length - 1]);
                    }
                    // Reset if user cancels
                    if (!customLocation) {
                        this.value = '';
                    }
                }
            });
        });

