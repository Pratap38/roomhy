import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiBases, postExpectSuccess } from "./utils";

const TENANT_KYC_STATE_KEY = "roomhy_tenant_kyc_state";

export const useTenantKyc = () => {
  const apiBases = useMemo(() => getApiBases(), []);
  const [loginId, setLoginId] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarLinkedPhone, setAadhaarLinkedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpMsg, setOtpMsg] = useState("");
  const [nextVisible, setNextVisible] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

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
          otpSent,
          ...extra
        };
        sessionStorage.setItem(TENANT_KYC_STATE_KEY, JSON.stringify(state));
      } catch (_) {}
    },
    [aadhaarLinkedPhone, aadhaarNumber, loginId, otpSent]
  );

  useEffect(() => {
    try {
      const state = JSON.parse(sessionStorage.getItem(TENANT_KYC_STATE_KEY) || "{}");
      if (!state || typeof state !== "object") return;
      if (!loginId && state.loginId) setLoginId(state.loginId);
      if (state.aadhaarNumber) setAadhaarNumber(state.aadhaarNumber);
      if (state.aadhaarLinkedPhone) setAadhaarLinkedPhone(state.aadhaarLinkedPhone);
      if (state.otpSent) setOtpSent(true);
    } catch (_) {}
  }, [loginId]);

  const handleStart = useCallback(async () => {
    try {
      const aadhaarRaw = aadhaarNumber.trim().replace(/\D/g, "");
      if (!/^\d{12}$/.test(aadhaarRaw)) return alert("Aadhaar must be 12 digits");

      const data = await postExpectSuccess(
        "/api/checkin/tenant/kyc/send-otp",
        {
          loginId: loginId.trim(),
          aadhaarNumber: aadhaarRaw,
          aadhaarLinkedPhone: aadhaarLinkedPhone.trim()
        },
        apiBases
      );
      setOtpSent(true);
      saveKycState({ otpSent: true });
      setOtpMsg(data?.mockOtp ? `OTP sent. Sandbox mock OTP: ${data.mockOtp}` : "OTP sent to Aadhaar-linked mobile. Enter OTP and complete verification.");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }, [aadhaarLinkedPhone, aadhaarNumber, apiBases, loginId, saveKycState]);

  const handleComplete = useCallback(async () => {
    try {
      const aadhaarRaw = aadhaarNumber.trim().replace(/\D/g, "");
      if (!/^\d{12}$/.test(aadhaarRaw)) return alert("Aadhaar must be 12 digits");
      if (!otp.trim()) return alert("OTP is required");

      const payload = {
        loginId: loginId.trim(),
        aadhaarNumber: aadhaarRaw,
        otp: otp.trim()
      };
      saveKycState({ otpSent: true });
      await postExpectSuccess("/api/checkin/tenant/kyc/verify-otp", payload, apiBases);

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

      alert("OTP verification completed successfully");
      setNextVisible(true);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }, [aadhaarNumber, apiBases, loginId, otp, saveKycState]);

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
    otp,
    setOtp,
    otpMsg,
    nextVisible,
    otpSent,
    handleStart,
    handleComplete,
    handleNext
  };
};

