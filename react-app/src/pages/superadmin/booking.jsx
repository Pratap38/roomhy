import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function SuperadminBookingPage() {
  useHtmlPage({
    title: "Roomhy - Bookings",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: true },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
      { rel: "stylesheet", href: "/superadmin/assets/css/booking.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadBookings = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await fetchJson("/api/booking/requests");
      const rows = data?.data || [];
      setBookings(rows);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Error loading bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [bookings, search, statusFilter]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const status = String(booking.booking_status || booking.bookingStatus || booking.status || "pending").toLowerCase();
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const haystack = JSON.stringify(booking).toLowerCase();
      const matchesSearch = !search.trim() || haystack.includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [bookings, search, statusFilter]);

  const stats = useMemo(() => {
    const confirmed = bookings.filter((item) => ["confirmed", "active", "completed", "booked"].includes(String(item.booking_status || item.bookingStatus || item.status || "").toLowerCase()));
    const pending = bookings.filter((item) => String(item.status || item.booking_status || "pending").toLowerCase() === "pending");
    const totalValue = confirmed.reduce((sum, item) => sum + Number(item.payment_amount || item.total_amount || item.totalAmount || 0), 0);
    return { confirmed: confirmed.length, pending: pending.length, totalValue };
  }, [bookings]);

  return (
    <div className="html-page bg-[#f3f4f6] min-h-screen">
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Booking Requests</h1>
            <p className="text-sm text-slate-500 mt-1">All booking-form completions and booking requests from MongoDB.</p>
          </div>
          <button onClick={loadBookings} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center shadow-md">
            <i data-lucide="refresh-cw" className="w-4 h-4 mr-2"></i> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-slate-500">Total Bookings</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{bookings.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-slate-500">Confirmed / Active</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.confirmed}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-slate-500">Booking Value</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{formatCurrency(stats.totalValue)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4 flex flex-col md:flex-row gap-4">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search booking id, user, property, phone..." className="w-full md:flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs uppercase text-gray-500">
                  <th className="px-4 py-4">Booking</th>
                  <th className="px-4 py-4">Property</th>
                  <th className="px-4 py-4">Tenant</th>
                  <th className="px-4 py-4">Contact</th>
                  <th className="px-4 py-4">Guardian</th>
                  <th className="px-4 py-4">Address</th>
                  <th className="px-4 py-4">Payment</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Dates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-gray-400">Loading bookings...</td>
                  </tr>
                )}
                {!loading && errorMsg && (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-red-500">{errorMsg}</td>
                  </tr>
                )}
                {!loading && !errorMsg && filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-gray-400">No bookings found</td>
                  </tr>
                )}
                {filteredBookings.map((booking) => {
                  const bookingStatus = booking.booking_status || booking.bookingStatus || booking.status || "pending";
                  const address = booking.full_address || [booking.address_street, booking.address_city, booking.address_state, booking.address_postal_code].filter(Boolean).join(", ") || "-";
                  return (
                    <tr key={booking._id} className="hover:bg-gray-50 align-top text-sm">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{booking._id?.slice(-8)?.toUpperCase() || "-"}</div>
                        <div className="text-xs text-slate-500">{booking.user_id || "-"}</div>
                        <div className="text-xs text-slate-500">{booking.request_type || "-"}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{booking.property_name || booking.property_id || "-"}</div>
                        <div className="text-xs text-slate-500">{booking.area || "-"}</div>
                        <div className="text-xs text-slate-500">{booking.property_type || "-"}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{booking.name || "-"}</div>
                        <div className="text-xs text-slate-500">{booking.email || "-"}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{booking.phone || "-"}</td>
                      <td className="px-4 py-4">
                        <div>{booking.guardian_name || "-"}</div>
                        <div className="text-xs text-slate-500">{booking.guardian_phone || "-"}</div>
                      </td>
                      <td className="px-4 py-4 max-w-xs whitespace-normal break-words text-slate-700">{address}</td>
                      <td className="px-4 py-4">
                        <div className="font-mono text-xs text-slate-900">{booking.payment_id || booking.paymentId || "-"}</div>
                        <div className="text-xs text-slate-500">{booking.payment_method || "-"}</div>
                        <div className="text-xs text-slate-500">{booking.payment_status || "-"}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{formatCurrency(booking.payment_amount || booking.total_amount || booking.totalAmount || 0)}</div>
                        <div className="text-xs text-slate-500">Rent {formatCurrency(booking.rent_amount || 0)}</div>
                        <div className="text-xs text-slate-500">Bid {formatCurrency(booking.bid_amount || 0)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${String(bookingStatus).toLowerCase() === "confirmed" || String(bookingStatus).toLowerCase() === "active" || String(bookingStatus).toLowerCase() === "completed" ? "bg-green-100 text-green-800" : String(bookingStatus).toLowerCase() === "rejected" || String(bookingStatus).toLowerCase() === "cancelled" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                          {bookingStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        <div>Created: {formatDate(booking.created_at || booking.createdAt)}</div>
                        <div className="text-xs text-slate-500">Check-in: {formatDate(booking.check_in_date || booking.checkInDate)}</div>
                        <div className="text-xs text-slate-500">Check-out: {formatDate(booking.check_out_date || booking.checkOutDate)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
