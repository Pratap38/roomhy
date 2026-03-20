import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import {
  buildBookingFormLink,
  clearOwnerRuntimeSession,
  createOwnerChatRoom,
  fetchBookingRequestsForOwner,
  formatDate,
  getOwnerRuntimeSession,
  normalizeBooking,
  resolveWebsiteChatUserId,
  updateBookingDecision
} from "../../utils/propertyowner";

export default function BookingRequest() {
  useHtmlPage({
    title: "Roomhy - Booking Requests",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      },
      { rel: "stylesheet", href: "/propertyowner/assets/css/booking_request.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const navigate = useNavigate();
  const [owner, setOwner] = useState(null);
  const [activeTab, setActiveTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [requests, bids, activeTab, loading, statusFilter, search]);

  const loadBookingRequests = async (session) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const requestList = await fetchBookingRequestsForOwner(session.loginId);
      const normalized = requestList.map(normalizeBooking);
      setRequests(normalized.filter((item) => String(item.request_type || item.type || "").toLowerCase() !== "bid"));
      setBids(normalized.filter((item) => String(item.request_type || item.type || "").toLowerCase() === "bid"));
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to load booking requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = getOwnerRuntimeSession();
    if (!session?.loginId) {
      window.location.href = "/propertyowner/ownerlogin";
      return;
    }
    setOwner(session);
    loadBookingRequests(session);
  }, []);

  const visibleRequests = useMemo(
    () =>
      requests.filter((item) => {
        const matchesStatus = statusFilter ? String(item.status || "").toLowerCase() === statusFilter : true;
        const haystack = [item.propertyName, item.propertyId, item.userId, item.userName, item.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const matchesSearch = search ? haystack.includes(search.toLowerCase()) : true;
        return matchesStatus && matchesSearch;
      }),
    [requests, search, statusFilter]
  );

  const visibleBids = useMemo(
    () =>
      bids.filter((item) => {
        const matchesStatus = statusFilter ? String(item.status || "").toLowerCase() === statusFilter : true;
        const haystack = [
          item.propertyName,
          item.propertyId,
          item.userId,
          item.userName || item.fullName,
          item.email,
          item.minPrice,
          item.maxPrice
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const matchesSearch = search ? haystack.includes(search.toLowerCase()) : true;
        return matchesStatus && matchesSearch;
      }),
    [bids, search, statusFilter]
  );

  const handleDecision = async (booking, action) => {
    try {
      await updateBookingDecision(booking.key, action);
      if (action === "approve") {
        const websiteUserId = resolveWebsiteChatUserId(booking);
        await createOwnerChatRoom({
          bookingId: booking.key,
          userName: booking.userName,
          userEmail: booking.email,
          userLoginId: websiteUserId,
          ownerId: owner?.loginId,
          ownerName: owner?.name,
          propertyName: booking.propertyName
        });
      }
      if (owner) {
        await loadBookingRequests(owner);
      }
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to update booking status.");
    }
  };

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Booking Requests"
      navVariant="default"
      notificationCount={visibleRequests.filter((item) => String(item.status).toLowerCase() === "pending").length}
      showNotificationSettings
      onNotificationSettingsClick={() => window.alert("Notification settings are not configured in the React flow yet.")}
      onLogout={() => {
        clearOwnerRuntimeSession();
        window.location.href = "/propertyowner/ownerlogin";
      }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <i data-lucide="calendar-check" className="w-8 h-8 text-purple-600"></i>
          Booking Requests &amp; Bids
        </h1>
        <p className="text-gray-600 mt-2">Manage booking requests and bids from tenants in your area</p>
      </div>

      {errorMsg ? <div className="text-sm text-red-600 mb-4">{errorMsg}</div> : null}

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by property, user, or ID..." className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
              <option value="visited">Visited</option>
            </select>
          </div>
          <div>
            <button type="button" onClick={() => owner && loadBookingRequests(owner)} className="w-full bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-700 font-medium">
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button type="button" onClick={() => setActiveTab("requests")} className={`tab-btn px-6 py-4 text-sm font-medium border-b-2 ${activeTab === "requests" ? "active border-purple-500 text-purple-600" : "text-gray-500 hover:text-gray-700 border-transparent"}`}>
              Request Booking
            </button>
            <button type="button" onClick={() => setActiveTab("bids")} className={`tab-btn px-6 py-4 text-sm font-medium ${activeTab === "bids" ? "active border-b-2 border-purple-500 text-purple-600" : "text-gray-500 hover:text-gray-700"}`}>
              Bidding
            </button>
          </nav>
        </div>
      </div>

      {activeTab === "requests" ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <th className="px-4 py-3 whitespace-nowrap">Property ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">Property Name</th>
                  <th className="px-4 py-3 whitespace-nowrap">Owner Name</th>
                  <th className="px-4 py-3 whitespace-nowrap">Area</th>
                  <th className="px-4 py-3 whitespace-nowrap">Type</th>
                  <th className="px-4 py-3 whitespace-nowrap">Rent</th>
                  <th className="px-4 py-3 whitespace-nowrap">User ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">Name</th>
                  <th className="px-4 py-3 whitespace-nowrap">Phone</th>
                  <th className="px-4 py-3 whitespace-nowrap">Email</th>
                  <th className="px-4 py-3 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody id="bookingTableBody" className="divide-y divide-gray-200">
                {loading ? (
                  <tr className="text-center py-8 text-gray-500">
                    <td colSpan={11} className="py-8">Loading booking requests...</td>
                  </tr>
                ) : null}
                {!loading && visibleRequests.length === 0 ? (
                  <tr className="text-center py-8 text-gray-500">
                    <td colSpan={11} className="py-8">
                      <i data-lucide="inbox" className="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                      <p>No booking requests found</p>
                    </td>
                  </tr>
                ) : null}
                {!loading && visibleRequests.map((booking) => (
                  <tr key={booking.key}>
                    <td className="px-4 py-3 whitespace-nowrap">{booking.propertyId}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{booking.propertyName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{booking.ownerName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{booking.area}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{booking.type}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{booking.rent}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{booking.userId}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{booking.userName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{booking.phone}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{booking.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleDecision(booking, "approve")} className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700">Approve</button>
                        <button type="button" onClick={() => handleDecision(booking, "reject")} className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Reject</button>
                        <button type="button" onClick={() => navigate(`/propertyowner/ownerchat?booking=${booking.key}&user=${encodeURIComponent(booking.userId)}`)} className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Chat</button>
                        <button type="button" onClick={() => window.open(buildBookingFormLink(booking), "_blank")} className="text-xs px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700">Booking Form</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div id="biddingSection" className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <th className="px-4 py-3 whitespace-nowrap">Bid ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">Property ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">Property Name</th>
                  <th className="px-4 py-3 whitespace-nowrap">Owner Name</th>
                  <th className="px-4 py-3 whitespace-nowrap">Full Name</th>
                  <th className="px-4 py-3 whitespace-nowrap">Gmail</th>
                  <th className="px-4 py-3 whitespace-nowrap">Gender</th>
                  <th className="px-4 py-3 whitespace-nowrap">City</th>
                  <th className="px-4 py-3 whitespace-nowrap">Area</th>
                  <th className="px-4 py-3 whitespace-nowrap">Min Price</th>
                  <th className="px-4 py-3 whitespace-nowrap">Max Price</th>
                  <th className="px-4 py-3 whitespace-nowrap">Property Type</th>
                  <th className="px-4 py-3 whitespace-nowrap">Budget Range</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 whitespace-nowrap">Submitted</th>
                  <th className="px-4 py-3 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody id="biddingTableBody" className="divide-y divide-gray-200">
                {loading ? (
                  <tr className="text-center py-8 text-gray-500">
                    <td colSpan={16} className="py-8">Loading bidding requests...</td>
                  </tr>
                ) : null}
                {!loading && visibleBids.length === 0 ? (
                  <tr className="text-center py-8 text-gray-500">
                    <td colSpan={16} className="py-8">
                      <i data-lucide="inbox" className="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                      <p>No bidding requests received</p>
                    </td>
                  </tr>
                ) : null}
                {!loading && visibleBids.map((bid) => (
                  <tr key={bid.key}>
                    <td className="px-4 py-3 whitespace-nowrap">{bid.bidId}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{bid.propertyId}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{bid.propertyName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{bid.ownerName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{bid.userName || bid.fullName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{bid.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{bid.gender}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{bid.city}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{bid.area}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{bid.minPrice}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{bid.maxPrice}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{bid.propertyType}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{bid.budgetRange}</td>
                    <td className="px-4 py-3 whitespace-nowrap capitalize">{bid.status}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(bid.submittedAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleDecision(bid, "approve")} className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700">Accept</button>
                        <button type="button" onClick={() => handleDecision(bid, "reject")} className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Reject</button>
                        <button type="button" onClick={() => navigate(`/propertyowner/ownerchat?booking=${bid.key}&user=${encodeURIComponent(bid.userId || "")}`)} className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Chat</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
