/**
 * Authentication Utility for Roomhy
 * Handles user session management and authentication checks
 */

// Storage keys - each section has isolated session
const AUTH_KEY = 'roomhy_auth';
const USER_KEY = 'user'; // Legacy key for backward compatibility
const WEBSITE_USER_KEY = 'website_user'; // Website/Tenant users
const STAFF_USER_KEY = 'staff_user'; // Staff (SuperAdmin/Manager/Employee)
const OWNER_USER_KEY = 'owner_user'; // Property owners

/**
 * Get current logged-in user
 * Checks all session types in priority order
 * @returns {Object|null} User object or null if not logged in
 */
function getCurrentUser() {
    try {
        // Try multiple storage locations in priority order
        const userStr = localStorage.getItem(WEBSITE_USER_KEY) ||  // Website tenant user (highest priority)
                       sessionStorage.getItem(WEBSITE_USER_KEY) ||
                       localStorage.getItem(STAFF_USER_KEY) ||     // Staff user
                       sessionStorage.getItem(STAFF_USER_KEY) ||
                       localStorage.getItem(OWNER_USER_KEY) ||     // Owner user
                       sessionStorage.getItem(OWNER_USER_KEY) ||
                       localStorage.getItem(USER_KEY) ||           // Legacy key
                       sessionStorage.getItem(USER_KEY) ||
                       localStorage.getItem(AUTH_KEY);
        
        if (!userStr) return null;
        
        const user = JSON.parse(userStr);
        return user && (user.id || user.loginId || user.ownerId) ? user : null;
    } catch (e) {
        console.error('Error getting current user:', e);
        return null;
    }
}

/**
 * Check if user is logged in
 * @returns {boolean} True if logged in
 */
function isLoggedIn() {
    const user = getCurrentUser();
    return user !== null;
}

/**
 * Get user ID (prioritizes: id > loginId > ownerId)
 * @returns {string} User ID
 */
function getUserId() {
    const user = getCurrentUser();
    if (!user) return '';
    return user.id || user.loginId || user.ownerId || '';
}

/**
 * Get user display name
 * @returns {string} User's first name or name
 */
function getUserName() {
    const user = getCurrentUser();
    if (!user) return 'Guest';
    return user.firstName || user.name || 'User';
}

/**
 * Get user email
 * @returns {string} User's email
 */
function getUserEmail() {
    const user = getCurrentUser();
    if (!user) return '';
    return user.email || user.gmail || user.userEmail || '';
}

/**
 * Get user role
 * @returns {string} User role (tenant, owner, superadmin, areamanager)
 */
function getUserRole() {
    const user = getCurrentUser();
    return user?.role || '';
}

/**
 * Require authentication - redirects to login if not logged in
 * @param {string} loginPage - URL to redirect to (default: login.html)
 * @param {boolean} showModal - Show session modal instead of redirect
 * @param {string} modalId - ID of modal element to show
 */
function requireAuth(loginPage = 'login.html', showModal = false, modalId = null) {
    if (!isLoggedIn()) {
        if (showModal && modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                return false;
            }
        }
        window.location.href = loginPage;
        return false;
    }
    return true;
}

/**
 * Logout user - clears session and redirects
 * @param {string} redirectPage - URL to redirect after logout (relative to website folder)
 * @param {Function} callback - Optional callback before redirect
 */
function logout(redirectPage = 'login.html', callback = null) {
    // Clear all session data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('USER_KEY');
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('owner_session');
    localStorage.removeItem('tenant_user');
    localStorage.removeItem('bookingRequestData');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Execute callback if provided
    if (typeof callback === 'function') {
        callback();
    }
    
    // Redirect to login page
    window.location.href = redirectPage;
}

/**
 * Update sidebar with user info
 * @param {Object} options - Configuration options
 * @param {string} options.userIdElementId - Element ID to display user ID
 * @param {string} options.userNameElementId - Element ID to display user name
 * @param {string} options.avatarElementId - Element ID for avatar display
 * @param {boolean} options.showUserId - Whether to show user ID
 */
function updateSidebarUserInfo(options = {}) {
    const {
        userIdElementId = 'sidebar-user-id',
        userNameElementId = 'sidebar-user-name',
        avatarElementId = 'sidebar-avatar',
        showUserId = true
    } = options;
    
    const user = getCurrentUser();
    if (!user) return;
    
    // Update user name
    const nameEl = document.getElementById(userNameElementId);
    if (nameEl) {
        nameEl.textContent = getUserName();
    }
    
    // Update avatar
    const avatarEl = document.getElementById(avatarElementId);
    if (avatarEl) {
        avatarEl.textContent = getUserName().charAt(0).toUpperCase();
    }
    
    // Update user ID if element exists
    if (showUserId) {
        const userIdEl = document.getElementById(userIdElementId);
        if (userIdEl) {
            userIdEl.textContent = getUserId();
            userIdEl.style.display = 'block';
        }
    }
}

/**
 * Initialize authentication on page load
 * @param {Object} config - Configuration
 * @param {string} config.loginPage - Login page URL
 * @param {boolean} config.requireAuth - Whether to require authentication
 * @param {string} config.userIdDisplaySelector - CSS selector for user ID display
 */
function initAuth(config = {}) {
    const {
        loginPage = 'login.html',
        requireAuth: shouldRequire = true,
        userIdDisplaySelector = '.user-id-display'
    } = config;
    
    // Check authentication
    if (shouldRequire && !requireAuth(loginPage)) {
        return false;
    }
    
    // Update all user ID displays
    const userIdDisplays = document.querySelectorAll(userIdDisplaySelector);
    userIdDisplays.forEach(el => {
        el.textContent = getUserId();
    });
    
    return true;
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.AuthUtils = {
        getCurrentUser,
        isLoggedIn,
        getUserId,
        getUserName,
        getUserEmail,
        getUserRole,
        requireAuth,
        logout,
        updateSidebarUserInfo,
        initAuth
    };
}
