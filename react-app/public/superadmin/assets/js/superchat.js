const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001' : 'https://api.roomhy.com';
        let socket = null;
        let superAdminLoginId = null;

        // Initialize
        document.addEventListener('DOMContentLoaded', async () => {
            const user = JSON.parse(localStorage.getItem('superadmin_user') || 'null');
            if (!user || !user.loginId) {
                // Allow for demo/testing - generate a default super admin ID
                superAdminLoginId = 'superadmin_system';
                console.warn('?? No super admin user found, using demo ID');
            } else {
                superAdminLoginId = user.loginId;
            }

            console.log('? Super Admin initialized:', superAdminLoginId);

            initSocket();
            loadAllMessages();
            setupAutoRefresh();
            lucide.createIcons();
        });

        // Initialize Socket.IO
        function initSocket() {
            socket = io(API_URL, {
                transports: ['websocket'],
                upgrade: false
            });

            socket.on('connect', () => {
                console.log('? Connected to chat');
                updateStatus('Connected', 'green');
                socket.emit('join_room', {
                    login_id: superAdminLoginId,
                    role: 'superadmin',
                    name: 'Super Admin System'
                });
            });

            socket.on('receive_message', (msg) => {
                console.log('?? New message received:', msg);
                displayMessage(msg);
            });

            socket.on('disconnect', () => {
                console.log('Disconnected');
                updateStatus('Disconnected', 'red');
            });

            socket.on('error', (data) => {
                console.error('Socket error:', data);
                updateStatus('Error', 'red');
            });
        }

        // Load all messages from database
        async function loadAllMessages() {
            try {
                const response = await fetch(`${API_URL}/api/chat/messages/all`, {
                    headers: { 'X-Admin': 'true' }
                });

                let messages = [];
                if (response.status === 404) {
                    // Fallback: load from multiple rooms
                    console.log('Loading messages from all known rooms...');
                    messages = await loadMessagesFromAllRooms();
                } else if (response.ok) {
                    messages = await response.json();
                }

                document.getElementById('messagesContainer').innerHTML = '';

                if (!messages || messages.length === 0) {
                    document.getElementById('messagesContainer').innerHTML = `
                        <div class="text-center text-gray-400 py-16">
                            <i data-lucide="inbox" class="w-16 h-16 mx-auto mb-4 opacity-30"></i>
                            <p class="text-lg font-medium">No messages in system</p>
                            <p class="text-sm mt-2">Messages will appear here as users communicate</p>
                        </div>
                    `;
                    return;
                }

                // Sort messages by timestamp (newest first)
                messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                // Display each message
                messages.forEach(msg => displayMessage(msg));
                console.log(`? Loaded ${messages.length} messages`);
            } catch (error) {
                console.error('Error loading messages:', error);
                document.getElementById('messagesContainer').innerHTML = `
                    <div class="text-center text-red-400 py-16">
                        <i data-lucide="alert-circle" class="w-16 h-16 mx-auto mb-4"></i>
                        <p class="text-lg font-medium">Error loading messages</p>
                        <p class="text-sm mt-2">${error.message}</p>
                    </div>
                `;
            }
        }

        // Fallback: Load messages from known room patterns
        async function loadMessagesFromAllRooms() {
            const rooms = [
                'owner_1', 'owner_2', 'owner_3',
                'tenant_apt101_1', 'tenant_apt102_1',
                'areamanager_zone1', 'areamanager_zone2',
                'web_user_guest', 'web_user_visitor',
                'superadmin_system'
            ];

            let allMessages = [];

            for (const room of rooms) {
                try {
                    const response = await fetch(`${API_URL}/api/chat/messages/${room}`);
                    if (response.ok) {
                        const messages = await response.json();
                        allMessages = allMessages.concat(messages);
                    }
                } catch (error) {
                    console.log(`Could not load from room: ${room}`);
                }
            }

            return allMessages;
        }

        // Display message in timeline
        function displayMessage(msg) {
            const container = document.getElementById('messagesContainer');

            // Clear placeholder if it exists
            const placeholder = container.querySelector('[data-lucide="inbox"]');
            if (placeholder) {
                container.innerHTML = '';
            }

            const div = document.createElement('div');
            div.className = 'bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition';
            div.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="font-semibold text-gray-900">${msg.sender_name || 'Unknown'}</p>
                        <p class="text-xs text-gray-500">
                            <span class="inline-block px-2 py-1 bg-gray-100 rounded mr-2">${msg.sender_role || 'user'}</span>
                            To: ${msg.room_id || 'unknown'}
                        </p>
                    </div>
                    <p class="text-xs text-gray-400">${new Date(msg.created_at).toLocaleString()}</p>
                </div>
                <div class="bg-gray-50 rounded p-3 text-sm text-gray-700 break-words">
                    ${escapeHtml(msg.message || '')}
                </div>
                <div class="flex justify-between items-center mt-2 text-xs text-gray-400">
                    <span>ID: ${msg._id ? msg._id.toString().substring(0, 12) : 'N/A'}</span>
                    <span>${msg.is_read ? '? Read' : '? Unread'}</span>
                </div>
            `;

            container.appendChild(div);
        }

        // Auto-refresh messages every 5 seconds
        function setupAutoRefresh() {
            setInterval(loadAllMessages, 5000);
        }

        // Utilities
        function updateStatus(text, color) {
            const colorClass = {
                green: 'bg-green-500',
                yellow: 'bg-yellow-500',
                red: 'bg-red-500'
            };

            document.getElementById('statusDot').className = `w-2 h-2 rounded-full ${colorClass[color]}`;
            document.getElementById('connectionStatus').querySelector('p').textContent = text;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        }

        function logout() {
            localStorage.removeItem('superadmin_user');
            window.location.href = '/propertyowner/ownerlogin';
        }

        // Mobile menu functionality
        function toggleMobileMenu() {
            const mobileSidebar = document.getElementById('mobile-sidebar');
            const mobileOverlay = document.getElementById('mobile-sidebar-overlay');
            
            if (mobileSidebar && mobileOverlay) {
                const isHidden = mobileSidebar.classList.contains('-translate-x-full') || 
                               mobileSidebar.classList.contains('hidden');
                
                if (isHidden) {
                    mobileSidebar.classList.remove('-translate-x-full');
                    mobileSidebar.classList.remove('hidden');
                    mobileOverlay.classList.remove('hidden');
                    document.body.style.overflow = 'hidden';
                } else {
                    mobileSidebar.classList.add('-translate-x-full');
                    mobileOverlay.classList.add('hidden');
                    document.body.style.overflow = '';
                }
            }
                mobileSidebar.classList.add('hidden');
                mobileSidebar.classList.remove('fixed', 'inset-y-0', 'left-0');
                mobileOverlay.classList.add('hidden');
            }
        }

        document.getElementById('mobile-menu-open').addEventListener('click', toggleMobileMenu);
