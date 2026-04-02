import React from "react";
import templateHtml from "../../pages/website/index.template.html?raw";

// ── HELPER FUNCTIONS ──
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

const rewriteAssetPaths = (html) =>
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

// ── EXTRACT HEADER FROM TEMPLATE ──
const extractHeaderHtml = (source) => {
  const bodyMatch = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return "";

  const bodyContent = bodyMatch[1];

  // Try to extract <header>...</header>
  const headerMatch = bodyContent.match(/<header[\s\S]*?<\/header>/i);
  if (headerMatch) {
    return rewriteAssetPaths(headerMatch[0]).trim();
  }

  return "";
};

// ── EXTRACT MOBILE MENU FROM TEMPLATE ──
const extractMobileMenuHtml = (source) => {
  const bodyMatch = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return { overlay: "", menu: "" };

  const bodyContent = bodyMatch[1];

  // Extract menu overlay
  const overlayMatch = bodyContent.match(/<div[^>]*id="menu-overlay"[^>]*>[\s\S]*?<\/div>/i);
  
  // Extract mobile menu - find div with id="mobile-menu"
  const menuMatch = bodyContent.match(/<div[^>]*id="mobile-menu"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i);
  
  // Alternative: more robust extraction for nested mobile menu
  let menuHtml = "";
  const menuStartMatch = bodyContent.match(/<div[^>]*id="mobile-menu"[^>]*>/i);
  if (menuStartMatch) {
    const startIndex = bodyContent.indexOf(menuStartMatch[0]);
    let depth = 0;
    let endIndex = startIndex;
    let inTag = false;
    
    for (let i = startIndex; i < bodyContent.length; i++) {
      const char = bodyContent[i];
      if (char === '<') {
        inTag = true;
        if (bodyContent.slice(i, i + 4) === '<div') {
          depth++;
        } else if (bodyContent.slice(i, i + 6) === '</div>') {
          depth--;
          if (depth === 0) {
            endIndex = i + 6;
            break;
          }
        }
      }
      if (char === '>') {
        inTag = false;
      }
    }
    
    menuHtml = bodyContent.slice(startIndex, endIndex);
  }

  return {
    overlay: overlayMatch ? overlayMatch[0] : "",
    menu: rewriteAssetPaths(menuHtml || (menuMatch ? menuMatch[0] : ""))
  };
};

// ── EXTRACTED HTML ──
const headerHtml = extractHeaderHtml(templateHtml);
const { overlay: menuOverlayHtml, menu: mobileMenuHtml } = extractMobileMenuHtml(templateHtml);

// ── COMPONENT ──
export default function WebsiteHeader() {
  return (
    <>
      {/* Header */}
      <div dangerouslySetInnerHTML={{ __html: headerHtml }} />
      
      {/* Mobile Menu Overlay */}
      {menuOverlayHtml && (
        <div dangerouslySetInnerHTML={{ __html: menuOverlayHtml }} />
      )}
      
      {/* Mobile Menu */}
      {mobileMenuHtml && (
        <div dangerouslySetInnerHTML={{ __html: mobileMenuHtml }} />
      )}
    </>
  );
}

// Export raw HTML strings if needed elsewhere
export { headerHtml, menuOverlayHtml, mobileMenuHtml };