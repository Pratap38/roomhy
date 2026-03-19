import React, { useEffect, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";

export default function Tenantagreement() {
  useHtmlPage({
    title: "Roomhy - Tenant Agreement",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en", class: "scroll-smooth" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/tenant/assets/css/tenantagreement.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [tenant, setTenant] = useState(null);
  const [eSignName, setESignName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, []);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("tenant_user") || localStorage.getItem("user") || "null");
    if (!stored?.loginId) {
      window.location.href = "/tenant//tenant/tenantlogin";
      return;
    }
    (async () => {
      try {
        const data = await fetchJson("/api/tenants");
        const list = data?.tenants || data || [];
        const match = list.find((t) => String(t.loginId || "").toUpperCase() === String(stored.loginId || "").toUpperCase());
        setTenant(match || stored);
      } catch (err) {
        setErrorMsg(err?.body || err?.message || "Failed to load tenant data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signAgreement = async () => {
    if (!accepted) {
      setErrorMsg("Please accept the agreement.");
      return;
    }
    if (!eSignName.trim()) {
      setErrorMsg("Please enter your e-sign name.");
      return;
    }
    setErrorMsg("");
    try {
      await fetchJson("/api/checkin/tenant/agreement", {
        method: "POST",
        body: JSON.stringify({
          loginId: tenant?.loginId,
          eSignName: eSignName.trim(),
          accepted: true
        })
      });
      window.location.href = "/tenant//tenant/tenantdashboard";
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to submit agreement.");
    }
  };

  return (
    <div className="html-page">
      <div className="min-h-screen flex flex-col">
        <header className="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <div className="bg-purple-600 text-white p-1.5 rounded-lg"><i data-lucide="home" className="w-5 h-5"></i></div>
            <h1 className="text-xl font-bold text-slate-800">Roomhy Tenant Onboarding</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold mb-1"><i data-lucide="check" className="w-5 h-5"></i></div>
                  <span className="text-xs font-medium text-green-600">Profile</span>
                </div>
                <div className="w-20 h-1 bg-green-500 mx-2 rounded"></div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold mb-1"><i data-lucide="check" className="w-5 h-5"></i></div>
                  <span className="text-xs font-medium text-green-600">KYC</span>
                </div>
                <div className="w-20 h-1 bg-green-500 mx-2 rounded"></div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold mb-1">3</div>
                  <span className="text-xs font-bold text-purple-600">Agreement</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Rental Agreement</h2>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 h-64 overflow-y-auto mb-6 text-sm text-gray-700 leading-relaxed">
                <h3 className="font-bold mb-2">Terms & Conditions</h3>
                <p className="mb-2">1. The tenant agrees to pay the monthly rent of <strong>{tenant?.agreedRent || tenant?.rentAmount || "--"}</strong> on or before the 5th of every month.</p>
                <p className="mb-2">2. The tenancy commences on <strong>{tenant?.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString() : "-"}</strong>.</p>
                <p className="mb-2">3. Security deposit is refundable subject to property condition upon exit.</p>
                <p>4. Tenant shall comply with all building rules regarding noise, guests, and maintenance.</p>
                <p className="mt-4 text-xs text-gray-500">By digitally signing, you accept these terms legally.</p>
              </div>

              {errorMsg && <div className="text-sm text-red-600 mb-4">{errorMsg}</div>}

              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-100 rounded-lg">
                  <input type="checkbox" id="agree-check" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500" />
                  <label htmlFor="agree-check" className="text-sm font-medium text-gray-700">I have read and accept the Rental Agreement.</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-sign Name</label>
                  <input
                    type="text"
                    value={eSignName}
                    onChange={(event) => setESignName(event.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 transition-colors outline-none"
                    placeholder="Type your full name"
                  />
                </div>
              </div>

              <button
                disabled={loading}
                onClick={signAgreement}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg"
              >
                <i data-lucide="pen-tool" className="w-5 h-5"></i> Digitally Sign & Enter Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


