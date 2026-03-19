import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiBases, getParamValue, postExpectSuccess } from "./utils";

const TENANT_KYC_STATE_KEY = "roomhy_tenant_kyc_state";

export const useTenantKyc = () => {
  const apiBases = useMemo(() => getApiBases(), []);
  const [loginId, setLoginId] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarLinkedPhone, setAadhaarLinkedPhone] = useState("");
  const [digilockerRef, setDigilockerRef] = useState("");
  const [lastRefId, setLastRefId] = useState("");
  const [otpMsg, setOtpMsg] = useState("");
  const [nextVisible, setNextVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("loginId")) setLoginId(params.get("loginId"));
  }, []);

  const saveKycState = useCallback(
    (extra = {}) => {
      try {
        const state = {
          loginId: loginId.trim(),
          aadhaarNumber: aadhaarNumber.trim().replace(/\D/g, ""),
          aadhaarLinkedPhone: aadhaarLinkedPhone.trim(),
          referenceId: digilockerRef.trim() || lastRefId || "",
          ...extra
        };
        sessionStorage.setItem(TENANT_KYC_STATE_KEY, JSON.stringify(state));
      } catch (_) {}
    },
    [aadhaarLinkedPhone, aadhaarNumber, digilockerRef, lastRefId, loginId]
  );

  useEffect(() => {
    try {
      const state = JSON.parse(sessionStorage.getItem(TENANT_KYC_STATE_KEY) || "{}");
      if (!state || typeof state !== "object") return;
      if (!loginId && state.loginId) setLoginId(state.loginId);
      if (state.aadhaarNumber) setAadhaarNumber(state.aadhaarNumber);
      if (state.aadhaarLinkedPhone) setAadhaarLinkedPhone(state.aadhaarLinkedPhone);
      if (state.referenceId) setLastRefId(state.referenceId);
    } catch (_) {}
  }, [loginId]);

  useEffect(() => {
    const referenceFromCallback = getParamValue(["reference_id", "ref_id", "referenceId"]);
    if (referenceFromCallback) {
      setLastRefId(referenceFromCallback);
      setDigilockerRef(referenceFromCallback);
      saveKycState({ referenceId: referenceFromCallback });
      setOtpMsg("DigiLocker callback received. Click Complete Verification.");
    }
  }, [saveKycState]);

  useEffect(() => {
    const callbackParams = new URLSearchParams(window.location.search);
    if (
      !callbackParams.get("reference_id") &&
      !callbackParams.get("ref_id") &&
      !callbackParams.get("referenceId")
    ) {
      setDigilockerRef("");
    }
  }, []);

  const handleStart = useCallback(async () => {
    try {
      const aadhaarRaw = aadhaarNumber.trim().replace(/\D/g, "");
      if (!/^\d{12}$/.test(aadhaarRaw)) return alert("Aadhaar must be 12 digits");

      const data = await postExpectSuccess(
        "/api/checkin/tenant/kyc/digilocker/start",
        {
          loginId: loginId.trim(),
          aadhaarNumber: aadhaarRaw,
          aadhaarLinkedPhone: aadhaarLinkedPhone.trim(),
          redirectUrl: `${window.location.origin}${window.location.pathname}?loginId=${encodeURIComponent(
            loginId.trim()
          )}`
        },
        apiBases
      );

      const referenceId = data.referenceId || "";
      setLastRefId(referenceId);
      setDigilockerRef("");
      saveKycState({ referenceId, verificationId: data.verificationId || "" });
      setOtpMsg("DigiLocker verification initiated. Complete it and click Complete Verification.");
      if (data.verifyUrl) window.location.href = data.verifyUrl;
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }, [aadhaarLinkedPhone, aadhaarNumber, apiBases, loginId, saveKycState]);

  const handleComplete = useCallback(async () => {
    try {
      const aadhaarRaw = aadhaarNumber.trim().replace(/\D/g, "");
      if (!/^\d{12}$/.test(aadhaarRaw)) return alert("Aadhaar must be 12 digits");
      const referenceId = digilockerRef.trim() || lastRefId;
      if (!referenceId) return alert("DigiLocker reference ID is required");

      const payload = {
        loginId: loginId.trim(),
        aadhaarNumber: aadhaarRaw,
        referenceId
      };
      saveKycState({ referenceId });
      await postExpectSuccess("/api/checkin/tenant/kyc/digilocker/complete", payload, apiBases);

      try {
        const upperLogin = String(payload.loginId || "").toUpperCase();
        const tenants = JSON.parse(localStorage.getItem("roomhy_tenants") || "[]");
        const idx = tenants.findIndex((t) => String(t.loginId || "").toUpperCase() === upperLogin);
        if (idx > -1) {
          tenants[idx].kycStatus = "verified";
          tenants[idx].kyc = tenants[idx].kyc || {};
          tenants[idx].kyc.digilockerVerified = true;
          tenants[idx].kyc.digilockerVerifiedAt = new Date().toISOString();
          tenants[idx].kyc.aadhaarNumber = payload.aadhaarNumber || tenants[idx].kyc.aadhaarNumber || "";
          tenants[idx].kyc.aadhar = payload.aadhaarNumber || tenants[idx].kyc.aadhar || "";
          tenants[idx].digitalCheckin = tenants[idx].digitalCheckin || {};
          tenants[idx].digitalCheckin.kyc = {
            ...(tenants[idx].digitalCheckin.kyc || {}),
            digilockerVerified: true,
            digilockerVerifiedAt: new Date().toISOString()
          };
          localStorage.setItem("roomhy_tenants", JSON.stringify(tenants));
        }
      } catch (_) {}

      alert("DigiLocker verification completed successfully");
      setNextVisible(true);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }, [aadhaarNumber, apiBases, digilockerRef, lastRefId, loginId, saveKycState]);

  const handleNext = useCallback(() => {
    window.location.href = `/digital-checkin/tenantagreement?loginId=${encodeURIComponent(loginId.trim())}`;
  }, [loginId]);

  return {
    loginId,
    setLoginId,
    aadhaarNumber,
    setAadhaarNumber,
    aadhaarLinkedPhone,
    setAadhaarLinkedPhone,
    digilockerRef,
    setDigilockerRef,
    otpMsg,
    nextVisible,
    handleStart,
    handleComplete,
    handleNext
  };
};

