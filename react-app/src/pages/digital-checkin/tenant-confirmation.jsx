import React from "react";
import { getApiBases, postWithFallback } from "./utils";
import { useHtmlPage } from "../../utils/htmlPage";

const resolveTenantLoginUrl = () => {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1"
    ? "http://localhost:5001/tenant//tenant/tenantlogin"
    : "https://app.roomhy.com/tenant//tenant/tenantlogin";
};

export default function DigitalCheckinTenantConfirmation() {
  useHtmlPage({
    title: "RoomHy - Submission Complete",
    bodyClass: "",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [{ rel: "stylesheet", href: "/digital-checkin/assets/css/tenant-confirmation.css" }],
    styles: [],
    scripts: [],
    inlineScripts: []
  });

  const params = new URLSearchParams(window.location.search);
  const loginId = params.get("loginId") || "";
  const shouldCompleteAgreement = params.get("completeAgreement") === "1";
  const agreementSigned = params.get("agreementSigned") === "1";
  const agreementPending = params.get("agreementPending") === "1";
  const provider = params.get("mockAgreement") === "1" ? "mock-zoho-sign" : "zoho-sign";
  const nextUrl = React.useMemo(() => (typeof window === "undefined" ? "" : resolveTenantLoginUrl()), []);
  const [state, setState] = React.useState(
    agreementPending
      ? { loading: false, title: "Agreement Pending", text: "Tenant rental agreement is still pending signature.", done: false }
      : agreementSigned
        ? { loading: false, title: "Welcome to RoomHy", text: "Your tenant rental agreement is completed.", done: true }
        : { loading: shouldCompleteAgreement, title: "Finalizing Agreement", text: "Completing tenant agreement and sending login details.", done: false }
  );

  React.useEffect(() => {
    if (!shouldCompleteAgreement || !loginId) return;
    let active = true;
    const run = async () => {
      try {
        const resp = await postWithFallback(
          "/api/checkin/tenant/agreement/complete",
          { loginId, provider },
          getApiBases()
        );
        if (!active) return;
        if (!resp.success) throw new Error(resp.message || "Unable to complete agreement");
        setState({
          loading: false,
          title: "Welcome to RoomHy",
          text: "Your tenant rental agreement is completed. Login details have been sent to your email.",
          done: true
        });
      } catch (err) {
        if (!active) return;
        setState({
          loading: false,
          title: "Agreement Completion Failed",
          text: err.message,
          done: false
        });
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [loginId, provider, shouldCompleteAgreement]);

  React.useEffect(() => {
    if (!state.done || !nextUrl) return undefined;
    const timer = setTimeout(() => {
      try {
        window.location.replace(nextUrl);
      } catch (_) {
        window.location.href = nextUrl;
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [nextUrl, state.done]);

  return (
    <div className="html-page">
      <div className="card">
        <div className="icon">&#10003;</div>
        <h1>{state.title}</h1>
        <p>{state.text}</p>
        <div className="meta" id="redirectText">
          {state.done ? "Redirecting to login page in 5 seconds..." : state.loading ? "Processing..." : "Please complete the agreement flow and retry."}
        </div>
        <a className={`btn${state.done ? "" : " disabled"}`} href={nextUrl || "../tenant//tenant/tenantlogin"}>
          Go to Tenant Login Now
        </a>
      </div>
    </div>
  );
}
