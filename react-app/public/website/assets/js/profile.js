lucide.createIcons();
        
        /*
        ============================================================
        JavaScript for Mobile Side Menu
        ============================================================
        */
        const menuToggle = document.getElementById('menu-toggle');
        const menuClose = document.getElementById('menu-close');
        const mobileMenu = document.getElementById('mobile-menu');
        const menuOverlay = document.getElementById('menu-overlay');

        if (menuToggle && mobileMenu && menuClose && menuOverlay) {
            menuToggle.addEventListener('click', () => {
                mobileMenu.classList.remove('translate-x-full');
                menuOverlay.classList.remove('hidden');
            });

            const closeMenu = () => {
                mobileMenu.classList.add('translate-x-full');
                menuOverlay.classList.add('hidden');
            };

            menuClose.addEventListener('click', closeMenu);
            menuOverlay.addEventListener('click', closeMenu);

            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', (e) => {
                    if (link.href.includes('#')) {
                        setTimeout(closeMenu, 100);
                    }
                    closeMenu();
                });
            });
            
            // Handle logout button click
            const logoutButton = mobileMenu.querySelector('button[onclick="globalLogout()"]');
            if (logoutButton) {
                logoutButton.addEventListener('click', closeMenu);
            }
        }
        
        // ======================================================
        // GLOBAL LOGOUT FUNCTION - Clears all storage and redirects
        // ======================================================
        function globalLogout() {
            // Use AuthUtils if available, otherwise do it manually
            if (typeof AuthUtils !== 'undefined' && AuthUtils.logout) {
                AuthUtils.logout('login');
            } else {
                // Manual logout
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = 'login';
            }
        }
        
        // ======================================================
        // UPDATE MOBILE MENU BASED ON LOGIN STATE
        // ======================================================
        function updateMobileMenuState() {
            const menuLoggedIn = document.getElementById('menu-logged-in');
            const menuLoggedOut = document.getElementById('menu-logged-out');
            
            if (typeof AuthUtils !== 'undefined' && AuthUtils.isLoggedIn()) {
                // Show logged-in menu
                if (menuLoggedIn) menuLoggedIn.classList.remove('hidden');
                if (menuLoggedOut) menuLoggedOut.classList.add('hidden');
                
                // Update user info
                updateWelcomeMessage();
            } else {
                // Show logged-out menu
                if (menuLoggedIn) menuLoggedIn.classList.add('hidden');
                if (menuLoggedOut) menuLoggedOut.classList.remove('hidden');
            }
        }
        
        // ======================================================
        // UPDATE WELCOME MESSAGE WITH USER ID
        // ======================================================
        function updateWelcomeMessage() {
            // Use AuthUtils for consistency
            if (typeof AuthUtils !== 'undefined' && AuthUtils.isLoggedIn()) {
                const userId = AuthUtils.getUserId();
                const userName = AuthUtils.getUserName();
                
                const welcomeName = document.getElementById('welcomeUserName');
                const userIdDisplay = document.getElementById('userIdDisplay');
                
                if (welcomeName) {
                    welcomeName.textContent = `Hi, ${userName}`;
                }
                if (userIdDisplay) {
                    userIdDisplay.textContent = `ID: ${userId}`;
                }
            }
        }
        
        // Call on page load
        updateMobileMenuState();
        
        // Listen for storage changes (logout from other tabs)
        window.addEventListener('storage', updateMobileMenuState);
        
        /*
        ============================================================
        Hero Slideshow
        ============================================================
        */
        const heroWrapper = document.getElementById('hero-image-wrapper');
        if (heroWrapper) {
            const heroImages = heroWrapper.querySelectorAll('img');
            const totalHeroImages = heroImages.length;
            let currentHeroIndex = 0;

            if (totalHeroImages > 1) {
                setInterval(() => {
                    const nextHeroIndex = (currentHeroIndex + 1) % totalHeroImages;
                    
                    heroImages[currentHeroIndex].classList.remove('opacity-100');
                    heroImages[currentHeroIndex].classList.add('opacity-0');
                    
                    heroImages[nextHeroIndex].classList.remove('opacity-0');
                    heroImages[nextHeroIndex].classList.add('opacity-100');
                    
                    currentHeroIndex = nextHeroIndex;
                }, 5000);
            }
        }

        // UPDATE WELCOME MESSAGE WITH USER ID
        function updateWelcomeMessage() {
            if (typeof AuthUtils !== 'undefined' && AuthUtils.isLoggedIn()) {
                const userId = AuthUtils.getUserId();
                const userName = AuthUtils.getUserName();
                
                const welcomeName = document.getElementById('welcomeUserName');
                const userIdDisplay = document.getElementById('userIdDisplay');
                
                if (welcomeName) {
                    welcomeName.textContent = `Hi, ${userName}`;
                }
                if (userIdDisplay) {
                    userIdDisplay.textContent = `ID: ${userId}`;
                }
            }
        }
        
        // Call on page load
        updateWelcomeMessage();
