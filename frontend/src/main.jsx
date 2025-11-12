import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

function setDarkMode() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (prefersDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

// Set initial dark mode based on system preference
setDarkMode();

// Listen for changes in system preference
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", setDarkMode);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
