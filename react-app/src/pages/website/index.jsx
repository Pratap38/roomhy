import React, { useEffect } from "react";
import templateHtml from "./index.template.html?raw";
import { useHtmlPage } from "../../utils/htmlPage";
import { buildOrganizationJsonLd, buildSeoConfig, buildWebsiteJsonLd } from "../../utils/websiteSeo";
import { useWebsiteCommon } from "../../utils/websiteUi";

const WHATSAPP_SUPPORT_NUMBER = "917413040868";

const parseAttributes = (input = "") => {
  const attrs = {};
  const regex = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match;

  while ((match = regex.exec(input))) {
    const key = match[1];
    if (!key || key === "/" || key.endsWith("/")) {
      continue;
    }
    const value = match[2] ?? match[3] ?? match[4];
    attrs[key] = value ?? true;
  }

  return attrs;
};

const withWebsiteAssetPrefix = (value) => {
  if (!value || typeof value !== "string") return value;
  if (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("#") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  if (
    value.startsWith("assets/") ||
    value.startsWith("js/") ||
    value.startsWith("images/") ||
    value.startsWith("css/")
  ) {
    return `/website/${value}`;
  }

  return value;
};

const rewriteBodyAssetPaths = (html) =>
  html.replace(
    /\b(href|src)=("([^"]+)"|'([^']+)')/gi,
    (full, attr, wrappedValue, doubleQuoted, singleQuoted) => {
      const originalValue = doubleQuoted ?? singleQuoted ?? "";
      const rewrittenValue = withWebsiteAssetPrefix(originalValue);
      if (rewrittenValue === originalValue) return full;
      const quote = doubleQuoted != null ? '"' : "'";
      return `${attr}=${quote}${rewrittenValue}${quote}`;
    }
  );

const extractTagAttributes = (tagName, source) => {
  const match = source.match(new RegExp(`<${tagName}\\b([^>]*)>`, "i"));
  return parseAttributes(match?.[1] || "");
};

const extractHeadTagEntries = (tagName, source) => {
  const regex = new RegExp(`<${tagName}\\b([^>]*)>`, "gi");
  return Array.from(source.matchAll(regex), (match) => parseAttributes(match[1] || ""));
};

const extractWrappedTagEntries = (tagName, source) => {
  const regex = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  return Array.from(source.matchAll(regex), (match) => ({
    attrs: parseAttributes(match[1] || ""),
    content: match[2]?.trim() || "",
  }));
};

const extractBodyContent = (source) => {
  const match = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!match) return "";

  const cleanedBody = match[1]
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(
      /<footer class="footer container mx-auto px-4 sm:px-6 mt-16">/i,
      '<footer data-shared-website-footer="1" class="footer container mx-auto px-4 sm:px-6 mt-16">'
    )
    .replace(
      /\bon(click|mouseover|mouseout)="([^"]*window\.location\.href\s*=\s*'([^']+)'.*?)"/gi,
      (full, eventName, handler, target) =>
        full.replace(target, withWebsiteAssetPrefix(target))
    )
    .replace(
      /\bon(click|mouseover|mouseout)='([^']*window\.location\.href\s*=\s*"([^"]+)".*?)'/gi,
      (full, eventName, handler, target) =>
        full.replace(target, withWebsiteAssetPrefix(target))
    )
    .replace(
      /\bonclick="globalLogout\(\)"/gi,
      'onclick="globalLogout()"'
    );

  return rewriteBodyAssetPaths(cleanedBody).trim();
};

const title = templateHtml.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
const htmlAttrs = extractTagAttributes("html", templateHtml);
const bodyAttrs = extractTagAttributes("body", templateHtml);
const metas = extractHeadTagEntries("meta", templateHtml);
const links = extractHeadTagEntries("link", templateHtml).map((link) => ({
  ...link,
  href: withWebsiteAssetPrefix(link.href),
}));
const scriptEntries = extractWrappedTagEntries("script", templateHtml);
const scriptSequence = scriptEntries.map((entry) => {
  if (entry.attrs.src) {
    return {
      type: "external",
      attrs: {
        ...entry.attrs,
        src: withWebsiteAssetPrefix(entry.attrs.src),
      },
    };
  }

  return {
    type: "inline",
    content: entry.content,
  };
});
const scripts = scriptEntries
  .filter((entry) => entry.attrs.src)
  .map((entry) => ({
    ...entry.attrs,
    src: withWebsiteAssetPrefix(entry.attrs.src),
  }));
const inlineScripts = scriptEntries
  .filter((entry) => !entry.attrs.src)
  .map((entry) =>
    entry.content.replace(
      /https:\/\/wa\.me\/\d+\?text=/g,
      `https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=`
    )
  )
  .filter(Boolean);
const styles = extractWrappedTagEntries("style", templateHtml)
  .map((entry) => entry.content)
  .filter(Boolean);
const bodyHtml = extractBodyContent(templateHtml);

export default function WebsiteIndex() {
  useWebsiteCommon();

  const seo = buildSeoConfig({
    title: "Roomhy | Student Rentals, PG, Hostels and Coliving in India",
    description:
      "Find verified PGs, hostels, coliving spaces and student rentals on Roomhy. Compare locations, rent, beds and availability without brokerage.",
    path: "/website/index",
    keywords: [
      "student rental website",
      "pg for rent",
      "hostel near college",
      "rooms for rent",
      "coliving in india",
      "broker free rentals",
      "roomhy"
    ],
    jsonLd: [buildOrganizationJsonLd(), buildWebsiteJsonLd()]
  });

  useHtmlPage({
    title: "Roomhy | Student Rentals, PG, Hostels and Coliving in India",
    bodyClass: bodyAttrs.class === true ? "" : bodyAttrs.class || "",
    htmlAttrs,
    metas: [...metas, ...seo.metas],
    links: [...links, ...seo.links],
    headScripts: seo.headScripts,
    scripts,
    styles,
    inlineScripts,
    scriptSequence,
  });

  useEffect(() => {
    const KNOWN_CITIES = [
      "Indore",
      "Kota",
      "Sikar",
      "Bengaluru",
      "Bangalore",
      "Mumbai",
      "Delhi",
      "Pune",
      "Hyderabad",
      "Agra",
      "Jaipur",
      "Lucknow",
      "Bhopal",
      "Surat",
      "Vadodara",
      "Patna",
      "Kanpur",
      "Nagpur",
      "Visakhapatnam",
      "Chennai"
    ];
    const CITY_ALIAS = { BANGALORE: "Bengaluru" };
    const TYPE_KEYWORDS = [
      ["paying guest", "pg"],
      ["hostel", "hostel"],
      ["apartment", "apartment"],
      ["flat", "apartment"],
      ["pg", "pg"]
    ];

    const parseSearch = (raw) => {
      const q = String(raw || "").toLowerCase().trim();
      let city = null;
      let type = null;

      for (const entry of KNOWN_CITIES) {
        if (q.includes(entry.toLowerCase())) {
          city = CITY_ALIAS[entry.toUpperCase()] || entry;
          break;
        }
      }

      for (const [keyword, mappedType] of TYPE_KEYWORDS) {
        if (q.includes(keyword)) {
          type = mappedType;
          break;
        }
      }

      return { city, type };
    };

    const doSearch = () => {
      const input = document.getElementById("hero-search-input");
      if (!input) return;
      const raw = String(input.value || "").trim();
      if (!raw) return;

      const result = parseSearch(raw);
      const params = new URLSearchParams();
      if (result.city) params.set("city", result.city);
      if (result.type) params.set("type", result.type);
      if (!result.city && !result.type) params.set("search", raw);
      window.location.href = `/website/ourproperty?${params.toString()}`;
    };

    const btn = document.getElementById("hero-search-btn");
    const input = document.getElementById("hero-search-input");
    if (!btn || !input) return undefined;

    const onClick = () => doSearch();
    const onKeyDown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        doSearch();
      }
    };

    btn.addEventListener("click", onClick);
    input.addEventListener("keydown", onKeyDown);
    return () => {
      btn.removeEventListener("click", onClick);
      input.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return <div className="html-page" dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}
