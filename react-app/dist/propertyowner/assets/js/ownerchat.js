let currentOwner = null;
        let currentChat = null;
        let socket = null;
        let socketReady = false;
        let ownerSocketIdentity = null;
        let acceptedBookings = [];
        const OWNER_LOGIN_ID_REGEX = /^ROOMHY\d{4}$/i;
        const WEBSITE_USER_ID_REGEX = /^roomhyweb\d{6}$/i;
        const CHAT_API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:5001'
            : 'https://api.roomhy.com';

        function isValidOwnerLoginId(v) {
            return OWNER_LOGIN_ID_REGEX.test(String(v || '').trim().toUpperCase());
        }

        function isValidWebsiteUserId(v) {
            return WEBSITE_USER_ID_REGEX.test(String(v || '').trim().toLowerCase());
        }

        function normalizeWebsiteUserId(raw) {
            const value = String(raw || '').trim().toLowerCase();
            if (WEBSITE_USER_ID_REGEX.test(value)) return value;
            const digits = value.replace(/\D/g, '').slice(-6);
            if (digits.length === 6) return `roomhyweb${digits}`;
            return '';
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

        function generateWebsiteUserIdFromBooking(booking) {
            const base = String(booking?._id || booking?.id || booking?.bookingId || '').trim();
            if (!base) return '';
            const digits = base.replace(/\D/g, '').slice(-6);
            if (digits.length === 6) return `roomhyweb${digits}`;
            let hash = 0;
            for (let i = 0; i < base.length; i += 1) {
                hash = (hash * 33 + base.charCodeAt(i)) % 1000000;
            }
            return `roomhyweb${String(hash).padStart(6, '0')}`;
        }

        function resolveWebsiteUserId(booking) {
            const raw = String(
                booking?.signup_user_id ||
                booking?.user_id ||
                booking?.user_login_id ||
                booking?.website_user_id ||
                booking?.booking_details?.signup_user_id ||
                booking?.booking_details?.user_id ||
                booking?.booking_details?.user_login_id ||
                ''
            ).trim().toLowerCase();
            const normalized = normalizeWebsiteUserId(raw);
            if (normalized) return normalized;

            const emailBased = generateWebsiteUserIdFromEmail(
                booking?.email ||
                booking?.userEmail ||
                booking?.gmail ||
                booking?.contactEmail ||
                booking?.booking_details?.email
            );
            if (emailBased) return emailBased;

            return generateWebsiteUserIdFromBooking(booking) || raw;
        }

        function getBookingDisplayName(booking) {
            const value = (
                booking?.name ||
                booking?.fullName ||
                booking?.contactName ||
                booking?.user_name ||
                booking?.tenant_name ||
                booking?.booking_details?.name ||
                booking?.booking_details?.fullName ||
                booking?.booking_details?.contactName ||
                booking?.booking_details?.user_name ||
                booking?.booking_details?.tenant_name ||
                booking?.user?.name ||
                booking?.user?.firstName ||
                booking?.firstName ||
                booking?.email ||
                'User'
            );
            const normalized = String(value || '').trim();
            if (!normalized || ['n/a', 'na', 'null', 'undefined'].includes(normalized.toLowerCase())) {
                return 'User';
            }
            return normalized;
        }

        function joinOwnerRoom(ownerId, ownerName) {
            if (!socket) return;
            socket.emit('join_room', {
                login_id: ownerId,
                role: 'property_owner',
                name: ownerName || 'Owner'
            });
        }

        function connectOwnerSocket(ownerId, ownerName) {
            const identity = `${ownerId}::${ownerName || 'Owner'}`;
            if (socket && socket.connected) {
                if (ownerSocketIdentity !== identity) {
                    ownerSocketIdentity = identity;
                }
                joinOwnerRoom(ownerId, ownerName);
                return;
            }

            ownerSocketIdentity = identity;
            if (socket) {
                try { socket.removeAllListeners(); } catch (_) {}
                try { socket.disconnect(); } catch (_) {}
            }

            socket = io(CHAT_API_URL, {
                transports: ['websocket'],
                upgrade: false,
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000
            });
            socket.on('connect', () => {
                socketReady = true;
                joinOwnerRoom(ownerId, ownerName);
            });
            socket.on('disconnect', () => { socketReady = false; });
            socket.on('reconnect', () => {
                socketReady = true;
                joinOwnerRoom(ownerId, ownerName);
            });
            socket.on('receive_message', () => {
                if (currentChat) loadMessages();
            });
        }

        async function notifyWebsiteUser(title, message, type = 'chat') {
            try {
                const userId = resolveWebsiteUserId(currentChat);
                const userEmail = currentChat?.email || currentChat?.gmail || currentChat?.contactEmail || '';
                if (!userId) return;

                await fetch(`${CHAT_API_URL}/api/notifications/website/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        title,
                        message,
                        type
                    })
                });

                if (userEmail) {
                    await fetch(`${CHAT_API_URL}/api/email/send`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: userEmail,
                            subject: `RoomHy: ${title}`,
                            html: `<p>${message}</p>`
                        })
                    });
                }
            } catch (e) {
                console.warn('notifyWebsiteUser failed:', e.message);
            }
        }

        console.log('✅ /propertyowner/ownerchat script loaded');

        // Initialize Lucide icons
        function refreshIcons() {
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        
        function toggleMobileMenu() {
            const sidebar = document.getElementById('mobile-sidebar');
            const overlay = document.getElementById('mobile-sidebar-overlay');
            if (sidebar) sidebar.classList.toggle('-translate-x-full');
            if (overlay) overlay.classList.toggle('hidden');
        }

        function updateMobileChatLayout() {
            const contactsPanel = document.getElementById('contacts-panel');
            const chatCanvas = document.getElementById('chat-canvas');
            if (!contactsPanel || !chatCanvas) return;

            if (window.innerWidth < 768) {
                if (currentChat) {
                    contactsPanel.classList.add('hidden');
                    chatCanvas.classList.remove('hidden');
                    chatCanvas.classList.add('flex', 'mobile-active');
                } else {
                    contactsPanel.classList.remove('hidden');
                    chatCanvas.classList.add('hidden');
                    chatCanvas.classList.remove('mobile-active');
                }
            } else {
                contactsPanel.classList.remove('hidden');
                chatCanvas.classList.remove('hidden');
                chatCanvas.classList.add('flex');
                chatCanvas.classList.remove('mobile-active');
            }
        }

        // Get URL parameter for booking ID
        function getBookingIdFromURL() {
            const params = new URLSearchParams(window.location.search);
            return params.get('booking') || params.get('bookingId') || null;
        }

        // Load Session
        async function loadOwner() {
            try {
                let owner = null;
                const ownerUserData = sessionStorage.getItem('owner_user') || localStorage.getItem('owner_user');
                const userData = localStorage.getItem('user');
                const loginIdFromQuery = new URLSearchParams(window.location.search).get('loginId');
                
                if (ownerUserData) {
                    owner = JSON.parse(ownerUserData);
                } else if (userData) {
                    owner = JSON.parse(userData);
                }
                
                if ((!owner || !(owner.loginId || owner.ownerId)) && loginIdFromQuery) {
                    owner = { loginId: loginIdFromQuery, name: 'Owner' };
                }

                if (owner && (owner.loginId || owner.ownerId)) {
                    currentOwner = owner;
                    const ownerId = String(owner.loginId || owner.ownerId || '').trim().toUpperCase();
                    if (!isValidOwnerLoginId(ownerId)) {
                        alert('Invalid owner login ID. Expected format: ROOMHY####');
                        window.location.href = '/propertyowner/ownerlogin';
                        return;
                    }
                    const ownerName = owner.name || owner.ownerName || 'Owner';
                    
                    document.getElementById('headerOwnerName').textContent = ownerName;
                    document.getElementById('headerOwnerId').textContent = `ID: ${ownerId}`;
                    document.getElementById('headerAvatar').textContent = ownerName.charAt(0).toUpperCase();
                    currentOwner.loginId = ownerId;
                    connectOwnerSocket(ownerId, ownerName);
                    loadChats();
                } else {
                    window.location.href = '/propertyowner/ownerlogin';
                }
            } catch (err) {
                console.error('Error loading owner:', err);
                window.location.href = '/propertyowner/ownerlogin';
            }
        }

        async function loadChats() {
            if (!currentOwner) return;
            const ownerId = currentOwner.loginId || currentOwner.ownerId;
            const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001' : 'https://api.roomhy.com';
            const bookingIdFromURL = getBookingIdFromURL();

            let bookings = [];
            
            try {
                // Try to fetch from API first
                const response = await fetch(`${API_URL}/api/booking/requests?owner_id=${ownerId}`);
                const data = await response.json();
                const allBookings = data.data || [];
                // Filter to show ONLY ACCEPTED bookings (as per user requirement)
                bookings = allBookings.filter(b => b.status === 'accepted');
            } catch (err) {
                console.warn("API fetch failed, using localStorage fallback", err);
            }

            // If no API data, check localStorage for accepted bookings
            if (bookings.length === 0) {
                const roomhyBookings = JSON.parse(localStorage.getItem('roomhy_booking_requests') || '[]');
                const allBiddingRequests = JSON.parse(localStorage.getItem('all_bidding_requests') || '[]');
                const bookingRequests = JSON.parse(localStorage.getItem('booking_requests') || '[]');
                const allLocalBookings = [...roomhyBookings, ...allBiddingRequests, ...bookingRequests];
                
                // Filter accepted bookings
                bookings = allLocalBookings.filter(b => b.status === 'accepted');
                
                // Also check if we have chat_rooms in localStorage (created from accept button)
                const chatRooms = JSON.parse(localStorage.getItem('chat_rooms') || '[]');
                if (bookings.length === 0 && chatRooms.length > 0) {
                    // Convert chat rooms to booking format for display
                    bookings = chatRooms.map(chat => ({
                        _id: chat.bookingId,
                        id: chat.bookingId,
                        name: chat.userName,
                        user_id: chat.bookingId,
                        signup_user_id: chat.bookingId,
                        email: chat.userEmail,
                        status: 'accepted',
                        property_name: 'Chat from booking',
                        createdAt: chat.createdAt
                    }));
                }
            }

            // Enrich from local chat cache so name appears even if API omits it
            const localChatRooms = JSON.parse(localStorage.getItem('chat_rooms') || '[]');
            bookings = bookings.map((b) => {
                const bookingId = b._id || b.id || b.bookingId;
                const chat = localChatRooms.find(c => String(c.bookingId || c.id) === String(bookingId));
                if (!chat) return b;
                return {
                    ...b,
                    name: b.name || chat.userName || b.fullName || b.contactName,
                    fullName: b.fullName || chat.userName,
                    email: b.email || chat.userEmail,
                    user_id: b.user_id || b.signup_user_id || chat.userId || chat.userLoginId || '',
                    signup_user_id: b.signup_user_id || b.user_id || chat.userId || chat.userLoginId || ''
                };
            });

            acceptedBookings = bookings;

            const chatList = document.getElementById('chat-list');
            chatList.innerHTML = '';

            if (bookings.length === 0) {
                chatList.innerHTML = '<div class="p-8 text-center text-xs text-gray-400">No accepted conversations yet.<br/>Accept requests to start chatting.</div>';
                return;
            }

            // Deduplicate by user
            const uniqueUsers = [];
            const seenUsers = new Set();
            bookings.forEach(b => {
                const userId = resolveWebsiteUserId(b);
                const dedupeKey = userId || String(b.email || b._id || b.id || Math.random());
                if (!seenUsers.has(dedupeKey)) {
                    seenUsers.add(dedupeKey);
                    if (userId) {
                        b.user_id = userId;
                        b.signup_user_id = userId;
                    }
                    b.name = getBookingDisplayName(b);
                    uniqueUsers.push(b);
                }
            });

            uniqueUsers.forEach(booking => {
                const item = document.createElement('div');
                const isSelected = bookingIdFromURL && booking._id === bookingIdFromURL;
                item.className = `flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-all border border-transparent ${isSelected ? 'active-chat-item' : ''}`;
                if (currentChat && currentChat._id === booking._id) item.classList.add('active-chat-item');
                
                const bookingIdShort = booking._id ? booking._id.substring(0, 8) : booking.id ? booking.id.substring(0, 8) : 'N/A';
                
                item.innerHTML = `
                    <div class="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">${getBookingDisplayName(booking).charAt(0)}</div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-baseline">
                            <h4 class="text-sm font-bold text-slate-800 truncate">${getBookingDisplayName(booking)}</h4>
                            <span class="text-[9px] text-gray-400">Booking: ${bookingIdShort}</span>
                        </div>
                        <p class="text-xs text-gray-500 truncate">ID: ${booking.signup_user_id || booking.user_id || booking.email || 'N/A'}</p>
                        <p class="text-xs text-gray-500 truncate">${booking.property_name || 'Chat conversation'}</p>
                    </div>
                `;
                item.onclick = () => openChat(booking);
                chatList.appendChild(item);
                
                // Auto-open if booking ID matches URL parameter
                if (bookingIdFromURL && booking._id === bookingIdFromURL) {
                    setTimeout(() => openChat(booking), 100);
                }
            });
            refreshIcons();
        }

        function openChat(booking) {
            currentChat = booking;
            if (currentOwner?.loginId) {
                connectOwnerSocket(
                    String(currentOwner.loginId || currentOwner.ownerId || '').trim().toUpperCase(),
                    currentOwner.name || currentOwner.ownerName || 'Owner'
                );
            }
            
            // UI Toggle
            document.getElementById('no-chat-selected').classList.add('hidden');
            document.getElementById('chat-active').classList.remove('hidden');
            
            // Update Active Header with booking info
            const displayName = getBookingDisplayName(booking);
            document.getElementById('active-chat-name').textContent = displayName;
            document.getElementById('active-chat-avatar').textContent = displayName.charAt(0).toUpperCase();
            
            // Display Booking ID in header subtitle
            const bookingIdDisplay = document.querySelector('.booking-id-display') || createBookingIdDisplay();
            if (booking._id) {
                bookingIdDisplay.textContent = `Booking ID: ${booking._id}`;
                bookingIdDisplay.style.display = 'block';
            }
            
            // Mobile toggle
            updateMobileChatLayout();

            // Highlighting in list
            document.querySelectorAll('#chat-list > div').forEach(el => el.classList.remove('active-chat-item'));
            // Find and highlight the current chat item
            const chatItems = document.querySelectorAll('#chat-list > div');
            chatItems.forEach(item => {
                if (item.textContent.includes(getBookingDisplayName(booking))) {
                    item.classList.add('active-chat-item');
                }
            });

            loadMessages();
        }

        function createBookingIdDisplay() {
            const header = document.querySelector('[id="active-chat-name"]').parentElement;
            const display = document.createElement('p');
            display.className = 'booking-id-display text-[10px] text-blue-600 font-semibold mt-1';
            header.appendChild(display);
            return display;
        }

        async function loadMessages() {
            if (!currentChat || !currentOwner) return;

            const ownerId = String(currentOwner.loginId || currentOwner.ownerId || '').trim().toUpperCase();
            const userId = resolveWebsiteUserId(currentChat);
            const messagesDiv = document.getElementById('messages');
            if (!isValidOwnerLoginId(ownerId) || !isValidWebsiteUserId(userId) || !messagesDiv) return;

            try {
                const response = await fetch(`${CHAT_API_URL}/api/chat/conversation?user1=${encodeURIComponent(ownerId)}&user2=${encodeURIComponent(userId)}`);
                const messages = response.ok ? await response.json() : [];
                messagesDiv.innerHTML = '';

                if (!Array.isArray(messages) || messages.length === 0) {
                    messagesDiv.innerHTML = '<div class="p-4 text-center text-xs text-gray-400">No messages yet. Start the conversation!</div>';
                    return;
                }

                function normalizeBookingLink(rawLink) {
                    try {
                        const defaultBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                            ? 'http://localhost:5001'
                            : 'https://api.roomhy.com';
                        const parsed = new URL(rawLink, defaultBase);

                        if (/booking-form(?:\.html)?$/i.test(parsed.pathname)) {
                            parsed.pathname = '/propertyowner/booking-form';
                        }

                        if (!parsed.hostname || parsed.hostname === window.location.hostname) {
                            return `${defaultBase}${parsed.pathname}${parsed.search}${parsed.hash}`;
                        }

                        return parsed.toString();
                    } catch (_e) {
                        return rawLink;
                    }
                }

                messages.forEach((msg) => {
                    const isOwner = String(msg.sender_login_id || '').toUpperCase() === ownerId;
                    const msgContainer = document.createElement('div');
                    msgContainer.className = `message-container flex w-full ${isOwner ? 'justify-end' : 'justify-start'}`;
                    const time = new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    let displayText = String(msg.message || '').replace(/\d{10,}/g, '***');
                    displayText = displayText.replace(/((?:https?:\/\/[^\s]+|\/(?:propertyowner\/)?booking-form(?:\.html)?[^\s]*))/gi, (full) => {
                        const safeLink = /booking-form(?:\.html)?/i.test(full) ? normalizeBookingLink(full) : full;
                        const isBookingLink = /booking-form(?:\.html)?/i.test(full);
                        const label = isBookingLink ? 'Open Booking Form' : full;
                        const linkClass = isBookingLink
                            ? 'chat-link booking-link text-blue-600 hover:text-blue-800 underline font-semibold'
                            : 'chat-link text-blue-500 hover:text-blue-700 hover:underline';
                        return `<a href="${safeLink}" target="_blank" rel="noopener noreferrer" class="${linkClass}">${label}</a>`;
                    });

                    msgContainer.innerHTML = `
                        <div class="message-bubble p-3 shadow-sm ${isOwner ? 'owner' : 'user'}">
                            <p class="text-sm leading-relaxed">${displayText}</p>
                            <div class="flex items-center justify-end gap-1.5 mt-1">
                                <span class="text-[9px] opacity-60">${time}</span>
                            </div>
                        </div>
                    `;
                    messagesDiv.appendChild(msgContainer);
                });

                messagesDiv.scrollTop = messagesDiv.scrollHeight;
                refreshIcons();
            } catch (error) {
                console.error('Error loading messages:', error);
                messagesDiv.innerHTML = '<div class="p-4 text-center text-xs text-red-400">Error loading messages. Please try again.</div>';
            }
        }

        async function sendMessage(reaction = null) {
            const input = document.getElementById('message-text');
            const text = reaction ? (reaction === 'like' ? 'LIKE' : 'DISLIKE') : String(input?.value || '').trim();
            if (!text || !currentChat || !currentOwner) return;

            if (!reaction && /\d{10,}/.test(text)) {
                alert('Please do not share mobile numbers in chat for security reasons.');
                return;
            }

            const ownerId = String(currentOwner.loginId || currentOwner.ownerId || '').trim().toUpperCase();
            const userId = resolveWebsiteUserId(currentChat);
            if (!isValidOwnerLoginId(ownerId) || !isValidWebsiteUserId(userId)) {
                alert('Invalid chat participants.');
                return;
            }

            if (!socket || !socketReady) connectOwnerSocket(ownerId, currentOwner.name || currentOwner.ownerName || 'Owner');
            socket.emit('send_message', { to_login_id: userId, message: text });
            setTimeout(loadMessages, 150);

            const ownerName = currentOwner.name || currentOwner.ownerName || 'Owner';
            if (!reaction) {
                await notifyWebsiteUser(
                    'New Chat Message',
                    `${ownerName}: ${String(text).slice(0, 120)}`,
                    'chat_message'
                );
            }

            if (reaction) {
                const decision = reaction === 'like' ? 'like' : 'reject';
                await updateChatDecision(decision, 'owner');
            }

            if (input) {
                input.value = '';
                input.style.height = 'auto';
            }
        }

        window.editMessage = async function() {
            alert('Edit is disabled for socket chat.');
        };

        window.deleteMessage = async function() {
            alert('Delete is disabled for socket chat.');
        };
        async function sendBookingLink() {
            if (!currentChat || !currentOwner) {
                alert('Please select a chat first');
                return;
            }

            const bookingId = currentChat._id || currentChat.id;
            const userId = resolveWebsiteUserId(currentChat);
            const propertyName = currentChat.property_name || 'Roomhy Property';
            const propertyId = currentChat.property_id || bookingId;
            const ownerId = String(currentOwner.loginId || currentOwner.ownerId || '').trim().toUpperCase();
            const ownerName = currentOwner.name || currentOwner.ownerName || 'Owner';
            const tenantName = currentChat.name || 'Tenant';
            const tenantEmail = currentChat.email || '';

                        const bookingBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                            ? 'http://localhost:5001'
                            : 'https://api.roomhy.com';
                        const bookingFormLink = `${bookingBase}/propertyowner//propertyowner/booking-form?bookingId=${bookingId}&userId=${userId}&ownerName=${encodeURIComponent(ownerName)}&propertyId=${encodeURIComponent(propertyId)}&propertyName=${encodeURIComponent(propertyName)}&tenantName=${encodeURIComponent(tenantName)}&tenantEmail=${encodeURIComponent(tenantEmail)}`;

            const bookingData = {
                booking_id: bookingId,
                user_id: userId,
                property_name: propertyName,
                property_id: propertyId,
                owner_name: ownerName,
                owner_id: ownerId,
                tenant_name: tenantName,
                tenant_email: tenantEmail
            };
            sessionStorage.setItem('bookingRequestData', JSON.stringify(bookingData));

            try {
                if (!socket || !socketReady) {
                    connectOwnerSocket(ownerId, ownerName);
                }
                socket.emit('send_message', {
                    to_login_id: userId,
                    message: `Here's your booking form: ${bookingFormLink}`
                });
                await notifyWebsiteUser(
                    'Booking Form Sent',
                    `Owner shared booking form for ${propertyName}`,
                    'booking_link'
                );

                const messagesDiv = document.getElementById('messages');
                if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight;
            } catch (error) {
                console.error('Failed to send booking link:', error);
                alert('Failed to send booking link');
            }
        }

        async function updateChatDecision(decision, userType) {
            if (!currentChat) return;

            const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001' : 'https://api.roomhy.com';
            const bookingId = currentChat._id || currentChat.id;
            const userId = resolveWebsiteUserId(currentChat);
            
            try {
                const response = await fetch(`${API_URL}/api/booking/requests/${bookingId}/decision`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ decision, userType })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('Decision updated:', result);
                    
                    // If owner liked, send booking form link to chat
                    if (decision === 'like' && userType === 'owner') {
                        // Create booking form link with bookingId and userId
                                                const bookingBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                                                    ? 'http://localhost:5001'
                                                    : 'https://api.roomhy.com';
                                                const bookingFormLink = `${bookingBase}/propertyowner//propertyowner/booking-form?bookingId=${bookingId}&userId=${userId}`;
                        const ownerId = currentOwner.loginId || currentOwner.ownerId;

                        // Save booking details to MongoDB
                        try {
                            const bookingPayload = {
                                _id: bookingId,
                                bookingId: bookingId,
                                userId: userId,
                                ownerId: ownerId,
                                owner_name: currentOwner.name || currentOwner.ownerName || 'Owner',
                                owner_phone: currentOwner.phone || '',
                                owner_email: currentOwner.email || '',
                                property_id: currentChat._id,
                                property_name: currentChat.property_name || 'Property',
                                rent: currentChat.rent || 0,
                                createdAt: new Date().toISOString(),
                                status: 'accepted'
                            };

                            const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001' : 'https://api.roomhy.com';
                            await fetch(`${API_URL}/api/bookings`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(bookingPayload)
                            });
                            console.log('✅ Booking saved to MongoDB');
                        } catch (dbErr) {
                            console.warn('Could not save booking to MongoDB:', dbErr);
                        }
                        // Send booking link via socket
                        const tenantLoginId = resolveWebsiteUserId(currentChat);
                        if (socket && tenantLoginId) {
                            socket.emit('send_message', {
                                to_login_id: tenantLoginId,
                                message: `Great! Please complete booking: ${bookingFormLink}`
                            });
                        }
                        await notifyWebsiteUser(
                            'Booking Accepted',
                            `Your booking for ${currentChat.property_name || 'property'} was accepted by owner.`,
                            'booking_accept'
                        );

                        alert('✅ Booking form link sent to tenant!');
                    }
                    
                    // If rejected, end chat
                    if (result.data && (result.data.owner_rejected || result.data.user_rejected)) {
                        const tenantLoginId = resolveWebsiteUserId(currentChat);
                        if (socket && tenantLoginId) {
                            socket.emit('send_message', {
                                to_login_id: tenantLoginId,
                                message: 'Chat has been closed as one party rejected the booking.'
                            });
                        }
                        await notifyWebsiteUser(
                            'Booking Update',
                            'Booking discussion was closed.',
                            'booking_update'
                        );
                        
                        alert('Booking rejected. Chat closed.');
                        
                        // Close current chat and refresh list
                        try {
                            currentChat = null;
                            const chatActive = document.getElementById('chat-active');
                            const noChatSelected = document.getElementById('no-chat-selected');
                            if (chatActive) chatActive.classList.add('hidden');
                            if (noChatSelected) noChatSelected.classList.remove('hidden');
                            loadChats(); // Refresh to remove if rejected
                        } catch (uiErr) {
                            console.warn('Could not update UI:', uiErr);
                        }
                    }
                } else {
                    console.error('Failed to update decision');
                }
            } catch (err) {
                console.error('Error updating decision:', err);
            }
        }

        // Send email notification for new chat messages
        async function sendChatNotification(message) {
            if (!currentOwner || !currentChat) return;

            try {
                const ownerId = currentOwner.loginId || currentOwner.ownerId;
                const tenantName = currentChat.name || 'Tenant';
                
                // Get owner's email from localStorage (stored during onboarding)
                const ownerAccounts = JSON.parse(localStorage.getItem('owner_accounts') || '[]');
                const currentAccount = ownerAccounts.find(acc => acc.loginId === ownerId);
                
                if (!currentAccount || !currentAccount.email) {
                    console.warn('Owner email not found for notifications');
                    return;
                }

                const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001' : 'https://api.roomhy.com';
                const response = await fetch(`${API_URL}/api/notifications/chat-message`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ownerId: ownerId,
                        tenantName: tenantName,
                        message: message.text,
                        chatId: `${resolveWebsiteUserId(currentChat)}_${ownerId}`
                    })
                });

                if (response.ok) {
                    console.log('✅ Chat notification email sent to owner');
                } else {
                    console.warn('âš ï¸ Failed to send chat notification email');
                }
            } catch (error) {
                console.error('Error sending chat notification:', error);
            }
        }

        // Event Listeners
        const mobileMenuButton = document.getElementById('mobile-menu-open');
        const closeMobileMenuButton = document.getElementById('mobile-sidebar-close');
        const mobileOverlay = document.getElementById('mobile-sidebar-overlay');
        const mobileSidebar = document.getElementById('mobile-sidebar');

        if (mobileMenuButton) mobileMenuButton.addEventListener('click', toggleMobileMenu);
        if (closeMobileMenuButton) closeMobileMenuButton.addEventListener('click', toggleMobileMenu);
        if (mobileOverlay) mobileOverlay.addEventListener('click', toggleMobileMenu);
        if (mobileSidebar) {
            mobileSidebar.querySelectorAll('a').forEach((link) => {
                link.addEventListener('click', () => {
                    if (!mobileSidebar.classList.contains('-translate-x-full')) {
                        toggleMobileMenu();
                    }
                });
            });
        }

        document.getElementById('send-btn').onclick = () => sendMessage();
        document.getElementById('book-input-btn').onclick = () => sendBookingLink();
        document.getElementById('like-input-btn').onclick = () => showLikePopup();
        document.getElementById('dislike-input-btn').onclick = () => showDislikePopup();
        
        document.getElementById('message-text').onkeypress = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        };

        document.getElementById('back-to-contacts').onclick = () => {
            document.getElementById('chat-active').classList.add('hidden');
            document.getElementById('no-chat-selected').classList.remove('hidden');
            currentChat = null;
            updateMobileChatLayout();
        };

        // Popup Functions
        function showLikePopup() {
            document.getElementById('like-popup').classList.add('active');
        }

        function closeLikePopup() {
            document.getElementById('like-popup').classList.remove('active');
        }

        function confirmLike() {
            closeLikePopup();
            
            // Generate booking form link when owner likes
            if (currentChat && currentOwner) {
                console.log('🎯 Owner liked - generating booking form link');
                
                const bookingId = currentChat._id || currentChat.id;
                const userId = resolveWebsiteUserId(currentChat);
                const propertyName = currentChat.property_name || 'Roomhy Property';
                const ownerId = currentOwner.loginId || currentOwner.ownerId;
                const ownerName = currentOwner.name || currentOwner.ownerName || 'Owner';
                
                // Generate booking form link
                                const bookingBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                                    ? 'http://localhost:5001'
                                    : 'https://api.roomhy.com';
                                const bookingFormLink = `${bookingBase}/propertyowner//propertyowner/booking-form?bookingId=${bookingId}&userId=${userId}`;
                
                console.log('📋 Booking form data:', {
                    bookingId, userId, propertyName, ownerId, ownerName
                });
                
                // Store in sessionStorage for /propertyowner/booking-form
                const bookingData = {
                    property_id: currentChat.property_id || bookingId,
                    property_name: propertyName,
                    owner_name: ownerName,
                    owner_id: ownerId,
                    user_id: userId
                };
                
                console.log('💾 Booking data for link:', bookingData);
                
                // Send booking form link in chat message
                const bookingLinkMessage = `📋 Here's your booking form: ${bookingFormLink}`;
                console.log('🔗 Booking link message:', bookingLinkMessage);
            }
            
            sendMessage('like');
        }

        function showDislikePopup() {
            document.getElementById('dislike-popup').classList.add('active');
        }

        function closeDislikePopup() {
            document.getElementById('dislike-popup').classList.remove('active');
        }

        function confirmDislike() {
            closeDislikePopup();
            sendMessage('dislike');
        }

        // Close popups on background click
        document.getElementById('like-popup').onclick = function(e) {
            if (e.target === this) closeLikePopup();
        };

        document.getElementById('dislike-popup').onclick = function(e) {
            if (e.target === this) closeDislikePopup();
        };

        // Auto-expand textarea
        const tx = document.getElementById('message-text');
        tx.addEventListener("input", function() {
            this.style.height = "auto";
            this.style.height = (this.scrollHeight) + "px";
        }, false);

        // Responsive handling
        window.addEventListener('resize', updateMobileChatLayout);

        updateMobileChatLayout();
        loadOwner();
