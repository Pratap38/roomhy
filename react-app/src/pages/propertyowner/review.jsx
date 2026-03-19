import React, { useEffect } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import { getOwnerSession } from "../../utils/ownerSession";

export default function Review() {
  useHtmlPage({
    title: "Roomhy - Admin Review Management",
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
      { rel: "stylesheet", href: "/propertyowner/assets/css/review.css" }
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
    <PropertyOwnerLayout owner={owner} title="Reviews" icon="star">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Review Management</h2>
        <p className="text-gray-500 mt-1">Approve and manage tenant reviews.</p>
      </div>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 text-gray-500">Review management API is not wired yet.</div>
      </div>
    </PropertyOwnerLayout>
  );
}
