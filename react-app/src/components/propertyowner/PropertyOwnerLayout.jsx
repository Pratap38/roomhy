import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const DEFAULT_DESKTOP_ITEMS = [
  { href: "/propertyowner/admin", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/propertyowner/rooms", label: "Rooms", icon: "bed-double" },
  { href: "/propertyowner/tenantrec", label: "Tenant Records", icon: "clipboard-list" },
  { href: "/propertyowner/booking_request", label: "Booking Requests", icon: "calendar-check" },
  { href: "/propertyowner/ownerchat", label: "Chat", icon: "message-circle" },
  { href: "/propertyowner/ownerprofile", label: "Profile", icon: "user" },
  { href: "/propertyowner/settings", label: "Settings", icon: "settings" }
];

const FULL_NAV_ITEMS = [
  { href: "/propertyowner/admin", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/propertyowner/rooms", label: "Rooms", icon: "bed-double" },
  { href: "/propertyowner/tenantrec", label: "Tenant Records", icon: "clipboard-list" },
  { href: "/propertyowner/payment", label: "Payments", icon: "credit-card" },
  { href: "/propertyowner/booking_request", label: "Booking Requests", icon: "calendar-check" },
  { href: "/propertyowner/ownerchat", label: "Chat", icon: "message-circle" },
  { href: "/propertyowner/location", label: "Location", icon: "map-pin" },
  { href: "/propertyowner/ownerprofile", label: "Profile", icon: "user" },
  { href: "/propertyowner/settings", label: "Settings", icon: "settings" }
];

const SETTINGS_DESKTOP_ITEMS = [
  { href: "/propertyowner/admin", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/propertyowner/rooms", label: "Rooms", icon: "bed-double" },
  { href: "/propertyowner/tenantrec", label: "Tenant Records", icon: "clipboard-list" },
  { href: "/propertyowner/payment", label: "Payments", icon: "credit-card" },
  { href: "/propertyowner/location", label: "Location", icon: "map-pin" },
  { href: "#", label: "Chat", icon: "message-square", disabled: true },
  { href: "/propertyowner/ownerprofile", label: "Profile", icon: "user" },
  { href: "/propertyowner/settings", label: "Settings", icon: "settings" }
];

const CHAT_DESKTOP_ITEMS = [
  { href: "/propertyowner/admin", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/propertyowner/rooms", label: "Rooms", icon: "bed-double" },
  { href: "/propertyowner/tenantrec", label: "Tenant Records", icon: "clipboard-list" },
  { href: "/propertyowner/payment", label: "Payments", icon: "credit-card" },
  { href: "/propertyowner/location", label: "Location", icon: "map-pin" },
  { href: "/propertyowner/ownerchat", label: "Chat", icon: "message-square" },
  { href: "/propertyowner/ownerprofile", label: "Profile", icon: "user" },
  { href: "/propertyowner/settings", label: "Settings", icon: "settings" }
];

const isActivePath = (pathname, href) => href !== "#" && (pathname === href || pathname.startsWith(`${href}/`));

const joinClassNames = (...values) => values.filter(Boolean).join(" ");

export function getPropertyOwnerNavConfig(variant = "default") {
  switch (variant) {
    case "full":
      return { desktopItems: FULL_NAV_ITEMS, mobileItems: FULL_NAV_ITEMS };
    case "settings":
      return { desktopItems: SETTINGS_DESKTOP_ITEMS, mobileItems: FULL_NAV_ITEMS };
    case "chat":
      return { desktopItems: CHAT_DESKTOP_ITEMS, mobileItems: CHAT_DESKTOP_ITEMS };
    default:
      return { desktopItems: DEFAULT_DESKTOP_ITEMS, mobileItems: FULL_NAV_ITEMS };
  }
}

export default function PropertyOwnerLayout({
  owner,
  title,
  children,
  mainClassName = "flex-1 overflow-y-auto p-6 md:p-8",
  contentClassName = "",
  headerRight = null,
  navVariant = "default",
  headerVariant = "default",
  notificationCount = 0,
  notifications = [],
  showNotificationSettings = false,
  onNotificationSettingsClick,
  onLogout
}) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navConfig = useMemo(() => getPropertyOwnerNavConfig(navVariant), [navVariant]);

  useEffect(() => {
    setMobileOpen(false);
    setNotificationOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const displayName = useMemo(() => owner?.name || owner?.ownerName || "Owner", [owner]);
  const ownerInitial = useMemo(() => String(displayName).charAt(0).toUpperCase() || "O", [displayName]);
  const accountLabel = useMemo(() => (owner?.loginId ? `Account: ${owner.loginId}` : "Property Owner"), [owner]);

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }
    try {
      sessionStorage.removeItem("owner_session");
      localStorage.removeItem("owner_session");
      sessionStorage.removeItem("owner_user");
      localStorage.removeItem("owner_user");
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
    } catch (_) {
      // ignore
    }
    window.location.href = "/propertyowner/ownerlogin";
  };

  const renderNavItem = (item, mobile = false) => {
    const active = isActivePath(pathname, item.href);
    const className = joinClassNames(
      "sidebar-link",
      active && "active",
      item.disabled && "disabled opacity-50 cursor-not-allowed"
    );

    if (item.disabled) {
      return (
        <a
          key={`${mobile ? "mobile" : "desktop"}-${item.label}`}
          href="#"
          onClick={(event) => event.preventDefault()}
          className={className}
        >
          <i data-lucide={item.icon} className="w-5 h-5 mr-3"></i>
          {item.label}
        </a>
      );
    }

    return (
      <Link
        key={`${mobile ? "mobile" : "desktop"}-${item.href}`}
        to={item.href}
        className={className}
      >
        <i data-lucide={item.icon} className="w-5 h-5 mr-3"></i>
        {item.label}
      </Link>
    );
  };

  const bellButton = (
    <div className="relative">
      <button
        id="notificationBellBtn"
        type="button"
        className={joinClassNames(
          "relative text-slate-400 hover:text-slate-600 transition-colors",
          headerVariant === "default" && "p-2 hover:bg-gray-100 rounded-lg"
        )}
        onClick={() => setNotificationOpen((prev) => !prev)}
      >
        <i data-lucide="bell" className="w-5 h-5"></i>
        {notificationCount > 0 ? (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {notificationCount}
          </span>
        ) : headerVariant === "compact" ? (
          <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500"></span>
        ) : null}
      </button>
      <div
        id="notificationDropdown"
        className={joinClassNames(
          "absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg py-2 ring-1 ring-black ring-opacity-5 z-50",
          notificationOpen ? "block" : "hidden"
        )}
      >
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
        </div>
        <div id="notificationList" className="max-h-96 overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((item, index) => (
              <div key={`${item.title || item.message || "notification"}-${index}`} className="px-4 py-3 border-b border-gray-100 last:border-b-0">
                <p className="text-sm font-medium text-gray-800">{item.title || "Notification"}</p>
                <p className="text-xs text-gray-500 mt-1">{item.message || ""}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const profileMenu = (
    <div className="relative">
      <button
        type="button"
        className={joinClassNames(
          "flex items-center gap-3",
          headerVariant === "compact"
            ? "max-w-xs text-sm rounded-full focus:outline-none"
            : "hover:bg-gray-50 p-1.5 rounded-full transition-colors"
        )}
        onClick={() => setProfileOpen((prev) => !prev)}
      >
        <div
          id={headerVariant === "compact" ? "headerAvatar" : "headerAvatar"}
          className={joinClassNames(
            headerVariant === "compact" ? "h-9 w-9 text-purple-700" : "w-8 h-8 text-purple-600",
            "rounded-full bg-purple-100 flex items-center justify-center font-bold border border-purple-200"
          )}
        >
          {ownerInitial}
        </div>
        {headerVariant === "compact" ? (
          <div className="hidden md:block text-left">
            <p id="headerOwnerName" className="text-xs font-bold text-gray-800">{displayName}</p>
            <p id="headerOwnerId" className="text-[10px] text-gray-500">{`ID: ${owner?.loginId || "..."}`}</p>
          </div>
        ) : (
          <div className="text-left hidden sm:block">
            <p id="headerName" className="text-xs font-semibold text-gray-700">{displayName}</p>
            <p id="headerAccountId" className="text-[10px] text-gray-500">{accountLabel}</p>
          </div>
        )}
        <i data-lucide="chevron-down" className="w-3 h-3 text-gray-400 hidden sm:block"></i>
      </button>
      <div
        className={joinClassNames(
          "absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50",
          profileOpen ? "block" : "hidden"
        )}
      >
        {headerVariant === "compact" && (
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{`ID: ${owner?.loginId || "..."}`}</p>
          </div>
        )}
        <Link to="/propertyowner/ownerprofile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          <i data-lucide="user-circle" className="w-4 h-4 inline mr-2"></i>
          {headerVariant === "compact" ? "Your Profile" : "Profile"}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
        >
          <i data-lucide="log-out" className="w-4 h-4 inline mr-2"></i>
          Logout
        </button>
      </div>
    </div>
  );

  const renderMobileSidebar = () => {
    if (headerVariant === "compact" && navVariant === "chat") {
      return (
        <>
          <div
            id="mobile-sidebar-overlay"
            className={joinClassNames("fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm", mobileOpen ? "block" : "hidden")}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            id="mobile-sidebar"
            className={joinClassNames(
              "fixed inset-y-0 left-0 w-72 bg-[#111827] z-40 transition-transform duration-300 md:hidden flex flex-col shadow-2xl",
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
              <div className="flex items-center gap-2 text-white font-bold">
                <i data-lucide="home" className="w-5 h-5"></i>
                <span>RoomHy</span>
              </div>
              <button id="mobile-sidebar-close" type="button" className="p-2 text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>
                <i data-lucide="x" className="w-5 h-5"></i>
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
              {navConfig.mobileItems.map((item) => renderNavItem(item, true))}
            </nav>
          </aside>
        </>
      );
    }

    return (
      <div className={joinClassNames("md:hidden fixed inset-0 z-50", mobileOpen ? "flex" : "hidden")}>
        <button type="button" className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
        <aside className="sidebar w-72 flex-shrink-0 text-gray-300 flex flex-col relative z-10 ml-auto">
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">
            <div>
              <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
              <span className="text-[10px] text-gray-500">OWNER PANEL</span>
            </div>
            <button type="button" className="p-2 text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>
              <i data-lucide="x" className="w-6 h-6"></i>
            </button>
          </div>
          <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
            {navConfig.mobileItems.map((item) => renderNavItem(item, true))}
          </nav>
        </aside>
      </div>
    );
  };

  return (
    <div className="html-page">
      <div className="flex h-screen overflow-hidden">
        <aside className="sidebar w-72 flex-shrink-0 hidden md:flex flex-col z-20 overflow-y-auto custom-scrollbar">
          <div className="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
            <div>
              <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
              <span className="text-[10px] text-gray-500">OWNER PANEL</span>
            </div>
          </div>
          <nav className="flex-1 py-6 space-y-1">
            {navConfig.desktopItems.map((item) => renderNavItem(item))}
            {navVariant === "default" && (
              <div className="mt-6 px-6 pb-2">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Accounts</div>
                <div className="rounded-lg bg-[#1f2937] border border-gray-800 px-3 py-2">
                  <div className="text-sm font-medium text-white">{displayName}</div>
                  <div className="text-[11px] text-gray-400">{owner?.loginId || "No account id"}</div>
                </div>
                <button type="button" className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <i data-lucide="plus" className="w-4 h-4"></i>
                  Add Account
                </button>
              </div>
            )}
          </nav>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
          <header className={joinClassNames("bg-white flex items-center justify-between px-6 shadow-sm z-10", headerVariant === "compact" ? "h-16 relative z-30 flex-shrink-0" : "h-16")}>
            <div className="flex items-center gap-4">
              <button type="button" className="md:hidden text-slate-500" onClick={() => setMobileOpen(true)}>
                <i data-lucide="menu" className="w-6 h-6"></i>
              </button>
              <h2 className={joinClassNames(headerVariant === "compact" ? "text-xl font-bold text-gray-800" : "text-lg font-semibold text-slate-800")}>{title}</h2>
            </div>
            <div className="flex items-center gap-4">
              {headerRight}
              {bellButton}
              {showNotificationSettings && (
                <button
                  id="notificationSettingsBtn"
                  type="button"
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  title="Notification settings"
                  onClick={onNotificationSettingsClick}
                >
                  <i data-lucide="settings-2" className="w-5 h-5"></i>
                </button>
              )}
              {profileMenu}
            </div>
          </header>

          {renderMobileSidebar()}

          <main className={mainClassName}>
            <div className={contentClassName}>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
