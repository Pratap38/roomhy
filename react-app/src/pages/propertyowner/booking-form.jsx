import React, { useCallback, useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [paymentReady, paymentCompleted, showRefund]);

  useEffect(() => {
    const stored = sessionStorage.getItem("bookingRequestData");
    if (!stored) return;
    try {
      const data = JSON.parse(stored);
      setBooking((prev) => ({
        ...prev,
        bookingId: data.bookingId || data.booking_id || prev.bookingId,
        userId: data.userId || data.user_id || data.signup_user_id || prev.userId,
        propertyId: data.propertyId || data.property_id || prev.propertyId,
        propertyName: data.propertyName || data.property_name || prev.propertyName,
        ownerId: data.ownerId || data.owner_id || prev.ownerId,
        ownerName: data.ownerName || data.owner_name || prev.ownerName,
        tenantName: data.tenantName || data.userName || prev.tenantName,
        tenantEmail: data.tenantEmail || data.userEmail || prev.tenantEmail,
        area: data.area || prev.area,
        propertyType: data.propertyType || data.property_type || prev.propertyType,
        rentAmount: Number(data.rentAmount || data.rent_amount || prev.rentAmount || 0),
        totalAmount: Number(data.totalAmount || data.total_amount || prev.totalAmount || 500),
        fullName: data.tenantName || data.userName || prev.fullName,
        email: data.tenantEmail || data.userEmail || prev.email,
        phone: data.tenantPhone || data.userPhone || prev.phone
      }));
    } catch (err) {
      console.warn("Failed to parse bookingRequestData:", err);
    }
  }, []);

  useEffect(() => {
    const loadKey = async () => {
      setLoadingKey(true);
      try {
        const res = await fetchJson("/api/booking/config/razorpay-key");
        setBooking((prev) => ({ ...prev, razorpayKey: res?.key || res?.keyId || "" }));
      } catch {
        try {
          const res = await fetchJson("/api/bookings/config/razorpay-key");
          setBooking((prev) => ({ ...prev, razorpayKey: res?.key || res?.keyId || "" }));
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
    return true;
  }, [booking]);

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

      if (typeof window.Razorpay === "undefined") {
        throw new Error("Razorpay is not available.");
      }

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
      const payload = {
        user_id: booking.userId,
        property_id: booking.propertyId,
        property_name: booking.propertyName,
        owner_id: booking.ownerId || "owner_unknown",
        owner_name: booking.ownerName || "Unknown Owner",
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
        payment_status: "completed",
        payment_method: "razorpay",
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
        property_name: booking.propertyName,
        owner_id: booking.ownerId,
        owner_name: booking.ownerName,
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

      setBooking((prev) => ({ ...prev, bookingId }));
      setMessage("Booking confirmed! Check your email for credentials.");
    } catch (err) {
      setMessage(err?.message || "Booking confirmation failed.");
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
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Property Name</label>
              <input type="text" className="form-input border-gray-300" value={booking.propertyName} readOnly />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Property ID</label>
              <input type="text" className="form-input border-gray-300" value={booking.propertyId} readOnly />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Owner Name</label>
              <input type="text" className="form-input border-gray-300" value={booking.ownerName} readOnly />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={booking.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  value={booking.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={booking.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">User ID *</label>
                <input type="text" className="form-input" value={booking.userId} readOnly />
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
                  className="form-input"
                  value={booking.guardianName}
                  onChange={(e) => updateField("guardianName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Guardian Phone *</label>
                <input
                  type="tel"
                  className="form-input"
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
                className="form-input"
                value={booking.streetAddress}
                onChange={(e) => updateField("streetAddress", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">City *</label>
                <input
                  type="text"
                  className="form-input"
                  value={booking.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">State *</label>
                <input
                  type="text"
                  className="form-input"
                  value={booking.state}
                  onChange={(e) => updateField("state", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Postal Code *</label>
                <input
                  type="text"
                  className="form-input"
                  value={booking.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Country *</label>
              <input
                type="text"
                className="form-input"
                value={booking.country}
                onChange={(e) => updateField("country", e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Verification</h3>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => updateField("addressProof", e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-600"
            />
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

          <div className="border-t border-gray-200 pt-6 flex gap-3">
            <button
              type="button"
              className="flex-1 btn-secondary py-3 rounded-lg"
              onClick={() => setBooking((prev) => ({ ...prev, ...emptyBooking, propertyId: prev.propertyId }))}
            >
              Clear Form
            </button>
            <button
              type="button"
              className="flex-1 btn-primary py-3 rounded-lg flex items-center justify-center gap-2"
              onClick={handlePayment}
              disabled={paymentReady || loadingKey}
            >
              <i data-lucide="credit-card" className="w-5 h-5"></i>
              Proceed to Payment
            </button>
            <button
              type="button"
              className="flex-1 btn-primary py-3 rounded-lg flex items-center justify-center gap-2"
              onClick={handleConfirm}
              disabled={!paymentCompleted || confirming}
            >
              <i data-lucide="check-circle" className="w-5 h-5"></i>
              Complete Booking
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-sm text-gray-600 mb-4">Need a refund or alternative property?</p>
          <button
            type="button"
            className="w-full px-4 py-3 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-all text-sm"
            onClick={() => setShowRefund(true)}
          >
            Request Refund / Alternative
          </button>
        </div>
      </main>

      {showRefund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Refund Request</h3>
              <button type="button" onClick={() => setShowRefund(false)}>✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Reason *</label>
                <input
                  type="text"
                  className="form-input"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Details *</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={refundDetails}
                  onChange={(e) => setRefundDetails(e.target.value)}
                />
              </div>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="refundOption"
                    value="refund"
                    checked={refundOption === "refund"}
                    onChange={() => setRefundOption("refund")}
                  />
                  Refund
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="refundOption"
                    value="alternative"
                    checked={refundOption === "alternative"}
                    onChange={() => setRefundOption("alternative")}
                  />
                  Show Alternative Property
                </label>
              </div>
              <button type="button" className="btn-primary w-full py-3 rounded-lg" onClick={submitRefund}>
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


