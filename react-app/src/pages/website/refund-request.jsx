import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { getWebsiteApiUrl, getWebsiteUserEmail, getWebsiteUserId, logoutWebsite } from "../../utils/websiteSession";
import { useLucideIcons, useWebsiteCommon } from "../../utils/websiteUi";

export default function WebsiteRefundRequest() {
  useWebsiteCommon();
  const apiUrl = useMemo(() => getWebsiteApiUrl(), []);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(false);
  const [requestType, setRequestType] = useState("refund");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [form, setForm] = useState({
    refundName: "",
    refundPhone: "",
    refundEmail: "",
    upiId: "",
    bankName: "",
    bankAccount: "",
    ifscCode: "",
    bankNameField: "",
    refundReason: "",
    preferredArea: "",
    propertyType: "",
    minPrice: "",
    maxPrice: "",
    propertyRequirements: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const bookingAmountValue = Number(booking?.rentAmount || booking?.totalAmount || booking?.price || 0);

  useLucideIcons([booking, requestType, paymentMethod, message]);

  const loadBooking = useCallback(() => {
    setLoading(true);
    setErrorState(false);
    let loaded = null;
    try {
      const sessionBooking = sessionStorage.getItem("bookingConfirmation");
      if (sessionBooking) loaded = JSON.parse(sessionBooking);
    } catch (_) {
      // ignore
    }
    if (!loaded) {
      try {
        const localBooking = localStorage.getItem("lastBooking");
        if (localBooking) loaded = JSON.parse(localBooking);
      } catch (_) {
        // ignore
      }
    }
    if (!loaded) {
      setErrorState(true);
      setLoading(false);
      return;
    }
    setBooking(loaded);
    setForm((prev) => ({
      ...prev,
      refundName: loaded.user_name || loaded.name || "",
      refundPhone: loaded.user_phone || loaded.phone || "",
      refundEmail: loaded.user_email || loaded.email || ""
    }));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  useEffect(() => {
    const amountEl = document.getElementById("bookingAmount");
    if (amountEl) {
      amountEl.textContent = `₹${bookingAmountValue}`;
    }
  }, [bookingAmountValue]);

  const submitRequest = useCallback(async () => {
    if (!booking) return;
    setMessage("");

    if (requestType === "refund") {
      if (!form.refundName.trim() || !form.refundPhone.trim() || !form.refundEmail.trim()) {
        setMessage("Please fill in all required fields.");
        return;
      }
      if (paymentMethod === "upi" && !form.upiId.trim()) {
        setMessage("Please enter UPI ID.");
        return;
      }
      if (
        paymentMethod === "bank" &&
        (!form.bankName.trim() || !form.bankAccount.trim() || !form.ifscCode.trim())
      ) {
        setMessage("Please fill in all bank details.");
        return;
      }
    } else if (!form.preferredArea.trim()) {
      setMessage("Please enter preferred area.");
      return;
    }

    const requestData = {
      booking_id: booking.bookingId || booking._id || booking.booking_id,
      property_id: booking.propertyId || booking.property_id,
      user_id: booking.userId || booking.user_id || getWebsiteUserId(),
      request_type: requestType,
      booking_amount: booking.rentAmount || booking.totalAmount || booking.price || 500,
      property_name: booking.propertyName || booking.property_name,
      timestamp: new Date().toISOString()
    };

    if (requestType === "refund") {
      requestData.refund_details = {
        name: form.refundName,
        phone: form.refundPhone,
        email: form.refundEmail || getWebsiteUserEmail(),
        payment_method: paymentMethod,
        reason: form.refundReason,
        upi_id: paymentMethod === "upi" ? form.upiId : null,
        bank_name: paymentMethod === "bank" ? form.bankNameField || form.bankName : null,
        bank_account: paymentMethod === "bank" ? form.bankAccount : null,
        ifsc_code: paymentMethod === "bank" ? form.ifscCode : null
      };
    } else {
      requestData.alternative_details = {
        preferred_area: form.preferredArea,
        property_type: form.propertyType || null,
        min_price: form.minPrice || null,
        max_price: form.maxPrice || null,
        requirements: form.propertyRequirements
      };
    }

    localStorage.setItem(`refundRequest_${Date.now()}`, JSON.stringify(requestData));

    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/refund-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });
      if (res.ok) {
        setMessage("Request submitted successfully.");
        setTimeout(() => {
          window.location.href = "/website/mystays";
        }, 1500);
      } else {
        setMessage("Request saved locally. We will review it soon.");
        setTimeout(() => {
          window.location.href = "/website/mystays";
        }, 1500);
      }
    } catch (_) {
      setMessage("Request saved locally. We will review it soon.");
      setTimeout(() => {
        window.location.href = "/website/mystays";
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  }, [apiUrl, booking, form, paymentMethod, requestType]);
  useHtmlPage({
    title: "Refund/Alternative Request - Roomhy",
    bodyClass: "",
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
    "href": "/website/assets/css/refund-request.css"
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
    inlineScripts: []
  });

  return (
    <div className="html-page">
      
      
      
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto px-4 sm:px-6">
              <div className="flex h-20 items-center justify-between">
                  <div className="flex items-center">
                      <a href="/website/index" className="flex-shrink-0">
                          <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-10 w-25" />
                      </a>
                  </div>
                  <button id="logoutBtn" onClick={() => logoutWebsite("login")} className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">
                      Logout
                  </button>
              </div>
          </div>
      </header>
      
      
      <section className="relative py-16 md:py-20 text-white">
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-blue-700"></div>
          <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
              <h1 className="text-3xl md:text-4xl font-bold text-shadow mb-4">Refund/Alternative Request</h1>
              <p className="text-lg text-blue-100">Submit your refund or alternative property request</p>
          </div>
      </section>
      
      
      <main className="container mx-auto px-4 sm:px-6 py-16">
          
          <div id="loadingState" className={`text-center py-12 ${loading ? "" : "hidden"}`}>
              <div className="inline-block">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 mt-4 text-lg">Loading booking details...</p>
          </div>
      
          
          <div id="contentSection" className={loading || errorState ? "hidden" : ""}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  <div className="lg:col-span-1">
                      <div className="light-card rounded-xl p-6 sticky top-24">
                          <h2 className="text-2xl font-bold text-gray-900 mb-6">Booking Details</h2>
                          
                          
                          <div className="mb-6 rounded-lg overflow-hidden bg-gray-200" style={{ height: "200px" }}>
                              <img
                                  id="propertyImage"
                                  src={booking?.propertyImage || booking?.property_image || "https://images.unsplash.com/photo-1567016432779-1fee749a1532?q=80&w=400"}
                                  alt="Property"
                                  className="w-full h-full object-cover"
                              />
                          </div>
      
                          
                          <div className="mb-4">
                              <p className="text-sm text-gray-600 font-semibold mb-1">PROPERTY NAME</p>
                              <p id="propertyName" className="text-lg font-bold text-gray-900">
                                  {booking?.propertyName || booking?.property_name || "Property"}
                              </p>
                          </div>
      
                          
                          <div className="mb-4">
                              <p className="text-sm text-gray-600 font-semibold mb-1">PROPERTY ID</p>
                              <p id="propertyIdDisplay" className="text-sm font-mono text-blue-600 font-bold">
                                  {booking?.propertyId || booking?.property_id || "N/A"}
                              </p>
                          </div>
      
                          
                          <div className="mb-4">
                              <p className="text-sm text-gray-600 font-semibold mb-1">BOOKING ID</p>
                              <p id="bookingIdDisplay" className="text-sm font-mono text-gray-700 font-bold">
                                  {booking?.bookingId || booking?.booking_id || booking?._id || "N/A"}
                              </p>
                          </div>
      
                          
                          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-600 font-semibold mb-1">BOOKING AMOUNT</p>
                              <p id="bookingAmount" className="text-2xl font-bold text-blue-600">₹0</p>
                          </div>
      
                          
                          <div className="mb-6">
                              <p className="text-sm text-gray-600 font-semibold mb-2">STATUS</p>
                              <div id="statusBadge" className="status-badge status-pending">
                                  <i data-lucide="clock" className="w-4 h-4"></i>
                                  <span>{booking?.status || "Pending"}</span>
                              </div>
                          </div>
      
                          
                          <button onClick={() => { window.location.href = "/website/mystays"; }} className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition">
                              ← Back to My Stays
                          </button>
                      </div>
                  </div>
      
                  
                  <div className="lg:col-span-2">
                      <div className="light-card rounded-xl p-8">
                          <h2 className="text-2xl font-bold text-gray-900 mb-6">Request Type</h2>
      
                          
                          <div className="space-y-4 mb-8">
                              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition" id="refundLabel">
                                  <input
                                      type="radio"
                                      name="requestType"
                                      value="refund"
                                      checked={requestType === "refund"}
                                      onChange={() => setRequestType("refund")}
                                      className="w-5 h-5 text-blue-600"
                                  />
                                  <div className="ml-4">
                                      <p className="font-bold text-gray-900">Request Refund</p>
                                      <p className="text-sm text-gray-600">Get your refund to UPI or Bank Account</p>
                                  </div>
                              </label>
      
                              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition" id="alternativeLabel">
                                  <input
                                      type="radio"
                                      name="requestType"
                                      value="alternative_property"
                                      checked={requestType === "alternative_property"}
                                      onChange={() => setRequestType("alternative_property")}
                                      className="w-5 h-5 text-blue-600"
                                  />
                                  <div className="ml-4">
                                      <p className="font-bold text-gray-900">Request Alternative Property</p>
                                      <p className="text-sm text-gray-600">Browse and choose a different property</p>
                                  </div>
                              </label>
                          </div>
      
                          
                          <div id="refundSection" className={`space-y-6 mb-8 pb-8 border-b border-gray-200 ${requestType === "refund" ? "" : "hidden"}`}>
                              <h3 className="text-xl font-bold text-gray-900">Refund Details</h3>
      
                              
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                                  <input
                                      type="text"
                                      id="refundName"
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="Your full name"
                                      value={form.refundName}
                                      onChange={(e) => setForm((prev) => ({ ...prev, refundName: e.target.value }))}
                                  />
                              </div>
      
                              
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                                  <input
                                      type="tel"
                                      id="refundPhone"
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="+91 98765 43210"
                                      value={form.refundPhone}
                                      onChange={(e) => setForm((prev) => ({ ...prev, refundPhone: e.target.value }))}
                                  />
                              </div>
      
                              
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                                  <input
                                      type="email"
                                      id="refundEmail"
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="your@email.com"
                                      value={form.refundEmail}
                                      onChange={(e) => setForm((prev) => ({ ...prev, refundEmail: e.target.value }))}
                                  />
                              </div>
      
                              
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-3">Payment Method *</label>
                                  <div className="grid grid-cols-2 gap-3">
                                      <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition">
                                          <input
                                              type="radio"
                                              name="paymentMethod"
                                              value="upi"
                                              checked={paymentMethod === "upi"}
                                              onChange={() => setPaymentMethod("upi")}
                                              className="w-4 h-4 text-blue-600"
                                          />
                                          <span className="ml-2 font-semibold text-gray-900">UPI</span>
                                      </label>
                                      <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition">
                                          <input
                                              type="radio"
                                              name="paymentMethod"
                                              value="bank"
                                              checked={paymentMethod === "bank"}
                                              onChange={() => setPaymentMethod("bank")}
                                              className="w-4 h-4 text-blue-600"
                                          />
                                          <span className="ml-2 font-semibold text-gray-900">Bank</span>
                                      </label>
                                  </div>
                              </div>
      
                              
                              <div id="upiField" className={paymentMethod === "upi" ? "block" : "hidden"}>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">UPI ID *</label>
                                  <input
                                      type="text"
                                      id="upiId"
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="yourname@upi"
                                      value={form.upiId}
                                      onChange={(e) => setForm((prev) => ({ ...prev, upiId: e.target.value }))}
                                  />
                              </div>
      
                              
                              <div id="bankFields" className={paymentMethod === "bank" ? "space-y-3" : "hidden space-y-3"}>
                                  <div>
                                      <label className="block text-sm font-semibold text-gray-700 mb-2">Account Holder Name *</label>
                                      <input
                                          type="text"
                                          id="bankName"
                                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          placeholder="Name on account"
                                          value={form.bankName}
                                          onChange={(e) => setForm((prev) => ({ ...prev, bankName: e.target.value }))}
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number *</label>
                                      <input
                                          type="text"
                                          id="bankAccount"
                                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          placeholder="12345678901234"
                                          value={form.bankAccount}
                                          onChange={(e) => setForm((prev) => ({ ...prev, bankAccount: e.target.value }))}
                                      />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                      <div>
                                          <label className="block text-sm font-semibold text-gray-700 mb-2">IFSC Code *</label>
                                          <input
                                              type="text"
                                              id="ifscCode"
                                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              placeholder="SBIN0001234"
                                              value={form.ifscCode}
                                              onChange={(e) => setForm((prev) => ({ ...prev, ifscCode: e.target.value }))}
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name *</label>
                                          <input
                                              type="text"
                                              id="bankNameField"
                                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              placeholder="Bank Name"
                                              value={form.bankNameField}
                                              onChange={(e) => setForm((prev) => ({ ...prev, bankNameField: e.target.value }))}
                                          />
                                      </div>
                                  </div>
                              </div>
      
                              
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Refund</label>
                                  <textarea
                                      id="refundReason"
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      rows="3"
                                      placeholder="Tell us why you want a refund..."
                                      value={form.refundReason}
                                      onChange={(e) => setForm((prev) => ({ ...prev, refundReason: e.target.value }))}
                                  ></textarea>
                              </div>
      
                              
                              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                  <p className="text-sm text-green-800">
                                      <span className="font-semibold">Refund Amount:</span>{" "}
                                      <span className="text-2xl font-bold text-green-600" id="refundAmount">
                                          ₹{bookingAmountValue || 500}
                                      </span>
                                  </p>
                              </div>
                          </div>
      
                          
                          <div id="alternativeSection" className={`space-y-6 pb-8 ${requestType === "alternative_property" ? "" : "hidden"}`}>
                              <h3 className="text-xl font-bold text-gray-900">Alternative Property Preferences</h3>
      
                              
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Area/Location *</label>
                                  <input
                                      type="text"
                                      id="preferredArea"
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="e.g., Whitefield, Marathahalli"
                                      value={form.preferredArea}
                                      onChange={(e) => setForm((prev) => ({ ...prev, preferredArea: e.target.value }))}
                                  />
                              </div>
      
                              
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Property Type</label>
                                  <select
                                      id="propertyType"
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      value={form.propertyType}
                                      onChange={(e) => setForm((prev) => ({ ...prev, propertyType: e.target.value }))}
                                  >
                                      <option value="">Select type...</option>
                                      <option value="pg">PG / Co-Living</option>
                                      <option value="hostel">Hostel</option>
                                      <option value="flat">Flat / Studio</option>
                                  </select>
                              </div>
      
                              
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-semibold text-gray-700 mb-2">Min Price (₹)</label>
                                      <input
                                          type="number"
                                          id="minPrice"
                                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          placeholder="5000"
                                          value={form.minPrice}
                                          onChange={(e) => setForm((prev) => ({ ...prev, minPrice: e.target.value }))}
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-semibold text-gray-700 mb-2">Max Price (₹)</label>
                                      <input
                                          type="number"
                                          id="maxPrice"
                                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          placeholder="20000"
                                          value={form.maxPrice}
                                          onChange={(e) => setForm((prev) => ({ ...prev, maxPrice: e.target.value }))}
                                      />
                                  </div>
                              </div>
      
                              
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your Requirements</label>
                                  <textarea
                                      id="propertyRequirements"
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      rows="4"
                                      placeholder="Describe your requirements..."
                                      value={form.propertyRequirements}
                                      onChange={(e) => setForm((prev) => ({ ...prev, propertyRequirements: e.target.value }))}
                                  ></textarea>
                              </div>
                          </div>
      
                          
                          <div className="flex gap-4 pt-8">
                              <button onClick={() => { window.location.href = "/website/mystays"; }} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition">
                                  Cancel
                              </button>
                              <button onClick={submitRequest} disabled={submitting} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                                  <i data-lucide="send" className="w-5 h-5"></i>
                                  <span>{submitting ? "Submitting..." : "Submit Request"}</span>
                              </button>
                          </div>
                          {message && <p className="mt-4 text-sm text-center text-blue-600">{message}</p>}
                      </div>
                  </div>
              </div>
          </div>
      
          
          <div id="errorState" className={errorState ? "" : "hidden"}>
              <div className="light-card rounded-xl p-12 text-center">
                  <div className="mb-6">
                      <i data-lucide="alert-circle" className="w-16 h-16 text-red-500 mx-auto"></i>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Booking Details</h2>
                  <p className="text-gray-600 mb-8">We couldn't find your booking information. Please go back to My Stays and try again.</p>
                  <a href="/website/mystays" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                      ← Back to My Stays
                  </a>
              </div>
          </div>
      </main>
      
      
      <footer className="bg-gray-900 text-gray-400 py-12 mt-20">
          <div className="container mx-auto px-4 sm:px-6 text-center">
              <p className="text-sm">&copy; 2024 RoomHy. All rights reserved.</p>
          </div>
      </footer>
      
      
      
      
    </div>
  );
}


