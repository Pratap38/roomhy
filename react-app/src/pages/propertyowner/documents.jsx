import React, { useEffect } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import { getOwnerSession } from "../../utils/ownerSession";

export default function Documents() {
  useHtmlPage({
    title: "Roomhy - Admin Legal Documents & Rules",
    bodyClass: "text-gray-900",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic", crossOrigin: true },
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      },
      { rel: "stylesheet", href: "/propertyowner/assets/css/documents.css" }
    ],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" }
    ],
    inlineScripts: []
  });

  const owner = getOwnerSession();

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, []);

  return (
    <PropertyOwnerLayout owner={owner} title="Documents" icon="file-text">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Legal & Agreements</h2>
          <p className="text-gray-500 mt-1">Manage property templates and tenant signatures.</p>
        </div>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 flex items-center shadow-sm">
          <i data-lucide="upload" className="w-4 h-4 mr-2"></i> Upload Template
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Templates</h3>
        </div>
        <div className="p-6 text-sm text-gray-600">
          No templates uploaded yet. Add your lease and agreement templates here.
        </div>
      </div>
    </PropertyOwnerLayout>
  );
}
