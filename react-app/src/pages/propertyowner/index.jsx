import React, { useEffect } from "react";
import { useHtmlPage } from "../../utils/htmlPage";

export default function Index() {
  useHtmlPage({
    title: "Roomhy - Owner Login",
    bodyClass: "flex items-center justify-center min-h-screen p-4",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/propertyowner/assets/css/index.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, []);

  const goToTenantLogin = () => {
    const host = window.location.hostname;
    if (host === "admin.roomhy.com" || host === "www.admin.roomhy.com") {
      window.location.href = "https://admin.roomhy.com/tenant/tenantlogin";
      return;
    }
    window.location.href = "/tenant/tenantlogin";
  };

  return (
    <div className="html-page">
      <div className="light-card w-full max-w-md p-8 text-center relative overflow-hidden">
        <a href="/website/index" className="inline-flex items-center justify-center mb-4">
          <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-10 w-auto" />
        </a>

        <div className="mb-4 flex justify-center gap-3">
          <a href="/propertyowner/ownerlogin" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold">Owner Login</a>
          <button type="button" onClick={goToTenantLogin} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200">
            Tenant Login
          </button>
        </div>

        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Portal Login</h1>
        <p className="text-gray-500 mb-6">Choose your role to proceed.</p>
      </div>
    </div>
  );
}


