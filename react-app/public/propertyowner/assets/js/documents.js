// --- Auth Guard ---
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user || user.role !== 'owner') {
            window.location.href = '/propertyowner/ownerlogin';
        }
        
        const ownerId = user.ownerId || user.loginId;
        
        // --- Header Population & Logout ---
        document.addEventListener("DOMContentLoaded", function() {
            lucide.createIcons();
            if (document.getElementById('headerName')) {
                document.getElementById('headerName').innerText = user.name;
            }
            if (document.getElementById('headerAvatar')) {
                document.getElementById('headerAvatar').innerText = user.name.charAt(0).toUpperCase();
            }
            if (document.getElementById('headerAccountId')) {
                document.getElementById('headerAccountId').innerText = `Account: ${user.loginId || user.ownerId}`;
            }
            loadProfileListeners();
            loadMobileMenuListeners();
            loadModalListeners();
        });
        
        // --- Logout Handler ---
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = '/propertyowner/ownerlogin';
        });

        // --- Reusable Modal/Menu/Profile Logic ---
        
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
            }, 300);
        };

        const loadModalListeners = () => {
            document.getElementById('upload-btn').addEventListener('click', () => openModal('upload-modal'));
            document.querySelector('.upload-zone').addEventListener('click', () => openModal('upload-modal'));
            
            document.querySelectorAll('.close-modal').forEach(btn => {
                btn.addEventListener('click', () => {
                    const modal = btn.closest('.modal');
                    closeModal(modal.id);
                });
            });

            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (event) => {
                    if (event.target === modal) {
                        closeModal(modal.id);
                    }
                });
            });
        }
        
        const loadMobileMenuListeners = () => {
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
            const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
            const closeMobileMenuButton = document.getElementById('close-mobile-menu');

            if(mobileMenuButton) {
                const openMobileMenu = () => mobileMenu.classList.remove('hidden');
                const closeMobileMenu = () => mobileMenu.classList.add('hidden');

                mobileMenuButton.addEventListener('click', openMobileMenu);
                closeMobileMenuButton.addEventListener('click', closeMobileMenu);
                mobileMenuOverlay.addEventListener('click', closeMobileMenu);
                mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobileMenu));
            }
        }

        const loadProfileListeners = () => {
            const profileButton = document.getElementById('profile-button');
            const profileDropdown = document.getElementById('profile-dropdown');

            if(profileButton) {
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
            }
        }