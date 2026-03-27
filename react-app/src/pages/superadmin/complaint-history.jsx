import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";
import { useLegacySidebar } from "../../utils/legacyUi";

const STATUS_ORDER = ["Open", "Taken", "Resolved", "Rejected"];
const ESCALATION_DAYS = 5;

const daysSince = (dateStr) => {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
};

const isEscalated = (c) => {
  if (["Resolved", "Rejected", "resolved", "rejected"].includes(c.status)) return false;
  if (c.escalated) return true;
  return daysSince(c.createdAt || c.submittedAt) >= ESCALATION_DAYS;
};

const statusBadgeClass = (status, escalated) => {
  if (escalated) return "bg-orange-100 text-orange-700 border border-orange-300";
  const map = {
    Open: "bg-red-100 text-red-700",
    open: "bg-red-100 text-red-700",
    Taken: "bg-yellow-100 text-yellow-700",
    taken: "bg-yellow-100 text-yellow-700",
    Resolved: "bg-green-100 text-green-700",
    resolved: "bg-green-100 text-green-700",
    Rejected: "bg-gray-100 text-gray-600",
    rejected: "bg-gray-100 text-gray-600"
  };
  return map[status] || "bg-slate-100 text-slate-600";
};

const priorityClass = (p) => {
  const map = {
    High: "text-red-600 font-bold",
    Medium: "text-yellow-600 font-semibold",
    Low: "text-green-600"
  };
  return map[p] || "text-gray-500";
};

export default function ComplaintHistory() {
  useHtmlPage({
    title: "Roomhy - Complaint History & Management",
    bodyClass: "text-gray-900",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/superadmin/assets/css/complaint-history.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  useLegacySidebar();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [actionId, setActionId] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "escalated"

  const loadComplaints = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await fetchJson("/api/complaints");
      setComplaints(data?.complaints || data || []);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadComplaints(); }, []);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [complaints, filter, query, activeTab, loading]);

  // Stats
  const stats = useMemo(() => {
    const total = complaints.length;
    const open = complaints.filter((c) => ["Open","open"].includes(c.status || "Open")).length;
    const taken = complaints.filter((c) => ["Taken","taken"].includes(c.status || "")).length;
    const resolved = complaints.filter((c) => ["Resolved","resolved"].includes(c.status || "")).length;
    const rejected = complaints.filter((c) => ["Rejected","rejected"].includes(c.status || "")).length;
    const escalated = complaints.filter(isEscalated).length;
    return { total, open, taken, resolved, rejected, escalated };
  }, [complaints]);

  // Escalated complaints (for dedicated tab)
  const escalatedList = useMemo(
    () => complaints.filter(isEscalated).sort((a, b) => daysSince(a.createdAt) - daysSince(b.createdAt)),
    [complaints]
  );

  // Main filtered list
  const filtered = useMemo(() => {
    const base = activeTab === "escalated" ? escalatedList : complaints;
    const normalizedQuery = query.trim().toLowerCase();
    return base.filter((c) => {
      const status = String(c.status || "Open");
      if (filter !== "all" && status !== filter) return false;
      if (!normalizedQuery) return true;
      const name = String(c.complaintBy || c.tenantName || c.tenantId || "").toLowerCase();
      const msg = String(c.message || c.description || c.complaint || c.title || "").toLowerCase();
      const cat = String(c.category || "").toLowerCase();
      return name.includes(normalizedQuery) || msg.includes(normalizedQuery) || cat.includes(normalizedQuery);
    });
  }, [complaints, escalatedList, filter, query, activeTab]);

  const updateStatus = async (complaint, status) => {
    if (!complaint?._id) return;
    if (!window.confirm(`Mark complaint as "${status}"?`)) return;
    try {
      setActionId(complaint._id);
      await fetchJson(`/api/complaints/${complaint._id}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          resolvedAt: status === "Resolved" ? new Date().toISOString() : undefined,
          // If manually resolved by superadmin, clear escalation
          escalated: status === "Resolved" ? false : undefined
        })
      });
      await loadComplaints();
    } catch (err) {
      window.alert(err?.body || err?.message || "Failed to update complaint");
    } finally {
      setActionId("");
    }
  };

  const forceEscalate = async (complaint) => {
    if (!complaint?._id) return;
    if (!window.confirm("Manually escalate this complaint to Super Admin priority?")) return;
    try {
      setActionId(complaint._id);
      await fetchJson(`/api/complaints/${complaint._id}/status`, {
        method: "PUT",
        body: JSON.stringify({ escalated: true })
      });
      await loadComplaints();
    } catch (err) {
      window.alert(err?.body || err?.message || "Failed to escalate");
    } finally {
      setActionId("");
    }
  };

  const ComplaintRow = ({ complaint, showEscalatedBadge = false }) => {
    const status = complaint.status || "Open";
    const escalated = isEscalated(complaint);
    const days = daysSince(complaint.createdAt || complaint.submittedAt);
    const isActing = actionId === complaint._id;

    return (
      <div className={`p-5 border-b last:border-b-0 ${escalated ? "bg-orange-50/40" : "hover:bg-gray-50/50"} transition`}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Tenant + property */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-semibold text-gray-900">
                {complaint.complaintBy || complaint.tenantName || "Tenant"}
              </p>
              {escalated && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300">
                  <i data-lucide="alert-triangle" className="w-3 h-3"></i>
                  Escalated — {days}d pending
                </span>
              )}
              {complaint.priority && (
                <span className={`text-xs ${priorityClass(complaint.priority)}`}>
                  [{complaint.priority}]
                </span>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-2">
              {complaint.property || complaint.propertyName || complaint.tenantId || "-"}
              {complaint.roomNo ? ` • Room ${complaint.roomNo}` : ""}
            </p>

            {/* Category + description */}
            {complaint.category && (
              <p className="text-xs font-semibold text-purple-600 mb-1">{complaint.category}</p>
            )}
            <p className="text-sm text-gray-700">
              {complaint.description || complaint.message || complaint.complaint || complaint.title || "-"}
            </p>

            {/* Owner response */}
            {complaint.ownerResponse && (
              <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <p className="text-xs font-semibold text-blue-600">Owner Response:</p>
                <p className="text-xs text-gray-600 mt-0.5">{complaint.ownerResponse}</p>
              </div>
            )}

            {/* Time info */}
            <p className="text-xs text-gray-400 mt-2">
              Submitted: {days === 0 ? "Today" : `${days} day${days > 1 ? "s" : ""} ago`}
              {complaint.resolvedAt && ` • Resolved: ${new Date(complaint.resolvedAt).toLocaleDateString("en-IN")}`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusBadgeClass(status, escalated)}`}>
              {escalated && !["Resolved","resolved"].includes(status) ? "Escalated" : status}
            </span>

            <div className="flex gap-2 flex-wrap justify-end">
              {STATUS_ORDER.filter((s) => s !== status).map((nextStatus) => (
                <button
                  key={nextStatus}
                  disabled={isActing}
                  onClick={() => updateStatus(complaint, nextStatus)}
                  className={`text-xs font-medium border px-3 py-1 rounded-lg transition disabled:opacity-60 ${
                    nextStatus === "Resolved"
                      ? "border-green-300 text-green-700 hover:bg-green-50"
                      : nextStatus === "Rejected"
                      ? "border-red-200 text-red-600 hover:bg-red-50"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {isActing ? "..." : nextStatus}
                </button>
              ))}
              {!escalated && !["Resolved","Rejected"].includes(status) && (
                <button
                  disabled={isActing}
                  onClick={() => forceEscalate(complaint)}
                  className="text-xs font-medium border border-orange-300 text-orange-600 px-3 py-1 rounded-lg hover:bg-orange-50 transition disabled:opacity-60"
                >
                  Escalate
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="html-page">
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="sidebar w-72 flex-shrink-0 hidden md:flex flex-col z-20 overflow-y-auto custom-scrollbar">
          <div className="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
            <div>
              <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
              <span className="text-[10px] text-gray-500">SUPER ADMIN</span>
            </div>
          </div>
          <nav className="flex-1 py-6 space-y-1">
            <div className="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Overview</div>
            <a href="/superadmin/superadmin" className="sidebar-link"><i data-lucide="layout-dashboard" className="w-5 h-5 mr-3"></i> Dashboard</a>
            <div className="mt-6 px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Management</div>
            <a href="/superadmin/manager" className="sidebar-link"><i data-lucide="map-pin" className="w-5 h-5 mr-3"></i> Teams</a>
            <a href="/superadmin/owner" className="sidebar-link"><i data-lucide="briefcase" className="w-5 h-5 mr-3"></i> Property Owners</a>
            <a href="/superadmin/properties" className="sidebar-link"><i data-lucide="home" className="w-5 h-5 mr-3"></i> Properties</a>
            <a href="/superadmin/tenant" className="sidebar-link"><i data-lucide="users" className="w-5 h-5 mr-3"></i> Tenants</a>
            <a href="/superadmin/new_signups" className="sidebar-link"><i data-lucide="file-badge" className="w-5 h-5 mr-3"></i> New Signups</a>
            <div className="mt-6 px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Operations</div>
            <a href="/superadmin/websiteenq" className="sidebar-link"><i data-lucide="folder-open" className="w-5 h-5 mr-3"></i> Web Enquiry</a>
            <a href="/superadmin/enquiry" className="sidebar-link"><i data-lucide="help-circle" className="w-5 h-5 mr-3"></i> Enquiries</a>
            <a href="/superadmin/booking" className="sidebar-link"><i data-lucide="calendar-check" className="w-5 h-5 mr-3"></i> Bookings</a>
            <a href="/superadmin/reviews" className="sidebar-link"><i data-lucide="star" className="w-5 h-5 mr-3"></i> Reviews</a>
            <a href="/superadmin/complaint-history" className="sidebar-link active">
              <i data-lucide="alert-circle" className="w-5 h-5 mr-3"></i> Complaint History
              {stats.escalated > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {stats.escalated}
                </span>
              )}
            </a>
            <div className="mt-6 px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Website</div>
            <a href="/superadmin/website" className="sidebar-link"><i data-lucide="globe" className="w-5 h-5 mr-3"></i> Live Properties</a>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center text-sm">
              <span className="text-slate-500 font-medium">Support</span>
              <i data-lucide="chevron-right" className="w-4 h-4 mx-2 text-slate-400"></i>
              <span className="text-slate-800 font-semibold">Complaint History</span>
            </div>
            <div className="flex items-center gap-3">
              {stats.escalated > 0 && (
                <button
                  onClick={() => setActiveTab("escalated")}
                  className="flex items-center gap-2 bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-orange-600 transition animate-pulse"
                >
                  <i data-lucide="alert-triangle" className="w-4 h-4"></i>
                  {stats.escalated} Escalated
                </button>
              )}
              <button onClick={loadComplaints} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-2 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50">
                <i data-lucide="refresh-cw" className="w-4 h-4"></i> Refresh
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Complaint History & Management</h1>
                <p className="text-sm text-slate-500 mt-1">Full complaint tracking across all properties. Escalated complaints need immediate action.</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                {[
                  { label: "Total", value: stats.total, color: "border-slate-400", textColor: "text-slate-800" },
                  { label: "Open", value: stats.open, color: "border-red-500", textColor: "text-red-700" },
                  { label: "In Progress", value: stats.taken, color: "border-yellow-500", textColor: "text-yellow-700" },
                  { label: "Resolved", value: stats.resolved, color: "border-green-500", textColor: "text-green-700" },
                  { label: "Rejected", value: stats.rejected, color: "border-gray-400", textColor: "text-gray-600" },
                  { label: "🔴 Escalated", value: stats.escalated, color: "border-orange-500", textColor: "text-orange-600" }
                ].map(({ label, value, color, textColor }) => (
                  <div
                    key={label}
                    onClick={() => label.includes("Escalated") && setActiveTab("escalated")}
                    className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${color} ${label.includes("Escalated") ? "cursor-pointer hover:shadow-md transition" : ""}`}
                  >
                    <p className="text-xs text-gray-500 uppercase font-semibold leading-tight">{label}</p>
                    <p className={`text-2xl font-bold mt-1 ${textColor}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Escalation alert banner */}
              {stats.escalated > 0 && (
                <div className="mb-5 bg-orange-50 border-2 border-orange-300 rounded-xl px-5 py-4 flex items-start gap-3">
                  <i data-lucide="siren" className="w-6 h-6 text-orange-500 mt-0.5 flex-shrink-0"></i>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-orange-900">
                      🚨 {stats.escalated} Complaint{stats.escalated > 1 ? "s" : ""} Escalated — Immediate Action Required
                    </p>
                    <p className="text-xs text-orange-700 mt-1">
                      These complaints have been pending for over {ESCALATION_DAYS} days without resolution by the property owner.
                      Super Admin intervention is required.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("escalated")}
                    className="text-sm font-bold text-orange-700 border border-orange-400 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition whitespace-nowrap"
                  >
                    View All →
                  </button>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 mb-4 border-b border-gray-200">
                {[
                  { key: "all", label: `All Complaints (${stats.total})` },
                  { key: "escalated", label: `🔴 Escalated (${stats.escalated})` }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition ${
                      activeTab === key
                        ? key === "escalated"
                          ? "border-orange-500 text-orange-700"
                          : "border-purple-600 text-purple-700"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Search + filter */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-5 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative flex-grow md:flex-grow-0">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tenant, complaint, category..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 w-full md:w-80 focus:outline-none"
                  />
                  <i data-lucide="search" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"></i>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["all", "Open", "Taken", "Resolved"].map((label) => (
                    <button
                      key={label}
                      onClick={() => setFilter(label)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        filter === label ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {label === "all" ? "All" : label === "Taken" ? "In Progress" : label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Complaint list */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading && (
                  <div className="text-center py-12 text-slate-400">
                    <i data-lucide="loader-2" className="w-8 h-8 animate-spin mx-auto mb-2"></i>
                    <p>Loading complaints...</p>
                  </div>
                )}
                {!loading && errorMsg && (
                  <div className="text-center py-12 text-red-500">{errorMsg}</div>
                )}
                {!loading && !errorMsg && filtered.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <i data-lucide="inbox" className="w-10 h-10 mx-auto mb-3 opacity-40"></i>
                    <p>{activeTab === "escalated" ? "No escalated complaints." : "No complaints found."}</p>
                  </div>
                )}
                {!loading && !errorMsg && filtered.map((complaint) => (
                  <ComplaintRow key={complaint._id} complaint={complaint} />
                ))}
              </div>

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}