import React, { useEffect, useMemo, useState } from "react";
import { fetchJson } from "../../utils/api";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import { requireOwnerSession } from "../../utils/ownerSession";

export default function Complaints() {
  useHtmlPage({
    title: "Roomhy - Tenant Complaints Management",
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
      { rel: "stylesheet", href: "/propertyowner/assets/css/complaints.css" }
    ],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" }
    ],
    inlineScripts: []
  });

  const [owner, setOwner] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [complaints, filter, loading]);

  useEffect(() => {
    const session = requireOwnerSession();
    if (!session) return;
    setOwner(session);
    const load = async () => {
      try {
        const data = await fetchJson("/api/complaints");
        const list = Array.isArray(data) ? data : data?.complaints || data?.data || [];
        setComplaints(list);
      } catch (err) {
        setErrorMsg(err?.body || err?.message || "Failed to load complaints.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const byStatus = { open: 0, taken: 0, resolved: 0, rejected: 0 };
    complaints.forEach((c) => {
      const status = String(c.status || "open").toLowerCase();
      if (status.includes("reject")) byStatus.rejected += 1;
      else if (status.includes("resolve")) byStatus.resolved += 1;
      else if (status.includes("taken") || status.includes("progress")) byStatus.taken += 1;
      else byStatus.open += 1;
    });
    return byStatus;
  }, [complaints]);

  const filtered = useMemo(() => {
    if (filter === "all") return complaints;
    return complaints.filter((c) => String(c.status || "open").toLowerCase().includes(filter));
  }, [complaints, filter]);

  const updateStatus = async (complaint, status) => {
    try {
      await fetchJson(`/api/complaints/${complaint._id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });
      setComplaints((prev) =>
        prev.map((item) => (item._id === complaint._id ? { ...item, status } : item))
      );
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to update status.");
    }
  };

  return (
    <PropertyOwnerLayout owner={owner} title="Tenant Complaints" icon="circle-alert">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tenant Complaints</h2>
        <p className="text-gray-500 mt-1">Manage complaints from your tenants.</p>
      </div>

      {errorMsg && <div className="text-sm text-red-600 mb-4">{errorMsg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Open</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.open}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">In Progress</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.taken}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Resolved</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.resolved}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-400">
          <p className="text-xs text-gray-500 uppercase font-semibold">Rejected</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.rejected}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-3">
        {["all", "open", "taken", "resolved"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`filter-btn px-4 py-2 rounded-lg text-sm font-medium ${
              filter === item ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {item === "all" ? "All" : item === "taken" ? "In Progress" : item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="text-center py-12 text-gray-400">Loading complaints...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">No complaints found.</div>
        )}
        {!loading && filtered.map((complaint) => (
          <div key={complaint._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-800">{complaint.title || "Complaint"}</h3>
                <p className="text-sm text-gray-500 mt-1">{complaint.description || "-"}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Tenant: {complaint.tenantName || complaint.tenantId || "-"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                  {complaint.status || "open"}
                </span>
                <select
                  value={complaint.status || "open"}
                  onChange={(e) => updateStatus(complaint, e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                >
                  <option value="open">Open</option>
                  <option value="taken">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PropertyOwnerLayout>
  );
}
