import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useLegacySidebar } from "../../utils/legacyUi";

export default function Tenant() {
  useHtmlPage({
    title: "Roomhy - All Tenants",
    bodyClass: "text-slate-800",
    htmlAttrs: {
  "lang": "en"
},
    metas: [
  {
  "charset": "UTF-8"
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
  "href": "/superadmin/assets/css/tenant.css"
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
<!-- Mobile Sidebar Overlay -->
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
            <!-- Header -->
            <header class="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
                <div class="flex items-center">
                    <button id="mobile-menu-open" class="md:hidden mr-4 text-slate-500"><i data-lucide="menu" class="w-6 h-6"></i></button>
                    <div class="flex items-center text-sm">
                        <span class="text-slate-500 font-medium">Management</span>
                        <i data-lucide="chevron-right" class="w-4 h-4 mx-2 text-slate-400"></i>
                        <span class="text-slate-800 font-semibold">Tenants & KYC</span>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="relative">
                        <input type="text" id="areaSearch" placeholder="Search by Area/Property..." class="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none w-64" onkeyup="filterTenants()">
                        <i data-lucide="search" class="absolute left-3 top-2.5 w-4 h-4 text-gray-400"></i>
                    </div>
                    <button class="text-slate-400 hover:text-slate-600"><i data-lucide="bell" class="w-5 h-5"></i></button>
                    <div class="relative group">
                        <button class="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-full transition-colors">
                            <div class="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold text-xs">SP</div>
                            <div class="text-left hidden sm:block">
                                <p class="text-xs font-semibold text-gray-700">Super Admin</p>
                            </div>
                            <i data-lucide="chevron-down" class="w-3 h-3 text-gray-400 hidden sm:block"></i>
                        </button>
                        <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 hidden group-hover:block z-50">
                            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</a>
                            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
                            <div class="border-t border-gray-100 my-1"></div>
                            <a href="#" id="logoutBtn" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Logout</a>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Content -->
            <main class="flex-1 overflow-y-auto p-8">
                <div class="max-w-7xl mx-auto">
                    
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 class="text-2xl font-bold text-slate-800">All Tenants</h1>
                            <p class="text-sm text-slate-500 mt-1">Manage tenants and verify their KYC documents here.</p>
                        </div>
                        <button onclick="exportToExcel()" class="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center">
                            <i data-lucide="download" class="w-4 h-4 mr-2"></i> Export List
                        </button>
                    </div>

                    <div class="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                        <div class="overflow-x-auto">
                            <table class="w-full data-table" id="tenantTable">
                                <thead>
                                    <tr>
                                        <th>Tenant Info</th>
                                        <th>Property Details</th>
                                        <th>KYC Status</th>
                                        <th>Move In/Out</th>
                                        <th class="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="all-tenants-body">
                                    <!-- JS populates this -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- Mobile Overlay -->
    <div id="mobile-overlay" class="fixed inset-0 bg-black/50 z-30 hidden backdrop-blur-sm" onclick="toggleMobileMenu()"></div>

    <!-- Enhanced KYC Review Modal (Layout based on image_cc5f40.png) -->
    <div id="kycModal" class="fixed inset-0 modal-backdrop hidden items-center justify-center z-[60]" onclick="closeKycModal()">
        <div class="relative w-full max-w-5xl bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden" onclick="event.stopPropagation()">
            
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
                <h3 class="text-lg font-bold text-gray-800">Review KYC Documents</h3>
                <button aria-label="Close KYC modal" onclick="closeKycModal()" class="text-gray-400 hover:text-gray-600"><i data-lucide="x" class="w-6 h-6"></i></button>
            </div>

            <div class="flex flex-col lg:flex-row h-[600px]">
                <!-- Left Side: Document Viewer -->
                <div class="flex-1 bg-gray-50 flex flex-col border-r border-gray-200">
                    <!-- Doc Tabs -->
                    <div class="flex border-b border-gray-200 bg-white px-4">
                        <button class="doc-tab-btn active px-4 py-3 text-sm font-medium" onclick="switchDocTab('aadhaar_front')">Aadhaar Front</button>
                        <button class="doc-tab-btn px-4 py-3 text-sm font-medium" onclick="switchDocTab('aadhaar_back')">Aadhaar Back</button>
                        <button class="doc-tab-btn px-4 py-3 text-sm font-medium" onclick="switchDocTab('pan_card')">PAN Card</button>
                    </div>
                    <!-- Doc Canvas -->
                    <div class="flex-1 p-6 flex items-center justify-center relative bg-slate-100">
                        <img id="docPreviewImg" src="" class="max-h-full max-w-full object-contain shadow-lg rounded-md bg-white" alt="Document Preview">
                        <div id="noDocPlaceholder" class="hidden text-gray-400 flex flex-col items-center">
                            <i data-lucide="file-x" class="w-12 h-12 mb-2"></i>
                            <span>No document uploaded for this category</span>
                        </div>
                        <!-- Zoom Controls -->
                         <div class="absolute bottom-4 right-4 flex gap-2 bg-white p-1 rounded shadow border border-gray-200">
                            <button aria-label="Zoom in" class="p-1.5 hover:bg-gray-100 rounded"><i data-lucide="zoom-in" class="w-4 h-4"></i></button>
                            <button aria-label="Zoom out" class="p-1.5 hover:bg-gray-100 rounded"><i data-lucide="zoom-out" class="w-4 h-4"></i></button>
                         </div>
                    </div>
                </div>

                <!-- Right Side: Details & Actions -->
                <div class="w-full lg:w-80 bg-white flex flex-col">
                    <div class="flex-1 overflow-y-auto p-6">
                        
                        <!-- Applicant Details Block -->
                        <div class="bg-purple-50 rounded-lg p-4 border border-purple-100 mb-6">
                            <h4 class="text-xs font-bold text-purple-700 uppercase mb-3 tracking-wider">Applicant Details</h4>
                            <div class="space-y-3 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Name</span>
                                    <span class="font-semibold text-gray-800 text-right" id="detailName">-</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Phone</span>
                                    <span class="font-medium text-gray-800 text-right" id="detailPhone">-</span>
                                </div>
                                 <div class="flex justify-between">
                                    <span class="text-gray-500">Login ID</span>
                                    <span class="font-mono text-xs bg-white px-1 rounded border text-right" id="detailLoginId">-</span>
                                </div>
                                <div class="border-t border-purple-200 pt-2 mt-2">
                                     <div class="mb-1">
                                        <p class="text-xs text-gray-500">Aadhaar Number</p>
                                        <p class="font-medium text-gray-800 tracking-wide" id="detailAadhaar">-</p>
                                     </div>
                                     <div>
                                        <p class="text-xs text-gray-500">Guardian Contact</p>
                                        <p class="font-medium text-gray-800" id="detailGuardian">-</p>
                                     </div>
                                     <div class="mt-2">
                                         <p class="text-xs text-gray-500">Date of Joining</p>
                                         <p class="font-medium text-gray-800" id="detailJoinDate">-</p>
                                     </div>
                                      <div class="mt-2">
                                         <p class="text-xs text-gray-500">Property</p>
                                         <p class="font-medium text-gray-800" id="detailProperty">-</p>
                                     </div>
                                </div>
                            </div>
                        </div>

                        <!-- Verification Checklist -->
                        <div class="mb-6">
                            <h4 class="text-sm font-bold text-gray-800 mb-3">Verification Checklist</h4>
                            <div class="space-y-2">
                                <label class="flex items-start gap-2 cursor-pointer">
                                    <input type="checkbox" class="mt-1 w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500">
                                    <span class="text-sm text-gray-600">Name matches documents</span>
                                </label>
                                <label class="flex items-start gap-2 cursor-pointer">
                                    <input type="checkbox" class="mt-1 w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500">
                                    <span class="text-sm text-gray-600">Photo is clear & visible</span>
                                </label>
                                <label class="flex items-start gap-2 cursor-pointer">
                                    <input type="checkbox" class="mt-1 w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500">
                                    <span class="text-sm text-gray-600">ID Numbers match input</span>
                                </label>
                            </div>
                        </div>

                        <!-- Rejection Reason -->
                        <div>
                            <label class="block text-sm font-bold text-gray-800 mb-2">Rejection Reason (Optional)</label>
                            <textarea id="rejectReason" rows="3" class="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none" placeholder="Enter reason if rejecting..."></textarea>
                        </div>

                    </div>

                    <!-- Footer Actions -->
                    <div class="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
                        <button id="approveBtn" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                            <i data-lucide="check-circle" class="w-4 h-4"></i> Approve
                        </button>
                        <button id="rejectBtn" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                            <i data-lucide="x-circle" class="w-4 h-4"></i> Reject
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
` }} />
  );
}




