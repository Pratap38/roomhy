lucide.createIcons();
        
        // --- Auth Guard ---
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user || user.role !== 'owner') {
            window.location.href = '/propertyowner/ownerlogin';
        }
        
        const ownerId = user.ownerId || user.loginId;
        
        // --- Header Population ---
        document.addEventListener('DOMContentLoaded', () => {
            if (document.getElementById('headerName')) {
                document.getElementById('headerName').innerText = user.name;
            }
            if (document.getElementById('headerAvatar')) {
                document.getElementById('headerAvatar').innerText = user.name.charAt(0).toUpperCase();
            }
            if (document.getElementById('headerAccountId')) {
                document.getElementById('headerAccountId').innerText = `Account: ${user.loginId || user.ownerId}`;
            }
        });
        
        // --- Logout Handler ---
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = '/propertyowner/ownerlogin';
        });
        
        // --- Reusable Modal Logic (for profile dropdown) ---
        const openModal = (modalId) => {
            const modal = document.getElementById(modalId);
            const modalContent = modal.querySelector('.modal-content');
            modal.classList.remove('hidden', 'invisible');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modalContent.classList.remove('scale-95', 'opacity-0');
                modalContent.classList.add('scale-100', 'opacity-100');
            }, 10);
        };

        const closeModal = (modalId) => {
            const modal = document.getElementById(modalId);
            if (!modal) return;
            const modalContent = modal.querySelector('.modal-content');
            modalContent.classList.remove('scale-100', 'opacity-100');
            modalContent.classList.add('scale-95', 'opacity-0');
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden', 'invisible');
                const form = modal.querySelector('form');
                if (form) form.reset();
            }, 300);
        };

        // --- Add Event Listeners for Modal Buttons ---
        document.querySelectorAll('.close-modal-button, .cancel-modal-button').forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    closeModal(modal.id);
                }
            });
        });

        // Close modal when clicking overlay
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    closeModal(modal.id);
                }
            });
        });


        // --- Mobile Menu Toggle ---
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
        const closeMobileMenuButton = document.getElementById('close-mobile-menu');

        const openMobileMenu = () => mobileMenu.classList.remove('hidden');
        const closeMobileMenu = () => mobileMenu.classList.add('hidden');

        mobileMenuButton.addEventListener('click', openMobileMenu);
        closeMobileMenuButton.addEventListener('click', closeMobileMenu);
        mobileMenuOverlay.addEventListener('click', closeMobileMenu);
        mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobileMenu));

        // --- Profile Dropdown Toggle ---
        const profileButton = document.getElementById('profile-button');
        const profileDropdown = document.getElementById('profile-dropdown');

        profileButton.addEventListener('click', (event) => {
            event.stopPropagation(); 
            const isHidden = profileDropdown.classList.contains('hidden');
            if(isHidden) {
                profileDropdown.classList.remove('hidden', 'scale-95', 'opacity-0');
                profileDropdown.classList.add('scale-100', 'opacity-100');
            } else {
                 profileDropdown.classList.add('scale-95', 'opacity-0');
                 setTimeout(() => profileDropdown.classList.add('hidden'), 200); 
            }
        });

        document.addEventListener('click', (event) => {
            if (profileButton && !profileButton.contains(event.target) && profileDropdown && !profileDropdown.contains(event.target)) {
                 if(!profileDropdown.classList.contains('hidden')) {
                     profileDropdown.classList.add('scale-95', 'opacity-0');
                     setTimeout(() => profileDropdown.classList.add('hidden'), 200);
                 }
            }
        });
        
        
        // --- Filter Tabs Logic ---
        const filterTabs = document.querySelectorAll('.filter-tab');
        const recordRows = document.querySelectorAll('.record-row'); // Changed to record-row

        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update tab styles
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const filterValue = tab.dataset.filter;

                // Filter rows
                recordRows.forEach(row => {
                    if (filterValue === 'all') {
                        row.style.display = 'table-row'; // Show all
                    } else {
                        if (row.dataset.status === filterValue) {
                            row.style.display = 'table-row'; // Show matching
                        } else {
                            row.style.display = 'none'; // Hide non-matching
                        }
                    }
                });
            });
        });