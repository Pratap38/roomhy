import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useLegacySidebar } from "../../utils/legacyUi";

export default function Settings() {
  useHtmlPage({
    title: "Roomhy - Admin Settings",
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
  "href": "/superadmin/assets/css/settings.css"
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
                    <h2 class="text-lg font-semibold text-slate-800">Settings</h2>
                </div>
                <div class="flex items-center gap-4">
                    <button class="text-slate-400 hover:text-slate-600"><i data-lucide="bell" class="w-5 h-5"></i></button>
                    <div class="relative group">
                        <button class="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-full transition-colors">
                            <div class="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold text-xs">SP</div>
                            <i data-lucide="chevron-down" class="w-3 h-3 text-gray-400 hidden sm:block"></i>
                        </button>
                        <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-50">
                            <a href="/employee/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</a>
                            <a href="#" id="logoutBtn" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Logout</a>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Content -->
            <main class="flex-1 overflow-y-auto p-6 md:p-8">
                <div class="max-w-4xl mx-auto">
                    <!-- Account Settings -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <i data-lucide="user-cog" class="w-5 h-5 text-purple-600"></i> Account Settings
                        </h3>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div>
                                    <p class="font-medium text-gray-800">Email Notifications</p>
                                    <p class="text-sm text-gray-500">Receive notifications via email</p>
                                </div>
                                <input type="checkbox" checked class="w-5 h-5 cursor-pointer">
                            </div>
                            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div>
                                    <p class="font-medium text-gray-800">Two-Factor Authentication</p>
                                    <p class="text-sm text-gray-500">Add extra security to your account</p>
                                </div>
                                <button class="px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm font-medium">Enable</button>
                            </div>
                        </div>
                    </div>

                    <!-- System Settings -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <i data-lucide="settings" class="w-5 h-5 text-purple-600"></i> System Settings
                        </h3>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                                <select class="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700">
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="auto">Auto (System)</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Language</label>
                                <select class="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700">
                                    <option value="en">English</option>
                                    <option value="hi">Hindi</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Danger Zone -->
                    <div class="bg-red-50 border border-red-200 rounded-xl p-6">
                        <h3 class="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                            <i data-lucide="alert-triangle" class="w-5 h-5"></i> Danger Zone
                        </h3>
                        <p class="text-sm text-red-700 mb-4">These actions cannot be undone.</p>
                        <button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm">Reset All Settings</button>
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




