import React, { useEffect, useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import { clearOwnerRuntimeSession, getOwnerRuntimeSession } from "../../utils/propertyowner";

export default function Settings() {
  useHtmlPage({
    title: "Roomhy - Owner Settings",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      },
      { rel: "stylesheet", href: "/propertyowner/assets/css/settings.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [owner, setOwner] = useState(null);
  const [settings, setSettings] = useState({
    automaticRentReminders: true,
    maintenanceNotifications: true,
    emailNotifications: "all",
    language: "en"
  });

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [settings]);

  useEffect(() => {
    const session = getOwnerRuntimeSession();
    if (!session?.loginId) {
      window.location.href = "/propertyowner/ownerlogin";
      return;
    }
    setOwner(session);
  }, []);

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Settings"
      navVariant="settings"
      onLogout={() => {
        clearOwnerRuntimeSession();
        window.location.href = "/propertyowner/ownerlogin";
      }}
      contentClassName="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i data-lucide="building" className="w-5 h-5 text-purple-600"></i>
          Property Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">Automatic Rent Reminders</p>
              <p className="text-sm text-gray-500">Send automatic reminders to tenants</p>
            </div>
            <input type="checkbox" checked={settings.automaticRentReminders} onChange={(event) => setSettings((prev) => ({ ...prev, automaticRentReminders: event.target.checked }))} className="w-5 h-5 cursor-pointer" />
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">Maintenance Notifications</p>
              <p className="text-sm text-gray-500">Receive alerts for maintenance requests</p>
            </div>
            <input type="checkbox" checked={settings.maintenanceNotifications} onChange={(event) => setSettings((prev) => ({ ...prev, maintenanceNotifications: event.target.checked }))} className="w-5 h-5 cursor-pointer" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i data-lucide="user-cog" className="w-5 h-5 text-purple-600"></i>
          Account Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Notifications</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700" value={settings.emailNotifications} onChange={(event) => setSettings((prev) => ({ ...prev, emailNotifications: event.target.value }))}>
              <option value="all">All Activities</option>
              <option value="important">Important Only</option>
              <option value="none">None</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700" value={settings.language} onChange={(event) => setSettings((prev) => ({ ...prev, language: event.target.value }))}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i data-lucide="shield" className="w-5 h-5 text-purple-600"></i>
          Privacy &amp; Security
        </h3>
        <button type="button" className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-medium text-sm">
          Change Password
        </button>
      </div>
    </PropertyOwnerLayout>
  );
}
