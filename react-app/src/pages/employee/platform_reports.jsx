import React, { useEffect } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useLegacySidebar } from "../../utils/legacyUi";

export default function PlatformReports() {
  useHtmlPage({
    title: "Roomhy - Platform Reports",
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
  "href": "/superadmin/assets/css/platform_reports.css"
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

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, []);

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
                        <span class="text-slate-500 font-medium">Reports</span>
                        <i data-lucide="chevron-right" class="w-4 h-4 mx-2 text-slate-400"></i>
                        <span class="text-slate-800 font-semibold">Platform Analytics</span>
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
                            <h1 class="text-2xl font-bold text-slate-800">Platform Reports</h1>
                            <p class="text-sm text-slate-500 mt-1">Generate comprehensive reports on revenue, occupancy, and growth.</p>
                        </div>
                        
                        <div class="flex items-center bg-white border border-gray-300 rounded-md shadow-sm p-1">
                            <button class="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded">Last 30 Days</button>
                            <button class="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded shadow-sm">This Quarter</button>
                            <button class="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded">Last Year</button>
                            <button class="ml-2 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 border-l border-gray-200 pl-3 flex items-center">
                                <i data-lucide="calendar" class="w-3 h-3 mr-1.5"></i> Custom
                            </button>
                        </div>
                    </div>

                    <!-- Report Categories Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <!-- Financial Report -->
                        <div class="bg-white p-6 rounded-xl border border-gray-200 report-card transition-all cursor-pointer">
                            <div class="flex items-center justify-between mb-4">
                                <div class="p-2 bg-green-100 rounded-lg text-green-600">
                                    <i data-lucide="banknote" class="w-6 h-6"></i>
                                </div>
                                <span class="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">+12% Growth</span>
                            </div>
                            <h3 class="text-lg font-bold text-slate-800">Financial Report</h3>
                            <p class="text-sm text-slate-500 mt-1 mb-4">Revenue, Expenses, Payouts</p>
                            <button class="w-full py-2 border border-gray-200 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center">
                                <i data-lucide="download" class="w-4 h-4 mr-2"></i> Download PDF
                            </button>
                        </div>

                        <!-- Occupancy Report -->
                        <div class="bg-white p-6 rounded-xl border border-gray-200 report-card transition-all cursor-pointer">
                            <div class="flex items-center justify-between mb-4">
                                <div class="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <i data-lucide="home" class="w-6 h-6"></i>
                                </div>
                                <span class="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">85% Full</span>
                            </div>
                            <h3 class="text-lg font-bold text-slate-800">Occupancy Report</h3>
                            <p class="text-sm text-slate-500 mt-1 mb-4">Vacancies, Turnover Rates</p>
                            <button class="w-full py-2 border border-gray-200 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center">
                                <i data-lucide="download" class="w-4 h-4 mr-2"></i> Download CSV
                            </button>
                        </div>

                        <!-- User Growth -->
                        <div class="bg-white p-6 rounded-xl border border-gray-200 report-card transition-all cursor-pointer">
                            <div class="flex items-center justify-between mb-4">
                                <div class="p-2 bg-purple-100 rounded-lg text-purple-600">
                                    <i data-lucide="users" class="w-6 h-6"></i>
                                </div>
                                <span class="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">+45 New</span>
                            </div>
                            <h3 class="text-lg font-bold text-slate-800">User Growth</h3>
                            <p class="text-sm text-slate-500 mt-1 mb-4">New Tenants & Owners</p>
                            <button class="w-full py-2 border border-gray-200 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center">
                                <i data-lucide="download" class="w-4 h-4 mr-2"></i> Download CSV
                            </button>
                        </div>

                        <!-- Property Performance -->
                        <div class="bg-white p-6 rounded-xl border border-gray-200 report-card transition-all cursor-pointer">
                            <div class="flex items-center justify-between mb-4">
                                <div class="p-2 bg-orange-100 rounded-lg text-orange-600">
                                    <i data-lucide="star" class="w-6 h-6"></i>
                                </div>
                                <span class="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">4.2 Avg Rating</span>
                            </div>
                            <h3 class="text-lg font-bold text-slate-800">Property Perf.</h3>
                            <p class="text-sm text-slate-500 mt-1 mb-4">Ratings, Complaints, ROI</p>
                            <button class="w-full py-2 border border-gray-200 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center">
                                <i data-lucide="download" class="w-4 h-4 mr-2"></i> Download PDF
                            </button>
                        </div>
                    </div>

                    <!-- Visual Analytics Section -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        <!-- Revenue Trend Chart -->
                        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div class="flex justify-between items-center mb-6">
                                <h3 class="text-lg font-bold text-gray-800">Revenue Trend</h3>
                                <select class="text-xs border-gray-300 rounded-md text-gray-600 focus:ring-purple-500 focus:border-purple-500">
                                    <option>Monthly</option>
                                    <option>Quarterly</option>
                                </select>
                            </div>
                            <!-- Chart Placeholder (Visual Representation) -->
                            <div class="chart-placeholder h-64 w-full rounded-lg flex items-end justify-around p-4 border border-gray-100">
                                <div class="w-8 bg-purple-300 rounded-t h-1/4 relative group"><div class="opacity-0 group-hover:opacity-100 absolute -top-8 left-0 bg-black text-white text-xs p-1 rounded">?20k</div></div>
                                <div class="w-8 bg-purple-300 rounded-t h-1/3 relative group"><div class="opacity-0 group-hover:opacity-100 absolute -top-8 left-0 bg-black text-white text-xs p-1 rounded">?35k</div></div>
                                <div class="w-8 bg-purple-400 rounded-t h-1/2 relative group"><div class="opacity-0 group-hover:opacity-100 absolute -top-8 left-0 bg-black text-white text-xs p-1 rounded">?50k</div></div>
                                <div class="w-8 bg-purple-400 rounded-t h-2/3 relative group"><div class="opacity-0 group-hover:opacity-100 absolute -top-8 left-0 bg-black text-white text-xs p-1 rounded">?75k</div></div>
                                <div class="w-8 bg-purple-600 rounded-t h-3/4 relative group"><div class="opacity-0 group-hover:opacity-100 absolute -top-8 left-0 bg-black text-white text-xs p-1 rounded">?90k</div></div>
                                <div class="w-8 bg-purple-500 rounded-t h-full relative group"><div class="opacity-0 group-hover:opacity-100 absolute -top-8 left-0 bg-black text-white text-xs p-1 rounded">?1.2L</div></div>
                            </div>
                            <div class="flex justify-between text-xs text-gray-400 mt-2 px-2">
                                <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
                            </div>
                        </div>

                        <!-- Occupancy Distribution -->
                        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div class="flex justify-between items-center mb-6">
                                <h3 class="text-lg font-bold text-gray-800">Occupancy by Area</h3>
                                <button class="text-xs text-purple-600 hover:underline">View Details</button>
                            </div>
                            
                            <div class="space-y-4">
                                <div>
                                    <div class="flex justify-between text-sm mb-1">
                                        <span class="font-medium text-gray-700">Koramangala</span>
                                        <span class="text-gray-500">92% Occupied</span>
                                    </div>
                                    <div class="w-full bg-gray-100 rounded-full h-2.5">
                                        <div class="bg-blue-600 h-2.5 rounded-full" style="width: 92%"></div>
                                    </div>
                                </div>
                                <div>
                                    <div class="flex justify-between text-sm mb-1">
                                        <span class="font-medium text-gray-700">Indiranagar</span>
                                        <span class="text-gray-500">78% Occupied</span>
                                    </div>
                                    <div class="w-full bg-gray-100 rounded-full h-2.5">
                                        <div class="bg-blue-500 h-2.5 rounded-full" style="width: 78%"></div>
                                    </div>
                                </div>
                                <div>
                                    <div class="flex justify-between text-sm mb-1">
                                        <span class="font-medium text-gray-700">Whitefield</span>
                                        <span class="text-gray-500">65% Occupied</span>
                                    </div>
                                    <div class="w-full bg-gray-100 rounded-full h-2.5">
                                        <div class="bg-blue-400 h-2.5 rounded-full" style="width: 65%"></div>
                                    </div>
                                </div>
                                <div>
                                    <div class="flex justify-between text-sm mb-1">
                                        <span class="font-medium text-gray-700">HSR Layout</span>
                                        <span class="text-gray-500">45% Occupied</span>
                                    </div>
                                    <div class="w-full bg-gray-100 rounded-full h-2.5">
                                        <div class="bg-blue-300 h-2.5 rounded-full" style="width: 45%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>

        <!-- Mobile Sidebar Overlay -->
        <div id="mobile-overlay" class="fixed inset-0 bg-black/50 z-30 hidden md:hidden backdrop-blur-sm" onclick="toggleMobileMenu()"></div>
        <aside id="mobile-sidebar" class="fixed inset-y-0 left-0 w-72 bg-[#111827] z-40 transform -translate-x-full transition-transform duration-300 md:hidden flex flex-col">
            <nav id="dynamicSidebarNav" className="flex-1 py-6 space-y-1"></nav>
        </aside>
    </div>
` }} />
  );
}




