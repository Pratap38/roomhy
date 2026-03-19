import React, { useEffect, useMemo, useState } from "react";
import { fetchJson } from "../../utils/api";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import { requireOwnerSession } from "../../utils/ownerSession";

export default function Booking() {
  useHtmlPage({
    title: "Bookings - Roomhy",
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
      { rel: "stylesheet", href: "/propertyowner/assets/css/booking.css" }
    ],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" }
    ],
    inlineScripts: []
  });

  const [owner, setOwner] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const confirmed = useMemo(() => {
    const statusSet = new Set(["approved", "accepted", "confirmed", "booked"]);
    return bookings.filter((b) => statusSet.has(String(b.status || "").toLowerCase()));
  }, [bookings]);

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [confirmed, loading]);

  useEffect(() => {
    const session = requireOwnerSession();
    if (!session) return;
    setOwner(session);
    const load = async () => {
      try {
        const data = await fetchJson("/api/bookings/requests");
        const list = Array.isArray(data) ? data : data?.requests || data?.data || [];
        const ownerId = String(session.loginId || "").toUpperCase();
        const filtered = list.filter((item) => {
          if (!ownerId) return true;
          const itemOwner =
            item.ownerLoginId ||
            item.ownerId ||
            item.owner ||
            item.propertyOwnerId ||
            item.property?.ownerLoginId;
          return itemOwner ? String(itemOwner).toUpperCase() === ownerId : true;
        });
        setBookings(filtered);
      } catch (err) {
        setErrorMsg(err?.body || err?.message || "Failed to load bookings.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <PropertyOwnerLayout owner={owner} title="Confirmed Bookings" icon="book-open">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <i data-lucide="book-open" className="w-6 h-6 text-purple-600"></i>
          Confirmed Bookings
        </h1>
        <p className="text-gray-600 mt-2">Bookings where both parties have agreed.</p>
      </div>

      {errorMsg && <div className="text-sm text-red-600 mb-4">{errorMsg}</div>}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <th className="px-4 py-3 whitespace-nowrap">Property</th>
                <th className="px-4 py-3 whitespace-nowrap">Tenant</th>
                <th className="px-4 py-3 whitespace-nowrap">Contact</th>
                <th className="px-4 py-3 whitespace-nowrap">Rent</th>
                <th className="px-4 py-3 whitespace-nowrap">Visit Date</th>
                <th className="px-4 py-3 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Loading bookings...
                  </td>
                </tr>
              )}
              {!loading && confirmed.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No confirmed bookings found.
                  </td>
                </tr>
              )}
              {!loading && confirmed.map((booking) => (
                <tr key={booking._id || booking.id}>
                  <td className="px-4 py-3">{booking.propertyName || booking.property?.title || "-"}</td>
                  <td className="px-4 py-3">{booking.tenantName || booking.name || "-"}</td>
                  <td className="px-4 py-3">{booking.tenantPhone || booking.phone || booking.email || "-"}</td>
                  <td className="px-4 py-3">{booking.rentAmount || booking.rent || "-"}</td>
                  <td className="px-4 py-3">{booking.visitDate ? new Date(booking.visitDate).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-3 capitalize">{booking.status || "confirmed"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PropertyOwnerLayout>
  );
}
