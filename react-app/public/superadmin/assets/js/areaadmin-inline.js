// API Configuration
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5001'
    : 'https://api.roomhy.com';

// --- Safe Redirect Helper ---
// Fixes SyntaxError on relative paths in some environments (Blob/Preview)
function safeRedirect(url) {
    const isPreview = window.location.protocol === 'blob:' || window.location.href.includes('scf.usercontent');

    if (isPreview) {
        // Directly show manual link to avoid SyntaxError
        showFallbackUI(url);
        return;
    }

    try {
        window.location.href = url;
    } catch (e) {
        console.warn("Redirect blocked:", e);
        showFallbackUI(url);
    }
}

function showFallbackUI(url) {
    document.body.innerHTML = `
        <div class="flex flex-col items-center justify-center h-screen bg-gray-100">
            <div class="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
                <div class="mb-4 bg-red-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-600"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line></svg>
                </div>
                <h2 class="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
                <p class="text-gray-500 mb-6 text-sm">You need to login to view this page.</p>
                <a href="${url}" class="block w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition shadow-md">
                    Go to Login Page
                </a>
            </div>
        </div>
    `;
}

// --- STRICT AUTH CHECK ---
function getStaffUser() {
    try {
        const raw =
            sessionStorage.getItem('manager_user') ||
            sessionStorage.getItem('user') ||
            localStorage.getItem('staff_user') ||
            localStorage.getItem('manager_user') ||
            localStorage.getItem('user') ||
            'null';
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

// 1. Get user
// Try per-tab/session storage first, then fallback to localStorage
const user = getStaffUser();
if (user && user.role) user.role = String(user.role).toLowerCase();

// 2. Check if user exists AND has the correct role
// If user is an OWNER or TENANT trying to access this page, force logout/redirect
if (!user || (user.role !== 'areamanager' && user.role !== 'employee')) {
    // alert("Access Denied: You are logged in as " + (user ? user.role : 'Unknown') + ". Redirecting to login.");
    localStorage.removeItem('user'); // Clear conflicting session
    localStorage.removeItem('manager_user'); // Clear conflicting session
    sessionStorage.removeItem('owner_session'); // Clear owner session
    safeRedirect('/superadmin/index'); // Redirect to unified login
    throw new Error("Access Denied"); // Stop script execution
}

// --- EMPLOYEE FALLBACK (name/permissions) ---
function normalizePermissions(value) {
    if (Array.isArray(value)) {
        return value.map(v => {
            if (typeof v === 'string') return v;
            if (v && typeof v === 'object') return v.id || v.value || v.key || '';
            return '';
        }).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value.split(',').map(v => v.trim()).filter(Boolean);
    }
    return [];
}

function getEmployeeRecord(loginId) {
    if (!loginId) return null;
    const id = String(loginId).toUpperCase();
    try {
        const list = JSON.parse(localStorage.getItem('roomhy_employees') || '[]');
        if (Array.isArray(list)) {
            const found = list.find(e => String(e.loginId || '').toUpperCase() === id);
            if (found) return found;
        }
    } catch (e) {}
    try {
        const cache = JSON.parse(localStorage.getItem('roomhy_employees_cache') || '[]');
        if (Array.isArray(cache)) {
            const found = cache.find(e => String(e.loginId || '').toUpperCase() === id);
            if (found) return found;
        }
    } catch (e) {}
    return null;
}

function resolveUserDisplayName(currentUser, fallbackEmp) {
    const raw =
        currentUser?.name ||
        currentUser?.fullName ||
        currentUser?.employeeName ||
        currentUser?.managerName ||
        fallbackEmp?.name ||
        fallbackEmp?.fullName ||
        fallbackEmp?.employeeName ||
        fallbackEmp?.managerName ||
        currentUser?.loginId ||
        'User';
    return String(raw || 'User');
}

if (user && user.role === 'employee') {
    const empRecord = getEmployeeRecord(user.loginId);
    if (empRecord) {
        const mergedPerms = normalizePermissions(user.permissions);
        if (!mergedPerms.length) {
            user.permissions = normalizePermissions(
                empRecord.permissions || empRecord.modules || empRecord.moduleAccess || empRecord.access
            );
        }
        user.name = user.name || empRecord.name || empRecord.fullName || empRecord.employeeName;
        user.team = user.team || empRecord.team || empRecord.role || 'Employee';
        user.area = user.area || empRecord.area || empRecord.areaName || '';
        user.areaName = user.areaName || empRecord.areaName || empRecord.area || '';
        user.city = user.city || empRecord.city || '';
    }
}

const displayName = resolveUserDisplayName(user, getEmployeeRecord(user?.loginId));

// --- DYNAMIC PERMISSION LOGIC ---
const sidebarConfig = {
    'dashboard': { label: 'Dashboard', page: 'dashboard_home', icon: 'layout-dashboard' },
    'teams': { label: 'Teams', page: '/superadmin/manager', icon: 'map-pin' },
    'owners': { label: 'Property Owners', page: '/superadmin/owner', icon: 'briefcase' },
    'properties': { label: 'Properties', page: '/superadmin/properties', icon: 'home' },
    'tenants': { label: 'Tenants', page: '/superadmin/tenant', icon: 'users' },
    'new_signups': { label: 'New Signups', page: '/superadmin/new_signups', icon: 'file-badge' },
    'web_enquiry': { label: 'Web Enquiry', page: '/superadmin/websiteenq', icon: 'folder-open' },
    'enquiries': { label: 'Enquiries', page: '/superadmin/enquiry', icon: 'help-circle' },
    'bookings': { label: 'Bookings', page: '/superadmin/booking', icon: 'calendar-check' },
    'reviews': { label: 'Reviews', page: '/superadmin/reviews', icon: 'star' },
    'complaint_history': { label: 'Complaint History', page: '/superadmin/complaint-history', icon: 'alert-circle' },
    'live_properties': { label: 'Live Properties', page: '/superadmin/website', icon: 'globe' },
    'rent_collections': { label: 'Rent Collections', page: '/superadmin/rentcollection', icon: 'wallet' },
    'commissions': { label: 'Commissions', page: '/superadmin/platform', icon: 'indian-rupee' },
    'refunds': { label: 'Refunds', page: '/superadmin/refund', icon: 'rotate-ccw' },
    'locations': { label: 'Locations', page: '/superadmin/location', icon: 'map-pin' },
    'visits': { label: 'Visit Reports', page: '/superadmin/visit', icon: 'clipboard-list' }
};

// These permissions are ALWAYS granted
const mandatoryPermissions = ['dashboard'];

let allowedModules = [];

if (user.role === 'areamanager') {
    allowedModules = Object.keys(sidebarConfig);
} else if (user.role === 'employee') {
    const assigned = normalizePermissions(user.permissions);
    allowedModules = [...new Set([...assigned, ...mandatoryPermissions])];
}

function createLink(id) {
    const config = sidebarConfig[id];
    if (!config) return '';
    if (!allowedModules.includes(id)) return '';

    const isActive = config.page === 'dashboard_home' ? 'active' : '';
    return `
        <a href="#" onclick="loadPage('${config.page}', this); return false;" class="sidebar-link ${isActive}">
            <i data-lucide="${config.icon}" class="w-5 h-5 mr-3"></i> ${config.label}
        </a>
    `;
}

function loadPage(pageUrl, element) {
    if (element) {
        document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
        element.classList.add('active');
    }
    const frame = document.getElementById('contentFrame');
    const dashboardView = document.getElementById('dashboard-view');

    if (pageUrl === 'dashboard_home') {
        dashboardView.classList.remove('hidden');
        frame.classList.add('hidden');
        frame.classList.remove('frame-loading');
        frame.removeAttribute('aria-busy');
        document.getElementById('welcomeArea').innerText = 'Dashboard';
    } else {
        dashboardView.classList.add('hidden');
        frame.classList.remove('hidden');
        frame.classList.add('frame-loading');
        frame.setAttribute('aria-busy', 'true');
        const isReactAreaAdmin = (window.location.pathname || '').startsWith('/superadmin/areaadmin');
        const resolvedUrl = isReactAreaAdmin && pageUrl.startsWith('/')
            ? `${pageUrl}?embed=1`
            : pageUrl;
        frame.src = resolvedUrl;
        const key = Object.keys(sidebarConfig).find(k => sidebarConfig[k].page === pageUrl);
        if (key) document.getElementById('welcomeArea').innerText = sidebarConfig[key].label;
    }
}

function parseCountPayload(payload) {
    if (Array.isArray(payload)) return payload.length;
    if (Array.isArray(payload?.data)) return payload.data.length;
    if (Array.isArray(payload?.items)) return payload.items.length;
    if (Array.isArray(payload?.visits)) return payload.visits.length;
    if (Array.isArray(payload?.tenants)) return payload.tenants.length;
    if (Array.isArray(payload?.complaints)) return payload.complaints.length;
    if (typeof payload?.count === 'number') return payload.count;
    if (typeof payload?.total === 'number') return payload.total;
    if (typeof payload?.totalCount === 'number') return payload.totalCount;
    return 0;
}

async function getCountFromApi(path) {
    try {
        const res = await fetch(`${API_URL}${path}`);
        if (!res.ok) return 0;
        const data = await res.json().catch(() => ({}));
        return parseCountPayload(data);
    } catch (_) {
        return 0;
    }
}

function renderDashboardWidgets() {
    const grid = document.getElementById('dashboardWidgetGrid');
    if (!grid) return;

    const cards = [
        { id: 'properties', page: '/superadmin/properties', label: 'Properties', desc: 'Manage Listings', icon: 'home', color: 'blue', countId: 'widgetPropertiesCount' },
        { id: 'tenants', page: '/superadmin/tenant', label: 'Tenants', desc: 'Active Residents', icon: 'users', color: 'green', countId: 'widgetTenantsCount' },
        { id: 'complaint_history', page: '/superadmin/complaint-history', label: 'Complaints', desc: 'View Issues', icon: 'alert-circle', color: 'red', countId: 'widgetComplaintsCount' },
        { id: 'visits', page: '/superadmin/visit', label: 'Visit Reports', desc: 'Total Visit Reports', icon: 'clipboard-list', color: 'purple', countId: 'widgetVisitsCount' }
    ].filter(card => allowedModules.includes(card.id));

    grid.innerHTML = cards.map(card => `
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
             onclick="loadPage('${card.page}', null)">
            <div class="flex items-center gap-4">
                <div class="p-3 bg-${card.color}-50 rounded-lg text-${card.color}-600">
                    <i data-lucide="${card.icon}" class="w-6 h-6"></i>
                </div>
                <div>
                    <h3 class="font-bold text-slate-800">${card.label}</h3>
                    <p class="text-xs text-gray-500">${card.desc}</p>
                    <p id="${card.countId}" class="text-sm font-semibold text-slate-700 mt-1">0</p>
                </div>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

async function loadDashboardWidgetCounts() {
    if (allowedModules.includes('properties')) {
        const propertyEl = document.getElementById('widgetPropertiesCount');
        const statsEl = document.getElementById('totalPropertiesCountArea');
        if (propertyEl) {
            const value = (statsEl && statsEl.innerText && statsEl.innerText !== '-') ? statsEl.innerText : String(await getCountFromApi('/api/properties'));
            propertyEl.innerText = value;
        }
    }

    if (allowedModules.includes('tenants')) {
        const tenantEl = document.getElementById('widgetTenantsCount');
        if (tenantEl) tenantEl.innerText = String(await getCountFromApi('/api/tenants'));
    }

    if (allowedModules.includes('complaint_history')) {
        const complaintsEl = document.getElementById('widgetComplaintsCount');
        if (complaintsEl) complaintsEl.innerText = String(await getCountFromApi('/api/complaints'));
    }

    if (allowedModules.includes('visits')) {
        const visitsEl = document.getElementById('widgetVisitsCount');
        let visitCount = await getCountFromApi('/api/visits');
        if (!visitCount) {
            try {
                const localVisits = JSON.parse(localStorage.getItem('roomhy_visit_reports') || '[]');
                visitCount = Array.isArray(localVisits) ? localVisits.length : 0;
            } catch (_) {}
        }
        if (visitsEl) visitsEl.innerText = String(visitCount || 0);
    }
}

function initAreaAdmin() {
    const nav = document.getElementById('dynamicSidebarNav');
    let html = '';

    // 1. Dashboard
    html += createLink('dashboard');

    // 2. Management - Show: Properties, Tenants, Owners, Visits, Bookings, Location, Enquiries
    const mgmt = ['teams', 'owners', 'properties', 'tenants', 'new_signups', 'visits'];
    if (mgmt.some(id => allowedModules.includes(id))) {
        html += `<div class="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">Management</div>`;
        mgmt.forEach(id => html += createLink(id));
    }

    // 3. Finance - Show: Payments
    const fin = ['rent_collections', 'commissions', 'refunds'];
    if (fin.some(id => allowedModules.includes(id))) {
        html += `<div class="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">Finance</div>`;
        fin.forEach(id => html += createLink(id));
    }

    // 4. System - Show: Chat, Reports
    const sys = ['web_enquiry', 'enquiries', 'bookings', 'reviews', 'complaint_history', 'live_properties', 'locations'];
    if (sys.some(id => allowedModules.includes(id))) {
        html += `<div class="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">System</div>`;
        sys.forEach(id => html += createLink(id));
    }

    // 5. Account - Always show Profile (add to sidebarConfig if needed)
    html += `<div class="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">Account</div>`;
    html += `<a href="/superadmin/profile" class="sidebar-link"><i data-lucide="user" class="w-5 h-5 mr-3"></i> Profile</a>`;
    html += `<a href="/superadmin/settings" class="sidebar-link"><i data-lucide="settings" class="w-5 h-5 mr-3"></i> Settings</a>`;

    nav.innerHTML = html;
    const mobileNav = document.getElementById('mobileSidebarNav');
    if (mobileNav) mobileNav.innerHTML = html;
    lucide.createIcons();

    // Header Info
    document.getElementById('roleLabel').innerText = user.role === 'areamanager' ? 'AREA ADMIN' : 'TEAM MEMBER';
    document.getElementById('headerRole').innerText = user.role === 'employee' ? (user.team || 'Employee') : 'Area Manager';
    document.getElementById('headerName').innerText = displayName;
    document.getElementById('welcomeName').innerText = displayName;

    // Area Badge Logic (The Request)
    // If area is assigned, show it. Else show role/team.
    // We check 'area' (from /superadmin/manager) and 'areaName' (legacy)
    const assignedArea = user.area || user.areaName;

    if (assignedArea && assignedArea !== 'Unassigned' && assignedArea !== 'Select Area' && assignedArea !== '') {
        // Show Area + City if available
        const display = user.city ? `${assignedArea}, ${user.city}` : assignedArea;
        document.getElementById('headerAreaBadge').innerText = display;
    } else {
        // Fallback for central team members (e.g. HR, Accounts)
        document.getElementById('headerAreaBadge').innerText = user.team || 'Head Office';
    }

    // Hide salary for employees
    if (user.role === 'employee') document.getElementById('salaryBadge').style.display = 'none';

    renderDashboardWidgets();
    loadDashboardWidgetCounts();

    // Load and display profile photo from employee data
    try {
        const employees = JSON.parse(localStorage.getItem('roomhy_employees') || '[]');
        const currentEmp = employees.find(e => String(e.loginId || '').toUpperCase() === String(user.loginId || '').toUpperCase());
        const profileImg = document.querySelector('header img[alt="User"]');
        const existingAvatar = profileImg ? profileImg.parentNode.querySelector('[data-emp-avatar]') : null;
        const nameForAvatar = (currentEmp && currentEmp.name) ? currentEmp.name : displayName;
        const normalizedName = String(nameForAvatar || '').replace(/\s+/g, '').trim();
        const initials = (normalizedName ? normalizedName.slice(0, 2) : '--').toUpperCase();
        const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'];
        const key = (currentEmp && currentEmp.loginId) ? String(currentEmp.loginId) : (user && user.loginId ? String(user.loginId) : '0');
        const colorIdx = key.charCodeAt(0) % colors.length;

        if (currentEmp && currentEmp.photoDataUrl && profileImg) {
            profileImg.src = currentEmp.photoDataUrl;
            profileImg.style.display = '';
            if (existingAvatar) existingAvatar.remove();
        } else if (profileImg) {
            profileImg.style.display = 'none';
            if (existingAvatar) {
                existingAvatar.innerText = initials;
            } else {
                const avatar = document.createElement('div');
                avatar.setAttribute('data-emp-avatar', 'true');
                avatar.className = `w-8 h-8 rounded-full ${colors[colorIdx]} flex items-center justify-center text-white text-xs font-bold border border-slate-200`;
                avatar.innerText = initials;
                profileImg.parentNode.insertBefore(avatar, profileImg);
            }
        }
    } catch (err) {
        console.warn('Failed to load employee profile photo:', err);
    }

    // Iframe Cleaner
    const frame = document.getElementById('contentFrame');
    frame.addEventListener('load', function() {
        try {
            const innerDoc = frame.contentDocument || frame.contentWindow.document;
            const innerSidebar = innerDoc.querySelector('.sidebar');
            if (innerSidebar) innerSidebar.style.display = 'none';
            const innerHeader = innerDoc.querySelector('header');
            if (innerHeader) innerHeader.style.display = 'none';
            const innerMobile = innerDoc.getElementById('mobile-menu-open');
            if (innerMobile) innerMobile.style.display = 'none';
        } catch (e) {}
        frame.classList.remove('frame-loading');
        frame.removeAttribute('aria-busy');
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAreaAdmin);
} else {
    initAreaAdmin();
}

document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('user');
    localStorage.removeItem('manager_user');
    safeRedirect('/superadmin/index');
});
