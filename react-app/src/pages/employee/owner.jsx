import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useLegacySidebar } from "../../utils/legacyUi";

export default function Owner() {
  useHtmlPage({
    title: "Roomhy - Property Owners",
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
  "href": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  "rel": "stylesheet"
},
  {
  "rel": "stylesheet",
  "href": "/superadmin/assets/css/owner.css"
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
<!-- Mobile Overlay -->
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
            <nav id="dynamicSidebarNav" className="flex-1 py-6 space-y-1"></nav>
        </aside>

        <div class="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
            <header class="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
                <div class="flex items-center">
                    <button id="mobile-menu-open" class="md:hidden mr-4 text-slate-500"><i data-lucide="menu" class="w-6 h-6"></i></button>
                    <h2 class="text-lg font-semibold text-slate-800">All Property Owners</h2>
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

            <main class="flex-1 overflow-y-auto p-8">
                <div class="max-w-7xl mx-auto">
                    <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                         <div>
                             <h1 class="text-2xl font-bold text-slate-800">Property Owners List</h1>
                         </div>
                         
                         <!-- Filters and Search -->
                         <div class="flex gap-2 w-full md:w-auto">
                             <select id="areaFilter" class="border border-gray-300 rounded-md text-sm px-3 py-2 focus:ring-purple-500 focus:border-purple-500 outline-none" onchange="loadOwners()">
                                 <option value="all">All Areas</option>
                             </select>
                             <div class="relative flex-1 md:w-64">
                                 <i data-lucide="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"></i>
                                 <input type="text" id="ownerSearch" placeholder="Search Name/ID" class="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-full" onkeyup="loadOwners()">
                             </div>
                             <button onclick="exportToExcel()" class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center shadow-sm">
                                <i data-lucide="sheet" class="w-4 h-4 mr-2"></i> Export Excel
                             </button>
                         </div>
                    </div>

                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full border-collapse excel-table">
                                <thead>
                                    <tr>
                                        <th>Owner ID / Login ID</th>
                                        <th>Name & Contact</th>
                                        <th>DOB</th>
                                        <th>Gmail</th>
                                        <th>Aadhaar Linked Phone</th>
                                        <th>Aadhaar Number</th>
                                        <th>Account Holder</th>
                                        <th>UPI ID</th>
                                        <th>Address</th> <!-- Address Column -->
                                        <th>Password</th> <!-- Password Column -->
                                        <th>Area</th>
                                        <th>Bank Name</th>
                                        <th>Account Number</th>
                                        <th>IFSC Code</th>
                                        <th>Branch</th>
                                        <th>Monthly Rent</th> <!-- NEW: Property Rent -->
                                        <th>Security Deposit</th> <!-- NEW: Security Deposit -->
                                        <th>KYC Status</th>
                                        <th class="text-center w-16">Delete</th> <!-- Trash Column -->
                                    </tr>
                                </thead>
                                <tbody id="ownersTableBody">
                                    <tr><td colspan="19" class="text-center py-8 text-gray-500">Loading owners...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
` }} />
  );
}




