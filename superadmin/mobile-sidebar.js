(function () {
  var STANDARD_LINKS = [
    { heading: "Overview", links: [{ href: "superadmin.html", label: "Dashboard", icon: "layout-dashboard" }] },
    {
      heading: "Management",
      links: [
        { href: "manager.html", label: "Teams", icon: "map-pin" },
        { href: "owner.html", label: "Property Owners", icon: "briefcase" },
        { href: "properties.html", label: "Properties", icon: "home" },
        { href: "tenant.html", label: "Tenants", icon: "users" },
        { href: "new_signups.html", label: "New Signups", icon: "file-badge" }
      ]
    },
    {
      heading: "Operations",
      links: [
        { href: "websiteenq.html", label: "Web Enquiry", icon: "folder-open" },
        { href: "enquiry.html", label: "Enquiries", icon: "help-circle" },
        { href: "booking.html", label: "Bookings", icon: "calendar-check" },
        { href: "reviews.html", label: "Reviews", icon: "star" },
        { href: "complaint-history.html", label: "Complaint History", icon: "alert-circle" }
      ]
    },
    { heading: "Website", links: [{ href: "website.html", label: "Live Properties", icon: "globe" }] },
    {
      heading: "Finance",
      links: [
        { href: "rentcollection.html", label: "Rent Collections", icon: "wallet" },
        { href: "platform.html", label: "Commissions", icon: "indian-rupee" },
        { href: "refund.html", label: "Refunds", icon: "rotate-ccw" }
      ]
    },
    { heading: "System", links: [{ href: "location.html", label: "Locations", icon: "map-pin" }] }
  ];

  function currentFileName() {
    var path = window.location.pathname || "";
    var file = path.split("/").pop() || "";
    return file.toLowerCase();
  }

  function isAreaAdminPage() {
    return currentFileName() === "areaadmin.html";
  }

  function buildStandardNavHtml() {
    var current = currentFileName();
    return STANDARD_LINKS.map(function (section) {
      var links = section.links.map(function (link) {
        var active = current === link.href.toLowerCase() ? " active" : "";
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
