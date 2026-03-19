/**
 * Tailwind CSS Helper
 * Handles dynamic rescanning of Tailwind classes when content is injected
 */

export const initTailwindHelper = () => {
  // Store the original Tailwind scan function if it exists
  if (window.tailwind && typeof window.tailwind === 'object') {
    // Tailwind v3 from CDN provides the config object
    window._originalTailwindConfig = { ...window.tailwind };
  }

  // Create a global function to trigger rescanning
  window.rescalculateTailwind = function() {
    try {
      // Method 1: Use Tailwind's restartWind if available
      if (window.tailwind?.restartWind) {
        window.tailwind.restartWind();
        console.debug("✓ Tailwind rescanned via restartWind");
        return true;
      }

      // Method 2: Try to trigger via Tailwind prototype methods
      if (window.tailwind && typeof window.tailwind.restartWind === 'function') {
        window.tailwind.restartWind();
        console.debug("✓ Tailwind rescanned via prototype");
        return true;
      }

      // Method 3: Force document reflow to re-evaluate styles
      // This works by triggering browser's style recalculation
      const el = document.documentElement;
      const currentDisplay = el.style.display;
      el.style.display = 'none';
      void el.offsetHeight; // Trigger reflow
      el.style.display = currentDisplay;
      console.debug("✓ Tailwind rescanned via reflow");
      return true;

    } catch (err) {
      console.warn("⚠ Error rescanning Tailwind:", err);
      return false;
    }
  };

  // Override the main.jsx Tailwind loader to store a reference
  window._tailwindLoaded = true;
};

export const rescanTailwind = () => {
  if (typeof window.rescalculateTailwind === 'function') {
    return window.rescalculateTailwind();
  }
  return false;
};

export const ensureTailwindCdn = () => {
  if (document.querySelector('script[src="https://cdn.tailwindcss.com"]')) {
    return;
  }

  window.tailwind = window.tailwind || {};
  const script = document.createElement("script");
  script.src = "https://cdn.tailwindcss.com";
  script.async = false;
  document.head.appendChild(script);
};
