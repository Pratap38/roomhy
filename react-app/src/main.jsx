import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

window.React = React;

const root = createRoot(document.getElementById("root"));

// Mark DOM as loaded when styles are applied
setTimeout(() => {
  document.documentElement.classList.add("loaded");
}, 0);

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
