import React, { useEffect, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";

const resolvePanelPath = (folder, fileName) => {
  const path = (window.location.pathname || "").toLowerCase();
  if (path.includes(`/${folder}/`)) {
    return `/${folder}/${fileName}`;
  }
  return `/${fileName}`;
};

export default function Ownerlogin() {
  useHtmlPage({
    title: "Roomhy - Owner Login",
    bodyClass: "flex items-center justify-center min-h-screen p-4",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/propertyowner/assets/css/ownerlogin.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [step, setStep] = useState("login");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState("loginId");
  const [forgotLoginId, setForgotLoginId] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotToken, setForgotToken] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState("");

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [step, forgotOpen, forgotStep]);

  const storeAuth = (data) => {
    if (!data?.token || !data?.user) return;
    localStorage.setItem("token", data.token);
    sessionStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    sessionStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("owner_user", JSON.stringify(data.user));
    sessionStorage.setItem("owner_session", JSON.stringify(data.user));
  };

  const handleLogin = async () => {
    if (!loginId || !password) {
      setErrorMsg("Please enter your login ID and password.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      const data = await fetchJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: loginId, password })
      });
      storeAuth(data);
      window.location.href = resolvePanelPath("propertyowner", "admin");
    } catch (err) {
      try {
        await fetchJson("/api/auth/owner/verify-temp", {
          method: "POST",
          body: JSON.stringify({ loginId, tempPassword: password })
        });
        setStep("setPassword");
      } catch (verifyErr) {
        setErrorMsg(verifyErr?.body || verifyErr?.message || err?.body || err?.message || "Invalid credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const setOwnerPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      const data = await fetchJson("/api/auth/owner/set-password", {
        method: "POST",
        body: JSON.stringify({ loginId, tempPassword: password, newPassword })
      });
      storeAuth(data);
      window.location.href = resolvePanelPath("propertyowner", "admin");
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const openForgot = () => {
    setForgotOpen(true);
    setForgotStep("loginId");
    setForgotLoginId("");
    setForgotOtp("");
    setForgotToken("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotError("");
  };

  const closeForgot = () => {
    setForgotOpen(false);
  };

  const requestOwnerOtp = async () => {
    if (!forgotLoginId) {
      setForgotError("Please enter your owner login ID.");
      return;
    }
    setForgotError("");
    setLoading(true);
    try {
      await fetchJson("/api/auth/owner/forgot-password/request-otp", {
        method: "POST",
        body: JSON.stringify({ loginId: forgotLoginId })
      });
      setForgotStep("otp");
    } catch (err) {
      setForgotError(err?.body || err?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOwnerOtp = async () => {
    if (!forgotOtp || forgotOtp.length !== 6) {
      setForgotError("Enter a valid 6-digit OTP.");
      return;
    }
    setForgotError("");
    setLoading(true);
    try {
      const data = await fetchJson("/api/auth/owner/forgot-password/verify-otp", {
        method: "POST",
        body: JSON.stringify({ loginId: forgotLoginId, otp: forgotOtp })
      });
      setForgotToken(data?.token || "");
      setForgotStep("reset");
    } catch (err) {
      setForgotError(err?.body || err?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const resetOwnerPassword = async () => {
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError("Password must be at least 6 characters.");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Passwords do not match.");
      return;
    }
    setForgotError("");
    setLoading(true);
    try {
      await fetchJson("/api/auth/owner/forgot-password/reset-password", {
        method: "POST",
        body: JSON.stringify({ loginId: forgotLoginId, token: forgotToken, newPassword: forgotNewPassword })
      });
      closeForgot();
    } catch (err) {
      setForgotError(err?.body || err?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="html-page">
      <div className="light-card w-full max-w-md p-8 text-center relative overflow-hidden">
        <div className="text-3xl font-bold text-blue-600 mb-2">Roomhy</div>

        {step === "login" && (
          <div className="fade-in">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Portal Login</h1>
            <p className="text-gray-500 mb-6">Enter your Owner ID generated from Enquiry.</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 text-left mb-2">Login ID</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><i data-lucide="user" className="w-5 h-5"></i></span>
                <input
                  type="text"
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-blue-500 transition-colors"
                  placeholder="e.g. ROOMHY001"
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value)}
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 text-left mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><i data-lucide="key" className="w-5 h-5"></i></span>
                <input
                  type="password"
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-blue-500 transition-colors"
                  placeholder="********"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="mt-2 text-right">
                <button type="button" onClick={openForgot} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Forgot Password?
                </button>
              </div>
            </div>

            {errorMsg && <div className="error-msg mb-3">{errorMsg}</div>}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
            >
              {loading ? "Logging in..." : "Login"} <i data-lucide="arrow-right" className="w-4 h-4"></i>
            </button>
          </div>
        )}

        {step === "setPassword" && (
          <div className="fade-in">
            <div className="flex justify-center mb-4"><div className="bg-green-100 p-3 rounded-full"><i data-lucide="lock" className="w-8 h-8 text-green-600"></i></div></div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Set New Password</h1>
            <p className="text-gray-500 mb-6">This is your first login. Please set a new password.</p>

            <div className="mb-4 text-left">
              <label className="text-sm font-medium text-gray-700 mb-2 block">New Password</label>
              <input
                type="password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                placeholder="Min 6 chars"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>
            <div className="mb-6 text-left">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Confirm Password</label>
              <input
                type="password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            {errorMsg && <div className="error-msg mb-3">{errorMsg}</div>}

            <button
              type="button"
              onClick={setOwnerPassword}
              disabled={loading}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors flex justify-center items-center gap-2"
            >
              {loading ? "Saving..." : "Update & Continue"} <i data-lucide="arrow-right" className="w-4 h-4"></i>
            </button>
          </div>
        )}
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(event) => {
          if (event.target.id === "forgot-modal") closeForgot();
        }} id="forgot-modal">
          <div className="bg-white w-full max-w-md rounded-xl border border-gray-200 shadow-xl p-6 relative">
            <button type="button" onClick={closeForgot} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
              <i data-lucide="x" className="w-5 h-5"></i>
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h2>
            <p className="text-sm text-gray-500 mb-5">Follow the steps to reset your owner password.</p>

            {forgotStep === "loginId" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner Login ID</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 transition-colors"
                    placeholder="e.g. ROOMHY1234"
                    value={forgotLoginId}
                    onChange={(event) => setForgotLoginId(event.target.value)}
                  />
                </div>
                {forgotError && <div className="error-msg">{forgotError}</div>}
                <button type="button" onClick={requestOwnerOtp} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </div>
            )}

            {forgotStep === "otp" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 transition-colors tracking-widest text-center"
                    placeholder="6-digit OTP"
                    value={forgotOtp}
                    onChange={(event) => setForgotOtp(event.target.value)}
                  />
                </div>
                {forgotError && <div className="error-msg">{forgotError}</div>}
                <button type="button" onClick={verifyOwnerOtp} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            )}

            {forgotStep === "reset" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 transition-colors"
                    placeholder="Min 6 characters"
                    value={forgotNewPassword}
                    onChange={(event) => setForgotNewPassword(event.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 transition-colors"
                    placeholder="Re-enter password"
                    value={forgotConfirmPassword}
                    onChange={(event) => setForgotConfirmPassword(event.target.value)}
                  />
                </div>
                {forgotError && <div className="error-msg">{forgotError}</div>}
                <button type="button" onClick={resetOwnerPassword} className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition-colors">
                  {loading ? "Saving..." : "Set New Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


