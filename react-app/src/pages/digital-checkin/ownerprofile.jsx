import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useOwnerProfile } from "./useOwnerProfile";

export default function DigitalCheckinOwnerprofile() {
  useHtmlPage({
    title: "Owner Digital Check-In - Profile",
    bodyClass: "",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [{ rel: "stylesheet", href: "/digital-checkin/assets/css/ownerprofile.css" }],
    styles: [],
    scripts: [],
    inlineScripts: []
  });

  const {
    form,
    updateForm,
    autoInfo,
    showAutoInfo,
    aadhaarLinkedPhone,
    setAadhaarLinkedPhone,
    aadhaarNumber,
    handleAadhaarChange,
    otp,
    setOtp,
    otpSent,
    kycStatus,
    loadingStart,
    loadingComplete,
    handleStartVerification,
    handleCompleteVerification,
    handleSubmit
  } = useOwnerProfile();

  return (
    <div className="html-page">
      <div className="wrap">
        <h1>Owner Check-In Profile</h1>
        <p>Fill owner details exactly as shared during onboarding.</p>

        {showAutoInfo && (
          <div
            id="autoFetchedInfo"
            style={{
              background: "#e3f2fd",
              border: "1px solid #2196f3",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "16px"
            }}
          >
            <p style={{ margin: "0 0 8px", fontWeight: "bold", color: "#1976d2" }}>
              Auto-Fetched Information:
            </p>
            <div style={{ fontSize: "13px", color: "#555" }}>
              <p style={{ margin: "4px 0" }}>
                <strong>Email:</strong> <span>{autoInfo.email || "-"}</span>
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Area:</strong> <span>{autoInfo.area || "-"}</span>
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Password:</strong>{" "}
                <span style={{ fontFamily: "monospace" }}>{autoInfo.password || "-"}</span>
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid">
            <div>
              <label>Login ID (given in message)</label>
              <input
                value={form.loginId}
                onChange={(e) => updateForm({ loginId: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Name</label>
              <input value={form.name} onChange={(e) => updateForm({ name: e.target.value })} required />
            </div>
            <div>
              <label>Gmail</label>
              <input
                value={form.email}
                onChange={(e) => updateForm({ email: e.target.value })}
                type="email"
                required
              />
            </div>
            <div>
              <label>Area</label>
              <input value={form.area} onChange={(e) => updateForm({ area: e.target.value })} required />
            </div>
            <div>
              <label>Date of Birth</label>
              <input value={form.dob} onChange={(e) => updateForm({ dob: e.target.value })} type="date" required />
            </div>
            <div>
              <label>Phone Number</label>
              <input value={form.phone} onChange={(e) => updateForm({ phone: e.target.value })} type="tel" required />
            </div>
            <div>
              <label>Address</label>
              <input value={form.address} onChange={(e) => updateForm({ address: e.target.value })} required />
            </div>
            <div>
              <label>Bank Name</label>
              <input value={form.bankName} onChange={(e) => updateForm({ bankName: e.target.value })} required />
            </div>
            <div>
              <label>Branch Name</label>
              <input value={form.branchName} onChange={(e) => updateForm({ branchName: e.target.value })} required />
            </div>
            <div>
              <label>Bank Account Number</label>
              <input
                value={form.bankAccountNumber}
                onChange={(e) => updateForm({ bankAccountNumber: e.target.value })}
                required
              />
            </div>
            <div>
              <label>IFSC Code</label>
              <input value={form.ifscCode} onChange={(e) => updateForm({ ifscCode: e.target.value })} required />
            </div>
            <div>
              <label>Account Holder Name</label>
              <input
                value={form.accountHolderName}
                onChange={(e) => updateForm({ accountHolderName: e.target.value })}
                required
              />
            </div>
            <div>
              <label>UPI ID (optional)</label>
              <input value={form.upiId} onChange={(e) => updateForm({ upiId: e.target.value })} />
            </div>
          </div>
          <div className="full">
            <h2>Aadhaar OTP Verification</h2>
            <p>Send OTP to the Aadhaar-linked mobile number and complete owner verification on this page.</p>
          </div>
          <div>
            <label>Mobile Number (linked with Aadhaar)</label>
            <input
              value={aadhaarLinkedPhone}
              onChange={(e) => setAadhaarLinkedPhone(e.target.value)}
              type="text"
              placeholder="10-digit mobile number"
              required
            />
          </div>
          <div>
            <label>Aadhaar Number</label>
            <input
              value={aadhaarNumber}
              onChange={(e) => handleAadhaarChange(e.target.value)}
              type="text"
              placeholder="XXXX XXXX XXXX"
              required
            />
          </div>
          <div className="full">
            <label>OTP</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              type="text"
              placeholder="Enter OTP received on Aadhaar-linked phone"
            />
          </div>
          {kycStatus.text ? (
            <div className={`full status-box ${kycStatus.type === "error" ? "status-error" : "status-success"}`}>
              {kycStatus.text}
            </div>
          ) : null}
          <div className="full actions-row">
            <button type="submit" className="secondary-btn">Save Profile</button>
            <button type="button" onClick={handleStartVerification} disabled={loadingStart}>
              {loadingStart ? "Sending OTP..." : "Send OTP"}
            </button>
            <button type="button" onClick={handleCompleteVerification} disabled={loadingComplete}>
              {loadingComplete ? "Verifying..." : otpSent ? "Verify OTP & Complete" : "Complete Verification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

