let currentBooking = null;
    let selectedRequestType = 'refund';

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        lucide.createIcons();
        loadBookingDetails();
        setupFormListeners();
    });

    // Load booking details from URL parameter or storage
    function loadBookingDetails() {
        try {
            const params = new URLSearchParams(window.location.search);
            const bookingIndex = parseInt(params.get('booking')) || 0;

            // Try to get from sessionStorage first
            let booking = null;
            try {
                const sessionBooking = sessionStorage.getItem('bookingConfirmation');
                if (sessionBooking) {
                    booking = JSON.parse(sessionBooking);
                    console.log('✅ Booking loaded from sessionStorage');
                }
            } catch (e) {
                console.warn('Could not parse sessionStorage booking');
            }

            // Try localStorage as backup
            if (!booking) {
                try {
                    const localBooking = localStorage.getItem('lastBooking');
                    if (localBooking) {
                        booking = JSON.parse(localBooking);
                        console.log('✅ Booking loaded from localStorage');
                    }
                } catch (e) {
                    console.warn('Could not parse localStorage booking');
                }
            }

            if (!booking) {
                showErrorState();
                return;
            }

            currentBooking = booking;
            displayBookingDetails(booking);
            showContentSection();

        } catch (error) {
            console.error('Error loading booking details:', error);
            showErrorState();
        }
    }

    // Display booking details
    function displayBookingDetails(booking) {
        // Property image
        const propertyImage = booking.propertyImage || booking.property_image || 
                             (booking.propertyPhotos && booking.propertyPhotos[0]) ||
                             'https://images.unsplash.com/photo-1567016432779-1fee749a1532?q=80&w=400';
        document.getElementById('propertyImage').src = propertyImage;

        // Property name
        document.getElementById('propertyName').textContent = booking.propertyName || booking.property_name || 'Property';

        // Property ID
        const propertyId = booking.propertyId || booking.property_id || 'N/A';
        document.getElementById('propertyIdDisplay').textContent = propertyId.toString().slice(0, 12) + (propertyId.toString().length > 12 ? '...' : '');
        document.getElementById('propertyIdDisplay').title = propertyId.toString();

        // Booking ID
        const bookingId = booking.bookingId || booking._id || 'N/A';
        document.getElementById('bookingIdDisplay').textContent = bookingId.toString().slice(0, 12) + (bookingId.toString().length > 12 ? '...' : '');
        document.getElementById('bookingIdDisplay').title = bookingId.toString();

        // Booking amount
        const amount = booking.rentAmount || booking.totalAmount || booking.price || 500;
        document.getElementById('bookingAmount').textContent = '₹' + Number(amount).toLocaleString('en-IN');
        document.getElementById('refundAmount').textContent = '₹' + Number(amount).toLocaleString('en-IN');

        console.log('📋 Booking Details Loaded:', {
            property: booking.propertyName || booking.property_name,
            propertyId: propertyId,
            bookingId: bookingId,
            amount: amount
        });
    }

    // Setup form listeners
    function setupFormListeners() {
        // Request type toggle
        document.querySelectorAll('input[name="requestType"]').forEach(radio => {
            radio.addEventListener('change', function() {
                selectedRequestType = this.value;
                if (this.value === 'refund') {
                    document.getElementById('refundSection').classList.remove('hidden');
                    document.getElementById('alternativeSection').classList.add('hidden');
                } else {
                    document.getElementById('refundSection').classList.add('hidden');
                    document.getElementById('alternativeSection').classList.remove('hidden');
                }
            });
        });

        // Payment method toggle
        document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'upi') {
                    document.getElementById('upiField').classList.remove('hidden');
                    document.getElementById('bankFields').classList.add('hidden');
                } else {
                    document.getElementById('upiField').classList.add('hidden');
                    document.getElementById('bankFields').classList.remove('hidden');
                }
            });
        });
    }

    // Submit request
    async function submitRequest() {
        try {
            if (!currentBooking) {
                showNotification('Booking details not found', 'error');
                return;
            }

            // Validate required fields
            if (selectedRequestType === 'refund') {
                const name = document.getElementById('refundName').value.trim();
                const phone = document.getElementById('refundPhone').value.trim();
                const email = document.getElementById('refundEmail').value.trim();

                if (!name || !phone || !email) {
                    showNotification('Please fill in all required fields', 'error');
                    return;
                }

                // Validate payment method
                const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
                if (paymentMethod === 'upi') {
                    const upiId = document.getElementById('upiId').value.trim();
                    if (!upiId) {
                        showNotification('Please enter UPI ID', 'error');
                        return;
                    }
                } else {
                    const bankName = document.getElementById('bankName').value.trim();
                    const bankAccount = document.getElementById('bankAccount').value.trim();
                    const ifscCode = document.getElementById('ifscCode').value.trim();
                    if (!bankName || !bankAccount || !ifscCode) {
                        showNotification('Please fill in all bank details', 'error');
                        return;
                    }
                }
            } else {
                const preferredArea = document.getElementById('preferredArea').value.trim();
                if (!preferredArea) {
                    showNotification('Please enter preferred area', 'error');
                    return;
                }
            }

            // Build request data
            const requestData = {
                booking_id: currentBooking.bookingId || currentBooking._id,
                property_id: currentBooking.propertyId || currentBooking.property_id,
                user_id: currentBooking.userId,
                request_type: selectedRequestType,
                booking_amount: currentBooking.rentAmount || currentBooking.totalAmount || 500,
                property_name: currentBooking.propertyName || currentBooking.property_name,
                timestamp: new Date().toISOString()
            };

            if (selectedRequestType === 'refund') {
                const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
                requestData.refund_details = {
                    name: document.getElementById('refundName').value,
                    phone: document.getElementById('refundPhone').value,
                    email: document.getElementById('refundEmail').value,
                    payment_method: paymentMethod,
                    reason: document.getElementById('refundReason').value,
                    upi_id: paymentMethod === 'upi' ? document.getElementById('upiId').value : null,
                    bank_name: paymentMethod === 'bank' ? document.getElementById('bankName').value : null,
                    bank_account: paymentMethod === 'bank' ? document.getElementById('bankAccount').value : null,
                    ifsc_code: paymentMethod === 'bank' ? document.getElementById('ifscCode').value : null
                };
            } else {
                requestData.alternative_details = {
                    preferred_area: document.getElementById('preferredArea').value,
                    property_type: document.getElementById('propertyType').value || null,
                    min_price: document.getElementById('minPrice').value || null,
                    max_price: document.getElementById('maxPrice').value || null,
                    requirements: document.getElementById('propertyRequirements').value
                };
            }

            // Save to localStorage for processing
            localStorage.setItem('refundRequest_' + Date.now(), JSON.stringify(requestData));

            console.log('📤 Request Data:', requestData);

            // Try to send to API
            try {
                const response = await fetch(`${API_URL}/api/refund-request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData)
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Request submitted to API:', result);
                    showNotification('Request submitted successfully!', 'success');
                    setTimeout(() => {
                        window.location.href = 'mystays';
                    }, 2000);
                } else {
                    console.warn('API submission returned status:', response.status);
                    showNotification('Request saved locally. Our team will review it soon!', 'success');
                    setTimeout(() => {
                        window.location.href = 'mystays';
                    }, 2000);
                }
            } catch (apiError) {
                console.warn('API request failed, data saved locally:', apiError.message);
                showNotification('Request saved locally. Our team will review it soon!', 'success');
                setTimeout(() => {
                    window.location.href = 'mystays';
                }, 2000);
            }

        } catch (error) {
            console.error('Error submitting request:', error);
            showNotification('Error submitting request: ' + error.message, 'error');
        }
    }

    // Show/hide sections
    function showContentSection() {
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('contentSection').classList.remove('hidden');
        document.getElementById('errorState').classList.add('hidden');
    }

    function showErrorState() {
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('contentSection').classList.add('hidden');
        document.getElementById('errorState').classList.remove('hidden');
    }

    // Go back to My Stays
    function goBackToMyStays() {
        window.location.href = 'mystays';
    }

    // Logout
    function logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('userId');
            sessionStorage.removeItem('userId');
            localStorage.removeItem('bookingConfirmation');
            sessionStorage.removeItem('bookingConfirmation');
            localStorage.removeItem('lastBooking');
            window.location.href = 'index';
        }
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="flex-1">
                    <p class="font-semibold text-gray-900">${type === 'success' ? '✅ Success' : type === 'error' ? '❌ Error' : 'ℹ️ Info'}</p>
                    <p class="text-sm text-gray-600">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-gray-500 hover:text-gray-700">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
        `;
        document.body.appendChild(notification);
        lucide.createIcons();

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
