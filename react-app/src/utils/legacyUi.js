import { useEffect } from "react";

export const useLegacySidebar = () => {
  useEffect(() => {
    window.toggleSubmenu = (id, element) => {
      const submenu = document.getElementById(id);
      if (!submenu) return;
      const chevron = element ? element.querySelector(".lucide-chevron-down") : null;
      if (submenu.classList.contains("open")) {
        submenu.classList.remove("open");
        if (chevron) chevron.style.transform = "rotate(0deg)";
      } else {
        submenu.classList.add("open");
        if (chevron) chevron.style.transform = "rotate(180deg)";
      }
    };

    window.toggleMobileMenu = () => {
      const sidebar = document.getElementById("mobile-sidebar");
      const overlay =
        document.getElementById("mobile-sidebar-overlay") ||
        document.getElementById("mobile-overlay");
      if (!sidebar || !overlay) return;
      const isClosed = sidebar.classList.contains("-translate-x-full");
      if (isClosed) {
        sidebar.classList.remove("-translate-x-full");
        overlay.classList.remove("hidden");
      } else {
        sidebar.classList.add("-translate-x-full");
        overlay.classList.add("hidden");
      }
    };

    window.toggleModal = (modalID) => {
      const modal = document.getElementById(modalID);
      if (!modal) return;
      if (modal.classList.contains("hidden")) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
      } else {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
      }
    };

    const openBtn = document.getElementById("mobile-menu-open");
    const closeBtn = document.getElementById("mobile-sidebar-close");
    const overlay =
      document.getElementById("mobile-sidebar-overlay") ||
      document.getElementById("mobile-overlay");

    const openHandler = () => window.toggleMobileMenu && window.toggleMobileMenu();
    if (openBtn) openBtn.addEventListener("click", openHandler);
    if (closeBtn) closeBtn.addEventListener("click", openHandler);
    if (overlay) overlay.addEventListener("click", openHandler);

    return () => {
      if (openBtn) openBtn.removeEventListener("click", openHandler);
      if (closeBtn) closeBtn.removeEventListener("click", openHandler);
      if (overlay) overlay.removeEventListener("click", openHandler);
      delete window.toggleSubmenu;
      delete window.toggleMobileMenu;
      delete window.toggleModal;
    };
  }, []);
};
