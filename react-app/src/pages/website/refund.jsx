import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useHeroSlideshow, useWebsiteCommon, useWebsiteMenu } from "../../utils/websiteUi";

export default function WebsiteRefund() {
  useWebsiteCommon();
  useWebsiteMenu();
  useHeroSlideshow();

  useHtmlPage({
    title: "Refund Policy - Roomhy",
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
    "href": "/website/assets/css/refund.css"
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
                      Refund Policy
                  </h1>
                  <p className="text-lg text-gray-200 max-w-2xl mx-auto mb-6">
                      Effective Date: 1st Aug 2025.
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
                      <h1>Refund Policy "? Roomhy</h1>
                      <p><strong>Effective Date: 1st Aug 2025</strong></p>
                      <p>At Roomhy, our mission is to make student housing simple, transparent, and broker-free. We work hard to ensure every listing, booking, and transaction on our platform is smooth and reliable. This Refund Policy explains when you may be eligible for a refund.</p>
      
                      <h2>Definitions</h2>
                      <ul>
                          <li><strong>"Roomhy", "We", "Us", or "Our"</strong> refers to Roomhy Technologies and its associated services.</li>
                          <li><strong>"User", "You", or "Your"</strong> refers to any individual or entity using the platform, including students, tenants, and property owners.</li>
                          <li><strong>"Platform"</strong> refers to Roomhy's website, mobile application, and related services.</li>
                      </ul>
      
                      <h2>One-Time Setup Fee</h2>
                      <ul>
                          <li>The setup fee is non-refundable once your property listing is verified and published on the Roomhy platform.</li>
                          <li>If you request cancellation before verification and listing go live, you are eligible for a full refund.</li>
                      </ul>
      
                      <h2>Booking Cancellations</h2>
                      <ul>
                          <li>If a booking is cancelled before confirmation, any charges collected by Roomhy (if applicable) will be refunded.</li>
                          <li>Once a booking is confirmed and the property has been marked as occupied, refunds will not be processed.</li>
                      </ul>
      
                      <h2>Student Users</h2>
                      <ul>
                          <li>Students do not pay any platform usage charges to Roomhy, so no refunds are applicable.</li>
                          <li>Any disputes related to rent advances or deposits paid to property owners must be resolved directly between the student and the owner.</li>
                      </ul>
      
                      <h2>Exceptional Circumstances</h2>
                      <p>Refunds may be issued in the following rare cases:</p>
                      <ul>
                          <li>A technical error caused an incorrect or duplicate charge.</li>
                          <li>A payment was processed for a cancelled or unconfirmed booking.</li>
                      </ul>
                      <p>In such cases, refunds will be processed within 7"?10 business days to the original payment method.</p>
      
                      <h2>Contact Us</h2>
                      <p>For any refund queries or requests, please contact:</p>
                      <p>
                          ?? <a href="mailto:hello@roomhy.com">hello@roomhy.com</a><br />
                          ?? +91-9983005030
                      </p>
      
                      <h2>Policy Updates</h2>
                      <p>Roomhy may update this policy from time to time. The latest version will always be available on our website.</p>
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
                  <li><a href="/website/contact">Contact Us</a></li>
                  <li><a href="/website/about">About Us</a></li>
                  <li><a href="/website/index">Our Properties</a></li>
                </ul>
              </div>
          
              <div className="footer-legal">
                <h4>Legal</h4>
                <ul>
                  <li><a href="/website/terms">Terms & Conditions</a></li>
                  <li><a href="/website/privacy">Privacy Policy</a></li>
                  <li><a href="/website/cancellation">Cancellation Policy</a></li>
                  <li><a href="/website/refund" className="text-blue-400 font-semibold">Refund Policy</a></li>
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


