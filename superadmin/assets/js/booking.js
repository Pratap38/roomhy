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