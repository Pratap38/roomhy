export const isLocalHost = () =>
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export const getApiBases = () => (isLocalHost() ? ["http://localhost:5001"] : ["https://api.roomhy.com", ""]);

export const getParamValue = (names) => {
  const params = new URLSearchParams(window.location.search);
  const hashQuery = window.location.hash && window.location.hash.includes("?")
    ? new URLSearchParams(window.location.hash.split("?")[1])
    : new URLSearchParams("");
  const allEntries = [...params.entries(), ...hashQuery.entries()];

  for (const key of names) {
    const direct = params.get(key) || hashQuery.get(key);
    if (direct) return direct.trim();
    const ciMatch = allEntries.find(([k, v]) => k.toLowerCase() === key.toLowerCase() && v);
    if (ciMatch && ciMatch[1]) return ciMatch[1].trim();
  }
  return "";
};

export const postWithFallback = async (path, payload, bases = getApiBases()) => {
  let lastErr = null;
  for (const base of bases) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return data;
      lastErr = new Error(data.message || `HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("Request failed");
};

export const postExpectSuccess = async (path, payload, bases = getApiBases()) => {
  let lastErr = null;
  for (const base of bases) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) return data;
      lastErr = new Error(data.message || `HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("Request failed");
};

export const getWithFallback = async (path, bases = getApiBases()) => {
  let lastErr = null;
  for (const base of bases) {
    try {
      const res = await fetch(`${base}${path}`);
      if (res.ok) return res.json();
      const data = await res.json().catch(() => ({}));
      lastErr = new Error(data.message || `HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("Request failed");
};

export const cleanPropertyName = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  const lower = text.toLowerCase();
  if (
    lower === "new" ||
    lower === "new property" ||
    lower === "undefined" ||
    lower === "null" ||
    /^new\s*(\(.+\))?$/.test(lower)
  ) {
    return "";
  }
  return text;
};

export const formatAadhaarWithSpaces = (value) => {
  let val = String(value || "").replace(/\D/g, "");
  if (val.length > 12) val = val.substring(0, 12);
  if (val.length > 8) return `${val.substring(0, 4)} ${val.substring(4, 8)} ${val.substring(8)}`;
  if (val.length > 4) return `${val.substring(0, 4)} ${val.substring(4)}`;
  return val;
};

export const maskAadhaar = (aadhaar) => {
  const clean = String(aadhaar || "").replace(/\D/g, "");
  if (clean.length !== 12) return aadhaar || "-";
  return `XXXX XXXX ${clean.slice(-4)}`;
};

