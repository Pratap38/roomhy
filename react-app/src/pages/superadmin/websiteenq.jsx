import React, { useEffect, useMemo, useState } from "react";
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
      { href: "/superadmin/enquiry", icon: "help-circle", text: "Enquiries", key: "enquiry" },
      { href: "/superadmin/websiteenq", icon: "globe", text: "Web Enquiry", key: "websiteenq" },
      { href: "/superadmin/booking", icon: "calendar-check", text: "Bookings", key: "booking" },
      { href: "/superadmin/reviews", icon: "star", text: "Reviews", key: "reviews" },
      { href: "/superadmin/complaint-history", icon: "alert-circle", text: "Complaint History", key: "complaint-history" }
    ]
  }
];

export default function SuperadminWebsiteenq() {
  useHtmlPage({
    title: "Roomhy - Website Property Enquiries",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    bases: [],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: true },
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      },
      { rel: "stylesheet", href: "/superadmin/assets/css/websiteenq.css" }
    ],
    styles: [],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" }
    ],
    inlineScripts: []
  });

  const [enquiries, setEnquiries] = useState([]);
  const [managers, setManagers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [activeEnquiryId, setActiveEnquiryId] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const apiUrl = getApiUrl();

  useEffect(() => {
    window.lucide?.createIcons();
  }, [enquiries, showDetails, showAssign, mobileOpen]);

  useEffect(() => {
    loadEnquiries();
  }, []);

  const loadManagers = async (allEnquiries) => {
    let list = [];
    try {
      const res = await fetch(`${apiUrl}/api/website-enquiry/employees/marketing`);
      const result = await res.json();
      if (res.ok && result.success) {
        list = (result.employees || []).map((e) => ({
          id: e.loginId,
          loginId: e.loginId,
          name: e.name,
          email: e.email || "",
          phone: e.phone || "",
          role: e.role || "Marketing Team",
          area: e.area || e.locationCode || "Unassigned",
          city: e.city || ""
        }));
      }
    } catch (err) {
      console.warn("Failed to load marketing employees from backend:", err);
    }

    if (!list.length) {
      const cachedEmployees = JSON.parse(localStorage.getItem("roomhy_employees_cache") || "[]");
      list = cachedEmployees
        .filter((e) => (e.role || "").toLowerCase() === "marketing team")
        .map((e) => ({
          id: e.loginId || e.id,
          loginId: e.loginId || e.id,
          name: e.name,
          email: e.email || "",
          phone: e.phone || "",
          role: e.role || "Marketing Team",
          area: e.area || e.locationCode || "Unassigned",
          city: e.city || ""
        }));
    }

    setManagers(list);
    const cities = Array.from(new Set((allEnquiries || []).map((e) => e.city).filter(Boolean)));
    if (!cityFilter && cities.length > 0) setCityFilter("");
  };

  const loadEnquiries = async () => {
    let list = [];
    try {
      const response = await fetch(`${apiUrl}/api/website-enquiry/all`);
      const result = await response.json();
      if (result.success) {
        list = result.enquiries.map((e) => ({
          id: e.enquiry_id,
          property_type: e.property_type,
          property_name: e.property_name,
          city: e.city,
          locality: e.locality,
          address: e.address,
          pincode: e.pincode,
          description: e.description,
          amenities: e.amenities,
          gender_suitability: e.gender_suitability,
          rent: e.rent,
          deposit: e.deposit,
          owner_name: e.owner_name,
          owner_email: e.owner_email,
          owner_phone: e.owner_phone,
          contact_name: e.contact_name,
          country: e.country,
          tenants_managed: e.tenants_managed,
          additional_message: e.additional_message,
          status: e.status,
          assigned_to: e.assigned_to,
          assigned_to_loginId: e.assigned_to_loginId,
          assigned_email: e.assigned_email,
          assigned_area: e.assigned_area,
          notes: e.notes,
          created_at: e.created_at
        }));
      }
    } catch (error) {
      console.error("Error loading enquiries:", error);
      list = [
        {
          id: "sample_1",
          property_type: "pg",
          property_name: "Sample PG in Kota",
          city: "kota",
          locality: "North Campus",
          address: "123 Main Street",
          pincode: "324001",
          description: "Sample property for testing",
          amenities: ["WiFi", "AC"],
          gender_suitability: "male",
          rent: 5000,
          deposit: 10000,
          owner_name: "John Doe",
          owner_email: "john@example.com",
          owner_phone: "9876543210",
          status: "pending",
          assigned_to: null,
          assigned_area: null,
          notes: "",
          created_at: new Date().toISOString()
        },
        {
          id: "sample_2",
          property_type: "hostel",
          property_name: "Sample Hostel in Indore",
          city: "indore",
          locality: "City Center",
          address: "456 Hostel Lane",
          pincode: "452001",
          description: "Another sample property",
          amenities: ["Food", "Laundry"],
          gender_suitability: "female",
          rent: 4000,
          deposit: 8000,
          owner_name: "Jane Smith",
          owner_email: "jane@example.com",
          owner_phone: "9876543211",
          status: "assigned",
          assigned_to: "Rajesh Kumar",
          assigned_area: "Indore",
          notes: "Assigned for follow-up",
          created_at: new Date().toISOString()
        }
      ];
    }

    setEnquiries(list);
    loadManagers(list);
  };

  const filteredEnquiries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return enquiries.filter((e) => {
      const matchSearch = !term ||
        (e.property_name || "").toLowerCase().includes(term) ||
        (e.owner_name || "").toLowerCase().includes(term) ||
        (e.locality || "").toLowerCase().includes(term);
      const matchStatus = !statusFilter || e.status === statusFilter;
      const matchCity = !cityFilter || e.city === cityFilter;
      return matchSearch && matchStatus && matchCity;
    });
  }, [enquiries, searchTerm, statusFilter, cityFilter]);

  const grouped = useMemo(() => {
    const groups = {};
    filteredEnquiries.forEach((e) => {
      const key = e.city || "unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return groups;
  }, [filteredEnquiries]);

  const stats = useMemo(() => {
    const total = enquiries.length;
    const pending = enquiries.filter((e) => e.status === "pending").length;
    const assigned = enquiries.filter((e) => e.status === "assigned").length;
    const cities = new Set(enquiries.map((e) => e.city)).size;
    return { total, pending, assigned, cities };
  }, [enquiries]);

  const openDetails = (id) => {
    setActiveEnquiryId(id);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setActiveEnquiryId("");
  };

  const openAssign = (id) => {
    setActiveEnquiryId(id);
    setShowAssign(true);
  };

  const closeAssign = () => {
    setShowAssign(false);
    setActiveEnquiryId("");
    setSelectedManager("");
  };

  const confirmAssignment = async () => {
    if (!selectedManager) {
      alert("Please select an employee");
      return;
    }
    const enquiry = enquiries.find((e) => e.id === activeEnquiryId);
    const manager = managers.find((m) => String(m.loginId || m.id) === String(selectedManager));
    if (!enquiry || !manager) return;

    try {
      const response = await fetch(`${apiUrl}/api/website-enquiry/assign/${encodeURIComponent(activeEnquiryId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "assigned",
          assigned_to: manager.name,
          assigned_to_loginId: manager.loginId || manager.id,
          assigned_area: manager.area
        })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        closeAssign();
        await loadEnquiries();
        const mailMsg = result.email && result.email.attempted
          ? (result.email.sent ? " Employee email notification sent." : " Employee assigned, but email notification failed.")
          : " Employee has no email configured.";
        alert(`Assigned to ${manager.name} successfully!${mailMsg}`);
      } else {
        alert("Error assigning enquiry: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error assigning enquiry:", error);
      alert("Error assigning enquiry. Please try again.");
    }
  };

  const currentPage = "websiteenq";

  return (
    <div className="html-page">
      <div className={`fixed inset-0 bg-black/50 z-30 md:hidden ${mobileOpen ? "" : "hidden"}`} onClick={() => setMobileOpen(false)}></div>
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
          </nav>
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
          <header className="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center">
              <button className="md:hidden mr-4 text-slate-500" onClick={() => setMobileOpen(true)}><i data-lucide="menu" className="w-6 h-6"></i></button>
              <div className="flex items-center text-sm">
                <span className="text-slate-500 font-medium">Operations</span>
                <i data-lucide="chevron-right" className="w-4 h-4 mx-2 text-slate-400"></i>
                <span className="text-slate-800 font-semibold">Website Property Enquiries</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-slate-400 hover:text-slate-600"><i data-lucide="bell" className="w-5 h-5"></i></button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Property Enquiries from Website</h1>
                  <p className="text-sm text-slate-500 mt-1">Manage and assign property enquiries to area managers.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Enquiries</p>
                      <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                    </div>
                    <i data-lucide="inbox" className="w-8 h-8 text-blue-500"></i>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    </div>
                    <i data-lucide="clock" className="w-8 h-8 text-yellow-500"></i>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Assigned</p>
                      <p className="text-2xl font-bold text-green-600">{stats.assigned}</p>
                    </div>
                    <i data-lucide="check-circle" className="w-8 h-8 text-green-500"></i>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Cities</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.cities}</p>
                    </div>
                    <i data-lucide="map-pin" className="w-8 h-8 text-purple-500"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search property name, owner, locality..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                  </select>
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                  >
                    <option value="">All Cities</option>
                    {Array.from(new Set(enquiries.map((e) => e.city).filter(Boolean))).map((city) => (
                      <option key={city} value={city}>{city.charAt(0).toUpperCase() + city.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                {filteredEnquiries.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No enquiries found.</p>
                ) : (
                  Object.keys(grouped).sort().map((city) => (
                    <div key={city} className="area-section">
                      <div className="area-header">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <i data-lucide="map-pin" className="w-5 h-5"></i>
                          {city.charAt(0).toUpperCase() + city.slice(1)}
                        </h2>
                        <p className="text-sm opacity-90 mt-1">{grouped[city].length} enquiries</p>
                      </div>
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full data-table">
                          <thead>
                            <tr>
                              <th>Property</th>
                              <th>Owner</th>
                              <th>Locality</th>
                              <th>Type</th>
                              <th>Date</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {grouped[city].map((e) => (
                              <tr key={e.id}>
                                <td><strong>{e.property_name}</strong></td>
                                <td>{e.owner_name}</td>
                                <td>{e.locality || "-"}</td>
                                <td>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {(e.property_type || "Other").toUpperCase()}
                                  </span>
                                </td>
                                <td><small>{e.created_at ? new Date(e.created_at).toLocaleDateString() : "-"}</small></td>
                                <td>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${e.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                                    {e.status === "pending" ? "Pending" : `Assigned to ${e.assigned_to || "?"}`}
                                  </span>
                                </td>
                                <td>
                                  <div className="flex gap-2">
                                    <button onClick={() => openDetails(e.id)} className="text-blue-600 hover:text-blue-800 p-1" title="View Details">
                                      <i data-lucide="eye" className="w-4 h-4"></i>
                                    </button>
                                    {e.status === "pending" ? (
                                      <button onClick={() => openAssign(e.id)} className="text-purple-600 hover:text-purple-800 p-1" title="Assign">
                                        <i data-lucide="user-check" className="w-4 h-4"></i>
                                      </button>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
      {showDetails ? (
        <div className="modal fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Property Details</h2>
              <button onClick={closeDetails} className="text-gray-400 hover:text-gray-600"><i data-lucide="x" className="w-6 h-6"></i></button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const enquiry = enquiries.find((e) => e.id === activeEnquiryId);
                if (!enquiry) return <div className="text-gray-500">No details available.</div>;
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Property Name</p>
                        <p className="font-semibold">{enquiry.property_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Property Type</p>
                        <p className="font-semibold">{enquiry.property_type || "N/A"}</p>
                      </div>
                    </div>
                    <hr />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Owner Name</p>
                        <p className="font-semibold">{enquiry.owner_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Owner Email</p>
                        <p className="font-semibold">{enquiry.owner_email || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Owner Phone</p>
                        <p className="font-semibold">{enquiry.owner_phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Contact Name</p>
                        <p className="font-semibold">{enquiry.contact_name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Submitted Date</p>
                        <p className="font-semibold">{enquiry.created_at ? new Date(enquiry.created_at).toLocaleString() : "-"}</p>
                      </div>
                    </div>
                    <hr />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">City</p>
                        <p className="font-semibold">{(enquiry.city || "").toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Country</p>
                        <p className="font-semibold">{enquiry.country || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Locality</p>
                        <p className="font-semibold">{enquiry.locality || "N/A"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-600">Full Address</p>
                        <p className="font-semibold">{enquiry.address}, {enquiry.pincode}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Gender Suitability</p>
                        <p className="font-semibold capitalize">{enquiry.gender_suitability || "Any"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Starting Price</p>
                        <p className="font-semibold">{"\u20B9"}{(enquiry.rent || 0).toLocaleString()}/month</p>
                      </div>
                    </div>
                    <hr />
                    <div>
                      <p className="text-xs text-gray-600">Amenities</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(enquiry.amenities || []).map((a) => (
                          <span key={a} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{a}</span>
                        ))}
                      </div>
                    </div>
                    {enquiry.description ? (
                      <div>
                        <p className="text-xs text-gray-600">Description</p>
                        <p className="text-sm">{enquiry.description}</p>
                      </div>
                    ) : null}
                    <div>
                      <p className="text-xs text-gray-600">Tenants Managed</p>
                      <p className="text-sm">{enquiry.tenants_managed || 0}</p>
                    </div>
                    {enquiry.additional_message ? (
                      <div>
                        <p className="text-xs text-gray-600">Additional Message</p>
                        <p className="text-sm">{enquiry.additional_message}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ) : null}
      {showAssign ? (
        <div className="modal fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">Assign to Employee</h2>
              <button onClick={closeAssign} className="text-gray-400 hover:text-gray-600"><i data-lucide="x" className="w-6 h-6"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Employee</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                >
                  <option value="">Choose Employee...</option>
                  {managers.map((m) => (
                    <option key={m.loginId || m.id} value={m.loginId || m.id}>
                      {m.name} | {m.loginId || m.id} | {m.area || "-"} | {m.city || "-"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={confirmAssignment} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium">Assign</button>
                <button onClick={closeAssign} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


