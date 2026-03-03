const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001' : 'https://api.roomhy.com';

        function log(elementId, type, title, content) {
            const element = document.getElementById(elementId);
            const className = type === 'success' ? 'success' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info';
            element.innerHTML += `<p class="${className}">${title}</p><pre>${typeof content === 'object' ? JSON.stringify(content, null, 2) : content}</pre>`;
        }

        function clearLog(elementId) {
            document.getElementById(elementId).innerHTML = '';
        }

        async function checkStatus() {
            clearLog('statusOutput');
            log('statusOutput', 'info', 'âœ“ Checking system status...', '');

            // Check localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const ownerLoginId = localStorage.getItem('ownerLoginId');
            const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            const bookings = JSON.parse(localStorage.getItem('roomhy_booking_requests') || '[]');

            log('statusOutput', 'info', 'ðŸ“¦ localStorage Keys:', {
                'user': user,
                'ownerLoginId': ownerLoginId,
                'visits_count': visits.length,
                'bookings_count': bookings.length
            });

            // Check sessionStorage
            const sessionUser = JSON.parse(sessionStorage.getItem('user') || '{}');
            const sessionOwner = sessionStorage.getItem('ownerLoginId');
            log('statusOutput', 'info', 'ðŸ“¦ sessionStorage Keys:', {
                'user': sessionUser,
                'ownerLoginId': sessionOwner
            });
        }

        async function listApprovedProperties() {
            clearLog('propertiesOutput');
            log('propertiesOutput', 'info', 'âœ“ Checking approved properties...', '');

            const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
            const approvedVisits = visits.filter(v => v.status === 'approved' && v.generatedCredentials);

            if (approvedVisits.length === 0) {
                log('propertiesOutput', 'warning', 'âš ï¸ No approved properties found', 'Create and approve a property first in superadmin/enquiry.html');
                return;
            }

            log('propertiesOutput', 'success', `âœ“ Found ${approvedVisits.length} approved properties`, '');
            
            approvedVisits.forEach((prop, idx) => {
                log('propertiesOutput', 'info', `Property ${idx + 1}:`, {
                    'name': prop.propertyInfo?.name || prop.property?.name || 'Unknown',
                    'visit_id': prop._id,
                    'status': prop.status,
                    'isLive': prop.isLiveOnWebsite,
                    'loginId': prop.generatedCredentials?.loginId,
                    'address': prop.propertyInfo?.address || prop.property?.address || '-'
                });
            });
        }

        async function testAPIConnection() {
            clearLog('statusOutput');
            log('statusOutput', 'info', 'ðŸ”— Testing API connection to ' + API_URL, '');

            try {
                const response = await fetch(API_URL + '/api/booking/requests', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    log('statusOutput', 'success', 'âœ“ API is reachable', `Status: ${response.status}`);
                } else {
                    log('statusOutput', 'error', '✗ API returned error', `Status: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                log('statusOutput', 'error', '✗ API connection failed', error.message);
            }
        }

        async function fetchBookingsFromAPI() {
            clearLog('bookingsOutput');
            log('bookingsOutput', 'info', 'ðŸ“® Fetching bookings from API...', '');

            // Get owner ID
            let ownerId = localStorage.getItem('ownerLoginId');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            if (!ownerId && user.loginId) {
                ownerId = user.loginId;
            }

            if (!ownerId) {
                const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
                const approvedVisits = visits.filter(v => v.status === 'approved' && v.generatedCredentials?.loginId);
                if (approvedVisits.length > 0) {
                    ownerId = approvedVisits[0].generatedCredentials.loginId;
                }
            }

            if (!ownerId) {
                log('bookingsOutput', 'error', '✗ No owner ID found', 'Cannot fetch bookings without owner ID. Check "Owner Identification" section.');
                return;
            }

            log('bookingsOutput', 'info', `Using owner ID: ${ownerId}`, '');

            try {
                const url = `${API_URL}/api/booking/requests?owner_id=${encodeURIComponent(ownerId)}`;
                log('bookingsOutput', 'info', `Fetching from: ${url}`, '');

                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!response.ok) {
                    log('bookingsOutput', 'error', `✗ API error: ${response.status}`, response.statusText);
                    return;
                }

                const data = await response.json();
                log('bookingsOutput', 'info', 'API Response:', data);

                const bookings = data.data || data.bookings || [];
                if (bookings.length === 0) {
                    log('bookingsOutput', 'warning', 'âš ï¸ No bookings found for this owner', 'Submit a booking request from website/property.html to create one.');
                    return;
                }

                log('bookingsOutput', 'success', `âœ“ Found ${bookings.length} booking(s)`, '');
                bookings.forEach((booking, idx) => {
                    log('bookingsOutput', 'info', `Booking ${idx + 1}:`, {
                        'id': booking._id,
                        'property': booking.property_name,
                        'tenant': booking.name,
                        'email': booking.email,
                        'phone': booking.phone,
                        'status': booking.status,
                        'created': booking.created_at,
                        'owner_id': booking.owner_id
                    });
                });
            } catch (error) {
                log('bookingsOutput', 'error', '✗ Error fetching bookings', error.message);
            }
        }

        async function clearAllData() {
            if (!confirm('âš ï¸ This will clear all local data! Are you sure?')) return;
            if (!confirm('âš ï¸ Last chance to cancel!')) return;

            localStorage.removeItem('user');
            localStorage.removeItem('ownerLoginId');
            localStorage.removeItem('roomhy_visits');
            localStorage.removeItem('roomhy_booking_requests');
            localStorage.removeItem('roomhy_kyc_verification');
            sessionStorage.clear();

            alert('âœ“ All data cleared');
            location.reload();
        }

        // Auto-check on load
        window.addEventListener('DOMContentLoaded', checkStatus);