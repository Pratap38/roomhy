import React from "react";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import routes from "./routes";
import SharedShell from "./components/SharedShell.jsx";
import { resolveSectionFromPath } from "./components/sharedNavConfig";

const wrapWithShell = (path, element) => {
  if (path.startsWith("/superadmin/")) return element;
  if (path.startsWith("/employee/")) return element;
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

const HtmlRedirectOrHome = () => {
  const location = useLocation();
  const path = location.pathname || "";
  if (path.endsWith(".html")) {
    const clean = path.replace(/\.html$/i, "");
    return <Navigate to={clean || "/"} replace />;
  }
  return <Navigate to="/website/index" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {renderRoutes(routes)}
        <Route path="/superadmin" element={<Navigate to="/superadmin/superadmin" replace />} />
        <Route path="/employee" element={<Navigate to="/employee/areaadmin" replace />} />
        <Route path="/employee/superadmin" element={<Navigate to="/employee/areaadmin" replace />} />
        <Route path="*" element={<HtmlRedirectOrHome />} />
      </Routes>
    </BrowserRouter>
  );
}
