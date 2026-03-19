import { useHeadAssets } from "../../utils/useHeadAssets.js";
import { useTailwindProcessor } from "../../utils/useTailwindProcessor.js";

const title = "Roomhy - Super Admin Dashboard";
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
    "rel": "preconnect",
    "href": "https://fonts.googleapis.com"
  },
  {
    "rel": "preconnect",
    "href": "https://fonts.gstatic",
    "crossorigin": true
  },
  {
    "href": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
    "rel": "stylesheet"
  },
  {
    "rel": "stylesheet",
    "href": "/superadmin/assets/css/superadmin.css"
  }
];
const scripts = [
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
    "content": "const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')\r\n            ? 'http://localhost:5001'\r\n            : 'https://api.roomhy.com';\r\n\r\n        // --- Sidebar Submenu Toggle ---\r\n        function toggleSubmenu(id, element) {\r\n            const submenu = document.getElementById(id);\r\n            const chevron = element.querySelector('.lucide-chevron-down');\r\n            \r\n            // Close all other submenus first\r\n            document.querySelectorAll('.submenu').forEach(sub => {\r\n                if(sub.id !== id) sub.classList.remove('open');\r\n            });\r\n            document.querySelectorAll('.lucide-chevron-down').forEach(ch => {\r\n                if(ch !== chevron) ch.style.transform = 'rotate(0deg)';\r\n            });\r\n\r\n            if (submenu.classList.contains('open')) {\r\n                submenu.classList.remove('open');\r\n                chevron.style.transform = 'rotate(0deg)';\r\n            } else {\r\n                submenu.classList.add('open');\r\n                chevron.style.transform = 'rotate(180deg)';\r\n            }\r\n        }\r\n\r\n        // --- Data Seeding & Loading ---\r\n        function initializeMockData() {\r\n            if (!localStorage.getItem('roomhy_tenants')) {\r\n                localStorage.setItem('roomhy_tenants', JSON.stringify([\r\n                    { name: \"Rahul Sharma\", role: \"tenant\", moveInDate: \"2024-10-20\", kycStatus: \"verified\" },\r\n                    { name: \"Priya Singh\", role: \"tenant\", moveInDate: \"2024-10-22\", kycStatus: \"pending\" },\r\n                    { name: \"Amit Patel\", role: \"tenant\", moveInDate: \"2024-10-25\", kycStatus: \"verified\" }\r\n                ]));\r\n            }\r\n            if (!localStorage.getItem('roomhy_owners_db')) {\r\n                const mockOwners = {\r\n                    \"OWNER001\": { profile: { name: \"Vijay Khanna\" }, properties: [{}, {}] },\r\n                    \"OWNER002\": { profile: { name: \"Anil Kapoor\" }, properties: [{}] }\r\n                };\r\n                localStorage.setItem('roomhy_owners_db', JSON.stringify(mockOwners));\r\n            }\r\n            if (!localStorage.getItem('roomhy_properties')) {\r\n                localStorage.setItem('roomhy_properties', JSON.stringify([\r\n                    { name: \"Green View Villa\", owner: \"Vijay Khanna\", area: \"Koramangala\" },\r\n                    { name: \"Skyline Heights\", owner: \"Anil Kapoor\", area: \"Indiranagar\" }\r\n                ]));\r\n            }\r\n        }\r\n\r\n        function loadDashboard() {\r\n            const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');\r\n            const ownersDB = JSON.parse(localStorage.getItem('roomhy_owners_db') || '{}');\r\n            const properties = JSON.parse(localStorage.getItem('roomhy_properties') || '[]');\r\n            \r\n            document.getElementById('stat-tenants').innerText = tenants.length;\r\n            document.getElementById('stat-properties').innerText = properties.length;\r\n            document.getElementById('stat-owners').innerText = Object.keys(ownersDB).length;\r\n            \r\n            // Calculate revenue from bookings\r\n            calculateRevenue();\r\n\r\n            const signupList = document.getElementById('recent-signups-list');\r\n            const recent = tenants.slice(-5).reverse();\r\n            if (recent.length > 0) {\r\n                signupList.innerHTML = recent.map(user => `\r\n                    <tr class=\"hover:bg-slate-50 transition-colors\">\r\n                        <td class=\"px-6 py-4\">\r\n                            <div class=\"flex items-center gap-3\">\r\n                                <div class=\"w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs\">\r\n                                    ${user.name[0]}\r\n                                </div>\r\n                                <span class=\"text-sm font-bold text-slate-700\">${user.name}</span>\r\n                            </div>\r\n                        </td>\r\n                        <td class=\"px-6 py-4 text-sm text-slate-500 capitalize\">${user.role}</td>\r\n                        <td class=\"px-6 py-4 text-sm text-slate-500\">${user.moveInDate || 'Today'}</td>\r\n                        <td class=\"px-6 py-4\">\r\n                            <span class=\"px-2 py-1 rounded-full text-[10px] font-bold ${user.kycStatus === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} uppercase\">\r\n                                ${user.kycStatus || 'pending'}\r\n                            </span>\r\n                        </td>\r\n                        <td class=\"px-6 py-4 text-right\">\r\n                            <button class=\"text-slate-400 hover:text-purple-600\"><i data-lucide=\"eye\" class=\"w-4 h-4\"></i></button>\r\n                        </td>\r\n                    </tr>\r\n                `).join('');\r\n            } else {\r\n                signupList.innerHTML = '<tr><td colspan=\"5\" class=\"px-6 py-8 text-center text-slate-400\">No recent signups found</td></tr>';\r\n            }\r\n            renderCharts();\r\n            lucide.createIcons();\r\n        }\r\n\r\n                // Calculate platform revenue from live rent + commission data\r\n        async function calculateRevenue() {\r\n            try {\r\n                let rents = [];\r\n                try {\r\n                    const response = await fetch(`${API_URL}/api/rents`);\r\n                    if (response.ok) {\r\n                        const data = await response.json();\r\n                        rents = data.rents || data || [];\r\n                        console.log('Rents fetched from DB:', rents.length);\r\n                    } else {\r\n                        console.warn('Failed to fetch rents from API');\r\n                    }\r\n                } catch (e) {\r\n                    console.warn('Could not fetch rents from API:', e.message);\r\n                }\r\n\r\n                let totalBookingAmount = 0;\r\n                let platformCommission = 0;\r\n                let serviceFee = 0;\r\n                const monthBuckets = {};\r\n\r\n                rents.forEach((rent) => {\r\n                    const rentAmount = Number(rent.rentAmount || rent.totalDue || 0);\r\n                    const commission = Number(rent.commissionAmount || (rentAmount * 0.10));\r\n                    const fee = Number(rent.serviceFeeAmount || 50);\r\n                    const month = (rent.collectionMonth || '').trim() || 'Unknown';\r\n\r\n                    totalBookingAmount += rentAmount;\r\n                    platformCommission += commission;\r\n                    serviceFee += fee;\r\n                    monthBuckets[month] = (monthBuckets[month] || 0) + commission + fee;\r\n                });\r\n\r\n                const netRevenue = platformCommission + serviceFee;\r\n                const months = Object.keys(monthBuckets).sort().slice(-6);\r\n                if (window.revenueChartInstance && months.length) {\r\n                    window.revenueChartInstance.data.labels = months;\r\n                    window.revenueChartInstance.data.datasets[0].data = months.map((m) => Math.round(monthBuckets[m]));\r\n                    window.revenueChartInstance.update();\r\n                }\r\n\r\n                document.getElementById('booking-amount').innerText = '?' + totalBookingAmount.toLocaleString();\r\n                document.getElementById('platform-commission').innerText = '?' + platformCommission.toLocaleString();\r\n                document.getElementById('service-fee').innerText = '?' + serviceFee.toLocaleString();\r\n                document.getElementById('net-revenue').innerText = '?' + netRevenue.toLocaleString();\r\n                document.getElementById('stat-revenue').innerText = '?' + netRevenue.toLocaleString();\r\n\r\n                console.log(`Revenue calculated: Total=${totalBookingAmount}, Net=${netRevenue}`);\r\n            } catch (error) {\r\n                console.error('Error calculating revenue:', error);\r\n            }\r\n        }\r\n\r\n        function renderCharts() {\r\n            const revCtx = document.getElementById('revenueChart').getContext('2d');\r\n            window.revenueChartInstance = new Chart(revCtx, {\r\n                type: 'line',\r\n                data: {\r\n                    labels: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],\r\n                    datasets: [{\r\n                        label: 'Revenue (?)',\r\n                        data: [120000, 190000, 170000, 250000, 310000, 425000],\r\n                        borderColor: '#a855f7',\r\n                        tension: 0.4,\r\n                        fill: true,\r\n                        backgroundColor: 'rgba(168, 85, 247, 0.1)',\r\n                        pointRadius: 4,\r\n                        pointBackgroundColor: '#a855f7'\r\n                    }]\r\n                },\r\n                options: { \r\n                    responsive: true, \r\n                    maintainAspectRatio: false,\r\n                    plugins: { legend: { display: false } },\r\n                    scales: {\r\n                        y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },\r\n                        x: { grid: { display: false }, ticks: { font: { size: 10 } } }\r\n                    }\r\n                }\r\n            });\r\n\r\n            const distCtx = document.getElementById('userDistChart').getContext('2d');\r\n            new Chart(distCtx, {\r\n                type: 'doughnut',\r\n                data: {\r\n                    labels: ['Tenants', 'Owners', 'Staff'],\r\n                    datasets: [{\r\n                        data: [65, 25, 10],\r\n                        backgroundColor: ['#a855f7', '#3b82f6', '#f59e0b'],\r\n                        borderWidth: 0\r\n                    }]\r\n                },\r\n                options: { \r\n                    responsive: true, \r\n                    maintainAspectRatio: false,\r\n                    cutout: '70%',\r\n                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } }\r\n                }\r\n            });\r\n        }\r\n\r\n        // --- Header Population ---\r\n        function populateHeader() {\r\n            const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('admin_user') || '{}');\r\n\r\n            const avatarElement = document.getElementById('admin-avatar-header');\r\n            if (user.name && avatarElement) {\r\n                avatarElement.src = `https://i.pravatar.cc/150?u=${encodeURIComponent(user.name)}`;\r\n            }\r\n        }\r\n\r\n        document.addEventListener('DOMContentLoaded', () => {\r\n            initializeMockData();\r\n            populateHeader();\r\n            loadDashboard();\r\n            lucide.createIcons();\r\n            \r\n            // Mobile sidebar toggle\r\n        });"
  },
  {
    "src": "/superadmin/js/SuperAdminNotificationManager.js"
  },
  {
    "src": "/superadmin/assets/js/superadmin.js"
  },
  {
    "content": "// Trigger Tailwind CSS to process dynamically added content\nif (window.tailwind) {\n  setTimeout(() => {\n    if (window.tailwind.config && window.tailwind.config._()) {\n      console.log('Tailwind CSS reprocessed');\n    }\n  }, 100);\n}\n// Also try postcss or just force a reflow to trigger Tailwind\nsetTimeout(() => {\n  document.documentElement.style.opacity = '1';\n}, 50);"
  }
];
const htmlAttrs = {
  "lang": "en"
};
const bodyAttrs = {
  "class": "text-slate-800"
};
const bodyHtml = `<!-- Mobile Overlay -->
    <div id="mobile-sidebar-overlay" class="fixed inset-0 bg-black/50 z-30 hidden md:hidden"></div>
    
    <div class="flex h-screen overflow-hidden">
                <!-- Sidebar -->
        <aside id="mobile-sidebar" class="sidebar w-72 flex-shrink-0 hidden md:flex flex-col z-20 overflow-y-auto custom-scrollbar fixed md:static inset-y-0 left-0 transform -translate-x-full md:translate-x-0 transition-transform duration-300">
            <div class="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
                 <div class="flex items-center gap-3">
                     
                     <div><img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" class="h-16 w-auto"><span class="text-[10px] text-gray-500">SUPER ADMIN</span></div>
                 </div>
                 <button id="mobile-sidebar-close" class="md:hidden ml-auto p-2 text-gray-400 hover:text-white">
                     <i data-lucide="x" class="w-5 h-5"></i>
                 </button>
            </div>
            <nav class="flex-1 py-6 space-y-1">
                <div class="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Overview</div>
                <a href="/superadmin/superadmin" class="sidebar-link"><i data-lucide="layout-dashboard" class="w-5 h-5 mr-3"></i> Dashboard</a>
                <div class="mt-6 px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Management</div>
                <a href="/superadmin/manager" class="sidebar-link"><i data-lucide="map-pin" class="w-5 h-5 mr-3"></i> Teams</a>
                <a href="/superadmin/owner" class="sidebar-link"><i data-lucide="briefcase" class="w-5 h-5 mr-3"></i> Property Owners</a>
                <a href="/superadmin/properties" class="sidebar-link"><i data-lucide="home" class="w-5 h-5 mr-3"></i> Properties</a>
                <a href="/superadmin/tenant" class="sidebar-link"><i data-lucide="users" class="w-5 h-5 mr-3"></i> Tenants</a>
                <a href="/superadmin/new_signups" class="sidebar-link"><i data-lucide="file-badge" class="w-5 h-5 mr-3"></i> New Signups</a>
                <div class="mt-6 px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Operations</div>
                <a href="/superadmin/websiteenq" class="sidebar-link"><i data-lucide="folder-open" class="w-5 h-5 mr-3"></i> Web Enquiry</a>
                <a href="/superadmin/enquiry" class="sidebar-link"><i data-lucide="help-circle" class="w-5 h-5 mr-3"></i> Enquiries</a>
                <a href="/superadmin/booking" class="sidebar-link"><i data-lucide="calendar-check" class="w-5 h-5 mr-3"></i> Bookings</a>
                <a href="/superadmin/reviews" class="sidebar-link"><i data-lucide="star" class="w-5 h-5 mr-3"></i> Reviews</a>
                <a href="/superadmin/complaint-history" class="sidebar-link"><i data-lucide="alert-circle" class="w-5 h-5 mr-3"></i> Complaint History</a>
                <div class="mt-6 px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Website</div>
                <a href="/superadmin/website" class="sidebar-link"><i data-lucide="globe" class="w-5 h-5 mr-3"></i> Live Properties</a>
                <div class="mt-6 px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Finance</div>
                <div class="group">
                    <div class="sidebar-link justify-between" onclick="toggleSubmenu('finance-submenu', this)">
                        <div class="flex items-center"><i data-lucide="wallet" class="w-5 h-5 mr-3"></i> Finance</div>
                        <i data-lucide="chevron-down" class="w-4 h-4 transition-transform duration-200"></i>
                    </div>
                    <div id="finance-submenu" class="submenu">
                        <a href="/superadmin/rentcollection" class="sidebar-link text-sm hover:text-white">Rent Collections</a>
                        <a href="/superadmin/platform" class="sidebar-link text-sm hover:text-white">Commissions</a>
                        <a href="/superadmin/refund" class="sidebar-link text-sm hover:text-white">Refunds</a>
                    </div>
                </div>
                <div class="mt-6 px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">System</div>
                 <a href="/superadmin/location" class="sidebar-link"><i data-lucide="globe" class="w-5 h-5 mr-3"></i> Locations</a>
            </nav>
        </aside>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
            <!-- Top Header -->
            <header class="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
                <div class="flex items-center">
                    <button id="mobile-menu-open" class="md:hidden mr-4 text-slate-500">
                        <i data-lucide="menu" class="w-6 h-6"></i>
                    </button>
                    <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        Platform Dashboard <span class="text-gray-400">/</span> <span class="text-purple-600">Overview</span>
                    </h2>
                </div>
                <div class="flex items-center gap-4">
                    <!-- Notification Bell with Badge -->
    <div class="relative">
        <button id="notificationBellBtn" class="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-lg transition-colors">
            <i data-lucide="bell" class="w-5 h-5"></i>
            <span id="notificationBadge" class="hidden absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">0</span>
        </button>
        
        <!-- Notification Dropdown -->
        <div id="notificationDropdown" class="hidden absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg py-2 ring-1 ring-black ring-opacity-5 z-50">
            <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 class="font-semibold text-gray-800">Notifications</h3>
                <div class="flex gap-2">
                    <button onclick="markAllRead()" class="text-xs text-purple-600 hover:text-purple-800">Mark all read</button>
                    <button onclick="clearAll()" class="text-xs text-gray-400 hover:text-gray-600">Clear</button>
                </div>
            </div>
            <div id="notificationList" class="max-h-96 overflow-y-auto custom-scrollbar">
                <div class="px-4 py-8 text-center text-gray-400">
                    <i data-lucide="bell-off" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                    <p>No notifications yet</p>
                    <button id="enable-notifications-btn" onclick="requestNotificationPermission()" class="mt-3 text-purple-600 hover:text-purple-800 text-sm font-medium">
                        Enable Notifications
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <span class="w-8 h-8 rounded-full border border-slate-200 bg-purple-600 text-white flex items-center justify-center font-bold">SA</span>
                </div>
            </header>

            <!-- Dashboard Content -->
            <main class="flex-1 overflow-y-auto p-6 md:p-8">
                <div class="max-w-7xl mx-auto">
                    <!-- Page Header -->
                    <div class="mb-8">
                        <h1 class="text-2xl font-bold text-slate-800">Platform Overview</h1>
                        <p class="text-sm text-slate-500 mt-1">Real-time performance metrics and platform growth statistics.</p>
                    </div>

                    <!-- Stats Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                            <div class="flex items-center justify-between mb-4">
                                <div class="p-2 bg-purple-50 text-purple-600 rounded-lg"><i data-lucide="users" class="w-6 h-6"></i></div>
                                <span class="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">+12%</span>
                            </div>
                            <h3 class="text-slate-500 text-sm font-medium">Total Tenants</h3>
                            <p id="stat-tenants" class="text-2xl font-bold text-slate-800">0</p>
                        </div>
                        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                            <div class="flex items-center justify-between mb-4">
                                <div class="p-2 bg-blue-50 text-blue-600 rounded-lg"><i data-lucide="home" class="w-6 h-6"></i></div>
                                <span class="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-full">Active</span>
                            </div>
                            <h3 class="text-slate-500 text-sm font-medium">Total Properties</h3>
                            <p id="stat-properties" class="text-2xl font-bold text-slate-800">0</p>
                        </div>
                        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                            <div class="flex items-center justify-between mb-4">
                                <div class="p-2 bg-orange-50 text-orange-600 rounded-lg"><i data-lucide="briefcase" class="w-6 h-6"></i></div>
                                <span class="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-full">Owners</span>
                            </div>
                            <h3 class="text-slate-500 text-sm font-medium">Property Owners</h3>
                            <p id="stat-owners" class="text-2xl font-bold text-slate-800">0</p>
                        </div>
                        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                            <div class="flex items-center justify-between mb-4">
                                <div class="p-2 bg-green-50 text-green-600 rounded-lg"><i data-lucide="indian-rupee" class="w-6 h-6"></i></div>
                                <span class="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">Monthly</span>
                            </div>
                            <h3 class="text-slate-500 text-sm font-medium">Platform Revenue</h3>
                            <p id="stat-revenue" class="text-2xl font-bold text-slate-800">&#8377;0</p>
                            
                            <!-- Revenue Breakdown -->
                            <div id="revenue-breakdown" class="mt-4 pt-4 border-t border-gray-100 space-y-2">
                                <div class="flex justify-between text-xs">
                                    <span class="text-gray-500">Booking Amount</span>
                                    <span id="booking-amount" class="font-medium">&#8377;0</span>
                                </div>
                                <div class="flex justify-between text-xs">
                                    <span class="text-gray-500">Platform Commission (10%)</span>
                                    <span id="platform-commission" class="font-medium text-purple-600">&#8377;0</span>
                                </div>
                                <div class="flex justify-between text-xs">
                                    <span class="text-gray-500">Service Fee (5%)</span>
                                    <span id="service-fee" class="font-medium text-blue-600">&#8377;0</span>
                                </div>
                                <div class="flex justify-between text-sm font-semibold pt-2 border-t border-gray-100">
                                    <span>Net Revenue</span>
                                    <span id="net-revenue" class="text-green-600">&#8377;0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Charts Row -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div class="flex justify-between items-center mb-6">
                                <h3 class="text-lg font-bold text-slate-800">Revenue Growth</h3>
                                <select class="text-xs border-gray-300 rounded p-1">
                                    <option>Last 6 Months</option>
                                    <option>Last Year</option>
                                </select>
                            </div>
                            <div class="h-64"><canvas id="revenueChart"></canvas></div>
                        </div>
                        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div class="flex justify-between items-center mb-6">
                                <h3 class="text-lg font-bold text-slate-800">User Distribution</h3>
                                <button class="text-xs text-purple-600 font-bold hover:underline">Download CSV</button>
                            </div>
                            <div class="h-64 flex items-center justify-center">
                                <div class="w-full h-full max-w-[250px]"><canvas id="userDistChart"></canvas></div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activity Section -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 class="text-lg font-bold text-slate-800">Recent Signups</h3>
                            <a href="/superadmin/superadmin/new_signups" class="text-purple-600 text-sm font-bold hover:underline">View All</a>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left">
                                <thead class="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th class="px-6 py-3">User</th>
                                        <th class="px-6 py-3">Role</th>
                                        <th class="px-6 py-3">Date</th>
                                        <th class="px-6 py-3">Status</th>
                                        <th class="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="recent-signups-list" class="divide-y divide-gray-100">
                                    <!-- Populated by JS -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    
    
    <!-- Notification System -->`;

export default function SuperadminSuperadminPage() {
  useHeadAssets({ title, metas, links, scripts, htmlAttrs, bodyAttrs });
  useTailwindProcessor();
  
  return (
    <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
  );
}
