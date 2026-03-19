import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";

const getApiUrl = () =>
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : "https://api.roomhy.com";

const navSections = [
  {
    label: "Overview",
    items: [{ href: "/superadmin/superadmin", icon: "layout-dashboard", text: "Dashboard", key: "superadmin" }]
  },
  {
    label: "Management",
    items: [
      { href: "/superadmin/manager", icon: "map-pin", text: "Teams", key: "manager" },
      { href: "/superadmin/owner", icon: "briefcase", text: "Property Owners", key: "owner" },
      { href: "/superadmin/properties", icon: "home", text: "Properties", key: "properties" },
      { href: "/superadmin/tenant", icon: "users", text: "Tenants", key: "tenant" },
      { href: "/superadmin/new_signups", icon: "file-badge", text: "New Signups", key: "new_signups" }
    ]
  },
  {
    label: "Operations",
    items: [
      { href: "/superadmin/websiteenq", icon: "folder-open", text: "Web Enquiry", key: "websiteenq" },
      { href: "/superadmin/enquiry", icon: "help-circle", text: "Enquiries", key: "enquiry" },
      { href: "/superadmin/booking", icon: "calendar-check", text: "Bookings", key: "booking" },
      { href: "/superadmin/reviews", icon: "star", text: "Reviews", key: "reviews" },
      { href: "/superadmin/complaint-history", icon: "alert-circle", text: "Complaint History", key: "complaint-history" }
    ]
  },
  {
    label: "Website",
    items: [{ href: "/superadmin/website", icon: "globe", text: "Live Properties", key: "website" }]
  }
];

export default function SuperadminRentcollection() {
  useHtmlPage({
    title: "Rent Collection - RoomHy",
    bodyClass: "bg-gray-50 text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    bases: [],
    links: [
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      },
      { rel: "stylesheet", href: "/superadmin/assets/css/rentcollection.css" }
    ],
    styles: [],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" }
    ],
    inlineScripts: [],
    disableMobileSidebar: true
  });

  const apiUrl = getApiUrl();
  const [tenants, setTenants] = useState([]);
  const [currentFilter, setCurrentFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(true);
  const [toast, setToast] = useState(null);
  const refreshTimer = useRef(null);

  useEffect(() => {
    window.lucide?.createIcons();
  }, [tenants, currentFilter, mobileOpen, financeOpen, toast]);

  useEffect(() => {
    loadData();
    const onStorage = (e) => {
      if (e.key === "roomhy_payment_updated") {
        loadData();
        showNotification("Payment status updated!", "success");
      }
    };
    const onPaymentUpdated = () => {
      loadData();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("paymentUpdated", onPaymentUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("paymentUpdated", onPaymentUpdated);
    };
  }, []);

  useEffect(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    refreshTimer.current = setInterval(() => {
      loadData();
    }, 30000);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, []);

  const normKey = (value) => (value || "").toString().trim().toUpperCase();

  const mergeProfile = (owner) => ({
    ...(owner?.profile || {}),
    ...(owner?.bankDetails || {}),
    ...(owner?.bank || {}),
    ...(owner?.payment || {})
  });

  const mergeTenantsWithRents = (tenantList, rentList, ownerList) => {
    const rentMap = {};
    rentList.forEach((rent) => {
      if (rent.tenantLoginId) rentMap[rent.tenantLoginId] = rent;
    });

    const ownerMap = {};
    ownerList.forEach((owner) => {
      const keys = [
        owner.loginId,
        owner.ownerLoginId,
        owner._id,
        owner.id,
        owner.profile?.loginId
      ].filter(Boolean);
      keys.forEach((k) => { ownerMap[normKey(k)] = owner; });
    });

    return tenantList.map((tenant) => {
      const ownerCandidateKeys = [
        tenant.propertyOwnerId,
        tenant.ownerLoginId,
        tenant.owner_id,
        tenant.ownerId,
        tenant?.property?.ownerLoginId,
        tenant?.property?.owner_id,
        tenant?.property?.ownerId,
        tenant?.property?.owner?.loginId,
        tenant?.property?.owner?._id,
        tenant?.property?.owner
      ].filter(Boolean);

      let owner = null;
      for (const key of ownerCandidateKeys) {
        const matched = ownerMap[normKey(key)];
        if (matched) { owner = matched; break; }
      }
      const profile = mergeProfile(owner);

      return {
        ...tenant,
        rentAmount: parseFloat(tenant.agreedRent) || 0,
        rentInfo: rentMap[tenant.loginId] || {
          paymentStatus: "pending",
          paidAmount: 0,
          totalDue: parseFloat(tenant.agreedRent) || 0
        },
        ownerInfo: owner || {
          name: "N/A",
          phone: "N/A",
          profile: { bankName: "N/A", accountNumber: "N/A", ifscCode: "N/A", branchName: "N/A" }
        },
        ownerProfile: profile
      };
    });
  };

  const loadData = async () => {
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("areaAdminToken") ||
        localStorage.getItem("superAdminToken");
      const headers = token ? { Authorization: "Bearer " + token } : {};

      const tenantRes = await fetch(`${apiUrl}/api/tenants`, { headers });
      if (!tenantRes.ok) {
        throw new Error(`HTTP ${tenantRes.status}: Failed to fetch tenants`);
      }
      const tenantData = await tenantRes.json();
      let fetchedTenants = [];
      if (tenantData && tenantData.success && Array.isArray(tenantData.tenants)) {
        fetchedTenants = tenantData.tenants;
      } else if (Array.isArray(tenantData)) {
        fetchedTenants = tenantData;
      } else if (tenantData.tenants && Array.isArray(tenantData.tenants)) {
        fetchedTenants = tenantData.tenants;
      }

      let fetchedRents = [];
      try {
        const rentRes = await fetch(`${apiUrl}/api/rents`, { headers });
        if (rentRes.ok) {
          const rentData = await rentRes.json();
          if (rentData && rentData.success && Array.isArray(rentData.rents)) {
            fetchedRents = rentData.rents;
          } else if (Array.isArray(rentData)) {
            fetchedRents = rentData;
          } else if (rentData.rents && Array.isArray(rentData.rents)) {
            fetchedRents = rentData.rents;
          }
        }
      } catch (_) {}

      let fetchedOwners = [];
      try {
        const ownerRes = await fetch(`${apiUrl}/api/owners`, { headers });
        if (ownerRes.ok) {
          const ownerData = await ownerRes.json();
          if (ownerData && ownerData.success && Array.isArray(ownerData.owners)) {
            fetchedOwners = ownerData.owners;
          } else if (Array.isArray(ownerData)) {
            fetchedOwners = ownerData;
          } else if (ownerData.owners && Array.isArray(ownerData.owners)) {
            fetchedOwners = ownerData.owners;
          }
        }
      } catch (err) {
        try {
          const cachedOwners = JSON.parse(localStorage.getItem("roomhy_owners_db") || "{}");
          fetchedOwners = Object.values(cachedOwners).map((owner, idx) => ({
            loginId: Object.keys(JSON.parse(localStorage.getItem("roomhy_owners_db") || "{}"))[idx],
            profile: owner.profile || {}
          }));
        } catch (_) {}
      }

      const merged = mergeTenantsWithRents(fetchedTenants, fetchedRents, fetchedOwners);
      setTenants(merged);
    } catch (err) {
      console.error("Error loading data:", err);
      setTenants([]);
    }
  };

  const showNotification = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const sendReminders = async () => {
    const unpaidTenants = tenants.filter((t) => (t.rentInfo || {}).paymentStatus !== "paid");
    if (unpaidTenants.length === 0) {
      showNotification("No unpaid tenants to send reminders", "error");
      return;
    }
    if (!confirm(`Send rent reminders to ${unpaidTenants.length} unpaid tenant(s)? Daily reminders will continue until payment.`)) {
      return;
    }

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("areaAdminToken") ||
        localStorage.getItem("superAdminToken");
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = "Bearer " + token;

      let response = await fetch(`${apiUrl}/api/rents/reminders/start-unpaid`, {
        method: "POST",
        headers
      });
      let data = await response.json().catch(() => ({}));

      if (response.status === 404) {
        response = await fetch(`${apiUrl}/api/rents/reminders/send`, {
          method: "POST",
          headers
        });
        data = await response.json().catch(() => ({}));
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.message || data.error || "Failed to send reminders");
      }

      showNotification(data.message || `Reminders sent to ${data.sent || 0} tenant(s)`, "success");
      await loadData();
    } catch (err) {
      console.error("Error sending reminders:", err);
      showNotification(err.message || "Failed to send reminders", "error");
    }
  };

  const filteredTenants = useMemo(() => {
    let list = tenants;
    if (currentFilter === "paid") {
      list = list.filter((t) => (t.rentInfo || {}).paymentStatus === "paid");
    } else if (currentFilter === "unpaid") {
      list = list.filter((t) => (t.rentInfo || {}).paymentStatus !== "paid");
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((t) => JSON.stringify(t).toLowerCase().includes(term));
    }
    return list;
  }, [tenants, currentFilter, searchTerm]);

  const overallStats = useMemo(() => {
    let overallTotalRent = 0;
    let overallCollected = 0;
    let overallPending = 0;

    tenants.forEach((t) => {
      const rentInfo = t.rentInfo || {};
      const rentAmount = parseFloat(t.rentAmount || t.agreedRent || 0);
      const paid = parseFloat(rentInfo.paidAmount || 0);
      const total = parseFloat(rentInfo.totalDue || rentAmount);
      const pending = total - paid;

      overallTotalRent += rentAmount;
      if (rentInfo.paymentStatus === "paid") {
        overallCollected += total;
      } else {
        overallCollected += paid;
        overallPending += pending;
      }
    });

    const collectionRate = overallTotalRent > 0 ? Math.round((overallCollected / overallTotalRent) * 100) : 0;
    return { overallTotalRent, overallCollected, overallPending, collectionRate };
  }, [tenants]);

  const filteredStats = useMemo(() => {
    let totalRent = 0;
    let statAmount = 0;
    let statLabel = "Total Collected";

    if (currentFilter === "paid") statLabel = "Total Collected";
    if (currentFilter === "unpaid") statLabel = "Total Pending";

    filteredTenants.forEach((t) => {
      const rentInfo = t.rentInfo || {};
      const rentAmount = parseFloat(t.rentAmount || t.agreedRent || 0);
      totalRent += rentAmount;
      if (currentFilter === "paid") {
        statAmount += parseFloat(rentInfo.paidAmount || rentInfo.totalDue || 0);
      } else if (currentFilter === "unpaid") {
        statAmount += parseFloat(rentInfo.totalDue || 0) - parseFloat(rentInfo.paidAmount || 0);
      } else if (rentInfo.paymentStatus === "paid") {
        statAmount += parseFloat(rentInfo.paidAmount || rentInfo.totalDue || 0);
      }
    });

    return { totalRent, statAmount, statLabel };
  }, [filteredTenants, currentFilter]);

  const currentPage = "rentcollection";

  return (
    <div className="html-page">
      {toast ? (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          <div className="flex items-center gap-2">
            <i data-lucide={toast.type === "success" ? "check-circle" : "alert-circle"} className="w-5 h-5"></i>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      ) : null}

      <div id="mobile-sidebar-overlay" className={`fixed inset-0 bg-black/50 z-30 md:hidden ${mobileOpen ? "" : "hidden"}`} onClick={() => setMobileOpen(false)}></div>
      <div className="flex h-screen">
        <aside id="mobile-sidebar" className={`sidebar w-72 flex-shrink-0 ${mobileOpen ? "flex" : "hidden"} md:flex flex-col z-20 overflow-y-auto custom-scrollbar fixed md:static inset-y-0 left-0 transform ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} transition-transform duration-300`}>
          <div className="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
            <div className="flex items-center gap-3">
              <div><img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" /><span className="text-[10px] text-gray-500">SUPER ADMIN</span></div>
            </div>
            <button className="md:hidden ml-auto p-2 text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>
              <i data-lucide="x" className="w-5 h-5"></i>
            </button>
          </div>
          <nav className="flex-1 py-6 space-y-1">
            {navSections.map((section) => (
              <div key={section.label}>
                <div className="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{section.label}</div>
                {section.items.map((item) => (
                  <a key={item.href} href={item.href} className={`sidebar-link ${item.key === currentPage ? "active" : ""}`}>
                    <i data-lucide={item.icon} className="w-5 h-5 mr-3"></i> {item.text}
                  </a>
                ))}
              </div>
            ))}

            <div className="mt-6 px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Finance</div>
            <div className="group">
              <div className="sidebar-link justify-between" onClick={() => setFinanceOpen((v) => !v)}>
                <div className="flex items-center"><i data-lucide="wallet" className="w-5 h-5 mr-3"></i> Finance</div>
                <i data-lucide="chevron-down" className={`w-4 h-4 transition-transform duration-200 ${financeOpen ? "rotate-180" : ""}`}></i>
              </div>
              <div id="finance-submenu" className={`submenu ${financeOpen ? "open" : ""}`}>
                <a href="/superadmin/rentcollection" className="sidebar-link text-sm hover:text-white active">Rent Collections</a>
                <a href="/superadmin/platform" className="sidebar-link text-sm hover:text-white">Commissions</a>
                <a href="/superadmin/refund" className="sidebar-link text-sm hover:text-white">Refunds</a>
              </div>
            </div>

            <div className="mt-6 px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">System</div>
            <a href="/superadmin/location" className="sidebar-link"><i data-lucide="globe" className="w-5 h-5 mr-3"></i> Locations</a>
          </nav>
        </aside>
        <div className="flex-1 overflow-auto">
          <div className="md:hidden bg-white p-4 shadow-sm flex items-center">
            <button id="mobile-menu-open" className="mr-4 text-slate-500" onClick={() => setMobileOpen(true)}>
              <i data-lucide="menu" className="w-6 h-6"></i>
            </button>
            <h2 className="text-lg font-bold text-slate-900">Rent Collection</h2>
          </div>
          <div className="p-4 sm:p-6 md:p-8">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Rent Collection</h2>
              <p className="text-sm md:text-base text-gray-600">View all tenant rent information</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex flex-wrap gap-2 sm:gap-4 mb-4">
                <button onClick={() => setCurrentFilter("all")} className={`filter-btn w-full sm:w-auto px-4 sm:px-6 py-2 rounded-md font-medium text-sm transition ${currentFilter === "all" ? "active" : ""}`} data-filter="all">
                  All Tenants
                </button>
                <button onClick={() => setCurrentFilter("paid")} className={`filter-btn w-full sm:w-auto px-4 sm:px-6 py-2 rounded-md font-medium text-sm transition ${currentFilter === "paid" ? "active" : ""}`} data-filter="paid">
                  Paid
                </button>
                <button onClick={() => setCurrentFilter("unpaid")} className={`filter-btn w-full sm:w-auto px-4 sm:px-6 py-2 rounded-md font-medium text-sm transition ${currentFilter === "unpaid" ? "active" : ""}`} data-filter="unpaid">
                  Unpaid
                </button>
              </div>
              <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 items-stretch lg:items-center">
                <input
                  type="text"
                  placeholder="Search tenant name, email, or property..."
                  className="w-full flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button onClick={loadData} className="w-full sm:w-auto bg-purple-600 text-white px-6 py-2 rounded-md text-sm hover:bg-purple-700">
                  <i data-lucide="refresh-cw" className="w-4 h-4 inline mr-2"></i> Refresh
                </button>
                <button onClick={sendReminders} className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-md text-sm hover:bg-blue-700">
                  <i data-lucide="bell" className="w-4 h-4 inline mr-2"></i> Rent Reminder
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow p-6 mb-6 border border-purple-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Overall Rent Summary (All Tenants)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-gray-600 text-xs font-medium uppercase tracking-wide">Total Rent</p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-2">{"\u20B9"}{overallStats.overallTotalRent.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-2">All Tenants</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-gray-600 text-xs font-medium uppercase tracking-wide">Total Collected</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-2">{"\u20B9"}{overallStats.overallCollected.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-2">Paid</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <p className="text-gray-600 text-xs font-medium uppercase tracking-wide">Total Pending</p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-2">{"\u20B9"}{overallStats.overallPending.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-2">Unpaid</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-gray-600 text-xs font-medium uppercase tracking-wide">Collection Rate</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2">{overallStats.collectionRate}%</p>
                  <p className="text-xs text-gray-500 mt-2">Collected/Total</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Filtered View Stats</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Rent</p>
                  <p className="text-2xl font-bold text-gray-900">{"\u20B9"}{filteredStats.totalRent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">{filteredStats.statLabel}</p>
                  <p className="text-2xl font-bold text-green-600">{"\u20B9"}{filteredStats.statAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1400px]">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Tenant Name</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Email</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Phone</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Property</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Room</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Rent Amount</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Payment Status</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Move In Date</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Owner Name</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Owner Phone</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Bank Name</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Account Number</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">IFSC Code</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Branch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredTenants.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="text-center py-8 text-gray-500">No {currentFilter !== "all" ? currentFilter : ""} tenants found</td>
                      </tr>
                    ) : (
                      filteredTenants.map((tenant, idx) => {
                        const moveInDate = tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString() : "N/A";
                        const initials = (tenant.name || "T").split(" ").map((n) => n[0]).join("").toUpperCase();
                        const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-red-500", "bg-yellow-500", "bg-pink-500"];
                        const avatarBg = colors[idx % colors.length];

                        const rentInfo = tenant.rentInfo || {};
                        const tenantPropertyRaw = typeof tenant.property === "object" && tenant.property
                          ? tenant.property.title || tenant.property.name || ""
                          : tenant.property || "";
                        const rentPropertyRaw = rentInfo.propertyName || "";
                        const isPlaceholderProperty = (value) => {
                          const v = String(value || "").trim().toLowerCase();
                          return !v || v === "new" || v === "new property" || v === "unknown";
                        };
                        const propertyName = !isPlaceholderProperty(rentPropertyRaw)
                          ? rentPropertyRaw
                          : (!isPlaceholderProperty(tenantPropertyRaw) ? tenantPropertyRaw : "Unknown Property");
                        const paymentStatus = rentInfo.paymentStatus || "pending";
                        const statusBadgeColor = paymentStatus === "paid" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
                        const statusText = paymentStatus === "paid" ? "Paid" : "Unpaid";
                        const rentAmount = parseFloat(tenant.rentAmount || tenant.agreedRent || 0);

                        const roomNo = tenant.roomNo || tenant.room_no || tenant.roomNumber || "N/A";
                        const ownerInfo = tenant.ownerInfo || {};
                        const ownerProfile = tenant.ownerProfile || ownerInfo.profile || {};
                        const ownerName = ownerInfo.name || ownerInfo.ownerName || ownerProfile.name || ownerProfile.ownerName || tenant.ownerName || "N/A";
                        const ownerPhone = ownerInfo.phone || ownerInfo.mobile || ownerProfile.phone || ownerProfile.mobile || ownerProfile.contactPhone || "N/A";
                        const bankName = ownerProfile.bankName || ownerProfile.bank || ownerProfile.bank_name || ownerProfile.upiId || ownerProfile.upi || ownerProfile.gpay || ownerProfile.paymentId || "N/A";
                        const accountNumber = ownerProfile.accountNumber || ownerProfile.accountNo || ownerProfile.account_number || "N/A";
                        const ifscCode = ownerProfile.ifscCode || ownerProfile.ifsc || ownerProfile.ifsc_code || "N/A";
                        const branchName = ownerProfile.branchName || ownerProfile.branch || ownerProfile.branch_name || "N/A";

                        return (
                          <tr key={tenant.loginId || idx} className="hover:bg-gray-50 transition">
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className={`avatar ${avatarBg}`}>{initials}</div>
                                <span className="font-medium text-gray-900">{tenant.name || "N/A"}</span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{tenant.email || "N/A"}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{tenant.phone || "N/A"}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{propertyName}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">{roomNo}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">{"\u20B9"}{rentAmount.toLocaleString()}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm whitespace-nowrap">
                              <span className={`status-badge px-3 py-1 rounded-full font-bold text-xs ${statusBadgeColor}`}>{statusText}</span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{moveInDate}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">{ownerName}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{ownerPhone}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{bankName}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 font-mono whitespace-nowrap">{accountNumber}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 font-mono whitespace-nowrap">{ifscCode}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{branchName}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


