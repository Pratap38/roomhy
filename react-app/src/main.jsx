import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/global.css";

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
