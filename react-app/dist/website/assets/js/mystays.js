let userBookings = [];
    let selectedBooking = null;

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize Lucide icons
        lucide.createIcons();
        
        // Setup mobile menu
        setupMobileMenu();
        
        // Update mobile menu state based on login status
        updateMobileMenuState();
        
        // Listen for storage changes (logout from other tabs)
        window.addEventListener('storage', updateMobileMenuState);
        
        // Get user identity from URL/storage/auth
        const userId = getUserIdFromUrl()
            || getCurrentUserIdFromSession()
            || localStorage.getItem('userId')
            || sessionStorage.getItem('userId');
        const userEmail = getCurrentUserEmail();
        
        console.log('Loading bookings for identity:', { userId, userEmail });
        loadUserBookings(userId || null, userEmail || '');
        setupPaymentMethodToggle();
    });

    // Setup mobile menu
    function setupMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const menuClose = document.getElementById('menu-close');
        const mobileMenu = document.getElementById('mobile-menu');
        const menuOverlay = document.getElementById('menu-overlay');

        menuToggle.addEventListener('click', function() {
            mobileMenu.classList.remove('translate-x-full');
            menuOverlay.classList.remove('hidden');
        });

        menuClose.addEventListener('click', function() {
            mobileMenu.classList.add('translate-x-full');
            menuOverlay.classList.add('hidden');
        });

        menuOverlay.addEventListener('click', function() {
            mobileMenu.classList.add('translate-x-full');
            menuOverlay.classList.add('hidden');
        });

        // Close menu when clicking on a link
        const menuLinks = mobileMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.add('translate-x-full');
                menuOverlay.classList.add('hidden');
            });
        });
        
        // Handle logout button click
        const logoutButton = mobileMenu.querySelector('button[onclick="globalLogout()"]');
        if (logoutButton) {
            logoutButton.addEventListener('click', function() {
                mobileMenu.classList.add('translate-x-full');
                menuOverlay.classList.add('hidden');
            });
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
            window.location.href = 'login';
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

    // Get User ID from URL parameter
    function getUserIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId');
        const email = params.get('email') || params.get('tenantEmail');
        if (userId) {
            localStorage.setItem('userId', userId);
        }
        if (email && String(email).trim()) {
            const normalized = String(email).trim().toLowerCase();
            localStorage.setItem('userEmail', normalized);
            sessionStorage.setItem('userEmail', normalized);
        }
        return userId || null;
    }

    function getCurrentUserIdFromSession() {
        try {
            if (typeof AuthUtils !== 'undefined') {
                if (typeof AuthUtils.getUserId === 'function') {
                    const id = AuthUtils.getUserId();
                    if (id && String(id).trim()) return String(id).trim();
                }
                if (typeof AuthUtils.getUser === 'function') {
                    const u = AuthUtils.getUser() || {};
                    const id = u.userId || u.user_id || u.loginId || u.id;
                    if (id && String(id).trim()) return String(id).trim();
                }
            }
        } catch (_e) {}

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const id = user.userId || user.user_id || user.loginId || user.id;
            if (id && String(id).trim()) return String(id).trim();
        } catch (_e) {}

        try {
            const tenantUser = JSON.parse(localStorage.getItem('tenant_user') || '{}');
            const id = tenantUser.userId || tenantUser.user_id || tenantUser.loginId || tenantUser.id;
            if (id && String(id).trim()) return String(id).trim();
        } catch (_e) {}

        return null;
    }

    function getCurrentUserEmail() {
        try {
            if (typeof AuthUtils !== 'undefined' && AuthUtils.getUser) {
                const authUser = AuthUtils.getUser();
                if (authUser && authUser.email) return String(authUser.email).trim().toLowerCase();
            }
        } catch (_e) {}

        const candidates = [
            localStorage.getItem('userEmail'),
            (() => {
                try { return JSON.parse(localStorage.getItem('user') || '{}').email; } catch (_e) { return ''; }
            })(),
            (() => {
                try { return JSON.parse(localStorage.getItem('currentUser') || '{}').email; } catch (_e) { return ''; }
            })()
        ];

        const email = candidates.find((v) => typeof v === 'string' && v.trim().length > 0);
        return email ? email.trim().toLowerCase() : '';
    }

    // Load user's bookings from sessionStorage
    async function loadUserBookings(userId, userEmail = '') {
        try {
            const bookings = [];

            // First try sessionStorage
            try {
                const bookingDataStr = sessionStorage.getItem('bookingConfirmation');
                if (bookingDataStr) {
                    const bookingData = JSON.parse(bookingDataStr);
                    if (bookingData && typeof bookingData === 'object') {
                        bookings.push(bookingData);
                    }
                }
            } catch (e) {
                console.error('Error parsing session booking data:', e);
            }

            // Then try localStorage
            try {
                const localBooking = localStorage.getItem('lastBooking');
                if (localBooking) {
                    const parsed = JSON.parse(localBooking);
                    if (parsed && typeof parsed === 'object') {
                        bookings.push(parsed);
                    }
                }
            } catch (e) {
                console.error('Error parsing local booking:', e);
            }

            // Then try API
            if (userId || userEmail) {
                try {
                    const identity = userId || userEmail;
                    const querySuffix = userEmail ? `?email=${encodeURIComponent(userEmail)}` : '';
                    const bookingEndpoints = [
                        `${API_URL}/api/booking/user/${encodeURIComponent(identity)}${querySuffix}`,
                        `${API_URL}/api/bookings/user/${encodeURIComponent(identity)}${querySuffix}`
                    ];

                    for (const endpoint of bookingEndpoints) {
                        const response = await fetch(endpoint, {
                            method: 'GET',
                            headers: { 'Content-Type': 'application/json' }
                        });

                        if (response.status === 404) continue;
                        if (!response.ok) {
                            console.warn('API returned status:', response.status, 'for', endpoint);
                            break;
                        }

                        const data = await response.json();
                        const apiBookings = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
                        bookings.push(...apiBookings);
                        break;
                    }
                } catch (apiError) {
                    console.warn('API call failed:', apiError.message);
                }
            }

            const dedupedBookings = [];
            const seen = new Set();
            for (const booking of bookings) {
                if (!booking || typeof booking !== 'object') continue;

                const bookingKey = booking.booking_id || booking.bookingId || booking._id || booking.id;
                const fallbackKey = `${booking.user_id || booking.userId || ''}::${booking.property_id || booking.propertyId || ''}::${booking.payment_id || booking.paymentId || ''}`;
                const key = String(bookingKey || fallbackKey);
                if (!key || seen.has(key)) continue;

                seen.add(key);
                dedupedBookings.push(booking);
            }

            userBookings = dedupedBookings;
            displayBookings();
        } catch (error) {
            console.error('Error loading bookings:', error);
            displayBookings();
        }
    }

    // Display bookings with professional photos
    function displayBookings() {
        const container = document.getElementById('bookingsContainer');
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');

        loadingState.classList.add('hidden');

        if (!userBookings || userBookings.length === 0) {
            container.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        container.classList.remove('hidden');
        
        // Render all bookings
        container.innerHTML = userBookings.map((booking, index) => {
            const isValidImageUrl = (value) => {
                if (!value || typeof value !== 'string') return false;
                const url = value.trim();
                if (!url) return false;
                const lowered = url.toLowerCase();
                if (lowered === 'null' || lowered === 'undefined' || lowered === '[object object]') return false;
                return /^https?:\/\//.test(url) || url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
            };

            const extractImageUrls = (value) => {
                if (!value) return [];

                if (Array.isArray(value)) {
                    return value
                        .map((item) => {
                            if (typeof item === 'string') return item.trim();
                            if (item && typeof item === 'object') {
                                return item.url || item.secure_url || item.src || item.image || '';
                            }
                            return '';
                        })
                        .filter(isValidImageUrl);
                }

                if (typeof value === 'string') {
                    const trimmed = value.trim();
                    if (!trimmed) return [];
                    if (isValidImageUrl(trimmed)) return [trimmed];

                    // Support JSON strings and comma-separated image values from different APIs.
                    try {
                        const parsed = JSON.parse(trimmed);
                        return extractImageUrls(parsed);
                    } catch (_) {
                        return trimmed
                            .split(',')
                            .map((item) => item.trim())
                            .filter(isValidImageUrl);
                    }
                }

                if (typeof value === 'object') {
                    return [value.url || value.secure_url || value.src || value.image || ''].filter(isValidImageUrl);
                }

                return [];
            };

            // Collect photos from all common backend key variants.
            const photos = [
                ...extractImageUrls(booking.propertyPhotos),
                ...extractImageUrls(booking.property_photos),
                ...extractImageUrls(booking.propertyImages),
                ...extractImageUrls(booking.property_images),
                ...extractImageUrls(booking.photos),
                ...extractImageUrls(booking.images)
            ].filter((url, i, arr) => arr.indexOf(url) === i);

            // Choose main image from explicit keys first, then first photo.
            const mainImageCandidates = [
                booking.propertyImage,
                booking.property_image,
                booking.property_photo,
                booking.image,
                booking.thumbnail,
                booking?.property?.image,
                booking?.property?.property_image,
                booking?.propertyDetails?.image
            ];

            let mainImage = null;
            for (const candidate of mainImageCandidates) {
                const extracted = extractImageUrls(candidate);
                if (extracted.length > 0) {
                    mainImage = extracted[0];
                    break;
                }
            }

            mainImage = mainImage ||
                (photos && photos.length > 0 ? photos[0] : null) ||
                `https://images.unsplash.com/photo-1567016432779-1fee749a1532?q=80&w=1974&auto=format&fit=crop&property=${booking.propertyId || booking.property_id || 'default'}`;
            
            console.log(`🖼️  Property ${booking.property_name}: Image = ${mainImage ? 'Found' : 'Using default'}`);
            
            // Build thumbnail scroller (up to 4 thumbnails)
            const thumbsHtml = (photos && photos.length) ? 
                photos.slice(0,4).map(photoUrl => `<img src="${photoUrl}" class="h-16 w-20 object-cover rounded cursor-pointer hover:opacity-80 transition" onerror="this.style.display='none'">`).join('') : 
                '';

            // Status styling
            const statusClass = getStatusClass(booking.booking_status || booking.bookingStatus);
            const statusText = getStatusText(booking.booking_status || booking.bookingStatus);
            
            // Property ID
            const propertyId = booking.propertyId || booking.property_id || booking._id || 'N/A';
            const displayPropertyId = propertyId.toString().length > 20 ? propertyId.toString().slice(0, 12) + '...' : propertyId;

            return `
                <div class="light-card rounded-xl overflow-hidden h-full flex flex-col">
                    <!-- Content Section -->
                    <div class="p-5 flex-grow flex flex-col">
                        <!-- Title & Location -->
                        <div class="mb-4">
                            <h3 class="text-xl font-bold text-gray-900 line-clamp-2">${booking.property_name || booking.propertyName || 'Property'}</h3>
                            <div class="flex items-center gap-1 text-gray-600 mt-2">
                                <i data-lucide="map-pin" class="w-4 h-4"></i>
                                <p class="text-sm line-clamp-1">${booking.property_location || booking.location || booking.area || 'Location'}</p>
                            </div>
                        </div>

                        <!-- Property ID -->
                        <div class="mb-3 text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                            <span class="text-blue-700 font-semibold block mb-1">Property ID</span>
                            <span title="${propertyId}" class="block font-mono text-xs break-all">${displayPropertyId}</span>
                        </div>

                        <!-- Dates Grid -->
                        <div class="grid grid-cols-2 gap-3 py-3 border-t border-b border-gray-200 mb-4">
                            <div>
                                <p class="text-xs text-gray-600 font-semibold uppercase">Check-in</p>
                                <p class="font-bold text-gray-900 text-sm">${formatDate(booking.check_in_date || booking.checkInDate || booking.start_date || new Date().toISOString())}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-600 font-semibold uppercase">Check-out</p>
                                <p class="font-bold text-gray-900 text-sm">${formatDate(booking.check_out_date || booking.checkOutDate || booking.end_date || new Date().toISOString())}</p>
                            </div>
                        </div>

                        <!-- Rent Amount -->
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-gray-700 font-medium">Total Amount:</span>
                            <span class="text-2xl font-bold text-blue-600">₹${Number(booking.total_amount || booking.totalAmount || booking.price || 0).toLocaleString('en-IN')}</span>
                        </div>

                        <!-- Photo Thumbnails -->
                        ${thumbsHtml ? `
                        <div class="mb-4 overflow-x-auto horizontal-slider">
                            <div class="flex gap-2 pb-2">
                                ${thumbsHtml}
                            </div>
                        </div>
                        ` : ''}

                        <!-- Action Buttons -->
                        <div class="flex gap-3 pt-4 mt-auto">
                            <button onclick="openRefundModal(${index})" class="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2 text-sm">
                                <i data-lucide="undo-2" class="w-4 h-4"></i>
                                <span>Refund</span>
                            </button>
                            <button onclick="openRefundModalAlt(${index})" class="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm">
                                <i data-lucide="repeat" class="w-4 h-4"></i>
                                <span>Alternative</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        lucide.createIcons();
    }

    // Format date
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return dateString;
        }
    }

    // Get status class
    function getStatusClass(status) {
        if (!status) return 'status-active';
        const statusStr = String(status).toLowerCase();
        if (statusStr.includes('confirmed') || statusStr.includes('active')) return 'status-active';
        if (statusStr.includes('upcoming')) return 'status-upcoming';
        return 'status-completed';
    }

    // Get status text
    function getStatusText(status) {
        if (!status) return 'Active';
        const statusStr = String(status).toLowerCase();
        const statusMap = {
            'confirmed': 'Confirmed',
            'active': 'Active',
            'upcoming': 'Upcoming',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        for (let [key, value] of Object.entries(statusMap)) {
            if (statusStr.includes(key)) return value;
        }
        return 'Active';
    }

    // Open refund modal
    function openRefundModal(bookingIndex) {
        selectedBooking = userBookings[bookingIndex];
        if (!selectedBooking) return;

        // Ensure booking has all required fields - handle BOTH camelCase AND snake_case
        selectedBooking.booking_id = selectedBooking.booking_id || selectedBooking.bookingId || selectedBooking._id || selectedBooking.id || '';
        selectedBooking.user_id = selectedBooking.user_id || selectedBooking.userId || localStorage.getItem('userId') || sessionStorage.getItem('userId') || '';
        selectedBooking.payment_id = selectedBooking.payment_id || selectedBooking.paymentId || selectedBooking._id || selectedBooking.bookingId || '';
        selectedBooking.email = selectedBooking.email || selectedBooking.user_email || selectedBooking.userEmail || localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || '';
        
        console.log('🎫 Opening refund modal for booking:', selectedBooking);
        console.log('   Booking ID:', selectedBooking.booking_id);
        console.log('   User ID:', selectedBooking.user_id);
        console.log('   Payment ID:', selectedBooking.payment_id);
        console.log('   Email:', selectedBooking.email);

        document.getElementById('refundModal').classList.remove('hidden');
        document.getElementById('modalPropertyName').textContent = selectedBooking.property_name || selectedBooking.propertyName || 'Property';
        document.getElementById('modalPropertyDetails').textContent = `${selectedBooking.property_location || selectedBooking.location || 'Location'}`;
        
        // Auto-populate form fields from booking
        document.getElementById('refundName').value = selectedBooking.name || selectedBooking.user_name || '';
        document.getElementById('refundPhone').value = selectedBooking.phone || selectedBooking.user_phone || '';
        document.getElementById('refundEmail').value = selectedBooking.email || selectedBooking.user_email || selectedBooking.userEmail || '';
        
        // Set to refund option
        document.getElementById('refundOption').checked = true;
        document.getElementById('refundForm').classList.remove('hidden');
        document.getElementById('alternativeForm').classList.add('hidden');
    }

    // Open refund modal with alternative selected
    function openRefundModalAlt(bookingIndex) {
        openRefundModal(bookingIndex);
        document.getElementById('alternativeOption').checked = true;
        document.getElementById('refundForm').classList.add('hidden');
        document.getElementById('alternativeForm').classList.remove('hidden');
    }

    // Close refund modal
    function closeRefundModal() {
        document.getElementById('refundModal').classList.add('hidden');
        selectedBooking = null;
    }

    // Setup payment method toggle
    function setupPaymentMethodToggle() {
        const upiRadio = document.getElementById('upiMethod');
        const bankRadio = document.getElementById('bankMethod');
        const upiField = document.getElementById('upiField');
        const bankFields = document.getElementById('bankFields');

        [upiRadio, bankRadio].forEach(radio => {
            radio.addEventListener('change', function() {
                if (document.getElementById('upiMethod').checked) {
                    upiField.classList.remove('hidden');
                    bankFields.classList.add('hidden');
                } else if (document.getElementById('bankMethod').checked) {
                    upiField.classList.add('hidden');
                    bankFields.classList.remove('hidden');
                } else {
                    upiField.classList.add('hidden');
                    bankFields.classList.add('hidden');
                }
            });
        });
    }

    // Submit refund request
    async function submitRefundRequest() {
        if (!selectedBooking) {
            alert('❌ No booking selected. Please select a booking first.');
            return;
        }

        const requestType = document.querySelector('input[name="requestType"]:checked').value;
        const name = document.getElementById('refundName').value.trim() || selectedBooking.name || selectedBooking.user_name || '';
        const phone = document.getElementById('refundPhone').value.trim() || selectedBooking.phone || selectedBooking.user_phone || '';
        const email = document.getElementById('refundEmail').value.trim() || selectedBooking.email || selectedBooking.user_email || selectedBooking.userEmail || localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || '';
        const refundMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;

        // Validate required fields
        if (!name || !phone) {
            alert('❌ Please enter name and phone number');
            return;
        }

        if (requestType === 'refund' && !refundMethod) {
            alert('❌ Please select a refund method (UPI or Bank)');
            return;
        }

        // Validate payment method details
        if (requestType === 'refund' && refundMethod === 'upi') {
            const upiId = document.getElementById('upiId').value.trim();
            if (!upiId) {
                alert('❌ Please enter your UPI ID');
                return;
            }
        }

        if (requestType === 'refund' && refundMethod === 'bank') {
            const bankAccount = document.getElementById('bankAccount').value.trim();
            const ifscCode = document.getElementById('ifscCode').value.trim();
            const bankNameField = document.getElementById('bankNameField').value.trim();
            if (!bankAccount || !ifscCode || !bankNameField) {
                alert('❌ Please enter all bank details (Account, IFSC, Bank Name)');
                return;
            }
        }

        // Build refund request payload
        const refundAmount = Number(selectedBooking.total_amount || selectedBooking.totalAmount || selectedBooking.price || 500);
        
        // Get user ID from available sources (handle both camelCase and snake_case)
        const userId = selectedBooking.user_id || selectedBooking.userId || localStorage.getItem('userId') || sessionStorage.getItem('userId') || '';
        
        // Build booking ID - try all variations (camelCase, snake_case, MongoDB formats)
        const bookingId = selectedBooking.booking_id || selectedBooking.bookingId || selectedBooking._id || selectedBooking.id || '';
        
        // Get payment ID - must have a fallback
        const paymentId = selectedBooking.payment_id || selectedBooking.paymentId || selectedBooking.payment_id || selectedBooking._id || selectedBooking.bookingId || '';
        
        const refundPayload = {
            booking_id: bookingId,
            user_id: userId,
            payment_id: paymentId,
            user_name: name,
            user_phone: phone,
            user_email: email,
            refund_amount: refundAmount,
            request_type: requestType,
            refund_method: refundMethod || null,
            upi_id: document.getElementById('upiId').value.trim() || null,
            bank_account_holder: document.getElementById('bankName').value.trim() || null,
            bank_account_number: document.getElementById('bankAccount').value.trim() || null,
            bank_ifsc_code: document.getElementById('ifscCode').value.trim() || null,
            bank_name: document.getElementById('bankNameField').value.trim() || null,
            preferred_area: document.getElementById('preferredArea').value.trim() || null,
            property_requirements: document.getElementById('propertyRequirements').value.trim() || null
        };
        
        console.log('📤 Submitting refund request:', refundPayload);
        console.log('   Booking ID:', bookingId);
        console.log('   User ID:', userId);
        console.log('   Payment ID:', paymentId);

        // Show loading state
        const modal = document.getElementById('refundModal');
        const submitBtn = modal.querySelector('button:last-of-type');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        let submitted = false;

        try {
            const response = await fetch(`${API_URL}/api/booking/refund-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(refundPayload)
            });

            if (response.ok) {
                const result = await response.json();
                submitted = true;
                console.log('✅ Refund request submitted successfully:', result);
                alert('✅ Request Submitted!\n\nYour refund/alternative property request has been submitted. Our team will review it within 24-48 hours.');
                
                // Store submission locally for tracking
                const submissions = JSON.parse(localStorage.getItem('refundSubmissions') || '[]');
                submissions.push({
                    ...refundPayload,
                    submitted_at: new Date().toISOString(),
                    status: 'submitted'
                });
                localStorage.setItem('refundSubmissions', JSON.stringify(submissions));
            } else {
                let errorMessage = 'Please try again';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
                    console.error('❌ API validation error:', errorData);
                } catch (e) {
                    errorMessage = `Server error (${response.status}): ${response.statusText}`;
                    console.error('❌ API error:', response.status, response.statusText);
                }
                alert(`❌ Submission failed:\n\n${errorMessage}\n\nMake sure all required fields are filled correctly.`);
            }
        } catch (error) {
            console.warn('API submission failed, saving locally:', error.message);
            // Save locally if API is not available - still mark as success for user
            const submissions = JSON.parse(localStorage.getItem('refundSubmissions') || '[]');
            submissions.push({
                ...refundPayload,
                submitted_at: new Date().toISOString(),
                status: 'pending_sync',
                error_message: error.message
            });
            localStorage.setItem('refundSubmissions', JSON.stringify(submissions));
            
            alert('✅ Request Saved!\n\nYour request has been saved locally. It will be synced to our server when connection is available.');
            submitted = true;
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            // Close modal if submission was successful
            if (submitted) {
                closeRefundModal();
                // Reload bookings to refresh display
                const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
                const userEmail = getCurrentUserEmail();
                if (userId) {
                    setTimeout(() => {
                        loadUserBookings(userId, userEmail);
                    }, 500);
                }
            }
        }
    }

    // Close modal on outside click
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('refundModal');
        if (event.target === modal) {
            closeRefundModal();
        }
    });

    // Logout function
    function logout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear all user data
            localStorage.removeItem('userId');
            sessionStorage.removeItem('userId');
            localStorage.removeItem('roomhy_user_session');
            localStorage.removeItem('bookingConfirmation');
            sessionStorage.removeItem('bookingConfirmation');
            localStorage.removeItem('lastBooking');
            
            // Redirect to home
            window.location.href = '/';
        }
    }

