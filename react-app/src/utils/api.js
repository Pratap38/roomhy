export const getApiBase = () => {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1"
    ? "http://localhost:5001"
    : "https://api.roomhy.com";
};

export const getAuthHeader = () => {
  if (typeof window === "undefined") return {};
  let token = "";
  try {
    token = sessionStorage.getItem("token") || localStorage.getItem("token") || "";
  } catch (_) {
    token = "";
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchJson = async (path, options = {}) => {
  const base = getApiBase();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...getAuthHeader()
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Request failed: ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return res.json();
};
