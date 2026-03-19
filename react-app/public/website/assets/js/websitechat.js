if (typeof lucide !== 'undefined') {
            try { lucide.createIcons(); } catch(e) { console.warn('Lucide icons failed to load', e); }
        }

        // Mobile menu functionality
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

            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', closeMenu);
            });
            
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
        
        // Call on page load
        updateMobileMenuState();
        
        // Listen for storage changes (logout from other tabs)
        window.addEventListener('storage', updateMobileMenuState);

        let currentUser = null;
        let currentChat = null;
        let socket = null;
        let socketReady = false;
        let websiteNotificationPoller = null;
        const seenWebsiteNotificationIds = new Set();
        let userAudioEnabled = false;
        const OWNER_LOGIN_ID_REGEX = /^ROOMHY\d{4}$/i;
        const WEBSITE_USER_ID_REGEX = /^roomhyweb\d{6}$/i;

        function getWebsiteUserAliases(loginId) {
            const aliases = new Set();
            const normalizedLoginId = normalizeWebsiteUserId(loginId) || String(loginId || '').trim();
            if (normalizedLoginId) aliases.add(normalizedLoginId);

            [
                currentUser?.id,
                currentUser?.user_id,
                currentUser?.signup_user_id,
                currentUser?.loginId,
                currentUser?._id,
                currentChat?.user_id,
                currentChat?.signup_user_id,
                currentChat?.website_user_id,
                currentChat?.userLoginId
            ].forEach((value) => {
                const alias = String(value || '').trim();
                if (alias) aliases.add(alias);
            });

            return Array.from(aliases).filter((alias) => alias !== normalizedLoginId);
        }

        function connectChatSocket(loginId, name) {
            const normalizedLoginId = normalizeWebsiteUserId(loginId) || loginId;
            const aliases = getWebsiteUserAliases(normalizedLoginId);
            if (socket && socket.connected) {
                socket.emit('join_room', {
                    login_id: normalizedLoginId,
                    role: 'website_user',
                    name: name || 'Website User',
                    aliases
                });
                return;
            }
            socket = io(API_URL, {
                transports: ['websocket'],
                upgrade: false
            });
            socket.on('connect', () => {
                socketReady = true;
                socket.emit('join_room', {
                    login_id: normalizedLoginId,
                    role: 'website_user',
                    name: name || 'Website User',
                    aliases
                });
            });
            socket.on('disconnect', () => { socketReady = false; });
            socket.on('receive_message', () => {
                if (currentChat) loadMessages();
                showUserNotification('New Message', 'You received a new message from owner');
            });
        }

        function enableUserAudio() {
            userAudioEnabled = true;
        }

        function playUserNotificationSound() {
            if (!userAudioEnabled) return;
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(920, ctx.currentTime);
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.2);
            } catch (_) {}
        }

        function showUserNotification(title, body) {
            playUserNotificationSound();
            if ('Notification' in window && Notification.permission === 'granted') {
                try { new Notification(title, { body }); } catch (_) {}
            }
        }

        async function pollWebsiteUserNotifications() {
            if (!currentUser) return;
            const userId = resolveWebsiteUserIdForChat(currentChat);
            if (!userId) return;
            try {
                const response = await fetch(`${API_URL}/api/notifications/website/user/${encodeURIComponent(userId)}`);
                if (!response.ok) return;
                const data = await response.json();
                const notifications = (data.notifications || []).filter(n => !n.read);
                notifications.forEach(async (n) => {
                    if (!n || !n._id || seenWebsiteNotificationIds.has(n._id)) return;
                    seenWebsiteNotificationIds.add(n._id);
                    showUserNotification(n.title || 'RoomHy Update', n.message || 'You have a new notification');
                    try {
                        await fetch(`${API_URL}/api/notifications/website/${n._id}/read`, { method: 'PUT' });
                    } catch (_) {}
                });
            } catch (_) {}
        }

        function initWebsiteUserNotifications() {
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().catch(() => {});
            }
            document.addEventListener('click', enableUserAudio, { once: true });
            document.addEventListener('keydown', enableUserAudio, { once: true });
            if (websiteNotificationPoller) clearInterval(websiteNotificationPoller);
            websiteNotificationPoller = setInterval(pollWebsiteUserNotifications, 6000);
        }

        function getActiveOwnerLoginId() {
            return String(currentChat?.owner_id || currentChat?.ownerLoginId || '').trim().toUpperCase();
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

        function normalizeWebsiteUserId(rawId) {
            const id = String(rawId || '').trim().toLowerCase();
            if (WEBSITE_USER_ID_REGEX.test(id)) return id;
            const digits = id.replace(/\D/g, '').slice(-6);
            if (digits.length === 6) return `roomhyweb${digits}`;
            return '';
        }

        function resolveWebsiteUserIdForChat(chatObj = currentChat) {
            const fromChat = normalizeWebsiteUserId(
                chatObj?.signup_user_id ||
                chatObj?.user_id ||
                chatObj?.userLoginId ||
                chatObj?.website_user_id ||
                ''
            );
            if (fromChat) return fromChat;

            const fromEmail = generateWebsiteUserIdFromEmail(currentUser?.email || chatObj?.email || chatObj?.user_email || '');
            if (fromEmail) return fromEmail;

            const fromUser = normalizeWebsiteUserId(currentUser?.loginId || currentUser?.id || '');
            if (fromUser) return fromUser;

            return generateWebsiteUserIdFromBooking(chatObj);
        }

        function isValidOwnerLoginId(ownerId) {
            return OWNER_LOGIN_ID_REGEX.test(String(ownerId || '').trim().toUpperCase());
        }

        // Load Session User - Use AuthUtils for proper session isolation
        async function loadUser() {
            // Use AuthUtils to get properly isolated website_user session
            let user = null;
            
            // Try AuthUtils first (checks website_user, staff_user, owner_user, legacy user)
            if (typeof AuthUtils !== 'undefined' && AuthUtils.isLoggedIn()) {
                user = AuthUtils.getCurrentUser();
                console.log('[WebsiteChat] ✅ Loaded user from AuthUtils:', user.id || user.loginId);
            }
            
            // Fallback: manual check for website_user key
            if (!user) {
                user = JSON.parse(sessionStorage.getItem('website_user') || localStorage.getItem('website_user') || 'null');
                console.log('[WebsiteChat] ℹ️ Loaded user from website_user key:', user?.id || user?.loginId);
            }
            
            // Final fallback: check legacy 'user' key
            if (!user) {
                user = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || 'null');
                console.log('[WebsiteChat] ℹ️ Loaded user from legacy user key:', user?.id || user?.loginId);
            }
            
            // If still not logged in, try to get user from email stored in localStorage
            if (!user) {
                const email = localStorage.getItem('user_email');
                if (email) {
                    // Try to fetch user from KYC API
                    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
                        ? 'http://localhost:5001' 
                        : 'https://api.roomhy.com';
                    
                    try {
                        console.log('[WebsiteChat] 🔄 Fetching user from KYC API...');
                        const response = await fetch(`${API_URL}/api/kyc`);
                        const result = await response.json();
                        const kycUsers = result.data || [];
                        const kycUser = kycUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
                        
                        if (kycUser) {
                            user = {
                                id: kycUser.id || kycUser._id,
                                loginId: kycUser.loginId || kycUser.email,
                                email: kycUser.email,
                                name: kycUser.name || kycUser.firstName || 'User',
                                firstName: kycUser.firstName || 'User'
                            };
                            console.log('[WebsiteChat] ✅ Loaded user from KYC API:', user.id);
                        }
                    } catch (e) {
                        console.warn('[WebsiteChat] ⚠️ Could not fetch KYC data:', e.message);
                    }
                }
            }
            
            if (user) {
                const normalizedWebsiteUserId =
                    generateWebsiteUserIdFromEmail(user.email) ||
                    normalizeWebsiteUserId(user.loginId || user.id) ||
                    generateWebsiteUserIdFromBooking(user);
                user.loginId = normalizedWebsiteUserId;
                user.id = normalizedWebsiteUserId;
                try {
                    localStorage.setItem('user_id', normalizedWebsiteUserId);
                    const existingWebsiteUser = JSON.parse(localStorage.getItem('website_user') || '{}');
                    localStorage.setItem('website_user', JSON.stringify({ ...existingWebsiteUser, ...user, loginId: normalizedWebsiteUserId, id: normalizedWebsiteUserId }));
                } catch (_) {}

                currentUser = user;
                console.log('[WebsiteChat] ✅ User session loaded:', {
                    userId: currentUser.loginId,
                    name: currentUser.firstName || currentUser.name,
                    email: currentUser.email
                });
                connectChatSocket(currentUser.loginId, currentUser.firstName || currentUser.name || 'Website User');
                initWebsiteUserNotifications();
                loadChats();
            } else {
                console.error('[WebsiteChat] ❌ No user session found');
                alert('Please login to continue');
                window.location.href = 'signup';
            }
        }

        // Fetch owner name by owner ID
        async function fetchOwnerName(ownerId) {
            const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
                ? 'http://localhost:5001' 
                : 'https://api.roomhy.com';
            
            // Try multiple endpoints to get owner name
            const endpoints = [
                `${API_URL}/api/owners/${ownerId}`,
                `${API_URL}/api/owner/${ownerId}`,
                `${API_URL}/api/owners/login/${ownerId}`
            ];
            
            for (const endpoint of endpoints) {
                try {
                    console.log(`🔍 Trying endpoint: ${endpoint}`);
                    const response = await fetch(endpoint);
                    if (response.ok) {
                        const ownerData = await response.json();
                        // Owner model has fields like 'owner_name', 'firstName', 'name', 'email'
                        const name = ownerData.owner_name || ownerData.ownerName || ownerData.firstName || ownerData.name || ownerData.email;
                        if (name && name !== ownerId) {
                            console.log(`✅ Fetched owner name for ${ownerId}:`, name);
                            return name;
                        }
                    }
                } catch (e) {
                    console.log(`Endpoint ${endpoint} failed:`, e.message);
                }
            }
            
            // Also try to get from roomhy_owners_db in localStorage
            try {
                const db = JSON.parse(localStorage.getItem('roomhy_owners_db') || '{}');
                if (db[ownerId] && db[ownerId].profile) {
                    const name = db[ownerId].profile.name || db[ownerId].profile.ownerName || db[ownerId].profile.firstName;
                    if (name) {
                        console.log(`✅ Found owner name in localStorage for ${ownerId}:`, name);
                        return name;
                    }
                }
            } catch (e) {
                console.log('localStorage lookup failed:', e.message);
            }
            
            console.warn(`⚠️ Could not fetch owner name for ${ownerId}, using ID as fallback`);
            return ownerId; // Fallback to owner ID if name not found
        }

        // Fetch user's ACCEPTED bookings to build chat list
        async function loadChats() {
            if (!currentUser) return;
            const userId = currentUser.id || currentUser.loginId || localStorage.getItem('user_id');
            const userEmail = currentUser.email || localStorage.getItem('user_email');
            const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
                ? 'http://localhost:5001' 
                : 'https://api.roomhy.com';

            try {
                console.log('[WebsiteChat] 🔄 Loading accepted bookings and chats...');
                console.log('[WebsiteChat] Current user:', { userId, userEmail });
                
                // PRIMARY: Fetch bookings with accepted status from database
                let url = `${API_URL}/api/booking/requests`;
                
                // Try by user_id first, then email
                const identifiers = [];
                if (userId) identifiers.push({ key: 'user_id', value: userId });
                identifiers.push({ key: 'email', value: userEmail || userId || '' });
                
                // Build URL with all identifiers
                const idParams = identifiers.map(i => `${i.key}=${encodeURIComponent(i.value)}`).join('&');
                url += `?${idParams}`;
                
                console.log('[WebsiteChat] 📍 Fetching bookings from:', url);
                const response = await fetch(url);
                const result = await response.json();
                const allBookings = result.data || [];
                
                // Filter to ONLY show ACCEPTED bookings from database
                // These are bookings where owner has explicitly clicked 'Accept'
                const acceptedBookings = allBookings.filter(b => {
                    const status = (b.status || b.booking_status || b.request_status || '').toLowerCase();
                    // Only include truly accepted bookings
                    const isAccepted = ['accepted', 'accepted_by_owner', 'owner_accepted'].includes(status);
                    const isConfirmed = ['confirmed', 'confirm'].includes(status);
                    return isAccepted || isConfirmed || b.isAccepted === true;
                });
                
                console.log(`[WebsiteChat] 📊 Total bookings from DB: ${allBookings.length}, Accepted: ${acceptedBookings.length}`);
                console.log('[WebsiteChat] 💾 Accepted bookings:', acceptedBookings);

                // SECONDARY: Fetch chat rooms that owner created
                const backendChats = [];
                try {
                    const chatsResponse = await fetch(`${API_URL}/api/chat/rooms?user_email=${userEmail || userId}`);
                    if (chatsResponse.ok) {
                        const chatsResult = await chatsResponse.json();
                        const chats = chatsResult.data || chatsResult || [];
                        console.log('[WebsiteChat] 📥 Raw backend chats:', chats);
                        backendChats.push(...chats);
                        console.log('[WebsiteChat] 💬 Loaded', backendChats.length, 'chat rooms from backend');
                    }
                } catch (e) {
                    console.log('[WebsiteChat] ℹ️ Chat rooms endpoint not available:', e.message);
                }

                // TERTIARY: Load chats from localStorage (created locally)
                const localStorageChats = [];
                try {
                    const storedChatRooms = JSON.parse(localStorage.getItem('chatRooms') || '[]');
                    localStorageChats.push(...storedChatRooms);
                    console.log('[WebsiteChat] 💾 Loaded', storedChatRooms.length, 'chats from localStorage');
                } catch (e) {
                    console.log('[WebsiteChat] ℹ️ No chats in localStorage');
                }

                // Combine all sources: prioritize database accepted bookings
                const mergedChats = [...acceptedBookings, ...backendChats, ...localStorageChats];

                const chatList = document.getElementById('chat-list');
                chatList.innerHTML = '';

                if (mergedChats.length === 0) {
                    chatList.innerHTML = `<div class="p-8 text-center text-xs text-slate-400">
                        <div class="mb-2">📭 No accepted bookings yet</div>
                        <div class="text-[10px] leading-relaxed">Request a property and wait for the owner to accept your request.</div>
                    </div>`;
                    return;
                }

                // Deduplicate by owner ID/property
                const uniqueChats = [];
                const seenChats = new Set();
                
                // Process all merged chats
                for (const b of mergedChats) {
                    // Get owner identifier
                    const ownerId = b.owner_id || b.ownerLoginId || b.owner || b.owner_email;
                    const normalizedOwnerId = String(ownerId || '').trim().toUpperCase();
                    if (!isValidOwnerLoginId(normalizedOwnerId)) {
                        continue;
                    }
                    const chatKey = `${normalizedOwnerId}_${b.property_id || b.property_name || ''}`;
                    
                    if (chatKey && !seenChats.has(chatKey)) {
                        seenChats.add(chatKey);
                        
                        // Get owner name - try multiple field names
                        let ownerName = b.owner_name 
                            || b.ownerName 
                            || b.owner_contact?.name
                            || b.ownerContactName
                            || b.contactName
                            || b.participants?.[0]?.name
                            || b.userName;
                        
                        // If still no owner name, try to extract from booking_details if available
                        if (!ownerName && b.booking_details) {
                            ownerName = b.booking_details.owner_name 
                                || b.booking_details.ownerName 
                                || b.booking_details.name;
                        }
                        
                        // If still no owner name, try to extract from owner_contact object
                        if (!ownerName && b.owner_contact && typeof b.owner_contact === 'object') {
                            ownerName = b.owner_contact.name || b.owner_contact.fullName || b.owner_contact.contactName;
                        }
                        
                        // Get property name - try multiple field names
                        let propertyName = b.property_name 
                            || b.propertyName
                            || b.property?.name
                            || b.property?.title
                            || b.roomName
                            || b.room_name
                            || b.title;
                        
                        // If still no property name, try booking_details
                        if (!propertyName && b.booking_details) {
                            propertyName = b.booking_details.property_name 
                                || b.booking_details.propertyName 
                                || b.booking_details.title;
                        }
                        
                        // Get property ID - try multiple field names
                        let propertyId = b.property_id 
                            || b.propertyId
                            || b.property?._id
                            || b.property?.id
                            || b.roomId
                            || b.room_id
                            || '';
                        
                        // If still no property ID, try booking_details
                        if (!propertyId && b.booking_details) {
                            propertyId = b.booking_details.property_id 
                                || b.booking_details.propertyId 
                                || '';
                        }
                        
                        // Fetch owner name from API if still not available
                        if (!ownerName || ownerName === ownerId) {
                            try {
                                ownerName = await fetchOwnerName(ownerId);
                            } catch (e) {
                                console.warn('[WebsiteChat] Could not fetch owner name for:', ownerId, 'Using ID instead');
                                ownerName = ownerId || 'Property Owner';
                            }
                        }
                        
                        // Build complete chat object
                        const chat = {
                            _id: b._id || b.id || b.bookingId,
                            id: b._id || b.id || b.bookingId,
                            bookingId: b._id || b.id || b.bookingId,
                            user_id: b.user_id || b.signup_user_id || b.userLoginId || b.website_user_id || '',
                            signup_user_id: b.signup_user_id || b.user_id || b.userLoginId || b.website_user_id || '',
                            owner_name: ownerName && ownerName !== 'Property Owner' ? ownerName : 'Property Owner',
                            owner_id: normalizedOwnerId,
                            ownerLoginId: normalizedOwnerId,
                            owner_email: b.owner_email || '',
                            property_name: propertyName || 'Roomhy Property',
                            property_id: propertyId || '',
                            status: b.status || 'accepted',
                            acceptedAt: b.acceptedAt || b.responseDate || new Date().toISOString(),
                            chatRoomId: b._id || b.id || b.bookingId || `${userId}_${normalizedOwnerId}`,
                            timestamp: b.timestamp || b.acceptedAt || new Date().toISOString(),
                            rent: b.rent || b.property?.rent || '',
                            location: b.location || b.property?.location || ''
                        };
                        
                        console.log('[WebsiteChat] ✅ Chat prepared:', {
                            owner: chat.owner_name,
                            ownerId: chat.owner_id,
                            property: chat.property_name,
                            propertyId: chat.property_id,
                            status: chat.status
                        });
                        uniqueChats.push(chat);
                    }
                }
                
                // Render chat list
                if (uniqueChats.length === 0) {
                    chatList.innerHTML = `<div class="p-8 text-center text-xs text-slate-400">
                        <div class="mb-2">📭 No accepted bookings</div>
                        <div class="text-[10px] leading-relaxed">Your accepted bookings will appear here.</div>
                    </div>`;
                    return;
                }
                
                console.log(`[WebsiteChat] 🎯 Rendering ${uniqueChats.length} unique chats`);
                
                uniqueChats.forEach((chat, idx) => {
                    const item = document.createElement('div');
                    item.className = 'flex items-center gap-4 p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200 group';
                    
                    const ownerInitial = (chat.owner_name || 'O').charAt(0).toUpperCase();
                    const colors = ['bg-indigo-100', 'bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-pink-100'];
                    const colorIndex = (idx + ownerInitial.charCodeAt(0)) % colors.length;
                    const textColors = ['text-indigo-700', 'text-blue-700', 'text-green-700', 'text-purple-700', 'text-pink-700'];
                    const hoverBg = ['group-hover:bg-indigo-600', 'group-hover:bg-blue-600', 'group-hover:bg-green-600', 'group-hover:bg-purple-600', 'group-hover:bg-pink-600'];
                    
                    // Use property_id from the booking data for display
                    const propertyId = chat.property_id || 'N/A';
                    
                    item.innerHTML = `
                        <div class="w-14 h-14 rounded-full ${colors[colorIndex]} ${textColors[colorIndex]} flex items-center justify-center font-bold text-lg ${hoverBg[colorIndex]} group-hover:text-white transition-all flex-shrink-0">
                            ${ownerInitial}
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="text-base font-bold text-slate-900 truncate">${chat.owner_name || 'Property Owner'}</h4>
                            <p class="text-sm text-slate-500 uppercase font-semibold tracking-wide truncate">${chat.property_name || 'Roomhy Property'}</p>
                            <p class="text-xs text-slate-600 mt-1">✅ Accepted Booking</p>
                        </div>
                    `;
                    item.onclick = () => openChat(chat);
                    chatList.appendChild(item);
                });
                
                console.log('[WebsiteChat] ✅ Chat list loaded with', uniqueChats.length, 'chats');
            } catch (err) {
                console.error("[WebsiteChat] Error loading chats", err);
            }
        }

        function openChat(chat) {
            if (!isValidOwnerLoginId(chat?.owner_id || chat?.ownerLoginId)) {
                alert('Invalid owner ID format. Chat not allowed.');
                return;
            }
            currentChat = chat;
            document.getElementById('no-chat-selected').classList.add('hidden');
            document.getElementById('chat-active').classList.remove('hidden');
            
            // Display owner information clearly
            const ownerName = chat.owner_name || chat.ownerName || 'Property Owner';
            const ownerInitial = (ownerName || 'O').charAt(0).toUpperCase();
            
            console.log('[WebsiteChat] 📞 Opening chat with owner:', {
                name: ownerName,
                property: chat.property_name || 'N/A'
            });
            
            // Update header with owner name (primary display)
            document.getElementById('active-chat-name').textContent = ownerName;
            
            // Update subheader with owner ID and property (secondary display)
            const headerSubtext = document.getElementById('active-chat-id');
            headerSubtext.innerHTML = `<span class="text-[10px]">${chat.property_name || 'Property'}</span>`;
            
            // Update avatar with initial
            document.getElementById('active-chat-avatar').textContent = ownerInitial;
            
            // Update avatar background color based on owner initial
            const avatarEl = document.getElementById('active-chat-avatar');
            const colors = ['bg-indigo-100', 'bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-pink-100'];
            const colorIndex = ownerInitial.charCodeAt(0) % colors.length;
            const textColors = ['text-indigo-700', 'text-blue-700', 'text-green-700', 'text-purple-700', 'text-pink-700'];
            avatarEl.className = `w-12 h-12 rounded-full ${colors[colorIndex]} ${textColors[colorIndex]} flex items-center justify-center font-bold`;

            if (window.innerWidth < 768) {
                document.getElementById('contacts-panel').classList.add('hidden');
                document.getElementById('chat-canvas').classList.remove('hidden');
            }

            console.log('[WebsiteChat] ✅ Chat header updated - Owner: ' + ownerName);
            const activeWebsiteUserId = resolveWebsiteUserIdForChat(chat);
            if (activeWebsiteUserId) {
                connectChatSocket(activeWebsiteUserId, currentUser?.firstName || currentUser?.name || 'Website User');
            }
            updateMobileChatLayout();
            loadMessages();
        }

        async function loadMessages() {
            if (!currentChat || !currentUser) return;
            const ownerId = getActiveOwnerLoginId();
            const userId = resolveWebsiteUserIdForChat(currentChat);
            const messagesDiv = document.getElementById('messages');
            if (!ownerId || !userId || !messagesDiv) return;

            function normalizeBookingLink(rawLink) {
                try {
                    const defaultBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                        ? 'http://localhost:5001'
                        : 'https://api.roomhy.com';
                    const parsed = new URL(rawLink, defaultBase);

                    if (/booking-form\$/i.test(parsed.pathname)) {
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

            function formatMessageText(rawText) {
                const safe = String(rawText || '').replace(/\d{10,}/g, '***');
                const bookingLinkMatch = safe.match(/((?:https?:\/\/[^\s]*|\/)?(?:propertyowner\/)?booking-form\[^\s]*)/i);
                if (bookingLinkMatch) {
                    const link = normalizeBookingLink(bookingLinkMatch[1]);
                    return `<div class="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                        <p class="font-semibold text-indigo-700 text-xs sm:text-sm mb-2">Booking Form Ready</p>
                        <a href="${link}" target="_blank" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs sm:text-sm hover:bg-indigo-700">Open Booking Form</a>
                    </div>`;
                }
                return safe.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-blue-500 hover:text-blue-700 hover:underline">$1</a>');
            }

            try {
                const response = await fetch(`${API_URL}/api/chat/conversation?user1=${encodeURIComponent(userId)}&user2=${encodeURIComponent(ownerId)}`);
                const messages = response.ok ? await response.json() : [];
                messagesDiv.innerHTML = '';

                if (!Array.isArray(messages) || messages.length === 0) {
                    messagesDiv.innerHTML = '<div class="p-4 text-center text-xs text-slate-400">No messages yet. Start the conversation!</div>';
                    return;
                }

                messages.forEach((msg) => {
                    const isMine = String(msg.sender_login_id || '').trim().toLowerCase() === String(userId).toLowerCase();
                    const msgContainer = document.createElement('div');
                    msgContainer.className = `message-container flex w-full ${isMine ? 'justify-end' : 'justify-start'}`;
                    const timestamp = msg.created_at ? new Date(msg.created_at) : new Date();
                    const time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const messageText = formatMessageText(String(msg.message || ''));

                    msgContainer.innerHTML = `
                        <div class="message-bubble shadow-sm ${isMine ? 'sent' : 'received'}">
                            <p class="text-xs sm:text-sm leading-relaxed">${messageText}</p>
                            <div class="flex items-center justify-end gap-1 sm:gap-2 mt-1 sm:mt-2">
                                <span class="text-[7px] sm:text-[9px] opacity-60">${time}</span>
                            </div>
                        </div>
                    `;
                    messagesDiv.appendChild(msgContainer);
                });

                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            } catch (error) {
                console.error('[WebsiteChat] loadMessages error', error);
                messagesDiv.innerHTML = '<div class="p-4 text-center text-xs text-red-400">Error loading messages. Please try again.</div>';
            }
        }

        async function sendMessage() {
            const input = document.getElementById('message-text');
            const text = String(input?.value || '').trim();
            if (!text || !currentChat || !currentUser) return;

            const ownerId = getActiveOwnerLoginId();
            const userId = resolveWebsiteUserIdForChat(currentChat);
            if (!WEBSITE_USER_ID_REGEX.test(userId) || !isValidOwnerLoginId(ownerId)) {
                alert('Invalid chat participants.');
                return;
            }
            if (!socket || !socketReady) connectChatSocket(userId, currentUser.firstName || currentUser.name || 'Website User');
            if (/\d{10,}/.test(text)) {
                alert('Please do not share mobile numbers in chat.');
                return;
            }

            socket.emit('send_message', { to_login_id: ownerId, message: text });
            input.value = '';
            input.style.height = 'auto';
            setTimeout(loadMessages, 150);

            try {
                await fetch(`${API_URL}/api/notifications/chat-message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ownerId,
                        tenantName: currentUser.name || currentUser.firstName || 'Tenant',
                        message: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                        chatId: currentChat._id || currentChat.id || currentChat.bookingId || `${userId}_${ownerId}`
                    })
                });
            } catch (emailError) {
                console.error('Failed to send chat notification:', emailError);
            }
        }

        async function sendReaction(type) {
            if (!currentChat || !currentUser || !socket) return;
            const ownerId = getActiveOwnerLoginId();
            const emoji = type === 'like' ? 'LIKE' : 'DISLIKE';
            socket.emit('send_message', { to_login_id: ownerId, message: emoji });
            const decision = type === 'like' ? 'like' : 'reject';
            await updateChatDecision(decision, 'user');
            setTimeout(loadMessages, 150);
        }

        async function handleEdit() {
            alert('Edit is disabled for socket chat.');
        }

        async function handleDelete() {
            alert('Delete is disabled for socket chat.');
        }
        async function updateChatDecision(decision, userType) {
            if (!currentChat) return;
            
            const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
                ? 'http://localhost:5001' 
                : 'https://api.roomhy.com';
            const bookingId = currentChat._id || currentChat.id;
            const userId = currentUser?.loginId || currentUser?.id || 'user';
            
            try {
                const response = await fetch(`${API_URL}/api/booking/requests/${bookingId}/decision`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ decision, userType })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('Decision updated:', result);
                    
                    // If user liked, send booking form link
                    if (decision === 'like' && userType === 'user') {
                        // Create booking form link with bookingId and userId
                                                const bookingBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                                                    ? 'http://localhost:5001'
                                                    : 'https://api.roomhy.com';
                                                const bookingFormLink = `${bookingBase}/propertyowner/booking-form?bookingId=${bookingId}&userId=${userId}`;

                        // Save booking details to MongoDB
                        try {
                            const bookingPayload = {
                                _id: bookingId,
                                bookingId: bookingId,
                                userId: userId,
                                user_name: currentUser.name || currentUser.firstName || 'User',
                                user_phone: currentUser.phone || '',
                                user_email: currentUser.email || '',
                                property_id: currentChat._id,
                                property_name: currentChat.property_name || 'Property',
                                owner_id: currentChat.owner_id || currentChat.ownerId || '',
                                owner_name: currentChat.owner_name || 'Owner',
                                rent: currentChat.rent || 0,
                                createdAt: new Date().toISOString(),
                                status: 'accepted'
                            };

                            const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
                                ? 'http://localhost:5001' 
                                : 'https://api.roomhy.com';
                            
                            await fetch(`${API_URL}/api/bookings`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(bookingPayload)
                            });
                            console.log('✅ Booking saved to MongoDB');
                        } catch (dbErr) {
                            console.warn('Could not save booking to MongoDB:', dbErr);
                        }                        // Send booking link to owner chat via socket
                        const ownerId = getActiveOwnerLoginId();
                        if (socket && ownerId) {
                            socket.emit('send_message', {
                                to_login_id: ownerId,
                                message: `Great! Please complete your booking: ${bookingFormLink}`
                            });
                        }

                        alert('✅ Booking form link sent!');
                    }
                    
                    // If rejected, end chat
                    if (result.data && (result.data.owner_rejected || result.data.user_rejected)) {                        const ownerId = getActiveOwnerLoginId();
                        if (socket && ownerId) {
                            socket.emit('send_message', {
                                to_login_id: ownerId,
                                message: 'Chat has been closed as one party rejected the booking.'
                            });
                        }
                        
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

        // UI Helpers
        document.getElementById('back-btn').onclick = () => {
            currentChat = null;
            document.getElementById('contacts-panel').classList.remove('hidden');
            document.getElementById('chat-active').classList.add('hidden');
            document.getElementById('no-chat-selected').classList.remove('hidden');
            if (window.innerWidth < 768) {
                document.getElementById('chat-canvas').classList.add('hidden');
            }
        };

        document.getElementById('send-btn').onclick = sendMessage;
        document.getElementById('message-text').onkeypress = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
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
            sendReaction('like');
        }

        function showDislikePopup() {
            document.getElementById('dislike-popup').classList.add('active');
        }

        function closeDislikePopup() {
            document.getElementById('dislike-popup').classList.remove('active');
        }

        function confirmDislike() {
            closeDislikePopup();
            sendReaction('dislike');
        }

        // Close popups on background click
        document.getElementById('like-popup').onclick = function(e) {
            if (e.target === this) closeLikePopup();
        };

        document.getElementById('dislike-popup').onclick = function(e) {
            if (e.target === this) closeDislikePopup();
        };

        // Textarea height
        const tx = document.getElementById('message-text');
        tx.oninput = function() {
            this.style.height = "auto";
            this.style.height = (this.scrollHeight) + "px";
        };

        // UPDATE WELCOME MESSAGE WITH USER ID
        function updateWelcomeMessage() {
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

        function updateMobileChatLayout() {
            const contacts = document.getElementById('contacts-panel');
            const canvas = document.getElementById('chat-canvas');
            if (!contacts || !canvas) return;
            if (window.innerWidth < 768) {
                if (currentChat) {
                    contacts.classList.add('hidden');
                    canvas.classList.remove('hidden');
                } else {
                    contacts.classList.remove('hidden');
                    canvas.classList.add('hidden');
                }
            } else {
                contacts.classList.remove('hidden');
                canvas.classList.remove('hidden');
            }
        }
        
        // Logout function
        function logout() {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            sessionStorage.clear();
            window.location.href = 'tenantlogin';
        }
        
        // Call on page load
        updateWelcomeMessage();
        updateMobileChatLayout();
        window.addEventListener('resize', updateMobileChatLayout);
        loadUser();

