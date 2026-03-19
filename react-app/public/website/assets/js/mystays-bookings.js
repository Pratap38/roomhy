lucide.createIcons();

    let userBookings = [];
    let selectedBooking = null;

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        const userId = getUserIdFromUrl() || localStorage.getItem('userId') || 'ROOMHY2776';
        loadUserBookings(userId);
        setupPaymentMethodToggle();
    });

    // Get User ID from URL or session
    function getUserIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('userId');
    }

    // Load user's bookings
    async function loadUserBookings(userId) {
        try {
            // For demo, we'll create a mock booking. In production, fetch from API
            const response = await fetch(`${API_URL}/api/booking/user/${userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }).catch(() => null);

            let bookings = [];
            
            if (response && response.ok) {
                const data = await response.json();
                bookings = data.data || [];
            } else {
                // Demo data if API not available
                bookings = [
                    {
                        _id: 'booking123',
                        property_id: 'prop001',
                        property_name: '3BHK Luxury Apartment',
                        property_location: 'Whitefield, Bangalore',
                        property_image: 'https://via.placeholder.com/400x300?text=Luxury+Apartment',
                        check_in_date: new Date(Date.now() + 86400000).toLocaleDateString(),
                        check_out_date: new Date(Date.now() + 864000000).toLocaleDateString(),
                        total_amount: 15000,
                        booking_status: 'confirmed',
                        payment_id: 'pay_demo123'
                    }
                ];
            }

            userBookings = bookings;
            displayBookings();
        } catch (error) {
            console.error('Error loading bookings:', error);
            displayBookings();
        }
    }

    // Display bookings
    function displayBookings() {
        const container = document.getElementById('bookingsContainer');
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');

        loadingState.classList.add('hidden');

        if (userBookings.length === 0) {
            container.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        container.classList.remove('hidden');
        container.innerHTML = userBookings.map(booking => `
            <div class="property-card bg-white rounded-lg overflow-hidden">
                <!-- Image -->
                <div class="image-container">
                    <img src="${booking.property_image || 'https://via.placeholder.com/400x300'}" alt="${booking.property_name}">
                    <div class="status-badge ${getStatusClass(booking.booking_status)}">
                        ${getStatusText(booking.booking_status)}
                    </div>
                </div>

                <!-- Content -->
                <div class="p-6 space-y-4">
                    <!-- Property Name -->
                    <div>
                        <h3 class="text-xl font-bold text-gray-900">${booking.property_name || 'Property'}</h3>
                        <p class="text-sm text-gray-600 mt-1">
                            <i data-lucide="map-pin" class="w-4 h-4 inline mr-1"></i>
                            ${booking.property_location || 'Location'}
                        </p>
                    </div>

                    <!-- Details -->
                    <div class="grid grid-cols-2 gap-4 py-4 border-t border-b">
                        <div>
                            <p class="text-xs text-gray-600 uppercase">Check-in</p>
                            <p class="font-semibold text-gray-900">${booking.check_in_date || 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600 uppercase">Check-out</p>
                            <p class="font-semibold text-gray-900">${booking.check_out_date || 'N/A'}</p>
                        </div>
                    </div>

                    <!-- Amount -->
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600">Total Amount:</span>
                        <span class="text-2xl font-bold text-purple-600">₹${booking.total_amount || 0}</span>
                    </div>

                    <!-- Buttons -->
                    <div class="flex gap-3 pt-4">
                        <button onclick="openRefundModal('${booking._id}')" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">
                            <i data-lucide="undo-2" class="w-4 h-4 inline mr-2"></i>Refund
                        </button>
                        <button onclick="openRefundModalAlt('${booking._id}')" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                            <i data-lucide="repeat" class="w-4 h-4 inline mr-2"></i>Alternative
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        lucide.createIcons();
    }

    // Get status class
    function getStatusClass(status) {
        if (status === 'confirmed' || status === 'active') return 'status-active';
        if (status === 'upcoming') return 'status-upcoming';
        return 'status-completed';
    }

    // Get status text
    function getStatusText(status) {
        const statusMap = {
            'confirmed': 'Active',
            'active': 'Active',
            'upcoming': 'Upcoming',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || 'Active';
    }

    // Open refund modal
    function openRefundModal(bookingId) {
        selectedBooking = userBookings.find(b => b._id === bookingId);
        if (!selectedBooking) return;

        document.getElementById('refundModal').classList.remove('hidden');
        document.getElementById('modalPropertyName').textContent = selectedBooking.property_name;
        document.getElementById('modalPropertyDetails').textContent = `${selectedBooking.property_location} • Booking ID: ${bookingId}`;
        
        // Set to refund option
        document.getElementById('refundOption').checked = true;
        document.getElementById('refundForm').classList.remove('hidden');
        document.getElementById('alternativeForm').classList.add('hidden');
    }

    // Open refund modal with alternative selected
    function openRefundModalAlt(bookingId) {
        openRefundModal(bookingId);
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
            alert('No booking selected');
            return;
        }

        const requestType = document.querySelector('input[name="requestType"]:checked').value;
        const name = document.getElementById('refundName').value || selectedBooking.user_name || 'User';
        const phone = document.getElementById('refundPhone').value || selectedBooking.user_phone || '';
        const email = selectedBooking.user_email || '';

        // Validate required fields
        if (!name || !phone) {
            alert('Please enter name and phone number');
            return;
        }

        let paymentData = {
            refund_method: document.querySelector('input[name="paymentMethod"]:checked').value,
            upi_id: document.getElementById('upiId').value || null,
            bank_account_holder: document.getElementById('bankName').value || null,
            bank_account_number: document.getElementById('bankAccount').value || null,
            bank_ifsc_code: document.getElementById('ifscCode').value || null,
            bank_name: document.getElementById('bankNameField').value || null,
            preferred_area: document.getElementById('preferredArea').value || null,
            property_requirements: document.getElementById('propertyRequirements').value || null
        };

        try {
            const response = await fetch(`${API_URL}/api/booking/refund-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    booking_id: selectedBooking._id,
                    user_id: selectedBooking.user_id || localStorage.getItem('userId') || 'ROOMHY2776',
                    payment_id: selectedBooking.payment_id || '',
                    user_name: name,
                    user_phone: phone,
                    user_email: email,
                    request_type: requestType,
                    refund_method: paymentData.refund_method,
                    upi_id: paymentData.upi_id,
                    bank_account_holder: paymentData.bank_account_holder,
                    bank_account_number: paymentData.bank_account_number,
                    bank_ifsc_code: paymentData.bank_ifsc_code,
                    bank_name: paymentData.bank_name,
                    preferred_area: paymentData.preferred_area,
                    property_requirements: paymentData.property_requirements
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit request');
            }

            alert('✅ Request submitted successfully!\n\nYour refund/alternative property request has been submitted. Our team will review it shortly.');
            closeRefundModal();
            
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error submitting request: ' + error.message);
        }
    }

    // Close modal on outside click
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('refundModal');
        if (event.target === modal) {
            closeRefundModal();
        }
    });