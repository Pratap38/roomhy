import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";
import { useLegacySidebar } from "../../utils/legacyUi";

function getImageDataUrl(fileLike) {
  if (!fileLike) return "";
  if (typeof fileLike === "string") return fileLike;
  if (typeof fileLike === "object" && typeof fileLike.dataUrl === "string") return fileLike.dataUrl;
  return "";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

function getPropertyText(tenant, profile = {}) {
  const propertyObj = tenant?.property && typeof tenant.property === "object" ? tenant.property : null;
  const profileName = profile.propertyName || tenant?.tenantProfile?.propertyName || tenant?.digitalCheckin?.profile?.propertyName;
  const propertyTitle =
    profileName ||
    tenant?.propertyTitle ||
    tenant?.propertyName ||
    propertyObj?.title ||
    propertyObj?.name ||
    "";
  const location = propertyObj?.locationCode || "";
  if (propertyTitle && location && !propertyTitle.includes(location)) return `${propertyTitle} (${location})`;
  return propertyTitle || location || "Unknown Property";
}

function normalizeTenant(tenant, record) {
  const profile = record?.tenantProfile || tenant?.digitalCheckin?.profile || {};
  const tenantKyc = record?.tenantKyc || tenant?.digitalCheckin?.kyc || {};
  const modelKyc = tenant?.kyc || {};
  const aadhaarNumber = modelKyc.aadhaarNumber || modelKyc.aadhar || tenantKyc.aadhaarNumber || "";
  const aadhaarLinkedPhone = modelKyc.aadhaarLinkedPhone || tenantKyc.aadhaarLinkedPhone || "";
  const aadhaarFront = getImageDataUrl(modelKyc.aadhaarFront || modelKyc.idProofFile || modelKyc.aadharFile || tenantKyc.aadhaarFront);
  const aadhaarBack = getImageDataUrl(modelKyc.aadhaarBack || tenantKyc.aadhaarBack);
  const otpVerified = Boolean(modelKyc.otpVerified || tenantKyc.otpVerified);
  const digilockerVerified = Boolean(modelKyc.digilockerVerified || tenantKyc.digilockerVerified);
  const kycStatus =
    tenant?.kycStatus ||
    tenantKyc?.digilockerStatus ||
    (digilockerVerified || otpVerified ? "verified" : "") ||
    (aadhaarNumber ? "submitted" : "") ||
    "pending";

  return {
    ...tenant,
    record,
    profile: {
      name: tenant?.name || profile?.name || "",
      email: tenant?.email || profile?.email || "",
      phone: tenant?.phone || profile?.phone || "",
      dob: tenant?.dob || profile?.dob || "",
      guardianNumber: tenant?.guardianNumber || profile?.guardianNumber || "",
      moveInDate: tenant?.moveInDate || profile?.moveInDate || "",
      roomNo: tenant?.roomNo || profile?.roomNo || tenant?.room?.number || "",
      bedNo: tenant?.bedNo || "",
      agreedRent:
        tenant?.agreedRent ?? profile?.agreedRent ?? tenant?.room?.rent ?? "",
      propertyText: getPropertyText(tenant, profile)
    },
    kyc: {
      status: String(kycStatus || "pending").toLowerCase(),
      aadhaarNumber,
      aadhaarLinkedPhone,
      aadhaarFront,
      aadhaarBack,
      otpVerified,
      otpVerifiedAt: modelKyc.otpVerifiedAt || tenantKyc.otpVerifiedAt || "",
      digilockerVerified,
      digilockerVerifiedAt: modelKyc.digilockerVerifiedAt || tenantKyc.digilockerVerifiedAt || ""
    }
  };
}

export default function Tenant() {
  useHtmlPage({
    title: "Roomhy - All Tenants",
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
      { rel: "stylesheet", href: "/superadmin/assets/css/tenant.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  useLegacySidebar();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState(null);

  const loadTenants = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await fetchJson("/api/tenants");
      const baseTenants = Array.isArray(data) ? data : Array.isArray(data?.tenants) ? data.tenants : [];
      const mergedTenants = await Promise.all(
        baseTenants.map(async (tenant) => {
          if (!tenant?.loginId) return normalizeTenant(tenant, null);
          try {
            const checkin = await fetchJson(`/api/checkin/tenant/${encodeURIComponent(tenant.loginId)}`);
            return normalizeTenant(tenant, checkin?.record || null);
          } catch (_) {
            return normalizeTenant(tenant, null);
          }
        })
      );
      setTenants(mergedTenants);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [tenants, loading, errorMsg, selectedTenant]);

  const filteredTenants = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tenants;
    return tenants.filter((tenant) => {
      const haystack = [
        tenant?.profile?.name,
        tenant?.profile?.email,
        tenant?.profile?.phone,
        tenant?.profile?.propertyText,
        tenant?.profile?.roomNo,
        tenant?.loginId,
        tenant?.kyc?.aadhaarNumber
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [tenants, search]);

  const stats = useMemo(() => {
    const total = tenants.length;
    const verified = tenants.filter((tenant) => tenant.kyc.status === "verified").length;
    const submitted = tenants.filter((tenant) => tenant.kyc.status === "submitted").length;
    const pending = total - verified - submitted;
    return { total, verified, submitted, pending };
  }, [tenants]);

  const selectedDocTabs = selectedTenant
    ? [
        { key: "aadhaarFront", label: "Aadhaar Front", value: selectedTenant.kyc.aadhaarFront },
        { key: "aadhaarBack", label: "Aadhaar Back", value: selectedTenant.kyc.aadhaarBack }
      ]
    : [];

  return (
    <div className="html-page">
      <div className="flex h-screen overflow-hidden">
        <aside className="sidebar w-72 flex-shrink-0 hidden md:flex flex-col z-20 overflow-y-auto custom-scrollbar">
          <div className="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
            <div>
              <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
              <span className="text-[10px] text-gray-500">SUPER ADMIN</span>
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
            <a href="/superadmin/tenant" className="sidebar-link active">
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
                <span className="text-slate-800 font-semibold">Tenants & KYC</span>
              </div>
            </div>
            <button onClick={loadTenants} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-2">
              <i data-lucide="refresh-cw" className="w-4 h-4"></i> Refresh
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">All Tenants</h1>
                  <p className="text-sm text-slate-500 mt-1">Tenant list merged with digital check-in profile and tenant KYC data.</p>
                </div>
                <div className="relative w-full md:w-80">
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search tenant, property, login ID..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  <i data-lucide="search" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"></i>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Total Tenants</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Verified KYC</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.verified}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Submitted</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.submitted}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Pending</p>
                  <p className="text-2xl font-bold text-slate-700 mt-1">{stats.pending}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full data-table">
                    <thead>
                      <tr>
                        <th>Tenant Info</th>
                        <th>Property Details</th>
                        <th>Tenant Profile</th>
                        <th>KYC Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading tenants...</td>
                        </tr>
                      )}
                      {!loading && errorMsg && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-red-500">{errorMsg}</td>
                        </tr>
                      )}
                      {!loading && !errorMsg && filteredTenants.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No tenants found.</td>
                        </tr>
                      )}
                      {!loading &&
                        !errorMsg &&
                        filteredTenants.map((tenant) => {
                          const status = tenant.kyc.status;
                          const badgeClass =
                            status === "verified"
                              ? "bg-green-100 text-green-800"
                              : status === "submitted"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-600";
                          return (
                            <tr key={tenant._id || tenant.loginId}>
                              <td>
                                <div className="flex items-start gap-3">
                                  <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                                    {(tenant.profile.name || "?").charAt(0).toUpperCase()}
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-sm font-semibold text-gray-900">{tenant.profile.name || "-"}</div>
                                    <div className="text-xs text-gray-500">{tenant.loginId || "-"}</div>
                                    <div className="text-xs text-gray-600">{tenant.profile.phone || "-"}</div>
                                    <div className="text-xs text-gray-600">{tenant.profile.email || "-"}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="space-y-1 text-sm text-gray-700">
                                  <div className="font-medium text-gray-900">{tenant.profile.propertyText}</div>
                                  <div>Room: {tenant.profile.roomNo || "-"}</div>
                                  <div>Bed: {tenant.profile.bedNo || "-"}</div>
                                  <div>Rent: {tenant.profile.agreedRent ? `Rs ${tenant.profile.agreedRent}` : "-"}</div>
                                </div>
                              </td>
                              <td>
                                <div className="space-y-1 text-sm text-gray-700">
                                  <div>DOB: {tenant.profile.dob || "-"}</div>
                                  <div>Guardian: {tenant.profile.guardianNumber || "-"}</div>
                                  <div>Move In: {formatDate(tenant.profile.moveInDate)}</div>
                                  <div>Status: <span className="uppercase text-xs">{tenant.status || "pending"}</span></div>
                                </div>
                              </td>
                              <td>
                                <div className="space-y-2">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                                    {status}
                                  </span>
                                  <div className="text-xs text-gray-600">Aadhaar: {tenant.kyc.aadhaarNumber || "-"}</div>
                                  <div className="text-xs text-gray-600">Linked Phone: {tenant.kyc.aadhaarLinkedPhone || "-"}</div>
                                  <div className="text-xs text-gray-600">
                                    OTP: {tenant.kyc.otpVerified ? "Verified" : "Pending"}
                                  </div>
                                </div>
                              </td>
                              <td className="text-right">
                                <button
                                  onClick={() => setSelectedTenant(tenant)}
                                  className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 shadow-sm transition-colors"
                                >
                                  View Details
                                </button>
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

      {selectedTenant && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedTenant(null)}>
          <div className="relative w-full max-w-5xl bg-white rounded-lg shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-gray-800">Tenant Profile & KYC Details</h3>
              <button onClick={() => setSelectedTenant(null)} className="text-gray-400 hover:text-gray-600">
                <i data-lucide="x" className="w-6 h-6"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] min-h-[560px]">
              <div className="bg-slate-50 border-r border-gray-200 p-6">
                <h4 className="text-sm font-bold text-gray-800 mb-4">Uploaded Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedDocTabs.map((doc) => (
                    <div key={doc.key} className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">{doc.label}</p>
                      {doc.value ? (
                        <img src={doc.value} alt={doc.label} className="w-full h-64 object-contain rounded-md bg-slate-100" />
                      ) : (
                        <div className="h-64 rounded-md bg-slate-100 flex items-center justify-center text-sm text-gray-400">
                          No document uploaded
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 space-y-6">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <h4 className="text-xs font-bold text-purple-700 uppercase mb-3 tracking-wider">Applicant Details</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between gap-4"><span>Name</span><span className="font-semibold text-right">{selectedTenant.profile.name || "-"}</span></div>
                    <div className="flex justify-between gap-4"><span>Login ID</span><span className="font-mono text-xs bg-white px-2 py-1 rounded border">{selectedTenant.loginId || "-"}</span></div>
                    <div className="flex justify-between gap-4"><span>Email</span><span className="text-right">{selectedTenant.profile.email || "-"}</span></div>
                    <div className="flex justify-between gap-4"><span>Phone</span><span className="text-right">{selectedTenant.profile.phone || "-"}</span></div>
                    <div className="flex justify-between gap-4"><span>DOB</span><span className="text-right">{selectedTenant.profile.dob || "-"}</span></div>
                    <div className="flex justify-between gap-4"><span>Guardian</span><span className="text-right">{selectedTenant.profile.guardianNumber || "-"}</span></div>
                    <div className="flex justify-between gap-4"><span>Property</span><span className="text-right">{selectedTenant.profile.propertyText}</span></div>
                    <div className="flex justify-between gap-4"><span>Room / Bed</span><span className="text-right">{selectedTenant.profile.roomNo || "-"} / {selectedTenant.profile.bedNo || "-"}</span></div>
                    <div className="flex justify-between gap-4"><span>Move In</span><span className="text-right">{formatDate(selectedTenant.profile.moveInDate)}</span></div>
                    <div className="flex justify-between gap-4"><span>Agreed Rent</span><span className="text-right">{selectedTenant.profile.agreedRent ? `Rs ${selectedTenant.profile.agreedRent}` : "-"}</span></div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-3 tracking-wider">Tenant KYC</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between gap-4"><span>KYC Status</span><span className="font-semibold uppercase">{selectedTenant.kyc.status}</span></div>
                    <div className="flex justify-between gap-4"><span>Aadhaar Number</span><span className="text-right">{selectedTenant.kyc.aadhaarNumber || "-"}</span></div>
                    <div className="flex justify-between gap-4"><span>Linked Phone</span><span className="text-right">{selectedTenant.kyc.aadhaarLinkedPhone || "-"}</span></div>
                    <div className="flex justify-between gap-4"><span>OTP Verified</span><span className="text-right">{selectedTenant.kyc.otpVerified ? "Yes" : "No"}</span></div>
                    <div className="flex justify-between gap-4"><span>OTP Verified At</span><span className="text-right">{formatDate(selectedTenant.kyc.otpVerifiedAt)}</span></div>
                    <div className="flex justify-between gap-4"><span>DigiLocker Verified</span><span className="text-right">{selectedTenant.kyc.digilockerVerified ? "Yes" : "No"}</span></div>
                    <div className="flex justify-between gap-4"><span>DigiLocker Verified At</span><span className="text-right">{formatDate(selectedTenant.kyc.digilockerVerifiedAt)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
