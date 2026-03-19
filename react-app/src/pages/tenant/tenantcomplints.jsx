import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";

const FILTERS = ["All", "Open", "In Progress", "Resolved"];

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
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("Low");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [complaints, filter, modalOpen]);

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
    if (filter === "In Progress") return complaints.filter((c) => (c.status || "") === "Taken");
    return complaints.filter((c) => (c.status || "") === filter);
  }, [complaints, filter]);

  const submitComplaint = async () => {
    if (!tenant) return;
    if (!category || !description.trim()) {
      setErrorMsg("Please fill in category and description.");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    try {
      await fetchJson("/api/complaints", {
        method: "POST",
        body: JSON.stringify({
          tenantId: tenant._id,
          tenantName: tenant.name,
          tenantPhone: tenant.phone,
          property: tenant.propertyTitle || tenant.property?.title,
          roomNo: tenant.roomNo,
          bedNo: tenant.bedNo,
          category,
          description,
          priority
        })
      });
      setModalOpen(false);
      setCategory("");
      setPriority("Low");
      setDescription("");
      await loadComplaints(tenant);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="html-page">
      <div className="flex h-screen overflow-hidden">
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
            <div className="flex items-center">
              <h2 className="text-lg font-bold text-slate-800">My Requests & Complaints</h2>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Issues History</h1>
                  <p className="text-sm text-slate-500 mt-1">Track status of your maintenance requests and complaints.</p>
                </div>
                <button onClick={() => setModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md flex items-center transition-transform hover:scale-105">
                  <i data-lucide="plus-circle" className="w-5 h-5 mr-2"></i> Raise New Complaint
                </button>
              </div>

              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {FILTERS.map((label) => (
                  <button
                    key={label}
                    onClick={() => setFilter(label)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium shadow-sm ${filter === label ? "bg-white border border-slate-200 text-blue-600" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {errorMsg && (
                <div className="mb-4 text-sm text-red-600">{errorMsg}</div>
              )}

              <div className="space-y-4">
                {loading && (
                  <div className="text-center py-12 text-slate-400">
                    <i data-lucide="loader-2" className="w-8 h-8 animate-spin mx-auto mb-2"></i>
                    <p>Loading your requests...</p>
                  </div>
                )}
                {!loading && filtered.length === 0 && (
                  <div className="text-center py-12 text-slate-400">No complaints found.</div>
                )}
                {!loading && filtered.map((complaint) => (
                  <div key={complaint._id} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{complaint.category || "General"}</p>
                        <p className="text-xs text-slate-500 mt-1">{complaint.description}</p>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-700">{complaint.status || "Open"}</span>
                    </div>
                    <div className="mt-3 text-xs text-slate-400">
                      Priority: {complaint.priority || "Low"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 mx-4 relative" onClick={(event) => event.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-slate-900">Raise New Request</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i data-lucide="x" className="w-6 h-6"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Issue Category</label>
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option value="" disabled>Select a category...</option>
                  <option value="Plumbing">Plumbing (Leaks, Taps)</option>
                  <option value="Electrical">Electrical (Lights, Fan)</option>
                  <option value="Furniture">Furniture / Carpentry</option>
                  <option value="Appliances">Appliances (AC, Geyser)</option>
                  <option value="Cleaning">Housekeeping / Cleaning</option>
                  <option value="Internet">WiFi / Internet</option>
                  <option value="Other">Other Complaint</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <div className="flex gap-4">
                  {["Low", "Medium", "High"].map((level) => (
                    <label key={level} className="flex items-center cursor-pointer text-sm text-slate-600">
                      <input type="radio" name="priority" value={level} checked={priority === level} onChange={() => setPriority(level)} className="w-4 h-4 text-blue-600" />
                      <span className="ml-2">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Please describe the issue in detail..."
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
              <button type="button" onClick={submitComplaint} disabled={submitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


