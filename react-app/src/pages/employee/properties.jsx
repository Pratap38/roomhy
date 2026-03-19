import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";

const API_BASES = ["https://api.roomhy.com", "http://localhost:5001"];

const getApiUrl = () =>
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : "https://api.roomhy.com";

const getStoredToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  sessionStorage.getItem("authToken") ||
  localStorage.getItem("jwt") ||
  sessionStorage.getItem("jwt") ||
  "";

const getAuthHeaders = (extraHeaders = {}) => {
  const token = getStoredToken();
  const headers = { ...extraHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export default function SuperadminProperties() {
  useHtmlPage({
    title: "Roomhy - All Properties",
    bodyClass: "text-slate-800",
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
      { rel: "stylesheet", href: "/superadmin/assets/css/properties.css" }
    ],
    styles: [],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" },
      { src: "https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js" }
    ],
    inlineScripts: []
  });

  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [galleryImages, setGalleryImages] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsMeta, setDetailsMeta] = useState({ ownerId: "", name: "", location: "" });
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [activeApiBase, setActiveApiBase] = useState(getApiUrl());

  useEffect(() => {
    const isPreview =
      window.location.protocol === "blob:" || window.location.href.includes("scf.usercontent");
    setDemoMode(isPreview);
  }, []);

  useEffect(() => {
    window.lucide?.createIcons();
  }, [properties, showGallery, showDetails, rooms, mobileOpen, financeOpen, settingsOpen]);

  const fetchFromAnyApi = async (path, options = {}) => {
    const attempts = [activeApiBase, ...API_BASES.filter((base) => base !== activeApiBase)];
    let lastError = null;

    for (const base of attempts) {
      try {
        const res = await fetch(`${base}${path}`, options);
        if (res.ok) {
          setActiveApiBase(base);
          return res;
        }
        if (res.status === 401 || res.status === 404) {
          lastError = new Error(`HTTP ${res.status} for ${path} at ${base}`);
          continue;
        }
        return res;
      } catch (err) {
        lastError = err;
      }
    }

    if (lastError) throw lastError;
    throw new Error(`API request failed: ${path}`);
  };

  const buildOwnerMap = (owners) => {
    const map = {};
    owners.forEach((owner) => {
      const loginId = (owner.loginId || owner.login_id || "").toUpperCase();
      if (!loginId) return;
      map[loginId] = {
        name: owner.name || owner.fullName || "-",
        email: owner.email || owner.gmail || "-",
        phone: owner.phone || owner.phoneNumber || "-",
        address: owner.address || "-",
        areaCode: owner.areaCode || owner.locationCode || "-"
      };
    });
    return map;
  };

  const enrichPropertyWithOwnerData = (property, ownerMap) => {
    const ownerLoginId = (property.ownerLoginId || "").toUpperCase();
    const ownerData = ownerMap[ownerLoginId] || {};
    return {
      ...property,
      ownerEmail: ownerData.email || property.ownerEmail || "-",
      ownerAddress: ownerData.address || property.ownerAddress || "-",
      areaCode: ownerData.areaCode || property.areaCode || property.locationCode || "-"
    };
  };

  const loadOwners = async () => {
    let owners = [];
    try {
      const res = await fetchFromAnyApi("/api/owners", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        owners = Array.isArray(data) ? data : data.data || data.owners || [];
      }
    } catch (err) {
      console.warn("Failed to fetch owners from backend:", err);
    }
    return Array.isArray(owners) ? owners : [];
  };

  const loadProperties = async () => {
    const owners = await loadOwners();
    const ownerMap = buildOwnerMap(owners);

    let props = [];

    try {
      if (getStoredToken()) {
        const res = await fetchFromAnyApi("/api/properties", {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.properties)) {
            props = data.properties
              .map((p) => ({
                id: p._id || p.id,
                title: p.title || p.name || p.propertyName || "Untitled",
                locationCode: p.locationCode || "-",
                address: p.address || "-",
                city: p.city || p.locationCity || "-",
                ownerName: p.owner ? p.owner.name || "-" : p.ownerName || "-",
                ownerPhone: p.owner ? p.owner.phone || "-" : p.ownerPhone || "-",
                ownerLoginId: p.owner ? p.owner.loginId || null : p.ownerLoginId || null,
                photos: p.photos || (p.image ? [p.image] : []),
                imageBase64: p.imageBase64 || null,
                status: p.status || "active"
              }))
              .map((p) => enrichPropertyWithOwnerData(p, ownerMap));
          }
        }
      }
    } catch (err) {
      console.warn("Failed to fetch properties from backend:", err);
    }

    try {
      let visits = [];
      try {
        const res = await fetchFromAnyApi("/api/visits", { headers: getAuthHeaders() });
        if (res.ok) visits = await res.json();
        if (visits && visits.visits) visits = visits.visits;
      } catch (_) {}

      if (!Array.isArray(visits) || visits.length === 0) {
        try {
          const adminRes = await fetchFromAnyApi("/api/admin/visits?status=approved", {
            headers: getAuthHeaders()
          });
          if (adminRes.ok) visits = await adminRes.json();
        } catch (_) {}
      }

      const visitProps = (Array.isArray(visits) ? visits : []).map((v) => ({
        id: v._id,
        title: v.propertyInfo ? v.propertyInfo.name : v.title || "Property",
        locationCode: v.propertyInfo ? v.propertyInfo.locationCode : v.locationCode || "NA",
        address: v.propertyInfo ? v.propertyInfo.address || "-" : v.address || "-",
        city: v.propertyInfo ? v.propertyInfo.city : v.city || "-",
        ownerName: v.propertyInfo ? v.propertyInfo.ownerName || "Unknown" : v.ownerName || "Unknown",
        ownerPhone: v.propertyInfo ? v.propertyInfo.contactPhone : v.ownerPhone,
        ownerLoginId: v.generatedCredentials ? v.generatedCredentials.loginId : v.ownerLoginId || null,
        photos: v.photos || (v.imageBase64 ? [v.imageBase64] : []),
        imageBase64: v.imageBase64,
        status: "active"
      }));

      visitProps.forEach((vp) => {
        const exists = props.find(
          (p) => (p.id && vp.id && p.id === vp.id) || (p.title === vp.title && p.locationCode === vp.locationCode)
        );
        if (!exists) props.push(enrichPropertyWithOwnerData(vp, ownerMap));
      });
    } catch (err) {
      console.warn("Failed to merge approved visits into properties:", err);
    }

    try {
      localStorage.setItem("roomhy_properties", JSON.stringify(props));
    } catch (e) {
      console.warn("Failed to cache roomhy_properties:", e);
    }

    setProperties(props);
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    const term = searchTerm.trim().toUpperCase();
    if (!term) return properties;
    return properties.filter((p) => {
      const title = (p.title || "").toUpperCase();
      const owner = `${p.ownerName || ""} ${p.ownerLoginId || ""}`.toUpperCase();
      return title.includes(term) || owner.includes(term);
    });
  }, [properties, searchTerm]);

  const groupedProperties = useMemo(() => {
    const groups = {};
    filteredProperties.forEach((p) => {
      const code = (p.locationCode || "NA").toUpperCase();
      if (!groups[code]) groups[code] = [];
      groups[code].push(p);
    });
    return groups;
  }, [filteredProperties]);

  const exportToExcel = () => {
    if (!window.XLSX) {
      alert("Excel export library not loaded.");
      return;
    }
    const rows = filteredProperties.map((p) => ({
      Property: p.title,
      Location: p.locationCode,
      Address: p.address,
      Owner: p.ownerName,
      Phone: p.ownerPhone,
      OwnerID: p.ownerLoginId,
      Status: "Active"
    }));
    if (!rows.length) {
      alert("No data to export.");
      return;
    }
    const ws = window.XLSX.utils.json_to_sheet(rows);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Properties");
    const date = new Date().toISOString().split("T")[0];
    window.XLSX.writeFile(wb, `Roomhy_Properties_${date}.xlsx`);
  };

  const openGallery = (photos) => {
    setGalleryImages(Array.isArray(photos) ? photos : []);
    setShowGallery(true);
  };

  const closeGallery = () => {
    setShowGallery(false);
    setGalleryImages([]);
  };

  const viewDetails = async (ownerId, propName, location) => {
    if (!ownerId) {
      alert("Owner ID not found for this property.");
      return;
    }
    setDetailsMeta({ ownerId, name: propName, location });
    setRoomsLoading(true);
    setShowDetails(true);

    let propRooms = [];
    try {
      const roomsRes = await fetchFromAnyApi(`/api/owners/${encodeURIComponent(ownerId)}/rooms`, {
        headers: getAuthHeaders()
      });
      if (roomsRes.ok) {
        const payload = await roomsRes.json();
        propRooms = payload.rooms || [];
      }
    } catch (_) {}

    if (!propRooms || propRooms.length === 0) {
      const allRooms = JSON.parse(localStorage.getItem("roomhy_rooms") || "[]");
      propRooms = allRooms.filter((r) => r.ownerId === ownerId || r.ownerLoginId === ownerId);
    }
    setRooms(Array.isArray(propRooms) ? propRooms : []);
    setRoomsLoading(false);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setRooms([]);
  };

  const deleteProperty = (id) => {
    if (!confirm("Are you sure? This will remove the property from the system.")) return;
    const visits = JSON.parse(localStorage.getItem("roomhy_visits") || "[]");
    const newVisits = visits.filter((v) => v._id !== id);
    localStorage.setItem("roomhy_visits", JSON.stringify(newVisits));
    loadProperties();
    alert("Property deleted.");
  };

  const currentPage = "properties";

  return (
    <div className="html-page">
      <div
        id="mobile-sidebar-overlay"
        className={`fixed inset-0 bg-black/50 z-30 md:hidden ${mobileOpen ? "" : "hidden"}`}
        onClick={() => setMobileOpen(false)}
      ></div>

      <div className="flex h-screen overflow-hidden">
        <aside className={`sidebar w-72 flex-shrink-0 ${mobileOpen ? "flex" : "hidden"} md:flex flex-col z-20 overflow-y-auto custom-scrollbar fixed md:static inset-y-0 left-0 transform ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} transition-transform duration-300`}>
          <div className="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
            <div className="flex items-center gap-3">
              <div>
                <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
                <span className="text-[10px] text-gray-500">SUPER ADMIN</span>
              </div>
            </div>
            <button className="md:hidden ml-auto p-2 text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>
              <i data-lucide="x" className="w-5 h-5"></i>
            </button>
          </div>
          <nav id="dynamicSidebarNav" className="flex-1 py-6 space-y-1"></nav>
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
          <header className="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center">
              <button className="md:hidden mr-4 text-slate-500" onClick={() => setMobileOpen(true)}>
                <i data-lucide="menu" className="w-6 h-6"></i>
              </button>
              <div className="flex items-center text-sm">
                <span className="text-slate-500 font-medium">Management</span>
                <i data-lucide="chevron-right" className="w-4 h-4 mx-2 text-slate-400"></i>
                <span className="text-slate-800 font-semibold">Properties</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {demoMode ? (
                <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">Demo Mode</div>
              ) : null}
              <button className="text-slate-400 hover:text-slate-600"><i data-lucide="bell" className="w-5 h-5"></i></button>
              <div className="relative group">
                <button className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-full transition-colors">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold text-xs">SP</div>
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Properties List</h1>
                  <p className="text-sm text-gray-500 mt-1">Manage all properties, view room details, and track occupancy.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <i data-lucide="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Search Name, Owner, Loc..."
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button onClick={exportToExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center shadow-sm">
                    <i data-lucide="sheet" className="w-4 h-4 mr-2"></i> Export
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse excel-table">
                    <thead>
                      <tr>
                        <th className="text-center w-16">Images</th>
                        <th>Property Name</th>
                        <th>Location Code</th>
                        <th>City</th>
                        <th>Address</th>
                        <th>Owner</th>
                        <th>Status</th>
                        <th className="text-right">Details</th>
                        <th className="text-center w-16">Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProperties.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-8 text-gray-500">No properties found. Approve visits in Enquiry page first.</td>
                        </tr>
                      ) : (
                        Object.keys(groupedProperties)
                          .sort()
                          .map((code) => (
                            <React.Fragment key={code}>
                              <tr className="bg-gray-50">
                                <td colSpan={9} className="font-bold text-slate-700 px-4 py-2 text-xs uppercase tracking-wider border-b border-gray-200">Zone: {code}</td>
                              </tr>
                              {groupedProperties[code].map((p) => {
                                const photos = [...(p.photos || [])];
                                if (p.imageBase64) photos.unshift(p.imageBase64);
                                return (
                                  <tr key={p.id || `${p.title}-${p.locationCode}`} className="hover:bg-gray-50 border-b border-gray-100">
                                    <td className="text-center align-middle py-3">
                                      {photos.length > 0 ? (
                                        <div className="relative group cursor-pointer w-10 h-10 mx-auto" onClick={() => openGallery(photos)}>
                                          <img src={photos[0]} className="w-full h-full rounded object-cover border border-gray-200 shadow-sm" />
                                          <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-[9px] font-bold">+{photos.length}</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400 mx-auto">
                                          <i data-lucide="image-off" className="w-4 h-4"></i>
                                        </div>
                                      )}
                                    </td>
                                    <td className="font-medium text-slate-800">{p.title}</td>
                                    <td><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-mono font-bold">{p.locationCode}</span></td>
                                    <td className="text-sm text-gray-600">{p.city}</td>
                                    <td className="text-sm text-gray-600 max-w-xs truncate" title={p.address}>{p.address}</td>
                                    <td className="text-sm text-gray-600">
                                      <div className="font-medium text-gray-900">{p.ownerName}</div>
                                      <div className="text-xs text-gray-400">{p.ownerLoginId || "-"}</div>
                                    </td>
                                    <td>
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Active</span>
                                    </td>
                                    <td className="text-right">
                                      <button onClick={() => viewDetails(p.ownerLoginId, p.title, p.locationCode)} className="text-purple-600 hover:text-purple-800 text-xs font-medium border border-purple-200 px-3 py-1.5 rounded hover:bg-purple-50 transition-colors">
                                        View Details
                                      </button>
                                    </td>
                                    <td className="text-center">
                                      <button onClick={() => deleteProperty(p.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition-colors" title="Delete">
                                        <i data-lucide="trash-2" className="w-4 h-4"></i>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {showGallery ? (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] backdrop-blur-sm" onClick={closeGallery}>
          <div className="relative w-full max-w-4xl p-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeGallery} className="absolute -top-10 right-0 text-white hover:text-gray-300"><i data-lucide="x" className="w-8 h-8"></i></button>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[80vh] overflow-y-auto">
              {galleryImages.length > 0 ? galleryImages.map((src, idx) => (
                <img key={`${src}-${idx}`} src={src} className="w-full h-48 object-cover rounded-lg border border-gray-600 shadow-lg hover:scale-105 transition-transform" />
              )) : (
                <p className="text-white text-center py-20">No images available for this section.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {showDetails ? (
        <div className="modal fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-0 h-[85vh] flex flex-col overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <i data-lucide="building-2" className="w-5 h-5 text-purple-600"></i>
                  <span>{detailsMeta.name}</span>
                </h3>
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">Owner: {detailsMeta.ownerId}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-xs">{detailsMeta.location}</span>
                </p>
              </div>
              <button onClick={closeDetails} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-full hover:bg-red-50 transition-colors">
                <i data-lucide="x" className="w-6 h-6"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-100 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {roomsLoading ? (
                  <div className="col-span-2 text-center text-gray-500 py-12">Loading rooms...</div>
                ) : rooms.length === 0 ? (
                  <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="bg-gray-50 p-4 rounded-full mb-3"><i data-lucide="bed-double" className="w-8 h-8 text-gray-400"></i></div>
                    <h3 className="text-gray-800 font-medium">No Rooms Configured</h3>
                    <p className="text-gray-500 text-sm mt-1">The owner hasn't added any rooms to this property yet.</p>
                  </div>
                ) : (
                  rooms.map((room) => {
                    const beds = room.beds || [];
                    const totalBeds = beds.length;
                    const occupied = beds.filter((b) => b.tenant || b.tenantName || b.status === "occupied").length;
                    const percent = totalBeds > 0 ? (occupied / totalBeds) * 100 : 0;
                    const barColor = percent === 100 ? "bg-red-500" : percent > 50 ? "bg-yellow-500" : "bg-green-500";

                    return (
                      <div key={room.id || room.number} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
                        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-800 text-lg">Room {room.number}</h4>
                              <span className="px-2 py-0.5 bg-white border text-xs rounded text-gray-500 font-medium">{room.type}</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1 font-medium">Rent: <span className="text-slate-800">{"\u20B9"}{room.rent}</span></p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Occupancy</div>
                            <div className={`text-sm font-bold ${percent === 100 ? "text-red-600" : "text-green-600"}`}>{occupied}/{totalBeds}</div>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100">
                          <div className={`h-full ${barColor}`} style={{ width: `${percent}%` }}></div>
                        </div>
                        <div className="p-4 flex-1 bg-slate-50/50">
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-wider">Bed Configuration & Tenants</h5>
                          {beds.length > 0 ? beds.map((bed, idx) => {
                            const isOccupied = bed.status === "occupied" || !!bed.tenantName || !!bed.tenant;
                            return (
                              <div key={`${room.number}-${idx}`} className="flex items-center justify-between p-2.5 border rounded-md mb-2 bg-white shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-600 font-bold text-xs border border-gray-200">B{idx + 1}</div>
                                  <div className="text-sm">
                                    {isOccupied ? (
                                      <div>
                                        <p className="text-red-700 font-bold text-xs flex items-center"><i data-lucide="user" className="w-3 h-3 mr-1"></i> {bed.tenantName || bed.tenant?.name || "Unknown"}</p>
                                        <p className="text-gray-500 text-[10px]">{bed.tenantPhone || bed.tenant?.phone || "-"}</p>
                                      </div>
                                    ) : (
                                      <span className="text-green-700 font-bold text-xs">Vacant</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }) : (
                            <p className="text-xs text-gray-400 italic p-2">No beds added to this room.</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white px-6 py-3 border-t border-gray-200 flex justify-end flex-shrink-0">
              <button onClick={closeDetails} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}




