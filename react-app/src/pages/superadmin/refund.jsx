import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const readAdminName = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || localStorage.getItem("admin_user") || "null");
    return user?.name || user?.loginId || "superadmin";
  } catch {
    return "superadmin";
  }
};

export default function Refund() {
  useHtmlPage({
    title: "Refund Requests - Roomhy SuperAdmin",
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
      { rel: "stylesheet", href: "/superadmin/assets/css/refund.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [busyAction, setBusyAction] = useState("");

  const loadRefunds = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await fetchJson("/api/booking/refund-requests");
      setRequests(data?.data || []);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Error loading refunds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefunds();
  }, []);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [requests, selected, busyAction]);

  const stats = useMemo(() => {
    const pending = requests.filter((item) => item.refund_status === "pending");
    const approved = requests.filter((item) => item.refund_status === "approved");
    const processed = requests.filter((item) => item.refund_status === "processed");
    const rejected = requests.filter((item) => item.refund_status === "rejected");
    return {
      pending,
      approved,
      processed,
      rejected,
      pendingAmount: pending.reduce((sum, item) => sum + Number(item.refund_amount || 0), 0),
      processedAmount: processed.reduce((sum, item) => sum + Number(item.refund_amount || 0), 0)
    };
  }, [requests]);

  const openRequest = (request) => {
    setSelected(request);
    setNotes(request?.admin_notes || "");
    setTransactionId(request?.refund_transaction_id || "");
  };

  const closeRequest = () => {
    setSelected(null);
    setNotes("");
    setTransactionId("");
    setBusyAction("");
  };

  const updateStatus = async (request, refund_status) => {
    setBusyAction(refund_status);
    try {
      await fetchJson(`/api/booking/refund-request/${request._id}/status`, {
        method: "PUT",
        body: JSON.stringify({
          refund_status,
          admin_notes: notes || request.admin_notes || ""
        })
      });
      await loadRefunds();
      setSelected((current) => current ? { ...current, refund_status, admin_notes: notes } : current);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to update refund status");
    } finally {
      setBusyAction("");
    }
  };

  const processRefund = async (request) => {
    setBusyAction("processed");
    try {
      await fetchJson(`/api/booking/refund-request/${request._id}/process`, {
        method: "POST",
        body: JSON.stringify({
          admin_notes: notes || "Refund processed",
          processed_by: readAdminName(),
          razorpay_payment_id: transactionId || undefined
        })
      });
      await loadRefunds();
      closeRequest();
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to process refund");
      setBusyAction("");
    }
  };

  return (
    <div className="html-page">
      <div className="flex h-screen overflow-hidden">
        <aside className="sidebar w-72 flex-shrink-0 hidden md:flex flex-col z-20 overflow-y-auto custom-scrollbar">
          <div className="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
            <div>
              <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
              <span className="text-[10px] text-gray-500">SUPER ADMIN</span>
            </div>
          </div>
          <nav className="flex-1 py-6 space-y-1">
            <div className="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Finance</div>
            <a href="/superadmin/refund" className="sidebar-link active">
              <i data-lucide="rotate-ccw" className="w-5 h-5 mr-3"></i> Refunds
            </a>
            <a href="/superadmin/rentcollection" className="sidebar-link">
              <i data-lucide="wallet" className="w-5 h-5 mr-3"></i> Rent Collections
            </a>
            <a href="/superadmin/booking" className="sidebar-link">
              <i data-lucide="calendar-check" className="w-5 h-5 mr-3"></i> Bookings
            </a>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white h-16 shadow-sm flex items-center justify-between px-8 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-800">Refund Requests</h1>
            <button onClick={loadRefunds} className="text-sm text-purple-600 hover:underline flex items-center gap-1">
              <i data-lucide="refresh-cw" className="w-3 h-3"></i> Refresh
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border">
                <div className="text-sm text-gray-500">Pending</div>
                <div className="text-2xl font-bold">{stats.pending.length}</div>
                <div className="text-sm text-gray-500">{formatCurrency(stats.pendingAmount)}</div>
              </div>
              <div className="bg-white rounded-xl p-6 border">
                <div className="text-sm text-gray-500">Approved</div>
                <div className="text-2xl font-bold">{stats.approved.length}</div>
              </div>
              <div className="bg-white rounded-xl p-6 border">
                <div className="text-sm text-gray-500">Processed</div>
                <div className="text-2xl font-bold">{stats.processed.length}</div>
                <div className="text-sm text-gray-500">{formatCurrency(stats.processedAmount)}</div>
              </div>
              <div className="bg-white rounded-xl p-6 border">
                <div className="text-sm text-gray-500">Rejected</div>
                <div className="text-2xl font-bold">{stats.rejected.length}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow border overflow-x-auto">
              <table className="w-full text-left min-w-full">
                <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase border-b">
                  <tr>
                    <th className="px-6 py-4">Refund ID</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">Loading...</td>
                    </tr>
                  )}
                  {!loading && errorMsg && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-red-500">{errorMsg}</td>
                    </tr>
                  )}
                  {!loading && !errorMsg && requests.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">No refund requests found</td>
                    </tr>
                  )}
                  {requests.map((request) => (
                    <tr key={request._id}>
                      <td className="px-6 py-4 text-xs font-mono">#{request._id?.slice(0, 8).toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">{request.user_name || "N/A"}</div>
                        <div className="text-xs text-gray-500">{request.booking_id || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">{formatCurrency(request.refund_amount || 0)}</td>
                      <td className="px-6 py-4 text-sm">{request.request_type === "refund" ? "Refund" : "Alternative"}</td>
                      <td className="px-6 py-4 text-sm">{(request.refund_method || "N/A").toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm">{request.created_at ? new Date(request.created_at).toLocaleDateString("en-IN") : "-"}</td>
                      <td className="px-6 py-4 text-sm font-semibold capitalize">{request.refund_status || "pending"}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openRequest(request)} className="px-3 py-2 text-sm rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100">
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeRequest}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Refund Request</h2>
                <p className="text-sm text-slate-500">{selected.user_name} • {selected.booking_id}</p>
              </div>
              <button onClick={closeRequest} className="text-slate-400 hover:text-slate-600">
                <i data-lucide="x" className="w-5 h-5"></i>
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-slate-500 mb-1">Request Type</p>
                <p className="font-semibold text-slate-900 capitalize">{selected.request_type?.replaceAll("_", " ")}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-slate-500 mb-1">Refund Amount</p>
                <p className="font-semibold text-slate-900">{formatCurrency(selected.refund_amount)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-slate-500 mb-1">Payment Method</p>
                <p className="font-semibold text-slate-900">{selected.refund_method || "N/A"}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-slate-500 mb-1">Status</p>
                <p className="font-semibold text-slate-900 capitalize">{selected.refund_status}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Requester Details</label>
                <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700 space-y-1">
                  <p><strong>Name:</strong> {selected.user_name || "-"}</p>
                  <p><strong>Phone:</strong> {selected.user_phone || "-"}</p>
                  <p><strong>Email:</strong> {selected.user_email || "-"}</p>
                  <p><strong>UPI:</strong> {selected.upi_id || "-"}</p>
                  <p><strong>Bank:</strong> {selected.bank_name || "-"}</p>
                  <p><strong>Account:</strong> {selected.bank_account_number || "-"}</p>
                  <p><strong>IFSC:</strong> {selected.bank_ifsc_code || "-"}</p>
                  <p><strong>Preferred Area:</strong> {selected.preferred_area || "-"}</p>
                  <p><strong>Requirements:</strong> {selected.property_requirements || selected.other_details || "-"}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Admin Notes</label>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Add notes for approval / rejection / processing"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Transaction Reference</label>
                <input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Optional payout or refund reference id" />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={() => updateStatus(selected, "approved")} disabled={!!busyAction} className="px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                  {busyAction === "approved" ? "Saving..." : "Approve"}
                </button>
                <button onClick={() => updateStatus(selected, "rejected")} disabled={!!busyAction} className="px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
                  {busyAction === "rejected" ? "Saving..." : "Reject"}
                </button>
                <button onClick={() => processRefund(selected)} disabled={!!busyAction} className="px-4 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">
                  {busyAction === "processed" ? "Processing..." : "Process Refund"}
                </button>
                <button onClick={closeRequest} className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
