import { useEffect } from "react";
import {
  getWebsiteUserId,
  getWebsiteUserName,
  isWebsiteLoggedIn,
  logoutWebsite
} from "./websiteSession";

const SHARED_FOOTER_CITY_DATA = {
  Indore: [
    { name: "PG in Vijay Nagar", area: "Vijay Nagar", type: "PG" },
    { name: "PG in Palasia", area: "Palasia", type: "PG" },
    { name: "PG in LIG Colony", area: "LIG Colony", type: "PG" },
    { name: "PG in Scheme 54", area: "Scheme 54", type: "PG" },
    { name: "PG in Bhawarkuan", area: "Bhawarkuan", type: "PG" },
    { name: "PG in South Tukoganj", area: "South Tukoganj", type: "PG" },
    { name: "Hostel near DAVV", area: "DAVV", type: "Hostel" },
    { name: "Hostel near IIM Indore", area: "IIM Indore", type: "Hostel" },
    { name: "Flat in Nipania", area: "Nipania", type: "Apartment" },
    { name: "PG in AB Road", area: "AB Road", type: "PG" },
    { name: "PG in MR 10", area: "MR 10", type: "PG" },
    { name: "Flat in Vijay Nagar", area: "Vijay Nagar", type: "Apartment" }
  ],
  Kota: [
    { name: "PG in Talwandi", area: "Talwandi", type: "PG" },
    { name: "PG in Jawahar Nagar", area: "Jawahar Nagar", type: "PG" },
    { name: "PG in Vigyan Nagar", area: "Vigyan Nagar", type: "PG" },
    { name: "PG in Mahaveer Nagar", area: "Mahaveer Nagar", type: "PG" },
    { name: "Hostel near Allen", area: "Allen", type: "Hostel" },
    { name: "Hostel near Resonance", area: "Resonance", type: "Hostel" },
    { name: "Hostel near Bansal Classes", area: "Bansal", type: "Hostel" },
    { name: "PG in Dadabari", area: "Dadabari", type: "PG" },
    { name: "Flat in Talwandi", area: "Talwandi", type: "Apartment" },
    { name: "PG in Rangbari", area: "Rangbari", type: "PG" }
  ],
  Sikar: [
    { name: "PG in Subhash Nagar", area: "Subhash Nagar", type: "PG" },
    { name: "PG in Nehru Nagar", area: "Nehru Nagar", type: "PG" },
    { name: "PG near Shekhawati University", area: "Shekhawati Uni", type: "PG" },
    { name: "Hostel near CBSE Schools", area: "CBSE Zone", type: "Hostel" },
    { name: "Flat in Sikar City", area: "Sikar City", type: "Apartment" },
    { name: "PG near Bus Stand", area: "Bus Stand", type: "PG" }
  ],
  Bengaluru: [
    { name: "PG in BTM Layout", area: "BTM Layout", type: "PG" },
    { name: "PG in Koramangala", area: "Koramangala", type: "PG" },
    { name: "PG in HSR Layout", area: "HSR Layout", type: "PG" },
    { name: "PG in Marathahalli", area: "Marathahalli", type: "PG" },
    { name: "PG in Manyata Tech Park", area: "Manyata", type: "PG" },
    { name: "Hostel near RVCE", area: "RVCE", type: "Hostel" },
    { name: "PG in Bellandur", area: "Bellandur", type: "PG" },
    { name: "Flat in Koramangala", area: "Koramangala", type: "Apartment" }
  ],
  Mumbai: [
    { name: "PG in Andheri", area: "Andheri", type: "PG" },
    { name: "PG in Bandra", area: "Bandra", type: "PG" },
    { name: "PG in Powai", area: "Powai", type: "PG" },
    { name: "PG in Thane", area: "Thane", type: "PG" },
    { name: "Flat in Andheri", area: "Andheri", type: "Apartment" },
    { name: "PG in Navi Mumbai", area: "Navi Mumbai", type: "PG" }
  ],
  Delhi: [
    { name: "PG in Mukherjee Nagar", area: "Mukherjee Nagar", type: "PG" },
    { name: "PG near DU North Campus", area: "DU North", type: "PG" },
    { name: "PG in Dwarka", area: "Dwarka", type: "PG" },
    { name: "Hostel near JNU", area: "JNU", type: "Hostel" },
    { name: "PG in Lajpat Nagar", area: "Lajpat Nagar", type: "PG" },
    { name: "PG in Rohini", area: "Rohini", type: "PG" }
  ],
  Pune: [
    { name: "PG in Kothrud", area: "Kothrud", type: "PG" },
    { name: "PG in Hinjewadi", area: "Hinjewadi", type: "PG" },
    { name: "PG in Baner", area: "Baner", type: "PG" },
    { name: "Hostel near COEP", area: "COEP", type: "Hostel" },
    { name: "Flat in Hinjewadi", area: "Hinjewadi", type: "Apartment" },
    { name: "PG in Viman Nagar", area: "Viman Nagar", type: "PG" }
  ],
  Hyderabad: [
    { name: "PG in Gachibowli", area: "Gachibowli", type: "PG" },
    { name: "PG in Hitech City", area: "Hitech City", type: "PG" },
    { name: "PG in Kondapur", area: "Kondapur", type: "PG" },
    { name: "Hostel near IIIT Hyd", area: "IIIT Hyderabad", type: "Hostel" },
    { name: "Flat in Gachibowli", area: "Gachibowli", type: "Apartment" },
    { name: "PG in Ameerpet", area: "Ameerpet", type: "PG" }
  ]
};

const buildSharedFooterHtml = () => {
  const citySection = Object.entries(SHARED_FOOTER_CITY_DATA)
    .map(
      ([city, listings]) => `
        <li style="list-style:none;">
          <button data-footer-city="${city}" style="background:none;border:none;padding:4px 0;cursor:pointer;display:flex;align-items:center;justify-content:space-between;width:100%;color:#555555;font-size:13px;font-weight:400;transition:color 0.15s;">
            <span style="display:flex;align-items:center;gap:6px;">
              <span data-footer-dot="${city}" style="width:5px;height:5px;border-radius:50%;background:transparent;border:1px solid #2a2a2a;flex-shrink:0;"></span>
              ${city}
            </span>
            <svg data-footer-chevron="${city}" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transition:transform 0.2s ease;flex-shrink:0;">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <ul data-footer-list="${city}" style="display:none;list-style:none;margin:4px 0 8px 11px;padding:0 0 0 10px;border-left:1px solid #1e1e1e;flex-direction:column;gap:8px;">
            ${listings
              .map(
                (listing) => `
                  <li style="list-style:none;">
                    <a href="/website/ourproperty?city=${encodeURIComponent(city)}&area=${encodeURIComponent(listing.area)}&type=${encodeURIComponent(listing.type)}" style="color:#3a3a3a;font-size:12px;text-decoration:none;transition:color 0.15s;display:block;line-height:1.4;">
                      ${listing.name}
                    </a>
                  </li>
                `
              )
              .join("")}
            <li style="list-style:none;">
              <a href="/website/ourproperty?city=${encodeURIComponent(city)}" style="color:#2a2a2a;font-size:11px;text-decoration:none;transition:color 0.15s;display:flex;align-items:center;gap:3px;margin-top:2px;">
                View all →
              </a>
            </li>
          </ul>
        </li>
      `
    )
    .join("");

  const navCol = (heading, links) => `
    <div>
      <h4 style="color:#ffffff;font-size:13px;font-weight:600;margin:0 0 20px;letter-spacing:0.01em;">${heading}</h4>
      <ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px;">
        ${links
          .map(
            ({ label, href }) => `
              <li style="list-style:none;">
                <a href="${href}" style="color:#555555;font-size:13px;text-decoration:none;transition:color 0.15s;">${label}</a>
              </li>
            `
          )
          .join("")}
      </ul>
    </div>
  `;

  return `
    <div data-roomhy-footer-root style="background-color:#0a0a0a;color:#d1d5db;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;border-top:1px solid #141414;margin-top:4rem;">
      <div data-roomhy-footer-grid style="display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr 1fr 1fr;gap:40px;padding:64px 48px 52px;border-bottom:1px solid #141414;">
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:34px;height:34px;border-radius:7px;background-color:#ffffff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.3px;">Roomhy</span>
          </div>
          <p style="color:#444444;font-size:13px;line-height:1.75;margin:0;max-width:220px;white-space:pre-line;">© copyright Roomhy 2025.
All rights reserved.</p>
        </div>
        <div>
          <h4 style="color:#ffffff;font-size:13px;font-weight:600;margin:0 0 20px;letter-spacing:0.01em;">Cities</h4>
          <ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;">${citySection}</ul>
        </div>
        ${navCol("Pages", [
          { label: "Find a PG", href: "/website/ourproperty?type=pg" },
          { label: "Hostels", href: "/website/ourproperty?type=hostel" },
          { label: "Apartments", href: "/website/ourproperty?type=apartment" },
          { label: "Fast Bidding", href: "/website/fast-bidding" },
          { label: "List Property", href: "/website/list" },
          { label: "About Us", href: "/website/about" }
        ])}
        ${navCol("Socials", [
          { label: "Facebook", href: "#" },
          { label: "Instagram", href: "#" },
          { label: "Twitter", href: "#" },
          { label: "LinkedIn", href: "#" },
          { label: "YouTube", href: "#" }
        ])}
        ${navCol("Legal", [
          { label: "Privacy Policy", href: "/website/privacy" },
          { label: "Terms of Service", href: "/website/terms" },
          { label: "Cookie Policy", href: "/website/cookies" },
          { label: "Sitemap", href: "/sitemap.xml" }
        ])}
        ${navCol("Register", [
          { label: "Sign Up", href: "/website/signup" },
          { label: "Login", href: "/website/signup" },
          { label: "List Property", href: "/website/signuprole" },
          { label: "Contact Us", href: "/website/contact" },
          { label: "FAQ", href: "#faq" }
        ])}
      </div>
      <div style="overflow:hidden;user-select:none;pointer-events:none;line-height:0.85;padding:0 24px;text-align:center;">
        <p style="font-size:clamp(72px, 17vw, 210px);font-weight:800;color:#141414;margin:0;letter-spacing:-0.04em;font-family:'Inter',sans-serif;white-space:nowrap;">Roomhy</p>
      </div>
    </div>
  `;
};

const ensureSharedFooter = () => {
  const existingShared = document.querySelector("[data-roomhy-shared-footer='1']");
  if (existingShared) return;

  let footer = document.querySelector("footer");
  if (!footer) {
    footer = document.createElement("footer");
    const mountTarget =
      document.querySelector(".html-page") ||
      document.querySelector("main")?.parentElement ||
      document.body;
    mountTarget?.appendChild(footer);
  }

  footer.setAttribute("data-roomhy-shared-footer", "1");
  footer.className = "";
  footer.style.margin = "0";
  footer.style.padding = "0";
  footer.style.background = "transparent";
  footer.innerHTML = buildSharedFooterHtml();

  const root = footer.querySelector("[data-roomhy-footer-root]");
  const grid = footer.querySelector("[data-roomhy-footer-grid]");
  const applyLayout = () => {
    if (!root || !grid) return;
    if (window.innerWidth < 960) {
      grid.style.gridTemplateColumns = "1fr";
      grid.style.gap = "28px";
      grid.style.padding = "36px 20px 28px";
      root.querySelectorAll("p").forEach((node) => {
        if (node.textContent?.includes("copyright Roomhy")) {
          node.style.maxWidth = "100%";
        }
      });
    } else {
      grid.style.gridTemplateColumns = "1.4fr 1fr 1fr 1fr 1fr 1fr";
      grid.style.gap = "40px";
      grid.style.padding = "64px 48px 52px";
    }
  };

  footer.querySelectorAll("[data-footer-city]").forEach((button) => {
    button.addEventListener("click", () => {
      const city = button.getAttribute("data-footer-city");
      footer.querySelectorAll("[data-footer-list]").forEach((list) => {
        const open = list.getAttribute("data-footer-list") === city && list.style.display !== "flex";
        list.style.display = open ? "flex" : "none";
        const listCity = list.getAttribute("data-footer-list");
        const dot = footer.querySelector(`[data-footer-dot="${listCity}"]`);
        const chevron = footer.querySelector(`[data-footer-chevron="${listCity}"]`);
        const btn = footer.querySelector(`[data-footer-city="${listCity}"]`);
        if (open) {
          if (dot) {
            dot.style.backgroundColor = "#4ade80";
            dot.style.border = "none";
          }
          if (chevron) chevron.style.transform = "rotate(180deg)";
          if (btn) {
            btn.style.color = "#ffffff";
            btn.style.fontWeight = "600";
          }
        } else {
          if (dot) {
            dot.style.backgroundColor = "transparent";
            dot.style.border = "1px solid #2a2a2a";
          }
          if (chevron) chevron.style.transform = "rotate(0deg)";
          if (btn) {
            btn.style.color = "#555555";
            btn.style.fontWeight = "400";
          }
        }
      });
    });
  });

  applyLayout();
  window.addEventListener("resize", applyLayout);
};

export const useLucideIcons = (deps = []) => {
  useEffect(() => {
    if (window.lucide?.createIcons) {
      window.lucide.createIcons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

const updateWelcomeMessage = () => {
  const welcomeName = document.getElementById("welcomeUserName");
  const userIdDisplay = document.getElementById("userIdDisplay");
  if (isWebsiteLoggedIn()) {
    if (welcomeName) welcomeName.textContent = `Hi, ${getWebsiteUserName()}`;
    if (userIdDisplay) userIdDisplay.textContent = `ID: ${getWebsiteUserId()}`;
  } else {
    if (welcomeName) welcomeName.textContent = "Hi, welcome";
    if (userIdDisplay) userIdDisplay.textContent = "";
  }
};

const updateMobileMenuState = () => {
  const menuLoggedIn = document.getElementById("menu-logged-in");
  const menuLoggedOut = document.getElementById("menu-logged-out");
  const loggedIn = isWebsiteLoggedIn();
  if (menuLoggedIn) {
    if (loggedIn) menuLoggedIn.classList.remove("hidden");
    else menuLoggedIn.classList.add("hidden");
  }
  if (menuLoggedOut) {
    if (loggedIn) menuLoggedOut.classList.add("hidden");
    else menuLoggedOut.classList.remove("hidden");
  }
};

export const useWebsiteCommon = () => {
  useLucideIcons([]);

  useEffect(() => {
    window.globalLogout = () => logoutWebsite("login");

    updateMobileMenuState();
    updateWelcomeMessage();
    try {
      ensureSharedFooter();
    } catch (error) {
      console.error("Shared footer injection failed:", error);
    }

    const handleStorage = () => {
      updateMobileMenuState();
      updateWelcomeMessage();
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      if (window.globalLogout) {
        delete window.globalLogout;
      }
    };
  }, []);
};

export const useWebsiteMenu = () => {
  useEffect(() => {
    const menuToggle = document.getElementById("menu-toggle");
    const menuClose = document.getElementById("menu-close");
    const menuCloseLogout = document.getElementById("menu-close-logout");
    const mobileMenu = document.getElementById("mobile-menu");
    const menuOverlay = document.getElementById("menu-overlay");
    const menuDrawer = document.getElementById("mobile-menu-drawer");
    const menuOverlayAlt = document.getElementById("mobile-menu-overlay");

    const openMenu = () => {
      updateMobileMenuState();
      updateWelcomeMessage();
      if (mobileMenu) mobileMenu.classList.remove("translate-x-full");
      if (menuDrawer) menuDrawer.classList.remove("translate-x-full");
      if (menuOverlay) menuOverlay.classList.remove("hidden");
      if (menuOverlayAlt) {
        menuOverlayAlt.classList.remove("hidden");
        menuOverlayAlt.classList.add("opacity-100");
        document.body.style.overflow = "hidden";
      }
    };

    const closeMenu = () => {
      if (mobileMenu) mobileMenu.classList.add("translate-x-full");
      if (menuDrawer) menuDrawer.classList.add("translate-x-full");
      if (menuOverlay) menuOverlay.classList.add("hidden");
      if (menuOverlayAlt) {
        menuOverlayAlt.classList.remove("opacity-100");
        setTimeout(() => menuOverlayAlt.classList.add("hidden"), 300);
        document.body.style.overflow = "";
      }
    };

    menuToggle?.addEventListener("click", openMenu);
    menuClose?.addEventListener("click", closeMenu);
    menuCloseLogout?.addEventListener("click", closeMenu);
    menuOverlay?.addEventListener("click", closeMenu);
    menuOverlayAlt?.addEventListener("click", closeMenu);

    mobileMenu?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
    menuDrawer?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    return () => {
      menuToggle?.removeEventListener("click", openMenu);
      menuClose?.removeEventListener("click", closeMenu);
      menuCloseLogout?.removeEventListener("click", closeMenu);
      menuOverlay?.removeEventListener("click", closeMenu);
      menuOverlayAlt?.removeEventListener("click", closeMenu);
      mobileMenu?.querySelectorAll("a").forEach((link) => {
        link.removeEventListener("click", closeMenu);
      });
      menuDrawer?.querySelectorAll("a").forEach((link) => {
        link.removeEventListener("click", closeMenu);
      });
    };
  }, []);
};

export const useHeroSlideshow = (intervalMs = 5000) => {
  useEffect(() => {
    const heroWrapper = document.getElementById("hero-image-wrapper");
    if (!heroWrapper) return undefined;
    const heroImages = heroWrapper.querySelectorAll("img");
    if (heroImages.length <= 1) return undefined;
    let currentHeroIndex = 0;
    const timer = setInterval(() => {
      const nextHeroIndex = (currentHeroIndex + 1) % heroImages.length;
      heroImages[currentHeroIndex].classList.remove("opacity-100");
      heroImages[currentHeroIndex].classList.add("opacity-0");
      heroImages[nextHeroIndex].classList.remove("opacity-0");
      heroImages[nextHeroIndex].classList.add("opacity-100");
      currentHeroIndex = nextHeroIndex;
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
};

export const useFaqAccordion = () => {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll(".faq-item"));
    if (!items.length) return undefined;
    const handlers = items.map((item) => {
      const question = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");
      const chevron = item.querySelector(".chevron");
      if (!question || !answer || !chevron) return null;
      const handler = () => {
        document.querySelectorAll(".faq-answer.active").forEach((activeAnswer) => {
          if (activeAnswer !== answer) {
            activeAnswer.classList.remove("active");
            const activeChevron = activeAnswer.previousElementSibling?.querySelector(".chevron");
            activeChevron?.classList.remove("rotated");
          }
        });
        answer.classList.toggle("active");
        chevron.classList.toggle("rotated");
      };
      question.addEventListener("click", handler);
      return { question, handler };
    });
    return () => {
      handlers.forEach((entry) => {
        if (entry?.question && entry?.handler) {
          entry.question.removeEventListener("click", entry.handler);
        }
      });
    };
  }, []);
};
