/**
 * PropertyOwnerNotifications.js
 * Universal notification system for property owner panel pages
 * Integrates with NotificationManager to show notifications on any page
 */

class PropertyOwnerNotifications {
    constructor() {
        this.notificationManager = null;
        this.init();
    }

    /**
     * Initialize the notification system on the current page
     */
    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        } catch (e) {
            console.warn('⚠️ Notification initialization error:', e.message);
        }
    }

    /**
     * Setup notification system
     */
    setup() {
        try {
            // Initialize NotificationManager if available
            if (typeof NotificationManager !== 'undefined') {
                this.notificationManager = new NotificationManager();
                
                // Request notification permission
                this.notificationManager.requestNotificationPermission().then(granted => {
                    if (granted) {
                        console.log('✅ Notification permission granted');
                    }
                });

                // Register callbacks and start polling even if browser notification
                // permission is blocked; sound + in-app dropdown should still work.
                this.registerCallbacks();
                this.notificationManager.startPolling();
            } else {
                console.warn('NotificationManager not loaded');
            }

            // Setup notification bell UI
            this.setupNotificationBell();

            // Setup notification dropdown
            this.setupNotificationDropdown();

        } catch (e) {
            console.warn('Setup error:', e.message);
        }
    }

    /**
     * Register callbacks for different notification types
     */
    registerCallbacks() {
        if (!this.notificationManager) return;

        this.notificationManager.onNotification('bookingRequests', (data) => {
            this.showNotification('New Booking Request 🎉', 'booking', data);
        });

        this.notificationManager.onNotification('chatMessages', (data) => {
            this.showNotification('New Chat Message 💬', 'chat', data);
        });

        this.notificationManager.onNotification('complaints', (data) => {
            this.showNotification('New Complaint ⚠️', 'complaint', data);
        });

        // New notification types
        this.notificationManager.onNotification('owner_new_booking_request', (data) => {
            this.showNotification('📅 New Booking Request', 'booking', data);
        });

        this.notificationManager.onNotification('owner_new_chat', (data) => {
            this.showNotification('💬 New Chat Message', 'chat', data);
        });

        this.notificationManager.onNotification('owner_new_bidding', (data) => {
            this.showNotification('💰 New Bid Received', 'bidding', data);
        });
    }

    /**
     * Show notification in dropdown and UI
     */
    showNotification(title, type, data) {
        console.log(`📢 ${title}`, data);

        // Play sound
        if (this.notificationManager) {
            this.notificationManager.playSound();
            this.notificationManager.showBrowserNotification(title, {
                body: this.getNotificationBody(type, data),
                tag: `${type}-${Date.now()}`
            });
        }

        // Update dropdown
        this.addNotificationToDropdown(title, type, data);

        // Update badge
        this.updateNotificationBadge();
    }

    /**
     * Get notification body text based on type
     */
    getNotificationBody(type, data) {
        switch(type) {
            case 'booking':
                return `From: ${data?.senderName || 'Someone'} - Property: ${data?.propertyName || 'Unknown'}`;
            case 'chat':
                return `From: ${data?.senderName || 'Someone'}: ${data?.message?.substring(0, 50) || '...'}`;
            case 'complaint':
                return `Priority: ${data?.priority || 'Medium'} - ${data?.issue || 'New complaint'}`;
            case 'bidding':
                return `${data?.bidderName || 'Bidder'} offered ₹${data?.bidAmount || '0'} for ${data?.propertyName || 'property'}`;
            default:
                return 'New notification';
        }
    }

    /**
     * Add notification to dropdown list
     */
    addNotificationToDropdown(title, type, data) {
        const notificationList = document.getElementById('notificationList');
        if (!notificationList) return;

        const timestamp = new Date().toLocaleTimeString();
        const notificationHTML = `
            <div class="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0">
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 mt-1">
                        ${this.getNotificationIcon(type)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-gray-900">${title}</p>
                        <p class="text-xs text-gray-600 mt-1">${this.getNotificationBody(type, data)}</p>
                        <p class="text-xs text-gray-400 mt-2">${timestamp}</p>
                    </div>
                </div>
            </div>
        `;

        // Add to top of list
        const emptyState = notificationList.querySelector('.px-4.py-8');
        if (emptyState) {
            emptyState.remove();
        }

        notificationList.insertAdjacentHTML('afterbegin', notificationHTML);

        // Keep only last 20 notifications
        const notifications = notificationList.querySelectorAll('[class*="border-b"]');
        if (notifications.length > 20) {
            notifications[notifications.length - 1].remove();
        }

        lucide.createIcons();
    }

    /**
     * Get icon HTML for notification type
     */
    getNotificationIcon(type) {
        const icons = {
            booking: '<i data-lucide="calendar-check" class="w-5 h-5 text-blue-500"></i>',
            chat: '<i data-lucide="message-circle" class="w-5 h-5 text-green-500"></i>',
            complaint: '<i data-lucide="alert-circle" class="w-5 h-5 text-red-500"></i>',
            bidding: '<i data-lucide="trending-up" class="w-5 h-5 text-green-500"></i>'
        };
        return icons[type] || icons.booking;
    }

    /**
     * Setup notification bell button
     */
    setupNotificationBell() {
        const bellBtn = document.getElementById('notificationBellBtn');
        if (!bellBtn) return;

        bellBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('notificationDropdown');
            if (dropdown) {
                dropdown.classList.toggle('hidden');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notificationDropdown');
            if (dropdown && !dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }

    /**
     * Setup notification dropdown
     */
    setupNotificationDropdown() {
        const settingsBtn = document.getElementById('notificationSettingsBtn');
        if (!settingsBtn) return;

        settingsBtn.addEventListener('click', () => {
            const counts = this.notificationManager?.getUnreadCounts() || {};
            alert(`🔔 Notification Settings\n\nBooking Requests: ${counts.bookingRequests || 0}\nChat Messages: ${counts.chatMessages || 0}\nComplaints: ${counts.complaints || 0}\n\n✅ Sound: Enabled\n✅ Email: Enabled\n✅ Browser: Enabled\n\nNotifications check every 5 seconds`);
        });
    }

    /**
     * Update notification badge count
     */
    updateNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        if (!badge || !this.notificationManager) return;

        const counts = this.notificationManager.getUnreadCounts();
        const totalUnread = counts.bookingRequests + counts.chatMessages + counts.complaints;

        if (totalUnread > 0) {
            badge.textContent = totalUnread;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    /**
     * Get unread count
     */
    getUnreadCount() {
        if (!this.notificationManager) return 0;
        const counts = this.notificationManager.getUnreadCounts();
        return counts.bookingRequests + counts.chatMessages + counts.complaints;
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        const notificationList = document.getElementById('notificationList');
        if (notificationList) {
            notificationList.innerHTML = `
                <div class="px-4 py-8 text-center text-gray-500 text-sm">
                    <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                    <p>No notifications yet</p>
                </div>
            `;
        }
        this.updateNotificationBadge();
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        try {
            const response = await fetch(`${this.notificationManager?.API_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5001' : 'https://api.roomhy.com')}/api/notifications/mark-all-read`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toLoginId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).loginId : '', toRole: 'owner' })
            });
            
            if (response.ok) {
                this.updateNotificationBadge();
                // Remove read indicators from dropdown
                document.querySelectorAll('#notificationList .bg-purple-500').forEach(el => el.remove());
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }
}

// Auto-initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.propertyOwnerNotifications = new PropertyOwnerNotifications();
    });
} else {
    window.propertyOwnerNotifications = new PropertyOwnerNotifications();
}
