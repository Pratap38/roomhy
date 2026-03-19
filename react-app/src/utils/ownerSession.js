export const getOwnerSession = () => {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(
      localStorage.getItem("owner_user") ||
        sessionStorage.getItem("owner_session") ||
        localStorage.getItem("user") ||
        "null"
    );
  } catch (err) {
    return null;
  }
};

export const requireOwnerSession = () => {
  const owner = getOwnerSession();
  if (!owner || !owner.loginId) {
    if (typeof window !== "undefined") {
      window.location.href = "/propertyowner/ownerlogin";
    }
    return null;
  }
  return owner;
};

