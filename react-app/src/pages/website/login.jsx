import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useWebsiteLogin } from "./useWebsiteLogin";
import { useWebsiteMenu, useWebsiteCommon } from "../../utils/websiteUi";

export default function WebsiteLogin() {
  useWebsiteCommon();
  useWebsiteMenu();
  const {
    email,
    password,
    setEmail,
    setPassword,
    handleSubmit,
    handleForgot
  } = useWebsiteLogin();

  useHtmlPage({
    title: "Roomhy - Login",
    bodyClass: "text-gray-800 flex flex-col min-h-screen",
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
    "href": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
    "rel": "stylesheet"
  },
  {
    "rel": "stylesheet",
    "href": "/website/assets/css/login.css"
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
      
      
          <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-sm shadow-sm flex-shrink-0">
              <div className="container mx-auto px-4 sm:px-6">
                  <div className="flex h-20 items-center justify-between">
                      <a href="/website/index" className="flex-shrink-0">
                          <img src="https://res.cloudinary.com/dpwgvcibj/raw/upload/v1768990275/roomhy/website/logo" alt="Roomhy Logo" className="h-10 w-auto" />
                      </a>
                      <nav className="hidden items-center space-x-6 lg:flex">
                          <a href="/website/about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">About Us</a>
                          <a href="/website/contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contact</a>
                           <a href="/website/login" className="text-blue-600 font-semibold transition-colors">Login</a>
                           <a href="/website/signup" className="ml-4 flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-blue-700">
                              Sign Up
                          </a>
                      </nav>
                      <button id="menu-toggle" className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden">
                          <i data-lucide="menu" className="w-7 h-7 text-gray-800"></i>
                      </button>
                  </div>
              </div>
          </header>
      
          <div id="menu-overlay" className="fixed inset-0 bg-black/50 z-40 hidden"></div>
          <div id="mobile-menu" className="fixed top-0 right-0 w-72 h-full bg-white z-50 shadow-xl transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col">
               <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
                  <h2 className="text-xl font-bold text-blue-600">Menu</h2>
                  <button id="menu-close" className="p-2"><i data-lucide="x" className="w-6 h-6 text-gray-700"></i></button>
              </div>
              <div className="p-4 border-b">
                  <p className="text-gray-600 text-sm">Welcome to Roomhy!</p>
                  <a href="/website/login" className="text-blue-600 font-semibold hover:underline">Login</a> or <a href="/website/signup" className="text-blue-600 font-semibold hover:underline">Sign Up</a>
              </div>
              <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                  <a href="/website/login" className="flex items-center space-x-3 p-3 rounded-lg text-blue-700 bg-blue-50 font-semibold">
                      <i data-lucide="log-in" className="w-5 h-5"></i><span>Login</span>
                  </a>
                  <a href="/website/signup" className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <i data-lucide="user-plus" className="w-5 h-5"></i><span>Sign Up</span>
                  </a>
                   <hr className="my-2" />
                   <a href="list-/website/property" className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600"><i data-lucide="building" className="w-5 h-5"></i><span>List Your Property</span></a>
                  <a href="/website/contact" className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600"><i data-lucide="life-buoy" className="w-5 h-5"></i><span>Support</span></a>
                   <a href="/website/about" className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600"><i data-lucide="info" className="w-5 h-5"></i><span>About Us</span></a>
                  <a href="/website/contact" className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600"><i data-lucide="mail" className="w-5 h-5"></i><span>Contact Us</span></a>
              </nav>
              </div>
      
          <main className="px-4 sm:px-6">
      
              <div className="w-full max-w-md"> <div className="light-card rounded-xl p-8 md:p-10">
                      <div className="text-center mb-8">
                           <a href="/website/index" className="inline-block mb-6">
                              <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-10 w-25 mx-auto" />
                          </a>
                          <h1 className="text-2xl font-bold text-gray-900">Sign in to Roomhy</h1>
                          <p className="text-gray-500 mt-1">Access your account and bookings.</p>
                      </div>
      
                      <form id="login-form" action="#" className="space-y-6" onSubmit={handleSubmit}>
                          <div>
                              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                              <div className="relative mt-1 rounded-md shadow-sm input-group">
                                   <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200">
                                      <i data-lucide="mail" className="w-5 h-5 text-gray-400"></i>
                                   </span>
                                  <input
                                      type="email"
                                      id="email"
                                      name="email"
                                      required
                                      autoComplete="email"
                                      className="form-input block w-full border-gray-300 rounded-md py-3 pl-10 pr-3"
                                      placeholder="you@example.com"
                                      value={email}
                                      onChange={(e) => setEmail(e.target.value)}
                                  />
                              </div>
                          </div>
      
                           <div>
                              <div className="flex justify-between items-center mb-1">
                                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                                  <button type="button" id="forgotBtn" className="text-sm text-blue-600 hover:underline font-medium" onClick={handleForgot}>Forgot?</button>
                              </div>
                               <div className="relative mt-1 rounded-md shadow-sm input-group">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200">
                                      <i data-lucide="lock" className="w-5 h-5 text-gray-400"></i>
                                   </span>
                                  <input
                                      type="password"
                                      id="password"
                                      name="password"
                                      required
                                      autoComplete="current-password"
                                      className="form-input block w-full border-gray-300 rounded-md py-3 pl-10 pr-3"
                                      placeholder="Enter password"
                                      value={password}
                                      onChange={(e) => setPassword(e.target.value)}
                                  />
                              </div>
                          </div>
      
                          <div>
                              <button type="submit" className="w-full inline-flex items-center justify-center py-3 px-6 border border-transparent shadow-sm text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors space-x-2 mt-4">
                                   <i data-lucide="log-in" className="w-5 h-5"></i>
                                  <span>Sign In</span>
                              </button>
                          </div>
                      </form>
      
                      <div className="mt-8 text-center border-t border-gray-200 pt-6">
                          <p className="text-sm text-gray-600">
                              Don't have an account?
                              <a href="/website/signup" className="font-medium text-blue-600 hover:underline">
                                  Create one now
                              </a>
                          </p>
                      </div>
                  </div>
              </div>
      
          </main>
      
          <footer className="bg-gray-800 text-gray-300 flex-shrink-0">
              <div className="container mx-auto px-6 py-16">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
                      <div className="md:col-span-1"><a href="/website/index" className="mb-4 inline-block"><img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-10 w-25" /></a><p className="text-gray-400 text-sm">Your trusted partner in finding the perfect student accommodation. Live, learn, and grow with us.</p><div className="flex space-x-5 mt-6"><a href="#" className="text-gray-400 hover:text-white transition-colors"><i data-lucide="facebook" className="w-5 h-5"></i></a><a href="#" className="text-gray-400 hover:text-white transition-colors"><i data-lucide="instagram" className="w-5 h-5"></i></a><a href="#" className="text-gray-400 hover:text-white transition-colors"><i data-lucide="twitter" className="w-5 h-5"></i></a></div></div>
                      <div><h4 className="font-semibold text-lg mb-5 text-white">Explore</h4><ul className="space-y-3"><li><a href="/website/list" className="text-gray-300 hover:text-white transition-colors">Apartments</a></li><li><a href="/website/list" className="text-gray-300 hover:text-white transition-colors">Hostels</a></li><li><a href="/website/list" className="text-gray-300 hover:text-white transition-colors">Co-Living</a></li><li><a href="/website/list" className="text-gray-300 hover:text-white transition-colors">PGs</a></li></ul></div>
                      <div><h4 className="font-semibold text-lg mb-5 text-white">Company</h4><ul className="space-y-3"><li><a href="/website/about" className="text-gray-300 hover:text-white transition-colors">About Us</a></li><li><a href="list-/website/property" className="text-gray-300 hover:text-white transition-colors">List Your Property</a></li><li><a href="#" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li><li><a href="#" className="text-gray-300 hover:text-white transition-colors">Terms of Service</a></li></ul></div>
                      <div><h4 className="font-semibold text-lg mb-5 text-white">Get in Touch</h4><ul className="space-y-3"><li className="flex items-start space-x-2"><i data-lucide="mail" className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0"></i><a href="mailto:support@roomhy.com" className="text-gray-300 hover:text-white transition-colors">support@roomhy.com</a></li><li className="flex items-start space-x-2"><i data-lucide="phone" className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0"></i><a href="tel:+911234567890" className="text-gray-300 hover:text-white transition-colors">+91 12345 67890</a></li><li className="flex items-start space-x-2"><i data-lucide="map-pin" className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0"></i><span className="text-gray-300">Bengaluru, India</span></li></ul></div>
                  </div>
                  <div className="mt-12 border-t border-gray-700 pt-8 text-center text-gray-400 text-sm"><p>&copy; 2025 Roomhy. All Rights Reserved. Built with ?? for students.</p></div>
              </div>
          </footer>
      
      
          
      
    </div>
  );
}


