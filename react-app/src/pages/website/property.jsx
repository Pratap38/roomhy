import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { getWebsiteApiUrl, getWebsiteUser, getWebsiteUserId, isWebsiteLoggedIn, logoutWebsite } from "../../utils/websiteSession";
import { addFavorite, isFavorite, loadFavorites, removeFavorite } from "../../utils/websiteFavorites";
import { useHeroSlideshow, useLucideIcons, useWebsiteCommon, useWebsiteMenu } from "../../utils/websiteUi";

export default function WebsiteProperty() {
  useWebsiteCommon();
  useWebsiteMenu();
  useHeroSlideshow(6000);

  const apiUrl = useMemo(() => getWebsiteApiUrl(), []);
  const [propertyData, setPropertyData] = useState(null);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showZoom, setShowZoom] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [approvedProperties, setApprovedProperties] = useState([]);
  const [bannerPhoto, setBannerPhoto] = useState("");
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBidInfoModal, setShowBidInfoModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareStatus, setShareStatus] = useState("Copy");

  // Auto-rotate gallery every 3 seconds
  useEffect(() => {
    if (galleryPhotos.length < 2) return;
    const timer = setInterval(() => {
      setGalleryIndex((prev) => (prev + 1) % galleryPhotos.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [galleryPhotos]);

  useLucideIcons([
    propertyData, galleryPhotos, galleryIndex, showZoom, showShare,
    showAuthModal, showGalleryModal, showPaymentModal, showBidInfoModal,
    showSignupModal, bannerPhoto, favorites
  ]);

  useEffect(() => { setFavorites(loadFavorites()); }, []);

  useEffect(() => {
    try {
      const photoData = localStorage.getItem("roomhy_website_photo") || "";
      if (photoData) setBannerPhoto(photoData);
    } catch { }
  }, []);

  useEffect(() => { setShareUrl(window.location.href); }, []);

  const normalizePhotoUrl = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item.trim();
    if (typeof item === "object")
      return String(item.secure_url || item.url || item.image || item.src || item.path || item.dataUrl || "").trim();
    return "";
  };

  const collectPhotosFromRecord = (record) => {
    if (!record || typeof record !== "object") return [];
    const buckets = [
      record.professionalPhotos, record.professional_photos, record.propertyPhotos,
      record.property_photos, record.photos, record.images, record.gallery,
      record.media && record.media.professionalPhotos, record.media && record.media.photos,
      record.propertyInfo && record.propertyInfo.professionalPhotos,
      record.propertyInfo && record.propertyInfo.propertyPhotos,
      record.propertyInfo && record.propertyInfo.photos
    ];
    const urls = [];
    buckets.forEach((bucket) => {
      if (Array.isArray(bucket)) {
        bucket.forEach((entry) => { const url = normalizePhotoUrl(entry); if (url) urls.push(url); });
      }
    });
    return urls;
  };

  const parseRatingValueSafe = (value) => {
    if (value === null || value === undefined) return null;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return Math.max(0, Math.min(5, numeric));
    const match = String(value).match(/(\d+(\.\d+)?)/);
    if (!match) return null;
    const parsed = Number(match[1]);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, Math.min(5, parsed));
  };

  const buildStarsDisplay = (value) => {
    const rating = parseRatingValueSafe(value);
    const stars = [];
    const full = rating === null ? 0 : Math.floor(rating);
    for (let i = 0; i < 5; i += 1) stars.push(i < full ? "\u2605" : "\u2606");
    return { rating, stars };
  };

  const matchesProperty = (record, propertyId) => {
    if (!propertyId) return true;
    const rid = String(propertyId);
    const ids = [
      record && record._id, record && record.id, record && record.visitId,
      record && record.propertyId, record && record.property_id, record && record.enquiry_id,
      record && record.propertyNumber,
      record && record.propertyInfo && record.propertyInfo.propertyId,
      record && record.propertyInfo && record.propertyInfo._id
    ].filter(Boolean).map((v) => String(v));
    return ids.includes(rid);
  };

  const hasUsefulLocationData = (record) => {
    if (!record || typeof record !== "object") return false;
    const info = record.propertyInfo || {};
    return Boolean(info.area || info.locality || info.city || info.cityName || record.area || record.locality || record.city || record.address);
  };

  useEffect(() => {
    let mounted = true;
    const loadProperty = async () => {
      const params = new URLSearchParams(window.location.search);
      const propertyId = params.get("id");
      let record = null;
      try {
        const currentProperty = JSON.parse(sessionStorage.getItem("currentProperty") || "null");
        if (currentProperty && matchesProperty(currentProperty, propertyId)) record = currentProperty;
      } catch { }
      if (!record || !hasUsefulLocationData(record)) {
        try {
          const response = await fetch(`${apiUrl}/api/approved-properties/public/approved`);
          if (response.ok) {
            const payload = await response.json();
            const records = Array.isArray(payload) ? payload
              : Array.isArray(payload?.properties) ? payload.properties
              : Array.isArray(payload?.visits) ? payload.visits
              : Array.isArray(payload?.data) ? payload.data : [];
            if (mounted) setApprovedProperties(records);
            const approvedRecord = records.find((item) => matchesProperty(item, propertyId)) || null;
            if (approvedRecord) record = approvedRecord;
          }
        } catch { }
      }
      if (!record) {
        try {
          const visits = JSON.parse(localStorage.getItem("roomhy_visits") || "[]");
          if (Array.isArray(visits)) record = visits.find((v) => matchesProperty(v, propertyId)) || null;
        } catch { }
      }
      if (!record) record = { propertyInfo: {}, title: "Property" };
      const photos = Array.from(new Set(collectPhotosFromRecord(record)));
      if (mounted) {
        setPropertyData(record);
        setGalleryPhotos(photos.length > 0 ? photos : []);
        setGalleryIndex(0);
        try { sessionStorage.setItem("currentProperty", JSON.stringify(record)); } catch { }
      }
    };
    loadProperty();
    return () => { mounted = false; };
  }, [apiUrl]);

  const normalized = useMemo(() => {
    const record = propertyData || {};
    const info = record.propertyInfo || {};
    const title = info.name || info.title || info.propertyName || record.property_name || record.title || "Property";
    const area = info.area || info.locality || record.locality || record.area || "";
    const city = info.city || info.cityName || record.city || record.location || "";
    const locationText = [area, city].filter(Boolean).join(", ") || info.address || record.address || "";
    const badge = info.propertyType || record.propertyType || record.property_type || "Listing";
    const rent = record.monthlyRent || record.rent || record.price || info.monthlyRent || info.rent || 0;
    const rating = record.rating || record.reviewsAvg || record.ratingScore || "4.5";
    const verified = !!record.isVerified || !!record.verified || !!record.generatedCredentials;
    const nearbyLocation = record.nearbyLocation || record.nearbyLocations || info.nearbyLocation || info.nearbyLocations || "";
    const amenities = Array.isArray(record.amenities) ? record.amenities : info.amenities || [];
    return { title, area, city, locationText, badge, rent, rating, verified, nearbyLocation, amenities };
  }, [propertyData]);

  const mapQuery = useMemo(() => {
    return [normalized.title, normalized.area, normalized.city, propertyData?.propertyInfo?.address, propertyData?.address].filter(Boolean).join(", ");
  }, [normalized.title, normalized.area, normalized.city, propertyData]);

  const recommendedProperties = useMemo(() => {
    const currentId = String(propertyData?._id || propertyData?.id || propertyData?.visitId || propertyData?.propertyId || propertyData?.propertyInfo?.propertyId || "");
    const targetArea = String(normalized.area || "").trim().toLowerCase();
    const targetCity = String(normalized.city || "").trim().toLowerCase();
    return approvedProperties.filter((item) => {
      const info = item?.propertyInfo || {};
      const itemId = String(item?._id || item?.id || item?.visitId || item?.propertyId || info.propertyId || "");
      if (currentId && itemId === currentId) return false;
      const itemArea = String(info.area || info.locality || item.area || item.locality || "").trim().toLowerCase();
      const itemCity = String(info.city || info.cityName || item.city || item.location || "").trim().toLowerCase();
      if (targetArea && itemArea) return itemArea === targetArea;
      if (targetCity && itemCity) return itemCity === targetCity;
      return false;
    }).slice(0, 8).map((item) => {
      const info = item?.propertyInfo || {};
      const photos = collectPhotosFromRecord(item);
      return {
        id: item?._id || item?.id || item?.visitId || item?.propertyId || info.propertyId,
        title: info.name || info.title || info.propertyName || item.property_name || item.title || "Property",
        area: info.area || info.locality || item.locality || item.area || "",
        city: info.city || info.cityName || item.city || item.location || "",
        type: info.propertyType || item.propertyType || item.property_type || "Listing",
        rent: item.monthlyRent || item.rent || item.price || info.monthlyRent || info.rent || 0,
        image: photos[0] || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop"
      };
    });
  }, [approvedProperties, normalized.area, normalized.city, propertyData]);

  const quickFacts = useMemo(() => {
    const record = propertyData || {};
    const info = record.propertyInfo || {};
    const facts = [];
    if (info.propertyId) facts.push({ label: "Property ID", value: info.propertyId });
    if (info.propertyType || record.propertyType) facts.push({ label: "Type", value: info.propertyType || record.propertyType });
    if (record.vacantRooms) facts.push({ label: "Vacant Rooms", value: record.vacantRooms });
    if (record.occupiedRooms) facts.push({ label: "Occupied Rooms", value: record.occupiedRooms });
    if (record.roomType) facts.push({ label: "Room Type", value: record.roomType });
    if (record.occupiedBeds) facts.push({ label: "Occupied Beds", value: record.occupiedBeds });
    if (record.bathroomType) facts.push({ label: "Bathroom", value: record.bathroomType });
    if (record.furnishing) facts.push({ label: "Furnishing", value: record.furnishing });
    if (record.ventilation) facts.push({ label: "Ventilation", value: record.ventilation });
    if (record.minStay) facts.push({ label: "Min Stay (months)", value: record.minStay });
    if (record.monthlyRent || record.rent || info.monthlyRent || info.rent)
      facts.push({ label: "Rent", value: `₹${record.monthlyRent || record.rent || info.monthlyRent || info.rent}` });
    if (record.deposit) facts.push({ label: "Deposit", value: `₹${record.deposit}` });
    if (facts.length === 0) {
      facts.push({ label: "Meals", value: "Included" });
      facts.push({ label: "Wi-Fi Speed", value: "100 Mbps" });
      facts.push({ label: "Security", value: "24/7 Guard" });
    }
    return facts;
  }, [propertyData]);

  const amenityList = useMemo(() => {
    if (!normalized.amenities || normalized.amenities.length === 0) return [];
    return normalized.amenities.map((a) => String(a || "").trim()).filter(Boolean);
  }, [normalized.amenities]);

  const studentRatingValue = useMemo(() => {
    const record = propertyData || {};
    const info = record.propertyInfo || {};
    return record.studentReviewsRating ?? record.studentRating ?? record.student_reviews_rating ?? info.studentReviewsRating ?? info.studentRating ?? record.rating ?? record.reviewsAvg ?? record.ratingScore ?? "4.5";
  }, [propertyData]);

  const employeeRatingValue = useMemo(() => {
    const record = propertyData || {};
    const info = record.propertyInfo || {};
    return record.employeeRating ?? record.professionalRating ?? record.employee_rating ?? info.employeeRating ?? info.professionalRating ?? record.rating ?? record.reviewsAvg ?? record.ratingScore ?? "4.5";
  }, [propertyData]);

  const studentRating = useMemo(() => buildStarsDisplay(studentRatingValue), [studentRatingValue]);
  const employeeRating = useMemo(() => buildStarsDisplay(employeeRatingValue), [employeeRatingValue]);
  const studentRatingComment = propertyData?.studentReviews || propertyData?.studentReviewComment || propertyData?.student_review_comment || "No student reviews available yet.";
  const employeeRatingComment = propertyData?.employeeRatingComment || propertyData?.employee_review_comment || "This property meets all premium living standards and quality benchmarks.";

  useEffect(() => {
    const el = (id) => document.getElementById(id);
    if (el("student-reviews-rating")) el("student-reviews-rating").textContent = studentRating.rating !== null ? studentRating.rating.toFixed(1) : "-";
    if (el("student-reviews-stars")) el("student-reviews-stars").innerHTML = studentRating.stars.map((s) => `<span>${s}</span>`).join("");
    if (el("student-reviews-comment")) el("student-reviews-comment").textContent = studentRatingComment;
    if (el("employee-rating-rating")) el("employee-rating-rating").textContent = employeeRating.rating !== null ? employeeRating.rating.toFixed(1) : "-";
    if (el("employee-rating-stars")) el("employee-rating-stars").innerHTML = employeeRating.stars.map((s) => `<span>${s}</span>`).join("");
    if (el("employee-rating-comment")) el("employee-rating-comment").textContent = employeeRatingComment;
  }, [studentRating, employeeRating, studentRatingComment, employeeRatingComment]);

  useEffect(() => {
    const iframe = document.getElementById("propertyMapIframe");
    if (iframe) {
      const query = mapQuery || normalized.locationText || normalized.title;
      iframe.setAttribute("src", `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`);
    }
    const nearbyEl = document.getElementById("whats-nearby-dynamic");
    if (nearbyEl) {
      const nearbyItems = String(normalized.nearbyLocation || "").trim()
        ? String(normalized.nearbyLocation).split(/[,|]/).map((i) => i.trim()).filter(Boolean).slice(0, 6)
        : [normalized.area || "Area not specified", normalized.city || "City not specified"];
      nearbyEl.innerHTML = nearbyItems.map((item) => `
        <div style="border-left:2px solid #000;padding-left:1rem;">
          <p style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#525252;margin-bottom:0.25rem;">Location</p>
          <p style="font-size:0.95rem;font-weight:600;color:#000;">${item}</p>
        </div>`).join("");
    }
    const recommendedEl = document.getElementById("recommended-slider");
    if (recommendedEl && recommendedProperties.length > 0) {
      recommendedEl.innerHTML = recommendedProperties.map((item) => `
        <a href="/website/property?id=${encodeURIComponent(String(item.id || ""))}" style="flex-shrink:0;width:280px;text-decoration:none;color:inherit;">
          <div style="border:1px solid #e5e7eb;overflow:hidden;background:#fff;">
            <img src="${item.image}" alt="${item.title}" style="width:100%;height:180px;object-fit:cover;" />
            <div style="padding:1rem;">
              <p style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#525252;margin-bottom:0.25rem;">${item.type}</p>
              <p style="font-size:1rem;font-weight:800;color:#000;margin-bottom:0.25rem;">${item.title}</p>
              <p style="font-size:0.85rem;color:#525252;margin-bottom:0.5rem;">${[item.area, item.city].filter(Boolean).join(", ") || "Location unavailable"}</p>
              <p style="font-size:1.1rem;font-weight:800;color:#000;">₹${Number(item.rent).toLocaleString("en-IN")}<span style="font-size:0.75rem;font-weight:400;color:#525252;"> / mo</span></p>
            </div>
          </div>
        </a>`).join("");
    }
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [mapQuery, normalized.locationText, normalized.title, normalized.nearbyLocation, normalized.area, normalized.city, recommendedProperties]);

  const isSaved = useMemo(() => {
    if (!propertyData) return false;
    const id = propertyData._id || propertyData.enquiry_id || propertyData.propertyId || propertyData.propertyInfo?.propertyId;
    return id ? isFavorite(id) : false;
  }, [propertyData, favorites]);

  const galleryPhotoAt = (offset) => {
    if (!galleryPhotos.length) return "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop";
    return galleryPhotos[(galleryIndex + offset) % galleryPhotos.length];
  };
  const activeGalleryImage = galleryPhotoAt(0);

  const resolvedOwnerId = propertyData?.generatedCredentials?.loginId || propertyData?.ownerLoginId || propertyData?.ownerId || propertyData?.owner_id || propertyData?.propertyInfo?.ownerId || propertyData?.propertyInfo?.generatedCredentials?.loginId || "";

  const handleFavoriteClick = () => {
    if (!propertyData) return;
    const id = propertyData._id || propertyData.enquiry_id || propertyData.propertyId || propertyData.propertyInfo?.propertyId;
    if (!id) return;
    if (isFavorite(id)) { removeFavorite(id); } else {
      addFavorite({ _id: id, enquiry_id: propertyData.enquiry_id, property_name: normalized.title, property_image: activeGalleryImage, city: normalized.city, location: normalized.city, locality: normalized.area, rent: normalized.rent, price: normalized.rent, property_type: normalized.badge, photos: galleryPhotos });
    }
    setFavorites(loadFavorites());
  };

  const handleRequest = () => {
    if (!isWebsiteLoggedIn()) { setShowAuthModal(true); return; }
    const enquiryRecord = { id: Date.now().toString(), type: "enquiry", studentId: getWebsiteUserId() || "unknown", studentName: getWebsiteUser()?.name || "Anonymous Tenant", studentEmail: getWebsiteUser()?.email || "Not provided", studentPhone: getWebsiteUser()?.phone || "Not provided", propertyId: propertyData?._id || propertyData?.propertyId || "unknown", propertyName: normalized.title, location: normalized.locationText, ts: new Date().toISOString(), status: "pending", paidAmount: 0 };
    const ownerId = resolvedOwnerId || "default_owner";
    const ownerEnquiries = JSON.parse(localStorage.getItem(`owner_enquiries_${ownerId}`) || "[]");
    ownerEnquiries.unshift(enquiryRecord);
    localStorage.setItem(`owner_enquiries_${ownerId}`, JSON.stringify(ownerEnquiries));
  };

  const formatInr = (value) => {
    if (value === null || value === undefined || value === "") return "₹0";
    const amount = Number(value);
    if (Number.isFinite(amount)) return `₹${amount.toLocaleString("en-IN")}`;
    const text = String(value).replace(/[^\d.]/g, "");
    const numeric = Number(text);
    if (Number.isFinite(numeric)) return `₹${numeric.toLocaleString("en-IN")}`;
    return `₹${value}`;
  };

  const shareLink = shareUrl || window.location.href;
  const handleNextImage = () => { if (!galleryPhotos.length) return; setGalleryIndex((p) => (p + 1) % galleryPhotos.length); };
  const handlePreviousImage = () => { if (!galleryPhotos.length) return; setGalleryIndex((p) => (p - 1 + galleryPhotos.length) % galleryPhotos.length); };
  const handleOpenZoom = () => { if (!galleryPhotos.length) return; setZoomLevel(1); setShowZoom(true); };
  const handleCloseZoom = () => { setShowZoom(false); setZoomLevel(1); };
  const handleShareOpen = () => { setShareStatus("Copy"); setShowShare(true); };
  const handleShareClose = () => setShowShare(false);
  const handleCopyShare = async () => {
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(shareLink); }
      else { const t = document.createElement("textarea"); t.value = shareLink; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
      setShareStatus("Copied!"); setTimeout(() => setShareStatus("Copy"), 2000);
    } catch { setShareStatus("Copy"); }
  };
  const handleLogout = () => logoutWebsite("signup");
  const handleAuthLogin = () => { setShowAuthModal(false); window.location.href = "/website/signup?mode=login"; };
  const handleAuthSignup = () => { setShowAuthModal(false); window.location.href = "/website/signup?mode=signup"; };
  const handleCloseSignupModal = () => setShowSignupModal(false);
  const handleSignupRedirect = () => { setShowSignupModal(false); window.location.href = "signup"; };
  const handleContinueAsGuest = () => setShowSignupModal(false);

  useHtmlPage({
    title: "Roomhy Property",
    bodyClass: "text-gray-800",
    htmlAttrs: { "lang": "en", "class": "scroll-smooth" },
    metas: [{ "charset": "UTF-8" }, { "name": "viewport", "content": "width=device-width, initial-scale=1.0" }, { "name": "referrer", "content": "no-referrer-when-downgrade" }],
    bases: [],
    links: [
      { "rel": "preconnect", "href": "https://fonts.googleapis.com" },
      { "rel": "preconnect", "href": "https://fonts.gstatic.com", "crossorigin": true },
      { "href": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap", "rel": "stylesheet" },
      { "rel": "stylesheet", "href": "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css", "crossorigin": "anonymous", "referrerpolicy": "no-referrer" },
      { "rel": "stylesheet", "href": "/website/assets/css/property.css" }
    ],
    styles: [],
    scripts: [{ "src": "https://cdn.tailwindcss.com" }, { "src": "https://unpkg.com/lucide@latest" }],
    inlineScripts: [],
  });

  // ─── Shared style tokens ─────────────────────────────────────────────────
  const divider = { borderBottom: "1px solid #e2e8f0", paddingBottom: "2rem", marginBottom: "2rem" };
  const sectionH2 = { fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#000", marginBottom: "1.5rem" };
  const infoLabel = { fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#525252" };
  const btnBlack = { display: "block", width: "100%", backgroundColor: "#000", color: "#fff", border: "none", padding: "1rem", fontWeight: 900, fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "-0.02em", cursor: "pointer", boxShadow: "4px 4px 0 0 rgba(0,0,0,1)", transition: "all 0.15s" };
  const btnOutline = { display: "inline-flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#fff", color: "#000", border: "1px solid #000", padding: "0.5rem 1rem", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.025em", cursor: "pointer" };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#fff", color: "#000" }}>

      {/* ── HEADER — 100% UNCHANGED ──────────────────────────────────────── */}
      <header className="sticky top-0 z-30 w-full bg-white/98 backdrop-blur-xl shadow-md border-b border-slate-200 flex-shrink-0">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/website/index" className="flex-shrink-0 hover:opacity-80 transition-opacity">
                <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-10 w-25" />
              </a>
              <div className="hidden md:block h-6 border-l border-gray-300"></div>
            </div>
            <div className="flex items-center gap-3 sm:gap-6">
              <a href="/website/list" className="flex-shrink-0 flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                <i data-lucide="plus-circle" className="w-4 h-4"></i>
                <span>Post <span className="hidden sm:inline">Your</span> Property</span>
              </a>
              <button id="menu-toggle" className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 hover:text-gray-900">
                <i data-lucide="menu" className="w-6 h-6"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MOBILE MENU — 100% UNCHANGED ─────────────────────────────────── */}
      <div id="menu-overlay" className="fixed inset-0 bg-black/50 z-40 hidden"></div>
      <div id="mobile-menu" className="fixed top-0 right-0 w-80 h-full bg-white z-50 shadow-xl transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col">
        <div className="flex justify-end p-4 flex-shrink-0">
          <button id="menu-close" className="p-2"><i data-lucide="x" className="w-6 h-6 text-gray-700"></i></button>
        </div>
        <div id="menu-logged-in" className="hidden flex flex-col h-full">
          <div className="flex justify-between items-center px-6 py-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                <i data-lucide="user" className="w-6 h-6 text-white"></i>
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-800" id="welcomeUserName">Hi, welcome</span>
                <p className="text-xs text-gray-500" id="userIdDisplay"></p>
              </div>
            </div>
            <a href="/website/profile" className="text-sm font-medium text-blue-600 hover:underline">Profile</a>
          </div>
          <div className="px-6 py-4">
            <div className="border border-blue-200 rounded-lg p-4">
              <p className="font-semibold text-gray-800 mb-3">Looking to Sell/Rent your Property?</p>
              <a href="/website/list" className="block text-center w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg text-sm transition-colors">Post Property for Free</a>
            </div>
          </div>
          <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
            {[
              { href: "/website/ourproperty", icon: "home", bg: "bg-blue-100", color: "text-blue-600", label: "Our Properties" },
              { href: "/website/fav", icon: "heart", bg: "bg-red-100", color: "text-red-600", label: "Favorites" },
              { href: "/website/mystays", icon: "building", bg: "bg-purple-100", color: "text-purple-600", label: "My Stays" },
              { href: "/website/about", icon: "info", bg: "bg-yellow-100", color: "text-yellow-600", label: "About Us" },
              { href: "/website/contact", icon: "phone", bg: "bg-cyan-100", color: "text-cyan-600", label: "Contact Us" },
              { href: "/website/websitechat", icon: "message-circle", bg: "bg-green-100", color: "text-green-600", label: "Chat" },
            ].map(({ href, icon, bg, color, label }) => (
              <a key={href} href={href} className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                  <i data-lucide={icon} className={`w-5 h-5 ${color}`}></i>
                </div>
                <span>{label}</span>
              </a>
            ))}
          </nav>
          <div className="p-4 border-t flex-shrink-0">
            <button onClick={handleLogout} className="w-full flex items-center space-x-4 p-3 rounded-lg text-red-600 hover:bg-red-50">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <i data-lucide="log-out" className="w-5 h-5 text-gray-600"></i>
              </div>
              <span>Logout</span>
            </button>
          </div>
        </div>
        <div id="menu-logged-out" className="flex flex-col h-full">
          <div className="flex-grow p-4 space-y-1 overflow-y-auto">
            <a href="/website/about" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <i data-lucide="info" className="w-5 h-5 text-yellow-600"></i>
              </div>
              <span>About Us</span>
            </a>
            <a href="/website/contact" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
              <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                <i data-lucide="phone" className="w-5 h-5 text-cyan-600"></i>
              </div>
              <span>Contact Us</span>
            </a>
          </div>
          <div className="p-4 space-y-3 border-t flex-shrink-0">
            <a href="/website/signup" className="block w-full text-center bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              <i data-lucide="log-in" className="w-4 h-4 inline mr-2"></i>Sign Up
            </a>
            <a href="/website/signup" className="block w-full text-center border-2 border-blue-600 text-blue-600 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
              <i data-lucide="user-plus" className="w-4 h-4 inline mr-2"></i>Sign Up
            </a>
          </div>
        </div>
      </div>

      {bannerPhoto && (
        <div style={{ width: "100%", background: "#f3f4f6" }}>
          <img src={bannerPhoto} alt="Banner" style={{ width: "100%", maxHeight: "24rem", objectFit: "cover" }} />
        </div>
      )}

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: "88rem", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* Back + Save/Share */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <a href="javascript:history.back()" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#000", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <i data-lucide="arrow-left" style={{ width: "1rem", height: "1rem" }}></i>Back to listings
          </a>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={handleFavoriteClick} style={btnOutline}>
              <i data-lucide="heart" style={{ width: "1rem", height: "1rem" }}></i>{isSaved ? "Saved" : "Save"}
            </button>
            <button onClick={handleShareOpen} style={btnOutline}>
              <i data-lucide="share-2" style={{ width: "1rem", height: "1rem" }}></i>Share
            </button>
          </div>
        </div>

        {/* Title + Location */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)", fontWeight: 900, letterSpacing: "-0.02em", textTransform: "uppercase", color: "#000", marginBottom: "0.5rem" }}>
            {normalized.title}
          </h1>
          <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#525252", fontWeight: 500, fontSize: "0.95rem" }}>
            <i data-lucide="map-pin" style={{ width: "1rem", height: "1rem" }}></i>
            {normalized.locationText || "Location unavailable"}
          </p>
        </div>

        {/* ── 4-GRID GALLERY ────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.75rem", marginBottom: "3rem" }}>
          {/* Big main image */}
          <div style={{ gridRow: "span 2", height: "500px", borderRadius: "8px", overflow: "hidden" }}>
            <img
              id="mainGalleryImage"
              src={activeGalleryImage}
              alt={normalized.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in", transition: "opacity 0.6s ease" }}
              onClick={handleOpenZoom}
            />
          </div>
          {/* Sub image 1 */}
          <div style={{ height: "246px", borderRadius: "8px", overflow: "hidden" }}>
            <img src={galleryPhotoAt(1)} alt="Gallery 2" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          {/* Sub image 2 with View All overlay */}
          <div
            style={{ height: "246px", borderRadius: "8px", overflow: "hidden", position: "relative", cursor: "pointer" }}
            onClick={handleOpenZoom}
            onMouseEnter={(e) => e.currentTarget.querySelector(".ov").style.background = "rgba(0,0,0,0.7)"}
            onMouseLeave={(e) => e.currentTarget.querySelector(".ov").style.background = "rgba(0,0,0,0.5)"}
          >
            <img src={galleryPhotoAt(2)} alt="Gallery 3" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div className="ov" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: "1rem", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center" }}>
                View All {galleryPhotos.length || ""} Photos
              </span>
            </div>
          </div>
          {/* Sub image 3 */}
          <div style={{ height: "246px", borderRadius: "8px", overflow: "hidden" }}>
            <img src={galleryPhotoAt(3)} alt="Gallery 4" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          {/* Sub image 4 */}
          <div style={{ height: "246px", borderRadius: "8px", overflow: "hidden" }}>
            <img src={galleryPhotoAt(4)} alt="Gallery 5" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>

        {/* ── ZOOM MODAL ────────────────────────────────────────────────── */}
        {showZoom && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
            <button onClick={handleCloseZoom} style={{ position: "absolute", top: "1rem", right: "1rem", color: "#fff", background: "none", border: "none", cursor: "pointer" }}>
              <i data-lucide="x" style={{ width: "2rem", height: "2rem" }}></i>
            </button>
            <img src={activeGalleryImage} alt="Zoomed" style={{ maxWidth: "56rem", maxHeight: "80vh", objectFit: "contain", borderRadius: "4px", transform: `scale(${zoomLevel})`, transformOrigin: "center", transition: "transform 0.2s" }} />
            <div style={{ position: "absolute", bottom: "5rem", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "0.5rem", background: "#1f2937", borderRadius: "9999px", padding: "0.5rem 1rem" }}>
              <button onClick={handlePreviousImage} style={{ color: "#fff", background: "none", border: "none", cursor: "pointer", padding: "0.5rem" }}>
                <i data-lucide="chevron-left" style={{ width: "1.25rem", height: "1.25rem" }}></i>
              </button>
              <span style={{ color: "#fff", fontSize: "0.875rem", fontWeight: 600, padding: "0.5rem 1rem" }}>{galleryPhotos.length ? galleryIndex + 1 : 0} / {galleryPhotos.length}</span>
              <button onClick={handleNextImage} style={{ color: "#fff", background: "none", border: "none", cursor: "pointer", padding: "0.5rem" }}>
                <i data-lucide="chevron-right" style={{ width: "1.25rem", height: "1.25rem" }}></i>
              </button>
            </div>
            <div style={{ position: "absolute", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "0.5rem" }}>
              {[{ l: "−", f: () => setZoomLevel(p => Math.max(1, p - 0.25)) }, { l: `${Math.round(zoomLevel * 100)}%`, f: null }, { l: "+", f: () => setZoomLevel(p => Math.min(4, p + 0.25)) }, { l: "Reset", f: () => setZoomLevel(1) }].map(({ l, f }) => (
                <button key={l} onClick={f || undefined} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: "4px", padding: "0.4rem 0.75rem", cursor: f ? "pointer" : "default", fontWeight: 600 }}>{l}</button>
              ))}
            </div>
          </div>
        )}

        {/* ── TWO-COLUMN LAYOUT ─────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: "4rem", alignItems: "start" }}>
          <div>

            {/* ABOUT PROPERTY */}
            <section style={divider}>
              <h2 style={sectionH2}>About Property</h2>
              <p style={{ fontSize: "1.05rem", lineHeight: 1.8, color: "#1a1a1a" }}>
                <strong style={{ color: "#000" }}>{normalized.title}</strong> is a well-maintained property with tenants currently living in the property. The property is located in the roots of the city and is completely available for Girls and is surrounded by all kinds of markets and transport facilities. This is a smart property and all the complaints and rent collection is done through the smart tenant app which is given to the tenant upon joining.
              </p>
            </section>

            {/* QUICK PROPERTY FACTS */}
            <section style={divider}>
              <h2 style={sectionH2}>Quick Property Facts</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "2rem 1.5rem" }}>
                {quickFacts.map((fact) => (
                  <div key={fact.label} style={{ borderLeft: "2px solid #000", paddingLeft: "1rem" }}>
                    <p style={infoLabel}>{fact.label}</p>
                    <p style={{ fontSize: "1.2rem", fontWeight: 800, color: "#000", marginTop: "0.25rem" }}>{fact.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* RATINGS */}
            <section style={divider}>
              <h2 style={sectionH2}>Ratings & Reviews</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                {[
                  { id: "student", label: "Student Rating", rId: "student-reviews-rating", sId: "student-reviews-stars", cId: "student-reviews-comment" },
                  { id: "employee", label: "Professional Assessment", rId: "employee-rating-rating", sId: "employee-rating-stars", cId: "employee-rating-comment" },
                ].map(({ id, label, rId, sId, cId }) => (
                  <div key={id} style={{ border: "1px solid #e5e7eb", padding: "1.5rem", background: "#fff" }}>
                    <p style={infoLabel}>{label}</p>
                    <p id={rId} style={{ fontSize: "3rem", fontWeight: 900, color: "#000", lineHeight: 1, marginTop: "0.5rem" }}>-</p>
                    <div id={sId} style={{ fontSize: "1.25rem", marginTop: "0.5rem", color: "#000" }}>☆☆☆☆☆</div>
                    <p id={cId} style={{ fontSize: "0.85rem", color: "#525252", marginTop: "1rem", borderTop: "1px solid #e5e7eb", paddingTop: "0.75rem", fontStyle: "italic" }}>Loading...</p>
                  </div>
                ))}
              </div>
            </section>

            {/* AMENITIES */}
            <section style={divider}>
              <h2 style={sectionH2}>Amenities</h2>
              {amenityList.length === 0 ? (
                <p style={{ color: "#525252" }}>No amenities listed.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
                  {amenityList.map((amenity) => (
                    <div key={amenity} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", border: "1px solid #e5e7eb", background: "#fff" }}>
                      <i data-lucide="check" style={{ width: "1rem", height: "1rem", color: "#000", flexShrink: 0 }}></i>
                      <span style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.025em", color: "#000" }}>{amenity}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* LOCATION MAPPING */}
            <section style={divider}>
              <h2 style={sectionH2}>Location Mapping</h2>
              <div style={{ width: "100%", height: "400px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                <iframe
                  id="propertyMapIframe"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15125.93170782271!2d73.7302436871582!3d18.597144800000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2bbc048041d6f%3A0x2c608fa4f67c696f!2sHinjawadi%2C%20Pune%2C%20Maharashtra%2C%20India!5e0!3m2!1sen!2sus!4v1730248835251!5m2!1sen!2sus"
                  width="100%" height="100%" style={{ border: 0 }}
                  allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Property Location Map"
                />
              </div>
              {normalized.nearbyLocation && (
                <div style={{ marginTop: "1.5rem" }}>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.075em", marginBottom: "1rem", color: "#000" }}>Nearby</h3>
                  <div id="whats-nearby-dynamic" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}></div>
                </div>
              )}
              {!normalized.nearbyLocation && <div id="whats-nearby-dynamic" style={{ display: "none" }}></div>}
            </section>

            {/* FAQs */}
            <section>
              <h2 style={sectionH2}>Essential Information & FAQs</h2>
              {[
                { q: "Are meals included in the rent?", a: "Yes, nutritious and professionally prepared meals (breakfast, lunch, and dinner) are included in the monthly rent. We also provide evening snacks and special dietary requirements can be accommodated upon request." },
                { q: "Is there a curfew time?", a: "For the safety and well-being of all residents, we maintain a professional curfew policy: 10:30 PM on weekdays and 11:00 PM on weekends. Exceptions can be made with prior approval from the warden." },
                { q: "Are guests allowed?", a: "Yes, guests are welcome in our designated common areas during professional visiting hours (9 AM to 9 PM). Overnight stays for guests are not permitted." },
              ].map(({ q, a }) => (
                <div key={q} style={{ borderLeft: "4px solid #000", padding: "1.25rem 1.5rem", background: "#fff", border: "1px solid #e5e7eb", marginBottom: "0.75rem" }}>
                  <p style={{ fontWeight: 800, fontSize: "1rem", color: "#000", marginBottom: "0.5rem" }}>{q}</p>
                  <p style={{ fontSize: "0.875rem", color: "#525252", lineHeight: 1.7 }}>{a}</p>
                </div>
              ))}
            </section>

          </div>

          {/* ── BOOKING SIDEBAR ───────────────────────────────────────────── */}
          <div style={{ position: "sticky", top: "6rem" }}>
            <div style={{ border: "2px solid #000", padding: "2rem", background: "#fff" }}>
              <p style={infoLabel}>Monthly Rent</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginTop: "0.5rem", marginBottom: "2rem" }}>
                <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "#000" }}>{formatInr(normalized.rent)}</span>
                <span style={{ color: "#525252", fontWeight: 700, textTransform: "uppercase", fontSize: "0.65rem" }}>/ per month</span>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleRequest(); }} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem", color: "#000" }}>Your Full Name</label>
                  <input type="text" id="visit-name" placeholder="Ex: John Doe" required
                    style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", outline: "none", fontWeight: 500, fontSize: "0.95rem", boxSizing: "border-box", fontFamily: "inherit" }}
                    onFocus={(e) => e.target.style.border = "1px solid #000"}
                    onBlur={(e) => e.target.style.border = "1px solid #d1d5db"}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem", color: "#000" }}>Email Address</label>
                  <input type="email" id="visit-email" placeholder="name@email.com" required
                    style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", outline: "none", fontWeight: 500, fontSize: "0.95rem", boxSizing: "border-box", fontFamily: "inherit" }}
                    onFocus={(e) => e.target.style.border = "1px solid #000"}
                    onBlur={(e) => e.target.style.border = "1px solid #d1d5db"}
                  />
                </div>
                <div style={{ background: "#f9fafb", padding: "1rem", fontSize: "0.82rem", fontWeight: 600, borderLeft: "4px solid #000" }}>
                  <p>✓ Minimum stay required: 3 months</p>
                  <p>✓ Zero brokerage guaranteed</p>
                </div>
                <button type="submit" style={btnBlack}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#262626"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translate(2px,2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#000"; e.currentTarget.style.boxShadow = "4px 4px 0 0 rgba(0,0,0,1)"; e.currentTarget.style.transform = "none"; }}>
                  Send Booking Request
                </button>
              </form>
              <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <i data-lucide="shield-check" style={{ width: "1rem", height: "1rem" }}></i>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#525252" }}>100% Verified Listing</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RECOMMENDED ──────────────────────────────────────────────────── */}
        <section style={{ marginTop: "5rem" }}>
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={sectionH2}>Recommended Properties</h2>
            <p style={{ color: "#525252", fontWeight: 500, fontSize: "0.95rem" }}>Verified properties in the same area</p>
          </div>
          <div id="recommended-slider" style={{ display: "flex", gap: "1.5rem", overflowX: "auto", paddingBottom: "1rem" }}>
            {[
              { id: 2, img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1916&auto=format&fit=crop", type: "Co-Living", name: "The Hive", loc: "Koramangala, BLR", price: "₹18,000" },
              { id: 3, img: "https://images.unsplash.com/photo-1567016432779-1fee749a1532?q=80&w=1974&auto=format&fit=crop", type: "Private Studio", name: "Campus Corner", loc: "North Campus, Delhi", price: "₹13,000" },
              { id: 6, img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop", type: "Co-Living", name: "Prime Student Living", loc: "Saket Nagar, Indore", price: "₹11,000" },
              { id: 4, img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1932&auto=format&fit=crop", type: "Apartment", name: "Modern Loft", loc: "Powai, Mumbai", price: "₹22,000" },
            ].map(({ id, img, type, name, loc, price }) => (
              <a key={id} href={`/website/property?id=${id}`} style={{ flexShrink: 0, width: "270px", textDecoration: "none", color: "inherit" }}>
                <div style={{ border: "1px solid #e5e7eb", overflow: "hidden", background: "#fff" }}>
                  <img src={img} alt={name} style={{ width: "100%", height: "175px", objectFit: "cover" }} />
                  <div style={{ padding: "1rem" }}>
                    <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#525252", marginBottom: "0.25rem" }}>{type}</p>
                    <p style={{ fontSize: "1rem", fontWeight: 800, color: "#000", marginBottom: "0.2rem" }}>{name}</p>
                    <p style={{ fontSize: "0.85rem", color: "#525252", marginBottom: "0.5rem" }}>{loc}</p>
                    <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "#000" }}>{price}<span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#525252" }}> / mo</span></p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

      </main>

      {/* ── FOOTER — 100% UNCHANGED ──────────────────────────────────────── */}
      <footer className="footer container mx-auto px-4 sm:px-6 mt-16">
        <div className="footer-main">
          <div className="footer-logo">
            <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-10 w-auto" />
            <p className="mt-4">Discover Your Next Home, Together. Zero Brokerage, Student-First Approach.</p>
          </div>
          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li><a href="/website/about">About Us</a></li>
              <li><a href="#featured">Featured Stays</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="/website/contact">Contact Us</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Top Cities</h4>
            <ul>
              <li><a href="/website/ourproperty?city=kota">Kota</a></li>
              <li><a href="/website/ourproperty?city=sikar">Sikar</a></li>
              <li><a href="/website/ourproperty?city=indore">Indore</a></li>
            </ul>
          </div>
          <div className="footer-contact">
            <h4>Support & Legal</h4>
            <div className="space-y-2">
              <p><i className="fas fa-phone"></i> +91 99830 05030</p>
              <p><i className="fas fa-envelope"></i> hello@roomhy.com</p>
            </div>
            <ul className="mt-4 space-y-1 text-sm">
              <li><a href="/website/terms">Terms & Conditions</a></li>
              <li><a href="/website/privacy">Privacy Policy</a></li>
            </ul>
          </div>
          <div className="footer-social lg:col-span-1">
            <a href="#" title="Facebook"><i className="fab fa-facebook-f"></i></a>
            <a href="#" title="X"><i className="fab fa-x-twitter"></i></a>
            <a href="#" title="Instagram"><i className="fab fa-instagram"></i></a>
            <a href="#" title="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 <strong>Roomhy</strong>. All Rights Reserved. Made for students, with love.</p>
        </div>
      </footer>

      {/* ── MODALS ───────────────────────────────────────────────────────── */}
      {showAuthModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }} onClick={() => setShowAuthModal(false)}>
          <div style={{ background: "#fff", padding: "2rem", maxWidth: "24rem", width: "100%", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.5rem", color: "#000" }}>Signup Required</h3>
            <p style={{ fontSize: "0.875rem", color: "#525252", marginBottom: "1.5rem" }}>You need an account to Request or Bid.</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button onClick={handleAuthLogin} style={{ padding: "0.75rem 1.5rem", background: "#000", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>Login</button>
              <button onClick={handleAuthSignup} style={{ padding: "0.75rem 1.5rem", background: "#000", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>Sign up</button>
            </div>
            <button onClick={() => setShowAuthModal(false)} style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#525252", background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {showShare && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }} onClick={handleShareClose}>
          <div style={{ background: "#fff", padding: "2rem", maxWidth: "28rem", width: "100%", border: "1px solid #e5e7eb" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#000" }}>Share this Property</h3>
              <button onClick={handleShareClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <i data-lucide="x" style={{ width: "1.5rem", height: "1.5rem" }}></i>
              </button>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", background: "#f9fafb", padding: "0.75rem", border: "1px solid #e5e7eb" }}>
              <input type="text" readOnly value={shareLink} style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.875rem", color: "#000", fontFamily: "inherit" }} />
              <button onClick={handleCopyShare} style={{ background: "#000", color: "#fff", border: "none", padding: "0.5rem 1rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{shareStatus}</button>
            </div>
          </div>
        </div>
      )}

      {showSignupModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }} onClick={handleCloseSignupModal}>
          <div style={{ background: "#fff", maxWidth: "28rem", width: "100%", padding: "2rem" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#000", marginBottom: "1rem" }}>Join Roomhy Community</h2>
            <p style={{ color: "#525252", marginBottom: "1.5rem", fontSize: "0.875rem" }}>Sign up now to unlock exclusive features and manage your bookings with ease!</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button onClick={handleSignupRedirect} style={btnBlack}>Sign Up Now</button>
              <button onClick={handleContinueAsGuest} style={{ ...btnOutline, justifyContent: "center", padding: "0.75rem", width: "100%", boxSizing: "border-box" }}>Continue as Guest</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
