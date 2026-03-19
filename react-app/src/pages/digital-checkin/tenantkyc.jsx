import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useTenantKyc } from "./useTenantKyc";

export default function DigitalCheckinTenantkyc() {
  useHtmlPage({
    title: "Tenant Digital Check-In - KYC",
    bodyClass: "",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [{ rel: "stylesheet", href: "/digital-checkin/assets/css/tenantkyc.css" }],
    styles: [],
    scripts: [],
    inlineScripts: []
  });

  const {
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
  } = useTenantKyc();

  return (
    <div className="html-page">
      <div className="wrap">
        <h2>Tenant Aadhaar KYC</h2>
        <div className="grid">
          <div>
            <label>Login ID</label>
            <input value={loginId} onChange={(e) => setLoginId(e.target.value)} required />
          </div>
          <div>
            <label>Aadhaar Number</label>
            <input
              value={aadhaarNumber}
              onChange={(e) => setAadhaarNumber(e.target.value)}
              pattern="\\d{12}"
              maxLength="12"
              required
            />
          </div>
          <div>
            <label>Aadhaar Linked Phone Number</label>
            <input value={aadhaarLinkedPhone} onChange={(e) => setAadhaarLinkedPhone(e.target.value)} required />
          </div>
          <div>
            <label>OTP</label>
            <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP from Aadhaar-linked mobile" />
          </div>
        </div>
        <button type="button" onClick={handleStart}>Send OTP</button>
        <button type="button" onClick={handleComplete}>{otpSent ? "Verify OTP & Complete" : "Complete Verification"}</button>
        {otpMsg && <p className="muted">{otpMsg}</p>}
        {nextVisible && (
          <button type="button" onClick={handleNext}>Continue to Rental Agreement</button>
        )}
      </div>
    </div>
  );
}

