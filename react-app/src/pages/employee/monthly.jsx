import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useLegacySidebar } from "../../utils/legacyUi";

export default function Monthly() {
  useHtmlPage({
    title: "Roomhy - Monthly Revenue",
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
  "href": "/superadmin/assets/css/monthly.css"
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
                        <span class="text-slate-500 font-medium">Reports</span>
                        <i data-lucide="chevron-right" class="w-4 h-4 mx-2 text-slate-400"></i>
                        <span class="text-slate-800 font-semibold">Monthly Revenue</span>
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
                            <h1 class="text-2xl font-bold text-slate-800">Monthly Revenue - Oct 2025</h1>
                            <p class="text-sm text-slate-500 mt-1">Detailed breakdown of earnings and financial performance.</p>
                        </div>
                        
                        <div class="flex items-center bg-white border border-gray-300 rounded-md shadow-sm p-1">
                             <button class="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded flex items-center">
                                <i data-lucide="chevron-left" class="w-3 h-3 mr-1"></i> Prev
                            </button>
                            <span class="px-4 py-1.5 text-xs font-bold text-slate-800">October 2025</span>
                            <button class="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded flex items-center">
                                Next <i data-lucide="chevron-right" class="w-3 h-3 ml-1"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Summary Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <p class="text-sm font-medium text-gray-500">Total Revenue</p>
                            <h3 class="text-3xl font-bold text-slate-800 mt-1">?8,45,000</h3>
                            <p class="text-xs text-green-600 mt-2 flex items-center"><i data-lucide="trending-up" class="w-3 h-3 mr-1"></i> +12.5% vs last month</p>
                        </div>
                         <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <p class="text-sm font-medium text-gray-500">Total Expenses</p>
                            <h3 class="text-3xl font-bold text-slate-800 mt-1">?1,20,000</h3>
                            <p class="text-xs text-red-500 mt-2 flex items-center"><i data-lucide="trending-down" class="w-3 h-3 mr-1"></i> -2.1% vs last month</p>
                        </div>
                         <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <p class="text-sm font-medium text-gray-500">Net Profit</p>
                            <h3 class="text-3xl font-bold text-green-600 mt-1">?7,25,000</h3>
                            <p class="text-xs text-gray-500 mt-2">85.8% Margin</p>
                        </div>
                        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                             <p class="text-sm font-medium text-gray-500">Active Tenants</p>
                            <h3 class="text-3xl font-bold text-slate-800 mt-1">142</h3>
                            <p class="text-xs text-green-600 mt-2 flex items-center"><i data-lucide="user-plus" class="w-3 h-3 mr-1"></i> +8 New this month</p>
                        </div>
                    </div>

                    <!-- Revenue Breakdown Chart -->
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-lg font-bold text-gray-800">Revenue Breakdown</h3>
                            <div class="flex gap-2">
                                <button class="text-xs text-gray-500 hover:text-gray-900">View Full Report</button>
                            </div>
                        </div>
                         <div class="chart-placeholder h-64 w-full rounded-lg flex items-end justify-around p-4 border border-gray-100 relative">
                            <!-- Simulated Bars -->
                            <div class="w-16 bg-blue-500 h-3/4 rounded-t relative group flex justify-center">
                                <span class="absolute bottom-2 text-xs text-white font-bold rotate-90">Rent</span>
                                <div class="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black text-white text-xs p-1 rounded">?6.5L</div>
                            </div>
                            <div class="w-16 bg-green-500 h-1/4 rounded-t relative group flex justify-center">
                                <span class="absolute bottom-2 text-xs text-white font-bold rotate-90">Deposits</span>
                                <div class="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black text-white text-xs p-1 rounded">?1.2L</div>
                            </div>
                             <div class="w-16 bg-yellow-500 h-1/6 rounded-t relative group flex justify-center">
                                <span class="absolute bottom-2 text-xs text-white font-bold rotate-90">Services</span>
                                <div class="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black text-white text-xs p-1 rounded">?50k</div>
                            </div>
                             <div class="w-16 bg-red-500 h-[10%] rounded-t relative group flex justify-center">
                                <span class="absolute bottom-2 text-xs text-white font-bold rotate-90">Fines</span>
                                <div class="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black text-white text-xs p-1 rounded">?25k</div>
                            </div>
                        </div>
                    </div>

                    <!-- Transactions Table -->
                    <div class="bg-white rounded-b-xl shadow-sm overflow-hidden border border-gray-200 border-t-0">
                         <div class="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 class="text-lg font-bold text-gray-800">Recent Transactions</h3>
                             <button class="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center">
                                <i data-lucide="download" class="w-4 h-4 mr-2"></i> Download CSV
                            </button>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Transaction ID</th>
                                        <th>Description</th>
                                        <th>Category</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="text-sm text-gray-500">24 Oct 2025</td>
                                        <td class="font-mono text-xs text-gray-600">TXN-88291</td>
                                        <td class="text-sm text-gray-800">Rent Payment - Room 204</td>
                                        <td><span class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">Rent</span></td>
                                        <td class="text-sm font-bold text-green-600">+?6,500</td>
                                        <td><span class="text-xs text-green-600 font-medium">Completed</span></td>
                                    </tr>
                                    <tr>
                                        <td class="text-sm text-gray-500">23 Oct 2025</td>
                                        <td class="font-mono text-xs text-gray-600">TXN-88285</td>
                                        <td class="text-sm text-gray-800">Cleaning Services - Vendor</td>
                                        <td><span class="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">Expense</span></td>
                                        <td class="text-sm font-bold text-red-600">-?2,500</td>
                                        <td><span class="text-xs text-green-600 font-medium">Completed</span></td>
                                    </tr>
                                     <tr>
                                        <td class="text-sm text-gray-500">22 Oct 2025</td>
                                        <td class="font-mono text-xs text-gray-600">TXN-88240</td>
                                        <td class="text-sm text-gray-800">Security Deposit - New Tenant</td>
                                        <td><span class="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">Deposit</span></td>
                                        <td class="text-sm font-bold text-green-600">+?15,000</td>
                                        <td><span class="text-xs text-green-600 font-medium">Completed</span></td>
                                    </tr>
                                </tbody>
                            </table>
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




