// Website Notification System
// Handles in-app notifications and email notifications for users

const NOTIFICATION_SERVICE = {
    // Check for new booking accept notifications
    async checkBookingAcceptance() {
        try {
            const userId = localStorage.getItem('websiteUserId') || sessionStorage.getItem('userId');
            if (!userId) return;

            const API_URL = window.API_URL || 'https://api.roomhy.com';
            const response = await fetch(`${API_URL}/api/website-enquiry/booking-status/${userId}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.acceptedBookings && data.acceptedBookings.length > 0) {
                    // Process each newly accepted booking
                    for (const booking of data.acceptedBookings) {
                        if (!localStorage.getItem(`notified_booking_${booking.id}`)) {
                            // Send notification
                            this.addNotification(
                                'Booking Accepted! 🎉',
                                `Your booking for ${booking.propertyName} has been accepted`,
                                'booking_accept',
                                booking.id,
                                'mystays'
                            );

                            // Mark as notified
                            localStorage.setItem(`notified_booking_${booking.id}`, 'true');
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error checking booking acceptance:', err);
        }
    },

    // Check for new chat messages
    async checkNewMessages() {
        try {
            const userId = localStorage.getItem('websiteUserId') || sessionStorage.getItem('userId');
            if (!userId) return;

            const API_URL = window.API_URL || 'https://api.roomhy.com';
            const response = await fetch(`${API_URL}/api/chat/unread/${userId}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.unreadCount && data.unreadCount > 0) {
                    // Get the latest message
                    const latestMessage = data.messages?.[0];
                    if (latestMessage && !localStorage.getItem(`notified_msg_${latestMessage.id}`)) {
                        this.addNotification(
                            `New Message from ${latestMessage.senderName}`,
                            latestMessage.preview || 'You have a new message',
                            'new_message',
                            latestMessage.id,
                            'websitechat'
                        );

                        localStorage.setItem(`notified_msg_${latestMessage.id}`, 'true');
                    }
                }
            }
        } catch (err) {
            console.error('Error checking new messages:', err);
        }
    },

    // Add notification to the notification list
    async addNotification(title, message, type, relatedId, actionUrl) {
        try {
            const userId = localStorage.getItem('websiteUserId') || sessionStorage.getItem('userId');
            if (!userId) return;

            const API_URL = window.API_URL || 'https://api.roomhy.com';
            
            const response = await fetch(`${API_URL}/api/notifications/website/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    title,
                    message,
                    type,
                    relatedId,
                    actionUrl
                })
            });

            if (response.ok) {
                // Show toast notification
                this.showToast(title, message, 'info');
                // Reload notifications in header
                if (typeof loadNotifications === 'function') {
                    loadNotifications();
                }
            }
        } catch (err) {
            console.error('Error adding notification:', err);
        }
    },

    // Show toast notification
    showToast(title, message, type = 'info') {
        try {
            const toast = document.createElement('div');
            toast.className = 'fixed z-50 right-6 bottom-6 max-w-sm px-6 py-4 rounded-lg shadow-lg text-white';
            
            // Set background based on type
            if (type === 'success') {
                toast.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            } else if (type === 'error') {
                toast.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            } else {
                toast.style.background = 'linear-gradient(135deg, #3b82f6, #06b6d4)';
            }

            toast.innerHTML = `
                <div class="font-semibold text-lg">${title}</div>
                <div class="text-sm opacity-90">${message}</div>
            `;

            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            toast.style.transition = 'all 0.3s ease';
            
            document.body.appendChild(toast);
            
            // Animate in
            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            });

            // Auto-remove after 5 seconds
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(20px)';
                setTimeout(() => toast.remove(), 300);
            }, 5000);
        } catch (err) {
            console.warn('Toast failed', err);
        }
    },

    // Initialize polling for notifications
    startPolling(interval = 30000) {
        console.log('🔔 Notification system started (polling every ' + interval / 1000 + 's)');
        
        // Check immediately
        this.checkBookingAcceptance();
        this.checkNewMessages();

        // Then set up polling
        setInterval(() => {
            this.checkBookingAcceptance();
            this.checkNewMessages();
        }, interval);
    }
};

// Start the notification system when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        NOTIFICATION_SERVICE.startPolling(30000); // Poll every 30 seconds
    });
} else {
    NOTIFICATION_SERVICE.startPolling(30000);
}

// Expose globally for manual triggers
window.NOTIFICATION_SERVICE = NOTIFICATION_SERVICE;

