import React from "react";
import templateHtml from "./index.template.html?raw";
import { useHtmlPage } from "../../utils/htmlPage";

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

  return match[1]
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(
      /<footer class="footer container mx-auto px-4 sm:px-6 mt-16">/i,
      '<footer data-shared-website-footer="1" class="footer container mx-auto px-4 sm:px-6 mt-16">'
    )
    .trim();
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
const scripts = scriptEntries
  .filter((entry) => entry.attrs.src)
  .map((entry) => ({
    ...entry.attrs,
    src: withWebsiteAssetPrefix(entry.attrs.src),
  }));
const inlineScripts = scriptEntries
  .filter((entry) => !entry.attrs.src)
  .map((entry) => entry.content)
  .filter(Boolean);
const styles = extractWrappedTagEntries("style", templateHtml)
  .map((entry) => entry.content)
  .filter(Boolean);
const bodyHtml = extractBodyContent(templateHtml);

export default function WebsiteIndex() {
  useHtmlPage({
    title,
    bodyClass: bodyAttrs.class === true ? "" : bodyAttrs.class || "",
    htmlAttrs,
    metas,
    links,
    scripts,
    styles,
    inlineScripts,
  });

  return <div className="html-page" dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}
