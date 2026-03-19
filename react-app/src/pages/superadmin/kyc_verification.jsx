import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";
import { useLegacySidebar } from "../../utils/legacyUi";

export default function KycVerification() {
  useHtmlPage({
    title: "Roomhy - KYC Verification",
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
      { rel: "stylesheet", href: "/superadmin/assets/css/kyc_verification.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  useLegacySidebar();

  const [tab, setTab] = useState("owners");
  const [owners, setOwners] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionId, setActionId] = useState("");

  const loadOwners = async () => {
    try {
      setLoadingOwners(true);
      const data = await fetchJson("/api/owners");
      setOwners(data?.owners || data || []);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to load owners");
    } finally {
      setLoadingOwners(false);
    }
  };

  const loadTenants = async () => {
    try {
      setLoadingTenants(true);
      const data = await fetchJson("/api/tenants");
      setTenants(data?.tenants || data || []);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to load tenants");
    } finally {
      setLoadingTenants(false);
    }
  };

  useEffect(() => {
    loadOwners();
    loadTenants();
  }, []);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [tab, owners, tenants]);

  const pendingOwners = useMemo(
    () => owners.filter((o) => (o.kycStatus || o.kyc?.status || "pending") === "pending"),
    [owners]
  );
  const pendingTenants = useMemo(
    () => tenants.filter((t) => (t.kycStatus || t.kyc?.status || "pending") === "submitted" || (t.kycStatus || t.kyc?.status || "pending") === "pending"),
    [tenants]
  );

  const updateOwnerKyc = async (owner, status) => {
    if (!owner) return;
    const id = owner._id || owner.loginId;
    if (!id) return;
    if (!window.confirm(`${status === "verified" ? "Verify" : "Reject"} KYC for ${owner.name || owner.loginId}?`)) return;
    try {
      setActionId(id);
      await fetchJson(`/api/owners/${id}/kyc`, {
        method: "PATCH",
        body: JSON.stringify({ status, rejectionReason: status === "rejected" ? "Rejected by admin" : "" })
      });
      await loadOwners();
    } catch (err) {
      window.alert(err?.body || err?.message || "Failed to update owner KYC");
    } finally {
      setActionId("");
    }
  };

  const updateTenantKyc = async (tenant, approved) => {
    if (!tenant?._id) return;
    if (!window.confirm(`${approved ? "Verify" : "Reject"} KYC for ${tenant.name || tenant.loginId}?`)) return;
    try {
      setActionId(tenant._id);
      await fetchJson(`/api/tenants/${tenant._id}/verify`, {
        method: "POST",
        body: JSON.stringify({ kycApproved: approved })
      });
      await loadTenants();
    } catch (err) {
      window.alert(err?.body || err?.message || "Failed to update tenant KYC");
    } finally {
      setActionId("");
    }
  };

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
          <nav className="flex-1 py-6 space-y-1">
            <div className="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Overview</div>
            <a href="/superadmin/superadmin" className="sidebar-link">
              <i data-lucide="layout-dashboard" className="w-5 h-5 mr-3"></i> Dashboard
            </a>
            <div className="mt-6 px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Management</div>
            <a href="/superadmin/manager" className="sidebar-link">
              <i data-lucide="map-pin" className="w-5 h-5 mr-3"></i> Teams
            </a>
            <a href="/superadmin/owner" className="sidebar-link">
              <i data-lucide="briefcase" className="w-5 h-5 mr-3"></i> Property Owners
            </a>
            <a href="/superadmin/properties" className="sidebar-link">
              <i data-lucide="home" className="w-5 h-5 mr-3"></i> Properties
            </a>
            <a href="/superadmin/tenant" className="sidebar-link">
              <i data-lucide="users" className="w-5 h-5 mr-3"></i> Tenants
            </a>
            <a href="/superadmin/new_signups" className="sidebar-link">
              <i data-lucide="file-badge" className="w-5 h-5 mr-3"></i> New Signups
            </a>
            <div className="mt-6 px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Operations</div>
            <a href="/superadmin/websiteenq" className="sidebar-link">
              <i data-lucide="folder-open" className="w-5 h-5 mr-3"></i> Web Enquiry
            </a>
            <a href="/superadmin/enquiry" className="sidebar-link">
              <i data-lucide="help-circle" className="w-5 h-5 mr-3"></i> Enquiries
            </a>
            <a href="/superadmin/booking" className="sidebar-link">
              <i data-lucide="calendar-check" className="w-5 h-5 mr-3"></i> Bookings
            </a>
            <a href="/superadmin/reviews" className="sidebar-link">
              <i data-lucide="star" className="w-5 h-5 mr-3"></i> Reviews
            </a>
            <a href="/superadmin/complaint-history" className="sidebar-link">
              <i data-lucide="alert-circle" className="w-5 h-5 mr-3"></i> Complaint History
            </a>
            <div className="mt-6 px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Website</div>
            <a href="/superadmin/website" className="sidebar-link">
              <i data-lucide="globe" className="w-5 h-5 mr-3"></i> Live Properties
            </a>
            <div className="mt-6 px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">System</div>
            <a href="/superadmin/location" className="sidebar-link">
              <i data-lucide="globe" className="w-5 h-5 mr-3"></i> Locations
            </a>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
          <header className="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center">
              <button id="mobile-menu-open" className="md:hidden mr-4 text-slate-500">
                <i data-lucide="menu" className="w-6 h-6"></i>
              </button>
              <div className="flex items-center text-sm">
                <span className="text-slate-500 font-medium">Management</span>
                <i data-lucide="chevron-right" className="w-4 h-4 mx-2 text-slate-400"></i>
                <span className="text-slate-800 font-semibold">KYC Verification</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => { loadOwners(); loadTenants(); }} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-2">
                <i data-lucide="refresh-cw" className="w-4 h-4"></i> Refresh
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">KYC Verification</h1>
                  <p className="text-sm text-slate-500 mt-1">Review and approve documents for Property Owners and Tenants.</p>
                </div>
                <div className="bg-white p-1 rounded-lg border border-gray-200 flex">
                  <button
                    className={`tab-btn px-6 py-2 text-sm font-medium rounded-md transition-all ${tab === "owners" ? "active text-gray-700 bg-gray-100" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setTab("owners")}
                  >
                    Property Owners
                  </button>
                  <button
                    className={`tab-btn px-6 py-2 text-sm font-medium rounded-md transition-all ${tab === "tenants" ? "active text-gray-700 bg-gray-100" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setTab("tenants")}
                  >
                    Tenants
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-2">
                  {errorMsg}
                </div>
              )}

              {tab === "owners" && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full data-table">
                      <thead>
                        <tr>
                          <th>Owner</th>
                          <th>Contact</th>
                          <th>Status</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingOwners && (
                          <tr><td colSpan={4} className="text-center py-8 text-gray-500 text-sm">Loading owners...</td></tr>
                        )}
                        {!loadingOwners && pendingOwners.length === 0 && (
                          <tr><td colSpan={4} className="text-center py-8 text-gray-500 text-sm">No pending owners</td></tr>
                        )}
                        {pendingOwners.map((owner) => {
                          const id = owner._id || owner.loginId;
                          const status = owner.kycStatus || owner.kyc?.status || "pending";
                          return (
                            <tr key={id}>
                              <td>
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs mr-3">
                                    {(owner.name || owner.loginId || "O")[0]}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{owner.name || owner.loginId || "Owner"}</p>
                                    <p className="text-xs text-gray-500">{owner.loginId || "-"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="text-sm text-gray-700">{owner.phone || owner.email || "-"}</td>
                              <td>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  {status}
                                </span>
                              </td>
                              <td className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <button
                                    disabled={actionId === id}
                                    onClick={() => updateOwnerKyc(owner, "verified")}
                                    className="text-green-600 hover:text-green-800 text-xs font-medium border border-green-200 px-3 py-1 rounded hover:bg-green-50 transition-colors disabled:opacity-60"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    disabled={actionId === id}
                                    onClick={() => updateOwnerKyc(owner, "rejected")}
                                    className="text-red-600 hover:text-red-800 text-xs font-medium border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-60"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === "tenants" && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full data-table">
                      <thead>
                        <tr>
                          <th>Tenant</th>
                          <th>Contact</th>
                          <th>Property</th>
                          <th>Status</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingTenants && (
                          <tr><td colSpan={5} className="text-center py-8 text-gray-500 text-sm">Loading tenants...</td></tr>
                        )}
                        {!loadingTenants && pendingTenants.length === 0 && (
                          <tr><td colSpan={5} className="text-center py-8 text-gray-500 text-sm">No pending tenants</td></tr>
                        )}
                        {pendingTenants.map((tenant) => {
                          const status = tenant.kycStatus || "pending";
                          return (
                            <tr key={tenant._id}>
                              <td>
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs mr-3">
                                    {(tenant.name || tenant.loginId || "T")[0]}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{tenant.name || tenant.loginId || "Tenant"}</p>
                                    <p className="text-xs text-gray-500">{tenant.loginId || "-"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="text-sm text-gray-700">{tenant.phone || tenant.email || "-"}</td>
                              <td className="text-sm text-gray-700">{tenant.propertyTitle || tenant.property?.title || "-"}</td>
                              <td>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  {status}
                                </span>
                              </td>
                              <td className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <button
                                    disabled={actionId === tenant._id}
                                    onClick={() => updateTenantKyc(tenant, true)}
                                    className="text-green-600 hover:text-green-800 text-xs font-medium border border-green-200 px-3 py-1 rounded hover:bg-green-50 transition-colors disabled:opacity-60"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    disabled={actionId === tenant._id}
                                    onClick={() => updateTenantKyc(tenant, false)}
                                    className="text-red-600 hover:text-red-800 text-xs font-medium border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-60"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        <div id="mobile-overlay" className="fixed inset-0 bg-black/50 z-30 hidden md:hidden backdrop-blur-sm"></div>
        <aside id="mobile-sidebar" className="fixed inset-y-0 left-0 w-72 bg-[#111827] z-40 transform -translate-x-full transition-transform duration-300 md:hidden flex flex-col overflow-y-auto">
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800 sticky top-0 bg-[#111827]">
            <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
          </div>
          <nav className="flex-1 py-4 space-y-1 px-2">
            <a href="/superadmin/superadmin" className="flex items-center px-4 py-3 text-sm font-medium rounded-md text-gray-400 hover:bg-gray-800">Dashboard</a>
            <a href="#" className="flex items-center px-4 py-3 text-sm font-medium rounded-md bg-gray-800 text-white border-l-4 border-purple-500">KYC Verification</a>
          </nav>
        </aside>
      </div>
    </div>
  );
}


