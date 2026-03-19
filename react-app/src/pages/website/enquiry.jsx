import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { formatDate, visitApi } from "../../services/api";

const tabs = [
  { key: "pending", label: "Pending Enquiries" },
  { key: "review", label: "For Approval" },
  { key: "approved", label: "Approved" },
  { key: "all", label: "All Enquiries" }
];

const defaultState = { items: [], loading: false, error: "" };

const getVisitId = (enquiry) => enquiry?.visitId || enquiry?._id || "";

const normalizeVisits = (result) => {
  if (result?.visits && Array.isArray(result.visits)) return result.visits;
  if (result?.properties && Array.isArray(result.properties)) return result.properties;
  return [];
};

export default function WebsiteEnquiry() {
  useHtmlPage({
    title: "Enquiry Management - Roomhy",
    bodyClass: "bg-gray-50",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [{ rel: "stylesheet", href: "/website/assets/css/enquiry.css" }]
  });

  const [activeTab, setActiveTab] = useState("pending");
  const [pendingState, setPendingState] = useState(defaultState);
  const [reviewState, setReviewState] = useState(defaultState);
  const [approvedState, setApprovedState] = useState(defaultState);
  const [allState, setAllState] = useState(defaultState);
  const [searchTerm, setSearchTerm] = useState("");
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    loading: false,
    enquiry: null,
    error: ""
  });
  const [approvalModal, setApprovalModal] = useState({
    isOpen: false,
    loading: false,
    submitting: false,
    enquiry: null,
    notes: "",
    error: ""
  });

  const loadPending = useCallback(async () => {
    setPendingState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const result = await visitApi.getPendingVisits();
      setPendingState({ items: normalizeVisits(result), loading: false, error: "" });
    } catch (error) {
      setPendingState((prev) => ({
        ...prev,
        loading: false,
        error: error?.message || "Error loading enquiries."
      }));
    }
  }, []);

  const loadApproved = useCallback(async () => {
    setApprovedState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const result = await visitApi.getApprovedVisits();
      setApprovedState({ items: normalizeVisits(result), loading: false, error: "" });
    } catch (error) {
      setApprovedState((prev) => ({
        ...prev,
        loading: false,
        error: error?.message || "Error loading enquiries."
      }));
    }
  }, []);

  const loadAll = useCallback(async () => {
    setAllState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const result = await visitApi.getAllVisits();
      setAllState({ items: normalizeVisits(result), loading: false, error: "" });
    } catch (error) {
      setAllState((prev) => ({
        ...prev,
        loading: false,
        error: error?.message || "Error loading enquiries."
      }));
    }
  }, []);

  const loadReview = useCallback(async () => {
    setReviewState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const result = await visitApi.getAllVisits();
      setReviewState({ items: normalizeVisits(result), loading: false, error: "" });
    } catch (error) {
      setReviewState((prev) => ({
        ...prev,
        loading: false,
        error: error?.message || "Error loading enquiries."
      }));
    }
  }, []);

  const refreshAfterAction = useCallback(async () => {
    await Promise.all([loadPending(), loadApproved(), loadAll(), loadReview()]);
  }, [loadPending, loadApproved, loadAll, loadReview]);

  useEffect(() => {
    if (activeTab === "pending") loadPending();
    if (activeTab === "review") loadReview();
    if (activeTab === "approved") loadApproved();
    if (activeTab === "all") loadAll();
  }, [activeTab, loadPending, loadReview, loadApproved, loadAll]);

  const filteredAll = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return allState.items;
    return allState.items.filter((enquiry) => {
      const propertyName = enquiry?.propertyName?.toLowerCase() || "";
      const city = enquiry?.city?.toLowerCase() || "";
      const ownerName = enquiry?.ownerName?.toLowerCase() || "";
      return propertyName.includes(term) || city.includes(term) || ownerName.includes(term);
    });
  }, [allState.items, searchTerm]);

  const openDetailsModal = useCallback(async (visitId) => {
    setDetailsModal({ isOpen: true, loading: true, enquiry: null, error: "" });
    try {
      const result = await visitApi.getVisit(visitId);
      setDetailsModal({
        isOpen: true,
        loading: false,
        enquiry: result?.visit || null,
        error: ""
      });
    } catch (error) {
      setDetailsModal({
        isOpen: true,
        loading: false,
        enquiry: null,
        error: error?.message || "Error loading details."
      });
    }
  }, []);

  const closeDetailsModal = useCallback(() => {
    setDetailsModal({ isOpen: false, loading: false, enquiry: null, error: "" });
  }, []);

  const openApprovalModal = useCallback(async (visitId) => {
    setApprovalModal((prev) => ({
      ...prev,
      isOpen: true,
      loading: true,
      enquiry: null,
      error: ""
    }));
    try {
      const result = await visitApi.getVisit(visitId);
      setApprovalModal((prev) => ({
        ...prev,
        isOpen: true,
        loading: false,
        enquiry: result?.visit || null,
        error: ""
      }));
    } catch (error) {
      setApprovalModal((prev) => ({
        ...prev,
        isOpen: true,
        loading: false,
        enquiry: null,
        error: error?.message || "Error loading visit."
      }));
    }
  }, []);

  const closeApprovalModal = useCallback(() => {
    setApprovalModal({
      isOpen: false,
      loading: false,
      submitting: false,
      enquiry: null,
      notes: "",
      error: ""
    });
  }, []);

  const handleApprove = useCallback(async () => {
    const visitId = getVisitId(approvalModal.enquiry);
    if (!visitId) return;

    setApprovalModal((prev) => ({ ...prev, submitting: true }));
    try {
      await visitApi.approveVisit(visitId, {
        approvalNotes: approvalModal.notes,
        approvedBy: "Super Admin"
      });
      window.alert("Visit approved and stored in MongoDB.");
      closeApprovalModal();
      await refreshAfterAction();
    } catch (error) {
      window.alert(`Error approving visit: ${error?.message || "Unknown error"}`);
      setApprovalModal((prev) => ({ ...prev, submitting: false }));
    }
  }, [approvalModal.enquiry, approvalModal.notes, closeApprovalModal, refreshAfterAction]);

  const handleReject = useCallback(async () => {
    const visitId = getVisitId(approvalModal.enquiry);
    if (!visitId) return;

    const reason = window.prompt("Enter reason for rejection:");
    if (!reason) return;

    setApprovalModal((prev) => ({ ...prev, submitting: true }));
    try {
      await visitApi.rejectVisit(visitId, {
        approvalNotes: reason,
        approvedBy: "Super Admin"
      });
      window.alert("Enquiry rejected and updated in MongoDB.");
      closeApprovalModal();
      await refreshAfterAction();
    } catch (error) {
      window.alert(`Error rejecting enquiry: ${error?.message || "Unknown error"}`);
      setApprovalModal((prev) => ({ ...prev, submitting: false }));
    }
  }, [approvalModal.enquiry, closeApprovalModal, refreshAfterAction]);

  const renderCard = (enquiry, showApproval) => (
    <div
      key={getVisitId(enquiry)}
      className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition"
    >
      <div className="mb-3">
        <h3 className="text-lg font-bold text-gray-800">{enquiry?.propertyName || "N/A"}</h3>
        <p className="text-sm text-gray-600">
          {(enquiry?.propertyType || "N/A") + " • " + (enquiry?.city || "N/A")}
        </p>
      </div>
      <div className="mb-3 space-y-1 text-sm">
        <p><strong>Owner:</strong> {enquiry?.ownerName || "N/A"}</p>
        <p><strong>Phone:</strong> {enquiry?.ownerPhone || "N/A"}</p>
        <p><strong>Rent:</strong> INR {enquiry?.monthlyRent || "N/A"}</p>
        <p>
          <strong>Status:</strong>{" "}
          <span className={`status-badge status-${enquiry?.status || "submitted"}`}>
            {enquiry?.status || "submitted"}
          </span>
        </p>
      </div>
      <div className="flex gap-2">
        <button
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 text-sm"
          onClick={() => openDetailsModal(getVisitId(enquiry))}
        >
          View
        </button>
        {showApproval && (
          <button
            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 text-sm"
            onClick={() => openApprovalModal(getVisitId(enquiry))}
          >
            Approve
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="html-page">
      <div className="container mx-auto max-w-7xl py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Enquiry Management System</h1>
          <p className="text-gray-600">Manage property enquiries with approval workflow</p>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                className={`px-6 py-2 rounded-lg font-semibold ${
                  isActive
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "pending" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Pending Enquiries</h2>
            {pendingState.loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading enquiries...</p>
              </div>
            )}
            {pendingState.error && (
              <div className="text-center py-8 text-red-600">{pendingState.error}</div>
            )}
            {!pendingState.loading && pendingState.items.length === 0 && !pendingState.error && (
              <div className="text-center py-8 text-gray-500">No pending enquiries</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingState.items.map((enquiry) => renderCard(enquiry, true))}
            </div>
          </div>
        )}

        {activeTab === "review" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Enquiries Pending Approval</h2>
            {reviewState.loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading enquiries...</p>
              </div>
            )}
            {reviewState.error && (
              <div className="text-center py-8 text-red-600">{reviewState.error}</div>
            )}
            {!reviewState.loading && reviewState.items.length === 0 && !reviewState.error && (
              <div className="text-center py-8 text-gray-500">No enquiries pending approval</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviewState.items.map((enquiry) => renderCard(enquiry, true))}
            </div>
          </div>
        )}

        {activeTab === "approved" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Approved Enquiries</h2>
            {approvedState.loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading enquiries...</p>
              </div>
            )}
            {approvedState.error && (
              <div className="text-center py-8 text-red-600">{approvedState.error}</div>
            )}
            {!approvedState.loading && approvedState.items.length === 0 && !approvedState.error && (
              <div className="text-center py-8 text-gray-500">No approved enquiries</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedState.items.map((enquiry) => renderCard(enquiry, false))}
            </div>
          </div>
        )}

        {activeTab === "all" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">All Enquiries</h2>
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by property name, city, or owner..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {allState.loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading enquiries...</p>
              </div>
            )}
            {allState.error && (
              <div className="text-center py-8 text-red-600">{allState.error}</div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Property</th>
                    <th className="px-4 py-3 text-left">City</th>
                    <th className="px-4 py-3 text-left">Owner</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAll.map((enquiry) => (
                    <tr key={getVisitId(enquiry)} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{enquiry?.propertyName || "N/A"}</td>
                      <td className="px-4 py-3">{enquiry?.city || "N/A"}</td>
                      <td className="px-4 py-3">{enquiry?.ownerName || "N/A"}</td>
                      <td className="px-4 py-3">
                        <span className={`status-badge status-${enquiry?.status || "submitted"}`}>
                          {enquiry?.status || "submitted"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => openDetailsModal(getVisitId(enquiry))}
                        >
                          View
                        </button>
                        {(enquiry?.status === "submitted" || enquiry?.status === "pending_review") && (
                          <button
                            className="ml-2 text-green-600 hover:underline"
                            onClick={() => openApprovalModal(getVisitId(enquiry))}
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!allState.loading && filteredAll.length === 0 && !allState.error && (
              <div className="text-center py-8 text-gray-500">No enquiries found</div>
            )}
          </div>
        )}
      </div>

      <div className={`modal ${approvalModal.isOpen ? "show" : ""}`}>
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Approve Enquiry</h2>
          {approvalModal.loading && <div className="text-gray-600">Loading visit...</div>}
          {approvalModal.error && <div className="text-red-600 mb-3">{approvalModal.error}</div>}
          {approvalModal.enquiry && (
            <>
              <div className="space-y-4 mb-6">
                <div><strong>Property:</strong> {approvalModal.enquiry.propertyName || "N/A"}</div>
                <div><strong>Owner:</strong> {approvalModal.enquiry.ownerName || "N/A"}</div>
                <div><strong>City:</strong> {approvalModal.enquiry.city || "N/A"}</div>
                <div><strong>Rent:</strong> INR {approvalModal.enquiry.monthlyRent || "N/A"}</div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Approval Notes</label>
                <textarea
                  rows="4"
                  value={approvalModal.notes}
                  onChange={(event) =>
                    setApprovalModal((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Add any notes for approval..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
          <div className="mt-6 flex gap-4">
            <button
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60"
              onClick={handleApprove}
              disabled={approvalModal.submitting || approvalModal.loading}
            >
              Approve
            </button>
            <button
              className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-semibold hover:bg-gray-500 disabled:opacity-60"
              onClick={closeApprovalModal}
              disabled={approvalModal.submitting}
            >
              Cancel
            </button>
            <button
              className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
              onClick={handleReject}
              disabled={approvalModal.submitting || approvalModal.loading}
            >
              Reject
            </button>
          </div>
        </div>
      </div>

      <div className={`modal ${detailsModal.isOpen ? "show" : ""}`}>
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <button
            onClick={closeDetailsModal}
            className="float-right text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Close details"
          >
            &times;
          </button>
          {detailsModal.loading && <div className="text-gray-600">Loading details...</div>}
          {detailsModal.error && <div className="text-red-600">{detailsModal.error}</div>}
          {detailsModal.enquiry && (
            <div id="detailsModalContent">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {detailsModal.enquiry.propertyName || "N/A"}
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div><strong>Type:</strong> {detailsModal.enquiry.propertyType || "N/A"}</div>
                <div><strong>City:</strong> {detailsModal.enquiry.city || "N/A"}</div>
                <div><strong>Area:</strong> {detailsModal.enquiry.area || "N/A"}</div>
                <div><strong>Address:</strong> {detailsModal.enquiry.address || "N/A"}</div>
                <div><strong>Rent:</strong> INR {detailsModal.enquiry.monthlyRent || "N/A"}</div>
                <div><strong>Deposit:</strong> {detailsModal.enquiry.deposit || "N/A"}</div>
                <div>
                  <strong>Status:</strong>{" "}
                  <span className={`status-badge status-${detailsModal.enquiry.status || "submitted"}`}>
                    {detailsModal.enquiry.status || "submitted"}
                  </span>
                </div>
                <div>
                  <strong>Submitted:</strong> {formatDate(detailsModal.enquiry.submittedAt)}
                </div>
              </div>
              <div className="mb-6">
                <h3 className="font-bold mb-2">Owner Details</h3>
                <p><strong>Name:</strong> {detailsModal.enquiry.ownerName || "N/A"}</p>
                <p><strong>Email:</strong> {detailsModal.enquiry.ownerEmail || "N/A"}</p>
                <p><strong>Phone:</strong> {detailsModal.enquiry.ownerPhone || "N/A"}</p>
              </div>
              <div className="mb-6">
                <h3 className="font-bold mb-2">Visitor Details</h3>
                <p><strong>Name:</strong> {detailsModal.enquiry.visitorName || "N/A"}</p>
                <p><strong>Email:</strong> {detailsModal.enquiry.visitorEmail || "N/A"}</p>
                <p><strong>Phone:</strong> {detailsModal.enquiry.visitorPhone || "N/A"}</p>
              </div>
              {detailsModal.enquiry.description && (
                <div className="mb-6">
                  <h3 className="font-bold mb-2">Description</h3>
                  <p>{detailsModal.enquiry.description}</p>
                </div>
              )}
              {detailsModal.enquiry.amenities && detailsModal.enquiry.amenities.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-2">Amenities</h3>
                  <p>{detailsModal.enquiry.amenities.join(", ")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


