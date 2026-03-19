lucide.createIcons();
        
        /*
        ============================================================
        JavaScript for Mobile Side Menu (from index)
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
                document.body.style.overflow = 'hidden'; // Prevent background scroll
            });

            const closeMenu = () => {
                mobileMenu.classList.add('translate-x-full');
                menuOverlay.classList.add('hidden');
                document.body.style.overflow = ''; // Restore background scroll
            };

            menuClose.addEventListener('click', closeMenu);
            menuOverlay.addEventListener('click', closeMenu);

            mobileMenu.querySelectorAll('a').forEach(link => {
                // Close menu on any link click
                link.addEventListener('click', closeMenu);
            });
        }
        
        /*
        ============================================================
        Intersection Observer for animations (from index)
        ============================================================
        */
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Use the 'animate-slide-in' class which is now defined in tailwind.config
                        entry.target.classList.add('animate-slide-in');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 }); // Trigger when 10% of the element is visible

            // Select all elements that should animate
            document.querySelectorAll('.animate-slide-in').forEach(el => {
                // Set initial opacity to 0 so they fade in
                el.style.opacity = '0';
                observer.observe(el);
            });
        } else {
            // Fallback for older browsers: just show the elements
            document.querySelectorAll('.animate-slide-in').forEach(el => {
                el.style.opacity = '1';
            });
        }


        /*
        ============================================================
        Hero Slideshow (from index)
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
                }, 5000); // Change image every 5 seconds
            }
        }
