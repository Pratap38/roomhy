import React, { useEffect } from "react";
import { useHtmlPage } from "../../utils/htmlPage";

export default function Tenantchat() {
  useHtmlPage({
    title: "Tenant - Chat",
    bodyClass: "bg-gray-50",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/tenant/assets/css/tenantchat.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, []);

  return (
    <div className="html-page">
      <div className="flex h-screen">
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-purple-600">Messages</h1>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="p-3 bg-gray-100 rounded text-center text-gray-500 text-sm">Chat is coming soon.</div>
          </div>
          <div className="p-4 border-t border-gray-200">
            <a href="/tenant/tenantdashboard" className="w-full block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium text-center">
              Back to Dashboard
            </a>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white items-center justify-center">
          <div className="text-center text-gray-400">
            <i data-lucide="message-circle" className="w-16 h-16 mx-auto mb-4 opacity-30"></i>
            <p>Chat support will be enabled shortly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


