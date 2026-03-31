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
      ? { loading: false, title: "Verification Pending", text: "Owner verification is still pending.", done: false }
      : agreementSigned
        ? { loading: false, title: "Welcome to RoomHy", text: "Owner check-in completed. Login link with owner ID and password has been sent.", done: true }
        : { loading: shouldCompleteAgreement, title: "Finalizing Check-in", text: "Completing owner verification and sending login details.", done: false }
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
          text: "Owner check-in completed. Login link with owner ID and password has been sent.",
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
      <div className="min-h-screen bg-[#f4f4f1]">
        <header className="bg-black border-b border-black">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
            <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-14 w-auto" />
            <div className="text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-400">Digital Check-In</p>
              <h1 className="text-xl font-bold">Owner Success</h1>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-[2rem] border-2 border-black bg-white p-10 shadow-[12px_12px_0_0_#000] text-center">
        <h1 className="mb-4 text-3xl font-black uppercase tracking-tight text-slate-900">{state.title}</h1>
        <p className="mb-8 text-slate-600">
          {state.text}
        </p>
        {state.loading ? (
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-slate-700">Processing...</div>
        ) : null}
        <a
          href={nextUrl}
          className={`inline-flex items-center justify-center rounded-xl border-2 border-black px-6 py-3 font-bold uppercase tracking-[0.14em] ${state.done ? "bg-black text-white hover:bg-white hover:text-black" : "pointer-events-none bg-zinc-300 text-zinc-500"}`}
        >
          Go to Property Owner Login
        </a>
      </div>
      </div>
      </div>
    </div>
  );
}
