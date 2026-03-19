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
    digilockerRef,
    setDigilockerRef,
    otpMsg,
    nextVisible,
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
            <label>DigiLocker Reference ID</label>
            <input value={digilockerRef} onChange={(e) => setDigilockerRef(e.target.value)} />
          </div>
        </div>
        <button type="button" onClick={handleStart}>Start DigiLocker Verification</button>
        <button type="button" onClick={handleComplete}>Complete Verification</button>
        {otpMsg && <p className="muted">{otpMsg}</p>}
        {nextVisible && (
          <button type="button" onClick={handleNext}>Continue to Rental Agreement</button>
        )}
      </div>
    </div>
  );
}

