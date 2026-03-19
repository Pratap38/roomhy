import React, { useEffect, useMemo, useState } from "react";
import { fetchJson } from "../../utils/api";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import {
  clearOwnerRuntimeSession,
  fetchOwnerTenants,
  formatDate,
  getOwnerRuntimeSession
} from "../../utils/propertyowner";

export default function Admin() {
  useHtmlPage({
    title: "Roomhy - Owner Dashboard",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/propertyowner/assets/css/admin.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [owner, setOwner] = useState(null);
  const [roomsCount, setRoomsCount] = useState(0);
  const [tenantsCount, setTenantsCount] = useState(0);
  const [rentTotal, setRentTotal] = useState(0);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const notificationCount = useMemo(
    () => enquiries.filter((item) => ["pending", "hold"].includes(String(item.status || "").toLowerCase())).length,
    [enquiries]
  );

  useEffect(() => {
    if (window?.lucide?.createIcons) window.lucide.createIcons();
  }, [owner, enquiries, loading]);

  const loadDashboard = async (loginId) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [ownerRes, roomsRes, tenantsRes, rentRes, enquiryRes] = await Promise.all([
        fetchJson(`/api/owners/${encodeURIComponent(loginId)}`).catch(() => null),
        fetchJson(`/api/owners/${encodeURIComponent(loginId)}/rooms`),
        fetchOwnerTenants(loginId),
        fetchJson(`/api/owners/${encodeURIComponent(loginId)}/rent`),
        fetchJson(`/api/owners/${encodeURIComponent(loginId)}/enquiries`)
      ]);
      setOwner((prev) => ({ ...prev, ...(ownerRes || {}) }));
      setRoomsCount((roomsRes?.rooms || []).length);
      setTenantsCount((Array.isArray(tenantsRes) ? tenantsRes : tenantsRes?.tenants || []).length);
      setRentTotal(rentRes?.totalRent || 0);
      setEnquiries(Array.isArray(enquiryRes) ? enquiryRes : enquiryRes?.enquiries || []);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = getOwnerRuntimeSession();
    if (!session?.loginId) {
      window.location.href = "/propertyowner/ownerlogin";
      return;
    }
    setOwner(session);
    loadDashboard(session.loginId);
  }, []);

  const handleEnquiryAction = async (enquiryId, status) => {
    try {
      await fetchJson(`/api/owners/enquiries/${encodeURIComponent(enquiryId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      if (owner?.loginId) {
        await loadDashboard(owner.loginId);
      }
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to update enquiry.");
    }
  };

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Dashboard"
      navVariant="default"
      notificationCount={notificationCount}
      notifications={enquiries.slice(0, 5).map((item) => ({
        title: item.propertyName || item.property?.name || "Enquiry",
        message: `${item.name || item.tenantName || "Tenant"} | ${item.status || "pending"}`
      }))}
      onLogout={() => {
        clearOwnerRuntimeSession();
        window.location.href = "/propertyowner/ownerlogin";
      }}
      contentClassName="max-w-7xl mx-auto"
    >
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome back, {owner?.name || "Owner"}!</h1>
          <p className="text-sm text-slate-500 mt-1">Here's what's happening with your properties today.</p>
        </div>
      </div>

      {errorMsg ? <div className="text-sm text-red-600 mb-4">{errorMsg}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-orange-100 text-sm font-medium">Tenants</p>
            <h3 className="text-3xl font-bold mt-2">{loading ? "0" : tenantsCount}</h3>
          </div>
          <div className="absolute right-4 top-4 opacity-20 group-hover:scale-110 transition-transform duration-300">
            <i data-lucide="users" className="w-12 h-12"></i>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-purple-100 text-sm font-medium">Rooms</p>
            <h3 className="text-3xl font-bold mt-2">{loading ? "0" : roomsCount}</h3>
          </div>
          <div className="absolute right-4 top-4 opacity-20 group-hover:scale-110 transition-transform duration-300">
            <i data-lucide="bed-double" className="w-12 h-12"></i>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-green-100 text-sm font-medium">Rent Collected</p>
            <h3 className="text-3xl font-bold mt-2">{`Rs ${loading ? "0" : rentTotal}`}</h3>
          </div>
          <div className="absolute right-4 top-4 opacity-20 group-hover:scale-110 transition-transform duration-300">
            <i data-lucide="indian-rupee" className="w-12 h-12"></i>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800">Occupancy Overview</h3>
            <select className="text-xs border-gray-300 rounded text-gray-600">
              <option>This Month</option>
              <option>Last Month</option>
            </select>
          </div>
          <div className="h-64 w-full flex items-center justify-center bg-gray-50 rounded border border-dashed border-gray-300">
            <p className="text-gray-400 text-sm flex items-center gap-2">
              <i data-lucide="bar-chart-2" className="w-5 h-5"></i>
              Chart Data Loading...
            </p>
          </div>
        </div>
      </div>
    </PropertyOwnerLayout>
  );
}
