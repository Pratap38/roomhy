import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useHeroSlideshow, useWebsiteCommon, useWebsiteMenu } from "../../utils/websiteUi";

export default function WebsiteSlider() {
  useWebsiteCommon();
  useWebsiteMenu();
  useHeroSlideshow();

  useHtmlPage({
    title: "Roomhy - Portal Select",
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
    "href": "/website/assets/css/slider.css"
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
                      
                      <div className="flex items-center space-x-4">
                          <a href="/website/index" className="flex items-center space-x-1 p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Go back to Home">
                              <i data-lucide="chevron-left" className="w-6 h-6 text-gray-800"></i>
                          </a>
                          <a href="/website/index" className="flex-shrink-0">
                              <span className="text-2xl font-extrabold text-blue-600">Roomhy</span>
                          </a>
                      </div>
                      
                      <div className="flex items-center gap-3 sm:gap-6">
                          <nav className="hidden lg:flex items-center space-x-6">
                              <a href="/website/about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">About Us</a>
                              <a href="/website/contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contact</a>
                          </nav>
      
                          
                          <a href="/website/index" className="flex-shrink-0 flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                              <i data-lucide="home" className="w-4 h-4"></i>
                              <span>Home</span>
                          </a>
                          
                          <button id="menu-toggle" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                              <i data-lucide="menu" className="w-7 h-7 text-gray-800"></i>
                          </button>
                      </div>
      
                  </div>
              </div>
          </header>
      
          <section className="relative py-16 md:py-20 text-white flex-shrink-0">
              <div id="hero-image-wrapper" className="absolute inset-0 w-full h-full overflow-hidden">
                  
                  <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto:format&fit=crop" alt="Hero background 1" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-100" />
                  
                  <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto:format&fit=crop" alt="Hero background 2" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-0" />
                  
                  <img src="https://images.unsplash.com/photo-1494203484021-3c454daf695d?q=80&w=2070&auto:format&fit-crop" alt="Hero background 3" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-0" />
      
                  <div className="absolute inset-0 w-full h-full bg-black/60"></div> 
              </div>
      
              <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
                  <h1 className="text-3xl md:text-5xl font-extrabold text-shadow mb-4" style={{ color: "#fffcf2" }}>
                      Welcome to the Roomhy Portal
                  </h1>
                  <p className="text-xl text-gray-200 text-shadow">Select your destination: Manage listings or post a new property.</p>
              </div>
          </section>
      
          
          <div id="menu-overlay" className="fixed inset-0 bg-black/50 z-40 hidden"></div>
          
          
          <div id="menu-logged-in" className="fixed top-0 right-0 w-80 h-full bg-white z-50 shadow-xl transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col hidden">
              <div className="flex justify-end p-4 flex-shrink-0">
                  <button id="menu-close" className="p-2">
                      <i data-lucide="x" className="w-6 h-6 text-gray-700"></i>
                  </button>
              </div>
      
              <div className="flex justify-between items-center px-6 py-2">
                  <div className="flex items-center space-x-3">
                      <div id="userAvatar" className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <i data-lucide="user" className="w-6 h-6 text-gray-600"></i>
                      </div>
                      <div>
                          <span id="welcomeUserName" className="text-lg font-semibold text-gray-800 block">Hi, User</span>
                          <span id="userIdDisplay" className="text-xs text-gray-600"></span>
                      </div>
                  </div>
                  <a href="/website/profile" className="text-sm font-medium text-blue-600 hover:underline">Profile</a>
              </div>
      
              <div className="px-6 py-4">
                  <div className="border border-blue-200 rounded-lg p-4 relative overflow-hidden">
                      <p className="font-semibold text-gray-800 mb-3 relative z-10">Looking to Sell/Rent your Property?</p>
                      <a href="/website/list" className="block text-center w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg text-sm transition-colors relative z-10 text-lg font-bold">
                          +
                      </a>
                  </div>
              </div>
      
              <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
                  <a href="/website/index" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="home" className="w-5 h-5 text-blue-600"></i>
                      </div>
                      <span>Our Properties</span>
                  </a>
                  <a href="/website/fav" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="heart" className="w-5 h-5 text-red-600"></i>
                      </div>
                      <span>Favorites</span>
                  </a>
                  <a href="/website/websitechat" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                       <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="message-circle" className="w-5 h-5 text-green-600"></i>
                      </div>
                      <span>Chat</span>
                  </a>
                  <a href="/website/mystays" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="building" className="w-5 h-5 text-purple-600"></i>
                      </div>
                      <span>My Stays</span>
                  </a>
                  <a href="/website/about" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="info" className="w-5 h-5 text-yellow-600"></i>
                      </div>
                      <span>About Us</span>
                  </a>
                  <a href="/website/contact" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="phone" className="w-5 h-5 text-cyan-600"></i>
                      </div>
                      <span>Contact Us</span>
                  </a>
              </nav>
              
              <div className="p-4 border-t flex-shrink-0">
                  <button onClick={function(event) { try { return Function('event', "globalLogout()").call(event.currentTarget, event); } catch (err) { console.error(err); } }} className="w-full flex items-center space-x-4 p-3 rounded-lg text-red-600 hover:bg-red-50">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="log-out" className="w-5 h-5 text-gray-600"></i>
                      </div>
                      <span>Logout</span>
                  </button>
              </div>
          </div>
      
          
          <div id="menu-logged-out" className="fixed top-0 right-0 w-80 h-full bg-white z-50 shadow-xl transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col">
              <div className="flex justify-end p-4 flex-shrink-0">
                  <button id="menu-close-logout" className="p-2">
                      <i data-lucide="x" className="w-6 h-6 text-gray-700"></i>
                  </button>
              </div>
      
              <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
                  <a href="/website/about" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="info" className="w-5 h-5 text-yellow-600"></i>
                      </div>
                      <span>About Us</span>
                  </a>
                  <a href="/website/contact" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="phone" className="w-5 h-5 text-cyan-600"></i>
                      </div>
                      <span>Contact Us</span>
                  </a>
              </nav>
              
              <div className="p-4 border-t flex-shrink-0 space-y-3">
                  <a href="/website/login" className="block w-full text-center bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-lg transition-colors">
                      Login
                  </a>
                  <a href="/website/signup" className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                      Sign Up
                  </a>
              </div>
          </div>
      
      
          <main className="container mx-auto px-4 sm:px-6 py-12 md:py-16 flex-grow">
      
              <div className="max-w-4xl mx-auto">
                  
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">What would you like to do?</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      
                      
                      <a href="/website/list" className="light-card flex flex-col items-center text-center p-8 rounded-xl cursor-pointer hover:shadow-xl transition-all duration-300 group">
                          <div className="p-4 bg-green-500 text-white rounded-full mb-6 group-hover:bg-green-600 transition-colors">
                              <i data-lucide="plus-square" className="w-10 h-10"></i>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">Post Property</h3>
                          <p className="text-gray-600 mb-6">List your room, PG, or apartment for free and connect with thousands of verified student tenants.</p>
                          <span className="inline-flex items-center text-green-600 font-semibold group-hover:text-green-700 transition-colors">
                              Start Listing
                              <i data-lucide="arrow-right" className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"></i>
                          </span>
                      </a>
                      
                      
                      <a href="/website/login" className="light-card flex flex-col items-center text-center p-8 rounded-xl cursor-pointer hover:shadow-xl transition-all duration-300 group">
                          <div className="p-4 bg-blue-500 text-white rounded-full mb-6 group-hover:bg-blue-600 transition-colors">
                              <i data-lucide="building-2" className="w-10 h-10"></i>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">View Listings</h3>
                          <p className="text-gray-600 mb-6">Manage your submitted properties, check lead enquiries, and update availability details.</p>
                          <span className="inline-flex items-center text-blue-600 font-semibold group-hover:text-blue-700 transition-colors">
                              Go to Dashboard
                              <i data-lucide="arrow-right" className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"></i>
                          </span>
                      </a>
      
                  </div>
              </div>
          </main>
      
          <a href="/website/contact" className="fixed bottom-6 right-6 z-50 p-4 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-transform hover:scale-110">
              <i data-lucide="message-circle" className="w-8 h-8"></i>
          </a>
      
          <footer className="footer flex-shrink-0 mt-auto">
              <div className="footer-bottom">
                  &copy; 2024 Roomhy. All rights reserved.
              </div>
          </footer>
      
          
      
    </div>
  );
}


