import { useEffect, useLayoutEffect } from "react";
import { initTailwindHelper, rescanTailwind } from "./tailwindHelper";

const ensureElement = (key, createElement) => {
  const existing = document.querySelector(`[data-hp-key="${key}"]`);
  if (existing) {
    return { element: existing, owned: false };
  }
  const element = createElement();
  element.setAttribute("data-hp-key", key);
  document.head.appendChild(element);
  return { element, owned: true };
};

const applyAttributes = (element, attrs) => {
  Object.entries(attrs || {}).forEach(([key, value]) => {
    if (value === true) {
      element.setAttribute(key, "");
      return;
    }
    if (value === false || value == null) {
      return;
    }
    element.setAttribute(key, String(value));
  });
};

const attrsKey = (prefix, attrs) => {
  const parts = Object.entries(attrs || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`);
  return `${prefix}:${parts.join("|")}`;
};

const inlineExecutedKey = "__hp_inline_executed__";

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const suppressTailwindCdnWarnings = () => {
  if (typeof window === "undefined" || window.__tailwindCdnWarningSuppressed) return;
  window.__tailwindCdnWarningSuppressed = true;

  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);
  const shouldSuppress = (args) =>
    args.some((arg) => {
      const text = String(arg || "");
      return (
        text.includes("cdn.tailwindcss.com should not be used in production") ||
        text.includes("To use Tailwind CSS in production")
      );
    });

  console.warn = (...args) => {
    if (shouldSuppress(args)) return;
    originalWarn(...args);
  };

  console.error = (...args) => {
    if (shouldSuppress(args)) return;
    originalError(...args);
  };
};

const markInlineExecuted = (key) => {
  if (!window[inlineExecutedKey]) {
    window[inlineExecutedKey] = {};
  }
  window[inlineExecutedKey][key] = true;
};

const wasInlineExecuted = (key) => Boolean(window[inlineExecutedKey]?.[key]);

const getLegacyApiUrl = () => {
  if (typeof window === "undefined") return "https://api.roomhy.com";
  const host = window.location?.hostname;
  return host === "localhost" || host === "127.0.0.1"
    ? "http://localhost:5001"
    : "https://api.roomhy.com";
};

const loadScriptSequentially = async (script) => {
  if (!script?.src) return;
  const key = `script:${script.src}`;
  if (document.querySelector(`script[src="${script.src}"]`) || document.querySelector(`[data-hp-key="${key}"]`)) {
    return;
  }
  await new Promise((resolve, reject) => {
    const el = document.createElement("script");
    applyAttributes(el, script);
    el.async = false;
    el.onload = () => resolve();
    el.onerror = reject;
    el.setAttribute("data-hp-key", key);
    document.head.appendChild(el);
  });
};

const waitForStylesheets = (linkElements, timeoutMs = 1000) =>
  new Promise((resolve) => {
    if (!linkElements?.length) {
      resolve();
      return;
    }

    let remaining = 0;
    const done = () => {
      remaining -= 1;
      if (remaining <= 0) resolve();
    };

    linkElements.forEach((linkEl) => {
      if (!linkEl || linkEl.tagName !== "LINK") return;
      if (linkEl.rel !== "stylesheet") return;

      // If already loaded, don't wait.
      if (linkEl.sheet) return;

      remaining += 1;
      linkEl.addEventListener("load", done, { once: true });
      linkEl.addEventListener("error", done, { once: true });
    });

    if (remaining === 0) {
      resolve();
      return;
    }

    setTimeout(resolve, timeoutMs);
  });

const waitForTailwindStyles = async (hasTailwindScript, timeoutMs = 700) => {
  if (!hasTailwindScript) return;
  const startCount = document.styleSheets.length;
  await new Promise((resolve) => {
    const startTime = Date.now();
    const check = () => {
      if (document.styleSheets.length > startCount) {
        resolve();
        return;
      }
      if (Date.now() - startTime > timeoutMs) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  });
};

const waitForTailwindComputed = async (timeoutMs = 450) => {
  const probe = document.createElement("div");
  probe.className = "hidden";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);

  await new Promise((resolve) => {
    const startTime = Date.now();
    const check = () => {
      const display = window.getComputedStyle(probe).display;
      if (display === "none") {
        resolve();
        return;
      }
      if (Date.now() - startTime > timeoutMs) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  });

  probe.remove();
};

const dispatchSyntheticDomContentLoaded = () => {
  if (typeof document === "undefined") return;
  const event = new Event("DOMContentLoaded", {
    bubbles: true,
    cancelable: true
  });
  document.dispatchEvent(event);
};

const getEmployeeSessionUser = () => {
  try {
    const raw =
      sessionStorage.getItem("manager_user") ||
      sessionStorage.getItem("user") ||
      localStorage.getItem("staff_user") ||
      localStorage.getItem("manager_user") ||
      localStorage.getItem("user") ||
      "null";
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

const normalizePermissions = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((v) => {
        if (typeof v === "string") return v;
        if (v && typeof v === "object") return v.id || v.value || v.key || "";
        return "";
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

const getEmployeePermissionList = (user) => {
  if (!user || user.role !== "employee") return [];
  let perms = normalizePermissions(user.permissions);
  if (perms.length) return perms;
  try {
    const list = JSON.parse(localStorage.getItem("roomhy_employees") || "[]");
    const emp = Array.isArray(list)
      ? list.find((e) => String(e.loginId || "").toUpperCase() === String(user.loginId || "").toUpperCase())
      : null;
    if (emp) {
      perms = normalizePermissions(emp.permissions || emp.modules || emp.moduleAccess || emp.access);
    }
  } catch (e) {
    // ignore
  }
  return perms;
};

const getEmployeeDisplayInfo = (user) => {
  if (!user) return { name: "User", role: "Employee", initials: "US", loginId: "" };
  const name = user.name || user.fullName || user.employeeName || user.loginId || "User";
  const role = user.team || user.role || "Employee";
  const loginId = user.loginId || "";
  const initials = String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || String(loginId).slice(0, 2).toUpperCase() || "US";
  return { name: String(name), role: String(role), initials, loginId: String(loginId) };
};

const isWebsiteRoute = () => {
  if (typeof window === "undefined") return false;
  return /^\/website(?:\/|$)/.test(window.location?.pathname || "");
};

const websiteFooterIcon = (path, viewBox = "0 0 24 24") =>
  `<svg viewBox="${viewBox}" fill="currentColor" aria-hidden="true" class="h-4 w-4"><path d="${path}"></path></svg>`;

const getWebsiteFooterMarkup = () => {
  const year = new Date().getFullYear();

  return `
    <footer data-shared-website-footer="1" class="mt-auto border-t border-gray-200 bg-white">
      <div class="container mx-auto px-4 py-12 sm:px-6">
        <div class="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div class="md:col-span-4">
            <a href="/website/index" class="inline-flex items-center gap-3">
              <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy" class="h-10 w-auto" />
            </a>
            <p class="mt-4 max-w-sm text-sm text-gray-600">Find student housing smarter, simpler, and broker-free.</p>
            <div class="mt-5 flex flex-wrap items-center gap-3 text-sm">
              <a class="text-gray-600 transition-colors hover:text-blue-600" href="/website/contact">Help & Support</a>
              <span class="text-gray-300">&bull;</span>
              <a class="text-gray-600 transition-colors hover:text-blue-600" href="mailto:hello@roomhy.com">hello@roomhy.com</a>
            </div>
            <div class="mt-6 flex items-center gap-4 text-gray-600">
              <a href="#" title="Facebook" class="transition-colors hover:text-blue-600" aria-label="Facebook">${websiteFooterIcon("M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12")}</a>
              <a href="#" title="X" class="transition-colors hover:text-blue-600" aria-label="X">${websiteFooterIcon("M18.9 2H21l-4.58 5.24L21.8 22h-4.73l-3.7-4.84L9.13 22H7l4.9-5.6L2.2 2h4.85l3.34 4.4L18.9 2")}</a>
              <a href="#" title="Instagram" class="transition-colors hover:text-blue-600" aria-label="Instagram">${websiteFooterIcon("M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm0 2h10c1.65 0 3 1.35 3 3v10c0 1.65-1.35 3-3 3H7c-1.65 0-3-1.35-3-3V7c0-1.65 1.35-3 3-3zm11.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6")}</a>
              <a href="#" title="LinkedIn" class="transition-colors hover:text-blue-600" aria-label="LinkedIn">${websiteFooterIcon("M6.94 8.5H3.56V20h3.38V8.5zM5.25 3A1.97 1.97 0 0 0 3.28 4.97c0 1.08.88 1.97 1.97 1.97a1.97 1.97 0 1 0 0-3zM20.44 13.02c0-3.05-1.63-4.47-3.8-4.47-1.75 0-2.53.96-2.96 1.64V8.5h-3.38c.05 1.12 0 11.5 0 11.5h3.38v-6.42c0-.34.02-.67.12-.92.27-.67.88-1.36 1.91-1.36 1.35 0 1.89 1.03 1.89 2.55V20H21v-6.98z")}</a>
              <a href="#" title="YouTube" class="transition-colors hover:text-blue-600" aria-label="YouTube">${websiteFooterIcon("M21.58 7.19a2.98 2.98 0 0 0-2.1-2.11C17.63 4.5 12 4.5 12 4.5s-5.63 0-7.48.58a2.98 2.98 0 0 0-2.1 2.11A31.2 31.2 0 0 0 2 12a31.2 31.2 0 0 0 .42 4.81 2.98 2.98 0 0 0 2.1 2.11c1.85.58 7.48.58 7.48.58s5.63 0 7.48-.58a2.98 2.98 0 0 0 2.1-2.11A31.2 31.2 0 0 0 22 12a31.2 31.2 0 0 0-.42-4.81zM10 15.5v-7l6 3.5-6 3.5z")}</a>
            </div>
          </div>
          <div class="md:col-span-8">
            <div class="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <div>
                <div class="text-sm font-semibold text-gray-900">Company</div>
                <ul class="mt-4 space-y-2">
                  <li><a class="text-sm text-gray-600 transition-colors hover:text-blue-600" href="/website/about">About Roomhy</a></li>
                  <li><a class="text-sm text-gray-600 transition-colors hover:text-blue-600" href="/website/contact">Contact</a></li>
                </ul>
              </div>
              <div>
                <div class="text-sm font-semibold text-gray-900">Explore</div>
                <ul class="mt-4 space-y-2">
                  <li><a class="text-sm text-gray-600 transition-colors hover:text-blue-600" href="/website/index">Home</a></li>
                  <li><a class="text-sm text-gray-600 transition-colors hover:text-blue-600" href="/website/ourproperty">Our Properties</a></li>
                  <li><a class="text-sm text-gray-600 transition-colors hover:text-blue-600" href="/website/fast-bidding">Fast Bidding</a></li>
                  <li><a class="text-sm text-gray-600 transition-colors hover:text-blue-600" href="/website/list">Post Property</a></li>
                </ul>
              </div>
              <div>
                <div class="text-sm font-semibold text-gray-900">Support</div>
                <ul class="mt-4 space-y-2">
                  <li><a class="text-sm text-gray-600 transition-colors hover:text-blue-600" href="/website/mystays">My Stays</a></li>
                  <li><a class="text-sm text-gray-600 transition-colors hover:text-blue-600" href="/website/refund-request">Refund Request</a></li>
                  <li><a class="text-sm text-gray-600 transition-colors hover:text-blue-600" href="/website/cancellation">Cancellation</a></li>
                </ul>
              </div>
              <div>
                <div class="text-sm font-semibold text-gray-900">Legal</div>
                <ul class="mt-4 space-y-2">
                  <li><a class="text-sm text-gray-600 transition-colors hover:text-blue-600" href="/website/terms">Terms & Conditions</a></li>
                  <li><a class="text-sm text-gray-600 transition-colors hover:text-blue-600" href="/website/privacy">Privacy Policy</a></li>
                  <li><a class="text-sm text-gray-600 transition-colors hover:text-blue-600" href="/website/refund">Refund Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-10 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div class="text-xs text-gray-500">&copy; ${year} Roomhy. All rights reserved.</div>
          <div class="flex flex-wrap items-center gap-4 text-xs">
            <a class="text-gray-500 transition-colors hover:text-blue-600" href="/website/terms">Terms</a>
            <a class="text-gray-500 transition-colors hover:text-blue-600" href="/website/privacy">Privacy</a>
            <a class="text-gray-500 transition-colors hover:text-blue-600" href="/website/refund">Refund</a>
          </div>
        </div>
      </div>
    </footer>
  `;
};

const setupWebsiteSharedFooter = () => {
  if (!isWebsiteRoute()) return () => {};

  const page = document.querySelector(".html-page");
  if (!page) return () => {};

  const { element: styleEl, owned } = ensureElement("website-shared-footer-style", () => {
    const style = document.createElement("style");
    style.textContent = `
      .html-page footer:not([data-shared-website-footer="1"]) {
        display: none !important;
      }
    `;
    return style;
  });

  const ensureFooter = () => {
    const nextPage = document.querySelector(".html-page");
    if (!nextPage || !document.body.contains(nextPage)) return;

    nextPage.classList.add("min-h-screen", "flex", "flex-col");

    if (!nextPage.querySelector('[data-shared-website-footer="1"]')) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = getWebsiteFooterMarkup().trim();
      const footer = wrapper.firstElementChild;
      if (footer) {
        nextPage.appendChild(footer);
        try {
          rescanTailwind();
        } catch (err) {
          console.debug("Website footer rescan error:", err);
        }
      }
    }
  };

  ensureFooter();

  const observer = new MutationObserver(() => {
    ensureFooter();
  });
  observer.observe(page, { childList: true });

  return () => {
    observer.disconnect();
    page.querySelector('[data-shared-website-footer="1"]')?.remove();
    if (owned) styleEl.remove();
  };
};

const applyEmployeeHeader = () => {
  const path = window.location?.pathname || "";
  if (!path.startsWith("/employee/")) return;

  const user = getEmployeeSessionUser();
  if (!user) return;
  const info = getEmployeeDisplayInfo(user);

  const headerName = document.getElementById("headerName");
  if (headerName) headerName.textContent = info.name;
  const welcomeName = document.getElementById("welcomeName");
  if (welcomeName) welcomeName.textContent = info.name;
  const headerRole = document.getElementById("headerRole");
  if (headerRole) headerRole.textContent = info.role;

  const avatarEl = document.querySelector(".html-page header .rounded-full");
  if (avatarEl && avatarEl.textContent) {
    avatarEl.textContent = info.initials;
  }
};

const buildEmployeeSidebarConfig = () => ({
  overview: [{ key: "dashboard", label: "Dashboard", href: "/employee/areaadmin", icon: "layout-dashboard" }],
  management: [
    { key: "teams", label: "Teams", href: "/employee/manager", icon: "map-pin" },
    { key: "owners", label: "Property Owners", href: "/employee/owner", icon: "briefcase" },
    { key: "properties", label: "Properties", href: "/employee/properties", icon: "home" },
    { key: "tenants", label: "Tenants", href: "/employee/tenant", icon: "users" },
    { key: "new_signups", label: "New Signups", href: "/employee/new_signups", icon: "file-badge" },
    { key: "visits", label: "Visit Reports", href: "/employee/visit", icon: "clipboard-list" }
  ],
  operations: [
    { key: "web_enquiry", label: "Web Enquiry", href: "/employee/websiteenq", icon: "folder-open" },
    { key: "enquiries", label: "Enquiries", href: "/employee/enquiry", icon: "help-circle" },
    { key: "bookings", label: "Bookings", href: "/employee/booking", icon: "calendar-check" },
    { key: "reviews", label: "Reviews", href: "/employee/reviews", icon: "star" },
    { key: "complaint_history", label: "Complaint History", href: "/employee/complaint-history", icon: "alert-circle" }
  ],
  website: [{ key: "live_properties", label: "Live Properties", href: "/employee/website", icon: "globe" }],
  finance: [
    { key: "rent_collections", label: "Rent Collections", href: "/employee/rentcollection", icon: "wallet" },
    { key: "commissions", label: "Commissions", href: "/employee/platform", icon: "indian-rupee" },
    { key: "refunds", label: "Refunds", href: "/employee/refund", icon: "rotate-ccw" }
  ],
  system: [
    { key: "locations", label: "Locations", href: "/employee/location", icon: "globe" }
  ],
  account: [
    { key: "profile", label: "Profile", href: "/employee/profile", icon: "user" },
    { key: "settings", label: "Settings", href: "/employee/settings", icon: "settings" }
  ]
});

const applyEmployeeSidebarPermissions = (opts = {}) => {
  const path = window.location?.pathname || "";
  if (!path.startsWith("/employee/")) return;

  const user = getEmployeeSessionUser();
  if (!user) return;
  const role = String(user.role || "").toLowerCase();
  if (role === "areamanager") return;

  const allowed = new Set(["dashboard", "visits"]);
  const perms = getEmployeePermissionList(user);
  perms.forEach((p) => allowed.add(String(p)));

  const config = buildEmployeeSidebarConfig();
  const activePath = window.location?.pathname || "";
  const buildSection = (label, items) => {
    const visible = items.filter((item) => role === "areamanager" || allowed.has(item.key));
    if (!visible.length) return "";
    const links = visible
      .map((item) => {
        const active = activePath === item.href;
        return `<a href="${item.href}" class="sidebar-link${active ? " active" : ""}"><i data-lucide="${item.icon}" class="w-5 h-5 mr-3"></i> ${item.label}</a>`;
      })
      .join("");
    return `<div class="mt-4">
      <div class="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">${label}</div>
      ${links}
    </div>`;
  };

  const navHtml = `
    ${buildSection("Overview", config.overview)}
    ${buildSection("Management", config.management)}
    ${buildSection("Operations", config.operations)}
    ${buildSection("Website", config.website)}
    ${buildSection("Finance", config.finance)}
    ${buildSection("System", config.system)}
    ${buildSection("Account", config.account)}
  `;

  const navNodes = Array.from(document.querySelectorAll(".sidebar nav, #dynamicSidebarNav"))
    .filter((node) => node && node.closest(".sidebar"));
  const deduped = [];
  const seen = new Set();
  navNodes.forEach((node) => {
    const aside = node.closest(".sidebar");
    if (!aside) return;
    if (seen.has(aside)) return;
    seen.add(aside);
    deduped.push(node);
  });
  if (deduped.length) {
    deduped.forEach((node) => {
      node.innerHTML = navHtml;
      node.setAttribute("data-employee-sidebar", "1");
      node.setAttribute("data-employee-sidebar-built", "1");
    });
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }

  const sidebar = document.querySelector(".sidebar");
  if (sidebar && sidebar.getAttribute("data-employee-brand") !== "1") {
    const label = role === "areamanager" ? "AREA ADMIN" : "EMPLOYEE";
    const spans = Array.from(sidebar.querySelectorAll("span"));
    const badge = spans.find((s) => /super admin|team member/i.test(s.textContent || ""));
    if (badge) {
      badge.textContent = label;
    }
    sidebar.setAttribute("data-employee-brand", "1");
  }

  applyEmployeeHeader();
};

export const useHtmlPage = ({
  title,
  bodyClass,
  htmlAttrs = {},
  metas = [],
  bases = [],
  links = [],
  headScripts = [],
  styles = [],
  scripts = [],
  inlineScripts = [],
  scriptSequence = null,
  disableMobileSidebar = false
}) => {
  const useClientLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
    const configKey = (() => {
      try {
        return String(
          hashString(
          JSON.stringify({
            title,
            bodyClass,
            htmlAttrs,
            metas,
            bases,
            links,
            headScripts,
            styles,
            scripts,
            inlineScripts,
            scriptSequence,
            disableMobileSidebar
          })
        )
      );
    } catch (err) {
      return `${title || "page"}:${Date.now()}`;
    }
  })();

  useClientLayoutEffect(() => {
    // Initialize Tailwind helper if not already done
    if (!window._tailwindHelperInitialized) {
      initTailwindHelper();
      window._tailwindHelperInitialized = true;
    }

    // Reset fade-in effect for new page (remove css-ready class initially)
    // Note: Global CSS in the app index already hides .html-page by default with opacity: 0
    const htmlPageEl = document.querySelector(".html-page");
    if (htmlPageEl) {
      // Ensure css-ready is removed to reset opacity to 0
      htmlPageEl.classList.remove("css-ready");
      // Force a synchronous repaint to ensure page is hidden
      void htmlPageEl.offsetHeight;
      // Also force opacity to 0 explicitly as emergency backup
      htmlPageEl.style.opacity = "0";
      // Set pointer-events none to prevent interaction while hidden
      htmlPageEl.style.pointerEvents = "none";
    }

    const ownedElements = [];
    let cleanupWebsiteFooter = null;
    const previousTitle = document.title;
    const previousBodyClass = document.body.className;
    const previousHtmlAttrs = {};

    if (title) {
      document.title = title;
    }

    if (typeof bodyClass === "string") {
      document.body.className = bodyClass;
    }

    if (htmlAttrs && typeof htmlAttrs === "object") {
      Object.entries(htmlAttrs).forEach(([key, value]) => {
        previousHtmlAttrs[key] = document.documentElement.getAttribute(key);
        if (value === false || value == null) {
          document.documentElement.removeAttribute(key);
          return;
        }
        if (value === true) {
          document.documentElement.setAttribute(key, "");
          return;
        }
        document.documentElement.setAttribute(key, String(value));
      });
    }

    bases.forEach((baseTag) => {
      const key = attrsKey("base", baseTag || {});
      const { element, owned } = ensureElement(key, () => {
        const el = document.createElement("base");
        applyAttributes(el, baseTag);
        return el;
      });
      if (owned) ownedElements.push(element);
    });

    metas.forEach((metaTag) => {
      const key = attrsKey("meta", metaTag || {});
      const { element, owned } = ensureElement(key, () => {
        const el = document.createElement("meta");
        applyAttributes(el, metaTag);
        return el;
      });
      if (owned) ownedElements.push(element);
    });

    headScripts.forEach((scriptTag, index) => {
      const attrs = scriptTag?.attrs || {};
      const content = scriptTag?.content || "";
      const key = `head-script:${index}:${attrsKey("script", attrs)}:${hashString(content)}`;
      const { element, owned } = ensureElement(key, () => {
        const el = document.createElement("script");
        applyAttributes(el, attrs);
        if (content) {
          el.textContent = content;
        }
        return el;
      });
      if (owned) ownedElements.push(element);
    });

    const forcedLinks = [];
    const pathName = window.location?.pathname || "";
    const isSuperadminRoute = pathName.startsWith("/superadmin");
    const isEmployeeRoute = pathName.startsWith("/employee");
    const isWebsiteHtmlRoute = isWebsiteRoute();
    const isEmbed = (() => {
      try {
        return new URLSearchParams(window.location.search || "").get("embed") === "1";
      } catch (e) {
        return false;
      }
    })();
    if (isSuperadminRoute || isEmployeeRoute) {
      forcedLinks.push({ rel: "stylesheet", href: "/superadmin/assets/css/index.css" });
    }

    const forcedStyles = [];
    if (isSuperadminRoute || isEmployeeRoute) {
      forcedStyles.push(`
        @media (max-width: 768px) {
          html, body {
            max-width: 100%;
            overflow-x: hidden;
          }
          .html-page {
            max-width: 100%;
            overflow-x: hidden;
          }
          .html-page .sidebar.hidden.md\\:flex,
          .html-page .sidebar:not(#mobile-sidebar) { display: none !important; }
          .html-page #mobile-menu-open { display: inline-flex !important; }
          .html-page .flex.h-screen { height: auto; min-height: 100vh; }
          .html-page .h-screen { height: auto !important; min-height: 100vh; }
          .html-page .min-h-screen { min-height: 100vh; }
          .html-page .max-w-7xl,
          .html-page .max-w-6xl,
          .html-page .max-w-5xl,
          .html-page .max-w-4xl,
          .html-page .max-w-3xl { max-width: 100% !important; }
          .html-page header { padding-left: 1rem; padding-right: 1rem; }
          .html-page main { padding: 1rem !important; }
          .html-page [class*="grid-cols-2"],
          .html-page [class*="grid-cols-3"],
          .html-page [class*="grid-cols-4"],
          .html-page [class*="grid-cols-5"],
          .html-page [class*="grid-cols-6"] {
            grid-template-columns: minmax(0, 1fr) !important;
          }
          .html-page .flex-row { flex-direction: column; }
          .html-page .items-center.justify-between { gap: 0.75rem; }
          .html-page .gap-6,
          .html-page .gap-5,
          .html-page .gap-4 { gap: 0.75rem !important; }
          .html-page .p-8,
          .html-page .px-8,
          .html-page .py-8 { padding: 1rem !important; }
          .html-page .p-6,
          .html-page .px-6,
          .html-page .py-6 { padding: 0.875rem !important; }
          .html-page .w-72 { width: 18rem; max-width: calc(100vw - 2rem); }
          .html-page [class*="overflow-x-auto"] {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          .html-page table { display: block; width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .html-page thead, .html-page tbody, .html-page tr { display: table; width: 100%; table-layout: auto; }
          .html-page input,
          .html-page select,
          .html-page textarea,
          .html-page button {
            max-width: 100%;
          }
          .html-page .fixed.inset-0 > div,
          .html-page .fixed.inset-0 > aside,
          .html-page .fixed.inset-0 .max-w-2xl,
          .html-page .fixed.inset-0 .max-w-3xl,
          .html-page .fixed.inset-0 .max-w-4xl {
            width: min(100%, calc(100vw - 1rem)) !important;
            max-width: calc(100vw - 1rem) !important;
          }
        }
      `);
    }
    if ((isSuperadminRoute || isEmployeeRoute) && isEmbed) {
      forcedStyles.push(`
        body,
        .html-page {
          background: #f3f4f6 !important;
        }
        .html-page .sidebar,
        .html-page header,
        .html-page #mobile-sidebar,
        .html-page #mobile-sidebar-overlay,
        .html-page #mobile-menu-open,
        .html-page #mobile-sidebar-close {
          display: none !important;
        }
        .html-page .flex.h-screen {
          min-height: auto;
          height: auto;
        }
        .html-page .flex-1 {
          width: 100%;
        }
        .html-page main {
          padding: 1rem !important;
          background: #f3f4f6 !important;
          min-height: 100vh;
        }
      `);
    }

    const stylesheetLinks = [];

    forcedLinks.forEach((link) => {
      const key = `link:${link.href || ""}`;
      const { element, owned } = ensureElement(key, () => {
        const el = document.createElement("link");
        applyAttributes(el, link);
        return el;
      });
      if (owned) ownedElements.push(element);
      stylesheetLinks.push(element);
    });

    links.forEach((link) => {
      const key = `link:${link.href || ""}`;
      const { element, owned } = ensureElement(key, () => {
        const el = document.createElement("link");
        applyAttributes(el, link);
        return el;
      });
      if (owned) ownedElements.push(element);
      stylesheetLinks.push(element);
    });

    const combinedStyles = [...forcedStyles, ...styles];
    combinedStyles.forEach((style, index) => {
      const key = `style:${index}:${title || "page"}`;
      const { element, owned } = ensureElement(key, () => {
        const el = document.createElement("style");
        el.textContent = style;
        return el;
      });
      if (owned) ownedElements.push(element);
    });

    let cancelled = false;
    const baseScripts = scripts || [];
    const normalizedScripts = baseScripts
      .filter((script) => {
        if (!script?.src) return true;
        const isTailwindCdn = String(script.src).includes("cdn.tailwindcss.com");
        if (isTailwindCdn && window.__TAILWIND_LOCAL__ && !isSuperadminRoute && !isWebsiteHtmlRoute) {
          return false;
        }
        return true;
      })
      .map((script) => {
        if (!script?.src) return script;
        if (isSuperadminRoute && script.src.startsWith("./")) {
          return { ...script, src: `/superadmin/${script.src.slice(2)}` };
        }
        return script;
      });
    const disableAutoMobileMenuButton =
      disableMobileSidebar ||
      pathName === "/superadmin/index" ||
      pathName === "/employee/index";

    if (!disableMobileSidebar && (isSuperadminRoute || isEmployeeRoute) && !normalizedScripts.some((s) => String(s?.src || "").includes("mobile-sidebar.js"))) {
      normalizedScripts.push({ src: "/superadmin/mobile-sidebar.js" });
    }

    const normalizedScriptSequence = Array.isArray(scriptSequence)
      ? scriptSequence.map((entry) => {
          if (!entry || typeof entry !== "object") return entry;
          if (entry.type === "external" && entry.attrs?.src) {
            const nextAttrs = { ...entry.attrs };
            const isTailwindCdn = String(nextAttrs.src).includes("cdn.tailwindcss.com");
            if (isTailwindCdn && window.__TAILWIND_LOCAL__ && !isSuperadminRoute && !isWebsiteHtmlRoute) {
              return null;
            }
            if (isSuperadminRoute && nextAttrs.src.startsWith("./")) {
              nextAttrs.src = `/superadmin/${nextAttrs.src.slice(2)}`;
            }
            return { ...entry, attrs: nextAttrs };
          }
          return entry;
        }).filter(Boolean)
      : null;

    const load = async () => {
      let revealTimer = null;
      const showPageWhenReady = () => {
        if (!cancelled) {
          const htmlPageEl = document.querySelector(".html-page");
          if (htmlPageEl) {
            htmlPageEl.style.opacity = "";
            htmlPageEl.style.pointerEvents = "";
            if (!htmlPageEl.classList.contains("css-ready")) {
              htmlPageEl.classList.add("css-ready");
            }
          }
        }
      };

      // Safety reveal: avoid long blank screens on slow/blocked assets.
      revealTimer = setTimeout(showPageWhenReady, 400);

      // Legacy static scripts expect a shared API_URL global before they execute.
      if (typeof window !== "undefined" && !window.API_URL) {
        window.API_URL = getLegacyApiUrl();
      }

      await waitForStylesheets(stylesheetLinks);

      const runInlineScript = (script, index, keyPrefix = "post") => {
        const key = `inline-script:${keyPrefix}:${hashString(script)}:${index}:${title || "page"}`;
        if (wasInlineExecuted(key)) return;
        markInlineExecuted(key);
        if (cancelled) return;
        const el = document.createElement("script");
        const needsTailwindGuard = script.includes("tailwind.");
        el.textContent = needsTailwindGuard
          ? `window.tailwind = window.tailwind || {};\n${script}`
          : script;
        el.setAttribute("data-hp-key", key);
        document.head.appendChild(el);
      };

      if (normalizedScriptSequence?.length) {
        for (let index = 0; index < normalizedScriptSequence.length; index += 1) {
          const entry = normalizedScriptSequence[index];
          if (!entry) continue;

          if (entry.type === "external" && entry.attrs?.src) {
            try {
              if (String(entry.attrs.src).includes("cdn.tailwindcss.com")) {
                suppressTailwindCdnWarnings();
              }
              // eslint-disable-next-line no-await-in-loop
              await loadScriptSequentially(entry.attrs);
            } catch (err) {
              console.error("Failed to load script", entry.attrs?.src, err);
            }
            continue;
          }

          if (entry.type === "inline" && entry.content) {
            runInlineScript(entry.content, index, "sequence");
          }
        }
      } else {
        const tailwindInline = inlineScripts.filter((script) => script.includes("tailwind.config"));
        const otherInline = inlineScripts.filter((script) => !script.includes("tailwind.config"));

        for (const script of normalizedScripts) {
          try {
            if (String(script?.src || "").includes("cdn.tailwindcss.com")) {
              suppressTailwindCdnWarnings();
            }
            // Sequential load to ensure dependent globals (e.g., tailwind) exist.
            // Keep scripts in head; don't remove on cleanup to avoid re-exec.
            // eslint-disable-next-line no-await-in-loop
            await loadScriptSequentially(script);
          } catch (err) {
            console.error("Failed to load script", script?.src, err);
          }
        }

        otherInline.forEach((script, index) => {
          runInlineScript(script, index, "post");
        });

        // Tailwind config must run after tailwind CDN is available.
        tailwindInline.forEach((script, index) => {
          runInlineScript(script, index, "tailwind");
        });
      }

      const hasTailwindScript = (normalizedScriptSequence?.length
        ? normalizedScriptSequence
            .filter((entry) => entry?.type === "external")
            .map((entry) => entry.attrs)
        : normalizedScripts
      ).some((script) =>
        String(script?.src || "").includes("cdn.tailwindcss.com")
      );
      await waitForTailwindStyles(hasTailwindScript);

      if ((isSuperadminRoute || isEmployeeRoute) && !disableAutoMobileMenuButton) {
        const ensureMobileMenuButton = () => {
          const existingPageTrigger =
            document.getElementById("mobile-menu-open") ||
            document.getElementById("sa-mobile-toggle") ||
            document.querySelector("[data-mobile-menu-trigger='1']") ||
            document.querySelector("header button.md\\:hidden") ||
            document.querySelector("header button[class*='md:hidden']");
          let btn = document.getElementById("mobile-menu-open") || document.getElementById("sa-mobile-toggle");
          if (!btn && !existingPageTrigger) {
            btn = document.createElement("button");
            btn.id = "mobile-menu-open";
            btn.dataset.hpFallback = "1";
            btn.className = "md:hidden";
            btn.setAttribute("aria-label", "Open menu");
            btn.innerHTML = '<span style="font-size:24px;line-height:1;">&#9776;</span>';
            // Absolute fallback position so it is always visible on mobile
            btn.style.position = "fixed";
            btn.style.top = "12px";
            btn.style.left = "12px";
            btn.style.zIndex = "9999";
            btn.style.padding = "6px 10px";
            btn.style.borderRadius = "8px";
            btn.style.border = "1px solid rgba(148,163,184,0.6)";
            btn.style.background = "#ffffff";
            btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
            document.body.appendChild(btn);
          } else if (btn && btn.dataset.hpFallback === "1" && window.innerWidth < 768) {
            btn.style.display = "inline-flex";
          }
          if (!btn) return;
          btn.style.display = window.innerWidth < 768 ? "inline-flex" : "none";
        };
        ensureMobileMenuButton();
        window.addEventListener("resize", ensureMobileMenuButton);
      }

      // Static HTML bundles often register page setup inside DOMContentLoaded.
      // When we inject them after React has already mounted, the native browser
      // DOMContentLoaded has already fired, so trigger a synthetic one now.
      if (!cancelled) {
        dispatchSyntheticDomContentLoaded();
      }

      // Trigger Tailwind CSS to rescan the DOM for new classes
      if (!cancelled) {
        if (revealTimer) {
          clearTimeout(revealTimer);
          revealTimer = null;
        }

        try {
          if (hasTailwindScript) {
            rescanTailwind();
          }
        } catch (err) {
          console.debug("Initial rescan error:", err);
        }

        setTimeout(() => {
          if (!cancelled) {
            try {
              if (hasTailwindScript) {
                rescanTailwind();
              }
            } catch (err) {
              console.debug("Rescan 120ms error:", err);
            }
          }
        }, 120);

        setTimeout(() => {
          if (!cancelled) {
            cleanupWebsiteFooter = setupWebsiteSharedFooter();
            if (!disableMobileSidebar && (isSuperadminRoute || isEmployeeRoute) && typeof window._initMobileSidebar === 'function') {
              try {
                window._initMobileSidebar();
              } catch (err) {
                console.debug("Mobile sidebar init error:", err);
              }
            }
            if (isEmployeeRoute) {
              try {
                applyEmployeeSidebarPermissions();
                if (!window._employeeSidebarObserver) {
                  const observer = new MutationObserver(() => {
                    try {
                      const nodes = Array.from(document.querySelectorAll(".sidebar nav, #dynamicSidebarNav"))
                        .filter((node) => node && node.closest(".sidebar"));
                      const needsRefresh = nodes.some((node) => node.getAttribute("data-employee-sidebar") !== "1");
                      if (needsRefresh) {
                        applyEmployeeSidebarPermissions();
                      }
                    } catch (err) {
                      console.debug("Employee sidebar observer error:", err);
                    }
                  });
                  observer.observe(document.body, { childList: true, subtree: true });
                  window._employeeSidebarObserver = observer;
                }
                if (!window._employeeSidebarClickHandler) {
                  window._employeeSidebarClickHandler = (event) => {
                    const link = event.target?.closest?.("a[href]");
                    if (!link) return;
                    const href = link.getAttribute("href") || "";
                    if (!href.startsWith("/superadmin/")) return;
                    if (!link.closest(".sidebar")) return;
                    const mapped = href.replace("/superadmin/", "/employee/");
                    event.preventDefault();
                    window.location.href = mapped === "/employee/superadmin" ? "/employee/areaadmin" : mapped;
                  };
                  document.addEventListener("click", window._employeeSidebarClickHandler);
                }
              } catch (err) {
                console.debug("Employee sidebar filter error:", err);
              }
            }
            showPageWhenReady();
          }
        }, 220);

        setTimeout(() => {
          if (!cancelled) {
            const htmlPageEl = document.querySelector(".html-page");
            if (htmlPageEl && !htmlPageEl.classList.contains("css-ready")) {
              try {
                if (hasTailwindScript) {
                  rescanTailwind();
                }
              } catch (err) {
                console.debug("Safety rescan error:", err);
              }
              showPageWhenReady();
            }
          }
        }, 600);
      }
    };

    load();

    return () => {
      if (cleanupWebsiteFooter) {
        cleanupWebsiteFooter();
      }
      ownedElements.forEach((el) => el.remove());
      cancelled = true;
      if (title) {
        document.title = previousTitle;
      }
      if (typeof bodyClass === "string") {
        document.body.className = previousBodyClass;
      }
      if (htmlAttrs && typeof htmlAttrs === "object") {
        Object.keys(htmlAttrs).forEach((key) => {
          const previousValue = previousHtmlAttrs[key];
          if (previousValue == null) {
            document.documentElement.removeAttribute(key);
          } else {
            document.documentElement.setAttribute(key, previousValue);
          }
        });
      }
    };
  }, [configKey]);
};
