// ===== NOTIFICATION SYSTEM INITIALIZATION =====
        let notificationManager = null;
        let notificationHistory = [];

        function initializeNotifications() {
            try {
                notificationManager = new NotificationManager();
                
                // Request browser notification permission
                notificationManager.requestNotificationPermission().then(granted => {
                    if (granted) {
                        console.log('✅ Notification permission granted');
                    }
                });

                // Register notification callbacks
                notificationManager.onNotification('bookingRequests', onNewBookingRequest);
                notificationManager.onNotification('chatMessages', onNewChatMessage);
                notificationManager.onNotification('complaints', onNewComplaint);

                // Start polling for notifications
                notificationManager.startPolling();
                console.log('🔔 Notification system initialized');
            } catch (e) {
                console.error('Error initializing notifications:', e);
            }
        }

        function onNewBookingRequest(data) {
            console.log('📅 New booking request notification:', data);
            updateNotificationUI('bookingRequests', data);
            notificationManager.showBrowserNotification('New Booking Request! 🎉', {
                body: `You have a new booking request`,
                tag: 'booking-request-' + Date.now()
            });
            loadBookingRequests(); // Refresh the list
        }

        function onNewChatMessage(data) {
            console.log('💬 New chat message notification:', data);
            updateNotificationUI('chatMessages', data);
            notificationManager.showBrowserNotification('New Chat Message 💬', {
                body: `From: ${data?.senderName || 'Someone'}`,
                tag: 'chat-message-' + Date.now()
            });
        }

        function onNewComplaint(data) {
            console.log('⚠️ New complaint notification:', data);
            updateNotificationUI('complaints', data);
            notificationManager.showBrowserNotification('New Complaint ⚠️', {
                body: `Priority: ${data?.priority || 'Medium'}`,
                tag: 'complaint-' + Date.now()
            });
        }

        function updateNotificationUI(type, data) {
            const notificationList = document.getElementById('notificationList');
            const notificationBadge = document.getElementById('notificationBadge');

            // Create notification item HTML
            let notificationHTML = '';
            const timestamp = new Date().toLocaleTimeString();
            
            switch(type) {
                case 'bookingRequests':
                    notificationHTML = `
                        <div class="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-l-4 border-blue-500">
                            <div class="flex items-start justify-between">
                                <div class="flex items-start gap-3 flex-1">
                                    <i data-lucide="calendar-check" class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"></i>
                                    <div class="flex-1">
                                        <p class="text-sm font-semibold text-gray-900">New Booking Request</p>
                                        <p class="text-xs text-gray-600 mt-1">Property: ${data?.propertyName || 'N/A'}</p>
                                        <p class="text-xs text-gray-500 mt-1">${timestamp}</p>
                                    </div>
                                </div>
                                <span class="ml-2 inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">NEW</span>
                            </div>
                        </div>
                    `;
                    break;
                case 'chatMessages':
                    notificationHTML = `
                        <div class="px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors border-l-4 border-purple-500">
                            <div class="flex items-start justify-between">
                                <div class="flex items-start gap-3 flex-1">
                                    <i data-lucide="message-circle" class="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0"></i>
                                    <div class="flex-1">
                                        <p class="text-sm font-semibold text-gray-900">New Chat Message</p>
                                        <p class="text-xs text-gray-600 mt-1">From: ${data?.senderName || 'Someone'}</p>
                                        <p class="text-xs text-gray-500 mt-1">${timestamp}</p>
                                    </div>
                                </div>
                                <span class="ml-2 inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">NEW</span>
                            </div>
                        </div>
                    `;
                    break;
                case 'complaints':
                    notificationHTML = `
                        <div class="px-4 py-3 hover:bg-red-50 cursor-pointer transition-colors border-l-4 border-red-500">
                            <div class="flex items-start justify-between">
                                <div class="flex items-start gap-3 flex-1">
                                    <i data-lucide="alert-circle" class="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"></i>
                                    <div class="flex-1">
                                        <p class="text-sm font-semibold text-gray-900">New Complaint</p>
                                        <p class="text-xs text-gray-600 mt-1">Priority: ${data?.priority || 'Medium'}</p>
                                        <p class="text-xs text-gray-500 mt-1">${timestamp}</p>
                                    </div>
                                </div>
                                <span class="ml-2 inline-block bg-red-100 text-red-700 text-xs px-2 py-1 rounded">NEW</span>
                            </div>
                        </div>
                    `;
                    break;
            }

            // Add to notification history
            notificationHistory.unshift({
                type: type,
                html: notificationHTML,
                data: data,
                timestamp: new Date()
            });

            // Limit to 20 notifications
            if (notificationHistory.length > 20) {
                notificationHistory.pop();
            }

            // Update UI
            if (notificationHistory.length > 0) {
                notificationList.innerHTML = notificationHistory.map(n => n.html).join('');
            }

            // Update badge
            const counts = notificationManager.getUnreadCounts();
            const totalUnread = counts.bookingRequests + counts.chatMessages + counts.complaints;
            
            if (totalUnread > 0) {
                notificationBadge.textContent = totalUnread;
                notificationBadge.classList.remove('hidden');
            }

            lucide.createIcons();
        }

        // Notification bell click handler
        document.getElementById('notificationBellBtn').addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdown = document.getElementById('notificationDropdown');
            dropdown.classList.toggle('hidden');
        });

        // Close notification dropdown when clicking outside
        document.addEventListener('click', function(e) {
            const dropdown = document.getElementById('notificationDropdown');
            const bellBtn = document.getElementById('notificationBellBtn');
            if (!dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });

        // Notification settings button
        document.getElementById('notificationSettingsBtn').addEventListener('click', function() {
            alert('Notification Settings:\n\n✅ Sound: Enabled\n✅ Email: Enabled\n✅ Browser: Enabled\n\nNotifications check every 5 seconds');
        });

        let allBookingRequests = [];
        let filteredRequests = [];
        let currentTab = 'request'; // 'request' or 'bid'

        // Load booking requests from API
        async function loadBookingRequests() {
            try {
                // ✅ Get owner info from multiple sources
                let ownerId = null;
                
                // First check: explicit owner session stored by owner login flow
                try {
                    const ownerSessionRaw = sessionStorage.getItem('owner_session') || localStorage.getItem('owner_session');
                    if (ownerSessionRaw) {
                        const ownerSession = JSON.parse(ownerSessionRaw);
                        ownerId = ownerSession.loginId || ownerSession.ownerId || ownerSession.login || ownerSession.id || ownerId;
                    }
                } catch (e) {
                    console.warn('Could not parse owner_session', e);
                }

                // Second check: user object with loginId (fallback)
                if (!ownerId) {
                    try {
                        const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
                        ownerId = ownerId || user.loginId || user.ownerId || user.id || user.login;
                    } catch (e) {
                        console.warn('Could not parse user object', e);
                    }
                }

                // Third check: direct ownerLoginId in storage
                if (!ownerId) {
                    ownerId = localStorage.getItem('ownerLoginId') || sessionStorage.getItem('ownerLoginId') || ownerId;
                }
                
                // Third check: if ownerId still not found, try to get from approved visits
                if (!ownerId) {
                    const visits = JSON.parse(localStorage.getItem('roomhy_visits') || '[]');
                    const approvedVisits = visits.filter(v => v.status === 'approved' && v.generatedCredentials && v.generatedCredentials.loginId);
                    if (approvedVisits.length > 0) {
                        // Use the first approved property's loginId
                        ownerId = approvedVisits[0].generatedCredentials.loginId;
                        // Store it for future use
                        localStorage.setItem('ownerLoginId', ownerId);
                    }
                }
                
                if (!ownerId) {
                    // Owner must be logged in to view owner-specific bookings
                    alert('Please login as a property owner to view your booking requests');
                    window.location.href = '/propertyowner/ownerlogin';
                    return;
                }

                console.log('ðŸ” Resolved ownerId:', ownerId);
                const apiUrl = API_URL;

                // ✅ Fetch from API with owner_id filter (server-side)
                const fetchUrl = `${apiUrl}/api/booking/requests?owner_id=${encodeURIComponent(ownerId)}`;
                console.log('ðŸ”— Fetching bookings URL:', fetchUrl);
                const response = await fetch(fetchUrl, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const data = await response.json();
                console.log('ðŸ“¡ API Response:', data);
                allBookingRequests = (data.data || data.bookings || []).filter(req => req.status !== 'rejected');
                
                console.log(`✅ Loaded ${allBookingRequests.length} bookings from API (excluding rejected)`);

                // Use DB results only for owners. If DB returns empty, show empty state.
                if (!allBookingRequests || allBookingRequests.length === 0) {
                    console.log('ℹ️ No bookings found in DB for owner:', ownerId);
                    allBookingRequests = [];
                    filteredRequests = [];
                    applyQueryFilters();
                    return;
                }

                filteredRequests = [...allBookingRequests];
                applyQueryFilters();
            } catch (error) {
                console.error('âŒ Error loading booking requests from API:', error);
                // Fall back disabled for logged-in owner: show error and empty list
                console.error('âŒ Failed to fetch bookings from API for owner:', ownerId, error);
                allBookingRequests = [];
                filteredRequests = [];
                applyQueryFilters();
            }
        }

        // Helper function to load bookings from localStorage
        function loadFromLocalStorage(ownerId) {
            try {
                const bookingRequests = JSON.parse(localStorage.getItem('roomhy_booking_requests') || '[]');
                const users = JSON.parse(localStorage.getItem('roomhy_kyc_verification') || '[]');
                
                const userMap = {};
                users.forEach(user => {
                    userMap[user.id] = user;
                });

                allBookingRequests = bookingRequests.map(request => {
                    const user = userMap[request.user_id] || {};
                    return {
                        ...request,
                        name: user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'N/A',
                        phone: user.phone || 'N/A',
                        email: user.email || 'N/A'
                    };
                });

                // If owner_id provided, filter by that owner. Accept multiple possible owner fields.
                if (ownerId) {
                    allBookingRequests = allBookingRequests.filter(req => {
                        const oid = req.owner_id || req.ownerId || req.owner || req.owner_login || req.ownerLoginId || req.ownerLogin || req.ownerid;
                        return String(oid || '').toLowerCase() === String(ownerId).toLowerCase();
                    });
                }

                filteredRequests = [...allBookingRequests];
                applyQueryFilters();
            } catch (fallbackError) {
                console.error('âŒ Error loading from localStorage:', fallbackError);
                allBookingRequests = [];
                filteredRequests = [];
                renderBookingTable();
            }
        }

        // Render booking requests table
        function renderBookingTable() {
            const tableBody = document.getElementById('bookingTableBody');

            if (filteredRequests.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="17" class="py-8 text-center text-gray-500">
                            <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                            <p>No booking requests found</p>
                        </td>
                    </tr>
                `;
                lucide.createIcons();
                return;
            }

            tableBody.innerHTML = filteredRequests.map((req, index) => `
                <tr class="hover:bg-gray-50 text-sm border-b border-gray-200">
                    <td class="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">${req.property_id || 'N/A'}</td>
                    <td class="px-4 py-3 text-gray-900 whitespace-nowrap">${req.property_name || 'N/A'}</td>
                    <td class="px-4 py-3 text-gray-900 font-semibold whitespace-nowrap">${req.owner_name || req.ownerName || 'N/A'}</td>
                    <td class="px-4 py-3 text-gray-600 whitespace-nowrap">${req.area || 'N/A'}</td>
                    <td class="px-4 py-3 text-gray-600 whitespace-nowrap">${req.property_type || 'N/A'}</td>
                    <td class="px-4 py-3 text-gray-900 font-semibold whitespace-nowrap">₹${req.rent_amount || 0}</td>
                    <td class="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs"><strong>${req.signup_user_id || req.user_id || 'Guest'}</strong></td>
                    <td class="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">${req.name}</td>
                    <td class="px-4 py-3 text-gray-600 whitespace-nowrap">${req.phone}</td>
                    <td class="px-4 py-3 text-gray-600 whitespace-nowrap">${req.email}</td>
                    <td class="px-4 py-3 whitespace-nowrap space-x-1">
                        ${req.status === 'pending' ? `
                            <button onclick="acceptRequest('${req._id || req.id}', '${req.name}', '${req.email}')" class="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200">Accept</button>
                            <button onclick="rejectRequest('${req._id || req.id}')" class="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200">Reject</button>
                            <button onclick="sendBookingFormLink('${req._id || req.id}', '${req.name}', '${req.email}', '${req.property_id || ''}', '${req.property_name || ''}', '${req.owner_name || req.ownerName || ''}')" class="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200">Book</button>
                        ` : req.status === 'accepted' ? `
                            <button onclick="openChat('${req._id || req.id}', '${req.user_id || ''}')" class="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 flex items-center gap-1"><i data-lucide="message-circle" class="w-3 h-3"></i>Chat</button>
                            <button onclick="sendBookingFormLink('${req._id || req.id}', '${req.name}', '${req.email}', '${req.property_id || ''}', '${req.property_name || ''}', '${req.owner_name || req.ownerName || ''}')" class="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200">Book</button>
                        ` : `<span class="text-xs text-gray-400">${(req.status || 'pending').toUpperCase()}</span>`}
                    </td>
                </tr>
            `).join('');

            lucide.createIcons();
            
            // Add event listeners to booking form buttons
            document.querySelectorAll('.booking-form-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const reqId = this.dataset.reqId;
                    const propertyId = this.dataset.propertyId;
                    const propertyName = this.dataset.propertyName;
                    const ownerName = this.dataset.ownerName;
                    const rentAmount = this.dataset.rentAmount;
                    const userId = this.dataset.userId;
                    
                    console.log('🎫 Booking Form clicked:', {
                        reqId, propertyId, propertyName, ownerName, rentAmount, userId
                    });
                    
                    goToBookingForm(reqId, propertyId, propertyName, ownerName, rentAmount, userId);
                });
            });
        }

        // Get status badge CSS class
        function getStatusBadgeClass(status) {
            const statusMap = {
                'pending': 'bg-yellow-100 text-yellow-800',
                'approved': 'bg-green-100 text-green-800',
                'rejected': 'bg-red-100 text-red-800',
                'visited': 'bg-blue-100 text-blue-800'
            };
            return statusMap[status] || 'bg-gray-100 text-gray-800';
        }

        // Get visit status badge CSS class
        function getVisitStatusBadgeClass(status) {
            const statusMap = {
                'pending': 'bg-yellow-100 text-yellow-800',
                'scheduled': 'bg-blue-100 text-blue-800',
                'completed': 'bg-green-100 text-green-800',
                'cancelled': 'bg-red-100 text-red-800'
            };
            return statusMap[status] || 'bg-gray-100 text-gray-800';
        }

        // ===== BIDDING REQUESTS FUNCTIONS =====
        let allBiddingRequests = [];

        // Load bidding requests for this owner
        // NOTE: This function reuses the bookings already fetched by loadBookingRequests()
        async function loadBiddingRequests() {
            try {
                console.log('🔍 Loading bidding requests from already-loaded bookings...');
                
                // Use the already-loaded allBookingRequests data
                if (!allBookingRequests || allBookingRequests.length === 0) {
                    console.log('📋 No bookings loaded yet, waiting for loadBookingRequests()...');
                    allBiddingRequests = [];
                    renderBiddingTable();
                    return;
                }
                
                // Filter to only get bids (request_type = 'bid')
                allBiddingRequests = allBookingRequests.filter(b => b.request_type === 'bid');
                
                // Debug: Log first booking to see structure
                if (allBiddingRequests.length > 0) {
                    console.log('📋 First bidding request structure:', allBiddingRequests[0]);
                    console.log('📋 All bid request_types:', allBiddingRequests.map(b => ({_id: b._id, property_name: b.property_name, request_type: b.request_type})));
                }
                
                console.log(`✅ Loaded ${allBiddingRequests.length} bidding requests from already-fetched bookings (filtered from ${allBookingRequests.length} total)`);
                renderBiddingTable();
            } catch (error) {
                console.error('❌ Error loading bidding requests:', error);
                renderBiddingTable();
            }
        }

        // Render bidding requests table
        function renderBiddingTable() {
            const tableBody = document.getElementById('biddingTableBody');

            if (!allBiddingRequests || allBiddingRequests.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="16" class="py-8 text-center text-gray-500">
                            <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                            <p>No bidding requests received yet</p>
                        </td>
                    </tr>
                `;
                lucide.createIcons();
                return;
            }

            tableBody.innerHTML = allBiddingRequests.map((bid, index) => {
                // Extract data with proper fallbacks
                const bidId = bid._id ? bid._id.substring(0, 8) : index + 1;
                const propertyId = bid.property_id || 'N/A';
                const propertyName = bid.property_name || 'N/A';
                const ownerName = bid.owner_name || bid.ownerName || 'N/A';
                const bidderName = bid.name || bid.fullName || bid.contactName || bid.user_name || 'N/A';
                const bidderEmail = bid.email || bid.gmail || bid.contactEmail || bid.user_email || 'N/A';
                
                // Extract gender from either top-level or filter_criteria
                const gender = bid.gender || (bid.filter_criteria && bid.filter_criteria.gender) || 'Any';
                
                // Extract city and area from filter_criteria (this is where they're stored from fast-bidding)
                const city = bid.city || (bid.filter_criteria && bid.filter_criteria.city) || 'N/A';
                const area = bid.area || (bid.filter_criteria && bid.filter_criteria.area) || 'N/A';
                
                // Extract min and max budgets
                const minBudget = bid.bid_min || bid.budget_min || (bid.filter_criteria && bid.filter_criteria.min_price) || bid.min_price || '';
                const maxBudget = bid.bid_max || bid.budget_max || (bid.filter_criteria && bid.filter_criteria.max_price) || bid.max_price || '';
                const budgetRange = (minBudget && maxBudget) ? `Rs ${minBudget} - Rs ${maxBudget}` : (minBudget || maxBudget) ? `Rs ${minBudget || maxBudget}` : 'Any';
                
                // Extract property type
                const propertyType = bid.property_type || (bid.filter_criteria && bid.filter_criteria.property_type) || 'Any';
                
                // Format submitted date
                const submittedDate = bid.created_at
                    ? new Date(bid.created_at).toLocaleDateString()
                    : 'N/A';

                return `
                    <tr class="hover:bg-gray-50 text-sm border-b border-gray-200">
                        <td class="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">${bidId}</td>
                        <td class="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">${propertyId}</td>
                        <td class="px-4 py-3 text-gray-900 whitespace-nowrap">${propertyName}</td>
                        <td class="px-4 py-3 text-gray-900 font-semibold whitespace-nowrap">${ownerName}</td>
                        <td class="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">${bidderName}</td>
                        <td class="px-4 py-3 text-gray-600 whitespace-nowrap">${bidderEmail}</td>
                        <td class="px-4 py-3 text-gray-600 whitespace-nowrap">${gender}</td>
                        <td class="px-4 py-3 text-gray-600 whitespace-nowrap">${city}</td>
                        <td class="px-4 py-3 text-gray-600 whitespace-nowrap">${area}</td>
                        <td class="px-4 py-3 text-gray-900 font-semibold whitespace-nowrap">${minBudget ? `Rs ${minBudget}` : 'Any'}</td>
                        <td class="px-4 py-3 text-gray-900 font-semibold whitespace-nowrap">${maxBudget ? `Rs ${maxBudget}` : 'Any'}</td>
                        <td class="px-4 py-3 text-gray-600 whitespace-nowrap">${propertyType}</td>
                        <td class="px-4 py-3 text-gray-900 font-semibold whitespace-nowrap">${budgetRange}</td>
                        <td class="px-4 py-3 whitespace-nowrap">
                            <span class="px-3 py-1 rounded-full text-xs font-semibold ${bid.status === 'accepted' ? 'bg-green-100 text-green-800' : bid.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">
                                ${(bid.status || 'pending').charAt(0).toUpperCase() + (bid.status || 'pending').slice(1)}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-gray-600 whitespace-nowrap">${submittedDate}</td>
                        <td class="px-4 py-3 whitespace-nowrap space-x-1">
                            ${bid.status === 'pending' ? `
                                <button onclick="acceptBid('${bid._id || index}', '${bidderName}', '${bidderEmail}')" class="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200">Accept</button>
                                <button onclick="rejectBid('${bid._id || index}')" class="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200">Reject</button>
                                <button onclick="confirmBid('${bid._id || index}')" class="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200">Confirm</button>
                            ` : bid.status === 'accepted' ? `
                                <button onclick="openChat('${bid._id || index}', '')" class="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 flex items-center gap-1"><i data-lucide="message-circle" class="w-3 h-3"></i>Chat</button>
                            ` : `
                                <button onclick="contactBidder('${bid._id || index}')" class="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200">Contact</button>
                            `}
                        </td>
                    </tr>
                `;
            }).join('');

            lucide.createIcons();
        }

        function generateWebsiteUserIdFromEmail(email) {
            const safeEmail = String(email || '').trim().toLowerCase();
            if (!safeEmail) return '';
            let hash = 0;
            for (let i = 0; i < safeEmail.length; i += 1) {
                hash = (hash * 31 + safeEmail.charCodeAt(i)) % 1000000;
            }
            return `roomhyweb${String(hash).padStart(6, '0')}`;
        }

        async function notifyWebsiteUserAndEmail(userId, email, title, message, type) {
            try {
                if (userId) {
                    await fetch(`${API_URL}/api/notifications/website/create`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, title, message, type })
                    });
                }
                if (email) {
                    await fetch(`${API_URL}/api/email/send`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: email,
                            subject: `RoomHy: ${title}`,
                            html: `<p>${message}</p>`
                        })
                    });
                }
            } catch (e) {
                console.warn('notifyWebsiteUserAndEmail failed:', e.message);
            }
        }

        // Accept a bidding request
        async function acceptBid(bidId, bidderName, bidderEmail) {
            if (!confirm('Are you sure you want to accept this bidding request?')) return;
            
            try {
                const bid = allBiddingRequests.find(b => b._id === bidId || allBiddingRequests.indexOf(b) === bidId);
                if (!bid) return;

                console.log('📋 Bid object:', bid);
                console.log('Accepting bid:', bidId, 'Name:', bidderName, 'Email:', bidderEmail);

                // Update status
                bid.status = 'accepted';
                bid.responseDate = new Date().toISOString();

                // Save to localStorage immediately (use correct key that loadBiddingRequests uses)
                const allBookings = JSON.parse(localStorage.getItem('roomhy_booking_requests') || '[]');
                const bidIdx = allBookings.findIndex(b => b._id === bidId);
                if (bidIdx >= 0) {
                    allBookings[bidIdx] = bid;
                    localStorage.setItem('roomhy_booking_requests', JSON.stringify(allBookings));
                    console.log('✅ Saved to localStorage with correct key');
                } else {
                    // If not found by _id, also update allBiddingRequests array in memory
                    const bidInArray = allBiddingRequests.find(b => b._id === bidId);
                    if (bidInArray) {
                        bidInArray.status = 'accepted';
                        bidInArray.responseDate = bid.responseDate;
                    }
                }

                // Create chat room first
                console.log('Creating chat room...');
                await createChatRoom(bidId, bidderName, bidderEmail, bid);
                console.log('✅ Chat room created');

                // Try to save complete bid data to API/Database
                try {
                    // Simplified payload with core fields only
                    const bidPayload = {
                        _id: bidId,
                        id: bidId,
                        bookingId: bidId,
                        status: 'accepted',
                        name: bid.name || bid.fullName || bid.contactName || bidderName || 'User',
                        email: bid.email || bid.gmail || bid.contactEmail || bidderEmail || '',
                        user_id: bid.user_id || bid.signup_user_id || '',
                        signup_user_id: bid.signup_user_id || bid.user_id || '',
                        property_name: bid.property_name || '',
                        property_id: bid.property_id || '',
                        owner_name: bid.owner_name || bid.ownerName || '',
                        owner_id: bid.owner_id || bid.ownerId || '',
                        responseDate: bid.responseDate,
                        acceptedAt: new Date().toISOString(),
                        acceptedBy: 'owner',
                        request_type: 'bid'
                    };
                    
                    console.log('💾 Saving bid to database:', `${API_URL}/api/booking/update`);
                    console.log('📦 Bid payload:', bidPayload);
                    
                    const response = await fetch(`${API_URL}/api/booking/update`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(bidPayload)
                    });
                    
                    if (response.ok) {
                        console.log('✅ API update successful');
                    } else {
                        console.warn('⚠️ API returned:', response.status, response.statusText);
                        try {
                            const errorText = await response.text();
                            console.warn('⚠️ Error details:', errorText);
                        } catch (e) {}
                    }
                } catch (e) {
                    console.warn('⚠️ API call failed:', e.message);
                }

                // Re-fetch to ensure updated data
                console.log('Re-fetching booking data...');
                await loadBiddingRequests();

                renderBiddingTable();
                const bidUserId = (bid.user_id || bid.signup_user_id || '').toString().trim().toLowerCase() || generateWebsiteUserIdFromEmail(bidderEmail);
                await notifyWebsiteUserAndEmail(
                    bidUserId,
                    bidderEmail,
                    'Booking Accepted',
                    `${bidderName || 'User'}, your bidding request has been accepted.`,
                    'booking_accept'
                );
                alert('✅ Bidding request accepted! Chat room created.');
                
                // Optionally send email notification
                await sendBidAcceptanceEmail(bid);
            } catch (error) {
                console.error('Error accepting bid:', error);
                alert('Error accepting bid: ' + error.message);
            }
        }

        // Reject a bidding request
        async function rejectBid(bidId) {
            if (!confirm('Are you sure you want to reject this bidding request?')) return;
            
            try {
                const bid = allBiddingRequests.find(b => b._id === bidId || allBiddingRequests.indexOf(b) === bidId);
                if (!bid) return;

                bid.status = 'rejected';
                bid.responseDate = new Date().toISOString();

                try {
                    const response = await fetch(`${API_URL}/api/bidding-requests/${bidId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'rejected', responseDate: bid.responseDate })
                    });
                    if (!response.ok) throw new Error('API update failed');
                } catch (e) {
                    console.log('API not available, using localStorage');
                }

                const allBids = JSON.parse(localStorage.getItem('all_bidding_requests') || '[]');
                const idx = allBids.findIndex(b => b._id === bidId);
                if (idx >= 0) {
                    allBids[idx] = bid;
                    localStorage.setItem('all_bidding_requests', JSON.stringify(allBids));
                }

                renderBiddingTable();
                alert('✅ Bidding request rejected');
            } catch (error) {
                console.error('Error rejecting bid:', error);
                alert('Error rejecting bid');
            }
        }

        // Confirm a bidding request
        async function confirmBid(bidId) {
            if (!confirm('Are you sure you want to confirm this bidding request?')) return;
            
            try {
                const bid = allBiddingRequests.find(b => b._id === bidId || allBiddingRequests.indexOf(b) === bidId);
                if (!bid) return;

                bid.status = 'confirmed';
                bid.confirmedDate = new Date().toISOString();

                try {
                    const response = await fetch(`${API_URL}/api/bidding-requests/${bidId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'confirmed', confirmedDate: bid.confirmedDate })
                    });
                    if (!response.ok) throw new Error('API update failed');
                } catch (e) {
                    console.log('API not available, using localStorage');
                }

                const allBids = JSON.parse(localStorage.getItem('all_bidding_requests') || '[]');
                const idx = allBids.findIndex(b => b._id === bidId);
                if (idx >= 0) {
                    allBids[idx] = bid;
                    localStorage.setItem('all_bidding_requests', JSON.stringify(allBids));
                }

                renderBiddingTable();
                alert('✅ Bidding request confirmed!');
            } catch (error) {
                console.error('Error confirming bid:', error);
                alert('Error confirming bid');
            }
        }

        // Contact bidder
        async function contactBidder(bidId) {
            const bid = allBiddingRequests.find(b => b._id === bidId || allBiddingRequests.indexOf(b) === bidId);
            if (!bid) return;

            // Open email client
            const subject = encodeURIComponent('Your Bidding Request - Roomhy Property');
            const body = encodeURIComponent(`Dear ${bid.contactName},\n\nThank you for your bidding request.\n\nDetails:\nProperty Type: ${bid.propertyType}\nLocation: ${bid.city}\nBudget: ₹${bid.minRent} - ₹${bid.maxRent}\n\nWe will get back to you soon.\n\nBest regards,\nRoomhy Team`);
            
            window.location.href = `mailto:${bid.contactEmail}?subject=${subject}&body=${body}`;
        }

        // Navigate to booking form with request data
        function goToBookingForm(requestId, propertyId, propertyName, ownerName, rentAmount, userId) {
            console.log('🚀 goToBookingForm called with:', {
                requestId, propertyId, propertyName, ownerName, rentAmount, userId
            });
            
            const bookingData = {
                property_id: propertyId || '',
                property_name: propertyName || '',
                owner_name: ownerName || '',
                rent_amount: rentAmount || 0,
                user_id: userId || ''
            };
            
            console.log('💾 Setting sessionStorage with:', bookingData);
            
            // Store in sessionStorage for access in /propertyowner/booking-form
            sessionStorage.setItem('bookingRequestData', JSON.stringify(bookingData));
            console.log('✅ SessionStorage set successfully');
            
            // Navigate to booking form
            const url = '/propertyowner/booking-form?userId=' + encodeURIComponent(userId || '');
            console.log('🔗 Navigating to:', url);
            window.location.href = url;
        }


        // Send bid acceptance email
        async function sendBidAcceptanceEmail(bid) {
            try {
                const emailTo = bid.email || bid.contactEmail;
                const emailName = bid.name || bid.contactName;
                if (!emailTo) {
                    console.log('No email address available for bid');
                    return;
                }
                
                const response = await fetch(`${API_URL}/api/email/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: emailTo,
                        subject: 'Your Bidding Request Has Been Accepted',
                        html: `<h2>Dear ${emailName},</h2><p>Your bidding request has been accepted!</p><p>We will contact you shortly with property options matching your requirements.</p>`
                    })
                });
                
                if (response.ok) {
                    console.log('✅ Acceptance email sent');
                } else {
                    console.warn('⚠️ Email send returned:', response.status);
                }
            } catch (error) {
                console.log('Could not send email notification:', error.message);
            }
        }

        // Create a chat room for accepted bid/request
        async function createChatRoom(bookingId, userName, userEmail, bookingData) {
            try {
                console.log('createChatRoom called with:', { bookingId, userName, userEmail });
                
                const owner = JSON.parse(localStorage.getItem('user') || '{}');
                const ownerId = owner.ownerId || owner.loginId || 'owner';
                
                // Use booking_id as the chat room ID
                const chatRoomId = bookingId;
                
                const chatRoom = {
                    id: chatRoomId,  // Use booking_id
                    bookingId: bookingId,
                    ownerId: ownerId,
                    userId: bookingData?.signup_user_id || bookingData?.user_id || bookingData?.userId || '',
                    userName: userName || 'User',
                    userEmail: userEmail || 'no-email@example.com',
                    createdAt: new Date().toISOString(),
                    messages: [],
                    status: 'active'
                };

                console.log('Chat room object:', chatRoom);

                // Try to save to backend
                try {
                    console.log('Attempting to save chat room to backend...');
                    const response = await fetch(`${API_URL}/api/chat/create`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(chatRoom)
                    });
                    if (response.ok) {
                        const result = await response.json();
                        console.log('✅ Chat room created on backend:', result);
                    } else {
                        console.warn('⚠️ Backend returned:', response.status, response.statusText);
                    }
                } catch (e) {
                    console.warn('⚠️ Backend chat creation failed:', e.message);
                }

                // Save to localStorage as backup
                const chatRooms = JSON.parse(localStorage.getItem('chat_rooms') || '[]');
                chatRooms.push(chatRoom);
                localStorage.setItem('chat_rooms', JSON.stringify(chatRooms));
                console.log('✅ Chat room saved to localStorage');

                // Also link this booking to the chat room
                const acceptedBookings = JSON.parse(localStorage.getItem('accepted_bookings') || '[]');
                if (!acceptedBookings.find(b => b.bookingId === bookingId)) {
                    acceptedBookings.push({
                        bookingId: bookingId,
                        chatRoomId: chatRoomId,
                        userId: chatRoom.userId || '',
                        userName: userName,
                        userEmail: userEmail,
                        createdAt: new Date().toISOString()
                    });
                    localStorage.setItem('accepted_bookings', JSON.stringify(acceptedBookings));
                }

                console.log('✅ Chat room created successfully');
                return chatRoom;
            } catch (error) {
                console.error('Error creating chat room:', error);
            }
        }

        // Send booking form link to tenant via chat
        function sendBookingFormLink(bookingId, tenantName, tenantEmail, propertyId, propertyName, ownerName) {
            console.log('📖 Book button clicked - generating booking link');
            
            const currentOwner = JSON.parse(localStorage.getItem('user') || '{}');
            const ownerId = currentOwner.ownerId || currentOwner.loginId || '';
            const ownerFullName = currentOwner.name || ownerName || 'Owner';
            
            // Generate booking form link with all parameters
                        const bookingBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                            ? 'http://localhost:5001'
                            : 'https://api.roomhy.com';
                        const bookingFormLink = `${bookingBase}/propertyowner//propertyowner/booking-form?bookingId=${bookingId}&ownerName=${encodeURIComponent(ownerFullName)}&propertyId=${encodeURIComponent(propertyId)}&propertyName=${encodeURIComponent(propertyName)}&tenantName=${encodeURIComponent(tenantName)}&tenantEmail=${encodeURIComponent(tenantEmail)}`;
            
            console.log('📋 Booking link data:', {
                bookingId, tenantName, tenantEmail, propertyId, propertyName, ownerFullName
            });
            
            // Store booking data in sessionStorage
            const bookingData = {
                booking_id: bookingId,
                property_id: propertyId,
                property_name: propertyName,
                owner_name: ownerFullName,
                owner_id: ownerId,
                tenant_name: tenantName,
                tenant_email: tenantEmail
            };
            
            console.log('💾 Booking data:', bookingData);
            sessionStorage.setItem('bookingRequestData', JSON.stringify(bookingData));
            
            // Generate link message
            const linkMessage = `📋 Here's your booking form: ${bookingFormLink}`;
            console.log('🔗 Booking link:', bookingFormLink);
            
            // For now, just copy link to clipboard and show message
            navigator.clipboard.writeText(bookingFormLink).then(() => {
                alert(`✅ Booking link copied to clipboard!\n\nYou can share this with the tenant:\n${bookingFormLink}`);
                console.log('✅ Link copied to clipboard');
            }).catch(err => {
                console.error('❌ Failed to copy link:', err);
                alert(`Booking link:\n${bookingFormLink}`);
            });
        }

        // Accept a booking request (from REQUEST tab)
        async function acceptRequest(requestId, requestName, requestEmail) {
            if (!confirm('Are you sure you want to accept this request?')) return;
            
            try {
                const request = allBookingRequests.find(r => (r._id === requestId || r.id === requestId) && r.request_type !== 'bid');
                if (!request) return;

                console.log('📋 Request object:', request);
                console.log('Accepting request:', requestId, 'Name:', requestName, 'Email:', requestEmail);

                request.status = 'accepted';
                request.responseDate = new Date().toISOString();

                // Save to localStorage immediately (use correct key that loadBookingRequests uses)
                const allBookingsReq = JSON.parse(localStorage.getItem('roomhy_booking_requests') || '[]');
                const reqIdx = allBookingsReq.findIndex(r => r._id === requestId || r.id === requestId);
                if (reqIdx >= 0) {
                    allBookingsReq[reqIdx] = request;
                    localStorage.setItem('roomhy_booking_requests', JSON.stringify(allBookingsReq));
                    console.log('✅ Saved to localStorage with correct key');
                } else {
                    // If not found, also update allBookingRequests array in memory
                    const reqInArray = allBookingRequests.find(r => r._id === requestId || r.id === requestId);
                    if (reqInArray) {
                        reqInArray.status = 'accepted';
                        reqInArray.responseDate = request.responseDate;
                    }
                }

                // Save to API FIRST (before chat creation)
                try {
                    const payloadData = {
                        bookingId: requestId,
                        _id: requestId,
                        status: 'accepted',
                        responseDate: request.responseDate,
                        acceptedAt: new Date().toISOString(),
                        name: requestName,
                        email: requestEmail,
                        user_id: request.user_id || '',
                        property_id: request.property_id || '',
                        property_name: request.property_name || '',
                        owner_name: request.owner_name || request.ownerName || '',
                        owner_id: request.owner_id || request.ownerId || ''
                    };
                    
                    console.log('💾 Saving to database:', `${API_URL}/api/booking/update`);
                    console.log('📦 Payload being sent:', payloadData);
                    
                    const response = await fetch(`${API_URL}/api/booking/update`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payloadData)
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        console.log('✅ Database update successful:', result);
                    } else {
                        const errorText = await response.text();
                        console.warn('⚠️ API returned:', response.status, errorText);
                    }
                } catch (e) {
                    console.warn('⚠️ API call failed (will try alternative):', e.message);
                    // Try alternative endpoint
                    try {
                        const altResponse = await fetch(`${API_URL}/api/bookings/${requestId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                status: 'accepted',
                                responseDate: request.responseDate,
                                acceptedAt: new Date().toISOString()
                            })
                        });
                        if (altResponse.ok) {
                            console.log('✅ Alternative API endpoint worked');
                        }
                    } catch (altE) {
                        console.warn('⚠️ Alternative endpoint also failed:', altE.message);
                    }
                }

                // Create chat room after database save
                console.log('💬 Creating chat room...');
                await createChatRoom(requestId, requestName, requestEmail, request);
                console.log('✅ Chat room created');

                // Re-fetch to ensure updated data
                console.log('🔄 Re-fetching booking data...');
                await loadBookingRequests();

                renderBookingTable();
                const reqUserId = (request.user_id || request.signup_user_id || '').toString().trim().toLowerCase() || generateWebsiteUserIdFromEmail(requestEmail);
                await notifyWebsiteUserAndEmail(
                    reqUserId,
                    requestEmail,
                    'Booking Accepted',
                    `${requestName || 'User'}, your booking request has been accepted.`,
                    'booking_accept'
                );
                alert('✅ Request accepted! Chat room created.\n\nThe tenant will see this in their chats.');
            } catch (error) {
                console.error('Error accepting request:', error);
                alert('Error accepting request: ' + error.message);
            }
        }

        // Reject a booking request
        async function rejectRequest(requestId) {
            if (!confirm('Are you sure you want to reject this request?')) return;
            
            try {
                const request = allBookingRequests.find(r => (r._id === requestId || r.id === requestId) && r.request_type !== 'bid');
                if (!request) return;

                request.status = 'rejected';
                request.responseDate = new Date().toISOString();

                try {
                    const response = await fetch(`${API_URL}/api/booking/update`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            bookingId: requestId, 
                            status: 'rejected', 
                            responseDate: request.responseDate 
                        })
                    });
                    if (!response.ok) throw new Error('API update failed');
                } catch (e) {
                    console.log('API not available, using localStorage');
                }

                const allRequests = JSON.parse(localStorage.getItem('booking_requests') || '[]');
                const idx = allRequests.findIndex(r => r._id === requestId || r.id === requestId);
                if (idx >= 0) {
                    allRequests[idx] = request;
                    localStorage.setItem('booking_requests', JSON.stringify(allRequests));
                }

                renderBookingTable();
                alert('✅ Request rejected');
            } catch (error) {
                console.error('Error rejecting request:', error);
                alert('Error rejecting request');
            }
        }

        // Confirm a booking request
        async function confirmRequest(requestId) {
            if (!confirm('Are you sure you want to confirm this request?')) return;
            
            try {
                const request = allBookingRequests.find(r => (r._id === requestId || r.id === requestId) && r.request_type !== 'bid');
                if (!request) return;

                request.status = 'confirmed';
                request.confirmedDate = new Date().toISOString();

                try {
                    const response = await fetch(`${API_URL}/api/booking/update`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            bookingId: requestId, 
                            status: 'confirmed', 
                            confirmedDate: request.confirmedDate 
                        })
                    });
                    if (!response.ok) throw new Error('API update failed');
                } catch (e) {
                    console.log('API not available, using localStorage');
                }

                const allRequests = JSON.parse(localStorage.getItem('booking_requests') || '[]');
                const idx = allRequests.findIndex(r => r._id === requestId || r.id === requestId);
                if (idx >= 0) {
                    allRequests[idx] = request;
                    localStorage.setItem('booking_requests', JSON.stringify(allRequests));
                }

                renderBookingTable();
                alert('✅ Request confirmed!');
            } catch (error) {
                console.error('Error confirming request:', error);
                alert('Error confirming request');
            }
        }

        // ✅ UPDATED: Apply query param filters (propertyId only) to the requests list
        function applyQueryFilters() {
            try {
                // Start with all requests
                let baseRequests = [...allBookingRequests];

                // Apply tab filter
                if (currentTab === 'request') {
                    baseRequests = baseRequests.filter(req => req.request_type !== 'bid');
                } else if (currentTab === 'bid') {
                    baseRequests = baseRequests.filter(req => req.request_type === 'bid');
                }

                // Optional: If propertyId is in URL, filter by that property
                const params = new URLSearchParams(window.location.search);
                const propParam = params.get('propertyId');

                if (propParam) {
                    const propId = decodeURIComponent(propParam);
                    filteredRequests = baseRequests.filter(req => {
                        const rpid = (req.property_id || req.propertyId || req._id || req.id || '').toString();
                        return rpid === propId || rpid.includes(propId);
                    });
                } else {
                    // No property filter, show all (already server-filtered by owner_id)
                    filteredRequests = [...baseRequests];
                }

                renderBookingTable();
            } catch (e) {
                console.error('Error applying query filters:', e);
                renderBookingTable();
            }
        }

        // Search and filter functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const statusFilter = document.getElementById('statusFilter').value;

            // Start with tab-filtered requests
            let baseRequests = [...allBookingRequests];
            if (currentTab === 'request') {
                baseRequests = baseRequests.filter(req => req.request_type !== 'bid');
            } else if (currentTab === 'bid') {
                baseRequests = baseRequests.filter(req => req.request_type === 'bid');
            }

            filteredRequests = baseRequests.filter(req => {
                const matchesSearch = !searchTerm ||
                    (req.property_name && req.property_name.toLowerCase().includes(searchTerm)) ||
                    (req.property_id && req.property_id.toLowerCase().includes(searchTerm)) ||
                    (req.user_id && req.user_id.toLowerCase().includes(searchTerm)) ||
                    (req.name && req.name.toLowerCase().includes(searchTerm)) ||
                    (req.email && req.email.toLowerCase().includes(searchTerm));

                const matchesStatus = !statusFilter || req.status === statusFilter;

                return matchesSearch && matchesStatus;
            });

            renderBookingTable();
        });

        // Status filter functionality
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            const statusFilter = e.target.value;
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();

            // Start with tab-filtered requests
            let baseRequests = [...allBookingRequests];
            if (currentTab === 'request') {
                baseRequests = baseRequests.filter(req => req.request_type !== 'bid');
            } else if (currentTab === 'bid') {
                baseRequests = baseRequests.filter(req => req.request_type === 'bid');
            }

            filteredRequests = baseRequests.filter(req => {
                const matchesSearch = !searchTerm ||
                    (req.property_name && req.property_name.toLowerCase().includes(searchTerm)) ||
                    (req.property_id && req.property_id.toLowerCase().includes(searchTerm)) ||
                    (req.user_id && req.user_id.toLowerCase().includes(searchTerm)) ||
                    (req.name && req.name.toLowerCase().includes(searchTerm)) ||
                    (req.email && req.email.toLowerCase().includes(searchTerm));

                const matchesStatus = !statusFilter || req.status === statusFilter;

                return matchesSearch && matchesStatus;
            });

            renderBookingTable();
        });

        // ============ HEADER INITIALIZATION ============

        // Initialize header with user information
        function initializeHeader() {
            try {
                const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
                
                if (!user || !user.loginId) {
                    console.warn('âš ï¸ No user found, using defaults');
                    document.getElementById('headerName').innerText = 'Owner';
                    document.getElementById('headerAccountId').innerText = 'Property Owner';
                    document.getElementById('headerAvatar').innerText = 'O';
                    return;
                }

                // Get display name from various sources
                const displayName = user.name || user.firstName || 'Owner';
                document.getElementById('headerName').innerText = displayName;
                document.getElementById('headerAvatar').innerText = displayName.charAt(0).toUpperCase();
                document.getElementById('headerAccountId').innerText = `Account: ${user.loginId}`;
                
                console.log('✅ Header initialized for:', displayName);
            } catch (error) {
                console.error('Error initializing header:', error);
            }
        }

        // Logout functionality
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');
            localStorage.removeItem('ownerLoginId');
            window.location.href = '/propertyowner/ownerlogin';
        });

        // Tab switching functionality
        document.getElementById('requestBookingTab').addEventListener('click', function() {
            currentTab = 'request';
            document.getElementById('requestBookingTab').classList.add('active');
            document.getElementById('requestBookingTab').classList.remove('text-gray-500', 'hover:text-gray-700');
            document.getElementById('requestBookingTab').classList.add('text-purple-600', 'border-b-2', 'border-purple-500');
            document.getElementById('biddingTab').classList.remove('active', 'text-purple-600', 'border-b-2', 'border-purple-500');
            document.getElementById('biddingTab').classList.add('text-gray-500', 'hover:text-gray-700');
            
            // Show booking table, hide bidding table
            document.querySelector('table').parentElement.parentElement.classList.remove('hidden');
            document.getElementById('biddingSection').classList.add('hidden');
            
            applyQueryFilters();
        });

        document.getElementById('biddingTab').addEventListener('click', function() {
            currentTab = 'bid';
            document.getElementById('biddingTab').classList.add('active');
            document.getElementById('biddingTab').classList.remove('text-gray-500', 'hover:text-gray-700');
            document.getElementById('biddingTab').classList.add('text-purple-600', 'border-b-2', 'border-purple-500');
            document.getElementById('requestBookingTab').classList.remove('active', 'text-purple-600', 'border-b-2', 'border-purple-500');
            document.getElementById('requestBookingTab').classList.add('text-gray-500', 'hover:text-gray-700');
            
            // Hide booking table, show bidding table
            document.querySelector('table').parentElement.parentElement.classList.add('hidden');
            document.getElementById('biddingSection').classList.remove('hidden');
            
            loadBiddingRequests();
        });

        // Load data on page load
        document.addEventListener('DOMContentLoaded', () => {
            console.log('ðŸ“„ Page loaded, initializing booking requests...');
            lucide.createIcons();
            initializeHeader();
            loadBookingRequests();
            loadBiddingRequests(); // Also load bidding requests on page load
            // Refresh data every 30 seconds
            setInterval(() => {
                loadBookingRequests();
                loadBiddingRequests();
            }, 30000);
        });

        // ============ ACTION FUNCTIONS ============

        // Approve booking
        async function approveBooking(bookingId) {
            if (!confirm('Are you sure you want to approve this booking?')) return;

            try {
                const apiUrl = API_URL;

                const response = await fetch(`${apiUrl}/api/booking/requests/${bookingId}/approve`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });

                if (response.ok) {
                    // Create chat room for owner-website user communication
                    await createEnquiryChatRoom(bookingId);
                    alert('Booking approved successfully! Chat room created for communication.');
                    loadBookingRequests();
                } else {
                    alert('Error approving booking');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error approving booking');
            }
        }

        // Create chat room when owner accepts enquiry
        async function createEnquiryChatRoom(bookingId) {
            try {
                // Get booking details to extract user info
                const bookingResponse = await fetch(`${API_URL}/api/booking/requests/${bookingId}`);
                if (!bookingResponse.ok) {
                    console.warn('Could not fetch booking details for room creation');
                    return;
                }

                const bookingData = await bookingResponse.json();
                const booking = bookingData.data || bookingData;

                // Get owner info from session
                let ownerId = null;
                try {
                    const ownerSessionRaw = sessionStorage.getItem('owner_session') || localStorage.getItem('owner_session');
                    if (ownerSessionRaw) {
                        const ownerSession = JSON.parse(ownerSessionRaw);
                        ownerId = ownerSession.loginId || ownerSession.ownerId || ownerSession.login || ownerSession.id || ownerId;
                    }
                } catch (e) {
                    console.warn('Could not parse owner_session', e);
                }

                if (!ownerId) {
                    console.warn('No owner ID found, skipping room creation');
                    return;
                }

                // Generate website user login ID from email
                const userLoginId = booking.email ? ChatManager.generateWebsiteUserLoginId(booking.email) : booking.user_id;

                // Get owner name from session
                let ownerName = 'Property Owner';
                try {
                    const ownerSessionRaw = sessionStorage.getItem('owner_session') || localStorage.getItem('owner_session');
                    if (ownerSessionRaw) {
                        const ownerSession = JSON.parse(ownerSessionRaw);
                        ownerName = ownerSession.name || ownerSession.ownerName || 'Property Owner';
                    }
                } catch (e) {
                    console.warn('Could not get owner name from session');
                }

                // Create room data
                const roomData = {
                    room_type: 'owner_website_user',
                    participants: [
                        {
                            login_id: ownerId,
                            role: 'property_owner',
                            name: ownerName
                        },
                        {
                            login_id: userLoginId,
                            role: 'website_user',
                            name: booking.name || booking.email || 'Website User'
                        }
                    ],
                    owner_accepted: true,
                    property_id: booking.property_id,
                    property_name: booking.property_name,
                    enquiry_details: {
                        booking_id: bookingId,
                        user_email: booking.email,
                        user_phone: booking.phone,
                        bid_amount: booking.bid_amount
                    }
                };

                // Create the room
                const roomResponse = await fetch(`${API_URL}/api/chat/rooms`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(roomData)
                });

                if (roomResponse.ok) {
                    const roomResult = await roomResponse.json();
                    console.log('✓ Chat room created:', roomResult.room_id);
                } else {
                    console.warn('Failed to create chat room:', roomResponse.status);
                }

            } catch (error) {
                console.error('Error creating enquiry chat room:', error);
            }
        }

        // Reject booking
        async function rejectBooking(bookingId) {
            const reason = prompt('Enter reason for rejection:');
            if (!reason) return;

            try {
                const apiUrl = API_URL;

                const response = await fetch(`${apiUrl}/api/booking/requests/${bookingId}/reject`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: reason })
                });

                if (response.ok) {
                    alert('Booking rejected');
                    loadBookingRequests();
                } else {
                    alert('Error rejecting booking');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error rejecting booking');
            }
        }


        // Schedule visit API call
        async function scheduleVisit(bookingId, visitType, visitDate, timeSlot, visitNotes) {
            try {
                const apiUrl = API_URL;

                const response = await fetch(`${apiUrl}/api/booking/requests/${bookingId}/schedule-visit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        visit_type: visitType,
                        visit_date: visitDate,
                        visit_time_slot: timeSlot,
                        visit_notes: visitNotes
                    })
                });

                if (response.ok) {
                    alert('Visit scheduled successfully!');
                    loadBookingRequests();
                } else {
                    alert('Error scheduling visit');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error scheduling visit');
            }
        }

        // Proceed booking - update booking status to confirmed
        function proceedBooking(bookingId) {
            try {
                const data = { status: 'confirmed' };
                fetch(`/api/booking/${bookingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                .then(r => r.json())
                .then(result => {
                    alert('Booking confirmed successfully!');
                    location.reload();
                })
                .catch(e => {
                    console.warn('Proceed action error:', e);
                    alert('Error confirming booking.');
                });
            } catch (e) {
                console.warn('Proceed action failed:', e);
                alert('Proceeding with booking...');
            }
        }

        // Open chat window for the booking
        function openChat(bookingId, userId) {
            // Get owner context
            const owner = JSON.parse(sessionStorage.getItem('owner_user') || localStorage.getItem('user') || 'null');
            sessionStorage.setItem('chatContext', JSON.stringify({
                bookingId: bookingId,
                userId: userId,
                userRole: 'property-owner',
                ownerId: owner ? (owner.ownerId || owner.loginId) : '',
                ownerName: owner ? (owner.name || owner.ownerName) : ''
            }));

            // Open chat in new tab or same window
            window.open('/propertyowner/ownerchat?booking=' + bookingId + '&user=' + userId, 'roomhy_chat', 'width=1000,height=700');
        }

        // Mobile Menu Functionality
        document.getElementById('mobile-menu-open').addEventListener('click', function() {
            document.getElementById('mobile-menu').classList.remove('hidden');
        });

        document.getElementById('close-mobile-menu').addEventListener('click', function() {
            document.getElementById('mobile-menu').classList.add('hidden');
        });

        document.getElementById('mobile-menu-overlay').addEventListener('click', function() {
            document.getElementById('mobile-menu').classList.add('hidden');
        });

        // Initialize notifications when page loads
        document.addEventListener('DOMContentLoaded', function() {
            initializeNotifications();
            loadBookingRequests();
            lucide.createIcons();
        });
