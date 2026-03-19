import React, { useEffect } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useLegacySidebar } from "../../utils/legacyUi";

export default function Superchat() {
  useHtmlPage({
    title: "Super Admin - All Messages",
    bodyClass: "bg-gray-50",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/superadmin/assets/css/superchat.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  useLegacySidebar();

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (_) {
      // ignore
    }
    window.location.href = "/login";
  };

  return (
    <div className="html-page">
      <div className="flex h-screen">
        <aside className="sidebar w-72 flex-shrink-0 hidden md:flex flex-col z-20 overflow-y-auto custom-scrollbar">
          <div className="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
            <div className="flex items-center gap-3">
              <div className="bg-amber-600 p-1.5 rounded-lg"><i data-lucide="shield-alert" className="w-5 h-5 text-white"></i></div>
              <div>
                <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
                <span className="text-[10px] text-gray-500">SUPER ADMIN</span>
              </div>
            </div>
          </div>
          <nav className="flex-1 py-6 space-y-1">
            <a href="/superadmin/superchat" className="sidebar-link active"><i data-lucide="mail" className="w-5 h-5 mr-3"></i> All Messages</a>
            <a href="/superadmin/superadmin" className="sidebar-link"><i data-lucide="layout-dashboard" className="w-5 h-5 mr-3"></i> Dashboard</a>
            <a href="/superadmin/enquiry" className="sidebar-link"><i data-lucide="clipboard-list" className="w-5 h-5 mr-3"></i> Enquiries</a>
            <a href="/superadmin/settings" className="sidebar-link"><i data-lucide="settings" className="w-5 h-5 mr-3"></i> Settings</a>
          </nav>
          <div className="p-4 border-t border-gray-800">
            <button onClick={handleLogout} className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
              Logout
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10 border-b border-gray-200">
            <div className="flex items-center">
              <button id="mobile-menu-open" className="md:hidden mr-4 text-slate-500"><i data-lucide="menu" className="w-6 h-6"></i></button>
              <h2 className="text-lg font-semibold text-slate-800">All System Messages</h2>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-6xl mx-auto space-y-4">
              <div className="text-center text-gray-400 mt-20">
                <i data-lucide="mail-open" className="w-16 h-16 mx-auto mb-4 opacity-30"></i>
                <p>No messages available. Integrate the messaging API to populate this view.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="mobile-overlay" className="fixed inset-0 bg-black/50 z-30 hidden backdrop-blur-sm"></div>
    </div>
  );
}


