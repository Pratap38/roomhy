import React, { useEffect, useMemo, useState } from "react";
import { fetchJson } from "../../utils/api";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import { requireOwnerSession } from "../../utils/ownerSession";

export default function Tenants() {
  useHtmlPage({
    title: "Roomhy - Admin Tenant Management",
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
      { rel: "stylesheet", href: "/propertyowner/assets/css/tenants.css" }
    ],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" }
    ],
    inlineScripts: []
  });

  const [owner, setOwner] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [tenants, filter, loading]);

  useEffect(() => {
    const session = requireOwnerSession();
    if (!session) return;
    setOwner(session);
    const load = async () => {
      try {
        const data = await fetchJson("/api/tenants");
        const list = Array.isArray(data) ? data : data?.tenants || data?.data || [];
        const ownerId = String(session.loginId || "").toUpperCase();
        const filtered = list.filter((tenant) => {
          const ownerLogin =
            tenant.property?.ownerLoginId ||
            tenant.ownerLoginId ||
            tenant.property?.owner ||
            tenant.owner;
          return ownerLogin ? String(ownerLogin).toUpperCase() === ownerId : true;
        });
        setTenants(filtered);
      } catch (err) {
        setErrorMsg(err?.body || err?.message || "Failed to load tenants.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredTenants = useMemo(() => {
    if (filter === "all") return tenants;
    return tenants.filter((tenant) => String(tenant.status || "active").toLowerCase() === filter);
  }, [tenants, filter]);

  return (
    <PropertyOwnerLayout owner={owner} title="Tenants" icon="users">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Tenant List</h2>
          <p className="text-gray-500 mt-1">
            {loading ? "Loading tenants..." : `${filteredTenants.length} tenants`}
          </p>
        </div>
        <button className="bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 flex items-center mt-4 sm:mt-0 shadow">
          <i data-lucide="user-plus" className="w-4 h-4 mr-2"></i> Add New Tenant
        </button>
      </div>

      {errorMsg && <div className="text-sm text-red-600 mb-4">{errorMsg}</div>}

      <div className="mb-6 flex space-x-3">
        {["all", "active", "inactive"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`filter-tab px-4 py-2 rounded-lg text-sm font-medium ${
              filter === status ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {status === "all" ? "All Tenants" : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full excel-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Property</th>
                <th>Room</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">Loading tenants...</td>
                </tr>
              )}
              {!loading && filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">No tenants found.</td>
                </tr>
              )}
              {!loading && filteredTenants.map((tenant) => (
                <tr key={tenant._id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{tenant.name || tenant.fullName || "Tenant"}</div>
                    <div className="text-xs text-gray-500">{tenant.email || "-"}</div>
                  </td>
                  <td className="px-4 py-3">{tenant.phone || tenant.mobile || "-"}</td>
                  <td className="px-4 py-3">{tenant.property?.title || "-"}</td>
                  <td className="px-4 py-3">{tenant.room?.number || tenant.roomNumber || "-"}</td>
                  <td className="px-4 py-3 capitalize">{tenant.status || "active"}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PropertyOwnerLayout>
  );
}
