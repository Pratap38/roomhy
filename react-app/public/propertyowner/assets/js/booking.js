let currentOwner = null;

        // Verify user exists in new_signups.html data
        function verifyUserFromSignups(userId) {
            try {
                const signupData = localStorage.getItem('roomhy_kyc_verification');
                if (!signupData) {
                    console.warn('⚠️ No signup data found in localStorage');
                    return null;
                }

                const signups = JSON.parse(signupData);
                const user = signups.find(u => u.userData?.id === userId);
                
                if (user) {
                    console.log('✅ User verified from new_signups.html:', userId);
                    return user;
                } else {
                    console.warn('⚠️ User NOT from new_signups.html - showing bookings anyway');
                    return null;
                }
            } catch (err) {
                console.error('Error verifying user from signups:', err);
                return null;
            }
        }

        // Load owner session
        async function loadOwner() {
            const owner = JSON.parse(sessionStorage.getItem('owner_user') || localStorage.getItem('user') || 'null');
            if (owner) {
                currentOwner = owner;
                
                // Verify owner is from new_signups if they have a userId
                if (owner.loginId || owner.ownerId) {
                    const ownerId = owner.loginId || owner.ownerId;
                    const verifiedOwner = verifyUserFromSignups(ownerId);
                    if (verifiedOwner) {
                        console.log('✅ Owner verified from new_signups.html');
                    } else {
                        console.log('ℹ️ Owner not from new_signups.html (property owner account)');
                    }
                }
                
                const ownerId = owner.loginId || owner.ownerId || '...';
                const ownerName = owner.name || owner.ownerName || 'Owner';
                
                document.getElementById('headerName').textContent = ownerName;
                document.getElementById('headerAccountId').textContent = `ID: ${ownerId}`;
                document.getElementById('headerAvatar').textContent = ownerName.charAt(0).toUpperCase();
                
                loadBookings();
            } else {
                window.location.href = '/propertyowner/ownerlogin';
            }
        }

        // Load confirmed bookings
        async function loadBookings() {
            if (!currentOwner) return;
            const ownerId = currentOwner.loginId || currentOwner.ownerId;
            const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001' : 'https://api.roomhy.com';

            try {
                const response = await fetch(`${API_URL}/api/booking/requests?owner_id=${ownerId}&status=confirmed`);
                const data = await response.json();
                const bookings = data.data || [];

                // Load signup data for validation
                let signups = [];
                try {
                    const signupData = localStorage.getItem('roomhy_kyc_verification');
                    if (signupData) {
                        signups = JSON.parse(signupData);
                    }
                } catch (err) {
                    console.warn('Could not load signup data:', err);
                }

                const tableBody = document.getElementById('bookingsTableBody');
                
                if (bookings.length === 0) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="7" class="py-8 text-center text-gray-500">
                                <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                                <p>No confirmed bookings yet</p>
                            </td>
                        </tr>
                    `;
                    lucide.createIcons();
                    return;
                }

                tableBody.innerHTML = bookings.map(booking => {
                    // Check if this booking is from a new_signups user
                    const isFromSignup = signups.some(u => u.userData?.id === booking.user_id);
                    const signupBadge = isFromSignup ? '<span class="ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800" title="User from new_signups">✓ Signup</span>' : '';
                    
                    return `
                    <tr class="hover:bg-gray-50 text-sm border-b border-gray-200">
                        <td class="px-4 py-3">
                            <div>
                                <p class="font-medium text-gray-900">${booking.property_name || 'N/A'}</p>
                                <p class="text-xs text-gray-500">${booking.area || 'N/A'}</p>
                            </div>
                        </td>
                        <td class="px-4 py-3">
                            <div>
                                <p class="font-medium text-gray-900">${booking.name || 'N/A'}</p>
                                <p class="text-xs text-gray-500">ID: ${booking.user_id || 'N/A'}</p>
                                ${signupBadge}
                            </div>
                        </td>
                        <td class="px-4 py-3 text-gray-600">
                            <p>${booking.phone || 'N/A'}</p>
                            <p class="text-xs">${booking.email || 'N/A'}</p>
                        </td>
                        <td class="px-4 py-3 text-gray-900 font-semibold">₹${booking.rent_amount || 0}</td>
                        <td class="px-4 py-3 text-gray-600">
                            ${booking.visit_date ? new Date(booking.visit_date).toLocaleDateString() : 'Not scheduled'}
                            ${booking.visit_time_slot ? `<br><span class="text-xs">${booking.visit_time_slot}</span>` : ''}
                        </td>
                        <td class="px-4 py-3">
                            <span class="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                Confirmed
                            </span>
                        </td>
                        <td class="px-4 py-3">
                            <button onclick="viewDetails('${booking._id}')" class="px-3 py-1 rounded bg-blue-100 text-blue-700 text-sm">View Details</button>
                        </td>
                    </tr>
                `}).join('');

                lucide.createIcons();
            } catch (err) {
                console.error("Error loading bookings", err);
                document.getElementById('bookingsTableBody').innerHTML = `
                    <tr>
                        <td colspan="7" class="py-8 text-center text-red-500">
                            <i data-lucide="alert-circle" class="w-12 h-12 mx-auto mb-3"></i>
                            <p>Error loading bookings</p>
                        </td>
                    </tr>
                `;
                lucide.createIcons();
            }
        }

        function viewDetails(bookingId) {
            // Could open a modal or redirect to detail page
            alert('Booking details for ID: ' + bookingId);
        }

        // Mobile menu handlers
        document.getElementById('mobile-menu-open').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.remove('hidden');
        });

        document.getElementById('close-mobile-menu').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.add('hidden');
        });

        document.getElementById('mobile-menu-overlay').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.add('hidden');
        });

        // Initialize
        loadOwner();