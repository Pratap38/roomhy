(function () {
  var STANDARD_LINKS = [
    { heading: "Overview", links: [{ href: "/superadmin/superadmin", label: "Dashboard", icon: "layout-dashboard" }] },
    {
      heading: "Management",
      links: [
        { href: "/superadmin/manager", label: "Teams", icon: "map-pin" },
        { href: "/superadmin/owner", label: "Property Owners", icon: "briefcase" },
        { href: "/superadmin/properties", label: "Properties", icon: "home" },
        { href: "/superadmin/tenant", label: "Tenants", icon: "users" },
        { href: "/superadmin/new_signups", label: "New Signups", icon: "file-badge" }
      ]
    },
    {
      heading: "Operations",
      links: [
        { href: "/superadmin/websiteenq", label: "Web Enquiry", icon: "folder-open" },
        { href: "/superadmin/enquiry", label: "Enquiries", icon: "help-circle" },
        { href: "/superadmin/booking", label: "Bookings", icon: "calendar-check" },
        { href: "/superadmin/reviews", label: "Reviews", icon: "star" },
        { href: "/superadmin/complaint-history", label: "Complaint History", icon: "alert-circle" }
      ]
    },
    { heading: "Website", links: [{ href: "/superadmin/website", label: "Live Properties", icon: "globe" }] },
    {
      heading: "Finance",
      links: [
        { href: "/superadmin/rentcollection", label: "Rent Collections", icon: "wallet" },
        { href: "/superadmin/platform", label: "Commissions", icon: "indian-rupee" },
        { href: "/superadmin/refund", label: "Refunds", icon: "rotate-ccw" }
      ]
    },
    { heading: "System", links: [{ href: "/superadmin/location", label: "Locations", icon: "map-pin" }] }
  ];

  // Track if sidebar has been initialized
  var sidebarInitialized = false;
  var currentOpenBtn = null;
  var currentMobileSidebar = null;
  var currentOverlay = null;
  var currentCloseBtn = null;
  var setOpen = null;

  function normalizePath(path) {
    if (!path) return "";
    var normalized = path.toLowerCase();
    if (normalized.length > 1 && normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  }

  function currentPath() {
    return normalizePath(window.location.pathname || "");
  }

  function isAreaAdminPage() {
    return currentPath() === "/superadmin/areaadmin";
  }

  function buildStandardNavHtml() {
    var current = currentPath();
    return STANDARD_LINKS.map(function (section) {
      var links = section.links.map(function (link) {
        var active = current === normalizePath(link.href) ? " active" : "";
        return (
          '<a href="' + link.href + '" class="sidebar-link' + active + '">' +
          '<i data-lucide="' + link.icon + '" class="w-5 h-5 mr-3"></i> ' + link.label +
          "</a>"
        );
      }).join("");
      return '<div class="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6">' +
        section.heading + "</div>" + links;
    }).join("");
  }

  function applyStandardSidebarOptions() {
    if (isAreaAdminPage()) return;
    var navHtml = buildStandardNavHtml();
    var sidebars = Array.prototype.slice.call(document.querySelectorAll(".sidebar"));
    sidebars.forEach(function (sidebar) {
      var nav = sidebar.querySelector("nav");
      if (nav) {
        nav.classList.add("flex-1");
        nav.classList.add("py-6");
        nav.classList.add("space-y-1");
        nav.innerHTML = navHtml;
      }
    });
  }

  function ensureOverlay() {
    var overlay = document.getElementById("mobile-sidebar-overlay") || document.getElementById("mobile-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "mobile-sidebar-overlay";
      overlay.className = "fixed inset-0 bg-black/50 z-30 hidden md:hidden";
      document.body.appendChild(overlay);
    } else {
      overlay.id = "mobile-sidebar-overlay";
      overlay.classList.add("fixed", "inset-0", "bg-black/50", "z-30", "md:hidden");
      overlay.classList.add("hidden");
    }
    return overlay;
  }

  function findDesktopSidebar() {
    var all = Array.prototype.slice.call(document.querySelectorAll(".sidebar"));
    return all.find(function (el) {
      return !el.classList.contains("md:hidden");
    }) || null;
  }

  function ensureMobileSidebar(desktopSidebar) {
    var mobile = document.getElementById("mobile-sidebar");
    if (mobile) return mobile;
    if (!desktopSidebar) return null;

    mobile = desktopSidebar.cloneNode(true);
    mobile.id = "mobile-sidebar";
    mobile.classList.remove("hidden", "md:flex", "md:static", "md:translate-x-0");
    mobile.classList.add(
      "fixed",
      "inset-y-0",
      "left-0",
      "w-72",
      "z-40",
      "transform",
      "-translate-x-full",
      "transition-transform",
      "duration-300",
      "md:hidden",
      "flex",
      "flex-col",
      "overflow-y-auto"
    );

    var header = mobile.querySelector("div");
    if (header && !mobile.querySelector("#mobile-sidebar-close")) {
      var closeBtn = document.createElement("button");
      closeBtn.id = "mobile-sidebar-close";
      closeBtn.className = "md:hidden ml-auto p-2 text-gray-400 hover:text-white";
      closeBtn.setAttribute("aria-label", "Close menu");
      closeBtn.innerHTML = '<i data-lucide="x" class="w-5 h-5"></i>';
      header.appendChild(closeBtn);
    }

    document.body.appendChild(mobile);
    return mobile;
  }

  function cleanupMobileSidebar() {
    // Remove old event listeners
    if (currentOpenBtn) {
      currentOpenBtn.removeEventListener("click", handleOpenClick);
    }
    if (currentCloseBtn) {
      currentCloseBtn.removeEventListener("click", handleCloseClick);
    }
    if (currentOverlay) {
      currentOverlay.removeEventListener("click", handleOverlayClick);
    }
    if (currentMobileSidebar) {
      var links = currentMobileSidebar.querySelectorAll("a[href]");
      links.forEach(function (a) {
        a.removeEventListener("click", handleLinkClick);
      });
    }
  }

  function handleOpenClick(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (setOpen) setOpen(true);
  }

  function handleCloseClick(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (setOpen) setOpen(false);
  }

  function handleOverlayClick(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (setOpen) setOpen(false);
  }

  function handleLinkClick() {
    if (setOpen) setOpen(false);
  }

  function initMobileSidebar() {
    // Clean up previous initialization
    cleanupMobileSidebar();
    sidebarInitialized = false;

    applyStandardSidebarOptions();

    var openBtn = document.getElementById("mobile-menu-open") || document.getElementById("sa-mobile-toggle");
    if (!openBtn) {
      var header = document.querySelector("header");
      if (header) {
        openBtn = document.createElement("button");
        openBtn.id = "mobile-menu-open";
        openBtn.className = "md:hidden mr-4 text-slate-500";
        openBtn.setAttribute("aria-label", "Open menu");
        openBtn.innerHTML = '<i data-lucide="menu" class="w-6 h-6"></i>';

        if (header.firstElementChild) {
          header.firstElementChild.insertBefore(openBtn, header.firstElementChild.firstChild);
        } else {
          header.insertBefore(openBtn, header.firstChild);
        }
      }
    }
    if (!openBtn) return;

    var desktopSidebar = findDesktopSidebar();
    var mobileSidebar = ensureMobileSidebar(desktopSidebar);
    var overlay = ensureOverlay();
    if (!mobileSidebar || !overlay) return;

    // Store current references
    currentOpenBtn = openBtn;
    currentMobileSidebar = mobileSidebar;
    currentOverlay = overlay;
    currentCloseBtn = document.getElementById("mobile-sidebar-close") || document.getElementById("mobile-menu-close");

    // Keep sidebar above overlay so links remain clickable on mobile.
    mobileSidebar.classList.remove("z-10", "z-20", "z-30");
    mobileSidebar.classList.add("z-40");
    overlay.classList.remove("z-40", "z-50");
    overlay.classList.add("z-30");

    var sharedDesktopSidebar = mobileSidebar === desktopSidebar || mobileSidebar.classList.contains("md:flex");

    // Define setOpen function
    setOpen = function (open) {
      if (open) {
        mobileSidebar.classList.remove("-translate-x-full");
        mobileSidebar.classList.remove("hidden");
        overlay.classList.remove("hidden");
        document.body.style.overflow = "hidden";
      } else {
        mobileSidebar.classList.add("-translate-x-full");
        if (sharedDesktopSidebar) {
          mobileSidebar.classList.add("hidden");
        }
        overlay.classList.add("hidden");
        document.body.style.overflow = "";
      }
    };

    // Add event listeners with use capture to handle React events
    openBtn.addEventListener("click", handleOpenClick, true);

    if (currentCloseBtn) {
      currentCloseBtn.addEventListener("click", handleCloseClick, true);
    }

    overlay.addEventListener("click", handleOverlayClick, true);

    mobileSidebar.querySelectorAll("a[href]").forEach(function (a) {
      a.addEventListener("click", handleLinkClick);
    });

    // Handle resize to close menu on desktop
    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width: 768px)").matches) {
        if (setOpen) setOpen(false);
      }
    });

    // Close menu by default
    if (setOpen) setOpen(false);

    // Initialize Lucide icons
    if (typeof lucide !== "undefined" && typeof lucide.createIcons === "function") {
      try {
        lucide.createIcons();
      } catch (e) {
        console.warn("Lucide icons failed to initialize:", e);
      }
    }

    sidebarInitialized = true;
  }

  // Expose to global scope for external initialization
  window._initMobileSidebar = initMobileSidebar;

  function initOnLoad() {
    // Initial load with delay to ensure DOM rendering
    var initialDelayMs = document.readyState === "loading" ? 500 : 300;
    setTimeout(initMobileSidebar, initialDelayMs);

    // Set up interval check for route navigation
    var lastPathname = window.location.pathname;
    setInterval(function () {
      if (window.location.pathname !== lastPathname) {
        lastPathname = window.location.pathname;
        // Reset initialization flag when route changes
        sidebarInitialized = false;
        setTimeout(initMobileSidebar, 300);
      }
    }, 500);

    // Global delegated click listener for menu toggle (works with inline JS conflicts)
    document.addEventListener("click", function(e) {
      var target = e.target;
      
      // Check if clicked element is the menu button or inside it
      while (target && target !== document.body) {
        if (target.id === "mobile-menu-open") {
          e.preventDefault();
          e.stopImmediatePropagation();
          
          var mobileSidebar = document.getElementById("mobile-sidebar");
          var overlay = document.getElementById("mobile-sidebar-overlay");
          
          if (mobileSidebar && overlay) {
            var isHidden = mobileSidebar.classList.contains("-translate-x-full") || 
                          mobileSidebar.classList.contains("hidden");
            
            if (isHidden) {
              // Open
              mobileSidebar.classList.remove("-translate-x-full");
              mobileSidebar.classList.remove("hidden");
              overlay.classList.remove("hidden");
              document.body.style.overflow = "hidden";
            } else {
              // Close
              mobileSidebar.classList.add("-translate-x-full");
              overlay.classList.add("hidden");
              document.body.style.overflow = "";
            }
          }
          break;
        }
        target = target.parentNode;
      }
    }, true);
  }

  // Start initialization
  initOnLoad();
})();
        return (
          '<a href="' + link.href + '" class="sidebar-link' + active + '">' +
          '<i data-lucide="' + link.icon + '" class="w-5 h-5 mr-3"></i> ' + link.label +
          "</a>"
        );
      }).join("");
      return '<div class="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6">' +
        section.heading + "</div>" + links;
    }).join("");
  }

  function applyStandardSidebarOptions() {
    if (isAreaAdminPage()) return;
    var navHtml = buildStandardNavHtml();
    var sidebars = Array.prototype.slice.call(document.querySelectorAll(".sidebar"));
    sidebars.forEach(function (sidebar) {
      var nav = sidebar.querySelector("nav");
      if (nav) {
        nav.classList.add("flex-1");
        nav.classList.add("py-6");
        nav.classList.add("space-y-1");
        nav.innerHTML = navHtml;
      }
    });
  }

  function ensureOverlay() {
    var overlay = document.getElementById("mobile-sidebar-overlay") || document.getElementById("mobile-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "mobile-sidebar-overlay";
      overlay.className = "fixed inset-0 bg-black/50 z-30 hidden md:hidden";
      document.body.appendChild(overlay);
    } else {
      overlay.id = "mobile-sidebar-overlay";
      overlay.classList.add("fixed", "inset-0", "bg-black/50", "z-30", "md:hidden");
      overlay.classList.add("hidden");
    }
    return overlay;
  }

  function findDesktopSidebar() {
    var all = Array.prototype.slice.call(document.querySelectorAll(".sidebar"));
    return all.find(function (el) {
      return !el.classList.contains("md:hidden");
    }) || null;
  }

  function ensureMobileSidebar(desktopSidebar) {
    var mobile = document.getElementById("mobile-sidebar");
    if (mobile) return mobile;
    if (!desktopSidebar) return null;

    mobile = desktopSidebar.cloneNode(true);
    mobile.id = "mobile-sidebar";
    mobile.classList.remove("hidden", "md:flex", "md:static", "md:translate-x-0");
    mobile.classList.add(
      "fixed",
      "inset-y-0",
      "left-0",
      "w-72",
      "z-40",
      "transform",
      "-translate-x-full",
      "transition-transform",
      "duration-300",
      "md:hidden",
      "flex",
      "flex-col",
      "overflow-y-auto"
    );

    var header = mobile.querySelector("div");
    if (header && !mobile.querySelector("#mobile-sidebar-close")) {
      var closeBtn = document.createElement("button");
      closeBtn.id = "mobile-sidebar-close";
      closeBtn.className = "md:hidden ml-auto p-2 text-gray-400 hover:text-white";
      closeBtn.setAttribute("aria-label", "Close menu");
      closeBtn.innerHTML = '<i data-lucide="x" class="w-5 h-5"></i>';
      header.appendChild(closeBtn);
    }

    document.body.appendChild(mobile);
    return mobile;
  }

  function initMobileSidebar() {
    applyStandardSidebarOptions();

    var openBtn = document.getElementById("mobile-menu-open") || document.getElementById("sa-mobile-toggle");
    if (!openBtn) {
      var header = document.querySelector("header");
      if (header) {
        openBtn = document.createElement("button");
        openBtn.id = "mobile-menu-open";
        openBtn.className = "md:hidden mr-4 text-slate-500";
        openBtn.setAttribute("aria-label", "Open menu");
        openBtn.innerHTML = '<i data-lucide="menu" class="w-6 h-6"></i>';

        if (header.firstElementChild) {
          header.firstElementChild.insertBefore(openBtn, header.firstElementChild.firstChild);
        } else {
          header.insertBefore(openBtn, header.firstChild);
        }
      }
    }
    if (!openBtn) return;

    var desktopSidebar = findDesktopSidebar();
    var mobileSidebar = ensureMobileSidebar(desktopSidebar);
    var overlay = ensureOverlay();
    if (!mobileSidebar || !overlay) return;

    // Keep sidebar above overlay so links remain clickable on mobile.
    mobileSidebar.classList.remove("z-10", "z-20", "z-30");
    mobileSidebar.classList.add("z-40");
    overlay.classList.remove("z-40", "z-50");
    overlay.classList.add("z-30");

    var closeBtn = document.getElementById("mobile-sidebar-close") || document.getElementById("mobile-menu-close");
    var sharedDesktopSidebar = mobileSidebar === desktopSidebar || mobileSidebar.classList.contains("md:flex");

    function setOpen(open) {
      if (open) {
        mobileSidebar.classList.remove("-translate-x-full");
        mobileSidebar.classList.remove("hidden");
        overlay.classList.remove("hidden");
        document.body.style.overflow = "hidden";
      } else {
        mobileSidebar.classList.add("-translate-x-full");
        if (sharedDesktopSidebar) {
          mobileSidebar.classList.add("hidden");
        }
        overlay.classList.add("hidden");
        document.body.style.overflow = "";
      }
    }

    openBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      setOpen(true);
    }, true);

    if (closeBtn) {
      closeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setOpen(false);
      }, true);
    }

    overlay.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      setOpen(false);
    }, true);

    mobileSidebar.querySelectorAll("a[href]").forEach(function (a) {
      a.addEventListener("click", function () {
        setOpen(false);
      });
    });

    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width: 768px)").matches) {
        setOpen(false);
      }
    });

    setOpen(false);

    if (typeof lucide !== "undefined" && typeof lucide.createIcons === "function") {
      lucide.createIcons();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMobileSidebar);
  } else {
    initMobileSidebar();
  }
})();
