/**
 * SuperAdminNotificationManager.js
 * Handles panel-to-panel notifications with sound and email for Super Admin
 * Supports: New Booking, New Enquiry
 */

class SuperAdminNotificationManager {
    constructor() {
        this.API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:5001'
            : 'https://roomhy-backend-wqwo.onrender.com';
        
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.notificationSound = null;
        this.pollingInterval = null;
        this.pollingFrequency = 5000; // 5 seconds
        this.unreadCount = 0;
        this.notifications = [];
        this.notificationCallbacks = {};
        
        // Initialize audio context early
        this.initializeAudioContext();
        
        // Add page interaction listener to enable audio
        document.addEventListener('click', () => this.resumeAudioContext(), { once: true });
    }
    
    /**
     * Initialize audio context for notification sound
     */
    initializeAudioContext() {
        try {
            this.notificationSound = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🎵 Audio context initialized for SuperAdmin');
        } catch (e) {
            console.warn('Could not initialize audio context:', e.message);
        }
    }
    
    /**
     * Resume audio context (handles browser autoplay restrictions)
     */
    resumeAudioContext() {
        try {
            if (!this.notificationSound) {
                this.notificationSound = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            if (this.notificationSound.state === 'suspended') {
                this.notificationSound.resume().then(() => {
                    console.log('✅ Audio context resumed');
                }).catch(e => {
                    console.warn('Could not resume audio context:', e.message);
                });
            }
        } catch (e) {
            console.warn('Audio context resume failed:', e.message);
        }
    }
    
    /**
     * Play notification sound
     */
    playSound() {
        console.log('🔔 Playing notification sound...');
        this.resumeAudioContext();
        
        // Play sound sequence 3 times for emphasis
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.playSoundDirect(), i * 400);
        }
    }
    
    /**
     * Play sound using Web Audio API
     */
    playSoundDirect() {
        try {
            if (!this.notificationSound) {
                this.notificationSound = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const ctx = this.notificationSound;
            const now = ctx.currentTime;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            // Configuration - bell-like sound
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);
            
            gain.gain.setValueAtTime(0.8, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            
            osc.start(now);
            osc.stop(now + 0.3);
            
            console.log('✅ Sound played successfully');
        } catch (e) {
            console.warn('Web Audio failed:', e.message);
        }
    }
    
    /**
     * Request browser notification permission
     */
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('Browser does not support notifications');
            return false;
        }
        
        // Check current permission status
        if (Notification.permission === 'granted') {
            return true;
        }
        
        // If permission was denied before, show info
        if (Notification.permission === 'denied') {
            console.warn('Notification permission was denied. User must enable in browser settings.');
            return false;
        }
        
        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (e) {
            console.warn('Notification permission error:', e.message);
            return false;
        }
    }
    
    /**
     * Show browser notification
     */
    showBrowserNotification(title, options) {
        if (Notification.permission === 'granted') {
            try {
                const notification = new Notification(title, {
                    body: options.body || '',
                    icon: options.icon || '/favicon.ico',
                    tag: options.tag || 'notification',
                    requireInteraction: true
                });
                
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
                
                setTimeout(() => notification.close(), 5000);
            } catch (e) {
                console.warn('Browser notification failed:', e.message);
            }
        }
    }
    
    /**
     * Start polling for notifications
     */
    startPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        // Initial fetch
        this.fetchNotifications();
        
        // Set up polling
        this.pollingInterval = setInterval(() => {
            this.fetchNotifications();
        }, this.pollingFrequency);
        
        console.log('🔄 Started polling for notifications');
    }
    
    /**
     * Stop polling
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
    
    /**
     * Fetch notifications from server
     */
    async fetchNotifications() {
        try {
            const response = await fetch(`${this.API_URL}/api/notifications?unread=true&toLoginId=superadmin`);
            const data = await response.json();
            
            if (data.success && Array.isArray(data)) {
                const newCount = data.length;
                
                if (newCount > this.unreadCount) {
                    // New notifications received
                    const newNotifs = data.slice(0, newCount - this.unreadCount);
                    newNotifs.forEach(notification => {
                        this.handleNewNotification(notification);
                    });
                    
                    // Play sound and show notification
                    this.playSound();
                    this.showBrowserNotification('New Notification', {
                        body: `You have ${newCount} unread notification(s)`
                    });
                }
                
                this.unreadCount = newCount;
                this.notifications = data;
                this.updateBellBadge();
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }
    
    /**
     * Handle new notification
     */
    handleNewNotification(notification) {
        console.log('📢 New notification:', notification);
        
        // Trigger callbacks
        if (this.notificationCallbacks[notification.type]) {
            this.notificationCallbacks[notification.type](notification);
        }
        
        // Also trigger generic callback
        if (this.notificationCallbacks['*']) {
            this.notificationCallbacks['*'](notification);
        }
        
        // Add to dropdown
        this.addNotificationToDropdown(notification);
    }
    
    /**
     * Register callback for notification type
     */
    onNotification(type, callback) {
        this.notificationCallbacks[type] = callback;
    }
    
    /**
     * Update bell badge count
     */
    updateBellBadge() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }
    
    /**
     * Add notification to dropdown list
     */
    addNotificationToDropdown(notification) {
        const notificationList = document.getElementById('notificationList');
        if (!notificationList) return;
        
        const timestamp = new Date(notification.createdAt).toLocaleString();
        const icon = this.getNotificationIcon(notification.type);
        const title = this.getNotificationTitle(notification.type);
        const body = this.getNotificationBody(notification);
        
        const notificationHTML = `
            <div class="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0" data-id="${notification._id}">
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 mt-1">
                        ${icon}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-gray-900">${title}</p>
                        <p class="text-xs text-gray-600 mt-1">${body}</p>
                        <p class="text-xs text-gray-400 mt-2">${timestamp}</p>
                    </div>
                    ${!notification.read ? '<span class="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full"></span>' : ''}
                </div>
            </div>
        `;
        
        // Remove empty state if exists
        const emptyState = notificationList.querySelector('.px-4.py-8');
        if (emptyState) {
            emptyState.remove();
        }
        
        notificationList.insertAdjacentHTML('afterbegin', notificationHTML);
        lucide.createIcons();
        
        // Keep only last 20 notifications
        const items = notificationList.querySelectorAll('[class*="border-b"]');
        if (items.length > 20) {
            items[items.length - 1].remove();
        }
    }
    
    /**
     * Get icon for notification type
     */
    getNotificationIcon(type) {
        const icons = {
            'new_booking': '<i data-lucide="calendar-check" class="w-5 h-5 text-blue-500"></i>',
            'new_enquiry': '<i data-lucide="help-circle" class="w-5 h-5 text-green-500"></i>',
            'owner_new_booking_request': '<i data-lucide="briefcase" class="w-5 h-5 text-purple-500"></i>',
            'owner_new_chat': '<i data-lucide="message-circle" class="w-5 h-5 text-blue-500"></i>',
            'owner_new_bidding': '<i data-lucide="trending-up" class="w-5 h-5 text-green-500"></i>'
        };
        return icons[type] || '<i data-lucide="bell" class="w-5 h-5 text-gray-500"></i>';
    }
    
    /**
     * Get title for notification type
     */
    getNotificationTitle(type) {
        const titles = {
            'new_booking': '📅 New Booking',
            'new_enquiry': '❓ New Enquiry',
            'owner_new_booking_request': '📋 New Booking Request',
            'owner_new_chat': '💬 New Chat Message',
            'owner_new_bidding': '💰 New Bid Received'
        };
        return titles[type] || '🔔 Notification';
    }
    
    /**
     * Get body text for notification
     */
    getNotificationBody(notification) {
        const meta = notification.meta || {};
        
        switch (notification.type) {
            case 'new_booking':
                return `Property: ${meta.propertyName || 'Unknown'} | Guest: ${meta.guestName || 'Unknown'}`;
            case 'new_enquiry':
                return `${meta.userName || 'Someone'} enquired about ${meta.propertyName || 'a property'}`;
            case 'owner_new_booking_request':
                return `${meta.guestName || 'Guest'} requested booking for ${meta.propertyName || 'your property'}`;
            case 'owner_new_chat':
                return `${meta.senderName || 'Someone'}: ${(meta.message || '').substring(0, 50)}`;
            case 'owner_new_bidding':
                return `${meta.bidderName || 'Bidder'} offered ₹${meta.bidAmount || '0'} for ${meta.propertyName || 'property'}`;
            default:
                return notification.from || 'New notification';
        }
    }
    
    /**
     * Mark notification as read
     */
    async markAsRead(notificationId) {
        try {
            await fetch(`${this.API_URL}/api/notifications/${notificationId}/read`, {
                method: 'PUT'
            });
            
            const element = document.querySelector(`[data-id="${notificationId}"]`);
            if (element) {
                element.querySelector('.bg-purple-500')?.remove();
            }
            
            this.unreadCount = Math.max(0, this.unreadCount - 1);
            this.updateBellBadge();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }
    
    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        try {
            await fetch(`${this.API_URL}/api/notifications/mark-all-read`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toLoginId: 'superadmin', toRole: 'superadmin' })
            });
            
            this.unreadCount = 0;
            this.notifications.forEach(n => n.read = true);
            this.updateBellBadge();
            
            // Remove read indicators from dropdown
            document.querySelectorAll('#notificationList .bg-purple-500').forEach(el => el.remove());
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }
    
    /**
     * Clear all notifications
     */
    async clearAll() {
        try {
            await fetch(`${this.API_URL}/api/notifications/delete-read?toLoginId=superadmin`, {
                method: 'DELETE'
            });
            
            const notificationList = document.getElementById('notificationList');
            if (notificationList) {
                notificationList.innerHTML = `
                    <div class="px-4 py-8 text-center text-gray-400">
                        <i data-lucide="bell-off" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                        <p>No notifications yet</p>
                    </div>
                `;
                lucide.createIcons();
            }
            
            this.unreadCount = 0;
            this.notifications = [];
            this.updateBellBadge();
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    }
}

// Global instance
window.superAdminNotificationManager = null;
