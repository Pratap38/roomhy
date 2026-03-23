import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson, getApiBase } from "../../utils/api";

const ensureRazorpayLoaded = () =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window is not available."));
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[data-roomhy-razorpay="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.roomhyRazorpay = "1";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay."));
    document.body.appendChild(script);
  });

const readTenantUser = () => {
  try {
    return JSON.parse(localStorage.getItem("tenant_user") || localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const readLocalTenants = () => {
  try {
    return JSON.parse(localStorage.getItem("roomhy_tenants") || "[]");
  } catch {
    return [];
  }
};

const writeLocalTenants = (list) => {
  localStorage.setItem("roomhy_tenants", JSON.stringify(list));
};

const upsertTenantRecord = (record) => {
  if (!record?.loginId) return;
  const list = readLocalTenants();
  const key = String(record.loginId).toUpperCase();
  const index = list.findIndex((item) => String(item.loginId || "").toUpperCase() === key);
  if (index >= 0) list[index] = { ...list[index], ...record };
  else list.push(record);
  writeLocalTenants(list);
};

const formatCurrency = (value) => `₹ ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value, withTime = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(
    "en-IN",
    withTime
      ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "short", year: "numeric" }
  );
};

const paymentMethodLabel = (method) => {
  const map = {
    razorpay: "Online",
    cash: "Cash",
    bank_transfer: "Bank Transfer",
    other: "Other"
  };
  return map[String(method || "").toLowerCase()] || "Unknown";
};

export default function Tenantdashboard() {
  useHtmlPage({
    title: "Roomhy - Tenant Dashboard",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/tenant/assets/css/tenantdashboard.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const apiBase = useMemo(() => getApiBase(), []);
  const [tenantUser] = useState(() => readTenantUser());
  const [tenant, setTenant] = useState(null);
  const [rent, setRent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [genericModal, setGenericModal] = useState(null);
  const [cashPanelOpen, setCashPanelOpen] = useState(false);
  const [cashOtp, setCashOtp] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loginId = String(tenantUser?.loginId || "").toUpperCase();
  const propertyName = tenant?.propertyTitle || tenant?.property?.title || tenant?.property?.name || "Roomhy Property";
  const roomInfo = tenant ? `Room ${tenant.roomNo || "-"}${tenant.bedNo ? ` (${tenant.bedNo})` : ""}` : "Room -";
  const rentAmount = Number(rent?.totalDue || rent?.rentAmount || tenant?.agreedRent || 0);
  const paymentStatus = String(rent?.paymentStatus || "pending").toLowerCase();
  const isPaid = paymentStatus === "paid" || paymentStatus === "completed";
  const statusLabel = isPaid ? "Paid" : paymentStatus === "overdue" ? "Overdue" : "Unpaid";

  const docs = useMemo(() => {
    const items = [
      {
        key: "agreement",
        title: "Rental Agreement",
        subtitle: tenant?.agreementSignedAt ? `Signed on ${formatDate(tenant.agreementSignedAt)}` : "Agreement available in tenant records",
        icon: "file-text",
        accent: "purple"
      }
    ];
    const latestPaid = history.find((item) => ["paid", "completed"].includes(String(item.paymentStatus || "").toLowerCase()));
    if (latestPaid) {
      items.push({
        key: "receipt",
        title: `${latestPaid.collectionMonth || "Current"} Rent Receipt`,
        subtitle: `Paid via ${paymentMethodLabel(latestPaid.paymentMethod)}`,
        icon: "receipt",
        accent: "green"
      });
    }
    return items;
  }, [history, tenant]);

  const loadTenant = async () => {
    if (!loginId) {
      window.location.href = "/tenant/tenantlogin";
      return null;
    }
    const localTenant = readLocalTenants().find((item) => String(item.loginId || "").toUpperCase() === loginId);
    if (localTenant) setTenant(localTenant);
    try {
      const data = await fetchJson("/api/tenants");
      const list = data?.tenants || data || [];
      const match = list.find((item) => String(item.loginId || "").toUpperCase() === loginId);
      if (match) {
        upsertTenantRecord(match);
        setTenant(match);
        return match;
      }
      if (localTenant) return localTenant;
      throw new Error("Tenant profile not found.");
    } catch (err) {
      if (localTenant) return localTenant;
      throw err;
    }
  };

  const loadRents = async () => {
    if (!loginId) return [];
    const data = await fetchJson(`/api/rents/tenant/${encodeURIComponent(loginId)}?limit=15`);
    const rents = data?.rents || [];
    setHistory(rents);
    setRent(rents[0] || null);
    return rents;
  };

  const refreshDashboard = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      await loadTenant();
      await loadRents();
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to load tenant dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDashboard();
  }, []);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [tenant, rent, history, payOpen, userMenuOpen, genericModal, cashPanelOpen]);

  useEffect(() => {
    const page = document.querySelector(".html-page");
    const shell = page?.closest(".shared-shell");
    if (!shell) return;

    const sidebar = shell.querySelector(".shared-sidebar");
    const header = shell.querySelector(".shared-header");
    const content = shell.querySelector(".shared-content");

    if (sidebar) sidebar.remove();
    if (header) header.remove();
    if (content) {
      content.style.padding = "0";
      content.style.minHeight = "100vh";
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pay") === "online") setPayOpen(true);
    if (params.get("pay") === "cash") {
      setPayOpen(true);
      setCashPanelOpen(true);
    }
  }, []);

  const openGenericModal = (title, body, footer = null) => {
    setGenericModal({ title, body, footer });
  };

  const clearSession = () => {
    try {
      localStorage.removeItem("tenant_user");
      localStorage.removeItem("user");
    } catch {
      // ignore
    }
    window.location.href = "/tenant/tenantlogin";
  };

  const syncPaymentState = async () => {
    await loadRents();
    localStorage.setItem("roomhy_payment_updated", String(Date.now()));
    window.dispatchEvent(new Event("paymentUpdated"));
  };

  const handleOnlinePayment = async () => {
    if (!tenantUser || rentAmount <= 0) {
      setActionMsg("Invalid rent amount.");
      return;
    }
    setActionBusy(true);
    setActionMsg("");
    try {
      const orderResponse = await fetch(`${apiBase}/api/rents/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: rentAmount,
          tenantId: loginId,
          rentId: rent?._id,
          description: "Monthly Rent Payment"
        })
      });
      const orderData = await orderResponse.json();
      if (!orderResponse.ok || !orderData?.success) {
        throw new Error(orderData?.error || orderData?.message || "Failed to create payment order.");
      }

      await ensureRazorpayLoaded();
      const razorpay = new window.Razorpay({
        key: orderData.key,
        amount: rentAmount * 100,
        currency: "INR",
        name: "Roomhy",
        description: "Monthly Rent Payment",
        order_id: orderData.order?.id,
        prefill: {
          name: tenantUser?.name || tenant?.name || "Tenant",
          email: tenantUser?.email || tenant?.email || "",
          contact: tenantUser?.phone || tenant?.phone || ""
        },
        notes: {
          tenantId: loginId,
          rentMonth: new Date().toISOString().slice(0, 7)
        },
        handler: async (response) => {
          try {
            await fetchJson("/api/rents/verify-payment", {
              method: "POST",
              body: JSON.stringify({
                tenantId: loginId,
                rentId: rent?._id,
                paidAmount: rentAmount,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            await syncPaymentState();
            setPayOpen(false);
            openGenericModal("Payment Confirmation", (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i data-lucide="check-circle" className="w-8 h-8 text-green-600"></i>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Payment Successful!</h4>
                <p className="text-sm text-slate-600">Your rent payment has been recorded and confirmed.</p>
              </div>
            ));
          } catch (err) {
            setActionMsg(err?.body || err?.message || "Payment record failed.");
          }
        },
        modal: { ondismiss: () => setActionMsg("Payment cancelled.") },
        theme: { color: "#2563eb" }
      });
      razorpay.open();
    } catch (err) {
      setActionMsg(err?.body || err?.message || "Failed to initiate payment.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleCashRequest = async () => {
    if (!tenant) {
      setActionMsg("Tenant data not found.");
      return;
    }
    setActionBusy(true);
    setActionMsg("Sending cash request to owner...");
    setCashPanelOpen(true);
    try {
      const result = await fetchJson("/api/rents/cash/request", {
        method: "POST",
        body: JSON.stringify({
          tenantLoginId: loginId,
          ownerLoginId: tenant.ownerLoginId,
          amount: rentAmount,
          propertyName,
          roomNumber: tenant.roomNo || "",
          tenantName: tenantUser?.name || tenant.name || "",
          tenantEmail: tenantUser?.email || tenant.email || "",
          tenantPhone: tenantUser?.phone || tenant.phone || ""
        })
      });
      setRent(result?.rent || rent);
      setActionMsg("Cash request sent. Ask owner to click Received. OTP will come to your email.");
      await syncPaymentState();
    } catch (err) {
      setActionMsg(err?.body || err?.message || "Cash request failed.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleCashOtpVerify = async () => {
    if (!cashOtp.trim()) {
      setActionMsg("Enter OTP.");
      return;
    }
    setActionBusy(true);
    setActionMsg("Verifying OTP...");
    try {
      await fetchJson("/api/rents/cash/verify-otp", {
        method: "POST",
        body: JSON.stringify({ tenantLoginId: loginId, otp: cashOtp.trim() })
      });
      await syncPaymentState();
      setPayOpen(false);
      setCashOtp("");
      setCashPanelOpen(false);
      openGenericModal("Payment Confirmation", (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i data-lucide="check-circle" className="w-8 h-8 text-green-600"></i>
          </div>
          <h4 className="text-lg font-bold text-slate-900 mb-2">Cash Payment Verified</h4>
          <p className="text-sm text-slate-600">Your cash payment has been marked as paid.</p>
        </div>
      ));
    } catch (err) {
      setActionMsg(err?.body || err?.message || "OTP verification failed.");
    } finally {
      setActionBusy(false);
    }
  };

  const activityRows = history.length > 0 ? history : [];

  return (
    <div className="html-page">
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-slate-900">Welcome back, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{(tenantUser?.name || tenant?.name || "Tenant").split(" ")[0]}</span></h2>
              <p className="text-slate-500 mt-2">Here's your rental summary and account overview</p>
            </div>
            {errorMsg ? <div className="text-sm text-red-600">{errorMsg}</div> : null}
            <div className="rent-banner p-8 rounded-2xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
              <div className="relative z-10 grid md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-2 text-blue-100 mb-3"><i data-lucide="receipt" className="w-5 h-5"></i><span className="font-semibold text-sm uppercase tracking-wide">Monthly Rent Payment</span></div>
                  <div className="mb-6">
                    <p className="text-sm text-blue-100 mb-2">Amount Due</p>
                    <h1 className="text-6xl font-bold text-white">{loading ? "₹ --" : formatCurrency(isPaid ? 0 : rentAmount)}</h1>
                  </div>
                  <div className="flex flex-wrap gap-3 items-center">
                    <span className="px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur">Due: 5th of Month</span>
                    <span className={`px-4 py-2 text-white rounded-full text-sm font-bold flex items-center gap-1 ${isPaid ? "bg-green-500" : paymentStatus === "overdue" ? "bg-red-500" : "bg-amber-500"}`}>
                      <i data-lucide={isPaid ? "check-circle" : "alert-circle"} className="w-4 h-4"></i> {statusLabel}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col justify-between items-start md:items-end gap-6">
                  <div className="text-white/90 text-sm space-y-2">
                    <p><strong>Property:</strong> {propertyName}</p>
                    <p><strong>Room:</strong> {roomInfo}</p>
                    <p><strong>Login ID:</strong> <span className="font-mono">{loginId || "--"}</span></p>
                  </div>
                  <button onClick={() => setPayOpen(true)} className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-bold shadow-lg transition-all hover:shadow-2xl hover:scale-105 flex items-center gap-2 w-full md:w-auto justify-center"><i data-lucide="credit-card" className="w-5 h-5"></i> Pay Now</button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <a href="/tenant/tenantcomplints" className="dashboard-card p-6 flex flex-col cursor-pointer group">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-200 transition">
                  <i data-lucide="flag" className="w-6 h-6 text-red-600"></i>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Lodge Complaint</h3>
                <p className="text-sm text-slate-500">Report maintenance or other issues</p>
                <div className="mt-4 text-blue-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Open <i data-lucide="arrow-right" className="w-4 h-4"></i>
                </div>
              </a>
              <button onClick={() => document.getElementById("documents")?.scrollIntoView({ behavior: "smooth" })} className="dashboard-card p-6 flex flex-col cursor-pointer group text-left">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition">
                  <i data-lucide="file-text" className="w-6 h-6 text-purple-600"></i>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Documents & Bills</h3>
                <p className="text-sm text-slate-500">Access rental agreements and receipts</p>
                <div className="mt-4 text-blue-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  View <i data-lucide="arrow-right" className="w-4 h-4"></i>
                </div>
              </button>
              <button onClick={() => openGenericModal("Emergency Contacts", <div className="space-y-3"><div className="p-3 bg-red-50 rounded-lg border border-red-100"><p className="font-bold text-red-700 text-sm">Property Manager</p><p className="text-lg font-bold text-red-900 mt-1">+91 98765 43210</p></div><div className="p-3 bg-slate-50 rounded-lg border border-slate-200"><p className="font-medium text-slate-700 text-sm">Local Police</p><p className="text-lg font-bold text-slate-900 mt-1">100</p></div><div className="p-3 bg-slate-50 rounded-lg border border-slate-200"><p className="font-medium text-slate-700 text-sm">Ambulance</p><p className="text-lg font-bold text-slate-900 mt-1">108</p></div></div>)} className="dashboard-card p-6 flex flex-col cursor-pointer group text-left">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition">
                  <i data-lucide="phone-call" className="w-6 h-6 text-green-600"></i>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Emergency Contacts</h3>
                <p className="text-sm text-slate-500">Quick access to important contacts</p>
                <div className="mt-4 text-blue-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Show <i data-lucide="arrow-right" className="w-4 h-4"></i>
                </div>
              </button>
            </div>

            <div className="dashboard-card p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i data-lucide="home" className="w-6 h-6 text-blue-600"></i>
                </div>
                Your Current Stay
              </h3>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Property</p>
                  <p className="text-lg font-bold text-slate-900">{propertyName}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-2">Room Details</p>
                  <p className="text-lg font-bold text-blue-900">{roomInfo}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-100">
                  <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider mb-2">Login ID</p>
                  <p className="text-lg font-bold text-purple-900 font-mono">{loginId || "--"}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-100">
                  <p className="text-xs text-orange-600 font-semibold uppercase tracking-wider mb-2">Move-In Date</p>
                  <p className="text-lg font-bold text-orange-900">{formatDate(tenant?.moveInDate)}</p>
                </div>
              </div>
            </div>

            <div id="documents" className="dashboard-card p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i data-lucide="folder-open" className="w-6 h-6 text-purple-600"></i>
                </div>
                Documents & Bills
              </h3>
              <div className="space-y-3">
                {docs.map((doc) => (
                  <div key={doc.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 transition cursor-default">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${doc.accent === "green" ? "bg-green-100" : "bg-purple-100"}`}>
                        <i data-lucide={doc.icon} className={`w-5 h-5 ${doc.accent === "green" ? "text-green-600" : "text-purple-600"}`}></i>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{doc.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{doc.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">Available</span>
                  </div>
                ))}
              </div>
            </div>

            <div id="activity" className="dashboard-card p-8 pb-12">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i data-lucide="activity" className="w-6 h-6 text-blue-600"></i>
                </div>
                Activity Timeline
              </h3>
              <div className="space-y-6">
                {activityRows.length === 0 ? (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                        <i data-lucide="clock-3" className="w-5 h-5 text-slate-500"></i>
                      </div>
                    </div>
                    <div className="pt-1">
                      <p className="font-semibold text-slate-900">No payment activity yet</p>
                      <p className="text-sm text-slate-500 mt-1">Your rent payments will appear here.</p>
                    </div>
                  </div>
                ) : (
                  activityRows.map((item, index) => {
                    const paid = ["paid", "completed"].includes(String(item.paymentStatus || "").toLowerCase());
                    return (
                      <div key={item._id || `${item.collectionMonth}-${index}`} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-md ${paid ? "bg-green-100" : "bg-amber-100"}`}>
                            <i data-lucide={paid ? "check-circle" : "clock-3"} className={`w-5 h-5 ${paid ? "text-green-600" : "text-amber-600"}`}></i>
                          </div>
                          {index < activityRows.length - 1 ? <div className="w-0.5 h-12 bg-slate-200 mt-2"></div> : null}
                        </div>
                        <div className="pt-1">
                          <p className="font-semibold text-slate-900">{paid ? "Rent Paid Successfully" : "Rent Payment Pending"}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {formatDate(item.paymentDate || item.updatedAt || item.createdAt, true)} • {formatCurrency(item.paidAmount || item.totalDue || item.rentAmount)} • {paymentMethodLabel(item.paymentMethod)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {payOpen ? (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setPayOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Make Payment</h3>
              <button onClick={() => setPayOpen(false)} className="text-slate-400 hover:text-slate-600"><i data-lucide="x"></i></button>
            </div>
            <div className="text-center mb-8">
              <p className="text-sm text-slate-500 uppercase tracking-wide font-semibold">Total Payable</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{formatCurrency(rentAmount)}</p>
            </div>
            <div className="space-y-3">
              <button onClick={handleOnlinePayment} disabled={actionBusy || isPaid} className="w-full p-4 border border-slate-200 rounded-xl flex items-center hover:border-blue-600 hover:bg-blue-50 transition group disabled:opacity-60 disabled:cursor-not-allowed">
                <i data-lucide="credit-card" className="w-5 h-5 mr-4 text-blue-600"></i>
                <div className="text-left">
                  <span className="font-semibold text-slate-700">Pay Online</span>
                  <p className="text-xs text-slate-500">Cards • UPI • Wallets • Netbanking</p>
                </div>
              </button>
              <button onClick={handleCashRequest} disabled={actionBusy || isPaid} className="w-full p-4 border border-slate-200 rounded-xl flex items-center hover:border-amber-500 hover:bg-amber-50 transition group disabled:opacity-60 disabled:cursor-not-allowed">
                <i data-lucide="hand-coins" className="w-5 h-5 mr-4 text-amber-600"></i>
                <div className="text-left">
                  <span className="font-semibold text-slate-700">Pay by Cash</span>
                  <p className="text-xs text-slate-500">Request owner collection and verify OTP</p>
                </div>
              </button>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
                <p className="font-semibold text-green-800">Secure Payment</p>
                <p className="text-xs text-green-700">Your payment is encrypted and secure</p>
              </div>
              <div className={`${cashPanelOpen ? "" : "hidden"} p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-3`}>
                <p className="text-xs text-amber-800">Owner should click <strong>Received</strong> in owner payment panel. Then OTP will be sent to your email.</p>
                <input value={cashOtp} onChange={(event) => setCashOtp(event.target.value)} type="text" maxLength={6} placeholder="Enter 6-digit OTP" className="w-full p-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                <button onClick={handleCashOtpVerify} disabled={actionBusy} className="w-full bg-amber-600 text-white font-semibold py-2 rounded-lg hover:bg-amber-700 text-sm disabled:opacity-60">Verify OTP and Mark Paid</button>
                <p className="text-xs text-amber-900">{actionMsg}</p>
              </div>
              {!cashPanelOpen && actionMsg ? <p className="text-xs text-slate-600">{actionMsg}</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {genericModal ? (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setGenericModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">{genericModal.title}</h3>
              <button onClick={() => setGenericModal(null)} className="text-slate-400 hover:text-slate-600"><i data-lucide="x" className="w-5 h-5"></i></button>
            </div>
            <div>{genericModal.body}</div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-right">
              {genericModal.footer || <button onClick={() => setGenericModal(null)} className="text-slate-500 text-sm hover:underline">Close</button>}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
