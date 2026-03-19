import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const getApiUrl = () =>
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : "https://api.roomhy.com";

export const useWebsiteLogin = () => {
  const apiUrl = useMemo(() => getApiUrl(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => () => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
  }, []);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const redirectAfterLogin = useCallback((user) => {
    if (!user) return;
    if (user.role === "superadmin") {
      window.location.href = "/superadmin/superadmin";
    } else if (user.role === "areamanager" || user.role === "manager" || user.role === "employee") {
      window.location.href = "/employee/areaadmin";
    } else if (user.role === "owner") {
      window.location.href = "/propertyowner/index";
    } else {
      window.location.href = "/website/index";
    }
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      if (!trimmedEmail || !trimmedPassword) {
        showToast("Please fill all fields", "error");
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: trimmedEmail, password: trimmedPassword })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.token && data.user) {
          showToast("Login successful!", "success");
          if (window.AuthUtils?.setWebsiteSession) {
            window.AuthUtils.setWebsiteSession(data.user, data.token);
          } else {
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("token", data.token);
            sessionStorage.setItem("token", data.token);
          }
          setTimeout(() => redirectAfterLogin(data.user), 300);
          return;
        }

        if (!response.ok) {
          showToast(`Login failed: ${data.message || "Invalid credentials"}`, "error");
          return;
        }

        showToast("Login failed: incorrect credentials", "error");
      } catch (err) {
        showToast(`Network error: ${err.message}`, "error");
      }
    },
    [apiUrl, email, password, redirectAfterLogin, showToast]
  );

  const handleForgot = useCallback(async () => {
    const targetEmail = prompt("Enter your registered email for password reset:");
    if (!targetEmail) return;

    try {
      const res = await fetch(`${apiUrl}/tenant/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail })
      });
      if (res.ok) {
        showToast("If an account exists, you will receive reset instructions.", "info");
        return;
      }
    } catch (err) {
      // ignore, fallback below
    }

    const tenantsKey = "roomhy_tenants";
    const tenants = JSON.parse(localStorage.getItem(tenantsKey) || "[]");
    const idx = tenants.findIndex(
      (t) => (t.email || "").toLowerCase() === (targetEmail || "").toLowerCase()
    );
    if (idx === -1) {
      alert("No account found for that email (offline).");
      return;
    }

    const newPass = prompt("Enter your new password:");
    if (!newPass) {
      alert("Password not changed");
      return;
    }
    const confirmPass = prompt("Confirm new password:");
    if (newPass !== confirmPass) {
      alert("Passwords do not match");
      return;
    }

    tenants[idx].password = newPass;
    tenants[idx].status = "active";
    localStorage.setItem(tenantsKey, JSON.stringify(tenants));
    alert("Password updated locally. You can now login.");
  }, [apiUrl, showToast]);

  return {
    email,
    password,
    setEmail,
    setPassword,
    menuOpen,
    setMenuOpen,
    toast,
    handleSubmit,
    handleForgot,
    showToast
  };
};


