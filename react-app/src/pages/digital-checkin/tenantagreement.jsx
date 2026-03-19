import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useTenantAgreement } from "./useTenantAgreement";

export default function DigitalCheckinTenantagreement() {
  useHtmlPage({
    title: "Tenant Rental Agreement & E-sign",
    bodyClass: "",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [{ rel: "stylesheet", href: "/digital-checkin/assets/css/tenantagreement.css" }],
    styles: [],
    scripts: [],
    inlineScripts: []
  });

  const { loginId, setLoginId, eSignName, setESignName, accepted, setAccepted, submitting, handleSubmit } =
    useTenantAgreement();

  return (
    <div className="html-page">
      <div className="wrap">
        <h2>Tenant Rental Agreement</h2>
        <div className="box">
          <p>
            This digital e-sign confirms the tenant accepts RoomHy rental terms, monthly rent obligations,
            property rules, and legal compliance requirements.
          </p>
          <p>By signing, tenant confirms information submitted in profile and KYC is accurate.</p>
        </div>

        <label>Login ID</label>
        <input value={loginId} onChange={(e) => setLoginId(e.target.value)} required />

        <label>E-sign Full Name</label>
        <input value={eSignName} onChange={(e) => setESignName(e.target.value)} required />

        <label>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            style={{ width: "auto" }}
          />{" "}
          I accept the rental agreement and provide my e-sign consent.
        </label>

        <button onClick={handleSubmit} disabled={submitting} type="button">
          {submitting ? "Submitting..." : "Final Submit"}
        </button>
      </div>
    </div>
  );
}

