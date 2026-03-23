import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";

const getApiUrl = () =>
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : "https://api.roomhy.com";

const emptyBooking = {
  bookingId: "",
  userId: "",
  propertyId: "",
  propertyName: "",
  ownerId: "",
  ownerName: "",
  tenantName: "",
  tenantEmail: "",
  area: "",
  propertyType: "",
  rentAmount: 0,
  totalAmount: 500,
  razorpayKey: "",
  razorpayOrderId: "",
  razorpayPaymentId: "",
  fullName: "",
  email: "",
  phone: "",
  guardianName: "",
  guardianPhone: "",
  streetAddress: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  addressProof: null
};

const createWebsiteUserId = () => `roomhyweb${String(Math.floor(Math.random() * 900000) + 100000)}`;
const formatInr = (value) => `Rs ${Number(value || 0)}`;

const postWithFallback = async (primary, secondary, payload) => {
  const attempts = [primary, secondary].filter(Boolean);
  let lastError = null;
  for (const url of attempts) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) return res.json();
      if (res.status !== 404) {
        const errText = await res.text();
        throw new Error(errText || `Request failed with status ${res.status}`);
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Request failed");
};

const ensureRazorpayLoaded = () =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window is not available."));
      return;
    }
    if (typeof window.Razorpay !== "undefined") {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[data-roomhy-razorpay="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.roomhyRazorpay = "1";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay."));
    document.body.appendChild(script);
  });

export default function PropertyownerBookingForm() {
  useHtmlPage({
    title: "Complete Your Booking - Roomhy",
    bodyClass: "bg-gray-50 text-gray-900",
    htmlAttrs: { lang: "en", class: "scroll-smooth" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: true },
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      },
      { rel: "stylesheet", href: "/propertyowner/assets/css/booking-form.css" }
    ],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" },
      { src: "https://checkout.razorpay.com/v1/checkout.js" }
    ],
    inlineScripts: []
  });

  const apiUrl = useMemo(() => getApiUrl(), []);
  const [booking, setBooking] = useState(emptyBooking);
  const [loadingKey, setLoadingKey] = useState(true);
  const [paymentReady, setPaymentReady] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const [showRefund, setShowRefund] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundDetails, setRefundDetails] = useState("");
  const [refundOption, setRefundOption] = useState("refund");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const messageRef = useRef(null);

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [paymentReady, paymentCompleted, showRefund, successData, booking.addressProof]);

  useEffect(() => {
    if (message && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [message]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stored = sessionStorage.getItem("bookingRequestData");
    let data = null;
    try {
      data = stored ? JSON.parse(stored) : null;
    } catch (err) {
      console.warn("Failed to parse bookingRequestData:", err);
    }

    const tenantName = data?.tenantName || data?.tenant_name || data?.userName || params.get("tenantName") || "";
    const tenantEmail = data?.tenantEmail || data?.tenant_email || data?.userEmail || params.get("tenantEmail") || "";
    const userId = data?.userId || data?.user_id || data?.signup_user_id || params.get("userId") || createWebsiteUserId();

    setBooking((prev) => ({
      ...prev,
      bookingId: data?.bookingId || data?.booking_id || params.get("bookingId") || prev.bookingId,
      userId,
      propertyId: data?.propertyId || data?.property_id || params.get("propertyId") || prev.propertyId,
      propertyName: data?.propertyName || data?.property_name || params.get("propertyName") || prev.propertyName,
      ownerId: data?.ownerId || data?.owner_id || params.get("ownerId") || prev.ownerId,
      ownerName: data?.ownerName || data?.owner_name || params.get("ownerName") || prev.ownerName,
      tenantName,
      tenantEmail,
      area: data?.area || params.get("area") || prev.area,
      propertyType: data?.propertyType || data?.property_type || params.get("propertyType") || prev.propertyType,
      rentAmount: 500,
      totalAmount: 500,
      fullName: tenantName || prev.fullName,
      email: tenantEmail || prev.email,
      phone: data?.tenantPhone || data?.tenant_phone || data?.userPhone || params.get("prefillPhone") || prev.phone
    }));
  }, []);

  useEffect(() => {
    const loadBookingContext = async () => {
      if (booking.propertyName && booking.ownerName && booking.area) return;
      if (!booking.bookingId && !booking.propertyId) return;

      const idsToTry = [booking.bookingId, booking.propertyId].filter(Boolean);
      for (const id of idsToTry) {
        try {
          const res = await fetchJson(`/api/booking/${id}`);
          const data = res?.data || res || {};
          setBooking((prev) => ({
            ...prev,
            propertyName: prev.propertyName || data.property_name || data.propertyName || data.property_id || prev.propertyId,
            ownerName: prev.ownerName || data.owner_name || data.ownerName || data.owner_id || prev.ownerId,
            ownerId: prev.ownerId || data.owner_id || data.ownerId || prev.ownerId,
            area: prev.area || data.area || "N/A",
            propertyType: prev.propertyType || data.property_type || data.propertyType || "N/A",
            rentAmount: prev.rentAmount || data.rent_amount || data.rentAmount || prev.totalAmount
          }));
          return;
        } catch {
          // try next id/path
        }

        try {
          const res = await fetchJson(`/api/bookings/${id}`);
          const data = res?.data || res || {};
          setBooking((prev) => ({
            ...prev,
            propertyName: prev.propertyName || data.property_name || data.propertyName || data.property_id || prev.propertyId,
            ownerName: prev.ownerName || data.owner_name || data.ownerName || data.owner_id || prev.ownerId,
            ownerId: prev.ownerId || data.owner_id || data.ownerId || prev.ownerId,
            area: prev.area || data.area || "N/A",
            propertyType: prev.propertyType || data.property_type || data.propertyType || "N/A",
            rentAmount: prev.rentAmount || data.rent_amount || data.rentAmount || prev.totalAmount
          }));
          return;
        } catch {
          // continue
        }
      }
    };

    loadBookingContext();
  }, [booking.area, booking.bookingId, booking.ownerId, booking.ownerName, booking.propertyId, booking.propertyName, booking.propertyType, booking.rentAmount, booking.totalAmount]);

  useEffect(() => {
    const loadKey = async () => {
      setLoadingKey(true);
      try {
        const res = await fetchJson("/api/booking/config/razorpay-key");
        setBooking((prev) => ({ ...prev, razorpayKey: res?.razorpayKey || res?.key || res?.keyId || "" }));
      } catch {
        try {
          const res = await fetchJson("/api/bookings/config/razorpay-key");
          setBooking((prev) => ({ ...prev, razorpayKey: res?.razorpayKey || res?.key || res?.keyId || "" }));
        } catch (err) {
          console.error("Failed to load Razorpay key:", err);
        }
      } finally {
        setLoadingKey(false);
      }
    };
    loadKey();
  }, []);

  const updateField = useCallback((field, value) => {
    setBooking((prev) => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = useCallback(() => {
    const required = [
      "fullName",
      "email",
      "phone",
      "guardianName",
      "guardianPhone",
      "streetAddress",
      "city",
      "state",
      "postalCode",
      "country"
    ];
    const missing = required.filter((field) => !String(booking[field] || "").trim());
    if (missing.length) {
      setMessage("Please fill all required fields.");
      return false;
    }
    if (!booking.addressProof) {
      setMessage("Please upload address proof.");
      return false;
    }
    if (!termsAccepted) {
      setMessage("Please agree to the terms and conditions.");
      return false;
    }
    return true;
  }, [booking, termsAccepted]);

  const handleAddressProof = useCallback((file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage("File size must be less than 5MB.");
      return;
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setMessage("Only PDF, JPG, and PNG files are allowed.");
      return;
    }
    setMessage("");
    updateField("addressProof", file);
  }, [updateField]);

  const handlePayment = useCallback(async () => {
    setMessage("");
    if (!validateForm()) return;
    if (!booking.razorpayKey) {
      setMessage("Payment system not configured.");
      return;
    }

    setPaymentReady(true);
    try {
      const orderResponse = await postWithFallback(
        `${apiUrl}/api/booking/create-order`,
        `${apiUrl}/api/bookings/create-order`,
        {
          amount: booking.totalAmount,
          currency: "INR",
          receipt: `booking_${booking.userId || "guest"}_${Date.now()}`,
          notes: {
            userId: booking.userId,
            propertyId: booking.propertyId,
            propertyName: booking.propertyName
          }
        }
      );

      const orderId = orderResponse?.orderId || orderResponse?.id || "";
      if (!orderId) {
        throw new Error("Unable to start payment.");
      }

      await ensureRazorpayLoaded();

      const razorpay = new window.Razorpay({
        key: booking.razorpayKey,
        order_id: orderId,
        amount: booking.totalAmount * 100,
        currency: "INR",
        name: "Roomhy",
        description: `Booking Payment for ${booking.propertyName || "Property"}`,
        handler: (response) => {
          setBooking((prev) => ({
            ...prev,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id
          }));
          setPaymentCompleted(true);
          setMessage("Payment successful! Click Complete Booking to finish.");
        },
        prefill: {
          name: booking.fullName,
          email: booking.email,
          contact: booking.phone
        },
        theme: { color: "#3b82f6" }
      });

      razorpay.open();
    } catch (err) {
      setMessage(err?.message || "Failed to initiate payment.");
    } finally {
      setPaymentReady(false);
    }
  }, [apiUrl, booking, validateForm]);

  const handleConfirm = useCallback(async () => {
    if (!booking.razorpayPaymentId) {
      setMessage("Please complete payment first.");
      return;
    }
    setConfirming(true);
    setMessage("");
    try {
      const propertyName = booking.propertyName || booking.propertyId || "Property";
      const ownerName = booking.ownerName || booking.ownerId || "Unknown Owner";
      const payload = {
        user_id: booking.userId,
        property_id: booking.propertyId,
        property_name: propertyName,
        owner_id: booking.ownerId || "owner_unknown",
        owner_name: ownerName,
        name: booking.fullName,
        phone: booking.phone,
        email: booking.email,
        area: booking.area || "N/A",
        property_type: booking.propertyType || "N/A",
        rent_amount: booking.rentAmount || booking.totalAmount,
        guardian_name: booking.guardianName,
        guardian_phone: booking.guardianPhone,
        address_street: booking.streetAddress,
        address_city: booking.city,
        address_state: booking.state,
        address_postal_code: booking.postalCode,
        address_country: booking.country,
        payment_id: booking.razorpayPaymentId,
        payment_amount: booking.totalAmount,
        payment_status: "completed",
        payment_method: "razorpay",
        total_amount: booking.totalAmount,
        totalAmount: booking.totalAmount,
        request_type: "request",
        booking_status: "confirmed",
        bookingStatus: "confirmed",
        status: "confirmed"
      };

      const result = await postWithFallback(
        `${apiUrl}/api/booking/confirm`,
        `${apiUrl}/api/bookings/confirm`,
        payload
      );

      const confirmed = result?.data || result || {};
      const bookingId = confirmed._id || confirmed.booking_id || booking.bookingId;
      const normalized = {
        ...confirmed,
        booking_id: bookingId,
        user_id: booking.userId,
        property_id: booking.propertyId,
        property_name: propertyName,
        owner_id: booking.ownerId,
        owner_name: ownerName,
        property_location: booking.area,
        property_type: booking.propertyType,
        total_amount: booking.totalAmount,
        payment_id: booking.razorpayPaymentId,
        user_name: booking.fullName,
        user_phone: booking.phone,
        user_email: booking.email,
        booking_status: confirmed.booking_status || confirmed.status || "confirmed"
      };

      sessionStorage.setItem("bookingConfirmation", JSON.stringify(normalized));
      localStorage.setItem("lastBooking", JSON.stringify(normalized));
      const confirmedBookings = JSON.parse(localStorage.getItem("confirmedBookings") || "[]");
      const bookingKey = normalized.booking_id || normalized.bookingId || normalized.payment_id;
      const deduped = confirmedBookings.filter((item) => {
        const itemKey = item?.booking_id || item?.bookingId || item?.payment_id;
        return String(itemKey || "") !== String(bookingKey || "");
      });
      deduped.unshift({ ...normalized, created_at: new Date().toISOString() });
      localStorage.setItem("confirmedBookings", JSON.stringify(deduped));
      if (normalized.user_id) {
        localStorage.setItem("userId", normalized.user_id);
        sessionStorage.setItem("userId", normalized.user_id);
      }
      if (booking.email) {
        localStorage.setItem("userEmail", booking.email);
        sessionStorage.setItem("userEmail", booking.email);
      }

      setBooking((prev) => ({ ...prev, bookingId }));
      setSuccessData({
        userId: result?.userId || booking.userId || "-",
        password: result?.password || "N/A"
      });
      setMessage("Booking confirmed! Check your email for credentials.");
    } catch (err) {
      const text = err?.message || err?.body || "Booking confirmation failed.";
      setMessage(text);
    } finally {
      setConfirming(false);
    }
  }, [apiUrl, booking]);

  const submitRefund = useCallback(async () => {
    if (!refundReason || !refundDetails) {
      setMessage("Please fill refund details.");
      return;
    }
    try {
      const payload = {
        booking_id: booking.bookingId || booking.propertyId || "",
        user_id: booking.userId || "",
        payment_id: booking.razorpayPaymentId || booking.bookingId || booking.propertyId || "",
        user_name: booking.fullName || "",
        user_phone: booking.phone || "",
        user_email: booking.email || "",
        request_type: refundOption === "alternative" ? "alternative_property" : "refund",
        refund_amount: booking.totalAmount || 500,
        refund_method: refundOption === "refund" ? "other" : null,
        other_details: `Reason: ${refundReason}. Details: ${refundDetails}`,
        preferred_area: refundOption === "alternative" ? booking.area || null : null,
        property_requirements: refundOption === "alternative" ? refundDetails : null
      };

      await postWithFallback(
        `${apiUrl}/api/booking/refund-request`,
        `${apiUrl}/api/bookings/refund-request`,
        payload
      );
      setShowRefund(false);
      setMessage("Refund request submitted successfully.");
    } catch (err) {
      setMessage(err?.message || "Refund request failed.");
    }
  }, [apiUrl, booking, refundDetails, refundOption, refundReason]);

  const inputClass = "w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition";
  const readOnlyInputClass = `${inputClass} bg-gray-50 text-gray-600`;
  const textAreaClass = `${inputClass} min-h-[120px]`;
  const fileInputClass = "block w-full rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:border-blue-300";

  return (
    <div className="html-page">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/website/index" className="font-bold text-xl text-blue-600 flex items-center gap-2">
            <i data-lucide="home" className="w-6 h-6"></i> Roomhy Booking
          </a>
          <a href="/website/index" className="text-gray-600 hover:text-blue-600 inline-flex items-center text-sm">
            <i data-lucide="arrow-left" className="w-4 h-4 mr-1"></i> Back to Home
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Complete Your Booking</h1>
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Step 1 of 1
            </span>
          </div>
          <p className="text-gray-600">Fill in your details and complete the booking process securely</p>
        </div>

        {message && (
          <div ref={messageRef} className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {message}
          </div>
        )}

        {!successData ? (
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Property Name</label>
              <input type="text" className={readOnlyInputClass} value={booking.propertyName} readOnly />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Property ID</label>
              <input type="text" className={readOnlyInputClass} value={booking.propertyId} readOnly />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Owner Name</label>
              <input type="text" className={readOnlyInputClass} value={booking.ownerName} readOnly />
            </div>
          </div>

          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <i data-lucide="shield-check" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"></i>
              <div className="text-sm">
                <strong className="text-blue-900">Risk-Free Booking!</strong>
                <p className="text-blue-800 mt-0.5">If you don&apos;t like the property after booking, we&apos;ll show you alternatives or process a full refund.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Full Name *</label>
                <input
                  type="text"
                  className={inputClass}
                  value={booking.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Email Address *</label>
                <input
                  type="email"
                  className={inputClass}
                  value={booking.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  className={inputClass}
                  value={booking.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">User ID *</label>
                <input type="text" className={readOnlyInputClass} value={booking.userId} readOnly />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Guardian/Parent Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Guardian Name *</label>
                <input
                  type="text"
                  className={inputClass}
                  value={booking.guardianName}
                  onChange={(e) => updateField("guardianName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Guardian Phone *</label>
                <input
                  type="tel"
                  className={inputClass}
                  value={booking.guardianPhone}
                  onChange={(e) => updateField("guardianPhone", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">Street Address *</label>
              <input
                type="text"
                className={inputClass}
                value={booking.streetAddress}
                onChange={(e) => updateField("streetAddress", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">City *</label>
                <input
                  type="text"
                  className={inputClass}
                  value={booking.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">State *</label>
                <input
                  type="text"
                  className={inputClass}
                  value={booking.state}
                  onChange={(e) => updateField("state", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Postal Code *</label>
                <input
                  type="text"
                  className={inputClass}
                  value={booking.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Country *</label>
              <input
                type="text"
                className={inputClass}
                value={booking.country}
                onChange={(e) => updateField("country", e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Verification</h3>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Upload Address Proof (Aadhar/Utility Bill) *</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleAddressProof(e.target.files?.[0] || null)}
              className={fileInputClass}
            />
            {booking.addressProof ? (
              <div className="text-sm text-green-600 mt-3 flex items-center gap-2">
                <i data-lucide="check-circle" className="w-4 h-4"></i>
                <span>{booking.addressProof.name}</span>
              </div>
            ) : null}
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Monthly Rent</span>
                <span className="font-semibold">₹{booking.rentAmount || booking.totalAmount}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-gray-900">
                <span className="font-semibold">Total Amount to Pay</span>
                <span className="font-bold text-lg">₹{booking.totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
              <span className="text-sm text-gray-700">I agree to the terms and conditions and confirm that I have read the refund policy.</span>
            </label>
          </div>

          <div className="border-t border-gray-200 pt-6 flex gap-3">
            <button
              type="button"
              className="flex-1 btn-secondary py-3 rounded-lg"
              onClick={() =>
                setBooking((prev) => ({
                  ...emptyBooking,
                  razorpayKey: prev.razorpayKey,
                  propertyId: prev.propertyId,
                  propertyName: prev.propertyName,
                  ownerId: prev.ownerId,
                  ownerName: prev.ownerName,
                  userId: prev.userId,
                  tenantName: prev.tenantName,
                  tenantEmail: prev.tenantEmail,
                  fullName: prev.tenantName,
                  email: prev.tenantEmail,
                  totalAmount: 500,
                  rentAmount: 500
                }))
              }
            >
              Clear Form
            </button>
            <button
              type="button"
              className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition ${
                paymentReady || loadingKey || !termsAccepted || paymentCompleted || !booking.razorpayKey
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "btn-primary"
              }`}
              onClick={handlePayment}
              disabled={paymentReady || loadingKey || !termsAccepted || paymentCompleted || !booking.razorpayKey}
              style={{ display: paymentCompleted ? "none" : "flex" }}
              title={!booking.razorpayKey ? "Razorpay key not loaded yet" : ""}
            >
              <i data-lucide="credit-card" className="w-5 h-5"></i>
              {loadingKey ? "Loading Payment..." : "Proceed to Payment"}
            </button>
            <button
              type="button"
              className="flex-1 btn-primary py-3 rounded-lg flex items-center justify-center gap-2"
              onClick={handleConfirm}
              disabled={!paymentCompleted || confirming}
              style={{ display: paymentCompleted ? "flex" : "none" }}
            >
              <i data-lucide={confirming ? "loader" : "check-circle"} className={`w-5 h-5 ${confirming ? "animate-spin" : ""}`}></i>
              Complete Booking
            </button>
          </div>
        </div>
        ) : null}

        {successData ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center mb-8">
            <div className="w-[72px] h-[72px] rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <i data-lucide="check" className="w-8 h-8 text-green-600"></i>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6">Your login credentials have been sent to your email</p>
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i data-lucide="key" className="w-5 h-5 text-blue-600"></i>
                Your Login Credentials
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">User ID:</span>
                  <span className="font-mono font-semibold text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">{successData.userId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Password:</span>
                  <span className="font-mono font-semibold text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">{successData.password}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Login URL:</span>
                  <a href="/website/login" className="text-blue-600 hover:underline font-medium">Login Page →</a>
                </div>
              </div>
            </div>
            <button type="button" onClick={() => { window.location.href = "/website/mystays"; }} className="w-full btn-primary py-3 rounded-lg flex items-center justify-center gap-2 mb-3">
              <i data-lucide="building" className="w-5 h-5"></i>
              Go to My Stays
            </button>
            <button type="button" onClick={() => { window.location.href = "/website/index"; }} className="w-full btn-secondary py-3 rounded-lg flex items-center justify-center gap-2 mb-3">
              <i data-lucide="home" className="w-5 h-5"></i>
              Go to Home
            </button>
            <button type="button" onClick={() => setShowRefund(true)} className="w-full border border-red-200 text-red-600 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-50">
              <i data-lucide="undo-2" className="w-5 h-5"></i>
              Request Refund / Alternative Property
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex gap-3">
                  <i data-lucide="info" className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"></i>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Secure &amp; Safe</h4>
                    <p className="text-sm text-blue-800">Your information is encrypted and secure. We follow all data protection guidelines.</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex gap-3">
                  <i data-lucide="shield" className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"></i>
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">Hassle-Free Process</h4>
                    <p className="text-sm text-green-800">Complete your booking in minutes. Instant confirmation sent to your email.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {showRefund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Request Refund / Alternative Property</h3>
              <button type="button" onClick={() => setShowRefund(false)}>✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Reason for Refund/Change *</label>
                <select
                  className={inputClass}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                >
                  <option value="">Select a reason</option>
                  <option value="did_not_like_property">Didn&apos;t like the property</option>
                  <option value="found_better">Found a better property elsewhere</option>
                  <option value="personal_emergency">Personal emergency</option>
                  <option value="change_plans">Changed my plans</option>
                  <option value="financial_issues">Financial issues</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Additional Details *</label>
                <textarea
                  className={textAreaClass}
                  rows={5}
                  placeholder="Please provide more details about your request..."
                  value={refundDetails}
                  onChange={(e) => setRefundDetails(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Would you like to see alternative properties?</label>
                <div className="flex gap-6 mt-3 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="refundOption"
                      value="alternative"
                      checked={refundOption === "alternative"}
                      onChange={() => setRefundOption("alternative")}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">Yes, show me alternatives</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="refundOption"
                      value="refund"
                      checked={refundOption === "refund"}
                      onChange={() => setRefundOption("refund")}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">No, just process refund</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button type="button" className="flex-1 btn-secondary py-3 rounded-lg" onClick={() => setShowRefund(false)}>
                  Cancel
                </button>
                <button type="button" className="flex-1 btn-primary py-3 rounded-lg" onClick={submitRefund}>
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


