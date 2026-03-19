import React, { useEffect, useMemo, useState } from "react";
import { fetchJson } from "../../utils/api";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import { requireOwnerSession } from "../../utils/ownerSession";

export default function Payment() {
  useHtmlPage({
    title: "Roomhy - Admin Payments",
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
      { rel: "stylesheet", href: "/propertyowner/assets/css/payment.css" }
    ],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" }
    ],
    inlineScripts: []
  });

  const [owner, setOwner] = useState(null);
  const [rents, setRents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [rents, filter, loading]);

  useEffect(() => {
    const session = requireOwnerSession();
    if (!session) return;
    setOwner(session);
    const load = async () => {
      try {
        const data = await fetchJson(`/api/rents/owner/${session.loginId}`);
        const list = data?.rents || data?.data || [];
        setRents(list);
      } catch (err) {
        setErrorMsg(err?.body || err?.message || "Failed to load payments.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return rents;
    return rents.filter((rent) => String(rent.paymentStatus || "pending").toLowerCase() === filter);
  }, [rents, filter]);

  const stats = useMemo(() => {
    let collected = 0;
    let pending = 0;
    let overdue = 0;
    rents.forEach((rent) => {
      const status = String(rent.paymentStatus || "pending").toLowerCase();
      const amount = Number(rent.totalDue || rent.rentAmount || 0);
      if (status === "paid") collected += amount;
      else if (status === "overdue") overdue += amount;
      else pending += amount;
    });
    return { collected, pending, overdue };
  }, [rents]);

  return (
    <PropertyOwnerLayout owner={owner} title="Payments" icon="credit-card">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Payment Management</h2>
          <p className="text-gray-500 mt-1">Track rent, view history, and manage receipts.</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 flex items-center shadow-sm">
            <i data-lucide="download" className="w-4 h-4 mr-2"></i> Export CSV
          </button>
        </div>
      </div>

      {errorMsg && <div className="text-sm text-red-600 mb-4">{errorMsg}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Collected</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">INR {stats.collected}</h3>
            </div>
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <i data-lucide="wallet" className="w-6 h-6"></i>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Pending</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">INR {stats.pending}</h3>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
              <i data-lucide="clock" className="w-6 h-6"></i>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Overdue</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">INR {stats.overdue}</h3>
            </div>
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <i data-lucide="alert-circle" className="w-6 h-6"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {["all", "paid", "pending", "overdue"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`filter-tab ${filter === status ? "active" : ""}`}
          >
            {status === "all" ? "All Payments" : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full excel-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Property / Room</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-8">Loading payments...</td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-8">No payments found.</td>
                </tr>
              )}
              {!loading && filtered.map((rent) => (
                <tr key={rent._id}>
                  <td>
                    <div className="font-medium text-gray-900">{rent.tenantName || rent.tenantId?.name || "-"}</div>
                    <div className="text-xs text-gray-500">{rent.tenantEmail || "-"}</div>
                  </td>
                  <td>
                    <div className="font-medium">{rent.propertyName || rent.propertyId?.title || "-"}</div>
                    <div className="text-xs text-gray-500">{rent.roomNumber || "-"}</div>
                  </td>
                  <td>INR {rent.totalDue || rent.rentAmount || "-"}</td>
                  <td className="capitalize">{rent.paymentStatus || "pending"}</td>
                  <td className="text-right">
                    <a
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      href={`/propertyowner/payment-received?rentId=${rent._id}&ownerLoginId=${owner?.loginId || ""}`}
                    >
                      Mark Cash Received
                    </a>
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
