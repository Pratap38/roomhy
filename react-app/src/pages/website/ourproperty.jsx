import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { getWebsiteApiUrl, getWebsiteUser, getWebsiteUserEmail, getWebsiteUserName, isWebsiteLoggedIn } from "../../utils/websiteSession";
import { loadFavorites, addFavorite, removeFavorite, isFavorite as isFavoriteStored } from "../../utils/websiteFavorites";
import { useHeroSlideshow, useLucideIcons, useWebsiteCommon, useWebsiteMenu } from "../../utils/websiteUi";
import { loadApprovedProperties } from "../../utils/approvedProperties";

const mergePropertiesById = (items = []) => {
  const map = new Map();
  (items || []).forEach((item) => {
    if (!item || typeof item !== "object") return;
    const info = item.propertyInfo || {};
    const key = item._id || item.visitId || item.propertyId || item.enquiry_id || info.propertyId || info._id;
    if (!key) return;
    map.set(String(key), { ...(map.get(String(key)) || {}), ...item });
  });
  return Array.from(map.values());
};

const loadCachedApprovedProperties = () => {
  const cached = [];

  const readStore = (store) => {
    try {
      const list = JSON.parse(store.getItem("roomhy_visits") || "[]");
      if (Array.isArray(list)) cached.push(...list);
    } catch (_) {
      // ignore blocked or malformed storage
    }
  };

  try {
    readStore(localStorage);
  } catch (_) {}

  try {
    readStore(sessionStorage);
  } catch (_) {}

  return mergePropertiesById(
    cached.filter((item) => item && item.isLiveOnWebsite === true)
  );
};

const normalizeGenderValue = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (
    normalized.includes("co-ed") ||
    normalized.includes("coed") ||
    normalized.includes("co ed") ||
    normalized.includes("any") ||
    normalized.includes("all") ||
    normalized === "other"
  ) {
    return "co-ed";
  }
  if (
    normalized.includes("male") ||
    normalized.includes("boy") ||
    normalized.includes("man") ||
    normalized.includes("men") ||
    normalized.includes("gent") ||
    normalized === "m"
  ) {
    return "male";
  }
  if (
    normalized.includes("female") ||
    normalized.includes("girl") ||
    normalized.includes("woman") ||
    normalized.includes("women") ||
    normalized.includes("lad") ||
    normalized === "f"
  ) {
    return "female";
  }
  return normalized;
};

const isGenderMatch = (propertyGender, selectedGender) => {
  const propertyValue = normalizeGenderValue(propertyGender);
  const selectedValue = normalizeGenderValue(selectedGender);
  if (!selectedValue) return true;
  if (!propertyValue) return true;
  if (propertyValue === "co-ed" || selectedValue === "co-ed") return true;
  return propertyValue === selectedValue;
};

const deriveAreasFromProperties = (list = [], cityName = "") => {
  const targetCity = String(cityName || "").trim().toLowerCase();
  const map = new Map();

  (list || []).forEach((item) => {
    if (!item || typeof item !== "object") return;
    const info = item.propertyInfo || {};
    const itemCity = String(item.city || info.city || item.cityName || "").trim();
    const itemArea = String(item.locality || info.area || item.area || "").trim();
    if (!itemArea) return;
    if (targetCity && itemCity.toLowerCase() !== targetCity) return;
    const key = itemArea.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { _id: key, id: key, name: itemArea, city: itemCity });
    }
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export default function WebsiteOurproperty() {
  useWebsiteCommon();
  useWebsiteMenu();
  useHeroSlideshow(6000);

  const apiUrl = useMemo(() => getWebsiteApiUrl(), []);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showBidSuccess, setShowBidSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [showFloatingActions, setShowFloatingActions] = useState(false);
  const [showFloatingCoachmark, setShowFloatingCoachmark] = useState(false);

  const initialParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      type: params.get("type") || "",
      city: params.get("city") || "",
      search: params.get("search") || ""
    };
  }, []);

  const [filters, setFilters] = useState({
    cityId: "",
    cityName: initialParams.city || "",
    areaId: "",
    areaName: "",
    minPrice: "",
    maxPrice: "",
    gender: "",
    propertyType: initialParams.type || "",
    occupancy: "",
    search: initialParams.search || ""
  });

  const [bidForm, setBidForm] = useState({
    name: "",
    email: "",
    bidMin: "",
    bidMax: "",
    message: ""
  });

  useLucideIcons([
    cities,
    areas,
    properties,
    favorites,
    filters,
    showBidModal,
    showBidSuccess,
    showFilterDrawer,
    showFloatingActions,
    showFloatingCoachmark
  ]);

  useEffect(() => {
    setFavorites(loadFavorites());
    const user = getWebsiteUser();
    if (user) {
      setBidForm((prev) => ({
        ...prev,
        name: getWebsiteUserName() || prev.name,
        email: getWebsiteUserEmail() || prev.email
      }));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadCities = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/locations/cities`);
        if (!response.ok) throw new Error("Failed to fetch cities");
        const data = await response.json();
        const cityData = data.data || data || [];
        if (mounted) setCities(cityData);
      } catch (error) {
        if (mounted) {
          setCities([
            { _id: "kota", name: "Kota", state: "Rajasthan" },
            { _id: "sikar", name: "Sikar", state: "Rajasthan" },
            { _id: "indore", name: "Indore", state: "Madhya Pradesh" }
          ]);
        }
      }
    };
    loadCities();
    return () => {
      mounted = false;
    };
  }, [apiUrl]);

  useEffect(() => {
    if (!filters.cityId || cities.length === 0) return;
    const city = cities.find((item) => (item._id || item.id || item.name) === filters.cityId);
    if (city && city.name) {
      setFilters((prev) => ({ ...prev, cityName: city.name }));
    }
  }, [filters.cityId, cities]);

  useEffect(() => {
    if (!filters.cityName || filters.cityId) return;
    const city = cities.find((item) => item.name?.toLowerCase?.() === filters.cityName.toLowerCase());
    if (city) {
      setFilters((prev) => ({ ...prev, cityId: city._id || city.id || city.name }));
    }
  }, [filters.cityName, cities, filters.cityId]);

  useEffect(() => {
    const loadAreas = async () => {
      if (!filters.cityId) {
        setAreas([]);
        return;
      }
      try {
        const response = await fetch(`${apiUrl}/api/locations/areas`);
        if (!response.ok) throw new Error("Failed to fetch areas");
        const data = await response.json();
        const allAreas = data.data || data || [];
        const filteredAreas = allAreas.filter((area) => area.city?._id === filters.cityId || area.city === filters.cityId);
        if (filteredAreas.length > 0) {
          setAreas(filteredAreas);
          return;
        }
        const fallbackAreas = deriveAreasFromProperties(properties, filters.cityName);
        setAreas(fallbackAreas);
      } catch (error) {
        const fallbackAreas = deriveAreasFromProperties(properties, filters.cityName);
        setAreas(fallbackAreas);
      }
    };
    loadAreas();
  }, [apiUrl, filters.cityId, filters.cityName, properties]);

  useEffect(() => {
    if (!filters.areaId) {
      setFilters((prev) => ({ ...prev, areaName: "" }));
      return;
    }
    const area = areas.find((item) => (item._id || item.id || item.name) === filters.areaId);
    if (area?.name) {
      setFilters((prev) => ({ ...prev, areaName: area.name }));
    }
  }, [filters.areaId, areas]);

  useEffect(() => {
    let mounted = true;
    const loadProperties = async () => {
      setLoadingProperties(true);
      try {
        const list = await loadApprovedProperties({ includeOffline: false });
        const apiList = Array.isArray(list) ? list.filter(Boolean) : [];
        const finalList = apiList.length > 0 ? apiList : loadCachedApprovedProperties();
        if (mounted) setProperties(finalList);
      } catch (error) {
        const cached = loadCachedApprovedProperties();
        if (mounted) setProperties(cached);
      } finally {
        if (mounted) setLoadingProperties(false);
      }
    };
    loadProperties();
    const handleStorage = (event) => {
      if (!event?.key || event.key === "roomhy_visits" || event.key === "new_property_added") {
        loadProperties();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      mounted = false;
      window.removeEventListener("storage", handleStorage);
    };
  }, [apiUrl]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const actionRoot = event.target.closest?.("[data-floating-actions]");
      if (!actionRoot) {
        setShowFloatingActions(false);
        setShowFloatingCoachmark(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let shouldShowCoachmark = false;
    try {
      shouldShowCoachmark = sessionStorage.getItem("roomhy_floating_cta_seen") !== "true";
    } catch (_) {
      shouldShowCoachmark = true;
    }

    if (!shouldShowCoachmark) return;

    const openTimer = window.setTimeout(() => {
      setShowFloatingCoachmark(true);
      setShowFloatingActions(true);
    }, 900);

    const closeTimer = window.setTimeout(() => {
      setShowFloatingCoachmark(false);
    }, 6500);

    try {
      sessionStorage.setItem("roomhy_floating_cta_seen", "true");
    } catch (_) {
      // ignore storage failures
    }

    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(closeTimer);
    };
  }, []);

  const normalizeProperty = (prop) => {
    const info = prop.propertyInfo || {};
    const id = prop._id || prop.enquiry_id || prop.propertyId || info.propertyId || info._id;
    const name = prop.property_name || info.name || prop.title || "Property";
    const city = prop.city || info.city || prop.location || prop.cityName || "";
    const area = prop.locality || info.area || prop.area || "";
    const rent = prop.rent || prop.monthlyRent || info.rent || info.monthlyRent || 0;
    const propertyType = prop.property_type || prop.type || info.propertyType || info.property_type || "Room";
    const photos = Array.isArray(prop.professionalPhotos) && prop.professionalPhotos.length > 0 ? prop.professionalPhotos : prop.photos || [];
    const img = photos[0] || "https://images.unsplash.com/photo-1567016432779-1fee749a1532?q=80&w=1974&auto=format&fit=crop";
    return {
      id,
      name,
      city,
      area,
      rent,
      propertyType,
      vacantRooms: prop.vacantRooms ?? info.vacantRooms ?? 0,
      vacantBeds: prop.vacantBeds ?? info.vacantBeds ?? 0,
      occupiedRooms: prop.occupiedRooms ?? info.occupiedRooms ?? 0,
      occupiedBeds: prop.occupiedBeds ?? info.occupiedBeds ?? 0,
      photos,
      img,
      rating: prop.rating || prop.reviewsAvg || "4.5",
      reviewsCount: prop.reviewsCount || 0,
      isVerified: !!prop.isVerified || !!prop.verified || !!prop.generatedCredentials,
      raw: prop
    };
  };

  const filteredProperties = useMemo(() => {
    const normalized = properties.map(normalizeProperty);
    const filtered = normalized.filter((property) => {
      if (filters.cityName) {
        const propertyCity = String(property.city || "").toLowerCase();
        const filterCity = filters.cityName.toLowerCase();
        const cityMatch = propertyCity.includes(filterCity) || filterCity.includes(propertyCity);
        if (!cityMatch) return false;
      }
      if (filters.areaId || filters.areaName) {
        const areaFilter = filters.areaName || (areas.find((a) => (a._id || a.id) === filters.areaId)?.name || "");
        if (areaFilter) {
          const propertyArea = String(property.area || "").toLowerCase();
          const normalizedArea = areaFilter.toLowerCase();
          if (!propertyArea.includes(normalizedArea) && !normalizedArea.includes(propertyArea)) return false;
        }
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const haystack = `${property.name} ${property.city} ${property.area}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (filters.propertyType) {
        const propType = property.propertyType.toLowerCase();
        const filterType = filters.propertyType.toLowerCase();
        if (!propType.includes(filterType)) return false;
      }
      if (filters.gender) {
        const gender = property.raw.gender || property.raw.genderSuitability || property.raw.propertyInfo?.genderSuitability || property.raw.propertyInfo?.gender || "";
        if (!isGenderMatch(gender, filters.gender)) return false;
      }
      if (filters.minPrice) {
        const min = parseInt(filters.minPrice, 10);
        if (Number.isFinite(min) && property.rent < min) return false;
      }
      if (filters.maxPrice) {
        const max = parseInt(filters.maxPrice, 10);
        if (Number.isFinite(max) && max > 0 && property.rent > max) return false;
      }
      return true;
    });

    const hasActiveFilters = Boolean(
      filters.cityName ||
      filters.areaId ||
      filters.areaName ||
      filters.search ||
      filters.propertyType ||
      filters.gender ||
      filters.minPrice ||
      filters.maxPrice
    );

    if (!filtered.length && normalized.length > 0 && !hasActiveFilters) {
      return normalized;
    }

    return filtered;
  }, [properties, filters, areas]);

  const propertyCountLabel = loadingProperties ? "Loading..." : `${filteredProperties.length} Properties Found`;

  const selectedCity = useMemo(() => {
    if (!filters.cityName && !filters.cityId) return null;
    return (
      cities.find((item) => {
        const itemId = item._id || item.id || item.name;
        return itemId === filters.cityId || item.name?.toLowerCase?.() === filters.cityName.toLowerCase();
      }) || null
    );
  }, [cities, filters.cityId, filters.cityName]);

  const topAreas = useMemo(() => {
    const availableAreas = areas.length > 0 ? areas : deriveAreasFromProperties(properties, filters.cityName);
    return availableAreas.slice(0, 20);
  }, [areas, properties, filters.cityName]);

  const cityWiseProperties = useMemo(() => {
    const groups = new Map();
    filteredProperties.forEach((property) => {
      const cityLabel = String(property.city || "Other Locations").trim() || "Other Locations";
      if (!groups.has(cityLabel)) groups.set(cityLabel, []);
      groups.get(cityLabel).push(property);
    });
    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([city, items]) => ({ city, items }));
  }, [filteredProperties]);

  const cityWisePropertySections = useMemo(
    () =>
      cityWiseProperties.map(({ city, items }) => (
        <section key={city} className="space-y-4">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{city}</h3>
              <p className="text-sm text-slate-500">{items.length} properties available</p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
              City Wise
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {items.map((property) => {
              const favoriteActive = favorites.some((fav) => fav._id === property.id || fav.enquiry_id === property.id);
              const thumbs = property.photos.slice(0, 4);
              return (
                <div className="property-card-pro h-full flex flex-col" key={property.id}>
                  <a href={`property?id=${encodeURIComponent(property.id)}`} className="group block flex-grow">
                    <div className="property-image-wrap">
                      <img src={property.img} alt={property.name} className="w-full h-44 sm:h-52 object-cover" />
                      <button
                        type="button"
                        className={`favorite-btn absolute top-3 left-3 bg-white/95 hover:bg-red-50 p-2 rounded-full shadow-sm transition-colors ${favoriteActive ? "text-red-500" : "text-gray-600 hover:text-red-500"}`}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleFavoriteToggle(property);
                        }}
                        title="Add to favorites"
                      >
                        <i data-lucide="heart" className="w-4 h-4"></i>
                      </button>
                      {property.isVerified && (
                        <div className="absolute top-3 right-3 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <i data-lucide="shield-check" className="w-3.5 h-3.5"></i>
                          <span>Verified</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="property-chip">{property.propertyType}</span>
                        <p className="price-pill">â‚¹{property.rent}<span> / month</span></p>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{property.name}</h3>
                      <p className="mt-2 text-sm text-slate-600 flex items-start">
                        <i data-lucide="map-pin" className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0"></i>
                        <span className="line-clamp-1">{property.area}{property.city ? `, ${property.city}` : ""}</span>
                      </p>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center text-sm text-slate-600">
                          <i data-lucide="star" className="w-4 h-4 text-amber-500 fill-amber-500 mr-1"></i>
                          <span className="font-semibold text-slate-800">{property.rating}</span>
                          <span className="ml-1">({property.reviewsCount})</span>
                        </div>
                        <span className="text-xs text-slate-500">Updated listing</span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{`Vacant Rooms: ${property.vacantRooms}`}</span>
                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">{`Vacant Beds: ${property.vacantBeds}`}</span>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">{`Occupied Rooms: ${property.occupiedRooms}`}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{`Occupied Beds: ${property.occupiedBeds}`}</span>
                      </div>

                      {thumbs.length > 0 && (
                        <div className="mt-3 overflow-x-auto horizontal-slider flex gap-2 pb-1">
                          <div className="flex gap-2">
                            {thumbs.map((src, index) => (
                              <img key={`${property.id}-${index}`} src={src} className="h-20 w-28 object-cover rounded cursor-pointer" alt={property.name} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </a>

                  <div className="px-4 pb-4">
                    <a href={`property?id=${encodeURIComponent(property.id)}`} className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm">
                      <i data-lucide="message-square" className="w-4 h-4"></i>
                      View & Bid
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )),
    [cityWiseProperties, favorites]
  );

  const handleFilterChange = (field) => (event) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setFilters((prev) => ({ ...prev, search: prev.search }));
  };

  const handleFavoriteToggle = (property) => {
    if (!property?.id) return;
    const already = isFavoriteStored(property.id);
    if (already) {
      removeFavorite(property.id);
    } else {
      addFavorite({
        _id: property.id,
        enquiry_id: property.raw?.enquiry_id,
        property_name: property.name,
        property_image: property.img,
        city: property.city,
        location: property.city,
        locality: property.area,
        rent: property.rent,
        price: property.rent,
        property_type: property.propertyType,
        photos: property.photos,
        isVerified: property.isVerified,
        rating: property.rating,
        reviewsCount: property.reviewsCount
      });
    }
    setFavorites(loadFavorites());
  };

  const openBidModal = () => {
    if (filteredProperties.length === 0) {
      window.alert("No properties match your filters.");
      return;
    }
    if (!isWebsiteLoggedIn()) {
      window.location.href = "login";
      return;
    }
    setShowBidModal(true);
  };

  const handleFloatingBidClick = () => {
    setShowFloatingActions(false);
    setShowFloatingCoachmark(false);
    openBidModal();
  };

  const handleFloatingChatClick = () => {
    setShowFloatingActions(false);
    setShowFloatingCoachmark(false);
    window.location.href = "/website/websitechat";
  };

  const submitAllBids = async () => {
    if (!bidForm.name.trim() || !bidForm.email.trim() || !bidForm.bidMin || !bidForm.bidMax) {
      window.alert("Please fill name, email, and bid range.");
      return;
    }
    const user = getWebsiteUser();
    if (!user?.loginId) {
      window.location.href = "login";
      return;
    }
    let count = 0;
    for (const property of filteredProperties) {
      try {
        const raw = property.raw || {};
        const ownerId =
          raw.generatedCredentials?.loginId ||
          raw.ownerLoginId ||
          raw.createdBy ||
          raw.owner ||
          raw.propertyOwnerId ||
          raw.propertyInfo?.ownerId;
        if (!ownerId) continue;
        await fetch(`${apiUrl}/api/booking/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            property_id: raw._id || raw.enquiry_id || property.id,
            property_name: property.name,
            area: property.area,
            property_type: property.propertyType,
            rent_amount: parseInt(property.rent, 10),
            user_id: user.loginId,
            owner_id: ownerId,
            name: bidForm.name,
            email: bidForm.email,
            phone: "",
            request_type: "bid",
            message: bidForm.message || "",
            bid_min: parseInt(bidForm.bidMin, 10),
            bid_max: parseInt(bidForm.bidMax, 10),
            filter_criteria: {
              city: filters.cityName,
              area: filters.areaName,
              min_price: filters.minPrice,
              max_price: filters.maxPrice,
              gender: filters.gender,
              property_type: filters.propertyType,
              occupancy: filters.occupancy
            }
          })
        });
        count += 1;
      } catch {
        // ignore failures
      }
    }
    setSuccessCount(count);
    setShowBidModal(false);
    setShowBidSuccess(true);
  };

  useHtmlPage({
    title: "Roomhy - Stays, PGs & Hostels",
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
    "href": "/website/assets/css/ourproperty.css"
  }
],
    styles: [],
    scripts: [
      {
        "src": "https://cdn.tailwindcss.com"
      },
      {
        "src": "https://unpkg.com/lucide@latest"
      }
    ],
    inlineScripts: [
  "tailwind.config = {\r\n            theme: {\r\n                extend: {\r\n                    keyframes: {\r\n                        kenburns: {\r\n                            '0%': { transform: 'scale(1) translate(0, 0)' },\r\n                            '100%': { transform: 'scale(1.1) translate(-2%, 2%)' },\r\n                        }\r\n                    },\r\n                    animation: {\r\n                        kenburns: 'kenburns 30s ease-in-out infinite alternate',\r\n                    },\r\n                    colors: {\r\n                        // Custom colors from FilterSection.tsx context (approximated)\r\n                        'primary': '#3b82f6', // blue-500\r\n                        'secondary': '#e5e7eb', // gray-200\r\n                        'background': '#ffffff',\r\n                        'backgroundColor': '#3b82f6', // blue-600\r\n                        'backgroundColorHover': '#2563eb', // blue-700\r\n                    }\r\n                }\r\n            }\r\n        }"
]
  });

  return (
    <div className="html-page">
      
      
          <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-sm shadow-sm">
              <div className="container mx-auto px-4 sm:px-6">
                  <div className="flex h-20 items-center justify-between">
                      
                      <div className="flex items-center">
                          <a href="#" className="flex-shrink-0">
                              
                              <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-10 w-25" />
                          </a>
                      </div>
                      
                      <div className="flex items-center gap-3 sm:gap-6">
                          <nav className="hidden lg:flex items-center space-x-6">
                              <a href="/website/index" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Home</a>
                              <a href="/website/about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">About Us</a>
                              <a href="#faq" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">FAQ</a>
                              <a href="/website/contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contact</a>
                          </nav>
      
                          <a href="/website/list" className="flex-shrink-0 flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors w-10 h-10 sm:w-auto sm:h-auto sm:px-4">
                              <span className="text-3xl font-bold">+</span>
                          </a>
                          
                          <button id="menu-toggle" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                              <i data-lucide="menu" className="w-7 h-7 text-gray-800"></i>
                          </button>
                      </div>
      
                  </div>
              </div>
          </header>
      
          <section className="relative py-20 md:py-28 text-white">
              <div id="hero-image-wrapper" className="absolute inset-0 w-full h-full overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto:format&fit=crop" alt="Hero background 1" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-100" />
                  <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto:format&fit=crop" alt="Hero background 2" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-0" />
                  <img src="https://images.unsplash.com/photo-1494203484021-3c454daf695d?q=80&w=2070&auto:format&fit=crop" alt="Hero background 3" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-0" />
                  <div className="absolute inset-0 w-full h-full bg-black/60"></div> 
              </div>
              <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
                  <h1 className="text-3xl md:text-4xl font-bold text-shadow mb-6">Find your perfect stay</h1>
                  <form className="relative w-full max-w-2xl mx-auto" onSubmit={handleSearchSubmit}>
                      <input
                        type="text"
                        id="property-search-input"
                        placeholder="Search location e.g., 'Koramangala, Bangalore'"
                        className="w-full p-4 pl-5 pr-14 rounded-lg bg-white text-gray-900 border-transparent focus:ring-4 focus:ring-cyan-300/50 focus:outline-none placeholder-gray-500 shadow-lg"
                        value={filters.search}
                        onChange={handleFilterChange("search")}
                      />
                      <button type="submit" id="property-search-btn" className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                          <i data-lucide="search" className="w-5 h-5 text-white"></i>
                      </button>
                  </form>
              </div>
          </section>
      
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
                      <button onClick={() => window.globalLogout?.()} className="w-full flex items-center space-x-4 p-3 rounded-lg text-red-600 hover:bg-red-50">
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
                      <a href="/website/login" className="block w-full text-center bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                          <i data-lucide="log-in" className="w-4 h-4 inline mr-2"></i>
                          Login
                      </a>
                      <a href="/website/signup" className="block w-full text-center border-2 border-blue-600 text-blue-600 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
                          <i data-lucide="user-plus" className="w-4 h-4 inline mr-2"></i>
                          Sign Up
                      </a>
                  </div>
              </div>
          </div>
      
          {filters.cityName ? (
            <section id="top-cities-categories" className="container mx-auto px-4 sm:px-6 -mt-8 relative z-10">
              <div className="bg-white py-4 shadow-lg rounded-2xl city-filter-container overflow-hidden">
                <h2 className="sr-only">{filters.cityName} Areas</h2>
                <div id="cities-category-slider" className="flex gap-4 md:gap-8 pb-2 scroll-smooth px-4 horizontal-slider overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, areaId: "", areaName: "" }))}
                    className="group flex-shrink-0 w-28 space-y-2 text-center"
                  >
                    <div className={`relative mx-auto h-24 w-24 rounded-2xl overflow-hidden shadow-md transition-all duration-300 ${!filters.areaId ? "ring-4 ring-blue-500 shadow-blue-200" : "group-hover:shadow-lg"}`}>
                      {selectedCity?.imageUrl || selectedCity?.image || selectedCity?.photo ? (
                        <>
                          <img
                            src={selectedCity.imageUrl || selectedCity.image || selectedCity.photo}
                            alt={filters.cityName}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className={`absolute inset-0 ${!filters.areaId ? "bg-blue-900/35" : "bg-black/25"}`}></div>
                        </>
                      ) : (
                        <div className={`absolute inset-0 ${!filters.areaId ? "bg-gradient-to-br from-blue-600 to-cyan-500" : "bg-gradient-to-br from-slate-700 to-slate-500"} flex items-center justify-center`}>
                          <i data-lucide="grid-2x2" className="w-8 h-8 text-white"></i>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className={`text-sm font-semibold leading-tight ${!filters.areaId ? "text-blue-700" : "text-gray-800"}`}>All Areas</h4>
                      <p className="text-xs text-gray-500">{filters.cityName}</p>
                    </div>
                  </button>
                  {topAreas.map((area) => {
                    const areaValue = area._id || area.id || area.name;
                    const active = filters.areaId === areaValue;
                    const imageSrc = area.imageUrl || area.image || area.photo || "";
                    return (
                      <button
                        key={areaValue}
                        type="button"
                        onClick={() => setFilters((prev) => ({ ...prev, areaId: areaValue, areaName: area.name || "" }))}
                        className="group flex-shrink-0 w-28 space-y-2 text-center"
                      >
                        <div className={`relative mx-auto h-24 w-24 rounded-2xl overflow-hidden shadow-md transition-all duration-300 ${active ? "ring-4 ring-blue-500 shadow-blue-200" : "group-hover:shadow-lg"}`}>
                          {imageSrc ? (
                            <>
                              <img src={imageSrc} alt={area.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              <div className={`absolute inset-0 ${active ? "bg-blue-900/35" : "bg-black/25"}`}></div>
                            </>
                          ) : (
                            <div className={`absolute inset-0 ${active ? "bg-gradient-to-br from-blue-600 to-cyan-500" : "bg-gradient-to-br from-cyan-700 to-blue-500"} flex items-center justify-center`}>
                              <i data-lucide="map-pin" className="w-8 h-8 text-white"></i>
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-black/45 px-2 py-1">
                            <span className="block truncate text-[10px] font-semibold text-white">{area.name}</span>
                          </div>
                        </div>
                        <div>
                          <h4 className={`text-sm font-semibold leading-tight ${active ? "text-blue-700" : "text-gray-800"}`}>{area.name}</h4>
                          <p className="text-xs text-gray-500">{filters.cityName}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}

          <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12 mt-8">
              
               <div className="mb-6 lg:hidden results-toolbar">
                  <div className="flex justify-between items-center mb-4">
                      <h2 id="mobile-property-count" className="text-xl font-bold text-gray-900">{propertyCountLabel}</h2>
                      <span className="text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1 rounded-md">Page 1 of 1</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      <button id="filter-toggle" className="flex-shrink-0 flex items-center justify-center space-x-2 bg-white text-gray-700 font-medium px-4 py-3 rounded-lg shadow border border-gray-300" onClick={() => setShowFilterDrawer(true)}>
                          <i data-lucide="filter" className="w-5 h-5"></i>
                          <span>Filters</span>
                      </button>
                      <div className="flex-grow">
                           <label htmlFor="sort-mobile" className="sr-only">Sort by</label>
                          <select id="sort-mobile" name="sort-mobile" className="form-select w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 py-3 h-full">
                              <option>Sort by</option>
                              <option>Bidding: Ending Soonest</option>
                              <option>Price: Low to High</option>
                              <option>Price: High to Low</option>
                              <option>Newest Listings</option>
                          </select>
                      </div>
                  </div>
              </div>
      
              <div id="filter-overlay" className={`fixed inset-0 bg-black/50 z-40 lg:hidden ${showFilterDrawer ? "block" : "hidden"}`} onClick={() => setShowFilterDrawer(false)}></div>
      
              
              <div id="mobile-filter-drawer" className={`fixed top-0 right-0 w-full max-w-full h-full bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden overflow-hidden filter-shell ${showFilterDrawer ? "translate-x-0" : "translate-x-full"}`}>
                  
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center shadow-sm bg-white/80 backdrop-blur-md sticky top-0 z-10">
                      <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl shadow-lg shadow-blue-200">
                              <i data-lucide="filter" className="w-5 h-5 text-white"></i>
                          </div>
                          <div>
                              <h3 className="text-xl font-bold text-gray-900">Find Your Stay</h3>
                              <p className="text-xs text-gray-500">Filter & Bid on Properties</p>
                          </div>
                      </div>
                      <button id="close-filter-mobile" className="p-2.5 bg-slate-100 hover:bg-slate-200 text-gray-600 hover:text-gray-800 rounded-xl transition-all" onClick={() => setShowFilterDrawer(false)}>
                          <i data-lucide="x" className="w-6 h-6"></i>
                      </button>
                  </div>
                  
                  <div className="p-5 h-full overflow-y-auto pb-28 space-y-5">
                      
                      
                      <div className="filter-block p-4">
                          <div className="flex items-center gap-2 mb-4">
                              <i data-lucide="map-pin" className="w-5 h-5 text-blue-600"></i>
                              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Location</h4>
                          </div>
                          
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select City</label>
                                  <select
                                    id="mobile-select-city"
                                    className="form-select w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 py-3 px-4 bg-slate-50 transition-all"
                                    value={filters.cityId}
                                    onChange={handleFilterChange("cityId")}
                                  >
                                      <option value="">Select a city</option>
                                      {cities.map((city) => (
                                        <option key={city._id || city.id || city.name} value={city._id || city.id || city.name}>
                                          {city.name}{city.state ? `, ${city.state}` : ""}
                                        </option>
                                      ))}
                                  </select>
                              </div>
      
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Area</label>
                                  <select
                                    id="mobile-select-area"
                                    className="form-select w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 py-3 px-4 bg-slate-50 transition-all"
                                    value={filters.areaId}
                                    onChange={handleFilterChange("areaId")}
                                  >
                                      <option value="">{filters.cityId ? "Select an area" : "First select a city"}</option>
                                      {areas.map((area) => (
                                        <option key={area._id || area.id || area.name} value={area._id || area.id || area.name}>
                                          {area.name}
                                        </option>
                                      ))}
                                  </select>
                              </div>
                          </div>
                      </div>
      
                      
                      <div className="filter-block p-4">
                          <div className="flex items-center gap-2 mb-4">
                              <i data-lucide="wallet" className="w-5 h-5 text-emerald-600"></i>
                              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Budget Range</h4>
                          </div>
                          
                          <div className="flex gap-3">
                              <select id="mobile-min-price" className="form-select w-1/2 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 py-3 px-4 bg-slate-50 transition-all" value={filters.minPrice} onChange={handleFilterChange("minPrice")}>
                                  <option value>Min Price</option>
                                  <option value="1500">₹1500</option>
                                  <option value="4000">₹4000</option>
                                  <option value="8000">₹8000</option>
                              </select>
                              <select id="mobile-max-price" className="form-select w-1/2 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 py-3 px-4 bg-slate-50 transition-all" value={filters.maxPrice} onChange={handleFilterChange("maxPrice")}>
                                  <option value="50000_plus">Max Price</option>
                                  <option value="15000">₹15000</option>
                                  <option value="25000">₹25000</option>
                                  <option value="50000_plus">₹50000+</option>
                              </select>
                          </div>
                      </div>
      
                      
                      <div className="filter-block p-4">
                          <div className="flex items-center gap-2 mb-4">
                              <i data-lucide="home" className="w-5 h-5 text-purple-600"></i>
                              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Property Details</h4>
                          </div>
                          
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                                  <select id="mobile-gender" className="form-select w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 py-3 px-4 bg-slate-50 transition-all" value={filters.gender} onChange={handleFilterChange("gender")}>
                                      <option value="">Select Gender</option>
                                      <option value="male">Male</option>
                                      <option value="female">Female</option>
                                      <option value="other">Other</option>
                                  </select>
                              </div>
      
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
                                  <select id="mobile-property-type" className="form-select w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 py-3 px-4 bg-slate-50 transition-all" value={filters.propertyType} onChange={handleFilterChange("propertyType")}>
                                      <option value="">Select Property Type</option>
                                      <option value="pg">PG / Co-Living</option>
                                      <option value="hostel">Hostel</option>
                                      <option value="flat">Flat / Studio</option>
                                  </select>
                              </div>
      
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room Sharing</label>
                                  <select id="mobile-occupancy" className="form-select w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 py-3 px-4 bg-slate-50 transition-all" value={filters.occupancy} onChange={handleFilterChange("occupancy")}>
                                      <option value="">Select Occupancy</option>
                                      <option value="single">Single Room</option>
                                      <option value="double">Double Sharing</option>
                                      <option value="triple">Triple Sharing</option>
                                      <option value="multi">Multi Sharing</option>
                                  </select>
                              </div>
                          </div>
                      </div>
      
                      
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                          <div className="flex items-center gap-2 mb-4">
                              <i data-lucide="trending-up" className="w-5 h-5 text-green-600"></i>
                              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Bidding Details</h4>
                          </div>
                          
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Bid Amount Range</label>
                                  <div className="flex gap-3">
                                      <input type="number" id="mobile-bid-min" placeholder="Min" className="form-input w-1/2 rounded-xl border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 py-3 px-4 bg-white transition-all" min="1000" max="100000" value={bidForm.bidMin} onChange={(event) => setBidForm((prev) => ({ ...prev, bidMin: event.target.value }))} />
                                      <input type="number" id="mobile-bid-max" placeholder="Max" className="form-input w-1/2 rounded-xl border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 py-3 px-4 bg-white transition-all" min="1000" max="100000" value={bidForm.bidMax} onChange={(event) => setBidForm((prev) => ({ ...prev, bidMax: event.target.value }))} />
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">Set your bidding range</p>
                              </div>
      
                              <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Additional Notes</label>
                                  <textarea id="mobile-bid-message" placeholder="Share your requirements..." className="form-input w-full rounded-xl border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 py-3 px-4 h-20 resize-none bg-white transition-all" maxLength="500" value={bidForm.message} onChange={(event) => setBidForm((prev) => ({ ...prev, message: event.target.value }))}></textarea>
                              </div>
                          </div>
                      </div>
      
                      
                      <div className="flex flex-col gap-3 pt-2">
                          <button id="mobile-bid-on-all" className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2" onClick={openBidModal}>
                              <i data-lucide="send" className="w-5 h-5"></i>
                              Bid on All Matches
                          </button>
                          <button id="mobile-apply-filters" className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2" onClick={() => setShowFilterDrawer(false)}>
                              <i data-lucide="check" className="w-5 h-5"></i>
                              Apply Filters
                          </button>
                          <button className="w-full bg-white border-2 border-slate-200 text-gray-700 hover:border-slate-300 hover:bg-slate-50 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2" onClick={() => setFilters((prev) => ({ ...prev, cityId: "", cityName: "", areaId: "", areaName: "", minPrice: "", maxPrice: "", gender: "", propertyType: "", occupancy: "", search: "" }))}>
                              <i data-lucide="refresh-cw" className="w-5 h-5"></i>
                              Clear Filters
                          </button>
                      </div>
                  </div>
              </div>
      
      
              <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                  
                  
                  <aside id="filter-sidebar" className="lg:col-span-3 lg:sticky h-fit mb-8 lg:mb-0 hidden lg:block p-5 transition-all duration-300 top-[150px] filter-shell">
                      
                      <div className="mb-6 pb-4 border-b border-slate-200">
                          <div className="flex items-center gap-3 mb-2">
                              <div className="p-2.5 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl shadow-lg shadow-blue-200">
                                  <i data-lucide="filter" className="w-5 h-5 text-white"></i>
                              </div>
                              <div>
                                  <h3 className="text-xl font-bold text-gray-900">Filter & Search</h3>
                                  <p className="text-xs text-gray-500 mt-0.5">Refine your property search</p>
                              </div>
                          </div>
                      </div>
                      
                      <div className="space-y-5">
                          
                          
                          <div className="filter-block p-4">
                              <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <i data-lucide="map-pin" className="w-4 h-4 text-blue-600"></i>
                                  Location
                              </label>
                              <select id="desktop-select-city" className="form-select w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 py-3 px-4 bg-slate-50 transition-all text-sm" value={filters.cityId} onChange={handleFilterChange("cityId")}>
                                  <option value="">Select a city</option>
                                  {cities.map((city) => (
                                    <option key={city._id || city.id || city.name} value={city._id || city.id || city.name}>
                                      {city.name}{city.state ? `, ${city.state}` : ""}
                                    </option>
                                  ))}
                              </select>
                              <select id="desktop-select-area" className="form-select w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 py-3 px-4 bg-slate-50 transition-all text-sm mt-3" value={filters.areaId} onChange={handleFilterChange("areaId")}>
                                  <option value="">{filters.cityId ? "Select an area" : "First select a city"}</option>
                                  {areas.map((area) => (
                                    <option key={area._id || area.id || area.name} value={area._id || area.id || area.name}>
                                      {area.name}
                                    </option>
                                  ))}
                              </select>
                          </div>
      
                          
                          <div className="filter-block p-4">
                              <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <i data-lucide="wallet" className="w-4 h-4 text-emerald-600"></i>
                                  Budget Range
                              </label>
                              <div className="flex gap-3">
                                  <select id="desktop-min-price" className="form-select w-1/2 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 py-3 px-4 bg-slate-50 transition-all text-sm" value={filters.minPrice} onChange={handleFilterChange("minPrice")}>
                                      <option value>Min Price</option>
                                      <option value="1500">₹1500</option>
                                      <option value="4000">₹4000</option>
                                      <option value="8000">₹8000</option>
                                  </select>
                                  <select id="desktop-max-price" className="form-select w-1/2 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 py-3 px-4 bg-slate-50 transition-all text-sm" value={filters.maxPrice} onChange={handleFilterChange("maxPrice")}>
                                      <option value="50000_plus">Max Price</option>
                                      <option value="15000">₹15000</option>
                                      <option value="25000">₹25000</option>
                                      <option value="50000_plus">₹50000+</option>
                                  </select>
                              </div>
                          </div>
      
                          
                          <div className="filter-block p-4">
                              <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <i data-lucide="home" className="w-4 h-4 text-purple-600"></i>
                                  Property Details
                              </label>
                              <select id="desktop-gender" className="form-select w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 py-3 px-4 bg-slate-50 transition-all text-sm mb-3" value={filters.gender} onChange={handleFilterChange("gender")}>
                                  <option value="">Select Gender</option>
                                  <option value="male">Male</option>
                                  <option value="female">Female</option>
                                  <option value="other">Other</option>
                              </select>
                              <select id="desktop-property-type" className="form-select w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 py-3 px-4 bg-slate-50 transition-all text-sm mb-3" value={filters.propertyType} onChange={handleFilterChange("propertyType")}>
                                  <option value="">Select Property Type</option>
                                  <option value="pg">PG / Co-Living</option>
                                  <option value="hostel">Hostel</option>
                                  <option value="flat">Flat / Studio</option>
                              </select>
                              <select id="desktop-occupancy" className="form-select w-full rounded-xl border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 py-3 px-4 bg-slate-50 transition-all text-sm" value={filters.occupancy} onChange={handleFilterChange("occupancy")}>
                                  <option value="">Select Occupancy</option>
                                  <option value="single">Single Room</option>
                                  <option value="double">Double Sharing</option>
                                  <option value="triple">Triple Sharing</option>
                                  <option value="multi">Multi Sharing</option>
                              </select>
                          </div>
      
                          
                          <div className="space-y-4 pt-6 border-t border-blue-200 mt-6">
                              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                  <i data-lucide="trending-up" className="w-4 h-4 text-green-600"></i>
                                  Bidding Details
                              </h4>
      
                              <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Bid Amount Range</label>
                                  <div className="flex gap-3">
                                      <input type="number" id="desktop-bid-min" placeholder="Min" className="form-input w-1/2 rounded-lg border border-gray-300 bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/50 py-3 px-4 text-sm font-medium transition-all" min="1000" max="100000" value={bidForm.bidMin} onChange={(event) => setBidForm((prev) => ({ ...prev, bidMin: event.target.value }))} />
                                      <input type="number" id="desktop-bid-max" placeholder="Max" className="form-input w-1/2 rounded-lg border border-gray-300 bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/50 py-3 px-4 text-sm font-medium transition-all" min="1000" max="100000" value={bidForm.bidMax} onChange={(event) => setBidForm((prev) => ({ ...prev, bidMax: event.target.value }))} />
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">Set your bidding range</p>
                              </div>
      
                              <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Additional Notes</label>
                                  <textarea id="desktop-bid-message" placeholder="Share your requirements..." className="form-input w-full rounded-lg border border-gray-300 bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/50 py-3 px-4 h-20 resize-none text-sm font-medium transition-all" maxLength="500" value={bidForm.message} onChange={(event) => setBidForm((prev) => ({ ...prev, message: event.target.value }))}></textarea>
                              </div>
                          </div>
      
                          
                          <div className="flex flex-col gap-3 pt-6 mt-6 border-t border-blue-200">
                              <button id="desktop-bid-on-all" className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2" onClick={openBidModal}>
                                  <i data-lucide="send" className="w-5 h-5"></i>
                                  Bid on All Matches
                              </button>
                              <button id="desktop-apply-filters" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2">
                                  <i data-lucide="check" className="w-5 h-5"></i>
                                  Apply Filters
                              </button>
                              <button className="w-full border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 bg-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2">
                                  <i data-lucide="refresh-cw" className="w-5 h-5"></i>
                                  Clear Filters
                              </button>
                          </div>
                      </div>
                  </aside>
      
                  <div id="main-content-area" className="lg:col-span-9"> 
                       
                       <div className="hidden lg:flex items-center justify-between mb-6 results-toolbar">
                          <div className="flex items-center gap-4">
                              <h2 id="desktop-property-count" className="text-3xl font-bold text-gray-900">{propertyCountLabel}</h2>
                              <span className="text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1 rounded-md">Page 1 of 1</span>
                          </div>
                          <div className="flex items-center gap-4">
                              <button id="filter-toggle-desktop" className="flex-shrink-0 flex items-center justify-center space-x-2 bg-blue-50 text-blue-600 font-medium px-4 py-3 rounded-lg shadow-sm border border-gray-300 hover:bg-gray-50 transition-colors">
                                  <i data-lucide="filter" className="w-5 h-5"></i>
                                  <span>Filters</span>
                              </button>
                               <div>
                                   <label htmlFor="sort-desktop" className="sr-only">Sort by</label>
                                  <select id="sort-desktop" name="sort-desktop" className="form-select w-full sm:w-auto rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3">
                                      <option>Sort by</option>
                                      <option>Bidding: Ending Soonest</option>
                                      <option>Price: Low to High</option>
                                      <option>Price: High to Low</option>
                                      <option>Newest Listings</option>
                                  </select>
                              </div>
                          </div>
                      </div>
      
                      <div id="stays-list-view">
                          <section>
                              <div id="propertiesGrid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                                  {filteredProperties.map((property) => {
                                    const favoriteActive = favorites.some((fav) => fav._id === property.id || fav.enquiry_id === property.id);
                                    const thumbs = property.photos.slice(0, 4);
                                    return (
                                      <div className="property-card-pro h-full flex flex-col" key={property.id}>
                                        <a href={`property?id=${encodeURIComponent(property.id)}`} className="group block flex-grow">
                                          <div className="property-image-wrap">
                                            <img src={property.img} alt={property.name} className="w-full h-44 sm:h-52 object-cover" />
                                            <button
                                              type="button"
                                              className={`favorite-btn absolute top-3 left-3 bg-white/95 hover:bg-red-50 p-2 rounded-full shadow-sm transition-colors ${favoriteActive ? "text-red-500" : "text-gray-600 hover:text-red-500"}`}
                                              onClick={(event) => {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                handleFavoriteToggle(property);
                                              }}
                                              title="Add to favorites"
                                            >
                                              <i data-lucide="heart" className="w-4 h-4"></i>
                                            </button>
                                            {property.isVerified && (
                                              <div className="absolute top-3 right-3 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                                                <i data-lucide="shield-check" className="w-3.5 h-3.5"></i>
                                                <span>Verified</span>
                                              </div>
                                            )}
                                          </div>

                                          <div className="p-4">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                              <span className="property-chip">{property.propertyType}</span>
                                              <p className="price-pill">₹{property.rent}<span> / month</span></p>
                                            </div>

                                            <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{property.name}</h3>
                                            <p className="mt-2 text-sm text-slate-600 flex items-start">
                                              <i data-lucide="map-pin" className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0"></i>
                                              <span className="line-clamp-1">{property.area}{property.city ? `, ${property.city}` : ""}</span>
                                            </p>

                                            <div className="mt-3 flex items-center justify-between">
                                              <div className="flex items-center text-sm text-slate-600">
                                                <i data-lucide="star" className="w-4 h-4 text-amber-500 fill-amber-500 mr-1"></i>
                                                <span className="font-semibold text-slate-800">{property.rating}</span>
                                                <span className="ml-1">({property.reviewsCount})</span>
                                              </div>
                                              <span className="text-xs text-slate-500">Updated listing</span>
                                            </div>

                                            {thumbs.length > 0 && (
                                              <div className="mt-3 overflow-x-auto horizontal-slider flex gap-2 pb-1">
                                                <div className="flex gap-2">
                                                  {thumbs.map((src, index) => (
                                                    <img key={`${property.id}-${index}`} src={src} className="h-20 w-28 object-cover rounded cursor-pointer" alt={property.name} />
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </a>

                                        <div className="px-4 pb-4">
                                          <a href={`property?id=${encodeURIComponent(property.id)}`} className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm">
                                            <i data-lucide="message-square" className="w-4 h-4"></i>
                                            View & Bid
                                          </a>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                              <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0 mt-12 pt-8">
                                  <div className="flex-1 flex justify-between sm:hidden"> <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"> Previous </a> <a href="#" className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"> Next </a></div>
                                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                      <div><p className="text-sm text-gray-700">Showing <span id="showingFrom" className="font-medium">{filteredProperties.length > 0 ? 1 : 0}</span> to <span id="showingTo" className="font-medium">{filteredProperties.length}</span> of <span id="showingTotal" className="font-medium">{filteredProperties.length}</span> results</p></div>
                                      <div><nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination"><a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"><span className="sr-only">Previous</span><i data-lucide="chevron-left" className="h-5 w-5"></i></a><a href="#" aria-current="page" className="z-10 bg-blue-50 border-blue-500 text-blue-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"> 1 </a><a href="#" className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"> 2 </a><a href="#" className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hidden md:inline-flex relative items-center px-4 py-2 border text-sm font-medium"> 3 </a><span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"> ... </span><a href="#" className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hidden md:inline-flex relative items-center px-4 py-2 border text-sm font-medium"> 8 </a><a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"><span className="sr-only">Next</span><i data-lucide="chevron-right" className="h-5 w-5"></i></a></nav></div>
                                  </div>
                              </nav>
                          </section>
                      </div>
      
                  </div>
      
              </div>
      
          </main>
      
          <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3" data-floating-actions>
              {showFloatingCoachmark && (
                  <div className="relative max-w-[240px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-2xl">
                      <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 border-b border-r border-slate-200 bg-white"></div>
                      <div className="flex items-start gap-3">
                          <span className="text-2xl animate-bounce">👆</span>
                          <p className="leading-5">
                              <span className="block font-semibold text-slate-900">Need help choosing?</span>
                              Bid on your budget or chat to explore more.
                          </p>
                      </div>
                  </div>
              )}

              {showFloatingActions && (
                  <div className="w-[250px] rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur">
                      <button
                          type="button"
                          onClick={handleFloatingBidClick}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-emerald-50"
                      >
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                              <i data-lucide="badge-indian-rupee" className="h-5 w-5"></i>
                          </span>
                          <span>
                              <span className="block text-sm font-semibold text-slate-900">Bid on your budget</span>
                              <span className="block text-xs text-slate-500">Send your budget to matching owners</span>
                          </span>
                      </button>

                      <button
                          type="button"
                          onClick={handleFloatingChatClick}
                          className="mt-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-sky-50"
                      >
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                              <i data-lucide="message-circle-more" className="h-5 w-5"></i>
                          </span>
                          <span>
                              <span className="block text-sm font-semibold text-slate-900">Chat to explore more</span>
                              <span className="block text-xs text-slate-500">Talk to us before you decide</span>
                          </span>
                      </button>
                  </div>
              )}

              <button
                  id="websiteChatBtn"
                  type="button"
                  aria-label="Open bidding and chat options"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowFloatingCoachmark(false);
                    setShowFloatingActions((prev) => !prev);
                  }}
                  className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-[0_20px_45px_rgba(34,197,94,0.35)] transition duration-300 hover:bg-green-600 ${showFloatingCoachmark ? "animate-pulse scale-110" : "hover:scale-110"}`}
              >
                  {showFloatingCoachmark && <span className="absolute -top-1 right-0 h-3.5 w-3.5 rounded-full bg-amber-300 ring-4 ring-white"></span>}
                  <i data-lucide="message-circle" className="w-8 h-8"></i>
              </button>
          </div>
          
          <footer className="bg-gray-800 text-gray-300">
              <div className="container mx-auto px-6 py-16">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
                      <div className="md:col-span-1"><a href="/website/index" className="mb-4 inline-block"><img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-10 w-25" /></a><p className="text-gray-400 text-sm">Your trusted partner in finding the perfect student accommodation. Live, learn, and grow with us.</p><div className="flex space-x-5 mt-6"><a href="#" className="text-gray-400 hover:text-white transition-colors"><i data-lucide="facebook" className="w-5 h-5"></i></a><a href="#" className="text-gray-400 hover:text-white transition-colors"><i data-lucide="instagram" className="w-5 h-5"></i></a><a href="#" className="text-gray-400 hover:text-white transition-colors"><i data-lucide="twitter" className="w-5 h-5"></i></a></div></div>
                      <div><h4 className="font-semibold text-lg mb-5 text-white">Explore</h4><ul className="space-y-3"><li><a href="#" className="text-gray-300 hover:text-white transition-colors">Apartments</a></li><li><a href="#" className="text-gray-300 hover:text-white transition-colors">Hostels</a></li><li><a href="#" className="text-gray-300 hover:text-white transition-colors">Co-Living</a></li><li><a href="#" className="text-gray-300 hover:text-white transition-colors">PGs</a></li></ul></div>
                      <div><h4 className="font-semibold text-lg mb-5 text-white">Company</h4><ul className="space-y-3"><li><a href="/website/about" className="text-gray-300 hover:text-white transition-colors">About Us</a></li><li><a href="/website/list" className="text-gray-300 hover:text-white transition-colors">List Your Property</a></li><li><a href="/website/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li><li><a href="/website/terms" className="text-gray-300 hover:text-white transition-colors">Terms of Service</a></li></ul></div>
                      
                      <div>
                          <h4 className="font-semibold text-lg mb-5 text-white">Get in Touch</h4>
                          <ul className="space-y-3">
                              <li className="flex items-start space-x-2">
                                  <i data-lucide="mail" className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0"></i>
                                  <a href="mailto:support@roomhy.com" className="text-gray-300 hover:text-white transition-colors">support@roomhy.com</a>
                              </li>
                              <li className="flex items-start space-x-2">
                                  <i data-lucide="phone" className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0"></i>
                                  <a href="tel:+911234567890" className="text-gray-300 hover:text-white transition-colors">+91 12345 67890</a>
                              </li>
                              <li className="flex items-start space-x-2">
                                  <i data-lucide="map-pin" className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0"></i>
                                  <span className="text-gray-300">Bengaluru, India</span>
                              </li>
                          </ul>
                      </div>
                  </div>
                  <div className="mt-12 border-t border-gray-700 pt-8 text-center text-gray-400 text-sm"><p>&copy; 2025 Roomhy. All Rights Reserved. Built with ❤️ for students.</p></div>
              </div>
          </footer>
      
          
          <div id="bid-on-all-modal" className={`fixed inset-0 bg-black/50 ${showBidModal ? "flex" : "hidden"} items-center justify-center z-50 p-4 overflow-y-auto`}>
              <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8" onClick={(event) => event.stopPropagation()}>
                  
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-5 rounded-t-2xl">
                      <div className="flex justify-between items-center">
                          <div>
                              <h2 className="text-xl font-bold flex items-center gap-2">
                                  <i data-lucide="send" className="w-5 h-5"></i>
                                  Bid on All Matching Properties
                              </h2>
                              <p className="text-green-100 text-sm mt-1">Send your bid to all properties matching your criteria</p>
                          </div>
                          <button id="close-request-all-modal" onClick={() => setShowBidModal(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10">
                              <i data-lucide="x" className="w-6 h-6"></i>
                          </button>
                      </div>
                  </div>
      
                  
                  <div className="p-6 space-y-5">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-semibold text-gray-800 mb-2">Full Name *</label>
                              <input type="text" id="bid-full-name" placeholder="Enter your full name" className="form-input w-full rounded-lg border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/50" required value={bidForm.name} onChange={(event) => setBidForm((prev) => ({ ...prev, name: event.target.value }))} />
                          </div>
                          <div>
                              <label className="block text-sm font-semibold text-gray-800 mb-2">Email Address *</label>
                              <input type="email" id="bid-email" placeholder="your.email@gmail.com" className="form-input w-full rounded-lg border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/50" required value={bidForm.email} onChange={(event) => setBidForm((prev) => ({ ...prev, email: event.target.value }))} />
                          </div>
                      </div>
      
                      
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                              <i data-lucide="filter" className="w-4 h-4"></i>
                              Your Search Criteria
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                  <span className="text-green-700">City:</span>
                                  <span id="bid-city-display" className="text-green-900 font-medium">{filters.cityName || "-"}</span>
                              </div>
                              <div>
                                  <span className="text-green-700">Area:</span>
                                  <span id="bid-area-display" className="text-green-900 font-medium">{filters.areaName || "-"}</span>
                              </div>
                              <div>
                                  <span className="text-green-700">Budget:</span>
                                  <span id="bid-budget-display" className="text-green-900 font-medium">{filters.minPrice || filters.maxPrice ? `${filters.minPrice || "0"} - ${filters.maxPrice || "∞"}` : "-"}</span>
                              </div>
                              <div>
                                  <span className="text-green-700">Gender:</span>
                                  <span id="bid-gender-display" className="text-green-900 font-medium">{filters.gender || "-"}</span>
                              </div>
                          </div>
                      </div>
      
                      
                      <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <i data-lucide="home" className="w-4 h-4"></i>
                              Matching Properties
                          </h4>
                          {loadingProperties && (
                            <div id="bid-properties-loading" className="flex items-center justify-center py-8">
                              <div className="animate-spin">
                                <i data-lucide="loader" className="w-6 h-6 text-green-600"></i>
                              </div>
                              <span className="ml-2 text-gray-600">Finding matching properties...</span>
                            </div>
                          )}
                          {!loadingProperties && filteredProperties.length > 0 && (
                            <div id="bid-properties-list" className="space-y-2 max-h-60 overflow-y-auto">
                              {filteredProperties.map((property) => (
                                <div key={`bid-${property.id}`} className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-sm">
                                  <span className="font-medium text-green-900">{property.name}</span>
                                  <span className="text-green-700">₹{property.rent}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {!loadingProperties && filteredProperties.length === 0 && (
                            <div id="bid-no-properties" className="text-center py-8 text-gray-500">
                              <i data-lucide="inbox" className="w-10 h-10 mx-auto mb-2 text-gray-300"></i>
                              <p>No properties match your criteria</p>
                            </div>
                          )}
                      </div>
      
                      
                      <button id="submit-all-bids-btn" onClick={submitAllBids} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                          <i data-lucide="send" className="w-5 h-5"></i>
                          <span>Send Bids to All (<span id="bid-count">{filteredProperties.length}</span> Properties)</span>
                      </button>
                  </div>
              </div>
          </div>
      
          
          <div id="bid-success-modal" className={`fixed inset-0 bg-black/50 ${showBidSuccess ? "flex" : "hidden"} items-center justify-center z-[60] p-4`}>
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center" onClick={(event) => event.stopPropagation()}>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i data-lucide="check-circle" className="w-8 h-8 text-green-600"></i>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Bids Sent Successfully!</h2>
                  <p className="text-gray-600 text-sm mb-4">Your bid has been sent to all matching property owners.</p>
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <p className="text-sm text-gray-600"><strong>Bids sent to:</strong> <span id="bid-success-count">{successCount}</span> properties</p>
                      <p className="text-xs text-gray-500 mt-2">Property owners will review your bid and respond within 24 hours.</p>
                  </div>
                  <button onClick={() => setShowBidSuccess(false)} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 rounded-lg">
                      Done
                  </button>
              </div>
          </div>
      
      
          
      
          
          <div id="request-all-modal" className="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 md:p-8 animate-fade-in my-8">
                  <div className="flex justify-between items-center mb-6 border-b-2 border-blue-200 pb-4">
                      <div>
                          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                              <i data-lucide="send" className="w-7 h-7 text-blue-600"></i>
                              Submit Your Bidding Request
                          </h2>
                          <p className="text-sm text-gray-600 mt-1">Send your requirements to <span id="property-count" className="font-bold text-blue-600">0</span> matching properties</p>
                      </div>
                      <button id="close-request-all-modal" className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg">
                          <i data-lucide="x" className="w-6 h-6"></i>
                      </button>
                  </div>
      
                  <form id="request-all-form" className="space-y-6">
                      
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-l-4 border-blue-500">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <i data-lucide="user-check" className="w-5 h-5 text-blue-600"></i>
                              Your Information
                          </h3>
                          <div className="space-y-4">
                              <div>
                                  <label htmlFor="request-all-name" className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                                  <input type="text" id="request-all-name" placeholder="Enter your full name" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium" required />
                              </div>
                              <div>
                                  <label htmlFor="request-all-email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                                  <input type="email" id="request-all-email" placeholder="your.email@example.com" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium" required />
                              </div>
                          </div>
                      </div>
      
                      
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-l-4 border-purple-500">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <i data-lucide="dollar-sign" className="w-5 h-5 text-purple-600"></i>
                              Your Bid Range (₹)
                          </h3>
                          <div className="flex gap-3">
                              <div className="flex-1">
                                  <label htmlFor="request-all-bid-min" className="block text-sm font-semibold text-gray-700 mb-2">Minimum *</label>
                                  <input type="number" id="request-all-bid-min" placeholder="Min amount" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" min="1000" required />
                              </div>
                              <div className="flex-1">
                                  <label htmlFor="request-all-bid-max" className="block text-sm font-semibold text-gray-700 mb-2">Maximum *</label>
                                  <input type="number" id="request-all-bid-max" placeholder="Max amount" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" min="1000" required />
                              </div>
                          </div>
                      </div>
      
                      
                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border-l-4 border-orange-500">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <i data-lucide="message-square" className="w-5 h-5 text-orange-600"></i>
                              Your Message
                          </h3>
                          <textarea id="request-all-message" placeholder="Tell property owners about your requirements, preferences, move-in date, lease duration, special requests, etc." className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 h-24 resize-none font-medium"></textarea>
                          <p className="text-xs text-gray-500 mt-2">💡 Include details like: move-in date, lease duration, special requirements, preferred amenities</p>
                      </div>
      
                      
                      <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                          <p className="text-sm text-gray-700 flex items-start gap-3">
                              <i data-lucide="info" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"></i>
                              <span><strong>How it works:</strong> Your request will be sent to all matching property owners. They will review your requirements and contact you directly with suitable options. You can expect responses within 24-48 hours.</span>
                          </p>
                      </div>
      
                      
                      <div className="flex gap-3 mt-8 pt-4 border-t-2 border-gray-200">
                          <button type="button" id="close-request-all-modal-btn" className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors text-lg">
                              Cancel
                          </button>
                          <button type="button" id="submit-request-all" className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl text-lg flex items-center justify-center gap-2">
                              <i data-lucide="send" className="w-5 h-5"></i>
                              Send Requests
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      
          <style>
              @keyframes fade-in {"{"}
                  from {"{"} opacity: 0; transform: scale(0.95); {"}"}
                  to {"{"} opacity: 1; transform: scale(1); {"}"}
              {"}"}
              .animate-fade-in {"{"}
                  animation: fade-in 0.3s ease-out;
              {"}"}
          </style>
      
    </div>
  );
}


