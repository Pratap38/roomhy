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

const allPermissions = [
  { id: "dashboard", label: "Dashboard" },
  { id: "teams", label: "Teams" },
  { id: "owners", label: "Property Owners" },
  { id: "properties", label: "Properties" },
  { id: "tenants", label: "Tenants" },
  { id: "new_signups", label: "New Signups" },
  { id: "web_enquiry", label: "Web Enquiry" },
  { id: "enquiries", label: "Enquiries" },
  { id: "bookings", label: "Bookings" },
  { id: "reviews", label: "Reviews" },
  { id: "complaint_history", label: "Complaint History" },
  { id: "live_properties", label: "Live Properties" },
  { id: "rent_collections", label: "Rent Collections" },
  { id: "commissions", label: "Commissions" },
  { id: "refunds", label: "Refunds" },
  { id: "locations", label: "Locations" },
  { id: "visits", label: "Visit Reports" }
];

const standardTeams = [
  "Marketing Team",
  "Accounts Department",
  "Maintenance Team",
  "Customer Support"
];

const isBcryptHash = (password) => {
  if (!password || typeof password !== "string") return false;
  return password.startsWith("$2b$") || password.startsWith("$2a$");
};

const buildInitials = (name) =>
  (name || "")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "--";

const avatarColors = ["bg-purple-500", "bg-blue-500", "bg-green-500", "bg-pink-500", "bg-indigo-500", "bg-orange-500"];

const removeEmployeeFromLocalCaches = (loginId) => {
  const normalized = String(loginId || "").toUpperCase();
  const keys = ["roomhy_employees_cache", "roomhy_employees"];
  keys.forEach((key) => {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || "[]");
      if (!Array.isArray(raw)) return;
      const filtered = raw.filter((entry) => String(entry?.loginId || "").toUpperCase() !== normalized);
      localStorage.setItem(key, JSON.stringify(filtered));
    } catch (_) {
      // ignore malformed cache entries
    }
  });
};

export default function Manager() {
  useHtmlPage({
    title: "Roomhy - Team Management",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    bases: [],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic", crossOrigin: true },
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      },
      { rel: "stylesheet", href: "/superadmin/assets/css/manager.css" }
    ],
    styles: [],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" },
      { src: "https://cdn.jsdelivr.net/npm/chart.js" }
    ],
    inlineScripts: []
  });

  const apiUrl = getApiUrl();
  const [employees, setEmployees] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [currentTeam, setCurrentTeam] = useState("All");
  const [filterCity, setFilterCity] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [parentLoginId, setParentLoginId] = useState("");
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("Marketing Team");
  const [customRole, setCustomRole] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formArea, setFormArea] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formLoginId, setFormLoginId] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [selectedPerms, setSelectedPerms] = useState(new Set());
  const [showCredModal, setShowCredModal] = useState(false);
  const [credsData, setCredsData] = useState({ loginId: "", password: "" });
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const uploadRef = useRef(null);

  useEffect(() => {
    window.lucide?.createIcons();
  }, [employees, currentTeam, filterCity, filterArea, showModal, showCredModal, mobileOpen, financeOpen, selectedPerms]);

  useEffect(() => {
    loadLocations();
    syncEmployeesFromBackend();
  }, []);

  const loadLocations = async () => {
    let citiesData = [];
    let areasData = [];
    try {
      const citiesRes = await fetch(`${apiUrl}/api/locations/cities`);
      const citiesPayload = await citiesRes.json();
      citiesData = (citiesPayload.data || []).map((city) => ({
        id: city._id || city.id,
        name: city.name || city.cityName,
        state: city.state || "",
        status: "Active",
        image: city.imageUrl || city.image
      }));
      const areasRes = await fetch(`${apiUrl}/api/locations/areas`);
      const areasPayload = await areasRes.json();
      areasData = (areasPayload.data || []).map((area) => ({
        id: area._id || area.id,
        name: area.name || area.areaName,
        city: area.city || area.cityName,
        cityName: area.cityName || (area.city && area.city.name) || "",
        pincode: area.pincode || "",
        status: "Active",
        image: area.imageUrl || area.image
      }));
    } catch (err) {
      console.log("Error fetching locations, using fallback:", err.message);
    }

    if (citiesData.length === 0) {
      try {
        citiesData = JSON.parse(localStorage.getItem("roomhy_cities") || "[]");
      } catch (_) {}
    }
    if (areasData.length === 0) {
      try {
        areasData = JSON.parse(localStorage.getItem("roomhy_areas") || "[]");
      } catch (_) {}
    }

    if (citiesData.length === 0) {
      citiesData = [
        { id: "ct_1", name: "Bangalore", state: "Karnataka", status: "Active" },
        { id: "ct_2", name: "Chennai", state: "Tamil Nadu", status: "Active" },
        { id: "ct_3", name: "Coimbatore", state: "Tamil Nadu", status: "Active" }
      ];
      localStorage.setItem("roomhy_cities", JSON.stringify(citiesData));
    }

    if (areasData.length === 0) {
      areasData = [
        { id: "ar_1", name: "Koramangala", city: "Bangalore", cityName: "Bangalore", pincode: "560034", status: "Active" },
        { id: "ar_2", name: "Indiranagar", city: "Bangalore", cityName: "Bangalore", pincode: "560038", status: "Active" },
        { id: "ar_3", name: "Anna Nagar", city: "Chennai", cityName: "Chennai", pincode: "600040", status: "Active" },
        { id: "ar_4", name: "T Nagar", city: "Chennai", cityName: "Chennai", pincode: "600017", status: "Active" },
        { id: "ar_5", name: "Gandhipuram", city: "Coimbatore", cityName: "Coimbatore", pincode: "641012", status: "Active" }
      ];
      localStorage.setItem("roomhy_areas", JSON.stringify(areasData));
    }

    setCities(citiesData);
    setAreas(areasData);
  };

  const loadEmployeesFromCache = () => {
    try {
      const cache = JSON.parse(localStorage.getItem("roomhy_employees_cache") || "null");
      if (Array.isArray(cache) && cache.length) return cache;
    } catch (_) {}
    return [];
  };

  const syncEmployeesFromBackend = async () => {
    setLoadingEmployees(true);
    let merged = [];
    try {
      const res = await fetch(`${apiUrl}/api/employees`);
      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          const localCache = loadEmployeesFromCache();
          merged = data.data.map((emp) => {
            const cached = localCache.find((c) => c.loginId === emp.loginId) || {};
            const password = isBcryptHash(emp.password) ? cached.password || emp.password || "" : emp.password || cached.password || "";
            return {
              id: emp._id || emp.id,
              name: emp.name,
              loginId: emp.loginId,
              email: emp.email,
              phone: emp.phone,
              password,
              role: emp.role,
              area: emp.area,
              areaCode: emp.areaCode,
              city: emp.city,
              permissions: emp.permissions || [],
              parentLoginId: emp.parentLoginId,
              isActive: emp.isActive !== false,
              photoDataUrl: emp.photoDataUrl || emp.photoUrl || emp.photo || cached.photoDataUrl || "",
              _synced: true,
              _dbId: emp._id
            };
          });

          const localOnly = (localCache || []).filter((c) => !merged.find((e) => e.loginId === c.loginId));
          if (localOnly.length) merged = merged.concat(localOnly.map((c) => ({ ...c, _synced: false })));
        } else {
          merged = loadEmployeesFromCache();
        }
      } else {
        merged = loadEmployeesFromCache();
      }
    } catch (err) {
      merged = loadEmployeesFromCache();
    }

    setEmployees(Array.isArray(merged) ? merged : []);
    try {
      localStorage.setItem("roomhy_employees_cache", JSON.stringify(merged));
    } catch (_) {}

    try {
      const loginCredsArray = (Array.isArray(merged) ? merged : []).map((emp) => ({
        loginId: emp.loginId,
        password: emp.password,
        name: emp.name,
        role: emp.role || "employee",
        team: emp.role || emp.team || "Employee",
        email: emp.email || "",
        permissions: emp.permissions || [],
        area: emp.area || "",
        areaName: emp.area || "",
        areaCode: emp.areaCode || ""
      }));
      localStorage.setItem("roomhy_employees", JSON.stringify(loginCredsArray));
    } catch (_) {}

    setLoadingEmployees(false);
  };

  const areaOptions = useMemo(() => {
    if (!filterCity) return areas;
    return areas.filter((a) => (a.cityName || a.city) === filterCity);
  }, [areas, filterCity]);

  const modalAreaOptions = useMemo(() => {
    if (!formCity) return [];
    return areas.filter((a) => (a.cityName || a.city) === formCity);
  }, [areas, formCity]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const active = typeof emp.isActive === "undefined" ? true : !!emp.isActive;
      if (!active) return false;
      const matchTeam =
        currentTeam === "All"
          ? true
          : currentTeam === "Custom"
            ? !standardTeams.includes(emp.role)
            : emp.role === currentTeam;
      const matchCity = !filterCity || emp.city === filterCity;
      const matchArea = !filterArea || emp.area === filterArea;
      return matchTeam && matchCity && matchArea;
    });
  }, [employees, currentTeam, filterCity, filterArea]);

  const counts = useMemo(() => {
    const count = (role) => filteredEmployees.filter((e) => e.role === role).length;
    return {
      all: filteredEmployees.length,
      marketing: count("Marketing Team"),
      accounts: count("Accounts Department"),
      maintenance: count("Maintenance Team"),
      support: count("Customer Support"),
      custom: filteredEmployees.filter((e) => !standardTeams.includes(e.role)).length
    };
  }, [filteredEmployees]);

  const currentTeamLabel = useMemo(() => {
    let title = currentTeam;
    if (filterCity) title += ` (${filterCity})`;
    if (filterArea) title += ` - ${filterArea}`;
    return title;
  }, [currentTeam, filterCity, filterArea]);

  const getLocalCode = (city, area) => {
    const base = (area || city || "").replace(/[^A-Za-z]/g, "").toUpperCase();
    return base.slice(0, 4);
  };

  const generateCreds = (city = formCity, area = formArea) => {
    const localCode = getLocalCode(city, area);
    const prefix = localCode ? `RY${localCode}` : "RY";
    const genId = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
    const password = Math.random().toString(36).slice(-8).toUpperCase();
    setFormLoginId(genId);
    setFormPassword(password);
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    if (uploadRef.current) uploadRef.current.value = "";

    const previewDataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });

    setFormPhoto(previewDataUrl || "");

    const formData = new FormData();
    formData.append("profilePhoto", file);
    try {
      const res = await fetch(`${apiUrl}/api/upload-profile-photo`, { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setFormPhoto(data.url);
      }
    } catch (_) {}
  };

  const togglePerm = (id) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllPerms = () => {
    setSelectedPerms(new Set(allPermissions.map((p) => p.id)));
  };

  const clearPerms = () => {
    setSelectedPerms(new Set());
  };

  const openEmployeeModal = () => {
    setEditingId(null);
    setParentLoginId("");
    setFormName("");
    setFormRole(currentTeam !== "All" && currentTeam !== "Custom" ? currentTeam : "Marketing Team");
    setCustomRole("");
    setFormCity("");
    setFormArea("");
    setFormPhone("");
    setFormEmail("");
    setFormPhoto("");
    setSelectedPerms(new Set());
    generateCreds("", "");
    setShowModal(true);
  };

  const openSubEmployeeModal = (loginId) => {
    const parent = employees.find((e) => e.loginId === loginId);
    setEditingId(null);
    setParentLoginId(loginId);
    setFormName("");
    const role = parent?.role || "Custom";
    setFormRole(standardTeams.includes(role) ? role : "Custom");
    setCustomRole(standardTeams.includes(role) ? "" : role);
    setFormCity(parent?.city || "");
    setFormArea(parent?.area || "");
    setFormPhone("");
    setFormEmail("");
    setFormPhoto("");
    setSelectedPerms(new Set(parent?.permissions || []));
    generateCreds(parent?.city, parent?.area);
    setShowModal(true);
  };

  const openEditEmployee = (emp) => {
    setEditingId(emp.id || emp.loginId);
    setParentLoginId(emp.parentLoginId || "");
    setFormName(emp.name || "");
    setFormRole(standardTeams.includes(emp.role) ? emp.role : "Custom");
    setCustomRole(standardTeams.includes(emp.role) ? "" : emp.role);
    setFormCity(emp.city || "");
    setFormArea(emp.area || "");
    setFormPhone(emp.phone || "");
    setFormEmail(emp.email || "");
    setFormLoginId(emp.loginId || "");
    setFormPassword(emp.password || "");
    setFormPhoto(emp.photoDataUrl || "");
    setSelectedPerms(new Set(emp.permissions || []));
    setShowModal(true);
  };

  const closeEmployeeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setParentLoginId("");
  };

  const saveEmployee = async () => {
    const name = formName.trim();
    const role = formRole;
    const finalRole = role === "Custom" && customRole.trim() ? customRole.trim() : role;
    const city = formCity;
    const area = formArea;
    const areaCode = getLocalCode(city, area);
    const phone = formPhone.trim();
    const email = formEmail.trim();
    const loginId = formLoginId.trim().toUpperCase();
    const password = formPassword.trim();

    if (!name || !finalRole || !loginId) {
      alert("Fill Required Fields");
      return;
    }

    const activeEmployees = employees.filter((e) => (typeof e.isActive === "undefined" ? true : !!e.isActive));
    if (!editingId) {
      const duplicate = activeEmployees.find((e) => {
        const dupLogin = e.loginId && e.loginId.toUpperCase() === loginId;
        const dupEmail = email && e.email && e.email.toLowerCase() === email.toLowerCase();
        const dupPhone = phone && e.phone && e.phone === phone;
        return dupLogin || dupEmail || dupPhone;
      });
      if (duplicate) {
        const reasons = [];
        if (duplicate.loginId && duplicate.loginId.toUpperCase() === loginId) reasons.push(`Login ID "${loginId}" already exists`);
        if (email && duplicate.email && duplicate.email.toLowerCase() === email.toLowerCase()) reasons.push(`Email "${email}" already in use`);
        if (phone && duplicate.phone && duplicate.phone === phone) reasons.push(`Phone "${phone}" already in use`);
        alert(`Cannot create employee: ${reasons.join(" | ")}`);
        return;
      }
    }

    const desiredPrefix = `RY${areaCode || ""}`;
    let finalLoginId = loginId;
    if (!finalLoginId.startsWith(desiredPrefix)) {
      let attempt = 0;
      do {
        finalLoginId = `${desiredPrefix}${Math.floor(1000 + Math.random() * 9000)}`;
        attempt++;
      } while (attempt < 10 && employees.some((e) => e.loginId?.toUpperCase() === finalLoginId));
      setFormLoginId(finalLoginId);
    }

    const payload = {
      name,
      email,
      phone,
      password,
      role: finalRole,
      loginId: finalLoginId,
      area,
      areaCode,
      city,
      locationCode: areaCode,
      permissions: Array.from(selectedPerms),
      photoDataUrl: formPhoto || "",
      parentLoginId: parentLoginId || undefined
    };

    if (editingId) {
      try {
        const res = await fetch(`${apiUrl}/api/employees/${encodeURIComponent(finalLoginId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) console.warn("Employee update API returned", res.status);
      } catch (err) {
        console.warn("Employee update API failed:", err.message);
      }
      await syncEmployeesFromBackend();
      closeEmployeeModal();
      alert("Employee updated successfully!");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        await syncEmployeesFromBackend();
        closeEmployeeModal();

        try {
          const existingEmployees = JSON.parse(localStorage.getItem("roomhy_employees") || "[]");
          const filtered = existingEmployees.filter((e) => (e.loginId || "").toUpperCase() !== finalLoginId.toUpperCase());
          const newEmployee = {
            loginId: finalLoginId,
            password,
            name,
            email: email || "",
            phone: phone || "",
            role: finalRole,
            team: finalRole,
            area: area || "",
            areaName: area || "",
            areaCode: areaCode || "",
            permissions: Array.from(selectedPerms),
            createdAt: new Date().toISOString()
          };
          filtered.push(newEmployee);
          localStorage.setItem("roomhy_employees", JSON.stringify(filtered));
        } catch (_) {}

        setCredsData({ loginId: finalLoginId, password });
        setShowCredModal(true);

        const emailMeta = data?.email || {};
        if (email) {
          if (emailMeta.attempted && emailMeta.sent) {
            alert("Employee created successfully. Login credentials were sent to Gmail.");
          } else if (emailMeta.attempted && !emailMeta.sent) {
            alert(`Employee created successfully, but credential email failed: ${emailMeta.error || "Unknown email error"}`);
          } else {
            alert("Employee created successfully. Email was not attempted.");
          }
        }
      } else if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        const reason = data.error || data.message || "Duplicate record";
        const details = data.details || "";
        const fullMsg = details ? `${reason} (${details})` : reason;
        alert(`Employee not created\n\nReason: ${fullMsg}\n\nSolution: Use a different Login ID, Email, or Phone number`);
      } else {
        console.warn("Employee create API returned", res.status);
      }
    } catch (err) {
      console.warn("Employee create API failed:", err.message);
    }
  };

  const deleteEmployee = async (emp) => {
    if (!confirm("Delete?")) return;
    let backendDeleted = false;
    try {
      const res = await fetch(`${apiUrl}/api/employees/${encodeURIComponent(emp.loginId)}`, { method: "DELETE" });
      backendDeleted = res.ok || res.status === 404;
      if (!backendDeleted) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Delete failed with ${res.status}`);
      }
    } catch (err) {
      console.warn("Failed to delete employee on backend:", err.message);
    }
    if (backendDeleted || emp._synced === false) {
      removeEmployeeFromLocalCaches(emp.loginId);
      setEmployees((current) => current.filter((entry) => String(entry.loginId || "").toUpperCase() !== String(emp.loginId || "").toUpperCase()));
    }
    await syncEmployeesFromBackend();
  };

  const logoutEmployee = async (loginId) => {
    if (!confirm("Logout this employee and disable their login?")) return;
    try {
      await fetch(`${apiUrl}/api/employees/${encodeURIComponent(loginId)}/deactivate`, { method: "POST" });
    } catch (err) {
      console.warn("Failed to deactivate employee:", err.message);
    }
    await syncEmployeesFromBackend();
    alert("Employee logged out and disabled. Their login ID will not work.");
  };

  const reactivateEmployee = async (loginId) => {
    if (!confirm("Reactivate this employee?")) return;
    try {
      await fetch(`${apiUrl}/api/employees/${encodeURIComponent(loginId)}/reactivate`, { method: "POST" });
    } catch (err) {
      console.warn("Failed to reactivate employee:", err.message);
    }
    await syncEmployeesFromBackend();
    alert("Employee reactivated. Login will work now.");
  };

  return (
    <div className="html-page">
      <div className="flex h-screen overflow-hidden">
        <aside className={`sidebar w-72 flex-shrink-0 ${mobileOpen ? "flex" : "hidden"} md:flex flex-col z-20 overflow-y-auto custom-scrollbar fixed md:static inset-y-0 left-0 transform ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} transition-transform duration-300`}>
          <div className="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
            <div className="flex items-center gap-3">
              <div>
                <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
                <span className="text-[10px] text-gray-500">SUPER ADMIN</span>
              </div>
            </div>
          </div>
          <nav className="flex-1 py-6 space-y-1">
            {navSections.map((section) => (
              <div key={section.label}>
                <div className="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{section.label}</div>
                {section.items.map((item) => (
                  <a key={item.href} href={item.href} className={`sidebar-link ${item.key === "manager" ? "active" : ""}`}>
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
                <a href="/superadmin/rentcollection" className="sidebar-link text-sm hover:text-white">Rent Collections</a>
                <a href="/superadmin/platform" className="sidebar-link text-sm hover:text-white">Commissions</a>
                <a href="/superadmin/refund" className="sidebar-link text-sm hover:text-white">Refunds</a>
              </div>
            </div>
            <div className="mt-6 px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">System</div>
            <a href="/superadmin/location" className="sidebar-link"><i data-lucide="globe" className="w-5 h-5 mr-3"></i> Locations</a>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
          <header className="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center">
              <button className="md:hidden mr-4 text-slate-500" onClick={() => setMobileOpen(true)}><i data-lucide="menu" className="w-6 h-6"></i></button>
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                Team Management <span className="text-gray-400">/</span> <span id="currentTeamLabel" className="text-purple-600">{currentTeamLabel}</span>
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-8 h-8 rounded-full border border-slate-200 bg-purple-600 text-white flex items-center justify-center font-bold text-xs">SA</span>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Team Directory</h3>
                  <p className="text-sm text-gray-500">Manage employees, assign to Areas, and set permissions.</p>
                </div>
                <button onClick={openEmployeeModal} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors">
                  <i data-lucide="user-plus" className="w-5 h-5"></i> Add Employee
                </button>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center"><i data-lucide="map-pin" className="w-4 h-4 mr-2 text-purple-600"></i> Filter by Location</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Select City</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-purple-500"
                      value={filterCity}
                      onChange={(e) => {
                        setFilterCity(e.target.value);
                        setFilterArea("");
                      }}
                    >
                      <option value="">All Cities</option>
                      {cities.map((c) => (
                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Select Area</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-purple-500"
                      value={filterArea}
                      onChange={(e) => setFilterArea(e.target.value)}
                    >
                      <option value="">All Areas</option>
                      {areaOptions.map((a) => (
                        <option key={a.id || a.name} value={a.name}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div onClick={() => setCurrentTeam("All")} className={`team-card ${currentTeam === "All" ? "active" : ""} bg-white p-4 rounded-xl cursor-pointer text-center`} id="box-all">
                  <div className="icon-box w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors">
                    <i data-lucide="users" className="w-5 h-5"></i>
                  </div>
                  <p className="font-bold text-xs text-slate-700 uppercase">All Staff</p>
                  <p className="text-[10px] text-gray-500 mt-1">{counts.all}</p>
                </div>
                <div onClick={() => setCurrentTeam("Marketing Team")} className={`team-card ${currentTeam === "Marketing Team" ? "active" : ""} bg-white p-4 rounded-xl cursor-pointer text-center`} id="box-marketing">
                  <div className="icon-box w-10 h-10 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors">
                    <i data-lucide="megaphone" className="w-5 h-5"></i>
                  </div>
                  <p className="font-bold text-xs text-slate-700 uppercase">Marketing</p>
                  <p className="text-[10px] text-gray-500 mt-1">{counts.marketing}</p>
                </div>
                <div onClick={() => setCurrentTeam("Accounts Department")} className={`team-card ${currentTeam === "Accounts Department" ? "active" : ""} bg-white p-4 rounded-xl cursor-pointer text-center`} id="box-accounts">
                  <div className="icon-box w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors">
                    <i data-lucide="calculator" className="w-5 h-5"></i>
                  </div>
                  <p className="font-bold text-xs text-slate-700 uppercase">Accounts</p>
                  <p className="text-[10px] text-gray-500 mt-1">{counts.accounts}</p>
                </div>
                <div onClick={() => setCurrentTeam("Maintenance Team")} className={`team-card ${currentTeam === "Maintenance Team" ? "active" : ""} bg-white p-4 rounded-xl cursor-pointer text-center`} id="box-maintenance">
                  <div className="icon-box w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors">
                    <i data-lucide="hammer" className="w-5 h-5"></i>
                  </div>
                  <p className="font-bold text-xs text-slate-700 uppercase">Maintenance</p>
                  <p className="text-[10px] text-gray-500 mt-1">{counts.maintenance}</p>
                </div>
                <div onClick={() => setCurrentTeam("Customer Support")} className={`team-card ${currentTeam === "Customer Support" ? "active" : ""} bg-white p-4 rounded-xl cursor-pointer text-center`} id="box-support">
                  <div className="icon-box w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors">
                    <i data-lucide="headset" className="w-5 h-5"></i>
                  </div>
                  <p className="font-bold text-xs text-slate-700 uppercase">Support</p>
                  <p className="text-[10px] text-gray-500 mt-1">{counts.support}</p>
                </div>
                <div onClick={() => setCurrentTeam("Custom")} className={`team-card ${currentTeam === "Custom" ? "active" : ""} bg-white p-4 rounded-xl cursor-pointer text-center md:col-span-5 lg:col-span-1 lg:col-start-5`} id="box-custom">
                  <div className="icon-box w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors">
                    <i data-lucide="star" className="w-5 h-5"></i>
                  </div>
                  <p className="font-bold text-xs text-slate-700 uppercase">Custom / Other</p>
                  <p className="text-[10px] text-gray-500 mt-1">{counts.custom}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee Profile</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Login ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Manage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {loadingEmployees ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading employees...</td>
                        </tr>
                      ) : filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No employees found matching criteria.</td>
                        </tr>
                      ) : (
                        filteredEmployees.map((emp) => {
                          const active = typeof emp.isActive === "undefined" ? true : !!emp.isActive;
                          const initials = buildInitials(emp.name);
                          const color = avatarColors[(emp.loginId || "A").charCodeAt(0) % avatarColors.length];
                          return (
                            <tr key={emp.id || emp.loginId} className="hover:bg-gray-50 border-b border-gray-100">
                              <td className="px-6 py-4 flex items-center gap-3">
                                {emp.photoDataUrl ? (
                                  <img src={emp.photoDataUrl} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                                ) : (
                                  <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold`}>{initials}</div>
                                )}
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">
                                    {emp.name}
                                    {emp.parentLoginId ? <span className="text-xs text-gray-400"> (Reports to {emp.parentLoginId})</span> : null}
                                  </div>
                                  <div className="text-xs text-gray-500">{emp.phone}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4"><span className="bg-white border px-2 py-1 rounded text-xs font-semibold">{emp.role}</span></td>
                              <td className="px-6 py-4 text-sm text-gray-600">{emp.area || "-"}, <span className="text-xs text-gray-400">{emp.city || "-"}</span></td>
                              <td className="px-6 py-4">
                                <code className={`text-xs ${active ? "bg-purple-50 text-purple-700" : "bg-gray-100 text-gray-500"} px-2 py-1 rounded font-bold`}>{emp.loginId}</code>
                                {!active ? <div className="text-xs text-red-600 mt-1">Disabled</div> : null}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button onClick={() => openEditEmployee(emp)} className="p-1.5 text-gray-400 hover:text-purple-600" title="Edit"><i data-lucide="edit-2" className="w-4 h-4"></i></button>
                                <button onClick={() => { setCredsData({ loginId: emp.loginId, password: emp.password || "" }); setShowCredModal(true); }} className="p-1.5 text-gray-400 hover:text-blue-600" title="View Credentials"><i data-lucide="key" className="w-4 h-4"></i></button>
                                {active ? (
                                  <button onClick={() => logoutEmployee(emp.loginId)} className="p-1.5 text-gray-400 hover:text-red-600" title="Logout"><i data-lucide="log-out" className="w-4 h-4"></i></button>
                                ) : (
                                  <button onClick={() => reactivateEmployee(emp.loginId)} className="p-1.5 text-gray-400 hover:text-green-600" title="Reactivate"><i data-lucide="refresh-cw" className="w-4 h-4"></i></button>
                                )}
                                <button onClick={() => openSubEmployeeModal(emp.loginId)} className="p-1.5 text-gray-400 hover:text-indigo-600" title="Add Sub-employee"><i data-lucide="user-plus" className="w-4 h-4"></i></button>
                                <button onClick={() => deleteEmployee(emp)} className="p-1.5 text-gray-400 hover:text-red-600" title="Delete"><i data-lucide="trash-2" className="w-4 h-4"></i></button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {showModal ? (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{editingId ? "Edit Employee" : "Add Employee"}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {parentLoginId ? `Creating sub-employee under ${parentLoginId}` : editingId ? "Update employee details and assigned location." : "Create a new user with specific role and location access."}
                </p>
              </div>
              <button onClick={closeEmployeeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"><i data-lucide="x" className="w-5 h-5"></i></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              <section>
                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> Identity & Location
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Profile Photo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-purple-200 overflow-hidden">
                        {formPhoto ? <img src={formPhoto} className="w-full h-full object-cover" /> : <span>{buildInitials(formName)}</span>}
                      </div>
                      <div className="flex-1">
                        <input
                          ref={uploadRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload a photo or use initials. Recommended: 500x500px</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                    <input value={formName} onChange={(e) => setFormName(e.target.value)} type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Role / Department</label>
                    <select value={formRole} onChange={(e) => setFormRole(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-purple-500 bg-white">
                      <option value="Marketing Team">Marketing Team</option>
                      <option value="Accounts Department">Accounts Department</option>
                      <option value="Maintenance Team">Maintenance Team</option>
                      <option value="Customer Support">Customer Support</option>
                      <option value="Custom">Custom Role</option>
                    </select>
                    {formRole === "Custom" ? (
                      <input value={customRole} onChange={(e) => setCustomRole(e.target.value)} type="text" placeholder="Type custom role" className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-purple-500 bg-white" />
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Assigned City</label>
                    <select value={formCity} onChange={(e) => { setFormCity(e.target.value); setFormArea(""); }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-purple-500 bg-white">
                      <option value="">Select City</option>
                      {cities.map((c) => (
                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Assigned Area</label>
                    <select value={formArea} onChange={(e) => setFormArea(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-purple-500 bg-white">
                      <option value="">Select Area</option>
                      {modalAreaOptions.map((a) => (
                        <option key={a.id || a.name} value={a.name}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-purple-500" />
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> Credentials
                </h4>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-4 items-center">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-bold text-blue-800 mb-1">Login ID</label>
                    <div className="flex gap-2">
                      <input value={formLoginId} readOnly className="w-full bg-white border border-blue-200 rounded px-3 py-2 text-sm font-mono text-slate-700 font-bold" />
                      <button type="button" onClick={() => generateCreds(formCity, formArea)} className="text-blue-600 bg-white border border-blue-200 px-3 rounded hover:bg-blue-50"><i data-lucide="refresh-cw" className="w-4 h-4"></i></button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-bold text-blue-800 mb-1">Password</label>
                    <input value={formPassword} onChange={(e) => setFormPassword(e.target.value)} type="text" className="w-full bg-white border border-blue-200 rounded px-3 py-2 text-sm font-mono text-slate-700" />
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2 border-b pb-2">
                  <span className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span> Module Access
                </h4>
                <div className="flex justify-between items-end mb-3">
                  <p className="text-xs text-gray-500">These modules will appear in the employee's sidebar.</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={selectAllPerms} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-700">All</button>
                    <button type="button" onClick={clearPerms} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-700">None</button>
                  </div>
                </div>
                <div className="permission-grid">
                  {allPermissions.map((perm) => {
                    const selected = selectedPerms.has(perm.id);
                    return (
                      <div key={perm.id} className={`permission-item ${selected ? "selected" : ""}`} onClick={() => togglePerm(perm.id)}>
                        <div className={`w-4 h-4 border rounded bg-white flex-shrink-0 checkbox-ui ${selected ? "bg-purple-600" : ""}`}>
                          {selected ? <i data-lucide="check" className="w-3 h-3 text-white"></i> : null}
                        </div>
                        <span className="text-xs font-medium text-gray-700">{perm.label}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button onClick={closeEmployeeModal} className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors">Cancel</button>
              <button onClick={saveEmployee} className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 shadow-sm transition-colors flex items-center gap-2">
                <i data-lucide="save" className="w-4 h-4"></i> Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showCredModal ? (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"><i data-lucide="check-circle" className="w-6 h-6"></i></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Success!</h3>
            <div className="bg-gray-50 rounded-lg p-4 border text-left space-y-3">
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold">Login ID</label>
                <div className="flex justify-between">
                  <code className="text-sm font-mono font-bold select-all">{credsData.loginId}</code>
                </div>
              </div>
              <div className="border-t pt-2">
                <label className="text-xs text-gray-400 uppercase font-bold">Password</label>
                <div className="flex justify-between">
                  <code className="text-sm font-mono font-bold select-all">{credsData.password}</code>
                </div>
              </div>
            </div>
            <button onClick={() => setShowCredModal(false)} className="w-full mt-6 bg-slate-900 text-white py-2 rounded-lg text-sm">Done</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}


