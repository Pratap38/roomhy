import React, { useEffect, useState } from "react";
import { fetchJson } from "../../utils/api";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import { requireOwnerSession } from "../../utils/ownerSession";

export default function Enquiry() {
  useHtmlPage({
    title: "Owner Enquiries - Roomhy",
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
      { rel: "stylesheet", href: "/propertyowner/assets/css/enquiry.css" }
    ],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" }
    ],
    inlineScripts: []
  });

  const [owner, setOwner] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [enquiries, loading]);

  useEffect(() => {
    const session = requireOwnerSession();
    if (!session) return;
    setOwner(session);
    const load = async () => {
      try {
        const data = await fetchJson(`/api/owners/${session.loginId}/enquiries`);
        const list = Array.isArray(data) ? data : data?.enquiries || data?.data || [];
        setEnquiries(list);
      } catch (err) {
        setErrorMsg(err?.body || err?.message || "Failed to load enquiries.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await fetchJson(`/api/owners/enquiries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      setEnquiries((prev) => prev.map((item) => (item._id === id ? { ...item, status } : item)));
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to update enquiry status.");
    }
  };

  return (
    <PropertyOwnerLayout owner={owner} title="Enquiries" contentClassName="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Enquiries</h1>
      {errorMsg && <div className="text-sm text-red-600 mb-4">{errorMsg}</div>}
      <div className="bg-gradient-to-br from-amber-50 via-white to-rose-50 rounded-2xl shadow-sm border border-amber-100 p-6">
        {loading && <p className="text-gray-500">Loading enquiries...</p>}
        {!loading && enquiries.length === 0 && <p className="text-gray-500">No enquiries found.</p>}
        {!loading && enquiries.length > 0 && (
          <div className="space-y-4">
            {enquiries.map((enquiry) => (
              <div key={enquiry._id} className="border border-amber-200/80 bg-white/90 rounded-xl p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Property</p>
                    <p className="font-semibold text-gray-800">{enquiry.propertyName || enquiry.property?.title || "-"}</p>
                    <p className="text-sm text-gray-500 mt-2">Tenant</p>
                    <p className="text-gray-700">{enquiry.tenantName || enquiry.name || "-"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">{enquiry.status || "pending"}</span>
                    <select
                      value={enquiry.status || "pending"}
                      onChange={(e) => updateStatus(enquiry._id, e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                {enquiry.message && <p className="text-sm text-gray-600 mt-3">{enquiry.message}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </PropertyOwnerLayout>
  );
}
