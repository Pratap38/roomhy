import { useEffect } from "react";
import {
  getWebsiteUserId,
  getWebsiteUserName,
  isWebsiteLoggedIn,
  logoutWebsite
} from "./websiteSession";

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
