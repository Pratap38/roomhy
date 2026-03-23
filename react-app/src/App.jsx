import React, { useEffect } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import routes from "./routes";
import SharedShell from "./components/SharedShell.jsx";
import { resolveSectionFromPath } from "./components/sharedNavConfig";

const wrapWithShell = (path, element) => {
  if (path.startsWith("/superadmin/")) return element;
  if (path.startsWith("/employee/")) return element;
  if (path.startsWith("/tenant/")) return element;
  const section = resolveSectionFromPath(path);
  if (!section) return element;
  return <SharedShell>{element}</SharedShell>;
};

const renderRoutes = (items) =>
  items.map((route) => (
    <Route
      key={route.path}
      path={route.path}
      element={wrapWithShell(route.path, route.element)}
    />
  ));

const resolveHostHome = () => {
  if (typeof window === "undefined") return "/website/index";
  const host = (window.location.hostname || "").toLowerCase();
  if (host === "admin.roomhy.com" || host === "www.admin.roomhy.com") {
    return "/superadmin/index";
  }
  if (host === "app.roomhy.com" || host === "www.app.roomhy.com") {
    return "/propertyowner/index";
  }
  return "/website/index";
};

const HtmlRedirectOrHome = () => {
  const location = useLocation();
  const path = location.pathname || "";
  if (path.endsWith(".html")) {
    const clean = path.replace(/\.html$/i, "");
    return <Navigate to={clean || "/"} replace />;
  }
  return <Navigate to={resolveHostHome()} replace />;
};

const RouteChromeCleanup = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname || "";
    if (!path.startsWith("/tenant/")) return;

    const cleanup = () => {
      document.querySelectorAll(".shared-shell").forEach((shell) => {
        shell.querySelectorAll(".shared-sidebar, .shared-header").forEach((node) => node.remove());

        const content = shell.querySelector(".shared-content");
        if (content) {
          content.style.padding = "0";
          content.style.minHeight = "100vh";
        }

        shell.setAttribute("data-tenant-cleanup", "1");
        shell.style.display = "block";
        shell.style.background = "transparent";
        shell.style.minHeight = "auto";
      });
    };

    cleanup();
    const timer = window.setTimeout(cleanup, 50);
    const observer = new MutationObserver(() => cleanup());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [location.pathname]);

  return null;
};

export default function App() {
  return (
    <>
      <RouteChromeCleanup />
      <Routes>
        {renderRoutes(routes)}
        <Route path="/" element={<Navigate to={resolveHostHome()} replace />} />
        <Route path="/superadmin" element={<Navigate to="/superadmin/index" replace />} />
        <Route path="/employee" element={<Navigate to="/employee/areaadmin" replace />} />
        <Route path="/employee/superadmin" element={<Navigate to="/employee/areaadmin" replace />} />
        <Route path="/propertyowner" element={<Navigate to="/propertyowner/index" replace />} />
        <Route path="/website" element={<Navigate to="/website/index" replace />} />
        <Route path="*" element={<HtmlRedirectOrHome />} />
      </Routes>
    </>
  );
}
