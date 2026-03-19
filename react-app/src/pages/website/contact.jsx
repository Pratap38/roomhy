import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useHeroSlideshow, useWebsiteCommon, useWebsiteMenu } from "../../utils/websiteUi";

export default function WebsiteContact() {
  useWebsiteCommon();
  useWebsiteMenu();
  useHeroSlideshow();

  useHtmlPage({
    title: "Contact Us - Roomhy",
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
    "content": "width=device-width, initial-scale-1.0"
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
    "href": "/website/assets/css/contact.css"
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
                          <a href="/website/index" className="flex-shrink-0"> <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-10 w-25" />
                          </a>
                      </div>
                      
                      <div className="flex items-center gap-3 sm:gap-6">
                          <nav className="hidden lg:flex items-center space-x-6">
                              <a href="/website/about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">About Us</a>
                              <a href="/website/contact" className="text-blue-600 font-semibold transition-colors">Contact</a> </nav>
      
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
          <section className="relative py-20 md:py-28 text-white"> <div id="hero-image-wrapper" className="absolute inset-0 w-full h-full overflow-hidden">
                  
                  <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto:format&fit=crop" alt="Hero background 1" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-100" />
                  
                  <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto:format&fit=crop" alt="Hero background 2" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-0" />
                  
                  <img src="https://images.unsplash.com/photo-1494203484021-3c454daf695d?q=80&w=2070&auto:format&fit=crop" alt="Hero background 3" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-0" />
      
                  <div className="absolute inset-0 w-full h-full bg-black/60"></div> 
              </div>
      
              <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
                  <h1 className="text-4xl md:text-5xl font-bold text-shadow mb-4" style={{ color: "#fffcf2" }}>
                      Contact Us
                  </h1>
                  <p className="text-lg text-gray-200 max-w-2xl mx-auto">
                      We're here to help! Whether you have a question about a property, need support, or just want to say hello, feel free to reach out.
                  </p>
              </div>
          </section>
          <div id="menu-overlay" className="fixed inset-0 bg-black/50 z-40 hidden"></div>
          
          <div id="mobile-menu" className="fixed top-0 right-0 w-80 h-full bg-white z-50 shadow-xl transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col">
              <div className="flex justify-end p-4 flex-shrink-0">
                  <button id="menu-close" className="p-2">
                      <i data-lucide="x" className="w-6 h-6 text-gray-700"></i>
                  </button>
              </div>
      
              <div className="flex justify-between items-center px-6 py-2">
                  <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <i data-lucide="users" className="w-6 h-6 text-gray-600"></i>
                      </div>
                      <span className="text-lg font-semibold text-gray-800">Hi,welcome ??</span>
                  </div>
                  <a href="#" className="text-sm font-medium text-blue-600 hover:underline">Profile</a>
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
                  <a href="/website/index" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600"> <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="home" className="w-5 h-5 text-blue-600"></i>
                      </div>
                      <span>Our Properties</span>
                  </a>
                  <a href="#" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="heart" className="w-5 h-5 text-red-600"></i>
                      </div>
                      <span>Favorites</span>
                  </a>
                  <a href="#" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                       <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="message-square" className="w-5 h-5 text-green-600"></i>
                      </div>
                      <span>Chats</span>
                  </a>
                  <a href="#" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="building" className="w-5 h-5 text-purple-600"></i>
                      </div>
                      <span>My Stays</span>
                  </a>
                  <a href="/website/about" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600"> <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="info" className="w-5 h-5 text-yellow-600"></i>
                      </div>
                      <span>About Us</span>
                  </a>
                  <a href="/website/contact" className="flex items-center space-x-4 p-3 rounded-lg text-blue-600 bg-blue-50"> <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="phone" className="w-5 h-5 text-cyan-600"></i>
                      </div>
                      <span>Contact Us</span>
                  </a>
              </nav>
              
              <div className="p-4 border-t flex-shrink-0">
                  <a href="#" className="flex items-center space-x-4 p-3 rounded-lg text-red-600 hover:bg-red-50">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="log-out" className="w-5 h-5 text-gray-600"></i>
                      </div>
                      <span>Logout</span>
                  </a>
              </div>
          </div>
          <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-16">
      
              <section className="container mx-auto px-4 sm:px-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="light-card p-6 rounded-xl flex items-start space-x-4">
                          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                              <i data-lucide="mail" className="w-6 h-6"></i>
                          </div>
                          <div>
                              <h3 className="text-lg font-semibold text-gray-900">Email Us</h3>
                              <p className="text-gray-500 mt-1">Send your questions to our support team.</p>
                              <a href="mailto:hello@roomhy.com" className="text-blue-600 font-medium hover:underline mt-2 inline-block">hello@roomhy.com</a>
                          </div>
                      </div>
                      <div className="light-card p-6 rounded-xl flex items-start space-x-4">
                          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30">
                              <i data-lucide="phone" className="w-6 h-6"></i>
                          </div>
                          <div>
                              <h3 className="text-lg font-semibold text-gray-900">Call Us</h3>
                              <p className="text-gray-500 mt-1">We're available from 10 AM to 7 PM IST.</p>
                              <a href="tel:+919983005030" className="text-blue-600 font-medium hover:underline mt-2 inline-block">+91 99830 05030</a>
                          </div>
                      </div>
                      <div className="light-card p-6 rounded-xl flex items-start space-x-4">
                          <div className="bg-gradient-to-br from-purple-500 to-violet-600 text-white w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                              <i data-lucide="map-pin" className="w-6 h-6"></i>
                          </div>
                          <div>
                              <h3 className="text-lg font-semibold text-gray-900">Our Office</h3>
                              <p className="text-gray-500 mt-1">123, Vijay Nagar, Indore, MP, India</p>
                              <a href="#map" className="text-blue-600 font-medium hover:underline mt-2 inline-block">Get Directions</a>
                          </div>
                      </div>
                  </div>
              </section>
      
              <section id="contact-form" className="scroll-mt-20">
                  <div className="max-w-3xl mx-auto">
                      <div className="text-center">
                          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Send Us a Message</h2>
                          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">Fill out the form below, and we'll get back to you shortly.</p>
                      </div>
                      <div className="light-card p-8 md:p-12 rounded-2xl">
                          <form className="space-y-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                  <div>
                                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                      <input type="text" id="name" name className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Your Name" />
                                  </div>
                                   <div>
                                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                      <input type="email" id="email" name="email" className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="you@example.com" />
                                  </div>
                              </div>
                              <div>
                                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                  <textarea id="message" name="message" rows="4" className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="How can we help you?"></textarea>
                              </div>
                              <div className="text-center pt-4">
                                  <button type="submit" className="glow-button text-white px-8 py-3 rounded-lg font-semibold text-lg" style={{ background: "linear-gradient(90deg, #06b6d4, #3b82f6)", boxShadow: "0 4px 14px 0 rgba(59, 130, 246, 0.39)" }}>Send Message</button>
                              </div>
                          </form>
                      </div>
                  </div>
              </section>
      
              <section id="map" className="scroll-mt-20">
                   <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200" style={{ height: "450px" }}>
                      <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117763.5671783515!2d75.7925619171732!3d22.72403607166164!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3962fcad1b410ddb%3A0x96ec4da356240f4!2sIndore%2C%20Madhya%20Pradesh%2C%20India!5e0!3m2!1sen!2sus!4v1678888888888!5m2!1sen!2sus" width="100%" height="100%" style={{ border: "0" }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade">
                      </iframe>
                   </div>
              </section>
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
                  <li><a href="#">Terms & Conditions</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Cancellation Policy</a></li>
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


