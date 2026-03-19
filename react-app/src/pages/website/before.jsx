import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useFaqAccordion, useHeroSlideshow, useWebsiteCommon, useWebsiteMenu } from "../../utils/websiteUi";

export default function WebsiteBefore() {
  useWebsiteCommon();
  useWebsiteMenu();
  useHeroSlideshow();
  useFaqAccordion();

  useHtmlPage({
    title: "Roomhy - Find Your Student Home",
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
    "href": "/website/assets/css/before.css"
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
                              <a href="#faq" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">FAQ</a>
                              <a href="/website/contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contact</a>
                          </nav>
      
                          <a href="/website/list" className="flex-shrink-0 flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors w-10 h-10 sm:w-auto sm:h-auto sm:px-4">
                              <span className="text-lg font-bold">+</span>
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
                  <h1 className=" text-1l md:text-4xl font-bold text-shadow mb-6 " style={{ color: "#fffcf2" }}>
                      SEARCH.CONNECT.SUCCEED
                  </h1>
                  <div className="relative w-full max-w-2xl mx-auto">
                      <input type="text" id="hero-search-input" placeholder="Search for 'PG near me' or 'Hostel in Kota'" className="w-full p-4 pl-5 pr-14 rounded-lg bg-white text-gray-900 border-transparent focus:ring-4 focus:ring-cyan-300/50 focus:outline-none placeholder-gray-500 shadow-lg" />
                      <button type="submit" id="hero-search-btn" className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                          <i data-lucide="search" className="w-5 h-5 text-white"></i>
                      </button>
                  </div>
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
                  <a href="/website/profile" className="text-sm font-medium text-blue-600 hover:underline">Profile</a>
              </div>
      
              <div className="px-6 py-4">
                  <div className="border border-blue-200 rounded-lg p-4 relative overflow-hidden">
                      <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990266/roomhy/website/post.png" alt="Illustartion of people with house" className="absolute right-0 bottom-0 opacity-80 w-32 h-auto" style={{ pointerEvents: "none" }} />
                      <p className="font-semibold text-gray-800 mb-3 relative z-10">Looking to Sell/Rent your Property?</p>
                      <a href="/website/list" className="block text-center w-full text-gray-800 font-medium py-2 px-4 rounded-lg text-sm hover:text-blue-600 transition-colors relative z-10 border border-gray-300" style={{ width: "150px" }}>
                          +
                      </a>
                  </div>
              </div>
      
              <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
                  <a href="/website/ourproperty" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
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
                  <a href="/website/websitechat" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <i data-lucide="message-circle" className="w-5 h-5 text-green-600"></i>
                      </div>
                      <span>Chat</span>
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
      
          
          <section id="top-cities-categories" className="container mx-auto px-4 sm:px-6 -mt-8 relative z-10">
              <div className="bg-white py-4 shadow-lg rounded-2xl city-filter-container overflow-hidden"> 
                  <h2 className="sr-only">Top Cities</h2>
                  
                   
                  <div id="cities-category-slider" className="flex gap-4 md:gap-8 pb-2 scroll-smooth px-4 horizontal-slider overflow-x-auto">
                      
                  </div>
                  
              </div>
          </section>
          
          <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-16">
            <section id="offerings" className="light-card rounded-2xl p-6">
      
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Our offering</h2>
      
          <div className="relative -m-2">
      
              <button id="offer-prev" className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 text-gray-700 sm:block"><i data-lucide="chevron-left" className="w-6 h-6"></i></button>
      
              
      
              <div id="offerings-slider" className="flex gap-5 overflow-x-auto pb-2 pt-2 -mx-4 px-4 snap-x snap-mandatory scroll-smooth horizontal-slider" style={{ paddingLeft: "100px" }}>
      
                  
      
                  <a href="/website/ourproperty?type=hostel" className="group block flex-shrink-0 snap-start w-102 md:w-164 lg:w-172 offering-card-item">
      
                      <div className="relative rounded-xl shadow-md hover:shadow-lg overflow-hidden h-40 sm:h-44 cursor-pointer offering-card transition-shadow duration-300">
      
                          <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990227/roomhy/website/angels-hostel-taipei-taiwan-9.jpg" className="w-550px h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Hostel" />
      
                          
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:opacity-0">
      
                              <div className="absolute bottom-0 left-0 right-0 p-4">
      
                                  <h3 className="text-white text-center text-sm sm:text-base font-bold leading-tight">Hostel</h3>
      
                              </div>
      
                          </div>
      
                          
      
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
      
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
      
                                  <h3 className="text-white text-center text-sm sm:text-base font-bold leading-tight mb-2">Hostel</h3>
      
                                  <p className="text-white/90 text-center text-xs sm:text-sm leading-relaxed">Affordable shared spaces with all essentials covered.</p>
      
                              </div>
      
                          </div>
      
                          
      
                          <div className="hidden sm:block absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-y-2 group-hover:translate-y-0">
      
                               <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
      
                                  <i data-lucide="chevron-right" className="w-3 h-3 text-white"></i>
      
                              </div>
      
                          </div>
      
                      </div>
      
                  </a>
      
                     <a href="/website/ourproperty?type=pg" className="group block flex-shrink-0 snap-start w-102 md:w-164 lg:w-172 offering-card-item">
      
                      <div className="relative rounded-xl shadow-md hover:shadow-lg overflow-hidden h-40 sm:h-44 cursor-pointer offering-card transition-shadow duration-300">
      
                          <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990226/roomhy/website/401230348.jpg" className="w-550px h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Hostel" />
      
                             
      
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:opacity-0">
      
                              <div className="absolute bottom-0 left-0 right-0 p-4">
      
                                   <h3 className="text-white text-center text-sm sm:text-base font-bold leading-tight">PG</h3>
      
                              </div>
      
                          </div>
      
                          
      
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
      
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
      
                                  <h3 className="text-white text-center text-sm sm:text-base font-bold leading-tight mb-2">PG</h3>
      
                                  <p className="text-white/90 text-center text-xs sm:text-sm leading-relaxed">Comfortable living with meals and best locations.</p>
      
                              </div>
      
                          </div>
      
                          
      
                          <div className="hidden sm:block absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-y-2 group-hover:translate-y-0">
      
                               <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
      
                                  <i data-lucide="chevron-right" className="w-3 h-3 text-white"></i>
      
                              </div>
      
                          </div>
      
                      </div>
      
                  </a>
      
                  
                  <a href="/website/ourproperty?type=apartment" className="group block flex-shrink-0 snap-start w-102 md:w-164 lg:w-172 offering-card-item">
      
                      <div className="relative rounded-xl shadow-md hover:shadow-lg overflow-hidden h-40 sm:h-44 cursor-pointer offering-card transition-shadow duration-300">
      
                          <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990226/roomhy/website/401230348.jpg" className="w-550px h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Hostel" />
      
                             
      
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:opacity-0">
      
                              <div className="absolute bottom-0 left-0 right-0 p-4">
      
                                   <h3 className="text-white text-center text-sm sm:text-base font-bold leading-tight">Apartment</h3>
      
                              </div>
      
                          </div>
      
                          
      
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
      
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
      
                                  <h3 className="text-white text-center text-sm sm:text-base font-bold leading-tight mb-2">Apartment</h3>
      
                                  <p className="text-white/90 text-center text-xs sm:text-sm leading-relaxed">Private living spaces with complete independence.</p>
      
                              </div>
      
                          </div>
      
                          
      
                          <div className="hidden sm:block absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-y-2 group-hover:translate-y-0">
      
                               <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
      
                                  <i data-lucide="chevron-right" className="w-3 h-3 text-white"></i>
      
                              </div>
      
                          </div>
      
                      </div>
      
                  </a>
      
                  
                  <a href="/website/list" className="group block flex-shrink-0 snap-start w-full md:w-64 lg:w-72 offering-card-item">
      
                      <div className="relative rounded-xl shadow-md hover:shadow-lg overflow-hidden h-40 sm:h-44 cursor-pointer offering-card transition-shadow duration-300">
      
                          <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990266/roomhy/website/post.png" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="List Your Property" />
      
                          
      
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:opacity-0">
      
                              <div className="absolute bottom-0 left-0 right-0 p-4">
      
                                  <h3 className="text-white text-center text-sm sm:text-base font-bold leading-tight">List Your Property</h3>
      
                              </div>
      
                          </div>
      
                          
      
                          <div className="absolute inset-0 bg-gradient-to-t from-blue-700/90 via-blue-700/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
      
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
      
                                  <h3 className="text-white text-center text-sm sm:text-base font-bold leading-tight mb-2">List Your Property</h3>
      
                                  <p className="text-white/90 text-center text-xs sm:text-sm leading-relaxed">Reach thousands of verified tenants instantly.</p>
      
                              </div>
      
                          </div>
      
                          
      
                          <div className="hidden sm:block absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-y-2 group-hover:translate-y-0">
      
                               <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
      
                                  <i data-lucide="chevron-right" className="w-3 h-3 text-white"></i>
      
                              </div>
      
                          </div>
      
                      </div>
      
                  </a>
      
                  
      
              </div>
      
              <button id="offer-next" className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 text-gray-700 sm:block"><i data-lucide="chevron-right" className="w-6 h-6"></i></button>
      
          </div>
      
      </section>    
      <section id="why-roomhy" className="scroll-mt-20 light-card rounded-2xl p-6 md:p-8">
         <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
                       <div className="text-left lg:order-2">
                           <div className="animate-slide-in text-center lg:text-left">
                               <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">Why Roomhy?</h2>
                           </div>
                            <div className="hidden lg:block animate-slide-in text-left mt-8">
                               <p className="text-gray-600 mb-6 text-lg">Roomhy was built by students, for students. We experienced the chaos of finding a reliable place to live and knew there had to be a better way.</p>
                               <p className="text-gray-600">We're more than a platform; we're your first friend in a new city, dedicated to helping you find a space where you can thrive.</p>
                           </div>
                      </div>
                      <div className="w-full max-w-3xl mx-auto grid grid-cols-2 grid-rows-2 gap-4 mt-8 lg:mt-0 animate-slide-in lg:order-1" style={{ animationDelay: "0.2s" }}>
                          <div className="row-span-2 col-span-1">
                              <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990242/roomhy/website/hostel1.png.jpg" className="h-full w-full object-cover rounded-2xl shadow-lg" alt="Modern student accommodation building" />
                          </div>
                          <div className="col-span-1">
                              <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990244/roomhy/website/hostel2.jpg" className="h-full w-full object-cover rounded-2xl shadow-lg" alt="Student common room with yellow chairs" />
                          </div>
                          <div className="col-span-1">
                               <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990245/roomhy/website/hostel3.jpg" className="h-full w-full object-cover rounded-2xl shadow-lg" alt="Bright and modern student room hallway" />
                          </div>
                      </div>
                      <div className="lg:hidden animate-slide-in text-left mt-8">
                          <p className="text-gray-600 mb-6 text-lg">Roomhy was built by students, for students. We experienced the chaos of finding a reliable place to live and knew there had to be a better way.</p>
                          <p className="text-gray-600">We're more than a platform; we're your first friend in a new city, dedicated to helping you find a space where you can thrive.</p>
                      </div>
                  </div>
              </section>
      
              <section id="top-spaces" className="light-card rounded-2xl p-6">
                  <h2 id="top-spaces-title" className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Top Spaces in Indore</h2>
                  <div className="relative -m-2"> <button id="spaces-prev" className="hidden -left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 text-gray-700 sm:block lg:hidden"><i data-lucide="chevron-left" className="w-6 h-6"></i></button>
                      
                      <div id="spaces-slider" className="flex gap-6 overflow-x-auto pb-2 pt-2 -mx-4 px-4 snap-x snap-mandatory scroll-smooth horizontal-slider lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:p-0 lg:m-0">
                          
                          </div>
                      
                      <button id="spaces-next" className="hidden absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 text-gray-700 sm:block lg:hidden"><i data-lucide="chevron-right" className="w-6 h-6"></i></button>
                  </div>
              </section>
              
              
              <section id="how-it-works" className="relative overflow-hidden py-16 md:py-24 bg-gray-50">
                  <div className="container mx-auto px-4 sm:px-6">
                      <div className="text-center">
                          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-gray-900 leading-tight">
                              <span className="bg-clip-text text-transparent animate-gradient-flow" style={{ backgroundImage: "linear-gradient(to right, #06b6d4, #3b82f6, #06b6d4)" }}>Find Your Home, Simply.</span>
                          </h2>
                          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-20 lg:mb-32">Roomhy's 3-step process ensures you get the best space, price, and experience.</p>
                      </div>
          
                      
                      
                      <div className="hidden lg:block absolute top-0 left-0 w-full h-full -z-10">
                          <svg width="100%" height="100%" viewBox="0 0 1200 850" preserveAspectRatio="none">
                              
                              
                              <path id="path1" d="M 450 250 C 600 250, 600 500, 750 500" stroke="#3b82f6" strokeWidth="4" fill="none" className="animated-path flow-infinite"></path>
                              
                              
                              <path id="path2" d="M 750 500 C 600 500, 600 750, 450 750" stroke="#3b82f6" strokeWidth="4" fill="none" className="animated-path flow-infinite"></path>
      
                              
                              <circle cx="450" cy="250" r="10" className="step-dot"></circle>
                              <circle cx="750" cy="500" r="10" className="step-dot"></circle>
                              <circle cx="450" cy="750" r="10" className="step-dot"></circle>
                          </svg>
                      </div>
                      
                      <div className="space-y-24 lg:space-y-36 relative">
                          
                          
                          <div id="step-1" className="step-card-3d grid lg:grid-cols-2 gap-8 items-center relative" data-step-id="1">
                              
                              
                              <div className="lg:hidden absolute top-full left-1/2 w-px h-24 -translate-x-1/2 mobile-divider"></div>
                              <div className="lg:hidden absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 step-badge animate-pulse-pop">1</div>
                              
                               <div className="w-full max-w-lg mx-auto lg:mx-0">
                                   
                                   <div className="grid grid-cols-2 grid-rows-2 gap-4">
                                      <div className="row-span-2 col-span-1">
                                          <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990247/roomhy/website/hostel4.jpg" className="h-full w-full object-cover rounded-xl shadow-md" alt="Students searching on laptop" />
                                      </div>
                                      <div className="col-span-1">
                                          <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990248/roomhy/website/hostel5.jpg" className="h-full w-full object-cover rounded-xl shadow-md" alt="Modern interior" />
                                      </div>
                                      <div className="col-span-1">
                                           <img src="https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=2070&auto:format&fit=crop" className="h-full w-full object-cover rounded-xl shadow-md" alt="Bright living room" />
                                      </div>
                                  </div>
                              </div>
                               <div className="text-center lg:text-left relative">
                                  
                                  <div className="hidden lg:flex absolute -left-16 top-1/2 -translate-y-1/2 step-badge animate-pulse-pop">1</div>
                                  <span className="hidden lg:inline text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">Your Journey Starts Here</span>
                                  <h3 className="text-3xl font-bold my-4 text-gray-900 leading-snug">Search, Filter & Shortlist</h3> 
                                  <p className="text-gray-600 text-lg leading-relaxed">Use our smart, student-focused filters to find verified PGs, hostels, or apartments near your college campus. **Compare transparent prices, 360° virtual tours, and essential amenities.**</p>
                              </div>
                          </div>
          
                          
                          <div id="step-2" className="step-card-3d grid lg:grid-cols-2 gap-8 items-center relative" data-step-id="2">
                               
                              
                              <div className="lg:hidden absolute top-full left-1/2 w-px h-24 -translate-x-1/2 mobile-divider"></div>
                              <div className="lg:hidden absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 step-badge animate-pulse-pop">2</div>
                              
                              <div className="w-full max-w-lg mx-auto lg:mx-0 lg:order-2">
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                      <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990227/roomhy/website/angels-hostel-taipei-taiwan-9.jpg" alt="Online booking confirmation" className="rounded-xl shadow-md w-full h-full object-cover col-span-2" />
                                      <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990226/roomhy/website/401230348.jpg" alt="Student smiling" className="rounded-xl shadow-md w-full h-full object-cover" />
                                      <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990250/roomhy/website/hostel7.jpg" alt="Close up of online payment" className="rounded-xl shadow-md w-full h-full object-cover" />
                                  </div>
                              </div>
                               <div className="lg:order-1 text-center lg:text-left relative">
                                  
                                  <div className="hidden lg:flex absolute -right-16 top-1/2 -translate-y-1/2 step-badge animate-pulse-pop">2</div>
                                  <span className="hidden lg:inline text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">Secure Your Deal</span>
                                  <h3 className="text-3xl font-bold my-4 text-gray-900 leading-snug">Place a Bid & Book</h3> 
                                  <p className="text-gray-600 text-lg leading-relaxed">Found the ideal place? **Use our unique bidding system to propose your rental price, or book instantly!** Pay a small, secure token amount to lock in your room online, hassle-free.</p>
                              </div>
                          </div>
          
                          
                          <div id="step-3" className="step-card-3d grid lg:grid-cols-2 gap-8 items-center relative" data-step-id="3">
                               
                               
                               <div className="lg:hidden absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 step-badge animate-pulse-pop">3</div>
                               
                               <div className="w-full max-w-lg mx-auto lg:mx-0">
                                  
                                  <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990252/roomhy/website/hostel8.jpg" alt="Student moving into a new room" className="rounded-xl shadow-md w-full h-auto object-cover" />
                              </div>
                               <div className="text-center lg:text-left relative lg:order-1">
                                  
                                  <div className="hidden lg:flex absolute -left-16 top-1/2 -translate-y-1/2 step-badge animate-pulse-pop">3</div>
                                  <span className="hidden lg:inline text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">Welcome Home!</span>
                                  <h3 className="text-3xl font-bold my-4 text-gray-900 leading-snug">Finalize & Move In</h3>
                                  <p className="text-gray-600 text-lg leading-relaxed">Complete the necessary paperwork directly with the verified owner. Pack your bags, and you're all set! **Welcome to your new, perfectly matched student home.**</p> 
                              </div>
                          </div>
                      </div>
                  </div>
              </section>
              
      
      
      
              <section id="top-spaces-kota" className="light-card rounded-2xl p-6">
                  <h2 id="top-spaces-title-kota" className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Top Spaces in Kota</h2>
                  <div className="relative -m-2"> <button id="spaces-prev-kota" className="hidden absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 text-gray-700 sm:block lg:hidden"><i data-lucide="chevron-left" className="w-6 h-6"></i></button>
                      
                      <div id="spaces-slider-kota" className=" flex gap-6 overflow-x-auto pb-2 pt-2 -mx-4 px-4 snap-x snap-mandatory scroll-smooth horizontal-slider lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:p-0 lg:m-0">
                          
                          </div>
                      
                      <button id="spaces-next-kota" className="hidden absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 text-gray-700 sm:block lg:hidden"><i data-lucide="chevron-right" className="w-6 h-6"></i></button>
                  </div>
              </section>
              <section id="why-choose-us">
                  <div className="text-center"><h2 className="text-3xl md:text-4xl font-bold mb-12 text-gray-900">Why Students Choose Us</h2></div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div className="light-card p-6 rounded-xl flex items-start space-x-4"><div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30"><i data-lucide="wallet" className="w-6 h-6"></i></div><div><h3 className="text-lg font-semibold text-gray-900">Zero Brokerage</h3><p className="text-gray-500 mt-1">Save your money for what matters. We connect you directly with property owners, with no hidden fees.</p></div></div>
                      <div className="light-card p-6 rounded-xl flex items-start space-x-4"><div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/30"><i data-lucide="sofa" className="w-6 h-6"></i></div><div><h3 className="text-lg font-semibold text-gray-900">Fully Furnished</h3><p className="text-gray-500 mt-1">Move in with just your suitcase. Our properties come with all the essential furniture and amenities.</p></div></div>
                      <div className="light-card p-6 rounded-xl flex items-start space-x-4"><div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30"><i data-lucide="heart-handshake" className="w-6 h-6"></i></div><div><h3 className="text-lg font-semibold text-gray-900">24/7 Support</h3><p className="text-gray-500 mt-1">From booking to move-out, our dedicated support team is always here to help you.</p></div></div>
                  </div>
              </section>
              <section id="guarantee">
                  <div className="light-card rounded-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                      <div><h3 className="text-3xl md:text-4xl font-bold text-cyan-600">50K+</h3><p className="text-gray-500 mt-2">Happy Students</p></div>
                      <div><h3 className="text-3xl md:text-4xl font-bold text-blue-600">10K+</h3><p className="text-gray-500 mt-2">Verified Properties</p></div>
                      <div><h3 className="text-3xl md:text-4xl font-bold text-sky-600">200+</h3><p className="text-gray-500 mt-2">Cities Served</p></div>
                      <div><h3 className="text-3xl md:text-4xl font-bold text-teal-600">100%</h3><p className="text-gray-500 mt-2">Brokerage Free</p></div>
                  </div>
              </section>
              
              <section id="rent-smarter" className="light-card rounded-2xl p-6 md:p-8 overflow-hidden">
                  <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                      
                      <div className="animate-slide-in">
                          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Rent Smarter. Live Better. <br className="hidden lg:block" /> <span className="text-blue-600">With Roomhy</span></h2>
                          
                          <div className="space-y-8 mt-10">
                              
                              <div className="flex items-start gap-4">
                                  <div className="flex-shrink-0 bg-blue-100 text-blue-600 p-3 rounded-lg shadow-sm">
                                      <i data-lucide="badge-percent" className="w-6 h-6"></i>
                                  </div>
                                  <div>
                                      <h3 className="text-xl font-semibold text-gray-900 mb-1">Zero Brokerage Always</h3>
                                      <p className="text-gray-500 leading-relaxed">Tired of paying brokers just to see a room? With Roomhy, you connect directly with verified property owners. No middlemen, no extra charges " just a clean, commission-free experience.</p>
                                  </div>
                              </div>
      
                              <div className="flex items-start gap-4">
                                  <div className="flex-shrink-0 bg-green-100 text-green-600 p-3 rounded-lg shadow-sm">
                                      <i data-lucide="gavel" className="w-6 h-6"></i>
                                  </div>
                                  <div>
                                      <h3 className="text-xl font-semibold text-gray-900 mb-1">Only Pay What You Bid</h3>
                                      <p className="text-gray-500 leading-relaxed">No fixed pricing. No pressure. Set your own budget and place a live bid " the owner picks the best offer. It's fast, fair, and puts you in control from the start.</p>
                                  </div>
                              </div>
      
                              <div className="flex items-start gap-4">
                                  <div className="flex-shrink-0 bg-purple-100 text-purple-600 p-3 rounded-lg shadow-sm">
                                      <i data-lucide="user-check" className="w-6 h-6"></i>
                                  </div>
                                  <div>
                                      <h3 className="text-xl font-semibold text-gray-900 mb-1">Rooms That Match Your Vibe & Budget</h3>
                                      <p className="text-gray-500 leading-relaxed">Whether you want a solo PG, a shared space with friends, or a budget hostel near college " Roomhy has it all. Search by location, amenities, and real-time availability to find your perfect stay.</p>
                                  </div>
                              </div>
                          </div>
                      </div>
      
                      <div className="animate-slide-in" style={{ animationDelay: "0.2s" }}>
                          <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto:format&fit=crop" alt="Happy students" className="w-full h-full object-cover rounded-2xl shadow-lg" style={{ maxHeight: "500px" }} />
                      </div>
                      
                  </div>
              </section>
              <section id="register-property" className="cta-section rounded-2xl text-white p-12 text-center flex flex-col items-center">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Have a Property to Rent Out?</h2>
                  <p className="text-lg text-gray-200 max-w-2xl mx-auto mb-8">Join our network of trusted property owners and reach thousands of students looking for a home. Listing is free and easy!</p>
                  <a href="/website/signuprole" className="glow-button text-white px-8 py-3 rounded-lg font-semibold text-lg" style={{ background: "linear-gradient(90deg, #06b6d4, #3b82f6)", boxShadow: "0 4px 14px 0 rgba(59, 130, 246, 0.39)" }}>Register Now</a>
              </section>
      
              
              <section id="testimonials" className="overflow-hidden py-12">
                  <div className="text-center mb-12">
                      <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Trusted by 10,000+ Students</h2>
                  </div>
                  
                  <div className="testimonial-carousel testimonial-row-1 mb-8">
                      <div className="testimonial-track">
                          <div className="testimonial-track-inner" id="testimonial-track-1">
                              
                              </div>
                      </div>
                  </div>
      
                  <div className="testimonial-carousel testimonial-row-2">
                      <div className="testimonial-track">
                          <div className="testimonial-track-inner" id="testimonial-track-2">
                               
                              </div>
                      </div>
                  </div>
              </section>
              
              
              
              <section id="faq" className="scroll-mt-20 py-12">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="grid lg:grid-cols-12 gap-10">
                          <div className="lg:col-span-4">
                              <h2 className="text-3xl font-bold text-gray-900 mb-4 lg:sticky lg:top-24">
                                  Frequently Asked Questions?
                              </h2>
                              <p className="text-lg text-gray-500 hidden lg:block">Everything you need to know about finding your perfect home with Roomhy.</p>
                          </div>
                          
                          <div className="lg:col-span-8 space-y-2">
                              
                              <div className="faq-item">
                                  <div className="faq-question">
                                      <span>What is Roomhy and how does it work?</span>
                                      <i data-lucide="chevron-down" className="chevron w-6 h-6"></i>
                                  </div>
                                  <div className="faq-answer">
                                      <p>Roomhy is a student accommodation platform that connects students directly with verified property owners. You search, shortlist, and book properties like PG, hostels, and apartments without paying any brokerage fees. Our bidding feature also allows you to secure the best possible rental price.</p>
                                  </div>
                              </div>
                               
                              <div className="faq-item">
                                  <div className="faq-question">
                                      <span>Is Roomhy completely broker-free?</span>
                                      <i data-lucide="chevron-down" className="chevron w-6 h-6"></i>
                                  </div>
                                  <div className="faq-answer">
                                      <p>Yes, absolutely. Our core promise is zero brokerage. We eliminate the middleman, ensuring you only pay the rent and a small, refundable security deposit directly to the property owner. This saves students thousands in commission fees.</p>
                                  </div>
                              </div>
                               
                              <div className="faq-item">
                                  <div className="faq-question">
                                      <span>How do I place a bid on a property?</span>
                                      <i data-lucide="chevron-down" className="chevron w-6 h-6"></i>
                                  </div>
                                  <div className="faq-answer">
                                      <p>When viewing a property, you can see the owner's expected price. You can then submit a 'bid' or offer that you are willing to pay. The owner can accept, reject, or counter your offer. This live bidding process helps you secure a better deal than fixed-price listings.</p>
                                  </div>
                              </div>
                               
                              <div className="faq-item">
                                  <div className="faq-question">
                                      <span>What types of properties are listed on Roomhy?</span>
                                      <i data-lucide="chevron-down" className="chevron w-6 h-6"></i>
                                  </div>
                                  <div className="faq-answer">
                                      <p>We offer a wide range of properties tailored for students, including: fully furnished Hostels (shared rooms, budget-friendly), PGs (Paying Guest accommodation with meals and services), and Apartments (private flats for independent living or sharing with friends).</p>
                                  </div>
                              </div>
                               
                              <div className="faq-item">
                                  <div className="faq-question">
                                      <span>Can I view room availability in real-time?</span>
                                      <i data-lucide="chevron-down" className="chevron w-6 h-6"></i>
                                  </div>
                                  <div className="faq-answer">
                                      <p>Yes, property owners are encouraged to keep their listings updated in real-time. You can filter properties based on immediate availability and expected move-in dates to ensure you only view options that suit your schedule.</p>
                                  </div>
                              </div>
                               
                              <div className="faq-item">
                                  <div className="faq-question">
                                      <span>Do I have to pay to use Roomhy as a student?</span>
                                      <i data-lucide="chevron-down" className="chevron w-6 h-6"></i>
                                  </div>
                                  <div className="faq-answer">
                                      <p>Searching, browsing, and contacting property owners through Roomhy is entirely free for students. Our revenue comes from value-added services offered to property owners, keeping the platform free and zero-brokerage for tenants.</p>
                                  </div>
                              </div>
                               
                              <div className="faq-item">
                                  <div className="faq-question">
                                      <span>How is Roomhy different from regular rental websites?</span>
                                      <i data-lucide="chevron-down" className="chevron w-6 h-6"></i>
                                  </div>
                                  <div className="faq-answer">
                                      <p>We are focused purely on student needs, ensuring all properties are near major educational hubs. We offer a unique bidding system, guarantee zero brokerage, and verify every listing to save you time and money compared to traditional, generalized rental sites.</p>
                                  </div>
                              </div>
                               
                              <div className="faq-item">
                                  <div className="faq-question">
                                      <span>Is it safe to book a property on Roomhy?</span>
                                      <i data-lucide="chevron-down" className="chevron w-6 h-6"></i>
                                  </div>
                                  <div className="faq-answer">
                                      <p>We prioritize your safety. Every property owner and listing is thoroughly verified by our team. The booking process is secure, and you only finalize the full payment after confirming the property details with the owner.</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </section>
              
      
              
              <section id="contact-us" className="scroll-mt-20 py-12">
                  <div className="container mx-auto px-4 sm:px-6">
                      <div className="connect-section max-w-5xl mx-auto rounded-3xl shadow-2xl relative grid lg:grid-cols-2">
                          
                          
                          <div className="relative p-10 md:p-16 flex flex-col justify-center">
                              <div className="wave-bg">
                                  
                                  <svg className="wave-svg" viewBox="0 0 500 500" preserveAspectRatio="none">
                                      <path d="M0,200 C150,350 350,50 500,200 L500,0 L0,0 Z" style={{ fill: "#f5f5f5" }}></path>
                                      <path d="M0,250 C120,400 380,100 500,250 L500,0 L0,0 Z" style={{ fill: "#eeeeee", opacity: "0.5" }}></path>
                                  </svg>
                              </div>
                              <div className="contact-content text-center lg:text-left">
                                  <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                                      Connect with Roomhy
                                  </h2>
                                  <p className="text-lg text-gray-600 max-w-sm mx-auto lg:mx-0">
                                      Drop your concern, query or feedback and we will get back to you in no time.
                                  </p>
                              </div>
                          </div>
      
                          
                          <div className="p-8 md:p-16 bg-white contact-content rounded-r-3xl">
                              <form className="space-y-6">
                                  
                                  
                                  <div>
                                      <label htmlFor="contact-name" className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                                      <input type="text" id="contact-name" name className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500" placeholder="Name" />
                                  </div>
                                  
                                  
                                  <div>
                                      <label htmlFor="contact-phone" className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
                                      <input type="tel" id="contact-phone" name="phone" className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500" placeholder="Phone Number" />
                                  </div>
                                  
                                  
                                  <div>
                                      <label htmlFor="contact-query" className="block text-sm font-semibold text-gray-700 mb-2">Query</label>
                                      <textarea id="contact-query" name="query" rows="4" className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 resize-none" placeholder="Query/Concern"></textarea>
                                  </div>
                                  
                                  
                                  <div className="pt-4">
                                      <button type="submit" className="w-full text-white font-bold py-3 rounded-lg text-lg transition-all duration-300 send-button-gradient hover:opacity-90 shadow-lg hover:shadow-xl">
                                          Send message
                                      </button>
                                  </div>
      
                                  <p className="text-center text-xs text-gray-500 pt-2">
                                      ** You'd hear from us in the next 24 hours, but if you don't, reach out at 
                                      <a href="mailto:hello@roomhy.com" className="text-purple-600 font-medium hover:underline">hello@roomhy.com</a>
                                  </p>
                              </form>
                          </div>
      
                      </div>
                  </div>
              </section>
              
      
          </main>
      
          
          <button id="websiteChatBtn" className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110" aria-label="Open chat">
              <i data-lucide="message-circle" className="w-8 h-8"></i>
          </button>
          <div id="websiteChatModal" className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 hidden flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b">
                  <span className="font-bold text-gray-700">Chat with Owner</span>
                  <button id="closeWebsiteChat" className="text-gray-400 hover:text-gray-700" title="Close chat"><i data-lucide="x" className="w-5 h-5"></i></button>
              </div>
              <div id="websiteChatMessages" className="flex-1 p-3 overflow-y-auto max-h-64 text-sm"></div>
              <div className="flex items-center border-t p-2">
                  <input id="websiteChatInput" type="text" className="flex-1 border rounded px-2 py-1 mr-2" placeholder="Type a message..." />
                  <button id="websiteChatSend" className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded">Send</button>
              </div>
          </div>
          
          
          <div id="signupPromptModal" className="fixed inset-0 z-50 bg-black bg-opacity-50 hidden flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
                  
                  <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">Sign Up to Continue</h2>
                      <button onClick={function(event) { try { return Function('event', "closeSignupModal()").call(event.currentTarget, event); } catch (err) { console.error(err); } }} className="text-gray-400 hover:text-gray-700">
                          <i data-lucide="x" className="w-6 h-6"></i>
                      </button>
                  </div>
                  
                  
                  <p className="text-gray-600 mb-6">
                      Sign up with Roomhy to explore <strong id="selectedCityName"></strong> and find your perfect accommodation.
                  </p>
                  
                  
                  <div className="space-y-3 mb-6">
                      <div className="flex items-start space-x-3">
                          <i data-lucide="check-circle" className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"></i>
                          <span className="text-sm text-gray-700">Browse properties in your preferred city</span>
                      </div>
                      <div className="flex items-start space-x-3">
                          <i data-lucide="check-circle" className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"></i>
                          <span className="text-sm text-gray-700">Send booking requests to property owners</span>
                      </div>
                      <div className="flex items-start space-x-3">
                          <i data-lucide="check-circle" className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"></i>
                          <span className="text-sm text-gray-700">Chat directly with owners</span>
                      </div>
                      <div className="flex items-start space-x-3">
                          <i data-lucide="check-circle" className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"></i>
                          <span className="text-sm text-gray-700">Zero brokerage on all bookings</span>
                      </div>
                  </div>
                  
                  
                  <button id="signupRedirectBtn" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-shadow mb-3">
                      Create Account Now
                  </button>
                  
                  
                  <p className="text-center text-gray-600 text-sm">
                      Already have an account? <a href="/website/login" className="text-purple-600 hover:text-purple-700 font-semibold">Sign In</a>
                  </p>
              </div>
          </div>
          
          
          <footer className="footer container mx-auto px-4 sm:px-6 mt-16">
              <div className="footer-main">
                  
                  <div className="footer-logo">
                      
                      <img src="https://placehold.co/180x40/0f172a/ffffff?text=Roomhy+Logo" alt="Roomhy Logo" />
                      <p className="mt-4">Discover Your Next Home, Together. Zero Brokerage, Student-First Approach.</p>
                  </div>
      
                  
                  <div className="footer-links">
                      <h4>Company</h4>
                      <ul>
                          <li><a href="/website/about">About Us</a></li>
                          <li><a href="#featured">Featured Stays</a></li>
                          <li><a href="#faq">FAQ</a></li>
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
      
                  
                  <div className="footer-contact">
                      <h4>Support & Legal</h4>
                      <div className="space-y-2">
                          <p><i className="fas fa-phone"></i> +91 99830 05030</p>
                          <p><i className="fas fa-envelope"></i> hello@roomhy.com</p>
                      </div>
                      <ul className="mt-4 space-y-1 text-sm">
                          <li><a href="/website/terms">Terms & Conditions</a></li>
                          <li><a href="/website/privacy">Privacy Policy</a></li>
                      </ul>
                  </div>
                  
                  
                  <div className="footer-social lg:col-span-1">
                      <a href="#" title="Facebook"><i className="fab fa-facebook-f"></i></a>
                      <a href="#" title="X"><i className="fab fa-x-twitter"></i></a>
                      <a href="#" title="Instagram"><i className="fab fa-instagram"></i></a>
                      <a href="#" title="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
                  </div>
              </div>
      
              <div className="footer-bottom">
                  <p> 2025 <strong>Roomhy</strong>. All Rights Reserved. Made for students, with love.</p>
              </div>
          </footer>
          
      
      
    </div>
  );
}


