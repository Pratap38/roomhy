import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiBases, getWithFallback, maskAadhaar, postWithFallback } from "./utils";

export const useOwnerTerms = () => {
  const apiBases = useMemo(() => getApiBases(), []);
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const [loginId] = useState(query.get("loginId") || "");
  const [queryEmail] = useState(query.get("email") || "");

  const [summary, setSummary] = useState({
    loginId: "-",
    name: "-",
    email: "-",
    phone: "-",
    area: "-",
    address: "-",
    kycPhone: "-",
    aadhaar: "-",
    kycVerified: "-",
    termsAccepted: "-"
  });
  const [status, setStatus] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [finalVerify, setFinalVerify] = useState(false);
  const [finalConfirmation, setFinalConfirmation] = useState(null);

  const loadOwnerDetails = useCallback(async () => {
    if (!loginId) {
      setStatus("Missing loginId in URL.");
      return;
    }
    try {
      const [checkinResp, ownerResp] = await Promise.all([
        getWithFallback(`/api/checkin/owner/${encodeURIComponent(loginId)}`, apiBases),
        getWithFallback(`/api/owners/${encodeURIComponent(loginId)}`, apiBases)
      ]);

      const record = checkinResp?.record || {};
      const owner = ownerResp || {};
      const profile = record.ownerProfile || {};
      const kyc = record.ownerKyc || {};

      const email = owner.email || profile.email || queryEmail || "";
      const area = owner.checkinArea || owner.locationCode || profile.area || "";
      const kycVerified = Boolean(kyc.otpVerified || kyc.digilockerVerified || owner?.kyc?.status === "submitted");

      setSummary({
        loginId,
        name: owner.name || profile.name || "-",
        email: email || "-",
        phone: owner.checkinPhone || owner.phone || profile.phone || "-",
        area: area || "-",
        address: owner.checkinAddress || owner.address || profile.address || "-",
        kycPhone: owner.checkinAadhaarLinkedPhone || kyc.aadhaarLinkedPhone || "-",
        aadhaar: maskAadhaar(owner.checkinAadhaarNumber || kyc.aadhaarNumber || ""),
        kycVerified: kycVerified ? "Yes" : "No",
        termsAccepted: record.ownerTermsAcceptedAt ? "Yes" : "No"
      });
      setStatus("Details loaded. Please verify and edit if needed.");
    } catch (err) {
      setStatus(`Failed to load details: ${err.message}`);
    }
  }, [apiBases, loginId, queryEmail]);

  useEffect(() => {
    loadOwnerDetails();
  }, [loadOwnerDetails]);

  const handleAccept = useCallback(async () => {
    if (!acceptTerms) return alert("Please accept terms first");
    try {
      const data = await postWithFallback(
        "/api/checkin/owner/terms-accept",
        { loginId, accepted: true },
        apiBases
      );
      if (!data.success) return alert(data.message || "Failed to accept terms");
      alert("Terms accepted");
      loadOwnerDetails();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }, [acceptTerms, apiBases, loadOwnerDetails, loginId]);

  const handleFinalSubmit = useCallback(async () => {
    if (!finalVerify) return alert("Please check final verify");
    try {
      const checkinResp = await getWithFallback(`/api/checkin/owner/${encodeURIComponent(loginId)}`, apiBases);
      const ownerResp = await getWithFallback(`/api/owners/${encodeURIComponent(loginId)}`, apiBases);
      const kyc = checkinResp?.record?.ownerKyc || {};
      const ownerKycStatus = ownerResp?.kyc?.status || "";
      const kycVerified = Boolean(kyc.otpVerified || kyc.digilockerVerified || ownerKycStatus === "submitted");
      if (!kycVerified) {
        return alert("Complete KYC verification first (OTP or DigiLocker), then submit.");
      }
      const data = await postWithFallback(
        "/api/checkin/owner/final-submit",
        { loginId, finalVerified: true },
        apiBases
      );
      if (!data.success) return alert(data.message || "Submit failed");
      setFinalConfirmation({ dashboardUrl: data.dashboardUrl || "" });
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }, [apiBases, finalVerify, loginId]);

  const editProfileUrl = useMemo(() => {
    const emailPart = summary.email && summary.email !== "-" ? `&email=${encodeURIComponent(summary.email)}` : "";
    const areaPart = summary.area && summary.area !== "-" ? `&area=${encodeURIComponent(summary.area)}` : "";
    return `/digital-checkin/ownerprofile?loginId=${encodeURIComponent(loginId)}${emailPart}${areaPart}`;
  }, [loginId, summary.area, summary.email]);

  const editKycUrl = useMemo(() => {
    const emailPart = summary.email && summary.email !== "-" ? `&email=${encodeURIComponent(summary.email)}` : "";
    return `/digital-checkin/ownerprofile?loginId=${encodeURIComponent(loginId)}${emailPart}`;
  }, [loginId, summary.email]);

  return {
    summary,
    status,
    acceptTerms,
    setAcceptTerms,
    finalVerify,
    setFinalVerify,
    handleAccept,
    handleFinalSubmit,
    editProfileUrl,
    editKycUrl,
    finalConfirmation,
    loginId
  };
};

