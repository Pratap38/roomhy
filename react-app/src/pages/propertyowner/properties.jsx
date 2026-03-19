import React, { useEffect, useState } from "react";
import { fetchJson } from "../../utils/api";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import { requireOwnerSession } from "../../utils/ownerSession";

export default function Properties() {
  useHtmlPage({
    title: "Roomhy - Admin Properties",
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
      { rel: "stylesheet", href: "/propertyowner/assets/css/properties.css" }
    ],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" }
    ],
    inlineScripts: []
  });

  const [owner, setOwner] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [properties, loading]);

  useEffect(() => {
    const session = requireOwnerSession();
    if (!session) return;
    setOwner(session);
    const load = async () => {
      try {
        const data = await fetchJson(`/api/owners/${session.loginId}/properties`);
        setProperties(data?.properties || []);
      } catch (err) {
        setErrorMsg(err?.body || err?.message || "Failed to load properties.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <PropertyOwnerLayout owner={owner} title="Properties" icon="home">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Properties</h2>
        <p className="text-gray-500 mt-1">All properties listed under your account.</p>
      </div>

      {errorMsg && <div className="text-sm text-red-600 mb-4">{errorMsg}</div>}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th>Property Name</th>
              <th>City</th>
              <th>Area</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Loading properties...</td></tr>
            )}
            {!loading && properties.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No properties found.</td></tr>
            )}
            {!loading && properties.map((property) => (
              <tr key={property._id}>
                <td className="px-4 py-3">{property.title || property.name || "-"}</td>
                <td className="px-4 py-3">{property.city || "-"}</td>
                <td className="px-4 py-3">{property.area || property.locationCode || "-"}</td>
                <td className="px-4 py-3 capitalize">{property.status || "active"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PropertyOwnerLayout>
  );
}
