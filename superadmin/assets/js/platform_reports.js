lucide.createIcons();

        // Sidebar Logic
        function toggleSubmenu(id, element) {
            const submenu = document.getElementById(id);
            const chevron = element.querySelector('.lucide-chevron-down');
            if (submenu.classList.contains('open')) {
                submenu.classList.remove('open');
                chevron.style.transform = 'rotate(0deg)';
            } else {
                submenu.classList.add('open');
                chevron.style.transform = 'rotate(180deg)';
            }
        }

        // Mobile Menu
        function toggleMobileMenu() {
            const mobileSidebar = document.getElementById('mobile-sidebar');
            const mobileOverlay = document.getElementById('mobile-sidebar-overlay');
            const isClosed = mobileSidebar.classList.contains('-translate-x-full');
            
            if (isClosed) {
                mobileSidebar.classList.remove('-translate-x-full');
                mobileOverlay.classList.remove('hidden');
            } else {
                mobileSidebar.classList.add('-translate-x-full');
                mobileOverlay.classList.add('hidden');
            }
        }
        document.getElementById('mobile-menu-open').addEventListener('click', toggleMobileMenu);