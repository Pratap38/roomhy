import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useTenantProfile } from "./useTenantProfile";

export default function DigitalCheckinTenantprofile() {
  useHtmlPage({
    title: "Tenant Digital Check-In - Profile",
    bodyClass: "",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [{ rel: "stylesheet", href: "/digital-checkin/assets/css/tenantprofile.css" }],
    styles: [],
    scripts: [],
    inlineScripts: []
  });

  const { form, updateForm, handleSubmit } = useTenantProfile();

  return (
    <div className="html-page">
      <div className="wrap">
        <h2>Tenant Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid">
            <div>
              <label>Login ID</label>
              <input value={form.loginId} onChange={(e) => updateForm({ loginId: e.target.value })} required />
            </div>
            <div>
              <label>Name</label>
              <input value={form.name} onChange={(e) => updateForm({ name: e.target.value })} required />
            </div>
            <div>
              <label>Property Name</label>
              <input value={form.propertyName} onChange={(e) => updateForm({ propertyName: e.target.value })} readOnly />
            </div>
            <div>
              <label>Room Number</label>
              <input value={form.roomNo} onChange={(e) => updateForm({ roomNo: e.target.value })} readOnly />
            </div>
            <div>
              <label>Agreed Rent</label>
              <input value={form.agreedRent} onChange={(e) => updateForm({ agreedRent: e.target.value })} readOnly />
            </div>
            <div>
              <label>Date of Birth</label>
              <input value={form.dob} onChange={(e) => updateForm({ dob: e.target.value })} type="date" required />
            </div>
            <div>
              <label>Guardian Number</label>
              <input value={form.guardianNumber} onChange={(e) => updateForm({ guardianNumber: e.target.value })} required />
            </div>
            <div>
              <label>Date of Move In</label>
              <input value={form.moveInDate} onChange={(e) => updateForm({ moveInDate: e.target.value })} type="date" required />
            </div>
            <div>
              <label>Email</label>
              <input value={form.email} onChange={(e) => updateForm({ email: e.target.value })} type="email" />
            </div>
          </div>
          <button type="submit">Save & Continue to KYC Verification</button>
        </form>
      </div>
    </div>
  );
}

