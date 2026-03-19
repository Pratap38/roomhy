import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";

const getApiUrl = () =>
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : "https://api.roomhy.com";

const WINDOW_NAME_SESSION_PREFIX = "__ROOMHY_STAFF_SESSION__:";

const getStaffUser = () => {
  try {
    const params = new URLSearchParams(window.location.search || "");
    const staff = params.get("staff");
    if (staff) return JSON.parse(decodeURIComponent(staff));
  } catch (e) {
    // ignore
  }

  try {
    const raw =
      sessionStorage.getItem("manager_user") ||
      sessionStorage.getItem("user") ||
      localStorage.getItem("staff_user") ||
      localStorage.getItem("manager_user") ||
      localStorage.getItem("user") ||
      "null";
    const parsed = JSON.parse(raw);
    if (parsed) return parsed;
  } catch (e) {
    // ignore
  }

  try {
    if (typeof window.name === "string" && window.name.startsWith(WINDOW_NAME_SESSION_PREFIX)) {
      const payload = window.name.slice(WINDOW_NAME_SESSION_PREFIX.length);
      return JSON.parse(decodeURIComponent(payload));
    }
  } catch (e) {
    // ignore
  }

  return null;
};

const normalizePermissions = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((v) => {
        if (typeof v === "string") return v;
        if (v && typeof v === "object") return v.id || v.value || v.key || "";
        return "";
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

const getEmployeeRecord = (loginId) => {
  if (!loginId) return null;
  const id = String(loginId).toUpperCase();
  try {
    const list = JSON.parse(localStorage.getItem("roomhy_employees") || "[]");
    if (Array.isArray(list)) {
      const found = list.find((e) => String(e.loginId || "").toUpperCase() === id);
      if (found) return found;
    }
  } catch (e) {}
  try {
    const cache = JSON.parse(localStorage.getItem("roomhy_employees_cache") || "[]");
    if (Array.isArray(cache)) {
      const found = cache.find((e) => String(e.loginId || "").toUpperCase() === id);
      if (found) return found;
    }
  } catch (e) {}
  return null;
};

const resolveUserDisplayName = (currentUser, fallbackEmp) => {
  const raw =
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.employeeName ||
    currentUser?.managerName ||
    fallbackEmp?.name ||
    fallbackEmp?.fullName ||
    fallbackEmp?.employeeName ||
    fallbackEmp?.managerName ||
    currentUser?.loginId ||
    "User";
  return String(raw || "User");
};

const sidebarConfig = {
  dashboard: { label: "Dashboard", path: "/employee/areaadmin", icon: "layout-dashboard" },
  teams: { label: "Teams", path: "/employee/manager", icon: "map-pin" },
  owners: { label: "Property Owners", path: "/employee/owner", icon: "briefcase" },
  properties: { label: "Properties", path: "/employee/properties", icon: "home" },
  tenants: { label: "Tenants", path: "/employee/tenant", icon: "users" },
  new_signups: { label: "New Signups", path: "/employee/new_signups", icon: "file-badge" },
  web_enquiry: { label: "Web Enquiry", path: "/employee/websiteenq", icon: "folder-open" },
  enquiries: { label: "Enquiries", path: "/employee/enquiry", icon: "help-circle" },
  bookings: { label: "Bookings", path: "/employee/booking", icon: "calendar-check" },
  reviews: { label: "Reviews", path: "/employee/reviews", icon: "star" },
  complaint_history: {
    label: "Complaint History",
    path: "/employee/complaint-history",
    icon: "alert-circle"
  },
  live_properties: { label: "Live Properties", path: "/employee/website", icon: "globe" },
  rent_collections: { label: "Rent Collections", path: "/employee/rentcollection", icon: "wallet" },
  commissions: { label: "Commissions", path: "/employee/platform", icon: "indian-rupee" },
  refunds: { label: "Refunds", path: "/employee/refund", icon: "rotate-ccw" },
  locations: { label: "Locations", path: "/employee/location", icon: "map-pin" },
  visits: { label: "Visit Reports", path: "/employee/visit", icon: "clipboard-list" }
};

const mandatoryPermissions = ["dashboard"];

const parseCountPayload = (payload) => {
  if (Array.isArray(payload)) return payload.length;
  if (Array.isArray(payload?.data)) return payload.data.length;
  if (Array.isArray(payload?.items)) return payload.items.length;
  if (Array.isArray(payload?.visits)) return payload.visits.length;
  if (Array.isArray(payload?.tenants)) return payload.tenants.length;
  if (Array.isArray(payload?.complaints)) return payload.complaints.length;
  if (typeof payload?.count === "number") return payload.count;
  if (typeof payload?.total === "number") return payload.total;
  if (typeof payload?.totalCount === "number") return payload.totalCount;
  return 0;
};

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();

const visitBelongsToEmployee = (visit, user) => {
  if (!visit || !user) return false;

  const userIds = [
    user?.loginId,
    user?.staffId,
    user?.id,
    user?._id
  ]
    .map(normalizeIdentity)
    .filter(Boolean);

  const userNames = [
    user?.name,
    user?.fullName,
    user?.employeeName,
    user?.managerName
  ]
    .map(normalizeIdentity)
    .filter(Boolean);

  const visitIds = [
    visit?.staffId,
    visit?.submittedById,
    visit?.employeeId,
    visit?.employee_id,
    visit?.createdBy,
    visit?.created_by,
    visit?.addedBy,
    visit?.added_by,
    visit?.propertyInfo?.staffId,
    visit?.propertyInfo?.submittedById,
    visit?.propertyInfo?.employeeId,
    visit?.propertyInfo?.employee_id,
    visit?.propertyInfo?.createdBy,
    visit?.propertyInfo?.created_by,
    visit?.propertyInfo?.addedBy,
    visit?.propertyInfo?.added_by
  ]
    .map(normalizeIdentity)
    .filter(Boolean);

  const visitNames = [
    visit?.staffName,
    visit?.submittedBy,
    visit?.employeeName,
    visit?.createdByName,
    visit?.addedByName,
    visit?.propertyInfo?.staffName,
    visit?.propertyInfo?.submittedBy,
    visit?.propertyInfo?.employeeName,
    visit?.propertyInfo?.createdByName,
    visit?.propertyInfo?.addedByName
  ]
    .map(normalizeIdentity)
    .filter(Boolean);

  if (userIds.length && visitIds.some((value) => userIds.includes(value))) {
    return true;
  }

  if (userNames.length && visitNames.some((value) => userNames.includes(value))) {
    return true;
  }

  return false;
};

export default function SuperadminAreaadmin() {
  useHtmlPage({
    title: "Roomhy - Area Admin Dashboard",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    bases: [],
    links: [
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/superadmin/assets/css/areaadmin.css" }
    ],
    styles: [],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" }
    ],
    inlineScripts: [],
    disableMobileSidebar: true
  });

  const [user, setUser] = useState(null);
  const [allowedModules, setAllowedModules] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerBadge, setHeaderBadge] = useState("Loading...");
  const [displayName, setDisplayName] = useState("User");
  const [roleLabel, setRoleLabel] = useState("AREA ADMIN");
  const [headerRole, setHeaderRole] = useState("Role");
  const [showSalary, setShowSalary] = useState(true);
  const [areaStats, setAreaStats] = useState({
    totalProperties: "-",
    pendingApprovals: "-",
    activeOwners: "-"
  });
  const [widgetCounts, setWidgetCounts] = useState({
    properties: 0,
    tenants: 0,
    complaints: 0,
    visits: 0
  });

  useEffect(() => {
    const stored = getStaffUser();
    if (stored && stored.role) stored.role = String(stored.role).toLowerCase();
    if (!stored || (stored.role !== "areamanager" && stored.role !== "employee")) {
      localStorage.removeItem("user");
      localStorage.removeItem("manager_user");
      sessionStorage.removeItem("owner_session");
      window.location.href = "/superadmin/index";
      return;
    }

    if (stored.role === "employee") {
      const empRecord = getEmployeeRecord(stored.loginId);
      if (empRecord) {
        const mergedPerms = normalizePermissions(stored.permissions);
        if (!mergedPerms.length) {
          stored.permissions = normalizePermissions(
            empRecord.permissions || empRecord.modules || empRecord.moduleAccess || empRecord.access
          );
        }
        stored.name = stored.name || empRecord.name || empRecord.fullName || empRecord.employeeName;
        stored.team = stored.team || empRecord.team || empRecord.role || "Employee";
        stored.area = stored.area || empRecord.area || empRecord.areaName || "";
        stored.areaName = stored.areaName || empRecord.areaName || empRecord.area || "";
        stored.city = stored.city || empRecord.city || "";
      }
    }

    const display = resolveUserDisplayName(stored, getEmployeeRecord(stored?.loginId));
    setUser(stored);
    setDisplayName(display);
    setRoleLabel(stored.role === "areamanager" ? "AREA ADMIN" : "TEAM MEMBER");
    setHeaderRole(stored.role === "employee" ? (stored.team || "Employee") : "Area Manager");
    setShowSalary(stored.role !== "employee");

    const assignedArea = stored.area || stored.areaName;
    if (assignedArea && assignedArea !== "Unassigned" && assignedArea !== "Select Area") {
      setHeaderBadge(stored.city ? `${assignedArea}, ${stored.city}` : assignedArea);
    } else {
      setHeaderBadge(stored.team || "Head Office");
    }

    let allowed = [];
    if (stored.role === "areamanager") {
      allowed = Object.keys(sidebarConfig);
    } else {
      const assigned = normalizePermissions(stored.permissions);
      allowed = [...new Set([...assigned, ...mandatoryPermissions])];
    }
    setAllowedModules(allowed);
  }, []);

  useEffect(() => {
    window.lucide?.createIcons();
  }, [allowedModules, mobileOpen, displayName, headerBadge, headerRole, areaStats, widgetCounts]);

  useEffect(() => {
    if (!user) return;
    const apiUrl = getApiUrl();
    const areaCode = user?.areaCode || user?.area || "";
    if (!areaCode) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetch(`${apiUrl}/api/admin/stats?areaCode=${encodeURIComponent(areaCode)}`, {
      signal: controller.signal
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Stats fetch failed"))))
      .then((stats) => {
        setAreaStats({
          totalProperties: stats.totalProperties || 0,
          pendingApprovals: stats.pendingApprovals || stats.enquiryCount || 0,
          activeOwners: stats.activeOwners || 0
        });
      })
      .catch((err) => {
        console.error("Failed to load area stats:", err?.message || err);
        setAreaStats((prev) => ({ ...prev, activeOwners: "N/A" }));
      })
      .finally(() => clearTimeout(timeout));

    return () => clearTimeout(timeout);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const apiUrl = getApiUrl();
    const isEmployee = user?.role === "employee";
    const visitQuery =
      isEmployee && (user?.loginId || user?.name)
        ? `?staffId=${encodeURIComponent(user?.loginId || "")}&staffName=${encodeURIComponent(user?.name || "")}`
        : "";

    const fetchCount = async (path) => {
      try {
        const res = await fetch(`${apiUrl}${path}`);
        if (!res.ok) return 0;
        const data = await res.json().catch(() => ({}));
        if (isEmployee && path.startsWith("/api/visits")) {
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.visits)
              ? data.visits
              : Array.isArray(data?.data)
                ? data.data
                : Array.isArray(data?.items)
                  ? data.items
                  : [];
          if (list.length) {
            return list.filter((visit) => visitBelongsToEmployee(visit, user)).length;
          }
        }
        return parseCountPayload(data);
      } catch {
        return 0;
      }
    };

    const loadCounts = async () => {
      const [properties, tenants, complaints, visits] = await Promise.all([
        allowedModules.includes("properties") ? fetchCount("/api/properties") : 0,
        allowedModules.includes("tenants") ? fetchCount("/api/tenants") : 0,
        allowedModules.includes("complaint_history") ? fetchCount("/api/complaints") : 0,
        allowedModules.includes("visits") ? fetchCount(`/api/visits${visitQuery}`) : 0
      ]);

      let finalVisits = visits;
      if (!finalVisits && allowedModules.includes("visits")) {
        try {
          const localVisits = JSON.parse(localStorage.getItem("roomhy_visit_reports") || "[]");
          finalVisits = Array.isArray(localVisits)
            ? (isEmployee ? localVisits.filter((visit) => visitBelongsToEmployee(visit, user)).length : localVisits.length)
            : 0;
        } catch {}
      }

      setWidgetCounts({
        properties: properties || 0,
        tenants: tenants || 0,
        complaints: complaints || 0,
        visits: finalVisits || 0
      });
    };

    loadCounts();
  }, [allowedModules, user]);

  const dashboardCards = useMemo(
    () =>
      [
        { id: "properties", label: "Properties", desc: "Manage Listings", icon: "home", color: "blue" },
        { id: "tenants", label: "Tenants", desc: "Active Residents", icon: "users", color: "green" },
        { id: "complaint_history", label: "Complaints", desc: "View Issues", icon: "alert-circle", color: "red" },
        { id: "visits", label: "Visit Reports", desc: "Total Visit Reports", icon: "clipboard-list", color: "purple" }
      ].filter((card) => allowedModules.includes(card.id)),
    [allowedModules]
  );

  const renderSection = (label, items, extraClass = "") => {
    const visible = items.filter((item) => allowedModules.includes(item.key));
    if (!visible.length) return null;
    return (
      <div className={extraClass}>
        <div className="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">{label}</div>
        {visible.map((item) => (
          <a key={item.key} href={item.path} className={`sidebar-link ${item.key === "dashboard" ? "active" : ""}`}>
            <i data-lucide={item.icon} className="w-5 h-5 mr-3"></i> {item.label}
          </a>
        ))}
      </div>
    );
  };

  const navManagement = [
    { key: "teams", ...sidebarConfig.teams },
    { key: "owners", ...sidebarConfig.owners },
    { key: "properties", ...sidebarConfig.properties },
    { key: "tenants", ...sidebarConfig.tenants },
    { key: "new_signups", ...sidebarConfig.new_signups },
    { key: "visits", ...sidebarConfig.visits }
  ];
  const navFinance = [
    { key: "rent_collections", ...sidebarConfig.rent_collections },
    { key: "commissions", ...sidebarConfig.commissions },
    { key: "refunds", ...sidebarConfig.refunds }
  ];
  const navSystem = [
    { key: "web_enquiry", ...sidebarConfig.web_enquiry },
    { key: "enquiries", ...sidebarConfig.enquiries },
    { key: "bookings", ...sidebarConfig.bookings },
    { key: "reviews", ...sidebarConfig.reviews },
    { key: "complaint_history", ...sidebarConfig.complaint_history },
    { key: "live_properties", ...sidebarConfig.live_properties },
    { key: "locations", ...sidebarConfig.locations }
  ];

  const logout = (event) => {
    event?.preventDefault?.();
    localStorage.removeItem("user");
    localStorage.removeItem("manager_user");
    if (typeof window.name === "string" && window.name.startsWith(WINDOW_NAME_SESSION_PREFIX)) {
      window.name = "";
    }
    window.location.href = "/superadmin/index";
  };

  const avatarData = useMemo(() => {
    if (!user) return { initials: "--", color: "bg-purple-500" };
    const nameForAvatar = displayName || user?.loginId || "User";
    const normalized = String(nameForAvatar || "").replace(/\s+/g, "").trim();
    const initials = (normalized ? normalized.slice(0, 2) : "--").toUpperCase();
    const colors = ["bg-purple-500", "bg-blue-500", "bg-green-500", "bg-pink-500", "bg-indigo-500", "bg-orange-500"];
    const key = String(user.loginId || "0");
    const colorIdx = key.charCodeAt(0) % colors.length;
    const empRecord = getEmployeeRecord(user.loginId);
    const photoUrl = empRecord?.photoDataUrl || "";
    return { initials, color: colors[colorIdx], photoUrl };
  }, [displayName, user]);

  return (
    <div className="html-page">
      <div className="flex h-screen overflow-hidden">
        <aside className={`sidebar w-72 flex-shrink-0 ${mobileOpen ? "flex" : "hidden"} md:flex flex-col z-20 overflow-y-auto custom-scrollbar fixed md:static inset-y-0 left-0 transform ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} transition-transform duration-300`}>
          <div className="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
            <div className="flex items-center gap-3">
              <div>
                <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
                <span className="text-[10px] text-gray-500 font-medium tracking-wider">{roleLabel}</span>
              </div>
            </div>
            <button className="md:hidden ml-auto p-2 text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <i data-lucide="x" className="w-5 h-5"></i>
            </button>
          </div>

          <nav className="flex-1 py-6 space-y-1" id="dynamicSidebarNav">
            <a href={sidebarConfig.dashboard.path} className="sidebar-link active">
              <i data-lucide={sidebarConfig.dashboard.icon} className="w-5 h-5 mr-3"></i> {sidebarConfig.dashboard.label}
            </a>
            {renderSection("Management", navManagement)}
            {renderSection("Finance", navFinance)}
            {renderSection("System", navSystem)}
            <div className="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">Account</div>
            <a href="/employee/profile" className="sidebar-link"><i data-lucide="user" className="w-5 h-5 mr-3"></i> Profile</a>
            <a href="/employee/settings" className="sidebar-link"><i data-lucide="settings" className="w-5 h-5 mr-3"></i> Settings</a>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
          <header className="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10 border-b border-gray-200">
            <div className="flex items-center">
              <button id="mobile-menu-open" className="md:hidden mr-4 text-slate-500" onClick={() => setMobileOpen(true)}>
                <i data-lucide="menu" className="w-6 h-6"></i>
              </button>
              <div className="flex items-center text-sm">
                <span id="headerAreaBadge" className="px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-bold uppercase tracking-wide">
                  {headerBadge}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <button className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-full transition-colors">
                  {avatarData.photoUrl ? (
                    <img src={avatarData.photoUrl} alt="User" className="w-8 h-8 rounded-full border border-slate-200" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full ${avatarData.color} flex items-center justify-center text-white text-xs font-bold border border-slate-200`} data-emp-avatar="true">
                      {avatarData.initials}
                    </div>
                  )}
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-gray-700" id="headerName">{displayName}</p>
                    <p className="text-[10px] text-gray-500" id="headerRole">{headerRole}</p>
                  </div>
                  <i data-lucide="chevron-down" className="w-3 h-3 text-gray-400 hidden sm:block"></i>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-50">
                  <a href="/superadmin/index" id="logoutBtn" onClick={logout} className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Logout</a>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-hidden relative">
            <main id="dashboard-view" className="h-full overflow-y-auto p-4 md:p-8">
              <div className="max-w-[1600px] mx-auto">
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">Welcome, <span id="welcomeName">{displayName}</span>!</h1>
                    <p className="text-sm text-slate-500 mt-1">Accessing <span id="welcomeArea" className="font-semibold text-purple-600">Dashboard</span>.</p>
                  </div>

                  <div id="areaStatsRow" className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                      <p className="text-sm text-gray-500">Total Properties</p>
                      <h3 id="totalPropertiesCountArea" className="text-2xl font-bold text-slate-800">{areaStats.totalProperties}</h3>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                      <p className="text-sm text-gray-500">Pending Approvals</p>
                      <h3 id="pendingApprovalsCountArea" className="text-2xl font-bold text-slate-800">{areaStats.pendingApprovals}</h3>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                      <p className="text-sm text-gray-500">Active Owners</p>
                      <h3 id="activeOwnersCountArea" className="text-2xl font-bold text-slate-800">{areaStats.activeOwners}</h3>
                    </div>
                  </div>

                  {showSalary ? (
                    <div id="salaryBadge" className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-right hidden md:block">
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Current Salary</p>
                      <p className="text-lg font-bold text-green-600">&#8377; --</p>
                    </div>
                  ) : null}
                </div>

                <div id="dashboardWidgetGrid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardCards.map((card) => (
                    <div
                      key={card.id}
                      className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
                      onClick={() => {
                        const cfg = sidebarConfig[card.id];
                        if (cfg?.path) window.location.href = cfg.path;
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 bg-${card.color}-50 rounded-lg text-${card.color}-600`}>
                          <i data-lucide={card.icon} className="w-6 h-6"></i>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">{card.label}</h3>
                          <p className="text-xs text-gray-500">{card.desc}</p>
                          <p className="text-sm font-semibold text-slate-700 mt-1">
                            {card.id === "properties" ? widgetCounts.properties :
                              card.id === "tenants" ? widgetCounts.tenants :
                                card.id === "complaint_history" ? widgetCounts.complaints :
                                  widgetCounts.visits}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-8 bg-white rounded-xl border border-gray-200 text-center">
                  <h3 className="text-lg font-medium text-gray-800">Select a module from the sidebar</h3>
                  <p className="text-gray-500 text-sm mt-1">Your access is limited to the specific permissions assigned to your Team role.</p>
                  {allowedModules.includes("visits") ? (
                    <div className="mt-6">
                      <a
                        href="/employee/visit"
                        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors"
                      >
                        <i data-lucide="clipboard-list" className="w-4 h-4"></i>
                        Add Visit Report
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            </main>
          </div>
        </div>

        <div id="mobile-sidebar-overlay" className={`fixed inset-0 bg-black/50 z-30 ${mobileOpen ? "" : "hidden"} md:hidden backdrop-blur-sm`} onClick={() => setMobileOpen(false)}></div>
      </div>
    </div>
  );
}




