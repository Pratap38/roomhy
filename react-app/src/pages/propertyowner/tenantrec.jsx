import React, { useEffect, useMemo, useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import {
  clearOwnerRuntimeSession,
  deleteTenantRecord,
  downloadCsv,
  fetchAllTenants,
  fetchPropertyMap,
  formatDate,
  getOwnerRuntimeSession,
  normalizeTenant
} from "../../utils/propertyowner";

export default function Tenantrec() {
  useHtmlPage({
    title: "Roomhy - Tenant Records",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [{ charset: "UTF-8" }],
    links: [
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      },
      { rel: "stylesheet", href: "/propertyowner/assets/css/tenantrec.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [owner, setOwner] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [tenants, loading, search]);

  const loadTenants = async (session) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [list, propertyMap] = await Promise.all([fetchAllTenants(), fetchPropertyMap()]);
      const ownerId = String(session.loginId || "").toUpperCase();
      const filtered = list
        .map((tenant) => normalizeTenant(tenant, propertyMap))
        .filter((tenant) => {
          const ownerLogin =
            tenant.propertyObj?.ownerLoginId ||
            tenant.ownerLoginId ||
            tenant.propertyObj?.owner ||
            tenant.owner;
          return ownerLogin ? String(ownerLogin).toUpperCase() === ownerId : true;
        });
      setTenants(filtered);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to load tenant records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = getOwnerRuntimeSession();
    if (!session?.loginId) {
      window.location.href = "/propertyowner/ownerlogin";
      return;
    }
    setOwner(session);
    loadTenants(session);
  }, []);

  const visibleTenants = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tenants;
    return tenants.filter((tenant) =>
      [
        tenant.displayName,
        tenant.loginId,
        tenant.phone,
        tenant.email,
        tenant.propertyTitle,
        tenant.roomNumber
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [tenants, search]);

  const exportToExcel = () => {
    downloadCsv(
      "tenant-records.csv",
      visibleTenants.map((tenant) => ({
        "Tenant Identity": tenant.displayName,
        "Login ID": tenant.loginId,
        "Phone": tenant.phone,
        "Email": tenant.email,
        "Property": tenant.propertyTitle,
        "Room": tenant.roomNumber,
        "Rent": tenant.rent,
        "Location Code": tenant.locationCode,
        "Move In Date": formatDate(tenant.moveInDate),
        "Move Out Date": formatDate(tenant.moveOutDate),
        Status: tenant.status,
        "KYC Status": tenant.kycStatus
      }))
    );
  };

  const moveOutTenant = (loginId) => {
    setTenants((prev) =>
      prev.map((tenant) =>
        tenant.loginId === loginId ? { ...tenant, status: "moved out", moveOutDate: new Date().toISOString() } : tenant
      )
    );
  };

  const permanentlyDeleteTenant = async (tenant) => {
    if (!window.confirm("Permanently delete this record? This cannot be undone.")) return;
    try {
      const deleteId = tenant._id || tenant.id;
      if (deleteId) {
        await deleteTenantRecord(deleteId);
      }
      setTenants((prev) => prev.filter((item) => item.key !== tenant.key));
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to delete tenant.");
    }
  };

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Tenant Records"
      navVariant="default"
      headerRight={(
        <div className="relative hidden md:block">
          <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Tenant, ID, Phone..." className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none w-64" />
          <i data-lucide="search" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"></i>
        </div>
      )}
      notificationCount={visibleTenants.filter((tenant) => String(tenant.kycStatus).toLowerCase() !== "verified").length}
      onLogout={() => {
        clearOwnerRuntimeSession();
        window.location.href = "/propertyowner/ownerlogin";
      }}
      contentClassName="max-w-[1600px] mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Detailed Tenant Records</h1>
          <p className="text-sm text-slate-500 mt-1">View full history, login credentials, guardian info, and status.</p>
        </div>
        <button type="button" onClick={exportToExcel} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center">
          <i data-lucide="download" className="w-4 h-4 mr-2"></i>
          Export List
        </button>
      </div>

      <div className="relative mb-4 md:hidden">
        <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Tenant, ID, Phone..." className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none w-full" />
        <i data-lucide="search" className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"></i>
      </div>

      {errorMsg ? <div className="text-sm text-red-600 mb-4">{errorMsg}</div> : null}

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full data-table" id="tenantTable">
            <thead>
              <tr>
                <th>Tenant Identity</th>
                <th>Login Credentials</th>
                <th>Personal Details</th>
                <th>Room &amp; Rent</th>
                <th>Location Code</th>
                <th>Move In / Out</th>
                <th>Status</th>
                <th>KYC Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="all-tenants-body">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">Loading tenant records...</td>
                </tr>
              ) : null}
              {!loading && visibleTenants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">No tenant records found.</td>
                </tr>
              ) : null}
              {!loading && visibleTenants.map((tenant) => (
                <tr key={tenant.key}>
                  <td>
                    <div className="font-semibold text-gray-900">{tenant.displayName}</div>
                    <div className="text-xs text-gray-500">{tenant.phone}</div>
                  </td>
                  <td>
                    <div className="font-medium text-gray-800">{tenant.loginId}</div>
                    <div className="text-xs text-gray-500">{tenant.email}</div>
                  </td>
                  <td>
                    <div>{tenant.gender || "-"}</div>
                    <div className="text-xs text-gray-500">{tenant.guardianName || tenant.address || "-"}</div>
                  </td>
                  <td>
                    <div className="font-medium">{tenant.roomNumber}</div>
                    <div className="text-xs text-gray-500">{tenant.rent}</div>
                    <div className="text-xs text-gray-500">{tenant.propertyTitle}</div>
                  </td>
                  <td>{tenant.locationCode}</td>
                  <td>
                    <div className="text-xs text-gray-700">{`In: ${formatDate(tenant.moveInDate)}`}</div>
                    <div className="text-xs text-red-600">{`Out: ${formatDate(tenant.moveOutDate)}`}</div>
                  </td>
                  <td>
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${String(tenant.status).toLowerCase().includes("move") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${String(tenant.kycStatus).toLowerCase() === "verified" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                      {tenant.kycStatus}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end items-center gap-2">
                      <button type="button" onClick={() => moveOutTenant(tenant.loginId)} className="flex items-center gap-1 text-xs bg-white border border-red-200 text-red-600 hover:bg-red-50 px-2 py-1 rounded transition shadow-sm">
                        Move Out
                      </button>
                      <button type="button" onClick={() => permanentlyDeleteTenant(tenant)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition" title="Permanently Delete">
                        <i data-lucide="trash-2" className="w-4 h-4"></i>
                      </button>
                    </div>
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
