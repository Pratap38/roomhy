import { fetchJson, getApiBase } from "./api";
import { getOwnerSession } from "./ownerSession";

const OWNER_LOGIN_ID_REGEX = /^ROOMHY\d{4}$/i;
const WEBSITE_USER_ID_REGEX = /^roomhyweb\d{6}$/i;

const readJson = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
};

const writeJson = (key, value) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {
    // ignore
  }
};

export const normalizeOwnerLoginId = (raw) => {
  const value = String(raw || "").trim().toUpperCase();
  return OWNER_LOGIN_ID_REGEX.test(value) ? value : "";
};

export const normalizeWebsiteChatUserId = (raw) => {
  const value = String(raw || "").trim().toLowerCase();
  if (WEBSITE_USER_ID_REGEX.test(value)) return value;
  const digits = value.replace(/\D/g, "").slice(-6);
  if (digits.length === 6) return `roomhyweb${digits}`;
  return "";
};

export const generateWebsiteChatUserIdFromEmail = (email) => {
  const safeEmail = String(email || "").trim().toLowerCase();
  if (!safeEmail) return "";
  let hash = 0;
  for (let i = 0; i < safeEmail.length; i += 1) {
    hash = (hash * 31 + safeEmail.charCodeAt(i)) % 1000000;
  }
  return `roomhyweb${String(hash).padStart(6, "0")}`;
};

export const generateWebsiteChatUserIdFromBooking = (booking = {}) => {
  const base = String(booking?._id || booking?.id || booking?.bookingId || "").trim();
  if (!base) return "";
  const digits = base.replace(/\D/g, "").slice(-6);
  if (digits.length === 6) return `roomhyweb${digits}`;
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 33 + base.charCodeAt(i)) % 1000000;
  }
  return `roomhyweb${String(hash).padStart(6, "0")}`;
};

export const resolveWebsiteChatUserId = (booking = {}) => {
  const fromEmail = generateWebsiteChatUserIdFromEmail(
    booking?.email || booking?.userEmail || booking?.gmail || booking?.contactEmail || booking?.user_email || ""
  );
  if (fromEmail) return fromEmail;

  const fromExplicitId = normalizeWebsiteChatUserId(
    booking?.website_user_id || booking?.websiteUserId || booking?.user_login_id || booking?.userLoginId || booking?.signup_user_id || booking?.user_id || ""
  );
  if (fromExplicitId) return fromExplicitId;

  return generateWebsiteChatUserIdFromBooking(booking);
};

export const getOwnerRuntimeSession = () => {
  const session = getOwnerSession();
  if (session?.loginId) return session;
  if (typeof window === "undefined") return null;
  const loginId = new URLSearchParams(window.location.search).get("loginId");
  return loginId ? { loginId: String(loginId).toUpperCase(), name: "Owner" } : null;
};

export const clearOwnerRuntimeSession = () => {
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
};

export const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

export const formatMoney = (value) => {
  const amount = Number(value || 0);
  return `Rs ${Number.isFinite(amount) ? amount : 0}`;
};

export const normalizeTenant = (tenant = {}, propertyMap = new Map()) => {
  const propertyId = tenant.property?._id || tenant.property || tenant.propertyId;
  const propertyObj = typeof propertyId === "string" ? propertyMap.get(String(propertyId)) : tenant.property;
  return {
    ...tenant,
    key: tenant._id || tenant.id || tenant.loginId || tenant.email || Math.random().toString(36).slice(2),
    displayName: tenant.name || tenant.fullName || "Tenant",
    loginId: tenant.loginId || tenant.tenantLoginId || "-",
    email: tenant.email || tenant.gmail || "-",
    phone: tenant.phone || tenant.mobile || "-",
    propertyObj: propertyObj || tenant.property || null,
    propertyTitle: tenant.property?.title || propertyObj?.title || tenant.propertyName || tenant.propertyTitle || "-",
    roomNumber: tenant.room?.number || tenant.roomNo || tenant.roomNumber || "-",
    rent: tenant.rentAmount || tenant.rent || tenant.roomRent || "-",
    status: tenant.status || (tenant.moveOutDate ? "moved out" : "active"),
    moveInDate: tenant.moveInDate || tenant.createdAt || null,
    moveOutDate: tenant.moveOutDate || null,
    locationCode: tenant.locationCode || propertyObj?.locationCode || tenant.area || "-",
    kycStatus: tenant.kycStatus || tenant.kycVerificationStatus || "pending"
  };
};

export const normalizeBooking = (item = {}) => ({
  ...item,
  ownerLoginId: normalizeOwnerLoginId(item.owner_id || item.ownerId || item.owner_login_id || item.ownerLoginId || item.owner || ""),
  key: item._id || item.id || item.bookingId || item.user_id || Math.random().toString(36).slice(2),
  propertyId: item.property_id || item.propertyId || item.property?._id || "-",
  propertyName: item.property_name || item.propertyName || item.property?.title || "-",
  ownerName: item.owner_name || item.ownerName || item.owner || "-",
  area: item.area || item.property?.area || item.locationCode || "-",
  type: item.request_type || item.type || item.propertyType || "-",
  rent: item.rent || item.rentAmount || item.price || "-",
  userId: resolveWebsiteChatUserId(item) || item.user_id || item.userId || item.signup_user_id || "-",
  userName: item.name || item.tenantName || item.fullName || "-",
  phone: item.phone || item.mobile || "-",
  email: item.email || "-",
  minPrice: item.bid_min || item.minPrice || "-",
  maxPrice: item.bid_max || item.maxPrice || "-",
  budgetRange:
    item.budgetRange ||
    ((item.bid_min || item.bid_max)
      ? `${item.bid_min || "-"} - ${item.bid_max || "-"}`
      : "-"),
  request_type: item.request_type || item.requestType || item.type || "",
  status: item.status || "pending"
});

const matchesOwnerLoginId = (candidate, ownerId) =>
  normalizeOwnerLoginId(candidate) === normalizeOwnerLoginId(ownerId);

export const normalizeBid = (item = {}) => ({
  ...item,
  key: item._id || item.id || item.bidId || Math.random().toString(36).slice(2),
  bidId: item.bidId || item._id || item.id || "-",
  propertyId: item.property_id || item.propertyId || "-",
  propertyName: item.property_name || item.propertyName || "-",
  ownerName: item.owner_name || item.ownerName || "-",
  fullName: item.fullName || item.name || "-",
  email: item.gmail || item.email || "-",
  gender: item.gender || "-",
  city: item.city || "-",
  area: item.area || "-",
  minPrice: item.minPrice || "-",
  maxPrice: item.maxPrice || "-",
  propertyType: item.propertyType || "-",
  budgetRange: item.budgetRange || ((item.minPrice || item.maxPrice) ? `${item.minPrice || "-"} - ${item.maxPrice || "-"}` : "-"),
  status: item.status || "pending",
  submittedAt: item.createdAt || item.submittedAt || null
});

export const downloadCsv = (filename, rows) => {
  if (typeof window === "undefined" || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const fetchOwnerProperties = async (loginId) => {
  const response = await fetchJson(`/api/owners/${encodeURIComponent(loginId)}/properties`);
  const properties = (response?.properties || []).filter((item) => {
    const candidateOwner = item?.ownerLoginId || item?.ownerId || item?.owner || "";
    return !candidateOwner || matchesOwnerLoginId(candidateOwner, loginId);
  });
  writeJson("roomhy_properties", properties);
  return properties;
};

export const fetchOwnerRooms = async (loginId) => {
  const response = await fetchJson(`/api/owners/${encodeURIComponent(loginId)}/rooms`);
  const rooms = (response?.rooms || []).filter((item) => {
    const candidateOwner = item?.ownerLoginId || item?.ownerId || item?.owner || item?.property?.ownerLoginId || "";
    return !candidateOwner || matchesOwnerLoginId(candidateOwner, loginId);
  });
  if (rooms.length) {
    writeJson("roomhy_rooms", rooms);
  }
  return { rooms, properties: response?.properties || [] };
};

export const fetchOwnerTenants = async (loginId) => {
  try {
    const response = await fetchJson("/api/tenants");
    const tenants = (Array.isArray(response) ? response : response?.tenants || response?.data || []).filter((tenant) => {
      const ownerLogin =
        tenant.property?.ownerLoginId ||
        tenant.ownerLoginId ||
        tenant.property?.owner ||
        tenant.owner;
      return ownerLogin ? String(ownerLogin).toUpperCase() === String(loginId).toUpperCase() : false;
    });
    writeJson("roomhy_tenants", tenants);
    return tenants;
  } catch (_) {
    try {
      const response = await fetchJson(`/api/tenants/owner/${encodeURIComponent(loginId)}`);
      const tenants = Array.isArray(response) ? response : response?.tenants || response?.data || [];
      writeJson("roomhy_tenants", tenants);
      return tenants;
    } catch (_) {
      const response = await fetchJson(`/api/owners/${encodeURIComponent(loginId)}/tenants`);
      const tenants = response?.tenants || [];
      writeJson("roomhy_tenants", tenants);
      return tenants;
    }
  }
};

export const fetchAllTenants = async () => {
  const response = await fetchJson("/api/tenants");
  const tenants = Array.isArray(response) ? response : response?.tenants || response?.data || [];
  writeJson("roomhy_tenants", tenants);
  return tenants;
};

export const fetchPropertyMap = async () => {
  try {
    const response = await fetchJson("/api/properties");
    const properties = Array.isArray(response) ? response : response?.properties || response?.data || [];
    writeJson("roomhy_properties", properties);
    return new Map(properties.map((item) => [String(item._id || item.id), item]));
  } catch (_) {
    const properties = readJson("roomhy_properties", []);
    return new Map(properties.map((item) => [String(item._id || item.id), item]));
  }
};

export const createRoom = async (payload) => {
  const response = await fetchJson("/api/rooms", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response?.room || response?.data || response;
};

export const assignTenant = async (payload) => fetchJson("/api/tenants/assign", {
  method: "POST",
  body: JSON.stringify(payload)
});

export const deleteTenantRecord = async (id) => fetchJson(`/api/tenants/${encodeURIComponent(id)}`, {
  method: "DELETE"
});

export const updateBookingDecision = async (bookingId, action) => {
  const endpoint = action === "approve" ? "approve" : "reject";
  return fetchJson(`/api/booking/requests/${encodeURIComponent(bookingId)}/${endpoint}`, { method: "PUT" });
};

export const fetchBookingRequestsForOwner = async (ownerId) => {
  const response = await fetchJson(`/api/booking/requests?owner_id=${encodeURIComponent(ownerId)}`);
  const list = Array.isArray(response) ? response : response?.requests || response?.data || [];
  return list.filter((item) => {
    const candidateOwner = item?.owner_id || item?.ownerId || item?.owner_login_id || item?.ownerLoginId || item?.owner || "";
    return !candidateOwner || matchesOwnerLoginId(candidateOwner, ownerId);
  });
};

export const fetchBids = async (ownerId) => {
  try {
    const response = await fetchJson(`/api/booking/requests?owner_id=${encodeURIComponent(ownerId)}&type=bid`);
    return Array.isArray(response) ? response : response?.data || response?.requests || [];
  } catch (_) {
    return [];
  }
};

export const createOwnerChatRoom = async ({ bookingId, userName, userEmail, userLoginId, ownerId, ownerName, propertyName }) =>
  fetchJson("/api/chat/create", {
    method: "POST",
    body: JSON.stringify({
      bookingId,
      userName,
      userEmail,
      userLoginId: resolveWebsiteChatUserId({ bookingId, id: bookingId, email: userEmail, user_id: userLoginId, signup_user_id: userLoginId }),
      ownerId: normalizeOwnerLoginId(ownerId) || ownerId,
      ownerName,
      propertyName
    })
  });

export const fetchConversation = async (ownerId, userId) =>
  fetchJson(`/api/chat/conversation?user1=${encodeURIComponent(ownerId)}&user2=${encodeURIComponent(userId)}`);

export const buildBookingFormLink = (booking) => {
  const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  const ownerName = booking.owner_name || booking.ownerName || booking.owner || "";
  const tenantName = booking.name || booking.userName || booking.tenantName || "";
  const tenantEmail = booking.email || booking.userEmail || booking.tenantEmail || "";
  const params = new URLSearchParams({
    bookingId: booking._id || booking.id || "",
    userId: resolveWebsiteChatUserId(booking),
    ownerId: normalizeOwnerLoginId(booking.ownerId || booking.ownerLoginId || booking.owner_id || booking.ownerLoginId || ""),
    propertyId: booking.property_id || booking.propertyId || "",
    propertyName: booking.property_name || booking.propertyName || "",
    ownerName,
    tenantName,
    tenantEmail
  });
  return `${base}/propertyowner/booking-form?${params.toString()}`;
};

export const getSocketUrl = () => getApiBase();
