import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useLegacySidebar } from "../../utils/legacyUi";

export default function Log() {
  useHtmlPage({
    title: "Roomhy - Login Logs",
    bodyClass: "text-slate-800",
    htmlAttrs: {
  "lang": "en"
},
    metas: [
  {
  "charset": "UTF-8"
},
  {
  "name": "viewport",
  "content": "width=device-width, initial-scale=1.0"
}
],
    bases: [],
    links: [
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
  "href": "/superadmin/assets/css/log.css"
}
],
    styles: [],
    scripts: [
  {
  "src": "https://cdn.tailwindcss.com"
},
  {
  "src": "https://unpkg.com/lucide@latest"
}
],
    inlineScripts: []
  });

  useLegacySidebar();

  return (
    <div className="html-page" dangerouslySetInnerHTML={{ __html: `
<div class="flex h-screen overflow-hidden">
               <!-- Sidebar -->
        <aside class="sidebar w-72 flex-shrink-0 hidden md:flex flex-col z-20 overflow-y-auto custom-scrollbar">
            <div class="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
                 <div class="flex items-center gap-3">
                     
                     <div><img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" class="h-16 w-auto"><span class="text-[10px] text-gray-500">SUPER ADMIN</span></div>
                 </div>
            </div>
            <nav id="dynamicSidebarNav" className="flex-1 py-6 space-y-1"></nav>
        </aside>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
            <!-- Top Header -->
            <header class="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
                <div class="flex items-center">
                    <button id="mobile-menu-open" class="md:hidden mr-4 text-slate-500"><i data-lucide="menu" class="w-6 h-6"></i></button>
                    <div class="flex items-center text-sm">
                        <span class="text-slate-500 font-medium">System Settings</span>
                        <i data-lucide="chevron-right" class="w-4 h-4 mx-2 text-slate-400"></i>
                        <span class="text-slate-800 font-semibold">Logs</span>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <button class="text-slate-400 hover:text-slate-600"><i data-lucide="bell" class="w-5 h-5"></i></button>
                    <div class="relative group">
                        <button class="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-full transition-colors">
                            <div class="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold text-xs">SP</div>
                        </button>
                    </div>
                </div>
            </header>

            <!-- Scrollable Content -->
            <main class="flex-1 overflow-y-auto p-6 md:p-8">
                <div class="max-w-7xl mx-auto">
                    
                    <!-- Page Header -->
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 class="text-2xl font-bold text-slate-800">System Login Logs</h1>
                            <p class="text-sm text-slate-500 mt-1">Monitor user access, security alerts, and session history.</p>
                        </div>
                        
                        <div class="flex items-center gap-3">
                             <button class="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium shadow-sm flex items-center transition-all">
                                <i data-lucide="refresh-cw" class="w-4 h-4 mr-2"></i> Refresh
                            </button>
                            <button class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center shadow-sm transition-all">
                                <i data-lucide="download" class="w-4 h-4 mr-2"></i> Export Logs
                            </button>
                        </div>
                    </div>

                    <!-- Filters Toolbar -->
                    <div class="bg-white p-4 rounded-t-xl border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                        <!-- Search -->
                        <div class="relative w-full md:w-96">
                            <input type="text" placeholder="Search User, IP Address..." class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm">
                            <i data-lucide="search" class="w-4 h-4 text-gray-400 absolute left-3 top-3"></i>
                        </div>
                        
                        <!-- Filters -->
                        <div class="flex items-center gap-3 w-full md:w-auto flex-wrap md:flex-nowrap">
                            <select class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-600 min-w-[140px]">
                                <option value="">All Roles</option>
                                <option value="admin">Super Admin</option>
                                <option value="owner">Property Owner</option>
                                <option value="manager">Team</option>
                                <option value="tenant">Tenant</option>
                            </select>
                            
                            <select class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-600">
                                <option value="">Status</option>
                                <option value="success">Success</option>
                                <option value="failed">Failed Attempt</option>
                            </select>

                             <div class="relative flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white">
                                <i data-lucide="calendar" class="w-4 h-4 text-gray-400 mr-2"></i>
                                <span class="text-sm text-gray-600">Last 7 Days</span>
                            </div>
                        </div>
                    </div>

                    <!-- Table -->
                    <div class="bg-white rounded-b-xl shadow-sm overflow-hidden border border-gray-200 border-t-0">
                        <div class="overflow-x-auto">
                            <table class="w-full data-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Date & Time</th>
                                        <th>IP Address</th>
                                        <th>Device / Browser</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Log 1: Admin Success -->
                                    <tr>
                                        <td>
                                            <div class="flex items-center">
                                                <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs mr-3">AK</div>
                                                <div>
                                                    <p class="text-sm font-medium text-gray-900">Ajay Kumar</p>
                                                    <p class="text-xs text-gray-500">admin@roomhy.com</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span class="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-1 rounded">Super Admin</span></td>
                                        <td class="text-sm text-gray-600">Oct 24, 2025 " 10:30 AM</td>
                                        <td class="font-mono text-xs text-gray-500">192.168.1.45</td>
                                        <td class="text-sm text-gray-600"><i data-lucide="chrome" class="w-3 h-3 inline mr-1"></i> Chrome (Windows)</td>
                                        <td>
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Success
                                            </span>
                                        </td>
                                    </tr>

                                    <!-- Log 2: Owner Success -->
                                    <tr>
                                        <td>
                                            <div class="flex items-center">
                                                <img src="https://i.pravatar.cc/150?u=own1" class="w-8 h-8 rounded-full object-cover mr-3">
                                                <div>
                                                    <p class="text-sm font-medium text-gray-900">Rajesh Kumar</p>
                                                    <p class="text-xs text-gray-500">PO-BLR-089</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span class="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">Owner</span></td>
                                        <td class="text-sm text-gray-600">Oct 24, 2025 " 09:15 AM</td>
                                        <td class="font-mono text-xs text-gray-500">10.0.0.12</td>
                                        <td class="text-sm text-gray-600"><i data-lucide="smartphone" class="w-3 h-3 inline mr-1"></i> Safari (iPhone)</td>
                                        <td>
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Success
                                            </span>
                                        </td>
                                    </tr>

                                    <!-- Log 3: Failed Attempt -->
                                    <tr class="bg-red-50/30">
                                        <td>
                                            <div class="flex items-center">
                                                <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs mr-3">?</div>
                                                <div>
                                                    <p class="text-sm font-medium text-gray-900">Unknown User</p>
                                                    <p class="text-xs text-gray-500">suresh.r@gmail.com</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span class="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">Unknown</span></td>
                                        <td class="text-sm text-gray-600">Oct 23, 2025 " 11:45 PM</td>
                                        <td class="font-mono text-xs text-gray-500">45.22.19.110</td>
                                        <td class="text-sm text-gray-600"><i data-lucide="globe" class="w-3 h-3 inline mr-1"></i> Firefox (Linux)</td>
                                        <td>
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <i data-lucide="alert-circle" class="w-3 h-3 mr-1"></i> Failed
                                            </span>
                                        </td>
                                    </tr>

                                    <!-- Log 4: Tenant Success -->
                                    <tr>
                                        <td>
                                            <div class="flex items-center">
                                                <img src="https://i.pravatar.cc/150?u=tenant1" class="w-8 h-8 rounded-full object-cover mr-3">
                                                <div>
                                                    <p class="text-sm font-medium text-gray-900">Arjun Kapoor</p>
                                                    <p class="text-xs text-gray-500">Tenant</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span class="text-xs font-medium bg-green-50 text-green-700 px-2 py-1 rounded">Tenant</span></td>
                                        <td class="text-sm text-gray-600">Oct 23, 2025 " 08:00 PM</td>
                                        <td class="font-mono text-xs text-gray-500">192.168.0.105</td>
                                        <td class="text-sm text-gray-600"><i data-lucide="smartphone" class="w-3 h-3 inline mr-1"></i> Chrome (Android)</td>
                                        <td>
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Success
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                         <!-- Pagination -->
                        <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p class="text-sm text-gray-700">Showing <span class="font-medium">1</span> to <span class="font-medium">4</span> of <span class="font-medium">1,240</span> logs</p>
                                </div>
                                <div>
                                    <nav id="dynamicSidebarNav" className="flex-1 py-6 space-y-1"></nav>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>

        <!-- Mobile Sidebar Overlay -->
        <div id="mobile-overlay" class="fixed inset-0 bg-black/50 z-30 hidden md:hidden backdrop-blur-sm" onclick="toggleMobileMenu()"></div>
        <aside id="mobile-sidebar" class="fixed inset-y-0 left-0 w-72 bg-[#111827] z-40 transform -translate-x-full transition-transform duration-300 md:hidden flex flex-col overflow-y-auto">
            <div class="h-16 flex items-center justify-between px-6 border-b border-gray-800 sticky top-0 bg-[#111827]">
                 <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" class="h-16 w-auto">
                 <button id="mobile-menu-close"><i data-lucide="x" class="w-6 h-6 text-gray-400"></i></button>
            </div>
            <nav id="dynamicSidebarNav" className="flex-1 py-6 space-y-1"></nav>
        </aside>
    </div>
` }} />
  );
}




