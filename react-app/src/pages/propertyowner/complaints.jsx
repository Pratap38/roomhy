import React, { useEffect, useMemo, useState } from "react";
import { fetchJson } from "../../utils/api";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import { requireOwnerSession } from "../../utils/ownerSession";

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

const statusBadge = (status, escalated) => {
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

const priorityBadge = (p) => {
  const map = {
    High: "bg-red-50 text-red-600 border border-red-200",
    Medium: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    Low: "bg-green-50 text-green-700 border border-green-200"
  };
  return map[p] || "bg-gray-50 text-gray-500";
};

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
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/propertyowner/assets/css/complaints.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [owner, setOwner] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filter, setFilter] = useState("all");
  const [responseModal, setResponseModal] = useState(null); // { complaint }
  const [responseText, setResponseText] = useState("");
  const [responseSubmitting, setResponseSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [complaints, filter, loading, responseModal]);

  useEffect(() => {
    const session = requireOwnerSession();
    if (!session) return;
    setOwner(session);
    loadComplaints(session);
  }, []);

  const loadComplaints = async (session) => {
    const ownerSession = session || owner;
    if (!ownerSession) return;
    try {
      setLoading(true);
      // Fetch complaints filtered by ownerLoginId
      const data = await fetchJson(
        `/api/complaints?ownerLoginId=${encodeURIComponent(ownerSession.loginId || ownerSession.ownerId || "")}`
      );
      const list = Array.isArray(data) ? data : data?.complaints || data?.data || [];
      setComplaints(list);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const open = complaints.filter((c) => ["open","Open"].includes(c.status || "Open")).length;
    const taken = complaints.filter((c) => ["taken","Taken"].includes(c.status || "")).length;
    const resolved = complaints.filter((c) => ["resolved","Resolved"].includes(c.status || "")).length;
    const rejected = complaints.filter((c) => ["rejected","Rejected"].includes(c.status || "")).length;
    const escalated = complaints.filter(isEscalated).length;
    return { total: complaints.length, open, taken, resolved, rejected, escalated };
  }, [complaints]);

  // Filtered list
  const filtered = useMemo(() => {
    if (filter === "all") return complaints;
    if (filter === "escalated") return complaints.filter(isEscalated);
    return complaints.filter((c) =>
      String(c.status || "open").toLowerCase().includes(filter.toLowerCase())
    );
  }, [complaints, filter]);

  const updateStatus = async (complaint, status) => {
    if (!complaint?._id) return;
    try {
      setUpdatingId(complaint._id);
      await fetchJson(`/api/complaints/${complaint._id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, resolvedAt: status === "Resolved" ? new Date().toISOString() : undefined })
      });
      setComplaints((prev) =>
        prev.map((item) =>
          item._id === complaint._id
            ? { ...item, status, resolvedAt: status === "Resolved" ? new Date().toISOString() : item.resolvedAt }
            : item
        )
      );
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to update status.");
    } finally {
      setUpdatingId("");
    }
  };

  const submitOwnerResponse = async () => {
    if (!responseModal || !responseText.trim()) return;
    setResponseSubmitting(true);
    try {
      await fetchJson(`/api/complaints/${responseModal._id}/response`, {
        method: "PUT",
        body: JSON.stringify({ ownerResponse: responseText.trim() })
      });
      setComplaints((prev) =>
        prev.map((item) =>
          item._id === responseModal._id ? { ...item, ownerResponse: responseText.trim() } : item
        )
      );
      setResponseModal(null);
      setResponseText("");
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to save response.");
    } finally {
      setResponseSubmitting(false);
    }
  };

  return (
    <PropertyOwnerLayout owner={owner} title="Tenant Complaints" icon="circle-alert">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tenant Complaints</h2>
          <p className="text-gray-500 mt-1 text-sm">Manage and resolve complaints from your tenants.</p>
        </div>
        <button
          onClick={() => loadComplaints(owner)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition"
        >
          <i data-lucide="refresh-cw" className="w-4 h-4"></i> Refresh
        </button>
      </div>

      {errorMsg && (
        <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg mb-4">{errorMsg}</div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, color: "border-slate-400" },
          { label: "Open", value: stats.open, color: "border-red-500" },
          { label: "In Progress", value: stats.taken, color: "border-yellow-500" },
          { label: "Resolved", value: stats.resolved, color: "border-green-500" },
          { label: "Escalated", value: stats.escalated, color: "border-orange-500" }
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${color}`}>
            <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${label === "Escalated" && value > 0 ? "text-orange-600" : "text-gray-800"}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Escalation warning ── */}
      {stats.escalated > 0 && (
        <div className="mb-5 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <i data-lucide="alert-triangle" className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0"></i>
          <div>
            <p className="text-sm font-bold text-orange-800">
              ⚠️ {stats.escalated} complaint{stats.escalated > 1 ? "s have" : " has"} been escalated to Super Admin!
            </p>
            <p className="text-xs text-orange-600 mt-1">
              Complaints not resolved within {ESCALATION_DAYS} days are automatically escalated.
              Please resolve them immediately to avoid further escalation.
            </p>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-5 flex flex-wrap gap-2">
        {[
          { key: "all", label: "All" },
          { key: "open", label: "Open" },
          { key: "taken", label: "In Progress" },
          { key: "resolved", label: "Resolved" },
          { key: "escalated", label: `🔴 Escalated (${stats.escalated})` }
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === key
                ? key === "escalated" ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Complaint cards ── */}
      <div className="space-y-4">
        {loading && (
          <div className="text-center py-12 text-gray-400">
            <i data-lucide="loader-2" className="w-8 h-8 animate-spin mx-auto mb-2"></i>
            <p>Loading complaints...</p>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <i data-lucide="inbox" className="w-10 h-10 mx-auto mb-3 opacity-40"></i>
            <p>No complaints found.</p>
          </div>
        )}
        {!loading && filtered.map((complaint) => {
          const escalated = isEscalated(complaint);
          const days = daysSince(complaint.createdAt || complaint.submittedAt);
          const status = complaint.status || "Open";
          const isUpdating = updatingId === complaint._id;

          return (
            <div
              key={complaint._id}
              className={`bg-white rounded-xl shadow-sm border p-5 transition ${
                escalated ? "border-orange-300 bg-orange-50/20" : "border-gray-100"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-800">
                      {complaint.category || complaint.title || "Complaint"}
                    </h3>
                    {escalated && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300">
                        <i data-lucide="alert-triangle" className="w-3 h-3"></i> Escalated
                      </span>
                    )}
                    {complaint.priority && (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${priorityBadge(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mt-1">{complaint.description || "-"}</p>

                  {/* Meta info */}
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <i data-lucide="user" className="w-3 h-3"></i>
                      {complaint.tenantName || complaint.tenantId || "-"}
                    </span>
                    {complaint.roomNo && (
                      <span className="flex items-center gap-1">
                        <i data-lucide="door-open" className="w-3 h-3"></i>
                        Room {complaint.roomNo}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <i data-lucide="clock" className="w-3 h-3"></i>
                      {days === 0 ? "Today" : `${days} day${days > 1 ? "s" : ""} ago`}
                    </span>
                    {escalated && (
                      <span className="text-orange-600 font-semibold">
                        ⚠️ {days - ESCALATION_DAYS + ESCALATION_DAYS} days pending — escalated
                      </span>
                    )}
                  </div>

                  {/* Owner response if exists */}
                  {complaint.ownerResponse && (
                    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                      <p className="text-xs font-semibold text-blue-600 mb-1">Your Response:</p>
                      <p className="text-sm text-gray-700">{complaint.ownerResponse}</p>
                    </div>
                  )}
                </div>

                {/* Right side — status + actions */}
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusBadge(status, escalated)}`}>
                    {escalated && !["Resolved","resolved"].includes(status) ? "Escalated" : status}
                  </span>

                  {/* Status update dropdown */}
                  <select
                    value={status}
                    disabled={isUpdating}
                    onChange={(e) => updateStatus(complaint, e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-60 cursor-pointer"
                  >
                    <option value="Open">Open</option>
                    <option value="Taken">In Progress</option>
                    <option value="Resolved">Resolved ✓</option>
                    <option value="Rejected">Rejected</option>
                  </select>

                  {/* Add response button */}
                  <button
                    onClick={() => { setResponseModal(complaint); setResponseText(complaint.ownerResponse || ""); }}
                    className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition flex items-center gap-1"
                  >
                    <i data-lucide="message-circle" className="w-3 h-3"></i>
                    {complaint.ownerResponse ? "Edit Response" : "Add Response"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Response Modal ── */}
      {responseModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setResponseModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <h3 className="font-bold text-gray-900">Respond to Complaint</h3>
              <button onClick={() => setResponseModal(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-slate-500 font-semibold mb-1">Complaint:</p>
              <p className="text-sm text-slate-700">{responseModal.description || responseModal.category}</p>
            </div>
            <textarea
              rows={4}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Type your response to the tenant..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setResponseModal(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={submitOwnerResponse}
                disabled={responseSubmitting || !responseText.trim()}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
              >
                {responseSubmitting ? "Saving..." : "Send Response"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}