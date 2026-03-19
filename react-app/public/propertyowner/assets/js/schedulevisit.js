let currentBookingId = null;
        let currentUserType = 'owner'; // Assume owner for scheduling

        // Get booking ID from URL params
        const urlParams = new URLSearchParams(window.location.search);
        currentBookingId = urlParams.get('bookingId');

        if (!currentBookingId) {
            alert('No booking ID provided');
            window.location.href = '/propertyowner/booking_request';
        }

        // Load booking details
        async function loadBookingDetails(bookingId) {
            const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001' : 'https://api.roomhy.com';
            try {
                const response = await fetch(`${API_URL}/api/booking/requests/${bookingId}`);
                const data = await response.json();

                if (data.success && data.data) {
                    const booking = data.data;
                    document.getElementById('propertyName').value = booking.property_name || '';
                    document.getElementById('tenantName').value = booking.name || '';

                    // Pre-fill existing schedule data if available
                    if (booking.visit_date) {
                        document.getElementById('visitDate').value = booking.visit_date.split('T')[0];
                    }
                    if (booking.visit_time_slot) {
                        document.getElementById('timeSlot').value = booking.visit_time_slot;
                    }
                    if (booking.visit_type) {
                        document.getElementById('visitType').value = booking.visit_type;
                    }
                    if (booking.visit_duration) {
                        document.getElementById('visitDuration').value = booking.visit_duration;
                    }
                    if (booking.visit_notes) {
                        document.getElementById('specialInstructions').value = booking.visit_notes;
                    }
                    if (booking.contact_phone) {
                        document.getElementById('contactPhone').value = booking.contact_phone;
                    }
                    if (booking.contact_email) {
                        document.getElementById('contactEmail').value = booking.contact_email;
                    }
                }
            } catch (error) {
                console.error('Error loading booking details:', error);
            }
        }

        // Handle form submission
        document.getElementById('scheduleForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentBookingId) {
                alert('No booking ID available');
                return;
            }

            const formData = {
                visit_type: document.getElementById('visitType').value,
                visit_date: document.getElementById('visitDate').value,
                visit_time_slot: document.getElementById('timeSlot').value,
                visit_duration: document.getElementById('visitDuration').value,
                visit_notes: document.getElementById('specialInstructions').value,
                contact_phone: document.getElementById('contactPhone').value,
                contact_email: document.getElementById('contactEmail').value
            };

            if (!formData.visit_date || !formData.visit_time_slot) {
                alert('Please select a date and time slot');
                return;
            }

            try {
                const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001' : 'https://api.roomhy.com';
                const response = await fetch(`${API_URL}/api/booking/requests/${currentBookingId}/schedule-visit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    alert('Visit scheduled successfully!');
                    window.location.href = '/propertyowner/booking_request';
                } else {
                    alert('Error scheduling visit');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error scheduling visit');
            }
        });

        // Initialize
        loadBookingDetails(currentBookingId);