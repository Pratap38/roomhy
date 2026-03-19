import React, { useEffect, useMemo, useState } from "react";
import { fetchJson } from "../../utils/api";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import { getOwnerSession } from "../../utils/ownerSession";

const getQueryParam = (key) => {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search || "");
  return params.get(key) || "";
};

export default function PaymentReceived() {
  useHtmlPage({
    title: "RoomHy - Payment Received",
    bodyClass: "bg-slate-100 min-h-screen",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const owner = getOwnerSession();
  const [rent, setRent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const rentId = useMemo(() => getQueryParam("rentId"), []);
  const ownerLoginId = useMemo(() => getQueryParam("ownerLoginId"), []);

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [rent, loading, statusMsg, errorMsg]);

  useEffect(() => {
    const load = async () => {
      if (!rentId) {
        setErrorMsg("Missing rentId in URL.");
        setLoading(false);
        return;
      }
      try {
        const data = await fetchJson(`/api/rents/${rentId}`);
        setRent(data?.rent || data);
      } catch (err) {
        setErrorMsg(err?.body || err?.message || "Failed to load rent details.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [rentId]);

  const markReceived = async () => {
    if (!rentId || !ownerLoginId) {
      setStatusMsg("Missing rentId or ownerLoginId in URL.");
      return;
    }
    try {
      await fetchJson("/api/rents/cash/owner-received", {
        method: "POST",
        body: JSON.stringify({ rentId, ownerLoginId })
      });
      setStatusMsg("OTP sent to tenant email. Ask tenant to verify.");
    } catch (err) {
      setStatusMsg(err?.body || err?.message || "Failed to mark payment received.");
    }
  };

  return (
    <PropertyOwnerLayout owner={owner} title="Payment Received" icon="badge-indian-rupee" contentClassName="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Received</h1>
        <p className="text-sm text-slate-600 mb-6">
          Confirm cash collection and send OTP to tenant email.
        </p>

        {errorMsg && <div className="mb-4 rounded-lg px-4 py-3 text-sm bg-red-50 text-red-700">{errorMsg}</div>}
        {statusMsg && <div className="mb-4 rounded-lg px-4 py-3 text-sm bg-green-50 text-green-700">{statusMsg}</div>}

        {loading && <div className="text-sm text-gray-500">Loading rent details...</div>}
        {!loading && rent && (
          <div className="space-y-3 text-sm text-slate-700">
            <div><span className="font-semibold">Tenant Name:</span> {rent.tenantName || "-"}</div>
            <div><span className="font-semibold">Tenant Login ID:</span> {rent.tenantLoginId || "-"}</div>
            <div><span className="font-semibold">Tenant Email:</span> {rent.tenantEmail || "-"}</div>
            <div><span className="font-semibold">Property:</span> {rent.propertyName || rent.propertyId?.title || "-"}</div>
            <div><span className="font-semibold">Room Number:</span> {rent.roomNumber || "-"}</div>
            <div><span className="font-semibold">Amount:</span> {rent.totalDue || rent.rentAmount || "-"}</div>
            <div><span className="font-semibold">Status:</span> {rent.paymentStatus || "pending"}</div>
          </div>
        )}

        <button
          onClick={markReceived}
          className="mt-6 w-full bg-green-600 text-white font-semibold py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading || !rentId}
          type="button"
        >
          Payment Received
        </button>
      </div>
    </PropertyOwnerLayout>
  );
}
