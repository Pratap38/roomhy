import React from "react";
import templateHtml from "./index.template.html?raw";
import { useHtmlPage } from "../../utils/htmlPage";

const extractMatches = (pattern, source) =>
  Array.from(source.matchAll(pattern), (match) => match[1].trim()).filter(Boolean);

const extractBodyContent = (source) => {
  const match = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!match) return "";

  return match[1]
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(
      /<footer class="footer container mx-auto px-4 sm:px-6 mt-16">/i,
      '<footer data-shared-website-footer="1" class="footer container mx-auto px-4 sm:px-6 mt-16">'
    )
    .trim();
};

const inlineScripts = extractMatches(/<script>([\s\S]*?)<\/script>/gi, templateHtml);
const styles = extractMatches(/<style>([\s\S]*?)<\/style>/gi, templateHtml);
const bodyHtml = extractBodyContent(templateHtml);

export default function WebsiteIndex() {
  useHtmlPage({
    title: "Roomhy - Find Your Student Home",
    bodyClass: "text-gray-800",
    htmlAttrs: {
      lang: "en",
      class: "scroll-smooth",
    },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { name: "referrer", content: "no-referrer-when-downgrade" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: true },
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet",
      },
      {
        rel: "stylesheet",
        href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css",
        crossorigin: "anonymous",
        referrerpolicy: "no-referrer",
      },
      { rel: "stylesheet", href: "/website/assets/css/index.css" },
    ],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" },
      { src: "/website/js/auth-utils.js" },
      { src: "/website/assets/js/index.js" },
    ],
    styles,
    inlineScripts,
  });

  return <div className="html-page" dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}
