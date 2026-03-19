import React, { useEffect, useState } from "react";
import { fetchJson } from "../../utils/api";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import { getOwnerSession } from "../../utils/ownerSession";

const getQueryParam = (key) => {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search || "");
  return params.get(key) || "";
};

export default function Schedulevisit() {
  useHtmlPage({
    title: "Schedule Property Visit - Roomhy",
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
      { rel: "stylesheet", href: "/propertyowner/assets/css/schedulevisit.css" }
    ],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" }
    ],
    inlineScripts: []
  });

  const owner = getOwnerSession();
  const [form, setForm] = useState({
    visitType: "physical",
    visitDate: "",
    timeSlot: "",
    duration: "1",
    instructions: "",
    phone: "",
    email: ""
  });
  const [status, setStatus] = useState("");

  const bookingId = getQueryParam("bookingId");

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [form, status]);

  const submit = async (e) => {
    e.preventDefault();
    if (!bookingId) {
      setStatus("Missing bookingId in URL.");
      return;
    }
    try {
      await fetchJson(`/api/bookings/requests/${bookingId}/schedule-visit`, {
        method: "POST",
        body: JSON.stringify({
          visitType: form.visitType,
          visitDate: form.visitDate,
          timeSlot: form.timeSlot,
          duration: form.duration,
          instructions: form.instructions,
          contactPhone: form.phone,
          contactEmail: form.email
        })
      });
      setStatus("Visit scheduled.");
    } catch (err) {
      setStatus(err?.body || err?.message || "Failed to schedule visit.");
    }
  };

  return (
    <PropertyOwnerLayout owner={owner} title="Schedule Visit" icon="calendar" contentClassName="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <i data-lucide="calendar" className="w-7 h-7"></i>
            Schedule Property Visit
          </h1>
          <p className="text-purple-100 mt-2">Set up a visit schedule for your property</p>
        </div>

        <div className="p-8">
          {status && <div className="text-sm text-gray-600 mb-4">{status}</div>}
          <form className="space-y-6" onSubmit={submit}>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Visit Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visit Type</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.visitType} onChange={(e) => setForm((prev) => ({ ...prev, visitType: e.target.value }))}>
                    <option value="physical">Physical Visit</option>
                    <option value="virtual">Virtual Visit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visit Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.visitDate} onChange={(e) => setForm((prev) => ({ ...prev, visitDate: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. 10:00-11:00" value={form.timeSlot} onChange={(e) => setForm((prev) => ({ ...prev, timeSlot: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (hours)</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={form.duration} onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))}>
                    <option value="1">1 hour</option>
                    <option value="1.5">1.5 hours</option>
                    <option value="2">2 hours</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
              <textarea rows="3" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Special instructions" value={form.instructions} onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="tel" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Contact phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
                <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Contact email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button type="button" onClick={() => window.history.back()} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2">
                <i data-lucide="calendar" className="w-4 h-4"></i>
                Schedule Visit
              </button>
            </div>
          </form>
        </div>
      </div>
    </PropertyOwnerLayout>
  );
}
