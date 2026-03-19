import { useHeadAssets } from "../../utils/useHeadAssets.js";
import { useTailwindProcessor } from "../../utils/useTailwindProcessor.js";

const title = "Roomhy - Area Admin Dashboard";
const metas = [
  {
    "charset": "UTF-8"
  },
  {
    "name": "viewport",
    "content": "width=device-width, initial-scale=1.0"
  }
];
const links = [
{
    "href": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
    "rel": "stylesheet"
  },
  {
    "rel": "stylesheet",
    "href": "/superadmin/assets/css/areaadmin.css"
  }
];
const scripts = [
  {
    "content": "// API Configuration\n        const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')\n            ? 'http://localhost:5001'\n            : 'https://api.roomhy.com';"
  },
  {
    "src": "https://cdn.tailwindcss.com"
  },
  {
    "src": "https://unpkg.com/lucide@latest"
  },
  {
    "src": "https://cdn.jsdelivr.net/npm/chart.js"
  },
  {
    "content": "(() => {\n        const user = JSON.parse(sessionStorage.getItem('manager_user') || sessionStorage.getItem('user') || localStorage.getItem('manager_user') || localStorage.getItem('user') || 'null');\n        if (user && (user.role === 'areamanager' || user.role === 'manager' || user.role === 'employee')) {\n            window.location.replace('/employee/areaadmin');\n            throw new Error('Redirecting staff user to employee dashboard');\n        }\n    })();"
  },
  {
    "content": "// --- Safe Redirect Helper ---\n        // Fixes SyntaxError on relative paths in some environments (Blob/Preview)\n        function safeRedirect(url) {\n            const isPreview = window.location.protocol === 'blob:' || window.location.href.includes('scf.usercontent');\n            \n            if (isPreview) {\n                // Directly show manual link to avoid SyntaxError\n                showFallbackUI(url);\n                return;\n            }\n\n            try {\n                window.location.href = url;\n            } catch (e) {\n                console.warn(\"Redirect blocked:\", e);\n                showFallbackUI(url);\n            }\n        }\n\n        function showFallbackUI(url) {\n            document.body.innerHTML = `\n                <div class=\"flex flex-col items-center justify-center h-screen bg-gray-100\">\n                    <div class=\"bg-white p-8 rounded-xl shadow-lg text-center max-w-md\">\n                        <div class=\"mb-4 bg-red-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto\">\n                            <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"text-red-600\"><path d=\"M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2\"></path><circle cx=\"8.5\" cy=\"7\" r=\"4\"></circle><line x1=\"18\" y1=\"8\" x2=\"23\" y2=\"13\"></line><line x1=\"23\" y1=\"8\" x2=\"18\" y2=\"13\"></line></svg>\n                        </div>\n                        <h2 class=\"text-xl font-bold text-gray-800 mb-2\">Access Denied</h2>\n                        <p class=\"text-gray-500 mb-6 text-sm\">You need to login to view this page.</p>\n                        <a href=\"${url}\" class=\"block w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition shadow-md\">\n                            Go to Login Page\n                        </a>\n                    </div>\n                </div>\n            `;\n        }\n\n        // --- STRICT AUTH CHECK ---\n        // 1. Get user\n        // Try per-tab/session storage first, then fallback to localStorage\n        const user = JSON.parse(sessionStorage.getItem('manager_user') || sessionStorage.getItem('user') || localStorage.getItem('manager_user') || localStorage.getItem('user') || 'null');\n        \n        // 2. Check if user exists AND has the correct role\n        // If user is an OWNER or TENANT trying to access this page, force logout/redirect\n        if (!user || (user.role !== 'areamanager' && user.role !== 'employee')) {\n            // alert(\"Access Denied: You are logged in as \" + (user ? user.role : 'Unknown') + \". Redirecting to login.\");\n            localStorage.removeItem('user'); // Clear conflicting session\n            localStorage.removeItem('manager_user'); // Clear conflicting session\n            sessionStorage.removeItem('owner_session'); // Clear owner session\n            safeRedirect('../index.html'); // Redirect to unified login\n            throw new Error(\"Access Denied\"); // Stop script execution\n        }\n\n        // --- DYNAMIC PERMISSION LOGIC ---\n        const sidebarConfig = {\n            'dashboard': { label: 'Dashboard', page: 'dashboard_home', icon: 'layout-dashboard' },\n            'teams': { label: 'Teams', page: 'manager.html', icon: 'map-pin' },\n            'owners': { label: 'Property Owners', page: 'owner.html', icon: 'briefcase' },\n            'properties': { label: 'Properties', page: 'properties.html', icon: 'home' },\n            'tenants': { label: 'Tenants', page: 'tenant.html', icon: 'users' },\n            'new_signups': { label: 'New Signups', page: 'new_signups.html', icon: 'file-badge' },\n            'web_enquiry': { label: 'Web Enquiry', page: 'websiteenq.html', icon: 'folder-open' },\n            'enquiries': { label: 'Enquiries', page: 'enquiry.html', icon: 'help-circle' },\n            'bookings': { label: 'Bookings', page: 'booking.html', icon: 'calendar-check' },\n            'reviews': { label: 'Reviews', page: 'reviews.html', icon: 'star' },\n            'complaint_history': { label: 'Complaint History', page: 'complaint-history.html', icon: 'alert-circle' },\n            'live_properties': { label: 'Live Properties', page: 'website.html', icon: 'globe' },\n            'rent_collections': { label: 'Rent Collections', page: 'rentcollection.html', icon: 'wallet' },\n            'commissions': { label: 'Commissions', page: 'platform.html', icon: 'indian-rupee' },\n            'refunds': { label: 'Refunds', page: 'refund.html', icon: 'rotate-ccw' },\n            'locations': { label: 'Locations', page: 'location.html', icon: 'map-pin' },\n            'visits': { label: 'Visit Reports', page: 'visit.html', icon: 'clipboard-list' }\n        };\n\n        // These permissions are ALWAYS granted\n        const mandatoryPermissions = ['dashboard'];\n\n        let allowedModules = [];\n\n        if (user.role === 'areamanager') {\n            allowedModules = Object.keys(sidebarConfig);\n        } else if (user.role === 'employee') {\n            const assigned = user.permissions || [];\n            allowedModules = [...new Set([...assigned, ...mandatoryPermissions])];\n        }\n\n        function createLink(id) {\n            const config = sidebarConfig[id];\n            if (!config) return '';\n            if (!allowedModules.includes(id)) return ''; \n\n            const isActive = config.page === 'dashboard_home' ? 'active' : '';\n            return `\n                <a href=\"#\" onclick=\"loadPage('${config.page}', this); return false;\" class=\"sidebar-link ${isActive}\">\n                    <i data-lucide=\"${config.icon}\" class=\"w-5 h-5 mr-3\"></i> ${config.label}\n                </a>\n            `;\n        }\n\n        function loadPage(pageUrl, element) {\n            if (element) {\n                document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));\n                element.classList.add('active');\n            }\n            const frame = document.getElementById('contentFrame');\n            const dashboardView = document.getElementById('dashboard-view');\n\n            if (pageUrl === 'dashboard_home') {\n                dashboardView.classList.remove('hidden');\n                frame.classList.add('hidden');\n                document.getElementById('welcomeArea').innerText = 'Dashboard';\n            } else {\n                dashboardView.classList.add('hidden');\n                frame.classList.remove('hidden');\n                frame.src = pageUrl;\n                const key = Object.keys(sidebarConfig).find(k => sidebarConfig[k].page === pageUrl);\n                if(key) document.getElementById('welcomeArea').innerText = sidebarConfig[key].label;\n            }\n        }\n\n        function parseCountPayload(payload) {\n            if (Array.isArray(payload)) return payload.length;\n            if (Array.isArray(payload?.data)) return payload.data.length;\n            if (Array.isArray(payload?.items)) return payload.items.length;\n            if (Array.isArray(payload?.visits)) return payload.visits.length;\n            if (Array.isArray(payload?.tenants)) return payload.tenants.length;\n            if (Array.isArray(payload?.complaints)) return payload.complaints.length;\n            if (typeof payload?.count === 'number') return payload.count;\n            if (typeof payload?.total === 'number') return payload.total;\n            if (typeof payload?.totalCount === 'number') return payload.totalCount;\n            return 0;\n        }\n\n        async function getCountFromApi(path) {\n            try {\n                const res = await fetch(`${API_URL}${path}`);\n                if (!res.ok) return 0;\n                const data = await res.json().catch(() => ({}));\n                return parseCountPayload(data);\n            } catch (_) {\n                return 0;\n            }\n        }\n\n        function renderDashboardWidgets() {\n            const grid = document.getElementById('dashboardWidgetGrid');\n            if (!grid) return;\n\n            const cards = [\n                { id: 'properties', page: 'properties.html', label: 'Properties', desc: 'Manage Listings', icon: 'home', color: 'blue', countId: 'widgetPropertiesCount' },\n                { id: 'tenants', page: 'tenant.html', label: 'Tenants', desc: 'Active Residents', icon: 'users', color: 'green', countId: 'widgetTenantsCount' },\n                { id: 'complaint_history', page: 'complaint-history.html', label: 'Complaints', desc: 'View Issues', icon: 'alert-circle', color: 'red', countId: 'widgetComplaintsCount' },\n                { id: 'visits', page: 'visit.html', label: 'Visit Reports', desc: 'Total Visit Reports', icon: 'clipboard-list', color: 'purple', countId: 'widgetVisitsCount' }\n            ].filter(card => allowedModules.includes(card.id));\n\n            grid.innerHTML = cards.map(card => `\n                <div class=\"bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer\"\n                     onclick=\"loadPage('${card.page}', null)\">\n                    <div class=\"flex items-center gap-4\">\n                        <div class=\"p-3 bg-${card.color}-50 rounded-lg text-${card.color}-600\">\n                            <i data-lucide=\"${card.icon}\" class=\"w-6 h-6\"></i>\n                        </div>\n                        <div>\n                            <h3 class=\"font-bold text-slate-800\">${card.label}</h3>\n                            <p class=\"text-xs text-gray-500\">${card.desc}</p>\n                            <p id=\"${card.countId}\" class=\"text-sm font-semibold text-slate-700 mt-1\">0</p>\n                        </div>\n                    </div>\n                </div>\n            `).join('');\n\n            lucide.createIcons();\n        }\n\n        async function loadDashboardWidgetCounts() {\n            if (allowedModules.includes('properties')) {\n                const propertyEl = document.getElementById('widgetPropertiesCount');\n                const statsEl = document.getElementById('totalPropertiesCountArea');\n                if (propertyEl) {\n                    const value = (statsEl && statsEl.innerText && statsEl.innerText !== '-') ? statsEl.innerText : String(await getCountFromApi('/api/properties'));\n                    propertyEl.innerText = value;\n                }\n            }\n\n            if (allowedModules.includes('tenants')) {\n                const tenantEl = document.getElementById('widgetTenantsCount');\n                if (tenantEl) tenantEl.innerText = String(await getCountFromApi('/api/tenants'));\n            }\n\n            if (allowedModules.includes('complaint_history')) {\n                const complaintsEl = document.getElementById('widgetComplaintsCount');\n                if (complaintsEl) complaintsEl.innerText = String(await getCountFromApi('/api/complaints'));\n            }\n\n            if (allowedModules.includes('visits')) {\n                const visitsEl = document.getElementById('widgetVisitsCount');\n                let visitCount = await getCountFromApi('/api/visits');\n                if (!visitCount) {\n                    try {\n                        const localVisits = JSON.parse(localStorage.getItem('roomhy_visit_reports') || '[]');\n                        visitCount = Array.isArray(localVisits) ? localVisits.length : 0;\n                    } catch (_) {}\n                }\n                if (visitsEl) visitsEl.innerText = String(visitCount || 0);\n            }\n        }\n\n        document.addEventListener('DOMContentLoaded', () => {\n            const nav = document.getElementById('dynamicSidebarNav');\n            let html = '';\n\n            // 1. Dashboard\n            html += createLink('dashboard');\n\n            // 2. Management - Show: Properties, Tenants, Owners, Visits, Bookings, Location, Enquiries\n            const mgmt = ['teams', 'owners', 'properties', 'tenants', 'new_signups', 'visits'];\n            if(mgmt.some(id => allowedModules.includes(id))) {\n                html += `<div class=\"px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4\">Management</div>`;\n                mgmt.forEach(id => html += createLink(id));\n            }\n\n            // 3. Finance - Show: Payments\n            const fin = ['rent_collections', 'commissions', 'refunds'];\n            if(fin.some(id => allowedModules.includes(id))) {\n                html += `<div class=\"px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4\">Finance</div>`;\n                fin.forEach(id => html += createLink(id));\n            }\n\n            // 4. System - Show: Chat, Reports\n            const sys = ['web_enquiry', 'enquiries', 'bookings', 'reviews', 'complaint_history', 'live_properties', 'locations'];\n            if(sys.some(id => allowedModules.includes(id))) {\n                html += `<div class=\"px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4\">System</div>`;\n                sys.forEach(id => html += createLink(id));\n            }\n\n            // 5. Account - Always show Profile (add to sidebarConfig if needed)\n            html += `<div class=\"px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4\">Account</div>`;\n            html += `<a href=\"profile.html\" class=\"sidebar-link\"><i data-lucide=\"user\" class=\"w-5 h-5 mr-3\"></i> Profile</a>`;\n            html += `<a href=\"settings.html\" class=\"sidebar-link\"><i data-lucide=\"settings\" class=\"w-5 h-5 mr-3\"></i> Settings</a>`;\n\n            nav.innerHTML = html;\n            const mobileNav = document.getElementById('mobileSidebarNav');\n            if (mobileNav) mobileNav.innerHTML = html;\n            lucide.createIcons();\n\n            // Header Info\n            document.getElementById('roleLabel').innerText = user.role === 'areamanager' ? 'AREA ADMIN' : 'TEAM MEMBER';\n            document.getElementById('headerRole').innerText = user.role === 'employee' ? (user.team || 'Employee') : 'Area Manager'; \n            document.getElementById('headerName').innerText = user.name;\n            document.getElementById('welcomeName').innerText = user.name;\n            \n            // Area Badge Logic (The Request)\n            // If area is assigned, show it. Else show role/team.\n            // We check 'area' (from manager.html) and 'areaName' (legacy)\n            const assignedArea = user.area || user.areaName; \n            \n            if (assignedArea && assignedArea !== 'Unassigned' && assignedArea !== 'Select Area' && assignedArea !== '') {\n                // Show Area + City if available\n                const display = user.city ? `${assignedArea}, ${user.city}` : assignedArea;\n                document.getElementById('headerAreaBadge').innerText = display;\n            } else {\n                // Fallback for central team members (e.g. HR, Accounts)\n                document.getElementById('headerAreaBadge').innerText = user.team || 'Head Office'; \n            }\n\n            // Hide salary for employees\n            if(user.role === 'employee') document.getElementById('salaryBadge').style.display = 'none';\n\n            renderDashboardWidgets();\n            loadDashboardWidgetCounts();\n            \n            // Load and display profile photo from employee data\n            try {\n                const employees = JSON.parse(localStorage.getItem('roomhy_employees') || '[]');\n                const currentEmp = employees.find(e => e.loginId === user.loginId);\n                if (currentEmp && currentEmp.photoDataUrl) {\n                    // Use stored profile photo\n                    const profileImg = document.querySelector('header img[alt=\"User\"]');\n                    if (profileImg) profileImg.src = currentEmp.photoDataUrl;\n                } else if (currentEmp) {\n                    // Generate avatar with initials\n                    const initials = currentEmp.name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '--';\n                    const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'];\n                    const colorIdx = currentEmp.loginId.charCodeAt(0) % colors.length;\n                    const profileImg = document.querySelector('header img[alt=\"User\"]');\n                    if (profileImg) {\n                        profileImg.style.display = 'none';\n                        const avatar = document.createElement('div');\n                        avatar.className = `w-8 h-8 rounded-full ${colors[colorIdx]} flex items-center justify-center text-white text-xs font-bold border border-slate-200`;\n                        avatar.innerText = initials;\n                        profileImg.parentNode.insertBefore(avatar, profileImg);\n                    }\n                }\n            } catch (err) {\n                console.warn('Failed to load employee profile photo:', err);\n            }\n            \n            // Iframe Cleaner\n            const frame = document.getElementById('contentFrame');\n            frame.addEventListener('load', function() {\n                try {\n                    const innerDoc = frame.contentDocument || frame.contentWindow.document;\n                    const innerSidebar = innerDoc.querySelector('.sidebar');\n                    if(innerSidebar) innerSidebar.style.display = 'none';\n                    const innerHeader = innerDoc.querySelector('header');\n                    if(innerHeader) innerHeader.style.display = 'none';\n                    const innerMobile = innerDoc.getElementById('mobile-menu-open');\n                    if(innerMobile) innerMobile.style.display = 'none';\n                } catch (e) {}\n            });\n        });"
  },
  {
    "content": "document.getElementById('logoutBtn').addEventListener('click', (e) => {\n            e.preventDefault();\n            localStorage.removeItem('user');\n            localStorage.removeItem('manager_user');\n            safeRedirect('../index.html');\n        });"
  },
  {
    "src": "/superadmin/assets/js/areaadmin.js"
  }
];
const htmlAttrs = {
  "lang": "en"
};
const bodyAttrs = {
  "class": "text-slate-800"
};
const bodyHtml = `<div class="flex h-screen overflow-hidden">
        <!-- Sidebar -->
        <aside class="sidebar w-72 flex-shrink-0 hidden md:flex flex-col z-20 overflow-y-auto custom-scrollbar">
            <div class="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
                 <div class="flex items-center gap-3">
                     
                     <div><img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" class="h-16 w-auto"><span class="text-[10px] text-gray-500 font-medium tracking-wider" id="roleLabel">AREA ADMIN</span></div>
                 </div>
            </div>
            <!-- Dynamic Sidebar -->
            <nav class="flex-1 py-6 space-y-1" id="dynamicSidebarNav">
                <!-- Javascript fills this -->
            </nav>
        </aside>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
            <!-- Header -->
            <header class="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10 border-b border-gray-200">
                <div class="flex items-center">
                    <button id="mobile-menu-open" class="md:hidden mr-4 text-slate-500"><i data-lucide="menu" class="w-6 h-6"></i></button>
                    <div class="flex items-center text-sm">
                        <!-- THIS IS THE BADGE THAT UPDATES DYNAMICALLY - SHOWING JUST THE AREA/TEAM NAME -->
                        <span id="headerAreaBadge" class="px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-bold uppercase tracking-wide">Loading...</span>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="relative group">
                        <button class="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-full transition-colors">
                            <img src="https://i.pravatar.cc/150?u=emp" alt="User" class="w-8 h-8 rounded-full border border-slate-200">
                            <div class="text-left hidden sm:block">
                                <p class="text-xs font-semibold text-gray-700" id="headerName">User</p>
                                <p class="text-[10px] text-gray-500" id="headerRole">Role</p>
                            </div>
                            <i data-lucide="chevron-down" class="w-3 h-3 text-gray-400 hidden sm:block"></i>
                        </button>
                        <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-50">
                            <a href="#" id="logoutBtn" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Logout</a>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Dashboard Content Area -->
            <div class="flex-1 overflow-hidden relative">
                
                <!-- 1. Dashboard View (Default) -->
                <main id="dashboard-view" class="h-full overflow-y-auto p-4 md:p-8">
                    <div class="max-w-[1600px] mx-auto">
                        
                        <div class="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                            <div>
                                <h1 class="text-2xl font-bold text-slate-800">Welcome, <span id="welcomeName">User</span>!</h1>
                                <p class="text-sm text-slate-500 mt-1">Accessing <span id="welcomeArea" class="font-semibold text-purple-600">Dashboard</span>.</p>
                            </div>
                                <!-- Area Stats Row (populated from /api/admin/stats?areaCode=...) -->
                                <div id="areaStatsRow" class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                                    <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                                        <p class="text-sm text-gray-500">Total Properties</p>
                                        <h3 id="totalPropertiesCountArea" class="text-2xl font-bold text-slate-800">-</h3>
                                    </div>
                                    <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                                        <p class="text-sm text-gray-500">Pending Approvals</p>
                                        <h3 id="pendingApprovalsCountArea" class="text-2xl font-bold text-slate-800">-</h3>
                                    </div>
                                    <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                                        <p class="text-sm text-gray-500">Active Owners</p>
                                        <h3 id="activeOwnersCountArea" class="text-2xl font-bold text-slate-800">-</h3>
                                    </div>
                                </div>
                            <div id="salaryBadge" class="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-right hidden md:block">
                                <p class="text-xs text-gray-500 uppercase font-semibold tracking-wider">Current Salary</p>
                                <p class="text-lg font-bold text-green-600">&#8377; --</p>
                            </div>
                        </div>

                        <!-- Dynamic Widgets -->
                        <div id="dashboardWidgetGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
                        <div class="mt-8 p-8 bg-white rounded-xl border border-gray-200 text-center">
                            <h3 class="text-lg font-medium text-gray-800">Select a module from the sidebar</h3>
                            <p class="text-gray-500 text-sm mt-1">Your access is limited to the specific permissions assigned to your Team role.</p>
                        </div>

                    </div>
                </main>

                <!-- 2. Iframe View (Hidden by default) -->
                <iframe id="contentFrame" class="hidden" src=""></iframe>
            </div>
        </div>
        
        <!-- Mobile Sidebar Overlay -->
        <div id="mobile-sidebar-overlay" class="fixed inset-0 bg-black/50 z-30 hidden md:hidden backdrop-blur-sm"></div>
        <aside id="mobile-sidebar" class="fixed inset-y-0 left-0 w-72 bg-[#111827] z-40 transform -translate-x-full transition-transform duration-300 md:hidden flex flex-col overflow-y-auto">
             <div class="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
                 <div class="flex items-center gap-3">
                     
                     <div><img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" class="h-16 w-auto"><span class="text-[10px] text-gray-500 font-medium tracking-wider">AREA ADMIN</span></div>
                 </div>
                 <button id="mobile-sidebar-close" class="md:hidden ml-auto p-2 text-gray-400 hover:text-white" aria-label="Close menu">
                     <i data-lucide="x" class="w-5 h-5"></i>
                 </button>
             </div>
             <nav id="mobileSidebarNav" class="flex-1 py-6 space-y-1">
            </nav>
        </aside>
    </div>`;

export default function SuperadminAreaadminPage() {
  useHeadAssets({ title, metas, links, scripts, htmlAttrs, bodyAttrs });
  return (
    <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
  );
}
