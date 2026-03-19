// Initialize notification system when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize notification manager
            window.superAdminNotificationManager = new SuperAdminNotificationManager();
            
            // Request notification permission
            window.superAdminNotificationManager.requestNotificationPermission().then(granted => {
                if (granted) {
                    console.log('✅ Notification permission granted');
                }
            });
            
            // Start polling for notifications
            window.superAdminNotificationManager.startPolling();
            
            // Setup notification bell click handler
            const bellBtn = document.getElementById('notificationBellBtn');
            const dropdown = document.getElementById('notificationDropdown');
            
            if (bellBtn && dropdown) {
                bellBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('hidden');
                });
                
                // Close dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    if (!dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
                        dropdown.classList.add('hidden');
                    }
                });
            }
            
            // Register callbacks for different notification types
            window.superAdminNotificationManager.onNotification('new_booking', (data) => {
                console.log('📅 New booking received:', data);
            });
            
            window.superAdminNotificationManager.onNotification('new_enquiry', (data) => {
                console.log('❓ New enquiry received:', data);
            });
        });
        
        // Global functions for notification actions
        function markAllRead() {
            if (window.superAdminNotificationManager) {
                window.superAdminNotificationManager.markAllAsRead();
            }
        }
        
        function clearAll() {
            if (window.superAdminNotificationManager) {
                window.superAdminNotificationManager.clearAll();
            }
        }
        
        // Request notification permission manually
        function requestNotificationPermission() {
            if (window.superAdminNotificationManager) {
                window.superAdminNotificationManager.requestNotificationPermission().then(granted => {
                    if (granted) {
                        alert('✅ Browser notifications enabled.');
                    } else {
                        if (!('Notification' in window)) {
                            alert('This browser does not support system notifications. In-page popup and sound will still work.');
                            return;
                        }
                        if (Notification.permission === 'denied') {
                            alert('Browser notifications are blocked. Enable notifications for this site in browser settings. In-page popup and sound are still active.');
                            return;
                        }
                        alert('Notification permission not granted. In-page popup and sound are still active.');
                    }
                });
            }
        }