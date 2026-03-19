import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useHeroSlideshow, useWebsiteCommon, useWebsiteMenu } from "../../utils/websiteUi";

export default function WebsiteSignuprole() {
  useWebsiteCommon();
  useWebsiteMenu();
  useHeroSlideshow();

  useHtmlPage({
    title: "Roomhy - Sign Up As",
    bodyClass: "text-gray-800",
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
    "href": "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css",
    "crossorigin": "anonymous",
    "referrerpolicy": "no-referrer"
  },
  {
    "rel": "stylesheet",
    "href": "/website/assets/css/signuprole.css"
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
      
      
          
          <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-sm shadow-sm">
              <div className="container mx-auto px-4 sm:px-6">
                  <div className="flex h-20 items-center justify-between">
                      
                      <div className="flex items-center">
                          <a href="/website/index" className="flex-shrink-0">
                              
                              <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-10 w-25" />
                          </a>
                      </div>
                      
                      <div className="flex items-center gap-3 sm:gap-6">
                          <nav className="hidden lg:flex items-center space-x-6">
                              
                              <a href="/website/about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">About Us</a>
                              <a href="/website/index#faq" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">FAQ</a>
                              <a href="/website/contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contact</a>
                              <a href="/website/ourproperty" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Our Properties</a>
                          </nav>
      
                          
                          <a href="#" className="hidden lg:block bg-transparent border border-blue-600 hover:bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                              Login
                          </a>
                          
                          
                          <a href="/website/signuprole" className="flex-shrink-0 flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                              <span>Sign Up</span>
                          </a>
                          
                          
                          <button id="menu-toggle" className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden">
                              <i data-lucide="menu" className="w-7 h-7 text-gray-800"></i>
                          </button>
                      </div>
      
                  </div>
              </div>
          </header>
      
          
          <section className="relative py-20 md:py-28 text-white h-[350px] flex items-center">
              <div id="hero-image-wrapper" className="absolute inset-0 w-full h-full overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto:format&fit=crop" alt="Hero background" className="absolute inset-0 w-full h-full object-cover animate-kenburns opacity-100" />
                  <div className="absolute inset-0 w-full h-full bg-black/60"></div> 
              </div>
      
              <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
                  <h1 className="text-4xl md:text-5xl font-bold text-shadow mb-4">
                      Join Roomhy
                  </h1>
                  <p className="text-xl text-gray-200 font-medium">Choose your path to finding or listing the perfect student space.</p>
              </div>
          </section>
      
          
          <main className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
              <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
      
                  
                  <a href="/website/signup" className="block">
                      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-t-4 border-blue-600 p-8 flex flex-col items-center text-center h-full">
                          <div className="bg-blue-500 text-white p-5 rounded-full mb-6 flex-shrink-0">
                              <i data-lucide="graduation-cap" className="w-8 h-8"></i>
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign Up as a Student / Client</h2>
                          <p className="text-gray-600 mb-6 flex-grow">
                              Looking for a PG, Hostel, or flat? Find verified, brokerage-free accommodation near your college or coaching center.
                          </p>
                          <button className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                              Find My Home
                          </button>
                      </div>
                  </a>
      
                  
                  <a href="/website/slider" className="block">
                      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-t-4 border-green-600 p-8 flex flex-col items-center text-center h-full">
                          <div className="bg-green-500 text-white p-5 rounded-full mb-6 flex-shrink-0">
                              <i data-lucide="key-round" className="w-8 h-8"></i>
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign Up as an Owner / Lister</h2>
                          <p className="text-gray-600 mb-6 flex-grow">
                              Have a property? List your PG, hostel, or apartment for free and connect directly with thousands of verified student tenants.
                          </p>
                          <button className="w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors">
                              List My Property
                          </button>
                      </div>
                  </a>
      
              </div>
          </main>
          
          <a href="/website/websitechat" className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110">
              <i data-lucide="message-circle" className="w-8 h-8"></i>
          </a>
          
          
          <footer className="footer mt-16">
              <div className="container mx-auto px-4 sm:px-6">
                  <div className="footer-main">
                      <div className="footer-links">
                          <h4>Company</h4>
                          <ul>
                              <li><a href="/website/about">About Us</a></li>
                              <li><a href="/website/index#faq">FAQ</a></li>
                              <li><a href="/website/contact">Contact Us</a></li>
                          </ul>
                      </div>
                      <div className="footer-links">
                          <h4>Top Cities</h4>
                          <ul>
                              <li><a href="/website/ourproperty?city=kota">Kota</a></li>
                              <li><a href="/website/ourproperty?city=sikar">Sikar</a></li>
                              <li><a href="/website/ourproperty?city=indore">Indore</a></li>
                          </ul>
                      </div>
                      <div className="footer-links">
                          <h4>Legal</h4>
                          <ul>
                              <li><a href="#">Terms & Conditions</a></li>
                              <li><a href="#">Privacy Policy</a></li>
                          </ul>
                      </div>
                  </div>
              </div>
              <div className="footer-bottom">
                  <p>? 2025 <strong>Roomhy</strong>. All Rights Reserved.</p>
              </div>
          </footer>
          
      
      
    </div>
  );
}


