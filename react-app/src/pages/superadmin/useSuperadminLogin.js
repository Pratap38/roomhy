import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const getApiUrl = () =>
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : "https://api.roomhy.com";

const WINDOW_NAME_SESSION_PREFIX = "__ROOMHY_STAFF_SESSION__:";

const persistWindowSession = (user) => {
  try {
    window.name = `${WINDOW_NAME_SESSION_PREFIX}${encodeURIComponent(JSON.stringify(user || {}))}`;
  } catch (e) {
    console.warn("Failed to persist window.name session:", e);
  }
};

const buildStaffRedirect = (user) => {
  const base = resolvePanelPath("employee", "areaadmin");
  try {
    return `${base}?staff=${encodeURIComponent(JSON.stringify(user || {}))}`;
  } catch (e) {
    return base;
  }
};

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });

const resolvePanelPath = (folder, fileName) => `/${folder}/${fileName.replace(/\\$/i, "")}`;

export const useSuperadminLogin = () => {
  const apiUrl = useMemo(() => getApiUrl(), []);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotErrors, setForgotErrors] = useState({});

  const forgotStateRef = useRef({
    email: "",
    otp: "",
    token: "",
    source: "",
    localOtp: ""
  });

  useEffect(() => {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      loadScript("/seeder.js").catch(() => null);
    }
  }, []);

  const showLoginError = useCallback((message) => {
    setLoginError(message || "");
  }, []);

  const clearForgotErrors = useCallback(() => {
    setForgotErrors({});
  }, []);

  const resetForgotModal = useCallback(() => {
    setForgotStep("email");
    setForgotEmail("");
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    clearForgotErrors();
    forgotStateRef.current = { email: "", otp: "", token: "", source: "", localOtp: "" };
  }, [clearForgotErrors]);

  const openForgotModal = useCallback(() => {
    setForgotOpen(true);
    resetForgotModal();
  }, [resetForgotModal]);

  const closeForgotModal = useCallback(() => {
    setForgotOpen(false);
    resetForgotModal();
  }, [resetForgotModal]);

  const loginSuperAdmin = useCallback(
    async (email, pwd) => {
      const db = JSON.parse(localStorage.getItem("roomhy_superadmin_db") || "null");

      if (!db && email === "roomhyadmin@gmail.com" && pwd === "admin@123") {
        const user = {
          id: "SUPER_ADMIN",
          loginId: "SUPER_ADMIN",
          email,
          name: "Super Admin",
          role: "superadmin"
        };
        sessionStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("staff_user", JSON.stringify(user));
        localStorage.setItem("staff_token", "superadmin_token");
        localStorage.setItem("token", "superadmin_token");
        sessionStorage.removeItem("owner_session");
        localStorage.removeItem("owner_user");
        window.location.href = resolvePanelPath("superadmin", "superadmin");
        return;
      }

      if (db && db.email === email && db.password === pwd) {
        const user = { ...db, loginId: db.loginId || db.id || "SUPER_ADMIN", role: "superadmin" };
        sessionStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("staff_user", JSON.stringify(user));
        localStorage.setItem("staff_token", "superadmin_token");
        localStorage.setItem("token", "superadmin_token");
        sessionStorage.removeItem("owner_session");
        localStorage.removeItem("owner_user");
        window.location.href = resolvePanelPath("superadmin", "superadmin");
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${apiUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: email, password: pwd }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.token && data.user) {
            localStorage.setItem("staff_user", JSON.stringify(data.user));
            localStorage.setItem("staff_token", data.token);
            sessionStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("token", data.token);
            sessionStorage.removeItem("owner_session");
            localStorage.removeItem("owner_user");
            window.location.href = resolvePanelPath("superadmin", "superadmin");
            return;
          }
        }
      } catch (err) {
        console.warn("[Staff Login] Backend API unavailable or slow:", err?.message);
      }

      showLoginError("Invalid credentials.");
    },
    [apiUrl, showLoginError]
  );

  const loginOwner = useCallback(
    (ownerId, pwd) => {
      const db = JSON.parse(localStorage.getItem("roomhy_owners_db") || "{}");
      let owner = db[ownerId];
      if (!owner) {
        const ownerKey = Object.keys(db).find((key) => key.toUpperCase() === ownerId.toUpperCase());
        owner = ownerKey ? db[ownerKey] : null;
      }

      if (!owner) {
        showLoginError("ID not found.");
        return;
      }

      const storedPass = owner.credentials?.password || owner.password;
      if (storedPass === pwd) {
        if (owner.credentials?.firstTime || !owner.passwordSet) {
          showLoginError("Please use the separate portal to set your password.");
          return;
        }

        sessionStorage.removeItem("manager_user");
        sessionStorage.removeItem("user");
        localStorage.removeItem("staff_user");
        localStorage.removeItem("staff_token");

        const sessionUser = {
          loginId: ownerId,
          role: "owner",
          ownerId,
          name: owner.profile?.name || "Owner"
        };
        sessionStorage.setItem("owner_session", JSON.stringify(sessionUser));
        localStorage.setItem("owner_user", JSON.stringify(sessionUser));
        window.location.href = resolvePanelPath("propertyowner", "admin");
        return;
      }

      showLoginError("Invalid credentials.");
    },
    [showLoginError]
  );

  const loginAreaManager = useCallback(
    (id, pwd) => {
      const db = JSON.parse(localStorage.getItem("roomhy_areamanagers_db") || "[]");
      const mgr = db.find((m) => (m.loginId || "").toUpperCase() === id.toUpperCase() && m.password === pwd);
      if (!mgr) {
        showLoginError("Invalid credentials.");
        return;
      }

      const user = { ...mgr, role: "areamanager" };
      user.areaCode = user.areaCode || user.area || user.areaName || "";
      user.areaName = user.areaName || user.area || "";
      sessionStorage.setItem("manager_user", JSON.stringify(user));
      sessionStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("staff_user", JSON.stringify(user));
      localStorage.setItem("staff_token", "manager_token");
      persistWindowSession(user);
      sessionStorage.removeItem("owner_session");
      localStorage.removeItem("owner_user");
      window.location.href = buildStaffRedirect(user);
    },
    [showLoginError]
  );

  const loginEmployee = useCallback(
    (id, pwd) => {
      const employees = JSON.parse(localStorage.getItem("roomhy_employees") || "[]");
      const emp = employees.find((e) => (e.loginId || "").toUpperCase() === id.toUpperCase() && e.password === pwd);
      if (!emp) {
        showLoginError("Invalid credentials.");
        return;
      }

      const user = {
        loginId: emp.loginId,
        name: emp.name,
        role: "employee",
        team: emp.team || emp.role || "Employee",
        permissions: emp.permissions || [],
        location: emp.location || emp.area || emp.areaName || "",
        area: emp.area || emp.areaName || "",
        areaName: emp.areaName || emp.area || "",
        areaCode: emp.areaCode || ""
      };

      sessionStorage.setItem("manager_user", JSON.stringify(user));
      sessionStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("staff_user", JSON.stringify(user));
      localStorage.setItem("staff_token", "employee_token");
      persistWindowSession(user);
      sessionStorage.removeItem("owner_session");
      localStorage.removeItem("owner_user");
      window.location.href = buildStaffRedirect(user);
    },
    [showLoginError]
  );

  const createTenantSessionAndRedirect = useCallback((tenant) => {
    sessionStorage.removeItem("manager_user");
    sessionStorage.removeItem("user");
    localStorage.removeItem("staff_user");
    localStorage.removeItem("staff_token");
    sessionStorage.removeItem("owner_session");
    localStorage.removeItem("owner_user");

    const tenantUser = {
      name: tenant.name || "Tenant",
      phone: tenant.phone || "",
      email: tenant.email || "",
      loginId: tenant.loginId,
      role: "tenant",
      tenantId: tenant.id || tenant._id || tenant.loginId,
      passwordSet: true
    };

    localStorage.setItem("tenant_user", JSON.stringify(tenantUser));
    localStorage.setItem("user", JSON.stringify(tenantUser));
    window.location.href = resolvePanelPath("tenant", "tenantdashboard");
  }, []);

  const loginTenant = useCallback(
    (id, pwd) => {
      const tenants = JSON.parse(localStorage.getItem("roomhy_tenants") || "[]");
      const tenantIdx = tenants.findIndex((t) => (t.loginId || "").toUpperCase() === String(id || "").toUpperCase());

      if (tenantIdx === -1) {
        showLoginError("Tenant ID not found.");
        return;
      }

      const tenant = tenants[tenantIdx];

      if (tenant.password && tenant.password === pwd) {
        createTenantSessionAndRedirect(tenant);
        return;
      }

      const isFirstTime =
        (tenant.tempPassword && tenant.tempPassword === pwd) && (tenant.status === "pending" || !tenant.passwordSet);

      if (isFirstTime) {
        const newPassword = prompt("Set your new password (minimum 6 characters):");
        if (newPassword === null) {
          showLoginError("Password setup cancelled.");
          return;
        }
        if (String(newPassword).trim().length < 6) {
          showLoginError("New password must be at least 6 characters.");
          return;
        }

        const confirmPassword = prompt("Confirm your new password:");
        if (confirmPassword === null) {
          showLoginError("Password setup cancelled.");
          return;
        }
        if (newPassword !== confirmPassword) {
          showLoginError("Passwords do not match.");
          return;
        }

        tenants[tenantIdx].password = newPassword;
        tenants[tenantIdx].tempPassword = null;
        tenants[tenantIdx].passwordSet = true;
        localStorage.setItem("roomhy_tenants", JSON.stringify(tenants));

        createTenantSessionAndRedirect(tenants[tenantIdx]);
        return;
      }

      showLoginError("Invalid credentials.");
    },
    [createTenantSessionAndRedirect, showLoginError]
  );

  const handleUnifiedLogin = useCallback(
    async (event) => {
      event?.preventDefault?.();
      const trimmedLogin = loginId.trim();
      const trimmedPassword = password.trim();

      setLoginError("");

      if (!trimmedLogin || !trimmedPassword) {
        showLoginError("Please fill in all fields.");
        return;
      }

      sessionStorage.removeItem("manager_user");
      sessionStorage.removeItem("user");
      localStorage.removeItem("owner_user");

      const up = trimmedLogin.toUpperCase();

      try {
        const mgrs = JSON.parse(localStorage.getItem("roomhy_areamanagers_db") || "[]");
        if (Array.isArray(mgrs) && mgrs.find((m) => (m.loginId || "").toUpperCase() === up)) {
          loginAreaManager(trimmedLogin, trimmedPassword);
          return;
        }
      } catch (e) {
        console.warn("Could not parse roomhy_areamanagers_db", e);
      }

      try {
        const emps = JSON.parse(localStorage.getItem("roomhy_employees") || "[]");
        if (Array.isArray(emps) && emps.find((e) => (e.loginId || "").toUpperCase() === up)) {
          loginEmployee(trimmedLogin, trimmedPassword);
          return;
        }
      } catch (e) {
        console.warn("Could not parse roomhy_employees", e);
      }

      try {
        const owners = JSON.parse(localStorage.getItem("roomhy_owners_db") || "{}");
        if (owners && (owners[trimmedLogin] || owners[up])) {
          loginOwner(trimmedLogin, trimmedPassword);
          return;
        }
      } catch (e) {
        console.warn("Could not parse roomhy_owners_db", e);
      }

      try {
        const tenants = JSON.parse(localStorage.getItem("roomhy_tenants") || "[]");
        if (Array.isArray(tenants) && tenants.find((t) => (t.loginId || "").toUpperCase() === up)) {
          loginTenant(trimmedLogin, trimmedPassword);
          return;
        }
      } catch (e) {
        console.warn("Could not parse roomhy_tenants", e);
      }

      if (trimmedLogin.includes("@")) {
        await loginSuperAdmin(trimmedLogin, trimmedPassword);
        return;
      }
      if (up.startsWith("ROOMHY")) {
        loginOwner(trimmedLogin, trimmedPassword);
        return;
      }
      if (up.startsWith("MGR")) {
        loginAreaManager(trimmedLogin, trimmedPassword);
        return;
      }
      if (up.startsWith("RY") || up.startsWith("EMP")) {
        loginEmployee(trimmedLogin, trimmedPassword);
        return;
      }
      if (up.startsWith("ROOMHYTNT") || up.startsWith("TNT")) {
        loginTenant(trimmedLogin, trimmedPassword);
        return;
      }

      showLoginError("Login ID format not recognized.");
    },
    [
      loginId,
      password,
      loginAreaManager,
      loginEmployee,
      loginOwner,
      loginTenant,
      loginSuperAdmin,
      showLoginError
    ]
  );

  const sendOtp = useCallback(async () => {
    clearForgotErrors();

    const email = forgotEmail.trim();
    if (!email) {
      setForgotErrors({ email: "Please enter your email address" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setForgotErrors({ email: "Please enter a valid email address" });
      return;
    }

    let staffFound = false;
    let staffType = "";

    const safeLocalStorageGet = (key) => {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.warn("[ForgotPassword] Tracking Prevention: Could not access", key);
        return null;
      }
    };

    try {
      const superAdminStr = safeLocalStorageGet("roomhy_superadmin_db");
      const superAdminDb = superAdminStr ? JSON.parse(superAdminStr) : null;
      if (superAdminDb && superAdminDb.email && superAdminDb.email.toLowerCase() === email.toLowerCase()) {
        staffFound = true;
        staffType = "superadmin";
      }
    } catch (e) {
      console.warn("[ForgotPassword] Could not check SuperAdmin DB", e);
    }

    if (!staffFound) {
      try {
        const managersStr = safeLocalStorageGet("roomhy_areamanagers_db");
        const managers = managersStr ? JSON.parse(managersStr) : [];
        if (Array.isArray(managers)) {
          const found = managers.find((m) => m.email && m.email.toLowerCase() === email.toLowerCase());
          if (found) {
            staffFound = true;
            staffType = "areamanager";
          }
        }
      } catch (e) {
        console.warn("[ForgotPassword] Could not check Area Managers DB", e);
      }
    }

    if (!staffFound) {
      try {
        const employeesStr = safeLocalStorageGet("roomhy_employees");
        const employees = employeesStr ? JSON.parse(employeesStr) : [];
        if (Array.isArray(employees)) {
          const found = employees.find((e) => e.email && e.email.toLowerCase() === email.toLowerCase());
          if (found) {
            staffFound = true;
            staffType = "employee";
          }
        }
      } catch (e) {
        console.warn("[ForgotPassword] Could not check Employees DB", e);
      }
    }

    try {
      const response = await fetch(`${apiUrl}/api/auth/forgot-password/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: staffFound ? staffType : "api" })
      });

      const data = await response.json();

      if (!response.ok) {
        if (!staffFound) {
          setForgotErrors({ email: data.message || "Email not found. Please check and try again." });
          return;
        }
      } else {
        staffFound = true;
        staffType = "verified";
      }
    } catch (err) {
      if (!staffFound) {
        setForgotErrors({ email: "Failed to connect. Please try again." });
        return;
      }
    }

    if (staffFound) {
      try {
        sessionStorage.setItem("forgotPasswordEmail", email);
      } catch (e) {
        console.warn("[ForgotPassword] Could not save to sessionStorage:", e);
      }

      forgotStateRef.current.email = email;
      forgotStateRef.current.source = staffType;

      if (["superadmin", "areamanager", "employee"].includes(staffType)) {
        const localOtp = String(Math.floor(100000 + Math.random() * 900000));
        forgotStateRef.current.localOtp = localOtp;
        console.log("[ForgotPassword] Generated Local OTP:", localOtp);
      }

      setForgotStep("otp");
    } else {
      setForgotErrors({ email: "Email not found in any staff system. Please check and try again." });
    }
  }, [apiUrl, clearForgotErrors, forgotEmail]);

  const verifyOtp = useCallback(async () => {
    clearForgotErrors();

    const otp = forgotOtp.trim();
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      setForgotErrors({ otp: "Please enter a valid 6-digit OTP" });
      return;
    }

    if (forgotStateRef.current.localOtp) {
      if (otp === forgotStateRef.current.localOtp) {
        forgotStateRef.current.token = `local_${Date.now()}`;
        setForgotStep("password");
        return;
      }
      setForgotErrors({ otp: "Invalid OTP. Please try again." });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/auth/forgot-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotStateRef.current.email, otp })
      });

      const data = await response.json();

      if (!response.ok) {
        setForgotErrors({ otp: data.message || "Invalid OTP. Please try again." });
        return;
      }

      forgotStateRef.current.token = data.token;
      setForgotStep("password");
    } catch (err) {
      setForgotErrors({ otp: "Failed to verify OTP. Please try again." });
    }
  }, [apiUrl, clearForgotErrors, forgotOtp]);

  const resetPassword = useCallback(async () => {
    clearForgotErrors();

    if (!forgotNewPassword) {
      setForgotErrors({ password: "Please enter a new password" });
      return;
    }

    if (forgotStateRef.current.source === "employee") {
      if (forgotNewPassword.length < 6) {
        setForgotErrors({ password: "Password must be at least 6 characters" });
        return;
      }
      if (forgotNewPassword !== forgotConfirmPassword) {
        setForgotErrors({ confirm: "Passwords do not match" });
        return;
      }

      try {
        const employeesStr = localStorage.getItem("roomhy_employees");
        const employees = employeesStr ? JSON.parse(employeesStr) : [];
        const employee = employees.find(
          (e) => e.email && e.email.toLowerCase() === forgotStateRef.current.email.toLowerCase()
        );

        if (employee) {
          employee.password = forgotNewPassword;
          localStorage.setItem("roomhy_employees", JSON.stringify(employees));
          closeForgotModal();
          alert("Password reset successfully! Please login with your new password.");
          return;
        }
        setForgotErrors({ password: "Employee record not found" });
        return;
      } catch (err) {
        setForgotErrors({ password: "Failed to update password" });
        return;
      }
    }

    if (forgotNewPassword.length < 6) {
      setForgotErrors({ password: "Password must be at least 6 characters" });
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotErrors({ confirm: "Passwords do not match" });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/auth/forgot-password/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotStateRef.current.email,
          token: forgotStateRef.current.token,
          newPassword: forgotNewPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setForgotErrors({ password: data.message || "Failed to reset password. Please try again." });
        return;
      }

      alert("Password reset successful! You can now login with your new password.");
      closeForgotModal();
    } catch (err) {
      setForgotErrors({ password: "Failed to reset password. Please try again." });
    }
  }, [
    apiUrl,
    clearForgotErrors,
    closeForgotModal,
    forgotConfirmPassword,
    forgotNewPassword
  ]);

  const backToEmail = useCallback(() => {
    resetForgotModal();
  }, [resetForgotModal]);

  return {
    apiUrl,
    loginId,
    password,
    loginError,
    setLoginId,
    setPassword,
    handleUnifiedLogin,
    forgotOpen,
    openForgotModal,
    closeForgotModal,
    forgotStep,
    forgotEmail,
    forgotOtp,
    forgotNewPassword,
    forgotConfirmPassword,
    forgotErrors,
    setForgotEmail,
    setForgotOtp,
    setForgotNewPassword,
    setForgotConfirmPassword,
    sendOtp,
    verifyOtp,
    resetPassword,
    backToEmail
  };
};



