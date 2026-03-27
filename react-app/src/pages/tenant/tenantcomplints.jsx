
import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";

const FILTERS = ["All", "Open", "In Progress", "Resolved"];
const ESCALATION_DAYS = 5;

const daysSince = (dateStr) => {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
};

const isEscalated = (complaint) => {
  if (["Resolved", "Rejected"].includes(complaint.status)) return false;
  if (complaint.escalated) return true;
  return daysSince(complaint.createdAt || complaint.submittedAt) >= ESCALATION_DAYS;
};

const statusColor = (status, escalated) => {
  if (escalated) return "bg-orange-100 text-orange-700 border border-orange-300";
  const map = {
    Open: "bg-red-100 text-red-700",
    Taken: "bg-yellow-100 text-yellow-700",
    "In Progress": "bg-yellow-100 text-yellow-700",
    Resolved: "bg-green-100 text-green-700",
    Rejected: "bg-gray-100 text-gray-600"
  };
  return map[status] || "bg-slate-100 text-slate-600";
};

const priorityColor = (p) => {
  const map = { High: "text-red-600 font-bold", Medium: "text-yellow-600 font-semibold", Low: "text-green-600" };
  return map[p] || "text-slate-500";
};

export default function Tenantcomplints() {
  useHtmlPage({
    title: "Roomhy - My Complaints & Requests",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/tenant/assets/css/tenantcomplints.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [tenant, setTenant] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filter, setFilter] = useState("All");

  // Modal Visibility States
  const [minorModalOpen, setMinorModalOpen] = useState(false);
  const [majorModalOpen, setMajorModalOpen] = useState(false);

  // Minor Complaint State
  const [minorCategory, setMinorCategory] = useState("");
  const [minorDesc, setMinorDesc] = useState("");
  const [minorStatus, setMinorStatus] = useState({ loading: false, error: "" });

  // Major/Priority Complaint State
  const [majorDesc, setMajorDesc] = useState("");
  const [majorImage, setMajorImage] = useState(null); // Will store base64 string
  const [majorStatus, setMajorStatus] = useState({ loading: false, error: "" });

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [complaints, filter, loading, minorModalOpen, majorModalOpen, minorStatus, majorStatus]);

  const loadTenant = async () => {
    const stored = JSON.parse(
      localStorage.getItem("tenant_user") || localStorage.getItem("user") || "null"
    );
    if (!stored?.loginId) {
      window.location.href = "/tenant/tenantlogin";
      return null;
    }
    try {
      const data = await fetchJson("/api/tenants");
      const list = data?.tenants || data || [];
      const match = list.find(
        (t) => String(t.loginId || "").toUpperCase() === String(stored.loginId || "").toUpperCase()
      );
      if (!match) throw new Error("Tenant profile not found.");
      setTenant(match);
      return match;
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to load tenant data.");
      return null;
    }
  };

  const loadComplaints = async (tenantRecord) => {
    if (!tenantRecord?._id) return;
    try {
      setLoading(true);
      const data = await fetchJson(`/api/complaints/tenant/${tenantRecord._id}`);
      setComplaints(data?.complaints || data || []);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const t = await loadTenant();
      if (t) await loadComplaints(t);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "All") return complaints;
    if (filter === "In Progress") return complaints.filter((c) => c.status === "Taken" || c.status === "In Progress");
    return complaints.filter((c) => (c.status || "Open") === filter);
  }, [complaints, filter]);

  // Stats
  const stats = useMemo(() => ({
    total: complaints.length,
    open: complaints.filter((c) => c.status === "Open" || !c.status).length,
    escalated: complaints.filter(isEscalated).length,
    resolved: complaints.filter((c) => c.status === "Resolved").length
  }), [complaints]);

  // Handle Minor Submission
  const submitMinorComplaint = async () => {
    if (!tenant) return;
    if (!minorCategory || !minorDesc.trim()) {
      setMinorStatus({ loading: false, error: "Please select a category and enter a description." });
      return;
    }
    setMinorStatus({ loading: true, error: "" });
    
    try {
      await fetchJson("/api/complaints", {
        method: "POST",
        body: JSON.stringify({
          tenantId: tenant._id,
          tenantLoginId: tenant.loginId,
          tenantName: tenant.name,
          tenantPhone: tenant.phone,
          tenantEmail: tenant.email,
          property: tenant.propertyTitle || tenant.property?.title,
          propertyId: tenant.propertyId || tenant.property?._id,
          ownerLoginId: tenant.ownerLoginId,
          roomNo: tenant.roomNo,
          bedNo: tenant.bedNo,
          category: minorCategory,
          description: minorDesc,
          priority: "Low",
          status: "Open",
          escalated: false,
          createdAt: new Date().toISOString()
        })
      });
      setMinorCategory("");
      setMinorDesc("");
      setMinorStatus({ loading: false, error: "" });
      setMinorModalOpen(false); // Close Modal on success
      await loadComplaints(tenant);
    } catch (err) {
      setMinorStatus({ loading: false, error: err?.body || err?.message || "Failed to submit minor complaint." });
    }
  };

  // Image Upload Handler for Major
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMajorImage(reader.result);
      reader.readAsDataURL(file);
    } else {
      setMajorImage(null);
    }
  };

  // Handle Major Submission
  const submitMajorComplaint = async () => {
    if (!tenant) return;
    if (!majorDesc.trim()) {
      setMajorStatus({ loading: false, error: "Please enter a description for the priority issue." });
      return;
    }
    setMajorStatus({ loading: true, error: "" });
    
    try {
      await fetchJson("/api/complaints", {
        method: "POST",
        body: JSON.stringify({
          tenantId: tenant._id,
          tenantLoginId: tenant.loginId,
          tenantName: tenant.name,
          tenantPhone: tenant.phone,
          tenantEmail: tenant.email,
          property: tenant.propertyTitle || tenant.property?.title,
          propertyId: tenant.propertyId || tenant.property?._id,
          ownerLoginId: tenant.ownerLoginId,
          roomNo: tenant.roomNo,
          bedNo: tenant.bedNo,
          category: "Major Issue",
          description: majorDesc,
          priority: "High",
          imageStr: majorImage, 
          status: "Open",
          escalated: false,
          createdAt: new Date().toISOString()
        })
      });
      setMajorDesc("");
      setMajorImage(null);
      
      const fileInput = document.getElementById("majorImageInput");
      if (fileInput) fileInput.value = "";

      setMajorStatus({ loading: false, error: "" });
      setMajorModalOpen(false); // Close Modal on success
      await loadComplaints(tenant);
    } catch (err) {
      setMajorStatus({ loading: false, error: err?.body || err?.message || "Failed to submit priority complaint." });
    }
  };

  return (
    <div className="html-page">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-[#0f172a] flex-shrink-0 hidden md:flex flex-col transition-all duration-300">
          <div className="h-20 flex items-center px-6 border-b border-slate-800">
            <div className="bg-purple-600 p-2 rounded-lg mr-3">
              <i data-lucide="home" className="w-5 h-5 text-white"></i>
            </div>
            <div>
              <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
              <p className="text-[10px] text-slate-400 font-medium tracking-wider">TENANT PORTAL</p>
            </div>
          </div>
          <nav className="flex-1 py-2 overflow-y-auto custom-scrollbar">
            <a href="/tenant/tenantdashboard" className="sidebar-item">Dashboard</a>
            <div className="sidebar-section-title">Information Hub</div>
            <a href="/tenant/tenantcomplints" className="sidebar-item active">View My Requests</a>
          </nav>
          <div className="p-4 border-t border-slate-800">
            <a href="/tenant/tenantlogin" className="flex items-center text-slate-400 hover:text-white w-full px-4 py-2 text-sm font-medium transition-colors">
              <i data-lucide="log-out" className="w-5 h-5 mr-3"></i> Logout
            </a>
          </div>
        </aside>

        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <header className="bg-white h-16 flex items-center justify-between px-6 border-b border-slate-200 flex-shrink-0">
            <h2 className="text-lg font-bold text-slate-800">My Requests & Complaints</h2>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
            <div className="max-w-5xl mx-auto">

              {/* Header & Action Buttons */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Issues History</h1>
                  <p className="text-sm text-slate-500 mt-1">Track status of your maintenance requests and complaints.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setMinorModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md flex items-center transition-transform hover:scale-105"
                  >
                    <i data-lucide="tool" className="w-4 h-4 mr-2"></i> Raise Minor Issue
                  </button>
                  <button
                    onClick={() => setMajorModalOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md flex items-center transition-transform hover:scale-105"
                  >
                    <i data-lucide="alert-circle" className="w-4 h-4 mr-2"></i> Raise Major Issue
                  </button>
                </div>
              </div>

              {/* Stats row */}
              {complaints.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                    <p className="text-xs text-slate-500 mt-1">Total</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-red-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-red-600">{stats.open}</p>
                    <p className="text-xs text-slate-500 mt-1">Open</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-orange-600">{stats.escalated}</p>
                    <p className="text-xs text-slate-500 mt-1">Escalated</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                    <p className="text-xs text-slate-500 mt-1">Resolved</p>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {FILTERS.map((label) => (
                  <button
                    key={label}
                    onClick={() => setFilter(label)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium shadow-sm whitespace-nowrap ${
                      filter === label
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {errorMsg && <div className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{errorMsg}</div>}

              {/* Escalation info banner */}
              {stats.escalated > 0 && (
                <div className="mb-5 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-start gap-3">
                  <i data-lucide="alert-triangle" className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0"></i>
                  <div>
                    <p className="text-sm font-semibold text-orange-800">
                      {stats.escalated} complaint{stats.escalated > 1 ? "s" : ""} escalated to Super Admin
                    </p>
                    <p className="text-xs text-orange-600 mt-0.5">
                      Complaints not resolved within {ESCALATION_DAYS} days are automatically escalated.
                    </p>
                  </div>
                </div>
              )}

              {/* Complaint cards */}
              <div className="space-y-4">
                {loading && (
                  <div className="text-center py-12 text-slate-400">
                    <i data-lucide="loader-2" className="w-8 h-8 animate-spin mx-auto mb-2"></i>
                    <p>Loading your requests...</p>
                  </div>
                )}
                {!loading && filtered.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <i data-lucide="inbox" className="w-10 h-10 mx-auto mb-3 opacity-40"></i>
                    <p>No complaints found.</p>
                  </div>
                )}
                {!loading && filtered.map((complaint) => {
                  const escalated = isEscalated(complaint);
                  const days = daysSince(complaint.createdAt || complaint.submittedAt);
                  const status = complaint.status || "Open";
                  return (
                    <div
                      key={complaint._id}
                      className={`bg-white rounded-xl border shadow-sm p-5 transition ${
                        escalated ? "border-orange-300 bg-orange-50/30" : "border-slate-100"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-semibold text-slate-900">
                              {complaint.category || "General"}
                            </p>
                            {escalated && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300">
                                <i data-lucide="alert-triangle" className="w-3 h-3"></i> Escalated to Admin
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{complaint.description}</p>
                          
                          {/* Display Image Thumbnail if exists */}
                          {complaint.imageStr && (
                            <img src={complaint.imageStr} alt="Complaint Issue" className="h-16 w-16 object-cover rounded-md mt-2 border border-slate-200" />
                          )}

                          <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-400">
                            <span className={priorityColor(complaint.priority)}>
                              Priority: {complaint.priority || "Low"}
                            </span>
                            <span>•</span>
                            <span>{days === 0 ? "Today" : `${days} day${days > 1 ? "s" : ""} ago`}</span>
                            {complaint.roomNo && <><span>•</span><span>Room {complaint.roomNo}</span></>}
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${statusColor(status, escalated)}`}>
                          {escalated && status !== "Resolved" ? "Escalated" : status}
                        </span>
                      </div>

                      {/* Owner response if any */}
                      {complaint.ownerResponse && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Owner Response:</p>
                          <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                            {complaint.ownerResponse}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* --- MINOR COMPLAINT MODAL --- */}
      {minorModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setMinorModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center">
                <i data-lucide="tool" className="w-5 h-5 mr-2 text-blue-500"></i> Raise Minor Issue
              </h3>
              <button onClick={() => setMinorModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i data-lucide="x" className="w-6 h-6"></i>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500">For less critical issues. Standard priority and normal response time.</p>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Issue Category</label>
                <select
                  value={minorCategory}
                  onChange={(e) => setMinorCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="" disabled>Select a category...</option>
                  <option value="Plumbing">Plumbing (Leaks, Taps)</option>
                  <option value="Electrical">Electrical (Lights, Fan)</option>
                  <option value="Furniture">Furniture / Carpentry</option>
                  <option value="Appliances">Appliances (AC, Geyser)</option>
                  <option value="Cleaning">Housekeeping / Cleaning</option>
                  <option value="Internet">WiFi / Internet</option>
                  <option value="Ragging">Ragging</option>
                  <option value="Food Issue">Food Issue</option>
                  <option value="Other">Other Complaint</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={minorDesc}
                  onChange={(e) => setMinorDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Please describe the minor issue in detail..."
                />
              </div>
            </div>

            {minorStatus.error && <p className="mt-3 text-xs text-red-600">{minorStatus.error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMinorModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitMinorComplaint}
                disabled={minorStatus.loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {minorStatus.loading ? "Submitting..." : "Submit Minor Issue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAJOR COMPLAINT MODAL --- */}
      {majorModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setMajorModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-red-700 flex items-center">
                <i data-lucide="alert-circle" className="w-5 h-5 mr-2 text-red-600"></i> Raise Major Issue
              </h3>
              <button onClick={() => setMajorModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i data-lucide="x" className="w-6 h-6"></i>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded">For urgent, critical problems requiring immediate attention.</p>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={majorDesc}
                  onChange={(e) => setMajorDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  placeholder="Please describe the urgent issue in detail..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Optional Image Proof</label>
                <input
                  type="file"
                  id="majorImageInput"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
                />
              </div>
            </div>

            {majorStatus.error && <p className="mt-3 text-xs text-red-600">{majorStatus.error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMajorModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitMajorComplaint}
                disabled={majorStatus.loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {majorStatus.loading ? "Submitting..." : "Submit Major Issue"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}