// Shared Header Component for all Website Pages
// This provides consistent navigation, notifications, and mobile responsiveness

const WEBSITE_PAGES = [
    { name: 'Home', url: 'index', icon: 'home' },
    { name: 'Our Properties', url: 'ourproperty', icon: 'building-2' },
    { name: 'My Stays', url: 'mystays', icon: 'building' },
    { name: 'Favorites', url: 'fav', icon: 'heart' },
    { name: 'Chat', url: 'websitechat', icon: 'message-square' },
    { name: 'About Us', url: 'about', icon: 'info' },
    { name: 'Contact Us', url: 'contact', icon: 'phone' },
];

function injectSharedHeader() {
    const headerHTML = `
    <header class="w-full bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-40">
        <div class="container mx-auto px-4 sm:px-6">
            <div class="flex h-20 items-center justify-between">
                
                <!-- Logo -->
                <div class="flex items-center">
                    <a href="index" class="flex-shrink-0">
                        <img src="images/logoroomhy.jpg" alt="Roomhy Logo" class="h-10 w-25">
                    </a>
                </div>
                
                <!-- Desktop Navigation -->
                <nav class="hidden md:flex items-center space-x-6">
                    <a href="ourproperty" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">Our Properties</a>
                    <a href="mystays" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">My Stays</a>
                    <a href="fav" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">Favorites</a>
                    <a href="websitechat" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">Chat</a>
                </nav>

                <!-- Right Side Icons -->
                <div class="flex items-center gap-3 sm:gap-6">
                    
                    <!-- Notification Icon -->
                    <div class="relative">
                        <button id="notification-btn" class="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <i data-lucide="bell" class="w-6 h-6 text-gray-700"></i>
                            <span id="notification-badge" class="hidden absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <!-- Notification Dropdown -->
                        <div id="notification-dropdown" class="hidden absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
                            <div class="p-4 border-b">
                                <h3 class="font-bold text-gray-900">Notifications</h3>
                            </div>
                            <div id="notification-list" class="divide-y">
                                <p class="p-4 text-gray-500 text-center">No new notifications</p>
                            </div>
                        </div>
                    </div>

                    <!-- Post Property Button -->
                    <a href="list" class="hidden sm:flex flex-shrink-0 items-center space-x-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                        <i data-lucide="plus-circle" class="w-4 h-4"></i>
                        <span>Post Property</span>
                    </a>
                    
                    <!-- Mobile Menu Toggle -->
                    <button id="mobile-menu-toggle" class="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <i data-lucide="menu" class="w-7 h-7 text-gray-800"></i>
                    </button>
                </div>

            </div>
        </div>
    </header>

    <!-- Mobile Menu Overlay -->
    <div id="mobile-menu-overlay" class="fixed inset-0 bg-black/50 z-30 hidden md:hidden"></div>
    
    <!-- Mobile Menu -->
    <div id="mobile-menu" class="fixed top-0 right-0 w-80 max-w-full h-full bg-white z-50 shadow-xl transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col md:hidden">
        <div class="flex justify-end p-4 flex-shrink-0 border-b">
            <button id="mobile-menu-close" class="p-2">
                <i data-lucide="x" class="w-6 h-6 text-gray-700"></i>
            </button>
        </div>

        <nav class="flex-grow p-4 space-y-1 overflow-y-auto">
            ${WEBSITE_PAGES.map(page => `
            <a href="${page.url}" class="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <i data-lucide="${page.icon}" class="w-5 h-5 text-blue-600"></i>
                </div>
                <span>${page.name}</span>
            </a>
            `).join('')}
        </nav>

        <div class="p-4 border-t flex-shrink-0 space-y-2">
            <a href="list" class="flex items-center space-x-2 w-full bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors">
                <i data-lucide="plus-circle" class="w-5 h-5"></i>
                <span>Post Property</span>
            </a>
            <a href="logout" class="flex items-center space-x-4 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                <i data-lucide="log-out" class="w-5 h-5"></i>
                <span>Logout</span>
            </a>
        </div>
    </div>
    `;

    // Insert header at the beginning of the body
    const headerElement = document.createElement('div');
    headerElement.innerHTML = headerHTML;
    document.body.insertBefore(headerElement.firstElementChild, document.body.firstChild);

    // Initialize mobile menu functionality
    initializeMobileMenu();
    initializeNotifications();
}

function initializeMobileMenu() {
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const menuClose = document.getElementById('mobile-menu-close');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuOverlay = document.getElementById('mobile-menu-overlay');

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
            link.addEventListener('click', closeMenu);
        });
    }
}

function initializeNotifications() {
    const notificationBtn = document.getElementById('notification-btn');
    const notificationDropdown = document.getElementById('notification-dropdown');
    const notificationList = document.getElementById('notification-list');
    const notificationBadge = document.getElementById('notification-badge');

    if (notificationBtn && notificationDropdown) {
        // Toggle dropdown
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
                notificationDropdown.classList.add('hidden');
            }
        });

        // Load and display notifications
        loadNotifications();
    }
}

async function loadNotifications() {
    try {
        const userId = localStorage.getItem('websiteUserId') || sessionStorage.getItem('userId');
        if (!userId) return;

        const API_URL = window.API_URL || 'https://api.roomhy.com';

        // Fetch notifications from backend
        const response = await fetch(`${API_URL}/api/website-enquiry/notifications/${userId}`);
        if (response.ok) {
            const data = await response.json();
            displayNotifications(data.notifications || []);
        }
    } catch (err) {
        console.error('Error loading notifications:', err);
    }
}

function displayNotifications(notifications) {
    const notificationList = document.getElementById('notification-list');
    const notificationBadge = document.getElementById('notification-badge');

    if (!notificationList) return;

    if (notifications.length === 0) {
        notificationList.innerHTML = '<p class="p-4 text-gray-500 text-center">No new notifications</p>';
        notificationBadge?.classList.add('hidden');
        return;
    }

    notificationBadge?.classList.remove('hidden');

    notificationList.innerHTML = notifications.map(notif => `
        <div class="p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 border-blue-500">
            <h4 class="font-semibold text-gray-900">${notif.title || 'New Notification'}</h4>
            <p class="text-sm text-gray-600 mt-1">${notif.message || ''}</p>
            <p class="text-xs text-gray-400 mt-2">${new Date(notif.createdAt).toLocaleDateString()}</p>
        </div>
    `).join('');
}

// Polling for new notifications every 30 seconds
setInterval(() => {
    loadNotifications();
}, 30000);

// Initialize header when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSharedHeader);
} else {
    injectSharedHeader();
}

// Reinitialize lucide icons after header injection
if (typeof lucide !== 'undefined') {
    setTimeout(() => lucide.createIcons(), 100);
}

