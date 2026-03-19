import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useHeroSlideshow, useWebsiteCommon, useWebsiteMenu } from "../../utils/websiteUi";

export default function WebsiteTerms() {
  useWebsiteCommon();
  useWebsiteMenu();
  useHeroSlideshow();

  useHtmlPage({
    title: "Terms & Conditions - Roomhy",
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
    "href": "/website/assets/css/terms.css"
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
                              <a href="/website/contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contact</a>
                          </nav>
      
                          <a href="/website/list" className="flex-shrink-0 flex items-center space-x-1 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                              <i data-lucide="plus-circle" className="w-4 h-4"></i>
                              <span>Post <span className="hidden sm:inline">Your</span> Property</span>
                          </a>
                          
                          <button id="menu-toggle" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                              <i data-lucide="menu" className="w-7 h-7 text-gray-800"></i>
                          </button>
                      </div>
      
                  </div>
              </div>
          </header>
          
          
          
      
      
          
          
          
          <section className="relative py-20 md:py-28 text-white">
              <div id="hero-image-wrapper" className="absolute inset-0 w-full h-full overflow-hidden">
                  
                  <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto:format&fit=crop" alt="Hero background 1" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-100" />
                  
                  <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto:format&fit=crop" alt="Hero background 2" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-0" />
                  
                  <img src="https://images.unsplash.com/photo-1494203484021-3c454daf695d?q=80&w=2070&auto:format&fit=crop" alt="Hero background 3" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-0" />
      
                  <div className="absolute inset-0 w-full h-full bg-black/60"></div> 
              </div>
      
              
              <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
                  <h1 className="text-4xl md:text-5xl font-bold text-shadow mb-4" style={{ color: "#fffcf2" }}>
                      Terms & Conditions
                  </h1>
                  <p className="text-lg text-gray-200 max-w-2xl mx-auto mb-6">
                      Effective Date: 1st Aug 2025. Please read our terms carefully.
                  </p>
      
                  
                  <div className="relative w-full max-w-2xl mx-auto">
                      <input type="text" placeholder="Search for 'PG near me' or 'Hostel in Kota'" className="w-full p-4 pl-5 pr-14 rounded-lg bg-white text-gray-900 border-transparent focus:ring-4 focus:ring-cyan-300/50 focus:outline-none placeholder-gray-500 shadow-lg" />
                      <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                          <i data-lucide="search" className="w-5 h-5 text-white"></i>
                      </button>
                  </div>
                  
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
      
      
          
          
          
          <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
              
              <div className="light-card rounded-2xl p-6 md:p-10 lg:p-12 max-w-4xl mx-auto">
                  <article className="prose max-w-none">
                      <h1>Terms & Conditions "? Roomhy</h1>
                      <p><strong>Effective Date: 1st Aug 2025</strong></p>
                      <p>Welcome to Roomhy. By using our platform (website or mobile app), you agree to comply with and be bound by these Terms & Conditions. Please read them carefully.</p>
      
                      <h2>Definitions</h2>
                      <ul>
                          <li><strong>"Roomhy", "We", "Us", or "Our"</strong> refers to Roomhy Technologies and its associated services.</li>
                          <li><strong>"User", "You", or "Your"</strong> refers to any individual or entity using the platform, including students, tenants, and property owners.</li>
                          <li><strong>"Platform"</strong> refers to Roomhy's website, mobile application, and related services.</li>
                      </ul>
      
                      <h2>Scope of Services</h2>
                      <p>Roomhy provides an online platform that connects students seeking accommodation with property owners through a transparent, broker-free, and real-time bidding process. We do not own, manage, or operate the properties listed on our platform.</p>
      
                      <h2>User Eligibility</h2>
                      <ul>
                          <li>You must be at least 18 years old or have parental/guardian consent to use our platform.</li>
                          <li>You agree to provide accurate, complete, and current information during registration and property listing.</li>
                      </ul>
      
                      <h2>Property Listings</h2>
                      <ul>
                          <li>Property owners must ensure all listings are truthful, with accurate descriptions, real photographs, and correct pricing.</li>
                          <li>Roomhy reserves the right to verify, edit, reject, or remove any listing that violates our guidelines or is reported as fraudulent.</li>
                      </ul>
      
                      <h2>Bidding & Booking</h2>
                      <ul>
                          <li>Students can place bids on available properties. Property owners may accept, reject, or counter a bid.</li>
                          <li>Once a booking is confirmed through the platform, both parties are bound to honour the terms of that booking.</li>
                      </ul>
      
                      <h2>Payments</h2>
                      <ul>
                          <li>All payments processed through Roomhy's platform are handled via secure third-party payment gateways.</li>
                          <li>Any rent, deposits, or other payments between students and property owners must follow the agreed terms at booking.</li>
                          <li>Roomhy is not responsible for rent collection or disputes arising from direct payments made outside the platform.</li>
                      </ul>
      
                      <h2>Cancellations & Refunds</h2>
                      <ul>
                          <li>Roomhy's <a href="#">Refund Policy</a> applies to all transactions and is available on our website.</li>
                          <li>Cancellations by either party must be communicated promptly through the platform.</li>
                      </ul>
      
                      <h2>User Responsibilities</h2>
                      <p>You agree not to:</p>
                      <ul>
                          <li>Post false, misleading, or offensive content.</li>
                          <li>Engage in unlawful activities, fraud, or harassment of other users.</li>
                          <li>Circumvent the platform to avoid paying applicable fees.</li>
                      </ul>
      
                      <h2>Privacy</h2>
                      <p>Your use of the platform is subject to our <a href="/website/privacy">Privacy Policy</a>, which explains how we collect, store, and process your personal data.</p>
      
                      <h2>Limitation of Liability</h2>
                      <ul>
                          <li>Roomhy is an intermediary platform and is not responsible for the condition, safety, or legal compliance of any property.</li>
                          <li>We are not liable for any disputes, damages, or losses arising from transactions between users.</li>
                      </ul>
      
                      <h2>Intellectual Property</h2>
                      <p>All content, branding, and technology used on the platform are the property of Roomhy and may not be copied, distributed, or reproduced without prior written consent.</p>
      
                      <h2>Termination of Use</h2>
                      <p>Roomhy may suspend or terminate your account if you violate these Terms & Conditions or engage in prohibited conduct.</p>
      
                      <h2>Governing Law</h2>
                      <p>These Terms & Conditions are governed by and construed in accordance with the laws of India, and any disputes shall be subject to the jurisdiction of the courts in New Delhi.</p>
      
                      <h2>Contact Us</h2>
                      <p>For any questions or concerns regarding these Terms & Conditions, contact us at:</p>
                      <p>
                          ?? <a href="mailto:hello@roomhy.com">hello@roomhy.com</a><br />
                          ?? +91-9983005030
                      </p>
                  </article>
              </div>
      
          </main>
          
          
          
      
      
          
          
          
          <a href="#" className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110">
              <i data-lucide="message-circle" className="w-8 h-8"></i>
          </a>
          
          
          
      
      
          
          
          
         <footer className="footer">
            <div className="footer-top">
              <h2>Our Presence</h2>
              <div className="footer-presence">
                <div>
                  <h4>Kota</h4>
                  <ul>
                    <li><a href="#">Hostels in Kota</a></li>
                    <li><a href="#">Apartments in Kota</a></li>
                    <li><a href="#">PG in Kota</a></li>
                  </ul>
                </div>
                <div>
                  <h4>Indore</h4>
                  <ul>
                    <li><a href="#">Hostels in Indore</a></li>
                    <li><a href="#">Apartments in Indore</a></li>
                    <li><a href="#">PG in Indore</a></li>
                  </ul>
                </div>
                <div>
                  <h4>Ahmedabad</h4>
                  <ul>
                    <li><a href="#">Hostels in Ahmedabad</a></li>
                    <li><a href="#">Apartments in Ahmedabad</a></li>
                    <li><a href="#">PG in Ahmedabad</a></li>
                  </ul>
                </div>
              </div>
            </div>
          
            <div className="footer-main">
              <div className="footer-logo">
                <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-10 w-25" />
                <p>Discover Your Next Home, Together.</p>
              </div>
          
              <div className="footer-links">
                <h4>Quick Links</h4>
                <ul>
                  <li><a href="/website/index">Find a Room</a></li>
                  <li><a href="/website/about">Our Story</a></li>
                  <li><a href="/website/contact">Contact Support</a></li>
                  <li><a href="/website/terms">Terms and Conditions</a></li>
                  <li><a href="/website/privacy">Privacy Policy</a></li>
                  <li><a href="/website/cancellation">Cancellation Policy</a></li>
                </ul>
              </div>
          
              <div className="footer-legal">
                <h4>Legal</h4>
                <ul>
                  
                  <li><a href="/website/terms" className="text-blue-400 font-semibold">Terms & Conditions</a></li>
                  <li><a href="/website/privacy">Privacy Policy</a></li>
                  <li><a href="/website/cancellation">Cancellation Policy</a></li>
                  <li><a href="#">Refund Policy</a></li>
                </ul>
              </div>
          
              <div className="footer-contact">
                <h4>Contact</h4>
                <p><i className="fas fa-phone"></i> +91 99830 05030</p>
                <p><i className="fas fa-envelope"></i> hello@roomhy.com</p>
                <div className="footer-social">
                  <a href="#" title="Facebook"><i className="fab fa-facebook-f"></i></a>
                  <a href="#" title="X"><i className="fab fa-x-twitter"></i></a>
                  <a href="#" title="Instagram"><i className="fab fa-instagram"></i></a>
                  <a href="#" title="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
                  <a href="#" title="YouTube"><i className="fab fa-youtube"></i></a>
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


