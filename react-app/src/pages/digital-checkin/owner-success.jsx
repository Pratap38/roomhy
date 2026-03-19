import React from "react";
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
  const nextUrl = params.get("next") || "/propertyowner/index";

  return (
    <div className="html-page w-full">
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-10 shadow-xl text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Welcome to RoomHy</h1>
        <p className="text-slate-600 mb-8">
          Your owner digital check-in has been completed successfully.
          Please login through the link below.
        </p>
        <a
          href={nextUrl}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Go to Property Owner Login
        </a>
      </div>
    </div>
  );
}
