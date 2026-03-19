import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useHeroSlideshow, useWebsiteCommon, useWebsiteMenu } from "../../utils/websiteUi";

export default function WebsiteAbout() {
  useWebsiteCommon();
  useWebsiteMenu();
  useHeroSlideshow();

  useHtmlPage({
    title: "About Roomhy - Our Mission, Vision, and Values",
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
    "href": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lexend:wght@400;500;600;700;800&display=swap",
    "rel": "stylesheet"
  },
  {
    "rel": "stylesheet",
    "href": "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
  },
  {
    "rel": "stylesheet",
    "href": "/website/assets/css/about.css"
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
                          <a href="#" className="flex-shrink-0">
                              <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-10 w-25" />
                          </a>
                      </div>
                      
                      <div className="flex items-center gap-3 sm:gap-6">
                          <nav className="hidden lg:flex items-center space-x-6">
                              <a href="/website/about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">About Us</a>
                              <a href="/website/contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contact</a>
                          </nav>
      
                          <a href="#register-property" className="flex-shrink-0 flex items-center space-x-1 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
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
          
          <section className="relative py-20 md:py-36 text-white">
              
              <div id="hero-image-wrapper" className="absolute inset-0 w-full h-full overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto:format&fit=crop" alt="Hero background 1" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-100" />
                  <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto:format&fit=crop" alt="Hero background 2" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-0" />
                  <img src="https://images.unsplash.com/photo-1494203484021-3c454daf695d?q=80&w=2070&auto:format&fit=crop" alt="Hero background 3" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-0" />
                  
                  <div className="absolute inset-0 w-full h-full bg-black/60"></div> 
              </div>
      
              
              <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-shadow mb-6 animate-slide-in" style={{ color: "#fffcf2", animationDelay: "100ms" }}>
                      About Roomhy
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto text-shadow animate-slide-in" style={{ animationDelay: "200ms" }}>
                      We're making student housing smarter, simpler, and broker-free.
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
                      <span className="text-lg font-semibold text-gray-800">Hi,welcome 👋</span>
                  </div>
                  <a href="#" className="text-sm font-medium text-blue-600 hover:underline">Profile</a>
              </div>
      
              <div className="px-6 py-4">
                  <div className="border border-blue-200 rounded-lg p-4 relative overflow-hidden">
                      <p className="font-semibold text-gray-800 mb-3 relative z-10">Looking to Sell/Rent your Property?</p>
                      <a href="#register-property" className="block text-center w-full text-gray-800 font-medium py-2 px-4 rounded-lg text-sm hover:text-blue-600 transition-colors relative z-10 border border-gray-300">
                          +
                      </a>
                  </div>
              </div>
      
              <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
                  <a href="#" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
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
                  <a href="#why-roomhy" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
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
                  <a href="../propertyowner//website/websitechat" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="message-circle" className="w-5 h-5 text-green-600"></i>
                      </div>
                      <span>Chat Support</span>
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
      
      
          
          <main className="container mx-auto px-4 sm:px-6 py-8 md:py-16 space-y-16 md:space-y-24 flex-grow"> 
      
              
              <section id="welcome" className="scroll-mt-20 light-card rounded-2xl p-6 md:p-10">
                  <div className="grid lg:grid-cols-2 lg:gap-16 lg:items-center">
                       <div className="animate-slide-in">
                          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Welcome to Roomhy. <br />Where your budget meets <span className="text-purple-600">your next home.</span></h2>
                          <div className="space-y-4 text-lg text-gray-600">
                              <p>At Roomhy's, we're making student housing smarter, simpler, and broker-free. Whether you're looking for a PG, hostel, or co-living space, Roomhy lets you bid in <strong>real-time</strong>, directly with property owners"no middlemen, no markups.</p>
                              <p>From flexible stays to verified listings and instant negotiations, we're flipping the rental game for students across India. Our platform is built for <strong>transparency, trust, and tech-first convenience</strong>"because finding a room shouldn't feel like a chore.</p>
                              <p>Whether it's your first room near campus or a co-living space with friends, Roomhy ensures you bid smart, live better.</p>
                          </div>
                       </div>
                       
                      <div className="w-full h-96 grid grid-cols-5 grid-rows-3 gap-3 mt-8 lg:mt-0 animate-slide-in animate-float" style={{ animationDelay: "200ms" }}>
                          <div className="col-span-2 row-span-3 rounded-2xl overflow-hidden shadow-lg">
                              <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990269/roomhy/website/two.jpg" className="w-full h-full object-cover" alt="Two women talking" />
                          </div>
                          <div className="col-span-3 row-span-2 rounded-2xl overflow-hidden shadow-lg">
                              <img src="https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" alt="Modern living room" />
                          </div>
                          <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden shadow-lg">
                               <img src="https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" alt="Kitchen sink area" />
                          </div>
                          <div className="col-span-2 row-span-1 rounded-2xl overflow-hidden shadow-lg">
                              <img src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" alt="Clean bedroom" />
                          </div>
                      </div>
                  </div>
              </section>
              
              
              <section id="features" className="light-card rounded-2xl p-6 md:p-10">
                  <div className="text-center mb-12 animate-slide-in">
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-900">The Simple and Safe Way to Find Your Next <span className="text-purple-600">Coliving Home</span></h2>
                  </div>
                  
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 text-center">
                      <div className="animate-slide-in" style={{ animationDelay: "'100ms'" }}>
                          <h3 className="text-4xl font-bold text-gray-900">6+</h3>
                          <p className="text-gray-500 mt-1">Cities</p>
                      </div>
                      <div className="animate-slide-in" style={{ animationDelay: "'150ms'" }}>
                          <h3 className="text-4xl font-bold text-gray-900">500+</h3>
                          <p className="text-gray-500 mt-1">Rooms</p>
                      </div>
                      <div className="animate-slide-in" style={{ animationDelay: "'200ms'" }}>
                          <h3 className="text-4xl font-bold text-gray-900">1000+</h3>
                          <p className="text-gray-500 mt-1">Beds</p>
                      </div>
                      <div className="animate-slide-in" style={{ animationDelay: "'250ms'" }}>
                          <h3 className="text-4xl font-bold text-gray-900">500+</h3>
                          <p className="text-gray-500 mt-1">Verified Listings</p>
                      </div>
                      <div className="animate-slide-in" style={{ animationDelay: "'300ms'" }}>
                          <h3 className="text-4xl font-bold text-gray-900">3000+</h3>
                          <p className="text-gray-500 mt-1">Student signup</p>
                      </div>
                      <div className="animate-slide-in" style={{ animationDelay: "'350ms'" }}>
                          <h3 className="text-4xl font-bold text-gray-900">?1 Cr+</h3>
                          <p className="text-gray-500 mt-1">Brokerage Saved</p>
                      </div>
                      <div className="animate-slide-in" style={{ animationDelay: "'400ms'" }}>
                          <h3 className="text-4xl font-bold text-gray-900">1000+</h3>
                          <p className="text-gray-500 mt-1">Placed</p>
                      </div>
                      <div className="animate-slide-in" style={{ animationDelay: "'450ms'" }}>
                          <h3 className="text-4xl font-bold text-gray-900">500+</h3>
                          <p className="text-gray-500 mt-1">beds sold</p>
                      </div>
                  </div>
              </section> 
      
              
              <section className="animate-slide-in"> 
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      <div className="text-center flex flex-col items-center p-6 border border-gray-200 rounded-2xl animate-slide-in feature-card" style={{ animationDelay: "'200ms'" }}>
                          <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm pulse-icon">
                              <i data-lucide="badge-percent" className="w-8 h-8 text-purple-600"></i>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mt-5">No Brokerage</h3>
                          <p className="text-gray-500 mt-2">Say goodbye to broker fees forever. Roomhy is 100% owner-to-student direct.</p>
                      </div>
                      
                      <div className="text-center flex flex-col items-center p-6 border border-gray-200 rounded-2xl animate-slide-in feature-card" style={{ animationDelay: "'300ms'" }}>
                          <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm pulse-icon" style={{ animationDelay: "300ms" }}>
                              <i data-lucide="gavel" className="w-8 h-8 text-purple-600"></i>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mt-5">Live Bidding System</h3>
                          <p className="text-gray-500 mt-2">Students place real-time bids, owners pick the best offer.</p>
                      </div>
                      
                      <div className="text-center flex flex-col items-center p-6 border border-gray-200 rounded-2xl animate-slide-in feature-card" style={{ animationDelay: "'400ms'" }}>
                          <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm pulse-icon" style={{ animationDelay: "600ms" }}>
                              <i data-lucide="smartphone" className="w-8 h-8 text-purple-600"></i>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mt-5">100% Online Process</h3>
                          <p className="text-gray-500 mt-2">From browsing to booking " everything happens online.</p>
                      </div>
      
                      <div className="text-center flex flex-col items-center p-6 border border-gray-200 rounded-2xl animate-slide-in feature-card" style={{ animationDelay: "'500ms'" }}>
                          <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm pulse-icon" style={{ animationDelay: "900ms" }}>
                              <i data-lucide="shield-check" className="w-8 h-8 text-purple-600"></i>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mt-5">Verified Listings</h3>
                          <p className="text-gray-500 mt-2">Each room is checked and verified to ensure trust and transparency.</p>
                      </div>
                  </div>
              </section>
      
              
              <section id="mission-vision" className="light-card rounded-2xl p-6 md:p-10 animate-slide-in">
                  <div className="max-w-4xl mx-auto">
                      <div className="mb-12 animate-slide-in" style={{ animationDelay: "100ms" }}>
                          <h3 className="text-3xl font-bold text-gray-900 mb-4 text-purple-600">Our Vision</h3>
                          <p className="text-gray-600 text-lg leading-relaxed">To disrupt the traditional rental model by giving students the power to bid, book, and live " without brokers, hidden charges, or negotiation stress.</p>
                          <p className="text-gray-600 text-lg leading-relaxed mt-4">Founded in 2024, Roomhy, under the leadership of Resham Singh, is pioneering a new way for India's youth to find accommodation " transparent, real-time, and entirely online.</p>
                      </div>
                      
                      <div className="mb-12 animate-slide-in" style={{ animationDelay: "200ms" }}>
                          <h3 className="text-3xl font-bold text-gray-900 mb-4 text-purple-600">Our Mission</h3>
                          <p className="text-gray-600 text-lg leading-relaxed">To simplify student housing by enabling direct, real-time bidding between students and property owners " making room rentals fair, flexible, and broker-free.</p>
                           <p className="text-gray-600 text-lg leading-relaxed mt-4">Roomhy is India's first student-centric property bidding platform " helping students take control of where and how they live, and helping property owners get the best value for their rooms.</p>
                      </div>
      
                      <div className="mb-12 animate-slide-in" style={{ animationDelay: "300ms" }}>
                          <h3 className="text-3xl font-bold text-gray-900 mb-6 text-purple-600">Our Values</h3>
                          <ul className="space-y-4 text-gray-600 text-lg">
                              <li><strong>Transparency</strong> " No middlemen. No hidden fees. What you see is what you bid.</li>
                              <li><strong>Empowerment</strong> " Students and owners are in full control.</li>
                              <li><strong>Speed & Simplicity</strong> " From listing to booking in under 5 mins.</li>
                              <li><strong>Trust</strong> " Every listing is verified. Every user is real.</li>
                          </ul>
                          <p className="text-gray-700 font-semibold italic mt-6 text-lg">We're not just fixing rentals. We're fixing trust.</p>
                      </div>
      
                      <div className="animate-slide-in" style={{ animationDelay: "400ms" }}>
                          <h3 className="text-3xl font-bold text-gray-900 mb-6 text-purple-600">Our Goals</h3>
                           <ul className="space-y-4 list-disc list-outside ml-5 text-gray-600 text-lg">
                              <li>To become the default platform for student rentals in India by:</li>
                              <li>Helping students bid smart and live better</li>
                              <li>Helping owners earn more, without paying brokerage</li>
                              <li>Building a transparent, tech-first ecosystem for youth mobility in India</li>
                          </ul>
                      </div>
                  </div>
              </section>
      
              
              <section id="stats2" className="animate-slide-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                      <div className="text-white p-10 rounded-2xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden stat-card animate-slide-in" style={{ backgroundColor: "#581c87", animationDelay: "100ms" }}>
                          <i data-lucide="home" className="w-24 h-24 text-white/10 absolute -bottom-4 -right-4"></i>
                          <h3 className="text-5xl lg:text-6xl font-bold z-10">5+</h3>
                          <p className="text-xl mt-2 text-purple-200 z-10">Cities</p>
                      </div>
                      <div className="text-white p-10 rounded-2xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden stat-card animate-slide-in" style={{ backgroundColor: "#a21caf", animationDelay: "200ms" }}>
                          <i data-lucide="bed-double" className="w-24 h-24 text-white/10 absolute -bottom-4 -right-4"></i>
                          <h3 className="text-5xl lg:text-6xl font-bold z-10">5000+</h3>
                          <p className="text-xl mt-2 text-purple-200 z-10">Operational Beds</p>
                      </div>
                      <div className="text-white p-10 rounded-2xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden stat-card animate-slide-in" style={{ backgroundColor: "#86198f", animationDelay: "300ms" }}>
                          <i data-lucide="building" className="w-24 h-24 text-white/10 absolute -bottom-4 -right-4"></i>
                          <h3 className="text-5xl lg:text-6xl font-bold z-10">75+</h3>
                          <p className="text-xl mt-2 text-purple-200 z-10">Properties</p>
                      </div>
                  </div>
              </section>
      
              
              
              <section id="founder" className="light-card rounded-2xl p-6 md:p-10 animate-slide-in">
                   <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12 animate-slide-in">Our Founders</h2>
                  <div className="flex flex-col items-center">
                      
                      <div className="w-full max-w-sm rounded-lg overflow-hidden shadow-xl mb-12 founder-card animate-slide-in" style={{ animationDelay: "200ms" }}>
                          
                          <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990231/roomhy/website/ceo1.jpg" alt="Resham Singh, Founder & CEO" className="w-full h-auto object-cover" />
                          <div className="p-5 bg-gray-900 text-white text-center">
                              <h4 className="text-2xl font-bold">Resham Singh</h4>
                              <p className="text-gray-300">Founder & CEO</p>
                          </div>
                      </div>
                  </div> 
              </section> 
      
              
              
              <section id="founder-note" className="light-card rounded-2xl p-6 md:p-10 animate-slide-in">
                  <div className="flex flex-wrap lg:flex-nowrap items-center gap-12 lg:gap-16">
                      
                      <div className="flex-1 min-w-[300px] animate-slide-in" style={{ animationDelay: "100ms" }}>
                          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                          Founders <span className="text-purple-600">Note</span>
                          </h2>
                          <div className="text-lg text-gray-600 space-y-5">
                          <p>
                              Growing up in Kota, India's education hub, I lived in the everyday chaos of student rentals. When a student moves to a new city, they're often left with two options: roam endlessly or rely on brokers who care more about their commission than your comfort.
                          </p>
                          <p>
                              I've seen friends overpay, compromise on rooms, and get stuck with whatever was available. On the other side, property owners struggle too: they want full occupancy when sessions begin, but lack a reliable, transparent way to reach students.
                          </p>
                          <p>
                              That's where ROOMHY comes in, India's first real-time property bidding platform, built for students, scaled for cities. No brokers. No guesswork. Just verified properties, fair pricing, and total control.
                          </p>
                          <p>
                              Here, you set the price with your bid. Whether it's a PG, hostel, or shared flat, you find what fits your own budget: fast, fair, and fully online.
                          </p>
                          <p className="text-purple-600 font-bold text-xl mt-6">
                              Because we believe: Broker hatao. Bid lagao. Roomhy chalao
                          </p>
                          <p>
                              ROOMHY isn't just an app or any other platform, it's a solution to a broken system. One that gives students freedom, owners visibility, and both sides a better way to connect.
                          </p>
                          </div>
                      </div>
                  
                      <div className="flex-1 min-w-[300px] flex items-center justify-center animate-slide-in" style={{ animationDelay: "200ms" }}>
                          
                          <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990233/roomhy/website/ceo2.jpg" alt="Roomhy Founder" className="rounded-2xl shadow-xl w-full max-w-md h-auto object-cover" />
                      </div>
                  
                  </div>
              </section>
      
              
              
              <section id="powered-by-tech" className="light-card rounded-2xl p-6 md:p-10 animate-slide-in">
                  <div className="max-w-6xl mx-auto">
                      
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
                        Powered by <span className="text-purple-600">Technology.</span> Built for Students.
                      </h2>
                  
                      <div className="flex flex-wrap lg:flex-nowrap gap-12 lg:gap-16 justify-between items-center">
                        
                          <div className="flex-1 min-w-[300px] animate-slide-in" style={{ animationDelay: "100ms" }}>
                              <p className="text-lg text-gray-600 mb-6">
                              Roomhy is India's First Real-Time Property Bidding Platform " made to give students the power to rent smarter, faster, and without brokers.
                              </p>
                              <p className="text-lg text-gray-600 mb-8">
                              Whether you're finding your first PG or switching hostels, Roomhy's tech does the heavy lifting. From live bidding to verified stays, everything happens in real-time " no phone calls, no shady listings, no running around.
                              </p>
                              <p className="text-xl text-gray-800 font-semibold mb-5">
                              Our AI-powered platform makes it simple
                              </p>
                              <ul className="list-none p-0 mb-12 space-y-4">
                                  <li className="flex items-start text-lg text-gray-600">
                                      <span className="mr-3 text-2xl">💡</span> Suggests the right stay based on your budget, preferences, and location
                                  </li>
                                  <li className="flex items-start text-lg text-gray-600">
                                      <span className="mr-3 text-2xl">📍</span> Shows actual occupancy (Single, Double, Triple, etc.) in real-time
                                  </li>
                                  <li className="flex items-start text-lg text-gray-600">
                                      <span className="mr-3 text-2xl">🗓️</span> Combines rent, booking & service details in one clean dashboard
                                  </li>
                              </ul>
                  
                              <div className="flex flex-wrap gap-6 mb-12">
                                  <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 flex-1 min-w-[280px]">
                                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                                          <i data-lucide="check" className="w-6 h-6 text-purple-600"></i>
                                      </div>
                                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                      Find your perfect stay, your way
                                      </h3>
                                      <p className="text-sm text-gray-600">
                                      Search by location, budget, or preferences " and place live bids directly. Explore rooms, check real-time availability, or schedule a virtual visit.
                                      </p>
                                  </div>
                                  <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 flex-1 min-w-[280px]">
                                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                                          <i data-lucide="check" className="w-6 h-6 text-purple-600"></i>
                                      </div>
                                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                      Everything in one dashboard
                                      </h3>
                                      <p className="text-sm text-gray-600">
                                      From bidding history to rent payments, invoices, and support " manage your entire rental journey from a single, clean dashboard.
                                      </p>
                                  </div>
                              </div>
                              
                              <a href="/website/index" className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-purple-600 text-white font-semibold text-base transition-colors hover:bg-purple-700 glow-button">
                              EXPLORE HOMES
                              </a>
                          </div>
                  
                          <div className="flex-1 min-w-[300px] flex justify-center items-center mt-8 lg:mt-0 animate-slide-in" style={{ animationDelay: "200ms" }}>
                              <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990272/roomhy/website/why.jpg" alt="Roomhy App Screenshot with Features" className="max-w-full h-auto" />
                          </div>
                  
                      </div>
                  </div>
              </section>
              
              
              
              <section id="why-roomhy-2" className="light-card rounded-2xl p-6 md:p-10 animate-slide-in">
                  <div className="max-w-6xl mx-auto">
                      <div className="flex flex-wrap-reverse lg:flex-nowrap gap-12 lg:gap-16 justify-between items-center">
                      
                      <div className="flex-1 min-w-[300px] animate-slide-in" style={{ animationDelay: "100ms" }}>
                          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-10">
                          Why stay with <span className="text-purple-600">Roomhy?</span>
                          </h2>
                  
                          <div className="space-y-8">
                              <div className="mb-0"> 
                                  <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full mb-2">Affordable</span>
                                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Brokerage</h3>
                                  <p className="text-base text-gray-600">
                                      Find your ideal room without paying a single rupee in commission. Every stay is broker-free " direct from owner to student.
                                  </p>
                              </div>
                  
                              <div className="mb-0">
                                  <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-2">Convenient</span>
                                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Fully Online</h3>
                                  <p className="text-base text-gray-600">
                                      Bid, book, pay rent, or raise issues " all from your phone. No need for site visits or endless WhatsApp calls.
                                  </p>
                              </div>
                  
                              <div className="mb-0">
                                  <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-2">Flexible</span>
                                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Flexible Stays</h3>
                                  <p className="text-base text-gray-600">
                                      Monthly, quarterly, or semester-wise " choose what suits your academic life. No long-term lock-ins.
                                  </p>
                              </div>
                  
                              <div className="mb-0">
                                  <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full mb-2">Reliable</span>
                                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Verified Rooms</h3>
                                  <p className="text-base text-gray-600">
                                      What you see is what you get. Photos, amenities, and availability are 100% verified by the Roomhy team.
                                  </p>
                              </div>
                              
                              <div className="mb-0">
                                  <span className="inline-block bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full mb-2">Social</span>
                                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Community-Driven</h3>
                                  <p className="text-base text-gray-600">
                                      Live in spaces where you connect with other students and young professionals " feel at home, even away from home.
                                  </p>
                              </div>
                          </div>
                  
                      </div>
                      
                      <div className="flex-1 min-w-[300px] flex items-center justify-center animate-slide-in" style={{ animationDelay: "200ms" }}>
                          <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990258/roomhy/website/jolly.jpg" alt="Students enjoying a shared living space" className="w-full h-auto rounded-2xl shadow-xl" />
                      </div>
                  
                      </div>
                  </div>
              </section>
      
              
              
              <section id="timeline" className="light-card rounded-2xl p-6 md:p-10 animate-slide-in">
                  <div className="max-w-6xl mx-auto text-center">
                  
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                      Roomhy's <span className="text-cyan-600">Timeline</span>
                      </h2>
                      <p className="text-lg text-gray-600 mb-16">
                      Over the years, Zolo has grown to become the largest coliving brand in India.
                      </p>
                  
                      <div className="w-full overflow-x-auto pb-8">
                          <div className="min-w-[1000px] px-8">
                              
                              <div className="flex justify-between px-0 md:px-8">
                                  <div className="flex-1 text-center text-2xl md:text-4xl font-bold text-gray-700">2015</div>
                                  <div className="flex-1 text-center text-2xl md:text-4xl font-bold text-gray-700">2017</div>
                                  <div className="flex-1 text-center text-2xl md:text-4xl font-bold text-gray-700">2019</div>
                                  <div className="flex-1 text-center text-2xl md:text-4xl font-bold text-gray-700">2021</div>
                                  <div className="flex-1 text-center text-2xl md:text-4xl font-bold text-gray-700">2023</div>
                              </div>
                  
                              <div className="relative w-full h-1 bg-cyan-500 mt-6">
                                  
                                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[15px] border-l-cyan-500 absolute -right-4 -top-[8px]"></div>
                                  
                                  
                                  <div className="absolute -top-[10px] w-6 h-6 bg-cyan-500 rotate-45 rounded-sm" style={{ left: "6.5%" }}></div>
                                  <div className="absolute -top-[10px] w-6 h-6 bg-cyan-500 rotate-45 rounded-sm" style={{ left: "29%" }}></div>
                                  <div className="absolute -top-[10px] w-6 h-6 bg-cyan-500 rotate-45 rounded-sm" style={{ left: "51.5%" }}></div>
                                  <div className="absolute -top-[10px] w-6 h-6 bg-cyan-500 rotate-45 rounded-sm" style={{ left: "74%" }}></div>
                                  <div className="absolute -top-[10px] w-6 h-6 bg-cyan-500 rotate-45 rounded-sm" style={{ left: "96.5%" }}></div>
                              </div>
                  
                              <div className="flex justify-between gap-6 mt-10 text-left">
                                  
                                  <div className="flex-1 bg-white p-6 rounded-lg shadow-md border border-gray-100">
                                      <h3 className="text-xl font-semibold text-gray-900 mt-0 mb-4">Initiation</h3>
                                      <ul className="list-none p-0 m-0 space-y-2">
                                      <li className="flex items-start text-base text-gray-600">
                                          <span className="text-cyan-500 text-2xl mr-2 leading-none mt-[-2px]">"</span> Set up first property in Blr
                                      </li>
                                      <li className="flex items-start text-base text-gray-600">
                                          <span className="text-cyan-500 text-2xl mr-2 leading-none mt-[-2px]">"</span> Secured Nexus as an investor
                                      </li>
                                      </ul>
                                  </div>
                                  
                                  <div className="flex-1 bg-white p-6 rounded-lg shadow-md border border-gray-100">
                                      <h3 className="text-xl font-semibold text-gray-900 mt-0 mb-4">Validation</h3>
                                      <ul className="list-none p-0 m-0 space-y-2">
                                      <li className="flex items-start text-base text-gray-600">
                                          <span className="text-cyan-500 text-2xl mr-2 leading-none mt-[-2px]">"</span> Secured series A funding of $5 million
                                      </li>
                                      <li className="flex items-start text-base text-gray-600">
                                          <span className="text-cyan-500 text-2xl mr-2 leading-none mt-[-2px]">"</span> Hit milestone of 100 properties and 10,000 beds
                                      </li>
                                      </ul>
                                  </div>
                      
                                  <div className="flex-1 bg-white p-6 rounded-lg shadow-md border border-gray-100">
                                      <h3 className="text-xl font-semibold text-gray-900 mt-0 mb-4">Scale</h3>
                                      <ul className="list-none p-0 m-0 space-y-2">
                                      <li className="flex items-start text-base text-gray-600">
                                          <span className="text-cyan-500 text-2xl mr-2 leading-none mt-[-2px]">"</span> Largest coliving player
                                      </li>
                                      <li className="flex items-start text-base text-gray-600">
                                          <span className="text-cyan-500 text-2xl mr-2 leading-none mt-[-2px]">"</span> Series B funding
                                      </li>
                                      <li className="flex items-start text-base text-gray-600">
                                          <span className="text-cyan-500 text-2xl mr-2 leading-none mt-[-2px]">"</span> 8000+ YoY properties
                                      </li>
                                      </ul>
                                  </div>
                      
                                  <div className="flex-1 bg-white p-6 rounded-lg shadow-md border border-gray-100">
                                      <h3 className="text-xl font-semibold text-gray-900 mt-0 mb-4">Expansion</h3>
                                      <ul className="list-none p-0 m-0 space-y-2">
                                      <li className="flex items-start text-base text-gray-600">
                                          <span className="text-cyan-500 text-2xl mr-2 leading-none mt-[-2px]">"</span> Launched Student Housing Vertical
                                      </li>
                                      <li className="flex items-start text-base text-gray-600">
                                          <span className="text-cyan-500 text-2xl mr-2 leading-none mt-[-2px]">"</span> Presence in 15+ cities
                                      </li>
                                      </ul>
                                  </div>
                      
                                  <div className="flex-1 bg-white p-6 rounded-lg shadow-md border border-gray-100">
                                      <h3 className="text-xl font-semibold text-gray-900 mt-0 mb-4">Acceleration</h3>
                                      <ul className="list-none p-0 m-0 space-y-2">
                                      <li className="flex items-start text-base text-gray-600">
                                          <span className="text-cyan-500 text-2xl mr-2 leading-none mt-[-2px]">"</span> Turned Profitable
                                      </li>
                                      <li className="flex items-start text-base text-gray-600">
                                          <span className="text-cyan-500 text-2xl mr-2 leading-none mt-[-2px]">"</span> New Verticals: Z Vacation & Z Express
                                      </li>
                                      </ul>
                                  </div>
                      
                              </div>
                          </div>
                      </div>
                  
                  </div>
              </section>
          </main>
      
          
          <footer className="footer mt-auto"> 
           
          
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
              <p> 2025 <strong>Roomhy</strong>. All Rights Reserved.</p>
            </div>
          </footer>
      
          
          
      
    </div>
  );
}


