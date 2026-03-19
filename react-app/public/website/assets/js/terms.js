lucide.createIcons();
        
        /*
        ============================================================
        Mobile Menu & Authentication
        ============================================================
        */
        
        // Global Logout Function
        function globalLogout() {
            if (typeof AuthUtils !== 'undefined') {
                AuthUtils.logout('login');
            } else {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = 'login';
            }
        }

        // Update Mobile Menu State
        function updateMobileMenuState() {
            const menuLoggedIn = document.getElementById('menu-logged-in');
            const menuLoggedOut = document.getElementById('menu-logged-out');
            const isLoggedIn = typeof AuthUtils !== 'undefined' ? AuthUtils.isLoggedIn() : false;
            
            if (isLoggedIn) {
                menuLoggedIn?.classList.remove('hidden');
                menuLoggedOut?.classList.add('hidden');
            } else {
                menuLoggedIn?.classList.add('hidden');
                menuLoggedOut?.classList.remove('hidden');
            }
        }

        // Update Welcome Message
        function updateWelcomeMessage() {
            const welcomeEl = document.getElementById('welcomeUserName');
            const userIdEl = document.getElementById('userIdDisplay');
            
            if (typeof AuthUtils !== 'undefined') {
                const user = AuthUtils.getCurrentUser();
                if (user && welcomeEl) {
                    welcomeEl.textContent = `Hi, ${user.fullName || 'User'}`;
                    if (userIdEl && user.userId) {
                        userIdEl.textContent = `ID: ${user.userId}`;
                    }
                }
            }
        }

        // Menu Toggle & Close Handlers
        const menuToggle = document.getElementById('menu-toggle');
        const menuOverlay = document.getElementById('menu-overlay');
        const menuLoggedIn = document.getElementById('menu-logged-in');
        const menuLoggedOut = document.getElementById('menu-logged-out');
        const menuClose = document.getElementById('menu-close');
        const menuCloseLogout = document.getElementById('menu-close-logout');

        const closeMenu = () => {
            menuLoggedIn?.classList.add('translate-x-full');
            menuLoggedOut?.classList.add('translate-x-full');
            menuOverlay?.classList.add('hidden');
        };

        const openMenu = () => {
            updateMobileMenuState();
            updateWelcomeMessage();
            const isLoggedIn = typeof AuthUtils !== 'undefined' ? AuthUtils.isLoggedIn() : false;
            if (isLoggedIn) {
                menuLoggedIn?.classList.remove('translate-x-full');
            } else {
                menuLoggedOut?.classList.remove('translate-x-full');
            }
            menuOverlay?.classList.remove('hidden');
        };

        if (menuToggle) {
            menuToggle.addEventListener('click', openMenu);
        }
        if (menuClose) {
            menuClose.addEventListener('click', closeMenu);
        }
        if (menuCloseLogout) {
            menuCloseLogout.addEventListener('click', closeMenu);
        }
        if (menuOverlay) {
            menuOverlay.addEventListener('click', closeMenu);
        }

        // Close menu on link click
        [menuLoggedIn, menuLoggedOut].forEach(menu => {
            if (menu) {
                menu.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', closeMenu);
                });
            }
        });

        // Page Load Setup
        document.addEventListener('DOMContentLoaded', () => {
            updateMobileMenuState();
            updateWelcomeMessage();
        });

        // Storage Event Listener for Cross-Tab Logout
        window.addEventListener('storage', (e) => {
            if (e.key === 'logout_event' || e.key === 'user' || e.key === 'auth_token') {
                updateMobileMenuState();
                updateWelcomeMessage();
            }
        });
        
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
