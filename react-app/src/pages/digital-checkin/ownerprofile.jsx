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
    updateRoomCount,
    updateRoomBed,
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
      <header className="dc-header">
        <div className="dc-header-inner">
          <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="dc-logo" />
          <div>
            <p className="dc-eyebrow">Digital Check-In</p>
            <h1 className="dc-header-title">Owner Profile</h1>
          </div>
        </div>
      </header>

      <div className="wrap">
        <div className="hero-card">
          <p className="hero-kicker">Owner Onboarding</p>
          <h2 className="hero-title">Complete your property owner check-in</h2>
          <p className="hero-copy">Fill owner details exactly as shared during onboarding.</p>
        </div>

        {showAutoInfo && (
          <div id="autoFetchedInfo" className="info-panel">
            <p className="info-panel-title">Auto-Fetched Information</p>
            <div className="info-panel-grid">
              <p>
                <strong>Email:</strong> <span>{autoInfo.email || "-"}</span>
              </p>
              <p>
                <strong>Area:</strong> <span>{autoInfo.area || "-"}</span>
              </p>
              <p>
                <strong>Password:</strong> <span className="mono">{autoInfo.password || "-"}</span>
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

          <div className="full section-card">
            <h2>Occupancy Details</h2>
            <p>Enter occupied rooms, beds in each occupied room, vacant rooms, and beds in each vacant room.</p>
            <div className="occupancy-grid">
              <div className="occupancy-block">
                <label>Occupied Rooms</label>
                <input
                  type="number"
                  min="0"
                  value={form.occupiedRooms}
                  onChange={(e) => updateRoomCount("occupiedRooms", e.target.value)}
                />
                {form.occupiedRoomBeds.map((beds, index) => (
                  <div key={`occupied-${index}`} className="room-bed-row">
                    <label>{`Occupied Room ${index + 1} Beds`}</label>
                    <input
                      type="number"
                      min="1"
                      value={beds}
                      onChange={(e) => updateRoomBed("occupied", index, e.target.value)}
                    />
                  </div>
                ))}
                <p className="occupancy-total">{`Occupied Beds Total: ${form.occupiedBeds}`}</p>
              </div>

              <div className="occupancy-block">
                <label>Vacant Rooms</label>
                <input
                  type="number"
                  min="0"
                  value={form.vacantRooms}
                  onChange={(e) => updateRoomCount("vacantRooms", e.target.value)}
                />
                {form.vacantRoomBeds.map((beds, index) => (
                  <div key={`vacant-${index}`} className="room-bed-row">
                    <label>{`Vacant Room ${index + 1} Beds`}</label>
                    <input
                      type="number"
                      min="1"
                      value={beds}
                      onChange={(e) => updateRoomBed("vacant", index, e.target.value)}
                    />
                  </div>
                ))}
                <p className="occupancy-total">{`Vacant Beds Total: ${form.vacantBeds}`}</p>
              </div>
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

