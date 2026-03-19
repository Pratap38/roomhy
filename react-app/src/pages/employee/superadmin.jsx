import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";
import { useLegacySidebar } from "../../utils/legacyUi";

export default function Superadmin() {
  useHtmlPage({
    title: "Roomhy - Super Admin Dashboard",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic", crossorigin: true },
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      },
      { rel: "stylesheet", href: "/superadmin/assets/css/superadmin.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  useLegacySidebar();

  const [tenants, setTenants] = useState([]);
  const [owners, setOwners] = useState([]);
  const [properties, setProperties] = useState([]);
  const [rents, setRents] = useState([]);
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [tenantsRes, ownersRes, propertiesRes, rentsRes, signupsRes] = await Promise.all([
        fetchJson("/api/tenants"),
        fetchJson("/api/owners"),
        fetchJson("/api/properties"),
        fetchJson("/api/rents"),
        fetchJson("/api/kyc")
      ]);
      setTenants(tenantsRes?.tenants || tenantsRes || []);
      setOwners(ownersRes?.owners || ownersRes || []);
      setProperties(propertiesRes?.properties || propertiesRes || []);
      setRents(rentsRes?.rents || rentsRes || []);
      setSignups(Array.isArray(signupsRes) ? signupsRes : signupsRes?.data || []);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [tenants, owners, properties, rents, signups]);

  const revenue = useMemo(() => {
    let totalBooking = 0;
    let platformCommission = 0;
    let serviceFee = 0;
    rents.forEach((rent) => {
      const rentAmount = Number(rent.rentAmount || rent.totalDue || 0);
      const commission = Number(rent.commissionAmount || rentAmount * 0.1);
      const fee = Number(rent.serviceFeeAmount || 50);
      totalBooking += rentAmount;
      platformCommission += commission;
      serviceFee += fee;
    });
    const net = platformCommission + serviceFee;
    return { totalBooking, platformCommission, serviceFee, net };
  }, [rents]);

  const recentSignups = useMemo(() => {
    return [...signups].slice(-5).reverse();
  }, [signups]);

  return (
    <div className="html-page">
      <div className="flex h-screen overflow-hidden">
        <aside className="sidebar w-72 flex-shrink-0 hidden md:flex flex-col z-20 overflow-y-auto custom-scrollbar">
          <div className="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
            <div className="flex items-center gap-3">
              <div>
                <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
                <span className="text-[10px] text-gray-500">SUPER ADMIN</span>
              </div>
            </div>
          </div>
          <nav id="dynamicSidebarNav" className="flex-1 py-6 space-y-1"></nav>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
          <header className="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center">
              <button id="mobile-menu-open" className="md:hidden mr-4 text-slate-500">
                <i data-lucide="menu" className="w-6 h-6"></i>
              </button>
              <h2 className="text-lg font-semibold text-slate-800">Platform Overview</h2>
            </div>
            <button onClick={loadDashboard} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-2">
              <i data-lucide="refresh-cw" className="w-4 h-4"></i> Refresh
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Platform Dashboard</h1>
                <p className="text-sm text-slate-500 mt-1">Real-time performance metrics and platform growth statistics.</p>
              </div>

              {errorMsg && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-2">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><i data-lucide="users" className="w-6 h-6"></i></div>
                  </div>
                  <h3 className="text-slate-500 text-sm font-medium">Total Tenants</h3>
                  <p className="text-2xl font-bold text-slate-800">{loading ? "-" : tenants.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><i data-lucide="home" className="w-6 h-6"></i></div>
                  </div>
                  <h3 className="text-slate-500 text-sm font-medium">Total Properties</h3>
                  <p className="text-2xl font-bold text-slate-800">{loading ? "-" : properties.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><i data-lucide="briefcase" className="w-6 h-6"></i></div>
                  </div>
                  <h3 className="text-slate-500 text-sm font-medium">Property Owners</h3>
                  <p className="text-2xl font-bold text-slate-800">{loading ? "-" : owners.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><i data-lucide="indian-rupee" className="w-6 h-6"></i></div>
                  </div>
                  <h3 className="text-slate-500 text-sm font-medium">Platform Revenue</h3>
                  <p className="text-2xl font-bold text-slate-800">₹{loading ? "-" : revenue.net.toLocaleString()}</p>
                  <div className="mt-3 text-xs text-gray-500">
                    Booking: ₹{revenue.totalBooking.toLocaleString()} | Commission: ₹{revenue.platformCommission.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800">Recent Signups</h3>
                  <a href="/employee/new_signups" className="text-purple-600 text-sm font-bold hover:underline">View All</a>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Role</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading && (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
                      )}
                      {!loading && recentSignups.length === 0 && (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No recent signups found</td></tr>
                      )}
                      {recentSignups.map((user) => {
                        const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User";
                        const status = user.status || "pending";
                        return (
                          <tr key={user._id || user.email}>
                            <td className="px-6 py-4 text-sm font-semibold text-slate-700">{name}</td>
                            <td className="px-6 py-4 text-sm text-slate-500 capitalize">{user.role || "tenant"}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">{user.email || "-"}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${status === "verified" ? "bg-green-100 text-green-700" : status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}




