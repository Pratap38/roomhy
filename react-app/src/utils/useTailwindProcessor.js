import { useEffect } from "react";
import { initTailwindHelper, rescanTailwind } from "./tailwindHelper.js";

export const useTailwindProcessor = () => {
  useEffect(() => {
    try {
      initTailwindHelper();
    } catch (_) {
      // ignore helper bootstrap failures
    }

    const run = () => {
      try {
        rescanTailwind();
      } catch (_) {
        // ignore rescan failures
      }
    };

    run();
    const t1 = setTimeout(run, 100);
    const t2 = setTimeout(run, 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
};
