import React, { useEffect } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useLegacySidebar } from "../../utils/legacyUi";

export default function Reviews() {
  useHtmlPage({
    title: "Roomhy - Reviews",
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
  "href": "/superadmin/assets/css/reviews.css"
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
        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
            <!-- Top Header -->
            <header class="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
                <div class="flex items-center">
                    <button id="mobile-menu-open" class="md:hidden mr-4 text-slate-500"><i data-lucide="menu" class="w-6 h-6"></i></button>
                    <div class="flex items-center text-sm">
                        <span class="text-slate-500 font-medium">Operations</span>
                        <i data-lucide="chevron-right" class="w-4 h-4 mx-2 text-slate-400"></i>
                        <span class="text-slate-800 font-semibold">Reviews</span>
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
                            <h1 class="text-2xl font-bold text-slate-800">Review Management</h1>
                            <p class="text-sm text-slate-500 mt-1">Monitor and moderate reviews from tenants across all properties.</p>
                        </div>
                    </div>

                    <!-- Filters Toolbar -->
                    <div class="bg-white p-4 rounded-t-xl border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                        <!-- Search -->
                        <div class="relative w-full md:w-96">
                            <input type="text" placeholder="Search reviews by tenant, property..." class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm">
                            <i data-lucide="search" class="w-4 h-4 text-gray-400 absolute left-3 top-3"></i>
                        </div>
                        
                        <!-- Filters -->
                        <div class="flex items-center gap-3 w-full md:w-auto flex-wrap md:flex-nowrap">
                            <select class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-600">
                                <option value="">All Properties</option>
                                <option value="sai">Sai Residency</option>
                                <option value="green">Green View PG</option>
                            </select>
                            
                            <select class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-600">
                                <option value="">Rating</option>
                                <option value="5">5 Stars</option>
                                <option value="4">4 Stars</option>
                                <option value="3">3 Stars</option>
                                <option value="2">2 Stars</option>
                                <option value="1">1 Star</option>
                            </select>

                             <select class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-600">
                                <option value="">Status</option>
                                <option value="published">Published</option>
                                <option value="hidden">Hidden</option>
                            </select>
                        </div>
                    </div>

                    <!-- Table -->
                    <div class="bg-white rounded-b-xl shadow-sm overflow-hidden border border-gray-200 border-t-0">
                        <div class="overflow-x-auto">
                            <table class="w-full data-table">
                                <thead>
                                    <tr>
                                        <th>Reviewer</th>
                                        <th>Property</th>
                                        <th>Rating</th>
                                        <th>Review Summary</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th class="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Review 1 -->
                                    <tr>
                                        <td>
                                            <div class="flex items-center">
                                                <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs mr-3">AK</div>
                                                <div>
                                                    <p class="text-sm font-medium text-gray-900">Arjun Kapoor</p>
                                                    <p class="text-xs text-gray-500">Tenant</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="text-sm text-gray-800">Sai Residency</span>
                                        </td>
                                        <td>
                                            <div class="flex text-yellow-400">
                                                <i data-lucide="star" class="w-3 h-3 fill-current"></i>
                                                <i data-lucide="star" class="w-3 h-3 fill-current"></i>
                                                <i data-lucide="star" class="w-3 h-3 fill-current"></i>
                                                <i data-lucide="star" class="w-3 h-3 fill-current"></i>
                                                <i data-lucide="star" class="w-3 h-3 fill-current"></i>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="text-sm text-gray-600 truncate max-w-xs">Great place to stay! Very clean and safe.</p>
                                        </td>
                                        <td class="text-sm text-gray-500">24 Oct 2025</td>
                                        <td>
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Published
                                            </span>
                                        </td>
                                        <td class="text-right">
                                            <button onclick="toggleModal('viewReviewModal')" class="text-gray-400 hover:text-purple-600 mx-1" title="View & Reply"><i data-lucide="message-square" class="w-4 h-4"></i></button>
                                            <button class="text-gray-400 hover:text-red-600 mx-1" title="Hide Review"><i data-lucide="eye-off" class="w-4 h-4"></i></button>
                                        </td>
                                    </tr>

                                    <!-- Review 2 -->
                                    <tr>
                                        <td>
                                            <div class="flex items-center">
                                                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs mr-3">NS</div>
                                                <div>
                                                    <p class="text-sm font-medium text-gray-900">Neha Sharma</p>
                                                    <p class="text-xs text-gray-500">Tenant</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="text-sm text-gray-800">Green View PG</span>
                                        </td>
                                        <td>
                                            <div class="flex text-yellow-400">
                                                <i data-lucide="star" class="w-3 h-3 fill-current"></i>
                                                <i data-lucide="star" class="w-3 h-3 fill-current"></i>
                                                <i data-lucide="star" class="w-3 h-3 fill-current"></i>
                                                <i data-lucide="star" class="w-3 h-3 text-gray-300"></i>
                                                <i data-lucide="star" class="w-3 h-3 text-gray-300"></i>
                                            </div>
                                        </td>
                                        <td>
                                            <p class="text-sm text-gray-600 truncate max-w-xs">Food quality needs improvement, otherwise good.</p>
                                        </td>
                                        <td class="text-sm text-gray-500">22 Oct 2025</td>
                                        <td>
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Published
                                            </span>
                                        </td>
                                        <td class="text-right">
                                            <button onclick="toggleModal('viewReviewModal')" class="text-gray-400 hover:text-purple-600 mx-1" title="View & Reply"><i data-lucide="message-square" class="w-4 h-4"></i></button>
                                            <button class="text-gray-400 hover:text-red-600 mx-1" title="Hide Review"><i data-lucide="eye-off" class="w-4 h-4"></i></button>
                                        </td>
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

    <!-- View Review Modal -->
    <div id="viewReviewModal" class="modal fixed inset-0 z-50 hidden overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onclick="toggleModal('viewReviewModal')"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="flex justify-between items-start mb-4 border-b pb-4">
                         <div>
                             <h3 class="text-lg leading-6 font-bold text-gray-900">Review Details</h3>
                             <div class="flex items-center mt-1">
                                 <div class="flex text-yellow-400 text-xs">
                                    <i data-lucide="star" class="w-3 h-3 fill-current"></i>
                                    <i data-lucide="star" class="w-3 h-3 fill-current"></i>
                                    <i data-lucide="star" class="w-3 h-3 fill-current"></i>
                                    <i data-lucide="star" class="w-3 h-3 fill-current"></i>
                                    <i data-lucide="star" class="w-3 h-3 fill-current"></i>
                                 </div>
                                 <span class="text-xs text-gray-500 ml-2">5.0/5.0</span>
                             </div>
                         </div>
                         <button onclick="toggleModal('viewReviewModal')" class="text-gray-400 hover:text-gray-500"><i data-lucide="x" class="w-5 h-5"></i></button>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold flex-shrink-0">AK</div>
                            <div>
                                <p class="text-sm font-medium text-gray-900">Arjun Kapoor</p>
                                <p class="text-xs text-gray-500">Sai Residency - Room 204</p>
                                <p class="text-sm text-gray-700 mt-2">"Great place to stay! Very clean and safe. The management is responsive and helpful. Highly recommended for students and working professionals."</p>
                            </div>
                        </div>

                        <div class="border-t pt-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Reply to Review</label>
                            <textarea rows="3" class="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md" placeholder="Thank the reviewer or address their concern..."></textarea>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                    <button type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none sm:w-auto sm:text-sm">
                        Post Reply
                    </button>
                    <button type="button" class="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:w-auto sm:text-sm" onclick="toggleModal('viewReviewModal')">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
` }} />
  );
}




