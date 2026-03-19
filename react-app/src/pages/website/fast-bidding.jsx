import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import {
  getWebsiteApiUrl,
  getWebsiteUser,
  getWebsiteUserEmail,
  getWebsiteUserId,
  getWebsiteUserName,
  isWebsiteLoggedIn
} from "../../utils/websiteSession";
import { useLucideIcons, useWebsiteCommon } from "../../utils/websiteUi";

const defaultCities = [
  { _id: "kota", name: "Kota, Rajasthan" },
  { _id: "indore", name: "Indore, Madhya Pradesh" },
  { _id: "sikar", name: "Sikar, Rajasthan" },
  { _id: "pune", name: "Pune, Maharashtra" },
  { _id: "delhi", name: "Delhi" }
];

const fallbackAreasByCity = {
  "6971cb61d151f66921db15b6": [{ _id: "syr", name: "SYR" }],
  "6970d2d7b000ee27c1347749": [{ _id: "mtr", name: "MTR" }],
  "696fa3712ee84dada0b0a5e8": [{ _id: "ktc", name: "KTC" }, { _id: "tvk", name: "TVK Nagar" }],
  kota: [{ _id: "east", name: "East Kota" }, { _id: "west", name: "West Kota" }, { _id: "central", name: "Central Kota" }],
  indore: [{ _id: "vijay", name: "Vijay Nagar" }, { _id: "palasia", name: "Palasia" }, { _id: "mg", name: "MG Road" }],
  sikar: [{ _id: "market", name: "Market Area" }, { _id: "civil", name: "Civil Lines" }],
  pune: [{ _id: "hinjawadi", name: "Hinjawadi" }, { _id: "baner", name: "Baner" }, { _id: "kharadi", name: "Kharadi" }],
  delhi: [{ _id: "campus", name: "North Campus" }, { _id: "south", name: "South Delhi" }]
};

export default function WebsiteFastBidding() {
  useWebsiteCommon();

  const apiUrl = useMemo(() => getWebsiteApiUrl(), []);
  const [citiesData, setCitiesData] = useState([]);
  const [areasData, setAreasData] = useState([]);
  const [propertiesData, setPropertiesData] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  const [form, setForm] = useState({
    fullName: "",
    gmail: "",
    gender: "",
    city: "",
    area: "",
    minPrice: "",
    maxPrice: ""
  });

  useLucideIcons([citiesData, areasData, propertiesData, selectedIds, showSignupModal, showSuccessModal]);

  useEffect(() => {
    const user = getWebsiteUser();
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: getWebsiteUserName() || prev.fullName,
        gmail: getWebsiteUserEmail() || prev.gmail
      }));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadCities = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/locations/cities`);
        if (response.ok) {
          const data = await response.json();
          const cities = data.data || data || [];
          if (mounted && cities.length > 0) {
            setCitiesData(cities);
            return;
          }
        }
      } catch {
        // ignore
      }
      if (mounted) setCitiesData(defaultCities);
    };
    loadCities();
    return () => {
      mounted = false;
    };
  }, [apiUrl]);

  useEffect(() => {
    const loadAreas = async () => {
      if (!form.city) {
        setAreasData([]);
        return;
      }
      try {
        const response = await fetch(`${apiUrl}/api/locations/areas`);
        if (response.ok) {
          const data = await response.json();
          const allAreas = data.data || [];
          const filtered = allAreas.filter((area) => area.city?._id === form.city);
          if (filtered.length > 0) {
            setAreasData(filtered);
            return;
          }
        }
      } catch {
        // ignore
      }
      setAreasData(fallbackAreasByCity[form.city] || []);
    };
    loadAreas();
  }, [apiUrl, form.city]);

  useEffect(() => {
    const loadProperties = async () => {
      if (!form.area) {
        setPropertiesData([]);
        return;
      }
      setLoadingProperties(true);
      try {
        const response = await fetch(`${apiUrl}/api/approved-properties/public/approved`);
        if (!response.ok) throw new Error("Failed to fetch properties");
        const data = await response.json();
        let properties = Array.isArray(data) ? data : data?.properties || (data ? [data] : []);
        properties = properties.filter((prop) => prop.isLiveOnWebsite === true || prop.status === "live" || prop.status === "approved");

        const selectedAreaOption = areasData.find((area) => area._id === form.area);
        const filterAreaName = selectedAreaOption?.name?.toLowerCase?.().trim?.() || "";
        const gender = form.gender.toLowerCase();
        const minPrice = parseInt(form.minPrice || 0, 10);
        const maxPrice = parseInt(form.maxPrice || 0, 10);

        const filtered = properties.filter((prop) => {
          const propInfo = prop.propertyInfo || {};
          const propArea = (prop.locality || propInfo.area || "").toString().toLowerCase().trim();
          if (filterAreaName) {
            const areaMatch = propArea.includes(filterAreaName) || filterAreaName.includes(propArea);
            if (!propArea || !areaMatch) return false;
          }
          if (gender) {
            const propGender = (prop.gender || propInfo.gender || prop.genderSuitability || "").toString().toLowerCase();
            const genderMatch = propGender.includes("co-ed") || propGender.includes(gender) || gender.includes(propGender);
            if (propGender && !genderMatch) return false;
          }
          if (minPrice || maxPrice) {
            const rent = parseInt(prop.monthlyRent || prop.rent || propInfo.rent || propInfo.monthlyRent, 10);
            if (Number.isFinite(rent)) {
              if (minPrice && rent < minPrice) return false;
              if (maxPrice && maxPrice !== 50000 && rent > maxPrice) return false;
            }
          }
          return true;
        });

        setPropertiesData(filtered);
      } catch (error) {
        setPropertiesData([]);
      } finally {
        setLoadingProperties(false);
      }
    };
    loadProperties();
  }, [apiUrl, form.area, form.gender, form.minPrice, form.maxPrice, areasData]);

  const handleFormChange = (event) => {
    const { id, value } = event.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const toggleProperty = (propertyId) => {
    setSelectedIds((prev) => {
      if (prev.includes(propertyId)) return prev.filter((id) => id !== propertyId);
      return [...prev, propertyId];
    });
  };

  const validateForm = () => {
    if (!form.fullName.trim()) return false;
    if (!form.gmail.trim() || !form.gmail.includes("@gmail.com")) return false;
    if (!form.gender) return false;
    if (!form.city || !form.area) return false;
    if (!form.minPrice || !form.maxPrice) return false;
    if (parseInt(form.minPrice, 10) > parseInt(form.maxPrice, 10)) return false;
    return true;
  };

  const submitBids = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      window.alert("Please fill in all required fields correctly");
      return;
    }
    if (!isWebsiteLoggedIn()) {
      setSignupEmail(form.gmail);
      setShowSignupModal(true);
      return;
    }

    if (selectedIds.length === 0) {
      window.alert("Please select at least one property to bid on");
      return;
    }

    setShowSuccessModal(true);
    setSuccessCount(selectedIds.length);

    const userId = getWebsiteUserId() || (getWebsiteUser()?.loginId || "");
    if (form.gmail) {
      localStorage.setItem("user_email", form.gmail);
    }
    if (userId) {
      localStorage.setItem("user_id", userId);
    }

    const selectedCityOption = citiesData.find((city) => (city._id || city.id) === form.city);
    const selectedAreaOption = areasData.find((area) => (area._id || area.id) === form.area);
    const bidMinValue = parseInt(form.minPrice || 0, 10);
    const bidMaxValue = parseInt(form.maxPrice || 0, 10);

    for (const propertyId of selectedIds) {
      try {
        const property = propertiesData.find((p) => p._id === propertyId || p.propertyId === propertyId || p.visitId === propertyId);
        if (!property) continue;
        const propertyOwnerId =
          (property.generatedCredentials && property.generatedCredentials.loginId) ||
          property.ownerLoginId ||
          property.createdBy ||
          property.owner ||
          property.propertyOwnerId;
        if (!propertyOwnerId) continue;

        const bidData = {
          property_id: propertyId,
          property_name: property.property_name || property.propertyInfo?.name || "Property",
          area: property.locality || property.propertyInfo?.area || "",
          property_type: property.propertyType || property.propertyInfo?.propertyType || "Property",
          rent_amount: parseInt(property.monthlyRent || property.rent || property.propertyInfo?.rent || 0, 10),
          user_id: userId,
          owner_id: propertyOwnerId,
          name: form.fullName,
          email: form.gmail,
          phone: "",
          request_type: "bid",
          bid_min: Number.isFinite(bidMinValue) && bidMinValue > 0 ? bidMinValue : null,
          bid_max: Number.isFinite(bidMaxValue) && bidMaxValue > 0 ? bidMaxValue : null,
          filter_criteria: {
            gender: form.gender,
            city_id: form.city,
            city: selectedCityOption ? selectedCityOption.name || selectedCityOption.cityName : "",
            area_id: form.area,
            area: selectedAreaOption ? selectedAreaOption.name || selectedAreaOption.area_name : "",
            min_price: Number.isFinite(bidMinValue) && bidMinValue > 0 ? bidMinValue : null,
            max_price: Number.isFinite(bidMaxValue) && bidMaxValue > 0 ? bidMaxValue : null,
            property_type: property.propertyType || property.propertyInfo?.propertyType || "Property"
          },
          message: `Looking for property with rent Rs ${form.minPrice}-${form.maxPrice}, Gender: ${form.gender}`
        };

        await fetch(`${apiUrl}/api/booking/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bidData)
        });
      } catch {
        // ignore failures
      }
    }
  };

  useHtmlPage({
    title: "Fast Bidding - Roomhy",
    bodyClass: "bg-gray-50",
    htmlAttrs: {
      lang: "en",
      class: "scroll-smooth"
    },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    bases: [],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: true },
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/website/assets/css/fast-bidding.css" }
    ],
    styles: [],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" }
    ],
    inlineScripts: []
  });

  return (
    <div className="html-page">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/website/index" className="font-bold text-xl text-blue-600 flex items-center gap-2">
            <i data-lucide="zap" className="w-6 h-6"></i> Roomhy Fast Bidding
          </a>
          <a href="/website/index" className="text-gray-600 hover:text-blue-600 inline-flex items-center text-sm">
            <i data-lucide="arrow-left" className="w-4 h-4 mr-1"></i> Back to Home
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Quick Bidding Form</h1>
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Step 1 of 1</span>
          </div>
          <p className="text-gray-600">Fill in your details to find matching properties and send bids to multiple owners</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <form id="fastBiddingForm" onSubmit={submitBids}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Full Name *</label>
                <input type="text" id="fullName" value={form.fullName} onChange={handleFormChange} placeholder="Enter your full name" className="form-input w-full" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Gmail Address *</label>
                <input type="email" id="gmail" value={form.gmail} onChange={handleFormChange} placeholder="your.email@gmail.com" className="form-input w-full" required />
              </div>
            </div>

            <div className="mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Gender *</label>
                <select id="gender" className="form-input w-full" required value={form.gender} onChange={handleFormChange}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">This helps us show matching properties</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Select City *</label>
                <select id="city" className="form-input w-full" required value={form.city} onChange={handleFormChange}>
                  <option value="">Select a city</option>
                  {citiesData.map((city) => (
                    <option key={city._id || city.id} value={city._id || city.id}>
                      {city.name || city.city_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Choose from available cities</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Select Area *</label>
                <select id="area" className="form-input w-full" required value={form.area} onChange={handleFormChange}>
                  <option value="">{form.city ? "Select an area" : "First select a city"}</option>
                  {areasData.map((area) => (
                    <option key={area._id || area.id} value={area._id || area.id}>
                      {area.name || area.area_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Choose from available areas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Minimum Price Range (₹) *</label>
                <input type="number" id="minPrice" value={form.minPrice} onChange={handleFormChange} placeholder="Min price" className="form-input w-full" min="1000" step="500" required />
                <p className="text-xs text-gray-500 mt-1">Minimum expected rent</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Maximum Price Range (₹) *</label>
                <input type="number" id="maxPrice" value={form.maxPrice} onChange={handleFormChange} placeholder="Max price" className="form-input w-full" min="1000" step="500" required />
                <p className="text-xs text-gray-500 mt-1">Maximum expected rent</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Properties Found in Your Area</h3>
              {loadingProperties && (
                <div id="propertiesLoadingSpinner" className="loading show flex items-center justify-center py-8">
                  <div className="animate-spin">
                    <i data-lucide="loader" className="w-6 h-6 text-blue-600"></i>
                  </div>
                  <span className="ml-2 text-gray-600">Loading properties...</span>
                </div>
              )}
              {!loadingProperties && propertiesData.length === 0 && (
                <div id="noPropertiesMsg" className="text-center py-8 text-gray-500">
                  <i data-lucide="inbox" className="w-12 h-12 mx-auto mb-3 text-gray-300"></i>
                  <p>No properties found. Try adjusting your filters.</p>
                </div>
              )}
              <div id="propertiesList" className="space-y-3">
                {propertiesData.map((prop) => {
                  const propInfo = prop.propertyInfo || {};
                  const propertyId = prop._id || prop.propertyNumber || prop.propertyId;
                  const propertyName = propInfo.name || prop.property_name || `Property ${propertyId}`;
                  const rent = prop.monthlyRent || prop.rent || propInfo.rent || propInfo.monthlyRent || 0;
                  const gender = prop.gender || propInfo.gender || prop.genderSuitability || "Not specified";
                  const propertyType = propInfo.propertyType || prop.propertyType || "Property";
                  const isSelected = selectedIds.includes(propertyId);
                  return (
                    <div key={propertyId} className={`property-item ${isSelected ? "selected" : ""}`} onClick={() => toggleProperty(propertyId)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{propertyName}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            <i data-lucide="hash" className="w-3 h-3 inline mr-1"></i> Property #{propertyId}
                          </p>
                          <div className="flex gap-4 mt-2 text-xs">
                            <span className="text-gray-600"><strong>₹{rent}</strong>/month</span>
                            <span className="text-gray-600">{gender}</span>
                            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded">{propertyType}</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <input
                            type="checkbox"
                            className="property-checkbox w-5 h-5 text-blue-600 rounded"
                            checked={isSelected}
                            onChange={() => toggleProperty(propertyId)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 flex gap-3">
              <button type="reset" onClick={() => setForm({ fullName: "", gmail: "", gender: "", city: "", area: "", minPrice: "", maxPrice: "" })} className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-200 transition-colors">
                Clear Form
              </button>
              <button type="submit" className="flex-1 btn-primary py-3 rounded-lg flex items-center justify-center gap-2">
                <i data-lucide="send" className="w-5 h-5"></i>
                Send Bids to All Matching Properties
              </button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex gap-3">
              <i data-lucide="info" className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"></i>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">How It Works</h4>
                <p className="text-sm text-blue-800">Your bid will be sent to all property owners matching your criteria. Owners will review and can accept or counter your bid.</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex gap-3">
              <i data-lucide="shield" className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"></i>
              <div>
                <h4 className="font-semibold text-green-900 mb-1">Secure & Safe</h4>
                <p className="text-sm text-green-800">Your phone number will only be shared after the owner accepts your bid. No direct contact until agreement.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-gray-300 py-12 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm">© 2025 Roomhy. Your trusted student accommodation platform.</p>
        </div>
      </footer>

      <div id="submissionModal" className={`fixed inset-0 bg-black/50 items-center justify-center z-50 p-4 ${showSuccessModal ? "flex" : "hidden"}`}>
        <div className="bg-white rounded-lg max-w-md w-full p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i data-lucide="check" className="w-8 h-8 text-green-600"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bid Sent Successfully!</h2>
            <p className="text-gray-600 text-sm">Your bid has been sent to all matching property owners.</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600"><strong>Bids sent to:</strong> <span id="bidCountDisplay">{successCount}</span> properties</p>
            <p className="text-sm text-gray-600 mt-2">Property owners will review your bid and respond within 24 hours.</p>
          </div>
          <button onClick={() => setShowSuccessModal(false)} className="w-full btn-primary py-2 rounded-lg">
            Done
          </button>
        </div>
      </div>

      <div id="signupModal" className={`fixed inset-0 bg-black/50 items-center justify-center z-50 p-4 ${showSignupModal ? "flex" : "hidden"}`}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 transition-all">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Account Verification</h2>
                <p className="text-purple-100 text-sm mt-1">Create an account to continue</p>
              </div>
              <button onClick={() => setShowSignupModal(false)} className="text-white hover:bg-white/20 rounded-full p-2 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600">Email:</p>
              <p className="text-lg font-semibold text-gray-900" id="signupEmailDisplay">{signupEmail}</p>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 text-center leading-relaxed">
                <span className="font-semibold text-gray-900">No account found</span> for this email address. Please create an account to verify your identity and continue with bidding.
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Why sign up?</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center">
                  <span className="text-green-600 font-bold mr-2">✓</span>
                  Verified account
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 font-bold mr-2">✓</span>
                  Send multiple bids
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 font-bold mr-2">✓</span>
                  Track your properties
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowSignupModal(false)} className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => { window.location.href = "signup"; }} className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
                Sign Up Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


