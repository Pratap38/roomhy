const initSuperAdminEnquiry = () => {
            window.superAdminNotificationManager = new SuperAdminNotificationManager();
            window.superAdminNotificationManager.requestNotificationPermission();
            window.superAdminNotificationManager.startPolling();

            const bellBtn = document.getElementById('notificationBellBtn');
            const dropdown = document.getElementById('notificationDropdown');
            if (bellBtn && dropdown) {
                bellBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('hidden');
                });
                document.addEventListener('click', (e) => {
                    if (!dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
                        dropdown.classList.add('hidden');
                    }
                });
            }
        };

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSuperAdminEnquiry);
} else {
    initSuperAdminEnquiry();
}

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
