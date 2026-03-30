import React from "react";
import { getApiBases, postWithFallback } from "./utils";
import { useHtmlPage } from "../../utils/htmlPage";

export default function DigitalCheckinOwnerSuccess() {
  useHtmlPage({
    title: "Welcome to RoomHy",
    bodyClass: "flex items-center justify-center min-h-screen p-4",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }],
    inlineScripts: []
  });

  const params = new URLSearchParams(window.location.search);
  const loginId = params.get("loginId") || "";
  const nextUrl = params.get("next") || "/propertyowner/index";
  const shouldCompleteAgreement = params.get("completeAgreement") === "1";
  const agreementSigned = params.get("agreementSigned") === "1";
  const agreementPending = params.get("agreementPending") === "1";
  const provider = params.get("mockAgreement") === "1" ? "mock-zoho-sign" : "zoho-sign";
  const [state, setState] = React.useState(
    agreementPending
      ? { loading: false, title: "Agreement Pending", text: "Owner agreement is still pending signature.", done: false }
      : agreementSigned
        ? { loading: false, title: "Welcome to RoomHy", text: "Owner agreement completed. Login link with owner ID and password has been sent.", done: true }
        : { loading: shouldCompleteAgreement, title: "Finalizing Agreement", text: "Completing owner agreement and sending login details.", done: false }
  );

  React.useEffect(() => {
    if (!shouldCompleteAgreement || !loginId) return;
    let active = true;
    const run = async () => {
      try {
        const resp = await postWithFallback(
          "/api/checkin/owner/agreement/complete",
          { loginId, provider },
          getApiBases()
        );
        if (!active) return;
        if (!resp.success) throw new Error(resp.message || "Unable to complete agreement");
        setState({
          loading: false,
          title: "Welcome to RoomHy",
          text: "Owner agreement completed. Login link with owner ID and password has been sent.",
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

  return (
    <div className="html-page w-full">
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-10 shadow-xl text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">{state.title}</h1>
        <p className="text-slate-600 mb-8">
          {state.text}
        </p>
        {state.loading ? (
          <div className="text-sm font-medium text-blue-600">Processing...</div>
        ) : null}
        <a
          href={nextUrl}
          className={`inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold text-white ${state.done ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-400 pointer-events-none"}`}
        >
          Go to Property Owner Login
        </a>
      </div>
    </div>
  );
}
