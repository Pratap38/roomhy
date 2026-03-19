import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { setWebsiteSession, getWebsiteApiUrl } from "../../utils/websiteSession";
import { useHeroSlideshow, useWebsiteCommon, useWebsiteMenu } from "../../utils/websiteUi";

export default function WebsiteSignup() {
  useWebsiteCommon();
  useWebsiteMenu();
  useHeroSlideshow();

  const apiUrl = useMemo(() => getWebsiteApiUrl(), []);
  const [signupActive, setSignupActive] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [loginCodeSent, setLoginCodeSent] = useState(false);
  const [signup, setSignup] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: ""
  });
  const [otp, setOtp] = useState("");
  const [pendingPayload, setPendingPayload] = useState(null);
  const [verificationVisible, setVerificationVisible] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingLoginSend, setLoadingLoginSend] = useState(false);
  const [loadingLoginVerify, setLoadingLoginVerify] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const mode = String(params.get("mode") || "").toLowerCase();
    if (mode === "signup") {
      setSignupActive(true);
    } else if (mode === "login") {
      setSignupActive(false);
    }
  }, []);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
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

  const scrollToAuth = useCallback(() => {
    if (window.innerWidth <= 768) {
      document.getElementById("auth-container")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const toggleSignup = useCallback(
    (value) => {
      setSignupActive(value);
      if (value) {
        setLoginCodeSent(false);
        setLoginOtp("");
      }
      scrollToAuth();
    },
    [scrollToAuth]
  );

  const handleLoginRequestCode = useCallback(
    async (event) => {
      event.preventDefault();
      const email = String(loginEmail || "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        showToast("Please enter your Gmail ID", "error");
        return;
      }
      setLoadingLoginSend(true);
      try {
        const response = await fetch(`${apiUrl}/api/kyc/login/request-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          showToast(data.message || "Unable to send login code", "error");
          return;
        }
        setLoginEmail(email);
        setLoginCodeSent(true);
        showToast("Verification code sent to your Gmail. Enter the code to login.", "success");
      } catch (err) {
        showToast("Unable to send login code right now. Please try again.", "error");
      } finally {
        setLoadingLoginSend(false);
      }
    },
    [apiUrl, loginEmail, showToast]
  );

  const handleLoginVerify = useCallback(
    async (event) => {
      event.preventDefault();
      const email = String(loginEmail || "").trim().toLowerCase();
      const otpValue = String(loginOtp || "").trim();
      if (!email || !email.includes("@")) {
        showToast("Please enter your Gmail ID", "error");
        return;
      }
      if (!/^\d{6}$/.test(otpValue)) {
        showToast("Enter a valid 6-digit verification code", "error");
        return;
      }
      setLoadingLoginVerify(true);
      try {
        const response = await fetch(`${apiUrl}/api/kyc/login/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: otpValue })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.token || !data.user) {
          showToast(data.message || "Invalid verification code", "error");
          return;
        }
        setWebsiteSession(data.user, data.token);
        showToast("Login successful! Redirecting...", "success");
        setTimeout(() => {
          redirectAfterLogin(data.user);
        }, 800);
      } catch (err) {
        showToast("Unable to login right now. Please try again.", "error");
      } finally {
        setLoadingLoginVerify(false);
      }
    },
    [apiUrl, loginEmail, loginOtp, redirectAfterLogin, showToast]
  );

  const handleSignupChange = useCallback((field, value) => {
    setSignup((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSignupSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const payload = {
        firstName: signup.firstName.trim(),
        lastName: signup.lastName.trim(),
        email: signup.email.trim().toLowerCase(),
        phone: signup.phone.trim(),
        password: signup.password
      };
      if (!payload.firstName || !payload.email || !payload.phone || !payload.password) {
        showToast("Please fill required fields", "error");
        return;
      }
      if (!/^\d{10}$/.test(payload.phone)) {
        showToast("Enter a valid 10-digit phone number", "error");
        return;
      }
      setLoadingCreate(true);
      try {
        const res = await fetch(`${apiUrl}/api/kyc/signup/request-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Unable to send verification code");
        }
        setPendingPayload(payload);
        setVerificationVisible(true);
        showToast("Verification code sent to your Gmail. Enter the code to continue.", "success");
      } catch (err) {
        showToast(err.message || "Unable to send verification code", "error");
      } finally {
        setLoadingCreate(false);
      }
    },
    [apiUrl, signup, showToast]
  );

  const handleVerify = useCallback(async () => {
    if (!pendingPayload) {
      showToast("Please click Create Account first", "error");
      return;
    }
    const otpValue = otp.trim();
    if (!/^\d{6}$/.test(otpValue)) {
      showToast("Enter a valid 6-digit verification code", "error");
      return;
    }
    setLoadingVerify(true);
    try {
      const res = await fetch(`${apiUrl}/api/kyc/signup/verify-and-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pendingPayload, otp: otpValue })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Unable to verify code");
      }
      if (data.user && data.token) {
        setWebsiteSession(data.user, data.token);
      }
      showToast(data.message || "Account created successfully", "success");
      setTimeout(() => {
        window.location.href = "/website/index";
      }, 900);
    } catch (err) {
      showToast(err.message || "Unable to verify code", "error");
    } finally {
      setLoadingVerify(false);
    }
  }, [apiUrl, otp, pendingPayload, showToast]);

  useHtmlPage({
    title: "Roomhy | Light & Blue Edition",
    bodyClass: "",
    htmlAttrs: {
  "lang": "en",
  "class": "scroll-smooth"
},
    metas: [
  {
    "charset": "UTF-8"
  },
  {
    "name": "viewport",
    "content": "width=device-width, initial-scale=1.0"
  }
],
    bases: [],
    links: [
  {
    "rel": "preconnect",
    "href": "https://fonts.googleapis.com"
  },
  {
    "rel": "preconnect",
    "href": "https://fonts.gstatic.com",
    "crossorigin": true
  },
  {
    "href": "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
    "rel": "stylesheet"
  },
  {
    "rel": "stylesheet",
    "href": "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
  },
  {
    "rel": "stylesheet",
    "href": "/website/assets/css/signup.css"
  }
],
    styles: [],
    scripts: [
  {
    "src": "https://cdn.tailwindcss.com"
  },
  {
    "src": "https://unpkg.com/lucide@latest"
  }
],
    inlineScripts: []
  });

  return (
    <div className="html-page">
      
      
          
          <div id="mobile-menu-overlay" className="fixed inset-0 bg-black/50 z-50 hidden transition-opacity duration-300 opacity-0"></div>
          <div id="mobile-menu-drawer" className="fixed top-0 right-0 w-72 sm:w-80 h-full bg-white z-[60] shadow-2xl translate-x-full transition-transform duration-300 ease-in-out p-6 flex flex-col">
              <div className="flex justify-between items-center mb-8">
                  <span className="text-xl font-bold text-slate-900">Roomhy Menu</span>
                  <button id="menu-close" className="p-2 text-slate-600 bg-slate-50 rounded-lg"><i data-lucide="x"></i></button>
              </div>
              <nav className="flex flex-col gap-5 text-base sm:text-lg font-semibold text-slate-700">
                  <a href="/website/about" className="flex items-center gap-3 p-2 hover:text-blue-600 transition-colors"><i data-lucide="info" className="w-5 h-5"></i> About Us</a>
                  <a href="/website/contact" className="flex items-center gap-3 p-2 hover:text-blue-600 transition-colors"><i data-lucide="phone" className="w-5 h-5"></i> Contact Us</a>
                  <a href="/website/websitechat" className="flex items-center gap-3 p-2 hover:text-blue-600 transition-colors"><i data-lucide="message-circle" className="w-5 h-5"></i> Chat</a>
                  <a href="#" className="flex items-center gap-3 p-2 hover:text-blue-600 transition-colors"><i data-lucide="building" className="w-5 h-5"></i> Properties</a>
                  <a href="#auth-container" className="bg-blue-600 text-white text-center py-3.5 rounded-xl mt-4 shadow-lg active:scale-95 transition-transform">Login / Sign Up</a>
              </nav>
              <div className="mt-auto pt-8 border-t border-slate-100 flex justify-center gap-6">
                  <a href="#" className="text-slate-400"><i className="fab fa-facebook-f"></i></a>
                  <a href="#" className="text-slate-400"><i className="fab fa-instagram"></i></a>
                  <a href="#" className="text-slate-400"><i className="fab fa-twitter"></i></a>
              </div>
          </div>
      
          
          <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm shadow-sm">
              <div className="container mx-auto px-4 sm:px-6">
                  <div className="flex h-16 md:h-20 items-center justify-between">
                      <div className="flex items-center">
                          <a href="#" className="flex items-center gap-2 active:scale-95 transition-transform">
                              <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                                  <i data-lucide="home" className="text-white w-5 h-5 md:w-6 md:h-6"></i>
                              </div>
                              <span className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">Roomhy</span>
                          </a>
                      </div>
                      
                      <div className="flex items-center gap-3 sm:gap-6">
                          <nav className="hidden lg:flex items-center space-x-8">
                              <a href="/website/about" className="text-gray-600 hover:text-blue-600 font-semibold transition-colors text-sm">About Us</a>
                              <a href="/website/contact" className="text-gray-600 hover:text-blue-600 font-semibold transition-colors text-sm">Contact Us</a>
                          </nav>
                          <a href="#auth-container" className="hidden sm:inline-flex bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95">
                              Login/Signup
                          </a>
                          <button id="menu-toggle" className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-slate-800 active:scale-90 transition-transform"><i data-lucide="menu"></i></button>
                      </div>
                  </div>
              </div>
          </header>
      
          
          <section className="relative py-16 md:py-32 text-white overflow-hidden min-h-[350px] md:min-h-0">
              <div id="hero-image-wrapper" className="absolute inset-0 w-full h-full overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980" alt="Hero 1" className="absolute inset-0 w-full h-full object-cover animate-kenburns opacity-100 transition-opacity duration-1000" />
                  <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070" alt="Hero 2" className="absolute inset-0 w-full h-full object-cover animate-kenburns opacity-0 transition-opacity duration-1000" />
                  <div className="absolute inset-0 w-full h-full bg-black/50"></div> 
              </div>
      
              <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
                  <h1 className="text-xl sm:text-3xl md:text-5xl font-black mb-6 md:mb-10 tracking-tight text-white uppercase px-2" style={{ textShadow: "0 4px 10px rgba(0,0,0,0.3)" }}>
                      SEARCH . CONNECT . SUCCEED
                  </h1>
                  <div className="relative w-full max-w-2xl mx-auto px-1 md:px-0">
                      <input type="text" placeholder="PG, Hostel or Apartment..." className="w-full p-4 md:p-5 pl-5 md:pl-7 pr-14 md:pr-16 rounded-xl md:rounded-2xl bg-white text-gray-900 focus:ring-4 focus:ring-blue-500/30 outline-none shadow-2xl text-sm md:text-base" />
                      <button type="submit" className="absolute right-3 md:right-3 top-1/2 -translate-y-1/2 p-2.5 md:p-3 bg-blue-600 hover:bg-blue-700 rounded-lg md:rounded-xl transition-all shadow-lg active:scale-90">
                          <i data-lucide="search" className="w-5 h-5 md:w-6 md:h-6 text-white"></i>
                      </button>
                  </div>
                  <p className="mt-4 md:mt-6 text-xs md:text-sm text-white/80 font-medium md:font-semibold">500+ Verified Spaces Available in Kota & Indore</p>
              </div>
          </section>
      
          
          <main className="py-10 md:py-24 container mx-auto px-4 sm:px-6 flex justify-center">
              <div id="auth-container" className={`scroll-mt-24 sm:scroll-mt-32 ${signupActive ? "signup-active" : ""}`}>
                  
                  <div className="form-panel">
                      <div className="w-full max-w-sm relative h-full">
                          
                          
                          <div id="login-form-content" className="form-content">
                              <div className="w-full">
                                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Log in</h2>
                                  <p className="text-sm md:text-base text-slate-500 mb-6 md:mb-8 font-medium">Welcome back! Please enter your details.</p>
      
                                  <form className="space-y-4 md:space-y-5" onSubmit={loginCodeSent ? handleLoginVerify : handleLoginRequestCode}>
                                      <div className="space-y-1.5">
                                          <label className="text-xs md:text-sm font-bold text-slate-700 ml-1">Gmail ID</label>
                                          <input
                                              type="email"
                                              autoComplete="email"
                                              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-50/50 outline-none transition-all"
                                              placeholder="Enter your Gmail ID"
                                              value={loginEmail}
                                              onChange={(e) => setLoginEmail(e.target.value)}
                                          />
                                      </div>
                                      {loginCodeSent && (
                                      <div className="space-y-1.5">
                                          <label className="text-xs md:text-sm font-bold text-slate-700 ml-1">Verification Code</label>
                                          <input
                                              type="text"
                                              inputMode="numeric"
                                              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-50/50 outline-none transition-all"
                                              placeholder="Enter 6-digit code"
                                              value={loginOtp}
                                              onChange={(e) => setLoginOtp(e.target.value)}
                                          />
                                      </div>
                                      )}
                                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-[0.98]" disabled={loginCodeSent ? loadingLoginVerify : loadingLoginSend}>
                                          {loginCodeSent
                                            ? (loadingLoginVerify ? "Verifying..." : "Verify & Log in")
                                            : (loadingLoginSend ? "Sending Code..." : "Send Login Code")}
                                      </button>
                                      {loginCodeSent && (
                                        <button
                                          type="button"
                                          className="w-full text-sm text-blue-600 font-bold hover:underline"
                                          onClick={handleLoginRequestCode}
                                          disabled={loadingLoginSend}
                                        >
                                          {loadingLoginSend ? "Sending..." : "Resend Code"}
                                        </button>
                                      )}
                                  </form>
                                  
                                  <div className="relative my-7">
                                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                                      <div className="relative flex justify-center"><span className="bg-white px-4 text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">OR CONTINUE WITH</span></div>
                                  </div>
                                  
                                  <button type="button" className="w-full flex items-center justify-center gap-3 p-3.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-semibold text-slate-700 active:scale-[0.98]" onClick={() => showToast("Use your Gmail ID above. We will send a verification code if it exists in new signups.", "info")}>
                                      <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-5 h-5" alt="G" /> Google
                                  </button>
      
                                  <p className="text-center mt-8 text-slate-600 font-medium text-sm md:text-base">
                                      Don't have an account? <button id="show-signup-btn" type="button" className="text-blue-600 font-bold hover:underline" onClick={() => toggleSignup(true)}>Sign up</button>
                                  </p>
                              </div>
                          </div>
      
                          
                          <div id="signup-form-content" className="form-content">
                              <div className="w-full">
                                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Create Account</h2>
                                  <p className="text-sm md:text-base text-slate-500 mb-6 md:mb-8 font-medium">Join Roomhy today!</p>
      
                                  <form id="signup-form" className="space-y-4" onSubmit={handleSignupSubmit}>
                                      <div className="grid grid-cols-2 gap-3">
                                          <input id="firstName" name="firstName" type="text" autoComplete="given-name" placeholder="First Name" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-sm md:text-base" required value={signup.firstName} onChange={(e) => handleSignupChange("firstName", e.target.value)} />
                                          <input id="lastName" name="lastName" type="text" autoComplete="family-name" placeholder="Last Name" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-sm md:text-base" value={signup.lastName} onChange={(e) => handleSignupChange("lastName", e.target.value)} />
                                      </div>
                                      <input id="email" name="email" type="email" autoComplete="email" placeholder="Email" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-sm md:text-base" required value={signup.email} onChange={(e) => handleSignupChange("email", e.target.value)} />
                                      <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="Phone Number" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-sm md:text-base" pattern="[0-9]{10}" minLength="10" maxLength="10" required value={signup.phone} onChange={(e) => handleSignupChange("phone", e.target.value)} />
                                      <input id="password" name="password" type="password" autoComplete="new-password" placeholder="Password" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-sm md:text-base" required value={signup.password} onChange={(e) => handleSignupChange("password", e.target.value)} />
                                      <div id="verificationBlock" className={`${verificationVisible ? "space-y-3" : "hidden space-y-3"}`}>
                                          <input id="verificationCode" name="verificationCode" type="text" placeholder="Enter Verification Code" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-sm md:text-base" minLength="6" maxLength="6" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)} />
                                          <button type="button" id="verifyAccountBtn" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg transition-all active:scale-[0.98]" onClick={handleVerify} disabled={loadingVerify}>{loadingVerify ? "Verifying..." : "Verify & Create Account"}</button>
                                      </div>
                                      <button type="submit" id="createAccountBtn" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg transition-all active:scale-[0.98]" disabled={loadingCreate}>{loadingCreate ? "Sending Code..." : (pendingPayload ? "Resend Code" : "Create Account")}</button>
                                  </form>
                                  <p className="text-center mt-8 text-slate-600 font-medium text-sm md:text-base">
                                      Already member? <button id="show-login-btn" type="button" className="text-blue-600 font-bold hover:underline" onClick={() => toggleSignup(false)}>Log in</button>
                                  </p>
                              </div>
                          </div>
      
                      </div>
                  </div>
      
                  <div className="image-panel">
                      <div className="max-w-xs px-2">
                          <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-5 md:mb-8 shadow-xl">
                              <i data-lucide="sparkles" className="text-blue-600 w-8 h-8 md:w-12 md:h-12"></i>
                          </div>
                          <h2 className="text-xl md:text-3xl font-black mb-3 md:mb-4">Zero Brokerage.</h2>
                          <p className="text-xs md:text-lg font-medium opacity-80 mb-6 md:mb-8 leading-relaxed">Find verified hostles and PGs without paying extra fees.</p>
                          <div className="flex justify-center gap-2">
                              <span className="w-8 h-1.5 md:h-2 bg-blue-600 rounded-full transition-all duration-300"></span>
                              <span className="w-1.5 md:w-2 h-1.5 md:h-2 bg-blue-200 rounded-full"></span>
                              <span className="w-1.5 md:w-2 h-1.5 md:h-2 bg-blue-200 rounded-full"></span>
                          </div>
                      </div>
                  </div>
              </div>
          </main>
      
          
          <footer className="footer">
            <div className="footer-top">
              <h2 className="text-lg md:text-xl font-black uppercase tracking-widest text-slate-900 mb-8 md:mb-12">Our Presence</h2>
              <div className="footer-presence">
                <div className="flex-1 min-w-[120px]">
                  <h4>Kota</h4>
                  <ul className="text-sm md:text-base">
                    <li><a href="#">Hostels</a></li>
                    <li><a href="#">Apartments</a></li>
                    <li><a href="#">PG Rooms</a></li>
                  </ul>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <h4>Indore</h4>
                  <ul className="text-sm md:text-base">
                    <li><a href="#">Hostels</a></li>
                    <li><a href="#">Apartments</a></li>
                    <li><a href="#">PG Rooms</a></li>
                  </ul>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <h4>Ahmedabad</h4>
                  <ul className="text-sm md:text-base">
                    <li><a href="#">Hostels</a></li>
                    <li><a href="#">Apartments</a></li>
                    <li><a href="#">PG Rooms</a></li>
                  </ul>
                </div>
              </div>
            </div>
          
              <div className="footer-main container mx-auto">
              <div className="footer-logo">
                <div className="flex items-center gap-2 mb-4">
                    <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-10 w-auto" />
                </div>
                <p className="text-slate-500 font-medium text-sm md:text-base">Discover Your Next Home, Together.</p>
              </div>
          
              <div className="footer-links">
                <h4>Quick Links</h4>
                <ul className="font-medium text-sm md:text-base">
                  <li><a href="/website/contact">Contact Us</a></li>
                  <li><a href="/website/about">About Us</a></li>
                  <li><a href="#">Our Properties</a></li>
                </ul>
              </div>
          
              <div className="footer-legal">
                <h4>Legal</h4>
                <ul className="font-medium text-sm md:text-base">
                  <li><a href="#">Terms & Conditions</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Refund Policy</a></li>
                </ul>
              </div>
          
              <div className="footer-contact">
                <h4>Contact</h4>
                <p className="font-bold text-slate-800 mb-1 text-sm md:text-base"><i className="fas fa-phone mr-2 text-blue-600"></i> +91 99830 05030</p>
                <p className="font-medium text-slate-500 mb-5 text-sm md:text-base"><i className="fas fa-envelope mr-2 text-blue-600"></i> hello@roomhy.com</p>
                <div className="footer-social">
                  <a href="#"><i className="fab fa-facebook-f"></i></a>
                  <a href="#"><i className="fab fa-instagram"></i></a>
                  <a href="#"><i className="fab fa-linkedin-in"></i></a>
                </div>
              </div>
            </div>
          
            <div className="py-6 border-t border-slate-100 text-center text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest px-4">
              ? 2025 Roomhy Housing Solutions. All Rights Reserved.
            </div>
          </footer>

          {toast && (
              <div
                  className="fixed top-5 right-5 z-[100] px-4 py-3 rounded-lg text-white text-sm shadow-lg"
                  style={{
                    background:
                      toast.type === "error"
                        ? "#ef4444"
                        : toast.type === "success"
                          ? "#10b981"
                          : "#3b82f6"
                  }}
              >
                {toast.message}
              </div>
          )}
      
          
      
    </div>
  );
}


