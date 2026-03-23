import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";

const readStoredUser = () => {
  try {
    const raw =
      sessionStorage.getItem("manager_user") ||
      sessionStorage.getItem("user") ||
      localStorage.getItem("manager_user") ||
      localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

const normalizeVisit = (visit) => {
  const stableId = visit?.visitId || visit?._id || "";
  return {
    ...visit,
    _id: stableId,
    visitId: visit.visitId || stableId
  };
};

const pickFirstText = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
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
    user?.staffName,
    user?.fullName,
    user?.employeeName
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

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const watermarkDataUrl = (dataUrl, areaName, visitDate) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const text = `RoomHy | ${areaName || "Area"} | ${visitDate}`;
      const fontSize = Math.max(16, Math.floor(canvas.width / 40));
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textBaseline = "bottom";
      const padding = 10;
      const textWidth = ctx.measureText(text).width;
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(padding - 6, canvas.height - fontSize - padding - 6, textWidth + 12, fontSize + 12);
      ctx.fillStyle = "white";
      ctx.fillText(text, padding, canvas.height - padding);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });

export default function Visit() {
  useHtmlPage({
    title: "Roomhy - Visit Reports",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [{ charset: "UTF-8" }, { name: "viewport", content: "width=device-width, initial-scale=1.0" }],
    links: [
      { rel: "stylesheet", href: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
      { rel: "stylesheet", href: "/superadmin/assets/css/visit.css" }
    ],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" },
      { src: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js" }
    ],
    inlineScripts: []
  });

  const [user, setUser] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [geo, setGeo] = useState({ lat: "", lng: "" });
  const [fieldPhotos, setFieldPhotos] = useState([]);
  const [profPhotos, setProfPhotos] = useState([]);
  const [visitId, setVisitId] = useState("");
  const [visitDateDisplay, setVisitDateDisplay] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [locationCode, setLocationCode] = useState("");
  const [visitorsAllowed, setVisitorsAllowed] = useState("Yes");
  const [cookingAllowed, setCookingAllowed] = useState("Yes");
  const [smokingAllowed, setSmokingAllowed] = useState("No");
  const [petsAllowed, setPetsAllowed] = useState("No");
  const [cleanlinessRating, setCleanlinessRating] = useState("");
  const [ownerBehaviourPublic, setOwnerBehaviourPublic] = useState("");
  const [studentReviewsRating, setStudentReviewsRating] = useState("");
  const [employeeRating, setEmployeeRating] = useState("");
  const [captureGroups, setCaptureGroups] = useState({
    photo_building: [],
    photo_room: [],
    photo_bathroom: [],
    photo_bed: [],
    photo_extra: []
  });
  const [showProfModal, setShowProfModal] = useState(false);
  const [profPreview, setProfPreview] = useState([]);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState("");
  const [resolvedAreaName, setResolvedAreaName] = useState("");
  const [resolvedCityName, setResolvedCityName] = useState("");
  const [editingVisit, setEditingVisit] = useState(null);
  const [modalAreaName, setModalAreaName] = useState("");
  const [modalCityName, setModalCityName] = useState("");

  const staffName = user?.name || user?.staffName || user?.fullName || "Manager";
  const staffId = user?.loginId || user?.staffId || user?.id || user?._id || "";
  const areaName = modalAreaName || resolvedAreaName;

  const loadVisits = async () => {
    try {
      setErrorMsg("");
      const query = staffId || staffName ? `?staffId=${encodeURIComponent(staffId)}&staffName=${encodeURIComponent(staffName)}` : "";
      const data = await fetchJson(`/api/visits${query}`);
      const list = (data?.visits || data || [])
        .map(normalizeVisit)
        .filter((visit) => visitBelongsToEmployee(visit, user || { loginId: staffId, name: staffName }));
      setVisits(list);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err?.body || err?.message || "Failed to load visits");
    }
  };

  useEffect(() => {
    setUser(readStoredUser());
  }, []);

  useEffect(() => {
    let active = true;

    const resolveAssignedLocation = async () => {
      const directArea = pickFirstText(
        user?.areaName,
        user?.location,
        user?.area,
        user?.assignedArea,
        user?.locationName,
        user?.team,
        user?.city
      );
      const directCity = pickFirstText(
        user?.city,
        user?.cityName,
        user?.assignedCity
      );

      if (directArea || directCity) {
        if (!active) return;
        setResolvedAreaName(directArea);
        setResolvedCityName(directCity);
        setModalAreaName((current) => current || directArea);
        setModalCityName((current) => current || directCity);
        return;
      }

      const areaCode = pickFirstText(user?.areaCode, user?.locationCode);
      if (!areaCode) {
        if (!active) return;
        setResolvedAreaName("");
        setResolvedCityName("");
        return;
      }

      try {
        const data = await fetchJson("/api/locations/areas");
        const areas = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        const matchedArea = areas.find((area) => {
          const code = pickFirstText(area?.code, area?.areaCode, area?.locationCode, area?.pincode);
          return code && code.toLowerCase() === areaCode.toLowerCase();
        });

        if (!active) return;

        setResolvedAreaName(pickFirstText(matchedArea?.name, matchedArea?.areaName, directArea));
        setResolvedCityName(
          pickFirstText(
            matchedArea?.cityName,
            matchedArea?.city?.name,
            typeof matchedArea?.city === "string" ? matchedArea.city : "",
            directCity
          )
        );
      } catch (_) {
        if (!active) return;
        setResolvedAreaName(directArea);
        setResolvedCityName(directCity);
      }
    };

    resolveAssignedLocation();
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    loadVisits();
    const interval = setInterval(loadVisits, 15000);
    return () => clearInterval(interval);
  }, [staffId, staffName, user]);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [showModal, showProfModal, visits, captureGroups, profPhotos]);

  const generatePropertyId = () => {
    const id = `PROP${Date.now()}`;
    setPropertyId(id);
  };

  const resetModalDefaults = () => {
    const now = new Date();
    const newVisitId = `v_${Date.now()}`;
    setVisitId(newVisitId);
    setVisitDateDisplay(now.toLocaleString());
    generatePropertyId();
    setVisitorsAllowed("Yes");
    setCookingAllowed("Yes");
    setSmokingAllowed("No");
    setPetsAllowed("No");
    setCleanlinessRating("");
    setOwnerBehaviourPublic("");
    setStudentReviewsRating("");
    setEmployeeRating("");
    setCaptureGroups({
      photo_building: [],
      photo_room: [],
      photo_bathroom: [],
      photo_bed: [],
      photo_extra: []
    });
    setFieldPhotos([]);
    setProfPhotos([]);
    setProfPreview([]);
    setLocationCode(user?.areaCode || user?.locationCode || "");
    setEditingVisit(null);
    setModalAreaName(resolvedAreaName || "");
    setModalCityName(resolvedCityName || "");
  };

  const openModal = () => {
    resetModalDefaults();
    setShowModal(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGeo({ lat: "", lng: "" }),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }
  };

  const closeModal = () => setShowModal(false);

  const openEditModal = (visit) => {
    const record = normalizeVisit(visit);
    setEditingVisit(record);
    setVisitId(record.visitId || record._id || "");
    setVisitDateDisplay(record.visitDateDisplay || (record.submittedAt ? new Date(record.submittedAt).toLocaleString() : new Date().toLocaleString()));
    setPropertyId(record.propertyId || "");
    setLocationCode(record.locationCode || user?.areaCode || user?.locationCode || "");
    setVisitorsAllowed(record.visitorsAllowed === false ? "No" : "Yes");
    setCookingAllowed(record.cookingAllowed === false ? "No" : "Yes");
    setSmokingAllowed(record.smokingAllowed === true ? "Yes" : "No");
    setPetsAllowed(record.petsAllowed === true ? "Yes" : "No");
    setCleanlinessRating(String(record.cleanlinessRating || ""));
    setOwnerBehaviourPublic(record.ownerBehaviourPublic || "");
    setStudentReviewsRating(String(record.studentReviewsRating || ""));
    setEmployeeRating(String(record.employeeRating || ""));
    setCaptureGroups({
      photo_building: [],
      photo_room: [],
      photo_bathroom: [],
      photo_bed: [],
      photo_extra: []
    });
    setFieldPhotos(Array.isArray(record.photos) ? record.photos : []);
    setProfPhotos(Array.isArray(record.professionalPhotos) ? record.professionalPhotos : []);
    setProfPreview(Array.isArray(record.professionalPhotos) ? record.professionalPhotos : []);
    setGeo({ lat: record.latitude || "", lng: record.longitude || "" });
    setModalAreaName(record.area || record.areaLocality || record.propertyInfo?.area || resolvedAreaName || "");
    setModalCityName(record.city || record.propertyInfo?.city || resolvedCityName || "");
    setShowModal(true);
  };

  const deleteVisit = async (visit) => {
    const targetId = visit?.visitId || visit?._id;
    if (!targetId) return;
    if (!window.confirm("Delete this visit report?")) return;
    try {
      await fetchJson(`/api/visits/${encodeURIComponent(targetId)}`, { method: "DELETE" });
      await loadVisits();
    } catch (err) {
      window.alert(err?.body || err?.message || "Failed to delete visit");
    }
  };

  const addPropertyUnderOwner = async (visit) => {
    const ownerLoginId = String(
      visit?.generatedCredentials?.loginId ||
      visit?.propertyInfo?.ownerLoginId ||
      ""
    ).trim().toUpperCase();

    if (!ownerLoginId) {
      window.alert("Owner login ID is missing for this visit. Approve the visit first.");
      return;
    }

    const title = String(
      visit?.propertyInfo?.name ||
      visit?.propertyName ||
      ""
    ).trim();

    if (!title) {
      window.alert("Property name is missing for this visit.");
      return;
    }

    try {
      const payload = {
        title,
        address: visit?.address || visit?.propertyInfo?.address || "",
        locationCode: visit?.locationCode || visit?.propertyInfo?.locationCode || visit?.area || visit?.propertyInfo?.area || "",
        city: visit?.city || visit?.propertyInfo?.city || "",
        area: visit?.area || visit?.propertyInfo?.area || "",
        description: visit?.description || ""
      };

      await fetchJson(`/api/owners/${encodeURIComponent(ownerLoginId)}/properties`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      window.alert(`Property added under owner ${ownerLoginId}.`);
    } catch (err) {
      window.alert(err?.body || err?.message || "Failed to add property under owner.");
    }
  };

  const setToggleValue = (field, value) => {
    if (field === "visitorsAllowed") setVisitorsAllowed(value);
    if (field === "cookingAllowed") setCookingAllowed(value);
    if (field === "smokingAllowed") setSmokingAllowed(value);
    if (field === "petsAllowed") setPetsAllowed(value);
  };

  const handleStarClick = (value, field) => {
    if (field === "cleanlinessRating") setCleanlinessRating(String(value));
    if (field === "studentReviewsRating") setStudentReviewsRating(String(value));
    if (field === "employeeRating") setEmployeeRating(String(value));
  };

  const setOwnerBehaviour = (value) => setOwnerBehaviourPublic(value);

  const renderStars = (value, field) => (
    <div className="flex gap-1 text-2xl cursor-pointer">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={`${field}-${n}`}
          className={`star ${Number(value) >= n ? "text-yellow-400" : "text-gray-300"}`}
          onClick={() => handleStarClick(n, field)}
        >
          {Number(value) >= n ? "\u2605" : "\u2606"}
        </span>
      ))}
    </div>
  );

  const handleCapture = async (key, files) => {
    if (!files || files.length === 0) return;
    const limit = key === "photo_extra" ? 11 : 5;
    const existing = captureGroups[key] || [];
    const allowed = Array.from(files).slice(0, Math.max(0, limit - existing.length));
    const now = visitDateDisplay || new Date().toLocaleString();
    const watermarked = [];
    for (const file of allowed) {
      const dataUrl = await toDataUrl(file);
      const marked = await watermarkDataUrl(dataUrl, areaName, now);
      watermarked.push(marked);
    }
    setCaptureGroups((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), ...watermarked]
    }));
  };

  const triggerCapture = (inputId) => {
    const el = document.getElementById(inputId);
    if (el) el.click();
  };

  const openProfModal = () => {
    setShowProfModal(true);
    setProfPreview(profPhotos.slice());
  };

  const closeProfModal = () => {
    setShowProfModal(false);
    setProfPreview([]);
  };

  const handleProfInput = async (files) => {
    if (!files || files.length === 0) return;
    const existing = profPreview.slice();
    const remaining = 10 - existing.length;
    const toRead = Array.from(files).slice(0, remaining);
    const list = [];
    for (const file of toRead) {
      const dataUrl = await toDataUrl(file);
      list.push(dataUrl);
    }
    setProfPreview([...existing, ...list]);
  };

  const removeProfPhoto = (index) => {
    setProfPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const saveProfPhotos = () => {
    setProfPhotos(profPreview.slice());
    setShowProfModal(false);
  };

  const handleFieldPhotos = async (files) => {
    const list = [];
    const now = new Date().toLocaleString();
    for (const file of files) {
      const dataUrl = await toDataUrl(file);
      const watermarked = await watermarkDataUrl(dataUrl, areaName, now);
      list.push(watermarked);
    }
    setFieldPhotos(list);
  };

  const handleProfPhotos = async (files) => {
    const list = [];
    for (const file of files) {
      const dataUrl = await toDataUrl(file);
      list.push(dataUrl);
    }
    setProfPhotos(list);
  };

  const submitVisit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const visitIdValue = fd.get("visitId") || visitId || `v_${Date.now()}`;
    const visitDate = new Date().toLocaleString();
    const capturedPhotos = Object.values(captureGroups || {}).flat();
    const payload = {
      _id: visitIdValue,
      visitId: visitIdValue,
      submittedAt: new Date().toISOString(),
      staffName,
      staffId,
      propertyName: fd.get("name"),
      propertyType: fd.get("propertyType"),
      propertyId: fd.get("propertyId"),
      verifiedByCompany: fd.get("verifiedByCompany") || "true",
      locationCode: fd.get("locationCode") || locationCode,
      address: fd.get("address"),
      area: fd.get("area"),
      areaLocality: fd.get("areaLocality"),
      city: fd.get("city"),
      landmark: fd.get("landmark"),
      nearbyLocation: fd.get("nearbyLocation"),
      ownerName: fd.get("ownerName"),
      ownerEmail: fd.get("ownerEmail"),
      contactPhone: fd.get("contactPhone"),
      gender: fd.get("gender"),
      monthlyRent: Number(fd.get("monthlyRent") || 0),
      deposit: Number(fd.get("deposit") || 0),
      electricityCharges: Number(fd.get("electricityCharges") || 0),
      foodCharges: Number(fd.get("foodCharges") || 0),
      maintenanceCharges: Number(fd.get("maintenanceCharges") || 0),
      minStay: Number(fd.get("minStay") || 0),
      entryExit: fd.get("entryExit"),
      amenities: fd.getAll("amenities"),
      cleanlinessRating: Number(fd.get("cleanlinessRating") || cleanlinessRating || 0),
      ownerBehaviourPublic: fd.get("ownerBehaviourPublic") || ownerBehaviourPublic,
      studentReviewsRating: Number(fd.get("studentReviewsRating") || studentReviewsRating || 0),
      employeeRating: Number(fd.get("employeeRating") || employeeRating || 0),
      visitorsAllowed: fd.get("visitorsAllowed") || visitorsAllowed,
      cookingAllowed: fd.get("cookingAllowed") || cookingAllowed,
      smokingAllowed: fd.get("smokingAllowed") || smokingAllowed,
      petsAllowed: fd.get("petsAllowed") || petsAllowed,
      internalRemarks: fd.get("internalRemarks"),
      studentReviews: fd.get("studentReviews"),
      cleanlinessNote: fd.get("cleanlinessNote"),
      ownerBehaviour: fd.get("ownerBehaviour"),
      latitude: geo.lat || fd.get("latitude"),
      longitude: geo.lng || fd.get("longitude"),
      photos: capturedPhotos.length ? capturedPhotos : fieldPhotos,
      professionalPhotos: profPhotos,
      status: "submitted",
      visitDateDisplay: visitDate
    };

    try {
      if (editingVisit?.visitId || editingVisit?._id) {
        await fetchJson(`/api/visits/${encodeURIComponent(editingVisit.visitId || editingVisit._id)}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await fetchJson("/api/visits", { method: "POST", body: JSON.stringify(payload) });
      }
      setShowModal(false);
      setEditingVisit(null);
      await loadVisits();
      setSubmitSuccessMsg(editingVisit ? "Visit report updated successfully." : "Visit report submitted successfully.");
    } catch (err) {
      window.alert(err?.body || err?.message || `Failed to ${editingVisit ? "update" : "submit"} visit`);
    }
  };

  const viewMap = (visit) => {
    if (!visit?.latitude || !visit?.longitude) {
      window.alert("No geo coordinates available for this visit.");
      return;
    }
    const url = `https://www.google.com/maps?q=${visit.latitude},${visit.longitude}`;
    window.open(url, "_blank");
  };

  const rows = useMemo(() => visits, [visits]);

  return (
    <div className="html-page">
      <div className="flex h-screen overflow-hidden">
        <aside className="sidebar w-72 flex-shrink-0 hidden md:flex flex-col z-20 overflow-y-auto custom-scrollbar">
          <div className="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
            <div className="flex items-center gap-3">
              <div>
                <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
                <span className="text-[10px] text-gray-500">AREA ADMIN</span>
              </div>
            </div>
          </div>
          <nav className="flex-1 py-6 space-y-1">
            <div className="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Overview</div>
            <a href="/superadmin/areaadmin" className="sidebar-link">
              <i data-lucide="layout-dashboard" className="w-5 h-5 mr-3"></i> Dashboard
            </a>
            <div className="mt-6 px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Management</div>
            <a href="/superadmin/properties" className="sidebar-link">
              <i data-lucide="home" className="w-5 h-5 mr-3"></i> Properties
            </a>
            <a href="/superadmin/visit" className="sidebar-link active">
              <i data-lucide="clipboard-list" className="w-5 h-5 mr-3"></i> Visit Reports
            </a>
            <a href="/superadmin/tenant" className="sidebar-link">
              <i data-lucide="users" className="w-5 h-5 mr-3"></i> Tenants
            </a>
            <a href="/superadmin/owner" className="sidebar-link">
              <i data-lucide="briefcase" className="w-5 h-5 mr-3"></i> Owners
            </a>
            <div className="mt-6 px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Operations</div>
            <a href="/superadmin/rentcollection" className="sidebar-link">
              <i data-lucide="wallet" className="w-5 h-5 mr-3"></i> Payments
            </a>
            <a href="/superadmin/complaint-history" className="sidebar-link">
              <i data-lucide="alert-circle" className="w-5 h-5 mr-3"></i> Complaints & Maint.
            </a>
            <a href="/superadmin/kyc_verification" className="sidebar-link">
              <i data-lucide="file-check" className="w-5 h-5 mr-3"></i> KYC Verification
            </a>
            <a href="/superadmin/enquiry" className="sidebar-link">
              <i data-lucide="help-circle" className="w-5 h-5 mr-3"></i> Enquiries
            </a>
            <div className="mt-6 px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">System</div>
            <a href="/superadmin/location" className="sidebar-link">
              <i data-lucide="map-pin" className="w-5 h-5 mr-3"></i> RoomHy Location
            </a>
            <a href="/superadmin/platform_reports" className="sidebar-link">
              <i data-lucide="bar-chart-2" className="w-5 h-5 mr-3"></i> Reports
            </a>
            <a href="/superadmin/profile" className="sidebar-link">
              <i data-lucide="user" className="w-5 h-5 mr-3"></i> Profile
            </a>
            <a href="/superadmin/settings" className="sidebar-link">
              <i data-lucide="settings" className="w-5 h-5 mr-3"></i> Settings
            </a>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
          <header className="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center text-sm">
              <span className="text-slate-500 font-medium">Management</span>
              <i data-lucide="chevron-right" className="w-4 h-4 mx-2 text-slate-400"></i>
              <span className="text-slate-800 font-semibold">Visit Reports</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-slate-400 hover:text-slate-600" aria-label="Notifications">
                <i data-lucide="bell" className="w-5 h-5"></i>
              </button>
              <div className="relative group">
                <button className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-full transition-colors">
                  <img src="https://i.pravatar.cc/150?u=areaadmin" alt="Admin" className="w-8 h-8 rounded-full border border-slate-200" />
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-gray-700">{staffName || "Manager"}</p>
                    <p className="text-[10px] text-gray-500">Area Manager</p>
                  </div>
                  <i data-lucide="chevron-down" className="w-3 h-3 text-gray-400 hidden sm:block"></i>
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1600px] mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Visit Reports</h1>
                  <p className="text-sm text-slate-500">Submit new property visits for Super Admin approval.</p>
                </div>
                <button onClick={openModal} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition">
                  <i data-lucide="plus" className="w-4 h-4"></i> Add Property Visit
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse excel-table">
                    <thead>
                      <tr>
                        <th>Visit ID</th>
                        <th>Visit Date & Time</th>
                        <th>Staff Name</th>
                        <th>Staff ID</th>
                        <th>Property Name</th>
                        <th>Property Type</th>
                        <th>Full Address</th>
                        <th>Area / Locality</th>
                        <th>Nearby Location</th>
                        <th>Landmark</th>
                        <th>Owner Name</th>
                        <th>Owner Contact</th>
                        <th>Owner Gmail</th>
                        <th>Owner Login ID</th>
                        <th>Gender</th>
                        <th>Student Reviews</th>
                        <th>Employee Rating</th>
                        <th>Amenities</th>
                        <th>Cleanliness</th>
                        <th>Owner Behaviour</th>
                        <th>Photo Count</th>
                        <th>Professional Photo</th>
                        <th>Geo Status</th>
                        <th>Map</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && (
                        <tr>
                          <td colSpan={26} className="text-center py-8 text-gray-500">Loading...</td>
                        </tr>
                      )}
                      {!loading && errorMsg && (
                        <tr>
                          <td colSpan={26} className="text-center py-8 text-red-500">{errorMsg}</td>
                        </tr>
                      )}
                      {!loading && !errorMsg && rows.length === 0 && (
                        <tr>
                          <td colSpan={26} className="text-center py-8 text-gray-500">No visits found. Add one to start.</td>
                        </tr>
                      )}
                      {rows.map((visit) => {
                        const prop = visit.propertyInfo || {};
                        const photos = visit.photos || [];
                        const prof = visit.professionalPhotos || [];
                        const visitDateTime = new Date(visit.submittedAt || Date.now()).toLocaleString();
                        const statusText = visit.status || "submitted";
                        return (
                          <tr key={visit._id}>
                            <td className="text-xs font-mono">{visit._id}</td>
                            <td className="text-sm text-gray-600">{visitDateTime}</td>
                            <td className="text-sm text-gray-600">{visit.submittedBy || visit.staffName || "-"}</td>
                            <td className="text-sm text-gray-600">{visit.submittedById || visit.staffId || "-"}</td>
                            <td className="font-bold text-slate-700">{prop.name || visit.propertyName || "-"}</td>
                            <td className="text-sm text-gray-600">{prop.propertyType || visit.propertyType || "-"}</td>
                            <td className="text-sm text-gray-600">{visit.address || prop.address || "-"}</td>
                            <td className="text-sm text-gray-600">{prop.area || visit.area || "-"}</td>
                            <td className="text-sm text-gray-600">{visit.nearbyLocation || prop.nearbyLocation || "-"}</td>
                            <td className="text-sm text-gray-600">{visit.landmark || prop.landmark || "-"}</td>
                            <td className="text-sm text-gray-600">{prop.ownerName || visit.ownerName || "-"}</td>
                            <td className="text-sm text-gray-600">{prop.contactPhone || visit.contactPhone || "-"}</td>
                            <td className="text-sm text-gray-600">{prop.ownerEmail || visit.ownerEmail || "-"}</td>
                            <td className="text-xs font-mono text-blue-700">{visit.generatedCredentials?.loginId || prop.ownerLoginId || "-"}</td>
                            <td className="text-sm text-gray-600">{visit.gender || "-"}</td>
                            <td className="text-center">
                              <span className="text-lg font-bold text-amber-600">
                                {visit.studentReviewsRating
                                  ? `${"★".repeat(Math.floor(visit.studentReviewsRating))}${"☆".repeat(5 - Math.floor(visit.studentReviewsRating))}`
                                  : "-"}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="text-lg font-bold text-emerald-600">
                                {visit.employeeRating
                                  ? `${"★".repeat(Math.floor(visit.employeeRating))}${"☆".repeat(5 - Math.floor(visit.employeeRating))}`
                                  : "-"}
                              </span>
                            </td>
                            <td className="text-sm text-gray-600">{(visit.amenities || []).slice(0, 3).join(", ") || "-"}</td>
                            <td className="text-sm text-gray-600 text-center">{visit.cleanlinessRating || "-"}</td>
                            <td className="text-sm text-gray-600 text-center">{visit.ownerBehaviourPublic || "-"}</td>
                            <td className="text-center">{photos.length}</td>
                            <td className="text-center">
                              {prof.length > 0 ? (
                                <div className="inline-flex items-center gap-2">
                                  <img src={prof[0]} className="w-12 h-12 object-cover rounded-full border" alt="Professional" />
                                  <span className="text-xs text-gray-600">({prof.length})</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="text-center">{visit.latitude && visit.longitude ? "Verified" : "Not Verified"}</td>
                            <td className="text-center">
                              <button onClick={() => viewMap(visit)} className="text-slate-600 hover:bg-slate-50 p-1 rounded text-xs">
                                View Map
                              </button>
                            </td>
                            <td className="text-sm text-gray-600">{statusText}</td>
                            <td className="text-center">
                              <div className="inline-flex items-center gap-2 flex-wrap justify-center">
                                <button
                                  onClick={() => addPropertyUnderOwner(visit)}
                                  className="text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded text-xs font-medium border border-emerald-200"
                                >
                                  Add Property Under Owner
                                </button>
                                <button onClick={() => openEditModal(visit)} className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-medium">
                                  Edit
                                </button>
                                <button onClick={() => deleteVisit(visit)} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium">
                                  Delete
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
            </div>
          </main>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">{editingVisit ? "Edit Property Visit" : "New Property Visit"}</h3>
              <button onClick={closeModal} className="text-gray-400">
                <i data-lucide="x" className="w-5 h-5"></i>
              </button>
            </div>
            <form key={editingVisit?.visitId || editingVisit?._id || "new-visit"} className="space-y-4" onSubmit={submitVisit}>
              <input type="hidden" name="visitId" value={visitId} />
              <div className="grid grid-cols-3 gap-3">
                <input type="text" readOnly className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 cursor-not-allowed" value={visitDateDisplay} placeholder="Visit Date & Time" />
                <input type="text" name="staffName" readOnly className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 cursor-not-allowed" value={staffName} placeholder="Staff Name" />
                <input type="text" name="staffId" readOnly className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 cursor-not-allowed" value={staffId} placeholder="Staff ID" />
              </div>
              <input type="hidden" name="latitude" value={geo.lat} />
              <input type="hidden" name="longitude" value={geo.lng} />
              <input type="hidden" name="verifiedByCompany" value="true" />
              <input type="hidden" name="locationCode" value={locationCode} />

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input name="propertyId" type="text" readOnly className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50 cursor-not-allowed" value={propertyId} placeholder="Auto-generated Property ID" />
                  <button type="button" onClick={generatePropertyId} title="Regenerate ID" className="absolute right-1 top-1/2 -translate-y-1/2 bg-gray-100 px-2 py-1 rounded text-xs border" disabled={!!editingVisit}>
                    Regenerate
                  </button>
                </div>
                <select name="propertyType" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={editingVisit?.propertyType || "PG"}>
                  <option value="PG">PG</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Room">Room</option>
                  <option value="Flat">Flat</option>
                </select>
              </div>
              <input name="name" type="text" required defaultValue={editingVisit?.propertyName || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Property Name" />
              <textarea name="address" rows="2" required defaultValue={editingVisit?.address || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Full Address (Street, Area, City, Pin Code)"></textarea>
              <div className="grid grid-cols-3 gap-3">
                <input name="ownerName" type="text" required defaultValue={editingVisit?.ownerName || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Owner Name" />
                <input name="contactPhone" type="tel" required defaultValue={editingVisit?.contactPhone || editingVisit?.ownerPhone || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Owner Contact (full number)" />
                <input name="ownerEmail" type="email" required defaultValue={editingVisit?.ownerEmail || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Owner Gmail" />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <select name="gender" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" defaultValue={editingVisit?.gender || ""}>
                  <option value="">Select Gender Preference</option>
                  <option value="Male Only">Male Only</option>
                  <option value="Female Only">Female Only</option>
                  <option value="Co-Ed">Co-Ed</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input name="areaLocality" type="text" readOnly className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 cursor-not-allowed" placeholder="Area / Locality" value={areaName} />
                <input type="hidden" name="area" value={areaName} />
                <input type="hidden" name="city" value={modalCityName || resolvedCityName} />
                <input name="landmark" type="text" defaultValue={editingVisit?.landmark || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Nearby Landmark" />
                <input name="nearbyLocation" type="text" defaultValue={editingVisit?.nearbyLocation || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Nearby Location" />
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 border border-gray-200 rounded">
                {["Wi-Fi", "Drinking water", "Food", "Power backup", "Washing machine", "Parking", "CCTV"].map((a) => (
                  <label key={a} className="inline-flex items-center text-xs">
                    <input type="checkbox" name="amenities" value={a} className="mr-2" /> {a}
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <input name="monthlyRent" type="number" min="0" defaultValue={editingVisit?.monthlyRent || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Monthly Rent" />
                <input name="deposit" type="number" min="0" defaultValue={editingVisit?.deposit || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Deposit" />
                <input name="electricityCharges" type="number" min="0" defaultValue={editingVisit?.electricityCharges || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Electricity Charges" />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <input name="foodCharges" type="number" min="0" defaultValue={editingVisit?.foodCharges || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Food Charges" />
                <input name="maintenanceCharges" type="number" min="0" defaultValue={editingVisit?.maintenanceCharges || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Maintenance Charges" />
                <input name="minStay" type="number" min="0" defaultValue={editingVisit?.minStay || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Minimum Stay (months)" />
              </div>

              <div className="p-3 border border-gray-200 rounded">
                <div className="font-semibold mb-2">House Rules</div>
                <input name="entryExit" type="text" defaultValue={editingVisit?.entryExit || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3" placeholder="Entry / Exit timing" />
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "visitorsAllowed", label: "Visitors Allowed", value: visitorsAllowed, setter: setVisitorsAllowed },
                    { id: "cookingAllowed", label: "Cooking Allowed", value: cookingAllowed, setter: setCookingAllowed },
                    { id: "smokingAllowed", label: "Smoking Allowed", value: smokingAllowed, setter: setSmokingAllowed },
                    { id: "petsAllowed", label: "Pets Allowed", value: petsAllowed, setter: setPetsAllowed }
                  ].map((item) => (
                    <div key={item.id}>
                      <label className="text-xs font-medium text-gray-600 block mb-2">{item.label}</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setToggleValue(item.id, "Yes")}
                          className={`flex-1 py-2 px-3 rounded text-sm font-medium border-2 ${item.value === "Yes" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-300 text-gray-600"}`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setToggleValue(item.id, "No")}
                          className={`flex-1 py-2 px-3 rounded text-sm font-medium border-2 ${item.value === "No" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-300 text-gray-600"}`}
                        >
                          No
                        </button>
                      </div>
                      <input type="hidden" name={item.id} value={item.value} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 border border-gray-200 rounded">
                <div className="font-semibold mb-3">Staff Assessment</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-2">Cleanliness Rating</label>
                    {renderStars(cleanlinessRating, "cleanlinessRating")}
                    <input type="hidden" name="cleanlinessRating" value={cleanlinessRating} />
                    <p className="text-xs text-gray-500 mt-1">{cleanlinessRating ? `Rating: ${cleanlinessRating}/5 ★` : "Click to rate"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-2">Owner Behaviour</label>
                    <div className="flex gap-2 flex-wrap">
                      {["Good", "Average", "Poor"].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setOwnerBehaviour(val)}
                          className={`px-3 py-2 rounded text-xs font-medium border-2 ${
                            ownerBehaviourPublic === val
                              ? val === "Good"
                                ? "border-green-500 bg-green-50 text-green-700"
                                : val === "Average"
                                  ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                                  : "border-red-500 bg-red-50 text-red-700"
                              : "border-gray-300 text-gray-600"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                    <input type="hidden" name="ownerBehaviourPublic" value={ownerBehaviourPublic} />
                    <p className="text-xs text-gray-500 mt-1">{ownerBehaviourPublic ? `Selected: ${ownerBehaviourPublic}` : "Select behaviour"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-300">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-2">Student Reviews Rating (★)</label>
                    {renderStars(studentReviewsRating, "studentReviewsRating")}
                    <input type="hidden" name="studentReviewsRating" value={studentReviewsRating} />
                    <p className="text-xs text-gray-500 mt-1">{studentReviewsRating ? `Rating: ${studentReviewsRating}/5 ★` : "Click to rate"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-2">Employee Rating (★)</label>
                    {renderStars(employeeRating, "employeeRating")}
                    <input type="hidden" name="employeeRating" value={employeeRating} />
                    <p className="text-xs text-gray-500 mt-1">{employeeRating ? `Rating: ${employeeRating}/5 ★` : "Click to rate"}</p>
                  </div>
                </div>
              </div>
              <textarea name="studentReviews" rows="2" defaultValue={editingVisit?.studentReviews || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Student reviews feedback"></textarea>
              <textarea name="internalRemarks" rows="2" defaultValue={editingVisit?.internalRemarks || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Internal remarks (private)"></textarea>
              <textarea name="cleanlinessNote" rows="2" defaultValue={editingVisit?.cleanlinessNote || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Cleanliness note (private)"></textarea>
              <textarea name="ownerBehaviour" rows="2" defaultValue={editingVisit?.ownerBehaviour || ""} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Owner behaviour (private)"></textarea>

              <div className="p-3 border-2 border-purple-300 rounded bg-purple-50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full text-xs font-bold">1</span>
                  <h3 className="font-bold text-purple-900">Live Capture (Required)</h3>
                </div>
                <p className="text-xs text-purple-700 mb-3">Capture property details using your device camera (up to 5 photos per area)</p>

                {[
                  { key: "photo_building", label: "Building Front (required)" },
                  { key: "photo_room", label: "Room Interior (required)" },
                  { key: "photo_bathroom", label: "Bathroom (required)" },
                  { key: "photo_bed", label: "Bed / Interior (required)" }
                ].map((item) => {
                  const images = captureGroups[item.key] || [];
                  const last = images[images.length - 1];
                  return (
                    <div key={item.key} className="block text-xs border border-gray-200 rounded p-2 bg-white mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{item.label}</span>
                        <button type="button" onClick={() => triggerCapture(`capture_${item.key}`)} className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded">Capture</button>
                      </div>
                      <div className="w-full h-28 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400 mb-2 overflow-hidden">
                        {last ? <img src={last} className="w-full h-full object-cover" /> : "No photo"}
                      </div>
                      <div className="flex gap-1 overflow-x-auto" style={{ maxHeight: 40 }}>
                        {images.map((src, idx) => (
                          <img key={`${item.key}-${idx}`} src={src} className="w-10 h-10 object-cover rounded border" />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{images.length}/5 captures</p>
                      <input id={`capture_${item.key}`} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleCapture(item.key, e.target.files)} />
                    </div>
                  );
                })}

                <div className="mt-3">
                  <label className="block text-xs mb-1 font-medium text-gray-700">Additional Live Photos (optional, max 11)</label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => triggerCapture("capture_photo_extra")} className="text-xs px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">Capture Extra</button>
                    <div className="flex gap-2 overflow-x-auto" style={{ maxHeight: 72 }}>
                      {(captureGroups.photo_extra || []).map((src, idx) => (
                        <img key={`extra-${idx}`} src={src} className="w-16 h-16 object-cover rounded border" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{(captureGroups.photo_extra || []).length} selected</p>
                  <input id="capture_photo_extra" type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleCapture("photo_extra", e.target.files)} />
                </div>
              </div>

              <div className="p-3 border-2 border-blue-300 rounded bg-blue-50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">2</span>
                  <h3 className="font-bold text-blue-900">Professional Photos (From Gallery)</h3>
                </div>
                <p className="text-xs text-blue-700 mb-3">Upload high-quality professional photos from your device gallery (up to 10 photos)</p>
                <button type="button" onClick={openProfModal} className="w-full py-2 px-3 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2">
                  <i data-lucide="images" className="w-4 h-4"></i> Add Prof. Photos from Gallery
                </button>
                <div className="mt-3 p-2 bg-white border border-gray-200 rounded min-h-12 flex items-center justify-center">
                  {profPhotos.length > 0 ? (
                    <div className="flex gap-2 flex-wrap w-full">
                      {profPhotos.map((p, i) => (
                        <div key={`prof-${i}`} className="relative">
                          <img src={p} className="w-16 h-16 object-cover rounded border border-blue-300" />
                          <span className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No professional photos selected yet</p>
                  )}
                </div>
              </div>

              <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded text-sm font-medium hover:bg-purple-700">{editingVisit ? "Update Report" : "Submit Report"}</button>
            </form>
          </div>
        </div>
      )}

      {showProfModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[65]">
          <div className="bg-white rounded-lg w-full max-w-lg p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Upload Professional Photos (up to 10)</h3>
              <button onClick={closeProfModal} className="text-gray-600 px-2 py-1">Close</button>
            </div>
            <div className="space-y-3">
              <div className="w-full min-h-[88px] bg-gray-50 rounded overflow-hidden border border-gray-200 p-2 grid grid-cols-4 gap-2 items-start">
                {profPreview.length === 0 ? (
                  <div className="col-span-4 text-xs text-gray-400">No photos selected</div>
                ) : (
                  profPreview.map((src, i) => (
                    <div key={`preview-${i}`} className="relative w-full h-24 overflow-hidden rounded">
                      <img src={src} className="w-full h-full object-cover rounded" />
                      <button type="button" onClick={() => removeProfPhoto(i)} className="absolute top-1 right-1 bg-white/80 text-red-600 rounded-full p-1 text-xs">✕</button>
                    </div>
                  ))
                )}
              </div>
              <div className="text-center">
                <input type="file" accept="image/*" multiple onChange={(e) => handleProfInput(e.target.files)} className="mx-auto" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={saveProfPhotos} className="px-3 py-2 bg-blue-600 text-white rounded">Save Photos</button>
                <button type="button" onClick={closeProfModal} className="px-3 py-2 bg-gray-100 rounded">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {submitSuccessMsg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <i data-lucide="check-circle-2" className="w-8 h-8 text-green-600"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Report Submitted</h3>
            <p className="text-sm text-gray-600 mb-5">{submitSuccessMsg}</p>
            <button
              type="button"
              onClick={() => setSubmitSuccessMsg("")}
              className="w-full py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


