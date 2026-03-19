import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";

export default function Tenantdashboard() {
  useHtmlPage({
    title: "Roomhy - Tenant Dashboard",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/tenant/assets/css/tenantdashboard.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [tenant, setTenant] = useState(null);
  const [rent, setRent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [payOpen, setPayOpen] = useState(false);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [tenant, rent, payOpen]);

  const loadTenant = async () => {
    const stored = JSON.parse(localStorage.getItem("tenant_user") || localStorage.getItem("user") || "null");
    if (!stored?.loginId) {
      window.location.href = "/tenant//tenant/tenantlogin";
      return null;
    }
    try {
      const data = await fetchJson("/api/tenants");
      const list = data?.tenants || data || [];
      const match = list.find((t) => String(t.loginId || "").toUpperCase() === String(stored.loginId || "").toUpperCase());
      if (!match) throw new Error("Tenant profile not found.");
      setTenant(match);
      return match;
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to load tenant data.");
      return null;
    }
  };

  const loadRent = async (tenantRecord) => {
    if (!tenantRecord) return;
    try {
      const data = await fetchJson("/api/rents");
      const rents = data?.rents || data || [];
      const match = rents.find((r) =>
        String(r.tenantLoginId || "").toUpperCase() === String(tenantRecord.loginId || "").toUpperCase()
      );
      setRent(match || null);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to load rent data.");
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const t = await loadTenant();
      await loadRent(t);
      setLoading(false);
    })();
  }, []);

  const rentAmount = rent?.totalDue || rent?.rentAmount || tenant?.agreedRent || 0;
  const paymentStatus = rent?.paymentStatus || "pending";

  const statusLabel = useMemo(() => {
    if (paymentStatus === "paid" || paymentStatus === "completed") return "Paid";
    if (paymentStatus === "overdue") return "Overdue";
    return "Unpaid";
  }, [paymentStatus]);

  return (
    <div className="html-page">
      <div className="flex flex-col h-screen overflow-hidden">
        <nav className="top-navbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-8">
                <div className="flex items-center">
                  <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-16 w-auto" />
                </div>
                <div className="hidden md:flex items-center gap-1">
                  <a href="/tenant/tenantdashboard" className="nav-item active">
                    <i data-lucide="home" className="w-4 h-4 mr-2"></i>Dashboard
                  </a>
                  <button onClick={() => setPayOpen(true)} className="nav-item">
                    <i data-lucide="credit-card" className="w-4 h-4 mr-2"></i>Pay Rent
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <a href="/tenant/tenantcomplints" className="nav-item">
                  <i data-lucide="flag" className="w-4 h-4 mr-2"></i>Complaints
                </a>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white flex items-center justify-center font-bold text-sm">
                  {tenant?.name ? tenant.name.charAt(0).toUpperCase() : "T"}
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex-1 overflow-y-auto">
          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-slate-900">
                Welcome back, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{tenant?.name || "Tenant"}</span>
              </h2>
              <p className="text-slate-500 mt-2">Here's your rental summary and account overview</p>
            </div>

            {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}

            <div className="rent-banner p-8 rounded-2xl shadow-xl relative overflow-hidden">
              <div className="relative z-10 grid md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-2 text-blue-100 mb-3">
                    <i data-lucide="receipt" className="w-5 h-5"></i>
                    <span className="font-semibold text-sm uppercase tracking-wide">Monthly Rent Payment</span>
                  </div>
                  <div className="mb-6">
                    <p className="text-sm text-blue-100 mb-2">Amount Due</p>
                    <h1 className="text-6xl font-bold text-white">₹ {loading ? "--" : rentAmount}</h1>
                  </div>
                  <div className="flex flex-wrap gap-3 items-center">
                    <span className="px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur">Due: 5th of Month</span>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 ${statusLabel === "Paid" ? "bg-green-500" : statusLabel === "Overdue" ? "bg-red-500" : "bg-amber-500"}`}>
                      <i data-lucide="alert-circle" className="w-4 h-4"></i> {statusLabel}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col justify-between items-start md:items-end gap-6 text-white/90 text-sm">
                  <p><strong>Property:</strong> {tenant?.propertyTitle || tenant?.property?.title || "-"}</p>
                  <p><strong>Room:</strong> {tenant?.roomNo || "-"}</p>
                  <p><strong>Login ID:</strong> <span className="font-mono">{tenant?.loginId || "--"}</span></p>
                  <button onClick={() => setPayOpen(true)} className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-bold shadow-lg transition-all hover:shadow-2xl hover:scale-105 flex items-center gap-2 w-full md:w-auto justify-center">
                    <i data-lucide="credit-card" className="w-5 h-5"></i> Pay Now
                  </button>
                </div>
              </div>
            </div>

            <div className="dashboard-card p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i data-lucide="home" className="w-6 h-6 text-blue-600"></i>
                </div>
                Your Current Stay
              </h3>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Property</p>
                  <p className="text-lg font-bold text-slate-900">{tenant?.propertyTitle || tenant?.property?.title || "-"}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-2">Room Details</p>
                  <p className="text-lg font-bold text-blue-900">{tenant?.roomNo || "-"}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-100">
                  <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider mb-2">Login ID</p>
                  <p className="text-lg font-bold text-purple-900 font-mono">{tenant?.loginId || "--"}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-100">
                  <p className="text-xs text-orange-600 font-semibold uppercase tracking-wider mb-2">Move-In Date</p>
                  <p className="text-lg font-bold text-orange-900">
                    {tenant?.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString() : "--"}
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {payOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setPayOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Make Payment</h3>
              <button onClick={() => setPayOpen(false)} className="text-slate-400 hover:text-slate-600"><i data-lucide="x"></i></button>
            </div>
            <div className="text-center mb-8">
              <p className="text-sm text-slate-500 uppercase tracking-wide font-semibold">Total Payable</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">₹ {rentAmount}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
              Online payment integration will be enabled soon. Please contact your owner for payment instructions.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


