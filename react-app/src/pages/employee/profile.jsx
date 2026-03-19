import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useLegacySidebar } from "../../utils/legacyUi";

export default function Profile() {
  useHtmlPage({
    title: "Roomhy - Admin Profile",
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
  "href": "/superadmin/assets/css/profile.css"
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
            <!-- Header -->
            <header class="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
                <div class="flex items-center">
                    <button id="mobile-menu-open" class="md:hidden mr-4 text-slate-500"><i data-lucide="menu" class="w-6 h-6"></i></button>
                    <h2 class="text-lg font-semibold text-slate-800">Admin Profile</h2>
                </div>
                <div class="flex items-center gap-4">
                    <button class="text-slate-400 hover:text-slate-600"><i data-lucide="bell" class="w-5 h-5"></i></button>
                    <div class="relative group">
                        <button class="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-full transition-colors">
                            <div class="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold text-xs">SP</div>
                            <i data-lucide="chevron-down" class="w-3 h-3 text-gray-400 hidden sm:block"></i>
                        </button>
                        <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-50">
                            <a href="/employee/settings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
                            <a href="#" id="logoutBtn" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Logout</a>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Content -->
            <main class="flex-1 overflow-y-auto p-6 md:p-8">
                <div class="max-w-4xl mx-auto">
                    <!-- Profile Card -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                        <div class="h-32 bg-gradient-to-r from-purple-500 to-purple-600"></div>
                        
                        <div class="px-6 pb-6">
                            <div class="flex flex-col md:flex-row md:items-end gap-6 -mt-16 mb-6 relative z-10">
                                <div class="w-32 h-32 rounded-xl border-4 border-white bg-purple-100 flex items-center justify-center text-purple-600 text-4xl font-bold shadow-lg">SA</div>
                                <div class="flex-1">
                                    <h1 class="text-2xl font-bold text-gray-800">Super Admin</h1>
                                    <p class="text-gray-500">Administrator</p>
                                </div>
                                <button class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                                    <i data-lucide="edit" class="w-4 h-4 inline mr-2"></i> Edit Profile
                                </button>
                            </div>

                            <!-- Profile Information -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-gray-200">
                                <div>
                                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                                    <p class="text-gray-800 font-medium">Ajay Kumar</p>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                                    <p class="text-gray-800 font-medium">admin@roomhy.com</p>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Phone</label>
                                    <p class="text-gray-800 font-medium">+91 98765 43210</p>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Role</label>
                                    <p class="text-gray-800 font-medium">Super Administrator</p>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Member Since</label>
                                    <p class="text-gray-800 font-medium">January 15, 2024</p>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                                    <span class="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
                        <div class="space-y-4">
                            <div class="flex items-center gap-4 pb-4 border-b border-gray-100">
                                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><i data-lucide="login" class="w-5 h-5"></i></div>
                                <div class="flex-1">
                                    <p class="text-gray-800 font-medium">Logged in</p>
                                    <p class="text-sm text-gray-500">Today at 10:30 AM</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-4 pb-4 border-b border-gray-100">
                                <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600"><i data-lucide="check-circle" class="w-5 h-5"></i></div>
                                <div class="flex-1">
                                    <p class="text-gray-800 font-medium">Team member added</p>
                                    <p class="text-sm text-gray-500">Yesterday at 3:15 PM</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- Mobile Overlay -->
    <div id="mobile-overlay" class="fixed inset-0 bg-black/50 z-30 hidden backdrop-blur-sm" onclick="toggleMobileMenu()"></div>
` }} />
  );
}




