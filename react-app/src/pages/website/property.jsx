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

  useLucideIcons([
    propertyData,
    galleryPhotos,
    galleryIndex,
    showZoom,
    showShare,
    showAuthModal,
    showGalleryModal,
    showPaymentModal,
    showBidInfoModal,
    showSignupModal,
    bannerPhoto,
    favorites
  ]);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    try {
      const photoData = localStorage.getItem("roomhy_website_photo") || "";
      if (photoData) {
        setBannerPhoto(photoData);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  const normalizePhotoUrl = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item.trim();
    if (typeof item === "object") {
      return String(item.secure_url || item.url || item.image || item.src || item.path || item.dataUrl || "").trim();
    }
    return "";
  };

  const collectPhotosFromRecord = (record) => {
    if (!record || typeof record !== "object") return [];
    const buckets = [
      record.professionalPhotos,
      record.professional_photos,
      record.propertyPhotos,
      record.property_photos,
      record.photos,
      record.images,
      record.gallery,
      record.media && record.media.professionalPhotos,
      record.media && record.media.photos,
      record.propertyInfo && record.propertyInfo.professionalPhotos,
      record.propertyInfo && record.propertyInfo.propertyPhotos,
      record.propertyInfo && record.propertyInfo.photos
    ];
    const urls = [];
    buckets.forEach((bucket) => {
      if (Array.isArray(bucket)) {
        bucket.forEach((entry) => {
          const url = normalizePhotoUrl(entry);
          if (url) urls.push(url);
        });
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
    for (let i = 0; i < 5; i += 1) {
      stars.push(i < full ? "\u2605" : "\u2606");
    }
    return { rating, stars };
  };

  const buildStarsSafe = (value) => {
    const rating = parseRatingValueSafe(value);
    const stars = [];
    const full = rating === null ? 0 : Math.floor(rating);
    for (let i = 0; i < 5; i += 1) {
      stars.push(i < full ? "â˜…" : "â˜†");
    }
    return { rating, stars };
  };

  const matchesProperty = (record, propertyId) => {
    if (!propertyId) return true;
    const rid = String(propertyId);
    const ids = [
      record && record._id,
      record && record.id,
      record && record.visitId,
      record && record.propertyId,
      record && record.property_id,
      record && record.enquiry_id,
      record && record.propertyNumber,
      record && record.propertyInfo && record.propertyInfo.propertyId,
      record && record.propertyInfo && record.propertyInfo._id
    ]
      .filter(Boolean)
      .map((value) => String(value));
    return ids.includes(rid);
  };

  const hasUsefulLocationData = (record) => {
    if (!record || typeof record !== "object") return false;
    const info = record.propertyInfo || {};
    return Boolean(
      info.area ||
      info.locality ||
      info.city ||
      info.cityName ||
      record.area ||
      record.locality ||
      record.city ||
      record.address
    );
  };

  useEffect(() => {
    let mounted = true;
    const loadProperty = async () => {
      const params = new URLSearchParams(window.location.search);
      const propertyId = params.get("id");
      let record = null;

      try {
        const currentProperty = JSON.parse(sessionStorage.getItem("currentProperty") || "null");
        if (currentProperty && matchesProperty(currentProperty, propertyId)) {
          record = currentProperty;
        }
      } catch {
        // ignore
      }

      if (!record || !hasUsefulLocationData(record)) {
        try {
          const response = await fetch(`${apiUrl}/api/approved-properties/public/approved`);
          if (response.ok) {
            const payload = await response.json();
            const records = Array.isArray(payload)
              ? payload
              : Array.isArray(payload?.properties)
                ? payload.properties
                : Array.isArray(payload?.visits)
                  ? payload.visits
                : Array.isArray(payload?.data)
                  ? payload.data
                  : [];
            if (mounted) setApprovedProperties(records);
            const approvedRecord = records.find((item) => matchesProperty(item, propertyId)) || null;
            if (approvedRecord) {
              record = approvedRecord;
            }
          }
        } catch {
          // ignore
        }
      }

      if (!record) {
        try {
          const visits = JSON.parse(localStorage.getItem("roomhy_visits") || "[]");
          if (Array.isArray(visits)) {
            record = visits.find((visit) => matchesProperty(visit, propertyId)) || null;
          }
        } catch {
          // ignore
        }
      }

      if (!record) {
        record = { propertyInfo: {}, title: "Property" };
      }

      const photos = Array.from(new Set(collectPhotosFromRecord(record)));
      if (mounted) {
        setPropertyData(record);
        setGalleryPhotos(photos.length > 0 ? photos : []);
        setGalleryIndex(0);
        try {
          sessionStorage.setItem("currentProperty", JSON.stringify(record));
        } catch {
          // ignore
        }
      }
    };
    loadProperty();
    return () => {
      mounted = false;
    };
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
    const nearbyLocation =
      record.nearbyLocation ||
      record.nearbyLocations ||
      info.nearbyLocation ||
      info.nearbyLocations ||
      "";
    const amenities = Array.isArray(record.amenities) ? record.amenities : info.amenities || [];
    return {
      title,
      area,
      city,
      locationText,
      badge,
      rent,
      rating,
      verified,
      nearbyLocation,
      amenities
    };
  }, [propertyData]);

  const mapQuery = useMemo(() => {
    const parts = [
      normalized.title,
      normalized.area,
      normalized.city,
      propertyData?.propertyInfo?.address,
      propertyData?.address
    ].filter(Boolean);
    return parts.join(", ");
  }, [normalized.title, normalized.area, normalized.city, propertyData]);

  const recommendedProperties = useMemo(() => {
    const currentId = String(
      propertyData?._id ||
      propertyData?.id ||
      propertyData?.visitId ||
      propertyData?.propertyId ||
      propertyData?.propertyInfo?.propertyId ||
      ""
    );
    const targetArea = String(normalized.area || "").trim().toLowerCase();
    const targetCity = String(normalized.city || "").trim().toLowerCase();

    return approvedProperties
      .filter((item) => {
        const info = item?.propertyInfo || {};
        const itemId = String(item?._id || item?.id || item?.visitId || item?.propertyId || info.propertyId || "");
        if (currentId && itemId === currentId) return false;
        const itemArea = String(info.area || info.locality || item.area || item.locality || "").trim().toLowerCase();
        const itemCity = String(info.city || info.cityName || item.city || item.location || "").trim().toLowerCase();
        if (targetArea && itemArea) return itemArea === targetArea;
        if (targetCity && itemCity) return itemCity === targetCity;
        return false;
      })
      .slice(0, 8)
      .map((item) => {
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
    if (info.propertyId) facts.push({ label: "Property ID", value: info.propertyId, icon: "hash", color: "blue" });
    if (info.propertyType || record.propertyType) facts.push({ label: "Type", value: info.propertyType || record.propertyType, icon: "home", color: "blue" });
    if (record.roomsAvailable) facts.push({ label: "Rooms", value: record.roomsAvailable, icon: "door-open", color: "purple" });
    if (record.roomType) facts.push({ label: "Room Type", value: record.roomType, icon: "door-open", color: "purple" });
    if (record.bedCount) facts.push({ label: "Beds", value: record.bedCount, icon: "bed-double", color: "green" });
    if (record.bathroomType) facts.push({ label: "Bathroom", value: record.bathroomType, icon: "droplet", color: "cyan" });
    if (record.furnishing) facts.push({ label: "Furnishing", value: record.furnishing, icon: "sofa", color: "yellow" });
    if (record.ventilation) facts.push({ label: "Ventilation", value: record.ventilation, icon: "wind", color: "cyan" });
    if (record.minStay) facts.push({ label: "Min Stay (months)", value: record.minStay, icon: "calendar", color: "indigo" });
    if (record.monthlyRent || record.rent || info.monthlyRent || info.rent) {
      const rent = record.monthlyRent || record.rent || info.monthlyRent || info.rent;
      facts.push({ label: "Rent", value: `₹${rent}`, icon: "wallet", color: "green" });
    }
    if (record.deposit) facts.push({ label: "Deposit", value: `₹${record.deposit}`, icon: "lock", color: "orange" });
    return facts;
  }, [propertyData]);

  const amenityCards = useMemo(() => {
    if (!normalized.amenities || normalized.amenities.length === 0) return [];
    return normalized.amenities.map((amenity) => {
      const name = String(amenity || "").trim();
      const lower = name.toLowerCase();
      let icon = "check";
      let color = "blue";
      if (lower.includes("wifi")) {
        icon = "wifi";
        color = "blue";
      } else if (lower.includes("air") || lower.includes("ac")) {
        icon = "wind";
        color = "cyan";
      } else if (lower.includes("tv")) {
        icon = "tv";
        color = "purple";
      } else if (lower.includes("laundry") || lower.includes("washing")) {
        icon = "washing-machine";
        color = "pink";
      } else if (lower.includes("parking")) {
        icon = "car";
        color = "indigo";
      } else if (lower.includes("power") || lower.includes("backup")) {
        icon = "plug-zap";
        color = "violet";
      } else if (lower.includes("house") || lower.includes("housekeeping")) {
        icon = "sparkles";
        color = "yellow";
      } else if (lower.includes("fridge") || lower.includes("refrigerator")) {
        icon = "box";
        color = "orange";
      } else if (lower.includes("gaming") || lower.includes("game")) {
        icon = "gamepad-2";
        color = "green";
      } else if (lower.includes("security") || lower.includes("cctv")) {
        icon = "shield-check";
        color = "red";
      }
      return { name, icon, color };
    });
  }, [normalized.amenities]);

  const studentRatingValue = useMemo(() => {
    const record = propertyData || {};
    const info = record.propertyInfo || {};
    return (
      record.studentReviewsRating ??
      record.studentRating ??
      record.student_reviews_rating ??
      info.studentReviewsRating ??
      info.studentRating ??
      record.rating ??
      record.reviewsAvg ??
      record.ratingScore ??
      "4.5"
    );
  }, [propertyData]);

  const employeeRatingValue = useMemo(() => {
    const record = propertyData || {};
    const info = record.propertyInfo || {};
    return (
      record.employeeRating ??
      record.professionalRating ??
      record.employee_rating ??
      info.employeeRating ??
      info.professionalRating ??
      record.rating ??
      record.reviewsAvg ??
      record.ratingScore ??
      "4.5"
    );
  }, [propertyData]);

  const studentRating = useMemo(() => buildStarsDisplay(studentRatingValue), [studentRatingValue]);
  const employeeRating = useMemo(() => buildStarsDisplay(employeeRatingValue), [employeeRatingValue]);

  const studentRatingComment =
    propertyData?.studentReviews ||
    propertyData?.studentReviewComment ||
    propertyData?.student_review_comment ||
    "No student reviews available yet";
  const employeeRatingComment =
    propertyData?.employeeRatingComment ||
    propertyData?.employee_review_comment ||
    "No employee rating available yet";

  useEffect(() => {
    const studentRatingEl = document.getElementById("student-reviews-rating");
    const studentStarsEl = document.getElementById("student-reviews-stars");
    const studentCommentEl = document.getElementById("student-reviews-comment");
    if (studentRatingEl) {
      studentRatingEl.textContent = studentRating.rating !== null ? studentRating.rating.toFixed(1) : "-";
    }
    if (studentStarsEl) {
      studentStarsEl.innerHTML = studentRating.stars.map((star) => `<span>${star}</span>`).join("");
    }
    if (studentCommentEl) {
      studentCommentEl.textContent = studentRatingComment;
    }

    const employeeRatingEl = document.getElementById("employee-rating-rating");
    const employeeStarsEl = document.getElementById("employee-rating-stars");
    const employeeCommentEl = document.getElementById("employee-rating-comment");
    if (employeeRatingEl) {
      employeeRatingEl.textContent = employeeRating.rating !== null ? employeeRating.rating.toFixed(1) : "-";
    }
    if (employeeStarsEl) {
      employeeStarsEl.innerHTML = employeeRating.stars.map((star) => `<span>${star}</span>`).join("");
    }
    if (employeeCommentEl) {
      employeeCommentEl.textContent = employeeRatingComment;
    }
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
        ? String(normalized.nearbyLocation)
            .split(/[,|]/)
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 6)
        : [normalized.area || "Area not specified", normalized.city || "City not specified"];

      nearbyEl.innerHTML = nearbyItems
        .map(
          (item, index) => `
            <div class="rounded-xl border border-red-100 bg-white p-4 shadow-sm">
              <div class="flex items-start gap-3">
                <i data-lucide="${index % 2 === 0 ? "navigation" : "map-pin"}" class="w-5 h-5 text-red-600 mt-0.5"></i>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-red-600">Nearby ${index + 1}</p>
                  <p class="text-sm text-gray-700 mt-1">${item}</p>
                </div>
              </div>
            </div>`
        )
        .join("");
    }

    const recommendedEl = document.getElementById("recommended-slider");
    if (recommendedEl) {
      recommendedEl.innerHTML = recommendedProperties.length
        ? recommendedProperties
            .map(
              (item) => `
                <a href="/website/property?id=${encodeURIComponent(String(item.id || ""))}" class="group block flex-shrink-0 snap-start w-80">
                  <div class="property-card-small">
                    <img src="${item.image}" alt="${item.title}" class="property-image-small" />
                    <div class="property-info-small">
                      <p class="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">${item.type}</p>
                      <p class="property-name-small">${item.title}</p>
                      <p class="property-location-small"><i data-lucide="map-pin" class="w-4 h-4"></i>${[item.area, item.city].filter(Boolean).join(", ") || "Location unavailable"}</p>
                      <p class="property-price-small">${formatInr(item.rent)}<span class="text-sm font-normal text-gray-500"> / mo</span></p>
                    </div>
                  </div>
                </a>`
            )
            .join("")
        : `<div class="w-full rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">No matching recommendations found for this area yet.</div>`;
    }

    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [mapQuery, normalized.locationText, normalized.title, normalized.nearbyLocation, normalized.area, normalized.city, recommendedProperties]);

  const getThemeClasses = (color) => {
    const themes = {
      blue: { border: "border-blue-500", iconBg: "from-blue-100 to-blue-50", iconColor: "text-blue-600", gradient: "from-white to-blue-50" },
      green: { border: "border-green-500", iconBg: "from-green-100 to-green-50", iconColor: "text-green-600", gradient: "from-white to-green-50" },
      purple: { border: "border-purple-500", iconBg: "from-purple-100 to-purple-50", iconColor: "text-purple-600", gradient: "from-white to-purple-50" },
      cyan: { border: "border-cyan-500", iconBg: "from-cyan-100 to-cyan-50", iconColor: "text-cyan-600", gradient: "from-white to-cyan-50" },
      yellow: { border: "border-yellow-500", iconBg: "from-yellow-100 to-yellow-50", iconColor: "text-yellow-600", gradient: "from-white to-yellow-50" },
      orange: { border: "border-orange-500", iconBg: "from-orange-100 to-orange-50", iconColor: "text-orange-600", gradient: "from-white to-orange-50" },
      indigo: { border: "border-indigo-500", iconBg: "from-indigo-100 to-indigo-50", iconColor: "text-indigo-600", gradient: "from-white to-indigo-50" },
      pink: { border: "border-pink-500", iconBg: "from-pink-100 to-pink-50", iconColor: "text-pink-600", gradient: "from-white to-pink-50" },
      violet: { border: "border-violet-500", iconBg: "from-violet-100 to-violet-50", iconColor: "text-violet-600", gradient: "from-white to-violet-50" },
      red: { border: "border-red-500", iconBg: "from-red-100 to-red-50", iconColor: "text-red-600", gradient: "from-white to-red-50" },
      slate: { border: "border-gray-500", iconBg: "from-gray-100 to-gray-50", iconColor: "text-gray-600", gradient: "from-white to-gray-50" }
    };
    return themes[color] || themes.slate;
  };

  const isSaved = useMemo(() => {
    if (!propertyData) return false;
    const id = propertyData._id || propertyData.enquiry_id || propertyData.propertyId || propertyData.propertyInfo?.propertyId;
    return id ? isFavorite(id) : false;
  }, [propertyData, favorites]);

  const activeGalleryImage = galleryPhotos[galleryIndex] || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop";

  const resolvedOwnerId =
    propertyData?.generatedCredentials?.loginId ||
    propertyData?.ownerLoginId ||
    propertyData?.ownerId ||
    propertyData?.owner_id ||
    propertyData?.propertyInfo?.ownerId ||
    propertyData?.propertyInfo?.generatedCredentials?.loginId ||
    "";

  const handleFavoriteClick = () => {
    if (!propertyData) return;
    const id = propertyData._id || propertyData.enquiry_id || propertyData.propertyId || propertyData.propertyInfo?.propertyId;
    if (!id) return;
    if (isFavorite(id)) {
      removeFavorite(id);
    } else {
      addFavorite({
        _id: id,
        enquiry_id: propertyData.enquiry_id,
        property_name: normalized.title,
        property_image: activeGalleryImage,
        city: normalized.city,
        location: normalized.city,
        locality: normalized.area,
        rent: normalized.rent,
        price: normalized.rent,
        property_type: normalized.badge,
        photos: galleryPhotos
      });
    }
    setFavorites(loadFavorites());
  };

  const handleRequest = () => {
    if (!isWebsiteLoggedIn()) {
      setShowAuthModal(true);
      return;
    }
    const enquiryRecord = {
      id: Date.now().toString(),
      type: "enquiry",
      studentId: getWebsiteUserId() || "unknown",
      studentName: getWebsiteUser()?.name || "Anonymous Tenant",
      studentEmail: getWebsiteUser()?.email || "Not provided",
      studentPhone: getWebsiteUser()?.phone || "Not provided",
      propertyId: propertyData?._id || propertyData?.propertyId || "unknown",
      propertyName: normalized.title,
      location: normalized.locationText,
      ts: new Date().toISOString(),
      status: "pending",
      paidAmount: 0
    };
    const ownerId = resolvedOwnerId || "default_owner";
    const ownerEnquiries = JSON.parse(localStorage.getItem(`owner_enquiries_${ownerId}`) || "[]");
    ownerEnquiries.unshift(enquiryRecord);
    localStorage.setItem(`owner_enquiries_${ownerId}`, JSON.stringify(ownerEnquiries));
  };

  const formatInr = (value) => {
    if (value === null || value === undefined || value === "") return "₹0";
    const amount = Number(value);
    if (Number.isFinite(amount)) {
      return `₹${amount.toLocaleString("en-IN")}`;
    }
    const text = String(value).replace(/[^\d.]/g, "");
    const numeric = Number(text);
    if (Number.isFinite(numeric)) {
      return `₹${numeric.toLocaleString("en-IN")}`;
    }
    return `₹${value}`;
  };

  const parseRatingValue = (value) => {
    if (value === null || value === undefined) return null;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return Math.max(0, Math.min(5, numeric));
    const match = String(value).match(/(\d+(\.\d+)?)/);
    if (!match) return null;
    const parsed = Number(match[1]);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, Math.min(5, parsed));
  };

  const buildStars = (value) => {
    const rating = parseRatingValue(value);
    const stars = [];
    const full = rating === null ? 0 : Math.floor(rating);
    for (let i = 0; i < 5; i += 1) {
      stars.push(i < full ? "★" : "☆");
    }
    return { rating, stars };
  };

  const shareLink = shareUrl || window.location.href;

  const handleThumbnailClick = (index) => {
    setGalleryIndex(index);
  };

  const handleOpenZoom = () => {
    if (!galleryPhotos.length) return;
    setZoomLevel(1);
    setShowZoom(true);
  };

  const handleCloseZoom = () => {
    setShowZoom(false);
    setZoomLevel(1);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(4, prev + 0.25));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(1, prev - 0.25));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  const handleNextImage = () => {
    if (!galleryPhotos.length) return;
    setGalleryIndex((prev) => (prev + 1) % galleryPhotos.length);
  };

  const handlePreviousImage = () => {
    if (!galleryPhotos.length) return;
    setGalleryIndex((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length);
  };

  const handleShareOpen = () => {
    setShareStatus("Copy");
    setShowShare(true);
  };

  const handleShareClose = () => {
    setShowShare(false);
  };

  const handleCopyShare = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareLink);
      } else {
        const temp = document.createElement("textarea");
        temp.value = shareLink;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        temp.remove();
      }
      setShareStatus("Copied!");
      setTimeout(() => setShareStatus("Copy"), 2000);
    } catch {
      setShareStatus("Copy");
    }
  };

  const handleLogout = () => {
    logoutWebsite("signup");
  };

  const handleAuthLogin = () => {
    setShowAuthModal(false);
    window.location.href = "/website/signup?mode=login";
  };

  const handleAuthSignup = () => {
    setShowAuthModal(false);
    window.location.href = "/website/signup?mode=signup";
  };

  const handleCloseGalleryModal = () => {
    setShowGalleryModal(false);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
  };

  const handleCloseBidInfoModal = () => {
    setShowBidInfoModal(false);
  };

  const handleCloseSignupModal = () => {
    setShowSignupModal(false);
  };

  const handleSignupRedirect = () => {
    setShowSignupModal(false);
    window.location.href = "signup";
  };

  const handleContinueAsGuest = () => {
    setShowSignupModal(false);
  };
  useHtmlPage({
    title: "Roomhy Property",
    bodyClass: "text-gray-800",
    htmlAttrs: {
  "lang": "en",
  "class": "scroll-smooth"
},
    metas: [
  {
    "charset": "UTF-8"
  },
  {
    "name": "viewport",
    "content": "width=device-width, initial-scale=1.0"
  },
  {
    "name": "referrer",
    "content": "no-referrer-when-downgrade"
  }
],
    bases: [],
    links: [
  {
    "rel": "preconnect",
    "href": "https://fonts.googleapis.com"
  },
  {
    "rel": "preconnect",
    "href": "https://fonts.gstatic.com",
    "crossorigin": true
  },
  {
    "href": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
    "rel": "stylesheet"
  },
  {
    "rel": "stylesheet",
    "href": "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css",
    "crossorigin": "anonymous",
    "referrerpolicy": "no-referrer"
  },
  {
    "rel": "stylesheet",
    "href": "/website/assets/css/property.css"
  }
],
    styles: [],
    scripts: [
  {
    "src": "https://cdn.tailwindcss.com"
  },
  {
    "src": "https://unpkg.com/lucide@latest"
  },
  
],
    inlineScripts: [],
  });

  return (
    <div className="html-page">
      
      
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
      
          <div id="menu-overlay" className="fixed inset-0 bg-black/50 z-40 hidden"></div>
          
          <div id="mobile-menu" className="fixed top-0 right-0 w-80 h-full bg-white z-50 shadow-xl transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col">
              <div className="flex justify-end p-4 flex-shrink-0">
                  <button id="menu-close" className="p-2">
                      <i data-lucide="x" className="w-6 h-6 text-gray-700"></i>
                  </button>
              </div>
      
              
              <div id="menu-logged-in" className="hidden flex flex-col h-full">
                  <div className="flex justify-between items-center px-6 py-2">
                      <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                              <i data-lucide="user" className="w-6 h-6 text-white"></i>
                          </div>
                          <div>
                              <span className="text-lg font-semibold text-gray-800" id="welcomeUserName">Hi,welcome</span>
                              <p className="text-xs text-gray-500" id="userIdDisplay"></p>
                          </div>
                      </div>
                      <a href="/website/profile" className="text-sm font-medium text-blue-600 hover:underline">Profile</a>
                  </div>
      
                  <div className="px-6 py-4">
                      <div className="border border-blue-200 rounded-lg p-4 relative overflow-hidden">
                          <p className="font-semibold text-gray-800 mb-3 relative z-10">Looking to Sell/Rent your Property?</p>
                          <a href="/website/list" className="block text-center w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg text-sm transition-colors relative z-10">
                              Post Property for Free
                          </a>
                      </div>
                  </div>
      
                  <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
                      <a href="/website/ourproperty" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <i data-lucide="home" className="w-5 h-5 text-blue-600"></i>
                          </div>
                          <span>Our Properties</span>
                      </a>
                      <a href="/website/fav" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                              <i data-lucide="heart" className="w-5 h-5 text-red-600"></i>
                          </div>
                          <span>Favorites</span>
                      </a>
                      <a href="/website/mystays" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <i data-lucide="building" className="w-5 h-5 text-purple-600"></i>
                          </div>
                          <span>My Stays</span>
                      </a>
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
                      <a href="/website/websitechat" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                              <i data-lucide="message-circle" className="w-5 h-5 text-green-600"></i>
                          </div>
                          <span>Chat</span>
                      </a>
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
                          <i data-lucide="log-in" className="w-4 h-4 inline mr-2"></i>
                          Sign Up
                      </a>
                      <a href="/website/signup" className="block w-full text-center border-2 border-blue-600 text-blue-600 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
                          <i data-lucide="user-plus" className="w-4 h-4 inline mr-2"></i>
                          Sign Up
                      </a>
                  </div>
              </div>
          </div>
      
          
          {bannerPhoto && (
            <div className="w-full bg-gray-100">
              <img src={bannerPhoto} alt="Website Banner" className="w-full h-auto max-h-96 object-cover" />
            </div>
          )}
      
          <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12 mt-4">
              <div className="flex justify-between items-center mb-8">
                  <nav className="text-sm font-medium text-gray-600">
                      <a href="javascript:history.back()" className="hover:text-blue-600 inline-flex items-center transition-colors"> 
                          <i data-lucide="arrow-left" className="w-4 h-4 mr-2"></i>Back to listings
                      </a>
                  </nav>
                  <div className="flex items-center space-x-4">
                      <button
                        id="save-button"
                        onClick={handleFavoriteClick}
                        className={`flex items-center space-x-2 transition-colors font-medium ${isSaved ? "text-red-600" : "text-gray-600 hover:text-red-600"}`}
                      >
                          <i data-lucide="heart" className={`w-5 h-5 ${isSaved ? "fill-red-500 text-red-500" : ""}`}></i>
                          <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
                      </button>
                      <button id="share-button" onClick={handleShareOpen} className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors font-medium">
                          <i data-lucide="share-2" className="w-5 h-5"></i>
                          <span className="hidden sm:inline">Share</span>
                      </button>
                  </div>
              </div>
      
              <div className="lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
                  <div className="lg:col-span-2 space-y-6">
      
      
                      
                      <section id="image-gallery" className="relative light-card p-6 sm:p-8 rounded-2xl border-b-4 border-sky-500">
                          <div className="flex items-center justify-between mb-5">
                              <div>
                                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2.5"><i data-lucide="camera" className="w-5 h-5 text-sky-600"></i>Property Gallery</h3>
                                  <p className="text-sm text-slate-600 mt-1.5">High-quality verified property images</p>
                              </div>
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-sky-100 to-cyan-100 text-sky-700 text-xs font-semibold rounded-full border border-sky-200 shadow-sm">
                                  <i data-lucide="check-circle-2" className="w-3.5 h-3.5"></i>
                                  Verified Property
                              </div>
                          </div>
                          
                          
                          <div className="relative w-full h-[24rem] sm:h-[28rem] bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg overflow-hidden shadow-md mb-4 cursor-zoom-in group" id="mainImageContainer" onClick={handleOpenZoom}>
                              <img id="mainGalleryImage" src={activeGalleryImage} alt="Property main view" className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" />
                              <div className="absolute top-3 left-3 bg-gradient-to-r from-sky-600 to-sky-700 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                                <span id="imageCounter">{galleryPhotos.length ? galleryIndex + 1 : 0}</span> / <span id="totalImages">{galleryPhotos.length}</span>
                              </div>
                              <button onClick={(event) => { event.stopPropagation(); handleOpenZoom(); }} className="absolute top-3 right-3 bg-white text-slate-700 p-2.5 rounded-full shadow-lg hover:bg-sky-50 hover:text-sky-600 transition-all" title="Zoom image">
                                  <i data-lucide="zoom-in" className="w-4 h-4"></i>
                              </button>
                          </div>
                          
                          
                          <div className="mb-4">
                              <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-semibold text-gray-800">All Photos</h4>
                                  <span className="text-xs font-medium text-gray-500">&larr; Scroll to browse &rarr;</span>
                              </div>
                              <div className="flex gap-3 overflow-x-auto pb-2 thumbnail-strip" id="galleryThumbnails">
                                  {galleryPhotos.length === 0 && (
                                    <div className="text-xs text-gray-400">No professional photos available</div>
                                  )}
                                  {galleryPhotos.map((photo, index) => (
                                    <button
                                      key={`${photo}-${index}`}
                                      type="button"
                                      onClick={() => handleThumbnailClick(index)}
                                      className={`w-32 h-20 flex-shrink-0 overflow-hidden rounded-lg gallery-thumbnail border bg-white ${index === galleryIndex ? "border-sky-500 ring-2 ring-sky-200" : "border-gray-200"}`}
                                    >
                                      <img src={photo} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                  ))}
                              </div>
                          </div>
                          
                          
                          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-3.5 text-sm text-emerald-800 flex items-start gap-2.5">
                              <i data-lucide="image" className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600"></i>
                              <div>
                                  <p className="font-semibold mb-0.5">Professional Photography</p>
                                  <span id="photoInfo" className="text-emerald-700">
                                    {galleryPhotos.length > 0
                                      ? `${galleryPhotos.length} high-quality photos available for detailed viewing`
                                      : "No professional photos available yet"}
                                  </span>
                              </div>
                          </div>
                      </section>
      
                      
                      <div id="imageZoomModal" className={`fixed inset-0 bg-black/95 items-center justify-center z-50 backdrop-blur-sm ${showZoom ? "flex" : "hidden"}`}>
                          <button onClick={handleCloseZoom} className="absolute top-4 right-4 text-white hover:text-gray-300 z-10" title="Close">
                              <i data-lucide="x" className="w-8 h-8"></i>
                          </button>
                          
                          <div className="w-full h-full flex flex-col items-center justify-center p-4" id="zoomedImageContainer">
                              <img
                                id="zoomedImage"
                                src={activeGalleryImage}
                                alt="Zoomed property view"
                                className="max-w-4xl max-h-[80vh] object-contain rounded"
                                style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center", transition: "transform 0.2s ease" }}
                              />
                          </div>
                          
                          
                          <div className="zoom-controls">
                              <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out">-</button>
                              <div className="zoom-level" id="zoomLevel">{Math.round(zoomLevel * 100)}%</div>
                              <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In">+</button>
                              <button className="zoom-btn" onClick={handleZoomReset} title="Reset">Reset</button>
                          </div>
                          
                          
                          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-4 bg-gray-800 rounded-full px-4 py-2">
                              <button onClick={handlePreviousImage} className="text-white hover:text-blue-400 p-2" title="Previous">
                                  <i data-lucide="chevron-left" className="w-5 h-5"></i>
                              </button>
                              <span className="text-white text-sm font-semibold px-4 py-2">
                                <span id="zoomImageCounter">{galleryPhotos.length ? galleryIndex + 1 : 0}</span> / <span id="zoomTotalImages">{galleryPhotos.length}</span>
                              </span>
                              <button onClick={handleNextImage} className="text-white hover:text-blue-400 p-2" title="Next">
                                  <i data-lucide="chevron-right" className="w-5 h-5"></i>
                              </button>
                          </div>
                      </div>
                      
                          
                          <div className="light-card rounded-2xl p-6 sm:p-8 md:p-10 border-t-4 border-sky-500 overflow-hidden relative">
                              
                              <div className="absolute -top-16 -right-16 w-64 h-64 bg-gradient-to-bl from-sky-100 to-transparent rounded-full opacity-30 pointer-events-none"></div>
                              <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-tr from-sky-50 to-transparent rounded-full opacity-20 pointer-events-none"></div>
                              
                              
                              <div className="relative z-10">
                                  
                                  <div className="mb-6 flex flex-wrap items-center gap-3">
                                      <span id="property-badge" className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 text-xs font-bold rounded-full border border-pink-300 shadow-sm">
                                          <i data-lucide="flower-2" className="w-4 h-4"></i>
                                          {normalized.badge}
                                      </span>
                                      {normalized.verified && (
                                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 text-xs font-bold rounded-full border border-blue-300 shadow-sm">
                                            <i data-lucide="check-circle-2" className="w-4 h-4"></i>
                                            Verified
                                        </span>
                                      )}
                                      <span className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-bold rounded-full border border-green-300 shadow-sm">
                                          <i data-lucide="trophy" className="w-4 h-4"></i>
                                          Popular
                                      </span>
                                  </div>
      
                                  
                                  <div className="mb-8">
                                      <h1 id="property-title" className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight">{normalized.title}</h1>
                                      <div className="h-1 w-24 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-full mb-6"></div>
                                      
                                      
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                                          <div className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                                              <i data-lucide="map-pin" className="w-6 h-6 text-blue-600"></i>
                                              <span id="property-location">{normalized.locationText || "Location unavailable"}</span>
                                          </div>
                                          <div className="hidden sm:block w-1 h-6 bg-gradient-to-b from-gray-300 to-transparent"></div>
                                          <a href="#location" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 font-semibold rounded-lg transition-all duration-300 border border-blue-200">
                                              <i data-lucide="map" className="w-4 h-4"></i>
                                              View Map
                                          </a>
                                      </div>
      
                                      
                                      <div id="property-owner-contact" className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl font-medium text-gray-700 inline-block">
                                        <div className="flex items-start gap-2">
                                          <i data-lucide="map-pin" className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0"></i>
                                          <div>
                                            <strong>Location:</strong> {normalized.locationText || "-"}
                                            {normalized.nearbyLocation && (
                                              <>
                                                <br />
                                                <strong>Nearby:</strong> {normalized.nearbyLocation}
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                  </div>
      
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                                      
                                      <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border border-yellow-200 rounded-xl shadow-sm">
                                          <div className="flex-1">
                                              <p className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">Rating</p>
                                              <div className="flex items-baseline gap-2 mt-2">
                                              <span id="property-rating" className="text-4xl font-bold text-yellow-600">{parseRatingValue(normalized.rating) ?? "-"}</span>
                                                  <span className="text-sm text-yellow-600 font-medium">/ 5.0</span>
                                              </div>
                                              <p className="text-xs text-yellow-600 font-medium mt-2">Based on 12 Reviews</p>
                                          </div>
                                          <div className="text-4xl">⭐</div>
                                      </div>
      
                                      
                                      <div id="property-verified" className={`flex items-center gap-4 p-5 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200 rounded-xl shadow-sm ${normalized.verified ? "" : "hidden"}`}>
                                          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full text-white">
                                              <i data-lucide="shield-check" className="w-6 h-6"></i>
                                          </div>
                                          <div>
                                              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Verification</p>
                                              <p className="text-green-700 font-bold mt-1">Fully Verified Property</p>
                                              <p className="text-xs text-green-600 mt-1">Safe & Secure Living</p>
                                          </div>
                                      </div>
                                  </div>
      
                                  
                                  <div className="h-px bg-gradient-to-r from-gray-200 via-blue-200 to-gray-200 mb-10"></div>
                              </div>
      
                              <div className="mb-12 relative z-10">
                                  <div className="flex items-center gap-3 mb-2">
                                      <h3 className="text-3xl font-bold text-gray-900"><i data-lucide="zap" className="w-7 h-7 text-blue-600 inline mr-3"></i>Quick Property Facts</h3>
                                  </div>
                                  <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full mb-6"></div>
                                  <p className="text-gray-700 text-lg max-w-2xl">Key features that make this property your perfect choice</p>
                              </div>
                              <div id="quickFactsGrid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                                  {quickFacts.length === 0 && (
                                    <div className="text-sm text-gray-500 col-span-2 md:col-span-3">No quick facts available.</div>
                                  )}
                                  {quickFacts.map((fact) => {
                                    const theme = getThemeClasses(fact.color);
                                    return (
                                      <div key={`${fact.label}-${fact.value}`} className={`fact-card group bg-gradient-to-br ${theme.gradient} rounded-2xl p-6 border-t-4 ${theme.border} shadow-md hover:shadow-2xl transition-all duration-400 hover:-translate-y-2 relative overflow-hidden`}>
                                        <div className="absolute top-0 right-0 w-20 h-20 opacity-10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-400" style={{ background: "linear-gradient(135deg, var(--color-from) 0%, var(--color-to) 100%)" }}></div>
                                        <div className={`w-10 h-10 bg-gradient-to-br ${theme.iconBg} rounded-lg flex items-center justify-center mb-4 relative z-10`}>
                                          <i data-lucide={fact.icon} className={`w-5 h-5 ${theme.iconColor} font-bold`}></i>
                                        </div>
                                        <div className="text-xs font-semibold text-gray-600 uppercase letter-spacing-wide mb-2 relative z-10">{fact.label}</div>
                                        <div className="text-xl font-bold text-gray-900 relative z-10">{fact.value}</div>
                                      </div>
                                    );
                                  })}
                              </div>
                          </div>
      
                      <section>
                          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3"><i data-lucide="star" className="w-7 h-7 text-amber-600"></i>Professional Ratings & Reviews</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                              
                              <div className="rating-card light-card rounded-2xl p-8">
                                  <div className="flex items-start justify-between mb-6">
                                      <div>
                                          <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-300 mb-4">
                                              <i data-lucide="users" className="w-4 h-4"></i>
                                              Students Verified
                                          </div>
                                          <h3 className="text-2xl font-bold text-gray-900 mt-2">Student Ratings</h3>
                                          <p className="text-sm text-gray-600 mt-1">Verified feedback from current & past residents</p>
                                      </div>
                                  </div>
                                  <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
                                      <p id="student-reviews-rating" className="text-5xl font-bold text-yellow-600">4.8</p>
                                      <div id="student-reviews-stars" className="stars text-3xl mt-3 tracking-wider">★★★★☆</div>
                                      <p className="text-sm text-yellow-700 font-semibold mt-3">Based on verified student reviews</p>
                                  </div>
                                  <p id="student-reviews-comment" className="text-gray-700 text-sm leading-relaxed italic border-t-2 border-gray-200 pt-4">No student reviews available yet. Be the first to share your experience!</p>
                              </div>
      
                              
                              <div className="rating-card light-card rounded-2xl p-8">
                                  <div className="flex items-start justify-between mb-6">
                                      <div>
                                          <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-bold rounded-full border border-green-300 mb-4">
                                              <i data-lucide="briefcase" className="w-4 h-4"></i>
                                              Staff Verified
                                          </div>
                                          <h3 className="text-2xl font-bold text-gray-900 mt-2">Professional Assessment</h3>
                                          <p className="text-sm text-gray-600 mt-1">Expert evaluation by property management</p>
                                      </div>
                                  </div>
                                  <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                      <p id="employee-rating-rating" className="text-5xl font-bold text-green-600">4.9</p>
                                      <div id="employee-rating-stars" className="stars text-3xl mt-3 tracking-wider">★★★★★</div>
                                      <p className="text-sm text-green-700 font-semibold mt-3">Professional quality standards maintained</p>
                                  </div>
                                  <p id="employee-rating-comment" className="text-gray-700 text-sm leading-relaxed italic border-t-2 border-gray-200 pt-4">This property meets all premium living standards and quality benchmarks.</p>
                              </div>
                          </div>
                      </section>
      
                      <section>
                          <div className="mb-12 relative z-10">
                              <div className="flex items-center gap-3 mb-2">
                                  <h2 className="text-3xl font-bold text-gray-900"><i data-lucide="crown" className="w-8 h-8 text-teal-600 inline mr-3"></i>Premium Amenities & Features</h2>
                              </div>
                              <div className="h-1 w-32 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full mb-6"></div>
                              <p className="text-gray-700 text-lg max-w-2xl">World-class amenities designed for comfortable and convenient living</p>
                          </div>
                          <div className="mb-8 p-6 bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 rounded-2xl border-l-4 border-teal-600 shadow-md hover:shadow-lg transition-shadow">
                              <div className="flex items-start gap-4">
                                  <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                                      <i data-lucide="badge-check" className="w-6 h-6 text-white font-bold"></i>
                                  </div>
                                  <div>
                                      <p className="text-sm font-bold text-teal-900 mb-1">Verified Premium Quality</p>
                                      <p className="text-sm text-teal-700">All amenities are professionally maintained, regularly inspected, and verified to meet premium living standards</p>
                                  </div>
                              </div>
                          </div>
                          <div id="amenitiesGrid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                              {amenityCards.length === 0 && (
                                <div className="text-sm text-gray-500 col-span-2">No amenities listed.</div>
                              )}
                              {amenityCards.map((amenity) => {
                                const theme = getThemeClasses(amenity.color);
                                return (
                                  <div key={amenity.name} className={`amenity-card group bg-gradient-to-br ${theme.gradient} rounded-2xl p-6 border-t-4 ${theme.border} shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-400 text-center relative overflow-hidden`}>
                                      <div className="absolute top-0 left-0 w-16 h-16 opacity-10 rounded-full -ml-8 -mt-8 group-hover:scale-150 transition-transform duration-400"></div>
                                      <div className={`w-12 h-12 bg-gradient-to-br ${theme.iconBg} rounded-xl flex items-center justify-center mx-auto mb-4 relative z-10`}>
                                          <i data-lucide={amenity.icon} className={`w-6 h-6 ${theme.iconColor} font-bold`}></i>
                                      </div>
                                      <div className="amenity-name text-gray-900 font-bold text-sm relative z-10">{amenity.name}</div>
                                  </div>
                                );
                              })}
                          </div>
                      </section>
                      
                       <section id="location" className="scroll-mt-24">
                          <h2 className="text-3xl font-bold mb-10 flex items-center gap-3"><i data-lucide="map-pin" className="w-8 h-8 text-red-600 font-bold"></i>Prime Location & Strategic Placement</h2>
                          <div className="light-card rounded-2xl p-8 overflow-hidden border-l-4 border-red-600">
                              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 flex items-center gap-3">
                                  <i data-lucide="map" className="w-5 h-5 text-red-600 flex-shrink-0"></i>
                                  <div>
                                      <p className="text-sm text-red-700 font-semibold">{normalized.locationText || "Location details available for this property"}</p>
                                      <p className="text-xs text-red-600 mt-1">Map and nearby places are based on this property's current area and city.</p>
                                  </div>
                              </div>
                              
                              <div className="w-full h-96 location-map mb-8 rounded-xl overflow-hidden">
                                   <iframe id="propertyMapIframe" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15125.93170782271!2d73.7302436871582!3d18.597144800000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2bbc048041d6f%3A0x2c608fa4f67c696f!2sHinjawadi%2C%20Pune%2C%20Maharashtra%2C%20India!5e0!3m2!1sen!2sus!4v1730248835251!5m2!1sen!2sus" width="100%" height="100%" style={{ border: "0" }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Property Location Map">
                                  </iframe>
                              </div>
                               
                               <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3"><i data-lucide="compass" className="w-6 h-6 text-red-600"></i>Nearby Attractions & Facilities</h3>
                              <p className="text-gray-700 text-sm mb-6">Strategic location with easy access to premium amenities and institutions</p>
                              <div id="whats-nearby-dynamic" className="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
                          </div>
                      </section>
      
                       <section className="max-w-4xl mx-auto">
                          <h2 className="text-3xl font-bold mb-12 flex items-center gap-3"><i data-lucide="help-circle" className="w-8 h-8 text-blue-600 font-bold"></i>Essential Information & FAQs</h2>
                          <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 flex items-start gap-3">
                              <i data-lucide="lightbulb" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"></i>
                              <div>
                                  <p className="text-sm text-blue-700 font-semibold">Professional Support Available</p>
                                  <p className="text-xs text-blue-600 mt-1">Our dedicated team is available 24/7 to assist with any queries or concerns</p>
                              </div>
                          </div>
                          <div className="space-y-4" id="faq-container">
                              <div className="faq-item light-card rounded-xl p-6 cursor-pointer transition-all duration-300 border-l-4 border-blue-600">
                                  <div className="faq-question flex justify-between items-start gap-4">
                                      <div className="flex-1">
                                          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2"><i data-lucide="utensils" className="w-5 h-5 text-blue-600"></i>Are meals included in the rent?</h3>
                                      </div>
                                      <i data-lucide="plus" className="w-6 h-6 icon-plus text-blue-600 flex-shrink-0 transition-transform duration-300 mt-1"></i>
                                  </div>
                                  <p className="faq-answer text-gray-700 text-sm">Yes, nutritious and professionally prepared meals (breakfast, lunch, and dinner) are included in the monthly rent. We also provide evening snacks and special dietary requirements can be accommodated upon request.</p>
                              </div>
                              <div className="faq-item light-card rounded-xl p-6 cursor-pointer transition-all duration-300 border-l-4 border-yellow-600">
                                  <div className="faq-question flex justify-between items-start gap-4">
                                      <div className="flex-1">
                                          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2"><i data-lucide="clock" className="w-5 h-5 text-yellow-600"></i>Is there a curfew time?</h3>
                                      </div>
                                      <i data-lucide="plus" className="w-6 h-6 icon-plus text-blue-600 flex-shrink-0 transition-transform duration-300 mt-1"></i>
                                  </div>
                                  <p className="faq-answer text-gray-700 text-sm">For the safety and well-being of all residents, we maintain a professional curfew policy: 10:30 PM on weekdays and 11:00 PM on weekends. Exceptions can be made with prior approval from the warden for academic or personal reasons.</p>
                              </div>
                               <div className="faq-item light-card rounded-xl p-6 cursor-pointer transition-all duration-300 border-l-4 border-green-600">
                                  <div className="faq-question flex justify-between items-start gap-4">
                                      <div className="flex-1">
                                          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2"><i data-lucide="users" className="w-5 h-5 text-green-600"></i>Are guests allowed?</h3>
                                      </div>
                                      <i data-lucide="plus" className="w-6 h-6 icon-plus text-blue-600 flex-shrink-0 transition-transform duration-300 mt-1"></i>
                                  </div>
                                  <p className="faq-answer text-gray-700 text-sm">Yes, guests are welcome in our designated common areas during professional visiting hours (9 AM to 9 PM). Overnight stays for guests are not permitted to maintain a secure living environment.</p>
                              </div>
                          </div>
                      </section>
                  </div>
      
                  <div className="lg:col-span-1 mt-12 lg:mt-0">
                      <div className="light-card p-8 rounded-2xl sticky sticky-booking-card border-t-4 border-blue-600 overflow-hidden relative">
                          
                          <div className="booking-card-header -m-8 mb-6 p-6">
                              <div className="relative z-10">
                                  <p className="text-xs font-bold text-white/90 uppercase tracking-widest mb-3">Monthly Budget</p>
                                  <p id="property-budget" className="price-value">{formatInr(normalized.rent)} <span className="price-period">/ month</span></p>
                              </div>
                          </div>
                          
                          
                          <div className="booking-form-section -m-8 mt-0 rounded-b-2xl">
                              <form id="schedule-form" className="space-y-4" onSubmit={(event) => { event.preventDefault(); handleRequest(); }}>
                                  <div className="form-group">
                                      <label htmlFor="visit-name" className="form-label">Full Name</label>
                                      <input type="text" id="visit-name" placeholder="Enter your full name" className="form-input" required />
                                  </div>
                                  
                                  <div className="form-group">
                                      <label htmlFor="visit-email" className="form-label">Email Address</label>
                                      <input type="email" id="visit-email" placeholder="your@email.com" className="form-input" required />
                                  </div>
      
                                  <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-4 mb-4">
                                      <p className="text-sm text-blue-800 font-semibold">✓ Minimum stay: 3 months</p>
                                  </div>
      
                                  <div className="flex items-center gap-3">
                                      <div className="relative w-12 h-7 bg-blue-600 rounded-full cursor-pointer transition-colors duration-200" id="whatsapp-toggle">
                                          <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-200"></div>
                                      </div>
                                      <span className="text-sm text-gray-700 font-medium"><i data-lucide="message-circle" className="w-4 h-4 inline mr-2 text-blue-600"></i>WhatsApp Updates</span>
                                  </div>
      
                                  <div className="flex items-start gap-2 mt-5">
                                      <input type="checkbox" id="visit-terms" className="w-4 h-4 mt-1 accent-blue-600" required />
                                      <span className="text-xs text-gray-700"><a href="#" className="text-blue-600 hover:underline font-semibold">Terms & conditions</a> and <a href="#" className="text-blue-600 hover:underline font-semibold">privacy policy</a></span>
                                  </div>
      
                                  <button type="submit" className="glow-button w-full text-white font-bold py-3 px-4 text-base mt-6">Send Request</button>
                              </form>
                          </div>
      
                          
                          <div className="mt-6 text-center text-xs text-gray-600 border-t border-gray-200 pt-5 flex items-center justify-center gap-2">
                              <i data-lucide="shield-check" className="w-4 h-4 text-green-600 font-bold"></i>
                              <span><span className="font-semibold text-gray-900">100% Safe</span> & Verified</span>
                          </div>
                      </div>
                  </div>
              </div>
              
              <section id="recommended-properties" className="mt-20 md:mt-32 container mx-auto px-4">
                  <div className="mb-8">
                      <h2 className="recommended-title"><i data-lucide="star" className="w-8 h-8 text-amber-600 inline mr-3"></i>Professional Recommendations</h2>
                      <p className="text-lg text-gray-700 max-w-2xl">Handpicked premium properties verified for quality, safety, and excellence</p>
                  </div>
                  <div className="relative">
                      <button id="recommended-prev" className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 text-gray-700 hover:text-blue-600 transition-all hidden sm:block border border-gray-200 hover:border-blue-400"><i data-lucide="chevron-left" className="w-6 h-6"></i></button>
                      <div id="recommended-slider" className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-smooth horizontal-slider">
                          <a href="/website/property?id=2" className="group block flex-shrink-0 snap-start w-80">
                              <div className="property-card-small">
                                  <img src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1916&auto=format&fit=crop" alt="Recommended Property 1" className="property-image-small" />
                                  <div className="property-info-small">
                                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Co-Living</p>
                                      <p className="property-name-small">The Hive</p>
                                      <p className="property-location-small"><i data-lucide="map-pin" className="w-4 h-4"></i>Koramangala, BLR</p>
                                      <p className="property-price-small">₹18,000<span className="text-sm font-normal text-gray-500"> / mo</span></p>
                                  </div>
                              </div>
                          </a>
                          <a href="/website/property?id=3" className="group block flex-shrink-0 snap-start w-80">
                              <div className="property-card-small">
                                  <img src="https://images.unsplash.com/photo-1567016432779-1fee749a1532?q=80&w=1974&auto:format&fit=crop" alt="Recommended Property 2" className="property-image-small" />
                                  <div className="property-info-small">
                                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Private Studio</p>
                                      <p className="property-name-small">Campus Corner</p>
                                      <p className="property-location-small"><i data-lucide="map-pin" className="w-4 h-4"></i>North Campus, Delhi</p>
                                      <p className="property-price-small">₹13,000<span className="text-sm font-normal text-gray-500"> / mo</span></p>
                                  </div>
                              </div>
                          </a>
                          <a href="/website/property?id=6" className="group block flex-shrink-0 snap-start w-80">
                              <div className="property-card-small">
                                  <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto:format&fit=crop" alt="Recommended Property 3" className="property-image-small" />
                                  <div className="property-info-small">
                                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Co-Living</p>
                                      <p className="property-name-small">Prime Student Living</p>
                                      <p className="property-location-small"><i data-lucide="map-pin" className="w-4 h-4"></i>Saket Nagar, Indore</p>
                                      <p className="property-price-small">₹11,000<span className="text-sm font-normal text-gray-500"> / mo</span></p>
                                  </div>
                              </div>
                          </a>
                          <a href="/website/property?id=4" className="group block flex-shrink-0 snap-start w-80">
                              <div className="property-card-small">
                                  <img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1932&auto:format&fit=crop" alt="Recommended Property 4" className="property-image-small" />
                                  <div className="property-info-small">
                                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Apartment</p>
                                      <p className="property-name-small">Modern Loft</p>
                                      <p className="property-location-small"><i data-lucide="map-pin" className="w-4 h-4"></i>Powai, Mumbai</p>
                                      <p className="property-price-small">₹22,000<span className="text-sm font-normal text-gray-500"> / mo</span></p>
                                  </div>
                              </div>
                          </a>
                      </div>
                      <button id="recommended-next" className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 text-gray-700 hover:text-blue-600 transition-all hidden sm:block border border-gray-200 hover:border-blue-400"><i data-lucide="chevron-right" className="w-6 h-6"></i></button>
                  </div>
              </section>
      
          </main>
                  
      
          
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
          
          <div id="galleryModal" className={`fixed inset-0 bg-black/90 items-center justify-center z-[60] backdrop-blur-sm ${showGalleryModal ? "flex" : "hidden"}`} onClick={handleCloseGalleryModal}>
              <div className="w-full max-w-6xl p-4 h-[80vh] flex flex-col" onClick={(event) => event.stopPropagation()}>
                  <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                          <button id="gallery-prev" className="p-2 bg-white/10 text-white rounded hover:bg-white/20"><i data-lucide="chevron-left" className="w-5 h-5"></i></button>
                          <button id="gallery-next" className="p-2 bg-white/10 text-white rounded hover:bg-white/20"><i data-lucide="chevron-right" className="w-5 h-5"></i></button>
                      </div>
                      <div className="flex items-center gap-2">
                          <button id="gallery-zoom-in" className="p-2 bg-white/10 text-white rounded hover:bg-white/20">+</button>
                          <button id="gallery-zoom-out" className="p-2 bg-white/10 text-white rounded hover:bg-white/20">Ã¢Ë†â€™</button>
                          <button id="gallery-reset" className="p-2 bg-white/10 text-white rounded hover:bg-white/20">Reset</button>
                          <button id="gallery-close" className="p-2 bg-white/10 text-white rounded hover:bg-white/20"><i data-lucide="x" className="w-5 h-5"></i></button>
                      </div>
                  </div>
      
                  <div id="galleryContent" className="relative flex-1 bg-black rounded overflow-hidden flex items-center justify-center">
                      <img id="gallery-main-img" src alt className="select-none max-h-full max-w-none" style={{ transformOrigin: "center center", transform: "translate(0px,0px) scale(1)", cursor: "grab" }} />
                  </div>
      
                  <div id="gallery-thumbs" className="mt-3 flex gap-2 overflow-x-auto"></div>
              </div>
          </div>
      
          
          <div id="auth-required-modal" className={`fixed inset-0 bg-black/60 items-center justify-center z-50 p-4 backdrop-blur-sm ${showAuthModal ? "flex" : "hidden"}`} onClick={() => setShowAuthModal(false)}>
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-gray-200" onClick={(event) => event.stopPropagation()}>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i data-lucide="lock" className="w-6 h-6 text-white"></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">Signup Required</h3>
                  <p className="text-sm text-gray-600 mb-6">You need an account to Request or Bid. Please sign up to proceed.</p>
                  <div className="flex gap-3 justify-center flex-col sm:flex-row">
                      <button id="auth-modal-login" onClick={handleAuthLogin} className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300">Login</button>
                      <button id="auth-modal-signup" onClick={handleAuthSignup} className="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300">Sign up</button>
                  </div>
                  <div className="mt-4">
                      <button id="auth-modal-close" onClick={() => setShowAuthModal(false)} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
                  </div>
              </div>
          </div>
      
          <div id="share-modal" className={`fixed inset-0 bg-black/50 z-50 items-center justify-center p-4 backdrop-blur-sm ${showShare ? "flex" : "hidden"}`} onClick={handleShareClose}>
              <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200" id="share-modal-content" onClick={(event) => event.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">Share this Property</h3>
                      <button id="close-modal-button" onClick={handleShareClose} className="text-gray-400 hover:text-gray-800 transition-colors"><i data-lucide="x" className="w-6 h-6"></i></button>
                  </div>
                  <p className="text-gray-600 mb-6">Copy the link below to share this amazing find with your friends!</p>
                  <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <input type="text" id="share-link-input" readOnly value={shareLink} className="w-full px-3 py-2 bg-gray-50 text-gray-700 text-sm font-medium focus:outline-none" />
                      <button id="copy-link-button" onClick={handleCopyShare} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 whitespace-nowrap flex-shrink-0">{shareStatus}</button> 
                  </div>
              </div>
          </div>
      
          
          <div id="payment-modal" className={`fixed inset-0 bg-black/50 z-50 items-center justify-center p-4 overflow-y-auto ${showPaymentModal ? "flex" : "hidden"}`} onClick={handleClosePaymentModal}>
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full my-8" onClick={(event) => event.stopPropagation()}>
                  
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-6 rounded-t-2xl">
                      <button id="payment-close-btn" onClick={handleClosePaymentModal} className="absolute top-4 right-4 text-white/80 hover:text-white">
                          <i data-lucide="x" className="w-6 h-6"></i>
                      </button>
                      <h2 id="payment-modal-title" className="text-2xl font-bold">Place Your Bid</h2>
                      <p id="payment-modal-subtitle" className="text-blue-100 mt-1">Send bid to matching properties</p>
                  </div>
      
                  
                  <div className="px-6 py-6 space-y-6">
                      
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h3 id="payment-property-name" className="font-bold text-gray-900 mb-2">Property Name</h3>
                          <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex justify-between">
                                  <span>Budget</span>
                                  <span id="payment-budget" className="font-semibold text-gray-900">₹0</span>
                              </div>
                              <div className="flex justify-between">
                                  <span>Bid Type</span>
                                  <span id="payment-bid-type" className="font-semibold text-blue-600">Bid to All</span>
                              </div>
                          </div>
                      </div>
      
                      
                      <div className="space-y-3 border-b border-gray-200 pb-4">
                          <div className="flex justify-between items-center text-sm">
                              <label className="text-gray-600">Bid Amount <span className="text-xs text-gray-500">(Refundable)</span></label>
                              <span className="font-semibold text-gray-900">₹500</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                              <label className="text-gray-600">Processing Fee</label>
                              <span className="font-semibold text-gray-900">₹0</span>
                          </div>
                      </div>
      
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                              <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                              <span id="payment-total" className="text-2xl font-bold text-yellow-700">₹500</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-2">Ã¢Å“â€œ Fully refundable bid amount. If you don't like the place after visits, full refund will be processed.</p>
                      </div>
      
                      
                      <div className="space-y-2">
                          <label className="flex items-start space-x-3 cursor-pointer">
                              <input type="checkbox" id="accept-terms" className="mt-1 w-4 h-4 rounded border-gray-300" />
                              <span className="text-sm text-gray-600">I agree to the <a href="/website/terms" target="_blank" className="text-blue-600 hover:underline">terms & conditions</a> and refund policy</span>
                          </label>
                      </div>
      
                      
                      <button id="submit-bid-btn" className="w-full glow-button text-white font-bold py-3 px-4 rounded-lg text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                          <i data-lucide="lock" className="w-5 h-5"></i>
                          <span>Proceed to Payment</span>
                      </button>
      
                      
                      <div className="text-center text-xs text-gray-500 flex items-center justify-center space-x-1">
                          <i data-lucide="shield-check" className="w-4 h-4 text-green-600"></i>
                          <span>SSL Secure "Â¢ PCI Compliant</span>
                      </div>
                  </div>
              </div>
          </div>
      
          
          <div id="bid-info-modal" className={`fixed inset-0 bg-black/50 z-50 items-center justify-center p-4 ${showBidInfoModal ? "flex" : "hidden"}`} onClick={handleCloseBidInfoModal}>
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full" onClick={(event) => event.stopPropagation()}>
                  <div className="px-6 py-6 space-y-4">
                      <div className="flex items-start space-x-3">
                          <i data-lucide="info" className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0"></i>
                          <div>
                              <h3 className="font-bold text-lg text-gray-900">How Bidding Works</h3>
                              <p className="text-gray-600 text-sm mt-2">Your bid will:</p>
                              <ul className="text-sm text-gray-600 space-y-1 mt-2 ml-4 list-disc">
                                  <li>Be sent to all matching properties</li>
                                  <li>Expire in 7 days if not accepted</li>
                                  <li>Open chat only after owner accepts</li>
                                  <li>Allow up to 2 visits per bid</li>
                              </ul>
                          </div>
                      </div>
                      <button id="close-info-modal" onClick={handleCloseBidInfoModal} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700">Got It</button>
                  </div>
              </div>
          </div>
      
      
          
          
      
          
          <div id="signupModalOverlay" className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${showSignupModal ? "flex" : "hidden"}`} style={{ animation: "fadeIn 0.3s ease-in-out" }} onClick={handleCloseSignupModal}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8" style={{ animation: "slideUp 0.3s ease-out" }} onClick={(event) => event.stopPropagation()}>
                  
                  <button onClick={handleCloseSignupModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                      <i data-lucide="x" className="w-6 h-6"></i>
                  </button>
      
                  
                  <div className="flex justify-center mb-6">
                      <div className="bg-gradient-to-br from-teal-400 to-teal-600 rounded-full p-4 transform transition-transform hover:scale-110">
                          <i data-lucide="mail-check" className="w-8 h-8 text-white"></i>
                      </div>
                  </div>
      
                  
                  <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Join Roomhy Community</h2>
                  
                  
                  <p className="text-center text-gray-600 mb-3">Your email address is not registered yet</p>
      
                  
                  <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-4 mb-6 border border-teal-100">
                      <p className="text-sm text-gray-600 text-center">
                          <span className="font-semibold text-teal-700" id="modalEmailDisplay">email@example.com</span>
                      </p>
                  </div>
      
                  
                  <div className="mb-6">
                      <p className="text-center text-gray-700 leading-relaxed">
                          Sign up now to unlock exclusive features and manage your bookings with ease!
                      </p>
                  </div>
      
                  
                  <div className="space-y-2 mb-8">
                      <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                              <i data-lucide="check-circle" className="w-5 h-5 text-green-500"></i>
                          </div>
                          <span className="text-sm text-gray-700">Create your profile instantly</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                              <i data-lucide="check-circle" className="w-5 h-5 text-green-500"></i>
                          </div>
                          <span className="text-sm text-gray-700">Direct chat with property owners</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                              <i data-lucide="check-circle" className="w-5 h-5 text-green-500"></i>
                          </div>
                          <span className="text-sm text-gray-700">Track all your bookings & requests</span>
                      </div>
                  </div>
      
                  
                  <div className="space-y-3">
                      
                      <button onClick={handleSignupRedirect} className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2">
                          <i data-lucide="user-plus" className="w-5 h-5"></i>
                          Sign Up Now
                      </button>
                      
                      
                      <button onClick={handleContinueAsGuest} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-all duration-200 border border-gray-300 flex items-center justify-center gap-2">
                          <i data-lucide="arrow-right" className="w-5 h-5"></i>
                          Continue as Guest
                      </button>
                  </div>
      
                  
                  <p className="text-xs text-gray-500 text-center mt-6">
                      ðŸ”’ Your information is secure. We never share your data.
                  </p>
              </div>
          </div>
      
          
          <style>
              @keyframes fadeIn {"{"}
                  from {"{"}
                      opacity: 0;
                  {"}"}
                  to {"{"}
                      opacity: 1;
                  {"}"}
              {"}"}
      
              @keyframes slideUp {"{"}
                  from {"{"}
                      opacity: 0;
                      transform: translateY(20px);
                  {"}"}
                  to {"{"}
                      opacity: 1;
                      transform: translateY(0);
                  {"}"}
              {"}"}
          </style>
      
          
          
      
    </div>
  );
}


