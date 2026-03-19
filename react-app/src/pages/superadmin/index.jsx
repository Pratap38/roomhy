import React from "react";
import { useHeadAssets } from "../../utils/useHeadAssets.js";
import { useTailwindProcessor } from "../../utils/useTailwindProcessor.js";

const title = "RoomHy - Staff Login";
const metas = [
  {
    "charset": "UTF-8"
  },
  {
    "name": "viewport",
    "content": "width=device-width, initial-scale=1.0"
  }
];
const links = [
{
    "href": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
    "rel": "stylesheet"
  },
  {
    "rel": "stylesheet",
    "href": "/superadmin/assets/css/index.css"
  }
];
const scripts = [
  {
    "content": "// Suppress Tailwind CDN production warning BEFORE loading Tailwind\n        const originalWarn = console.warn;\n        const originalError = console.error;\n        console.warn = function(...args) {\n            const msg = args[0] ? String(args[0]) : '';\n            // Suppress Tailwind CDN warning\n            if (msg.includes('cdn.tailwindcss.com should not be used in production')) {\n                return;\n            }\n            if (msg.includes('should not be used in production')) {\n                return;\n            }\n            originalWarn.apply(console, args);\n        };\n        // Also suppress in console.error if needed\n        console.error = function(...args) {\n            const msg = args[0] ? String(args[0]) : '';\n            if (msg.includes('cdn.tailwindcss.com')) {\n                originalWarn('(Tailwind CDN warning suppressed in development mode)');\n                return;\n            }\n            originalError.apply(console, args);\n        };"
  },
  {
    "src": "https://cdn.tailwindcss.com"
  },
  {
    "src": "https://unpkg.com/lucide@latest"
  },
  {
    "content": "// API Configuration\n        // Use dedicated API host in production.\n        const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')\n            ? 'http://localhost:5001'\n            : 'https://api.roomhy.com';"
  },
  {
    "content": "// Seeder is only for local development (browser localStorage bootstrap).\n        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {\n            const seederScript = document.createElement('script');\n            seederScript.src = '../seeder.js';\n            document.head.appendChild(seederScript);\n        }"
  },
  {
    "src": "/superadmin/assets/js/index.js"
  }
];
const htmlAttrs = {
  "lang": "en"
};
const bodyAttrs = {
  "class": "flex items-center justify-center p-4"
};
const bodyHtml = `<div class="card-light w-full max-w-md p-8" id="login-container">
        <div class="text-center mb-8">
            <a href="/website/index.html" class="inline-flex items-center justify-center mb-4">
                <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" class="h-10 w-auto">
            </a>
            <h1 class="text-3xl font-bold text-gray-900 mb-1">Staff Login</h1>
            <p class="text-gray-500 text-sm">Enter your credentials to access Roomhy</p>
        </div>

        <!-- Unified Login Form -->
        <div id="login-form" class="fade-in">
            <form onsubmit="event.preventDefault(); handleUnifiedLogin();">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Login ID</label>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><i data-lucide="user" class="w-5 h-5"></i></span>
                        <input 
                            type="text" 
                            class="input-focus w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 transition-colors outline-none" 
                            id="login-id" 
                            placeholder="Enter your ID..." 
                            required
                            autocomplete="off"
                        >
                    </div>
                    <p class="text-xs text-gray-400 mt-1">Email, ID code, or account number</p>
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><i data-lucide="lock" class="w-5 h-5"></i></span>
                        <input 
                            type="password" 
                            class="input-focus w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 transition-colors outline-none" 
                            id="login-password" 
                            placeholder=""¢"¢"¢"¢"¢"¢"¢"¢" 
                            required
                            autocomplete="off"
                        >
                    </div>
                    <div id="error-msg" class="error-msg hidden"></div>
                </div>

                <button type="submit" class="btn-primary w-full text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center gap-2">
                    Login <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </button>
            </form>
            
            <div class="mt-6 text-center border-t border-gray-100 pt-4">
                <button type="button" class="text-sm font-medium text-indigo-600 hover:text-indigo-800" onclick="showForgotPasswordModal()">
                    Forgot Password?
                </button>
            </div>
        </div>
    </div>

    <!-- Forgot Password Modal -->
    <div id="forgot-password-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden" onclick="if(event.target.id === 'forgot-password-modal') closeForgotPasswordModal()">
        <div class="card-light w-full max-w-md p-8 mx-4 fade-in">
            <div class="text-center mb-6">
                <button type="button" class="float-right text-gray-400 hover:text-gray-600" onclick="closeForgotPasswordModal()">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
                <h2 class="text-2xl font-bold text-gray-900">Reset Password</h2>
                <p class="text-gray-500 text-sm mt-1">Enter your email to receive an OTP</p>
            </div>

            <!-- Step 1: Email Entry -->
            <form id="step-email" class="space-y-4" onsubmit="event.preventDefault(); sendOTP();">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input 
                        type="email" 
                        class="input-focus w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 transition-colors outline-none" 
                        id="forgot-email" 
                        placeholder="Enter your email..." 
                        required
                    >
                    <div id="forgot-email-error" class="error-msg hidden"></div>
                </div>
                <button type="submit" class="btn-primary w-full text-white font-bold py-3 rounded-lg transition-all">
                    Send OTP
                </button>
            </form>

            <!-- Step 2: OTP Verification -->
            <form id="step-otp" class="space-y-4 hidden" onsubmit="event.preventDefault(); verifyOTP();">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                    <p class="text-xs text-gray-400 mb-3">6-digit OTP sent to <span id="otp-email-display"></span></p>
                    <input 
                        type="text" 
                        class="input-focus w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 transition-colors outline-none text-center text-2xl tracking-widest" 
                        id="forgot-otp" 
                        placeholder="000000" 
                        maxlength="6"
                        required
                    >
                    <div id="forgot-otp-error" class="error-msg hidden"></div>
                </div>
                <button type="submit" class="btn-primary w-full text-white font-bold py-3 rounded-lg transition-all">
                    Verify OTP
                </button>
                <button type="button" class="w-full text-indigo-600 font-medium py-2 hover:text-indigo-800" onclick="backToEmail()">
                    Back
                </button>
            </form>

            <!-- Step 3: Password Reset -->
            <form id="step-password" class="space-y-4 hidden" onsubmit="event.preventDefault(); resetPassword();">
                <!-- Hidden username field for accessibility and password manager compatibility -->
                <input type="text" style="display:none;" autocomplete="username" id="forgot-username-field" value="">
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input 
                        type="password" 
                        class="input-focus w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 transition-colors outline-none" 
                        id="forgot-new-password" 
                        placeholder="Enter new password..." 
                        autocomplete="new-password"
                        required
                    >
                    <div id="forgot-password-error" class="error-msg hidden"></div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <input 
                        type="password" 
                        class="input-focus w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 transition-colors outline-none" 
                        id="forgot-confirm-password" 
                        placeholder="Confirm your password..." 
                        autocomplete="new-password"
                        required
                    >
                    <div id="forgot-confirm-error" class="error-msg hidden"></div>
                </div>
                <button type="submit" class="btn-primary w-full text-white font-bold py-3 rounded-lg transition-all">
                    Reset Password
                </button>
                <button type="button" class="w-full text-indigo-600 font-medium py-2 hover:text-indigo-800" onclick="backToEmail()">
                    Back
                </button>
            </form>
    </div>`;

export default function SuperadminIndexPage() {
  useHeadAssets({ title, metas, links, scripts, htmlAttrs, bodyAttrs, disableMobileSidebar: true });
  return (
    <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
  );
}
