import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { getWebsiteApiUrl, getWebsiteUserEmail, getWebsiteUserId } from "../../utils/websiteSession";
import { useLucideIcons, useWebsiteCommon } from "../../utils/websiteUi";

export default function WebsiteMystaysBookings() {
  useWebsiteCommon();

  const apiUrl = useMemo(() => getWebsiteApiUrl(), []);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [requestType, setRequestType] = useState("refund");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    upiId: "",
    bankAccountName: "",
    bankAccount: "",
    ifscCode: "",
    bankName: "",
    preferredArea: "",
    requirements: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  useLucideIcons([bookings, selectedBooking, requestType, paymentMethod, feedback]);

  const extractImageUrls = useCallback((value) => {
    const isValid = (url) => {
      if (!url || typeof url !== "string") return false;
      const trimmed = url.trim();
      if (!trimmed) return false;
      const lowered = trimmed.toLowerCase();
      if (lowered === "null" || lowered === "undefined" || lowered === "[object object]") return false;
      return /^https?:\/\//.test(trimmed) || trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../");
    };

    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === "string") return item.trim();
          if (item && typeof item === "object") return item.url || item.secure_url || item.src || item.image || "";
          return "";
        })
        .filter(isValid);
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (isValid(trimmed)) return [trimmed];
      try {
        const parsed = JSON.parse(trimmed);
        return extractImageUrls(parsed);
      } catch {
        return trimmed
          .split(",")
          .map((item) => item.trim())
          .filter(isValid);
      }
    }
    if (typeof value === "object") {
      return [value.url || value.secure_url || value.src || value.image || ""].filter(isValid);
    }
    return [];
  }, []);

  const collectBookings = useCallback(async () => {
    const collected = [];
    const seen = new Set();

    const addBooking = (booking) => {
      if (!booking || typeof booking !== "object") return;
      const key = booking.booking_id || booking.bookingId || booking._id || booking.id;
      const fallbackKey = `${booking.user_id || booking.userId || ""}::${booking.property_id || booking.propertyId || ""}::${booking.payment_id || booking.paymentId || ""}`;
      const finalKey = String(key || fallbackKey);
      if (!finalKey || seen.has(finalKey)) return;
      seen.add(finalKey);
      collected.push(booking);
    };

    try {
      const sessionBooking = sessionStorage.getItem("bookingConfirmation");
      if (sessionBooking) addBooking(JSON.parse(sessionBooking));
    } catch (err) {
      console.warn("Failed to parse session booking:", err);
    }

    try {
      const localBooking = localStorage.getItem("lastBooking");
      if (localBooking) addBooking(JSON.parse(localBooking));
    } catch (err) {
      console.warn("Failed to parse local booking:", err);
    }

    const userId = getWebsiteUserId() || localStorage.getItem("userId") || sessionStorage.getItem("userId");
    const userEmail = getWebsiteUserEmail() || localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail");
    if (userId || userEmail) {
      const identity = userId || userEmail;
      const querySuffix = userEmail ? `?email=${encodeURIComponent(userEmail)}` : "";
      const endpoints = [
        `${apiUrl}/api/booking/user/${encodeURIComponent(identity)}${querySuffix}`,
        `${apiUrl}/api/bookings/user/${encodeURIComponent(identity)}${querySuffix}`
      ];
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, { method: "GET", headers: { "Content-Type": "application/json" } });
          if (res.status === 404) continue;
          if (!res.ok) break;
          const data = await res.json();
          const apiBookings = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
          apiBookings.forEach(addBooking);
          break;
        } catch (err) {
          console.warn("Booking API failed:", err);
          break;
        }
      }
    }

    setBookings(collected);
    setLoading(false);
  }, [apiUrl]);

  useEffect(() => {
    collectBookings();
  }, [collectBookings]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateString;
    }
  };

  const openRefundModal = (booking, type = "refund") => {
    setSelectedBooking(booking);
    setRequestType(type);
    setPaymentMethod("upi");
    setFeedback("");
    setFormData((prev) => ({
      ...prev,
      name: booking.name || booking.user_name || "",
      phone: booking.phone || booking.user_phone || "",
      email: booking.email || booking.user_email || booking.userEmail || ""
    }));
  };

  const closeRefundModal = () => {
    setSelectedBooking(null);
    setFeedback("");
  };

  const handleRefundSubmit = async () => {
    if (!selectedBooking) return;
    const name = formData.name.trim();
    const phone = formData.phone.trim();
    const email = formData.email.trim();
    if (!name || !phone) {
      setFeedback("Please enter name and phone number.");
      return;
    }
    if (requestType === "refund" && !paymentMethod) {
      setFeedback("Please select a refund method.");
      return;
    }
    if (requestType === "refund" && paymentMethod === "upi" && !formData.upiId.trim()) {
      setFeedback("Please enter your UPI ID.");
      return;
    }
    if (
      requestType === "refund" &&
      paymentMethod === "bank" &&
      (!formData.bankAccount.trim() || !formData.ifscCode.trim() || !formData.bankName.trim())
    ) {
      setFeedback("Please enter all bank details.");
      return;
    }

    const payload = {
      booking_id: selectedBooking.booking_id || selectedBooking.bookingId || selectedBooking._id || selectedBooking.id || "",
      user_id:
        selectedBooking.user_id ||
        selectedBooking.userId ||
        localStorage.getItem("userId") ||
        sessionStorage.getItem("userId") ||
        "",
      payment_id:
        selectedBooking.payment_id ||
        selectedBooking.paymentId ||
        selectedBooking._id ||
        selectedBooking.bookingId ||
        "",
      user_name: name,
      user_phone: phone,
      user_email: email,
      refund_amount: Number(selectedBooking.total_amount || selectedBooking.totalAmount || selectedBooking.price || 500),
      request_type: requestType,
      refund_method: requestType === "refund" ? paymentMethod : null,
      upi_id: paymentMethod === "upi" ? formData.upiId.trim() : null,
      bank_account_holder: paymentMethod === "bank" ? formData.bankAccountName.trim() : null,
      bank_account_number: paymentMethod === "bank" ? formData.bankAccount.trim() : null,
      bank_ifsc_code: paymentMethod === "bank" ? formData.ifscCode.trim() : null,
      bank_name: paymentMethod === "bank" ? formData.bankName.trim() : null,
      preferred_area: requestType === "alternative_property" ? formData.preferredArea.trim() : null,
      property_requirements: requestType === "alternative_property" ? formData.requirements.trim() : null
    };

    setSubmitting(true);
    setFeedback("");
    try {
      const res = await fetch(`${apiUrl}/api/booking/refund-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Request failed");
      }
      closeRefundModal();
    } catch (err) {
      console.warn("Refund request failed:", err);
      const submissions = JSON.parse(localStorage.getItem("refundSubmissions") || "[]");
      submissions.push({ ...payload, submitted_at: new Date().toISOString(), status: "pending_sync" });
      localStorage.setItem("refundSubmissions", JSON.stringify(submissions));
      closeRefundModal();
    } finally {
      setSubmitting(false);
    }
  };

  useHtmlPage({
    title: "My Stays & Bookings - Roomhy",
    bodyClass: "",
    htmlAttrs: {
      lang: "en"
    },
    metas: [
      {
        charset: "UTF-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0"
      }
    ],
    bases: [],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com"
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossorigin: true
      },
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      },
      {
        rel: "stylesheet",
        href: "/website/assets/css/mystays-bookings.css"
      }
    ],
    styles: [],
    scripts: [
      {
        src: "https://cdn.tailwindcss.com"
      },
      {
        src: "https://unpkg.com/lucide@latest"
      }
    ],
    inlineScripts: []
  });

  return (
    <div className="html-page">
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Stays & Bookings</h1>
                <p className="text-gray-600 mt-1">View and manage your property bookings</p>
              </div>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                ← Back
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div id="loadingState" className={`text-center py-12 ${loading ? "" : "hidden"}`}>
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 mt-4">Loading your bookings...</p>
          </div>

          <div id="bookingsContainer" className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ${loading || bookings.length === 0 ? "hidden" : ""}`}>
            {bookings.map((booking) => {
              const propertyName = booking.property_name || booking.propertyName || "Property";
              const propertyLocation = booking.property_location || booking.location || booking.area || "Location";
              const propertyType = booking.property_type || booking.type || "Stay";
              const propertyPrice = booking.total_amount || booking.totalAmount || booking.price || booking.rentAmount || 0;
              const stayDate = booking.booking_date || booking.createdAt || booking.updatedAt || booking.date;
              const bookingStatus = booking.status || "Confirmed";
              const images = extractImageUrls(booking.property_image || booking.propertyImage || booking.images || booking.photos);
              const cover = images[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=600";
              return (
                <div key={booking.booking_id || booking.bookingId || booking._id || propertyName} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="h-48 bg-gray-200 relative">
                    <img src={cover} alt={propertyName} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-purple-600 uppercase">{propertyType}</span>
                      <span className="text-xs font-semibold text-gray-500">{bookingStatus}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{propertyName}</h3>
                      <p className="text-sm text-gray-600">{propertyLocation}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Stay date</span>
                      <span className="font-semibold text-gray-900">{formatDate(stayDate)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Total amount</span>
                      <span className="font-semibold text-gray-900">₹{Number(propertyPrice || 0)}</span>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => openRefundModal(booking, "refund")}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2 text-sm"
                      >
                        <i data-lucide="undo-2" className="w-4 h-4"></i>
                        <span>Refund</span>
                      </button>
                      <button
                        onClick={() => openRefundModal(booking, "alternative_property")}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
                      >
                        <i data-lucide="repeat" className="w-4 h-4"></i>
                        <span>Alternative</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div id="emptyState" className={`text-center py-16 ${loading || bookings.length > 0 ? "hidden" : ""}`}>
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No bookings yet</h3>
            <p className="mt-1 text-gray-600">You haven't made any bookings. Start exploring properties today!</p>
            <button onClick={() => { window.location.href = "/"; }} className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Browse Properties
            </button>
          </div>
        </main>
      </div>

      <div id="refundModal" className={`modal fixed inset-0 z-50 ${selectedBooking ? "flex" : "hidden"} bg-black bg-opacity-50 overflow-y-auto`}>
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Refund Request</h2>
              <button onClick={closeRefundModal} className="text-white hover:text-gray-200">
                <i data-lucide="x" className="w-6 h-6"></i>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-bold text-purple-900 mb-2" id="modalPropertyName">
                  {selectedBooking?.property_name || selectedBooking?.propertyName || "Property"}
                </h3>
                <p className="text-purple-800 text-sm" id="modalPropertyDetails">
                  {selectedBooking?.property_location || selectedBooking?.location || selectedBooking?.area || ""}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">What would you like to do?</label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="refundOption"
                      name="requestType"
                      value="refund"
                      checked={requestType === "refund"}
                      onChange={() => setRequestType("refund")}
                      className="h-4 w-4 text-purple-600"
                    />
                    <label htmlFor="refundOption" className="ml-3 flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">Request Refund</span>
                      <span className="text-xs text-gray-600">Get ₹500 refund to your UPI/Bank account</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="alternativeOption"
                      name="requestType"
                      value="alternative_property"
                      checked={requestType === "alternative_property"}
                      onChange={() => setRequestType("alternative_property")}
                      className="h-4 w-4 text-purple-600"
                    />
                    <label htmlFor="alternativeOption" className="ml-3 flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">Alternative Property</span>
                      <span className="text-xs text-gray-600">Browse other properties instead</span>
                    </label>
                  </div>
                </div>
              </div>

              <div id="refundForm" className={`space-y-4 ${requestType === "refund" ? "" : "hidden"}`}>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    id="refundName"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    id="refundPhone"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Payment Method</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="upiMethod"
                        name="paymentMethod"
                        value="upi"
                        checked={paymentMethod === "upi"}
                        onChange={() => setPaymentMethod("upi")}
                        className="h-4 w-4 text-purple-600"
                      />
                      <label htmlFor="upiMethod" className="ml-3 flex flex-col cursor-pointer flex-1">
                        <span className="text-sm font-semibold text-gray-900">UPI</span>
                        <span className="text-xs text-gray-600">Fast & Instant</span>
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="bankMethod"
                        name="paymentMethod"
                        value="bank"
                        checked={paymentMethod === "bank"}
                        onChange={() => setPaymentMethod("bank")}
                        className="h-4 w-4 text-purple-600"
                      />
                      <label htmlFor="bankMethod" className="ml-3 flex flex-col cursor-pointer flex-1">
                        <span className="text-sm font-semibold text-gray-900">Bank</span>
                        <span className="text-xs text-gray-600">Transfer</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div id="upiField" className={paymentMethod === "upi" ? "block" : "hidden"}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">UPI ID</label>
                  <input
                    type="text"
                    id="upiId"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="yourname@upi"
                    value={formData.upiId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, upiId: e.target.value }))}
                  />
                </div>

                <div id="bankFields" className={paymentMethod === "bank" ? "space-y-3" : "hidden space-y-3"}>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Account Holder Name</label>
                    <input
                      type="text"
                      id="bankName"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Name on bank account"
                      value={formData.bankAccountName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bankAccountName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
                    <input
                      type="text"
                      id="bankAccount"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="12345678901234"
                      value={formData.bankAccount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bankAccount: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">IFSC Code</label>
                      <input
                        type="text"
                        id="ifscCode"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="SBIN0001234"
                        value={formData.ifscCode}
                        onChange={(e) => setFormData((prev) => ({ ...prev, ifscCode: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
                      <input
                        type="text"
                        id="bankNameField"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="State Bank of India"
                        value={formData.bankName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, bankName: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div id="alternativeForm" className={`space-y-4 ${requestType === "alternative_property" ? "" : "hidden"}`}>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Area/Location</label>
                  <input
                    type="text"
                    id="preferredArea"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Whitefield, Marathahalli"
                    value={formData.preferredArea}
                    onChange={(e) => setFormData((prev) => ({ ...prev, preferredArea: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Property Requirements</label>
                  <textarea
                    id="propertyRequirements"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                    placeholder="Any specific requirements..."
                    value={formData.requirements}
                    onChange={(e) => setFormData((prev) => ({ ...prev, requirements: e.target.value }))}
                  ></textarea>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">Refund Amount:</span>{" "}
                  <span className="text-2xl font-bold text-green-600">
                    ₹{Number(selectedBooking?.total_amount || selectedBooking?.totalAmount || selectedBooking?.price || 500)}
                  </span>
                </p>
              </div>
              {feedback && <p className="text-sm text-red-600">{feedback}</p>}
            </div>

            <div className="bg-gray-50 px-8 py-4 flex justify-between gap-3">
              <button onClick={closeRefundModal} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={handleRefundSubmit} disabled={submitting} className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700">
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


