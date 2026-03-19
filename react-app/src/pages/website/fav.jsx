import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useHeroSlideshow, useLucideIcons, useWebsiteCommon, useWebsiteMenu } from "../../utils/websiteUi";
import { loadFavorites, removeFavorite } from "../../utils/websiteFavorites";
import { loadAreasByCity, loadCities, loadTopSpaces } from "../../utils/websiteData";

export default function WebsiteFav() {
  useWebsiteCommon();
  useWebsiteMenu();
  useHeroSlideshow();

  const [favorites, setFavorites] = useState([]);
  const [search, setSearch] = useState("");
  const [cities, setCities] = useState([]);
  const [areasByCity, setAreasByCity] = useState({});
  const [topSpaces, setTopSpaces] = useState(null);
  const [areaIndexByCity, setAreaIndexByCity] = useState({});
  const carouselTimers = useRef({});

  useLucideIcons([favorites, cities, areasByCity, topSpaces, areaIndexByCity]);

  useEffect(() => {
    setFavorites(loadFavorites());
    const onStorage = (event) => {
      if (event.key === "roomhy_favorites") {
        setFavorites(loadFavorites());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      const [citiesData, areasData, topSpacesData] = await Promise.all([
        loadCities(),
        loadAreasByCity(),
        loadTopSpaces()
      ]);
      if (!mounted) return;
      setCities(citiesData || []);
      setAreasByCity(areasData || {});
      setTopSpaces(topSpacesData);
    };
    loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(carouselTimers.current).forEach((timer) => clearInterval(timer));
      carouselTimers.current = {};
    };
  }, []);

  const handleRemoveFavorite = (propertyId) => {
    removeFavorite(propertyId);
    setFavorites(loadFavorites());
  };

  const startCarousel = (cityName, total) => {
    if (total <= 1) return;
    const key = cityName;
    if (carouselTimers.current[key]) clearInterval(carouselTimers.current[key]);
    carouselTimers.current[key] = setInterval(() => {
      setAreaIndexByCity((prev) => {
        const current = prev[cityName] ?? 0;
        const next = (current + 1) % total;
        return { ...prev, [cityName]: next };
      });
    }, 1500);
    setAreaIndexByCity((prev) => ({ ...prev, [cityName]: 1 }));
  };

  const stopCarousel = (cityName) => {
    const key = cityName;
    if (carouselTimers.current[key]) {
      clearInterval(carouselTimers.current[key]);
      carouselTimers.current[key] = null;
    }
    setAreaIndexByCity((prev) => ({ ...prev, [cityName]: 0 }));
  };

  const filteredFavorites = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return favorites;
    return favorites.filter((property) => {
      const name = (property.property_name || property.title || "").toLowerCase();
      const location = (property.location || property.city || "").toLowerCase();
      return name.includes(query) || location.includes(query);
    });
  }, [favorites, search]);

  useHtmlPage({
    title: "My Favorites - Roomhy",
    bodyClass: "text-gray-800",
    htmlAttrs: {
      lang: "en",
      class: "scroll-smooth"
    },
    metas: [
      {
        charset: "UTF-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0"
      }
    ],
    bases: [],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com"
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossorigin: true
      },
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      },
      {
        rel: "stylesheet",
        href: "/website/assets/css/fav.css"
      }
    ],
    styles: [],
    scripts: [
      {
        src: "https://cdn.tailwindcss.com"
      },
      {
        src: "https://unpkg.com/lucide@latest"
      }
    ],
    inlineScripts: [
      "tailwind.config = {\n  theme: {\n    extend: {\n      keyframes: {\n        kenburns: {\n          '0%': { transform: 'scale(1) translate(0, 0)' },\n          '100%': { transform: 'scale(1.1) translate(-2%, 2%)' }\n        },\n        'slide-left': { '0%': { transform: 'translateX(0%)' }, '100%': { transform: 'translateX(-50%)' } },\n        'slide-right': { '0%': { transform: 'translateX(-50%)' }, '100%': { transform: 'translateX(0%)' } }\n      },\n      animation: {\n        kenburns: 'kenburns 30s ease-in-out infinite alternate',\n        'slide-left-infinite': 'slide-left 40s linear infinite',\n        'slide-right-infinite': 'slide-right 40s linear infinite'\n      }\n    }\n  }\n};"
    ]
  });

  return (
    <div className="html-page">
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center">
              <a href="/website/index" className="flex-shrink-0">
                <img
                  src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png"
                  alt="Roomhy Logo"
                  className="h-10 w-25"
                />
              </a>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
              <nav className="hidden lg:flex items-center space-x-6">
                <a href="/website/about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                  About Us
                </a>
                <a href="/website/contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                  Contact
                </a>
              </nav>

              <a
                href="/website/list"
                className="flex-shrink-0 flex items-center space-x-1 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <i data-lucide="plus-circle" className="w-4 h-4"></i>
                <span>
                  Post <span className="hidden sm:inline">Your</span> Property
                </span>
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
          <img
            src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto=format&fit=crop"
            alt="Hero background 1"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-100"
          />
          <img
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop"
            alt="Hero background 2"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-0"
          />
          <img
            src="https://images.unsplash.com/photo-1494203484021-3c454daf695d?q=80&w=2070&auto=format&fit=crop"
            alt="Hero background 3"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-0"
          />
          <div className="absolute inset-0 w-full h-full bg-black/60"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-shadow mb-4" style={{ color: "#fffcf2" }}>
            My Favorites
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto mb-6">
            Here are all the properties you've saved. Review your top choices all in one place.
          </p>

          <div className="relative w-full max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search your favorites..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full p-4 pl-5 pr-14 rounded-lg bg-white text-gray-900 border-transparent focus:ring-4 focus:ring-cyan-300/50 focus:outline-none placeholder-gray-500 shadow-lg"
            />
            <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              <i data-lucide="search" className="w-5 h-5 text-white"></i>
            </button>
          </div>
        </div>
      </section>

      <section id="top-cities-categories" className="container mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="bg-white py-4 shadow-lg rounded-2xl city-filter-container overflow-hidden">
          <h2 className="sr-only">Top Cities</h2>
          <div id="cities-category-slider" className="flex gap-4 md:gap-8 pb-2 scroll-smooth px-4 horizontal-slider overflow-x-auto">
            {cities.map((city) => {
              const areaList = areasByCity[city.name] || [];
              const allImages = [{ img: city.img }, ...areaList];
              const currentIndex = areaIndexByCity[city.name] ?? 0;
              const showAvatar = !city.img;
              return (
                <div key={city.name} className="city-filter group flex flex-col items-center justify-start text-center flex-shrink-0 w-28 space-y-2">
                  <div
                    className="w-24 h-24 rounded-full relative overflow-hidden neon-border cursor-pointer"
                    onMouseEnter={() => startCarousel(city.name, allImages.length)}
                    onMouseLeave={() => stopCarousel(city.name)}
                  >
                    {allImages.map((img, index) => (
                      <img
                        key={`${city.name}-${index}`}
                        src={img.img || ""}
                        alt={`Photo of ${city.name}`}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${currentIndex === index ? "opacity-100" : "opacity-0"}`}
                      />
                    ))}
                    {showAvatar && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 text-3xl font-bold text-gray-700 city-avatar">
                        {city.name ? city.name[0].toUpperCase() : "?"}
                      </div>
                    )}
                    <div className="absolute inset-0 z-20 w-full h-full bg-white flex items-center justify-center transition-opacity duration-500 ease-in-out group-hover:opacity-0 group-focus:opacity-0 city-overlay-icon">
                      <i data-lucide={city.icon || "map-pin"} className="w-9 h-9 text-gray-600"></i>
                    </div>
                  </div>
                  <h3
                    className="text-sm font-medium text-gray-800 leading-tight cursor-pointer"
                    onClick={() => {
                      window.location.href = `ourproperty?city=${encodeURIComponent(city.name)}`;
                    }}
                  >
                    {city.name}
                  </h3>
                </div>
              );
            })}
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
            <span className="text-lg font-semibold text-gray-800" id="welcomeUserName">
              Hi, welcome
            </span>
          </div>
          <a href="/website/profile" className="text-sm font-medium text-blue-600 hover:underline">
            Profile
          </a>
        </div>

        <div className="px-6 py-4">
          <div className="border border-blue-200 rounded-lg p-4 relative overflow-hidden">
            <p className="font-semibold text-gray-800 mb-3 relative z-10">Looking to Sell/Rent your Property?</p>
            <a href="/website/list" className="block text-center w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg text-sm transition-colors relative z-10">
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
          <a href="/website/fav" className="flex items-center space-x-4 p-3 rounded-lg text-blue-600 bg-blue-50">
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
        </nav>

        <div className="p-4 border-t flex-shrink-0">
          <a href="/website/login" className="flex items-center space-x-4 p-3 rounded-lg text-red-600 hover:bg-red-50">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <i data-lucide="log-out" className="w-5 h-5 text-gray-600"></i>
            </div>
            <span>Logout</span>
          </a>
        </div>
      </div>

      {topSpaces && (
        <section id="top-spaces-dynamic" className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
          <section id={`top-spaces-${topSpaces.city.toLowerCase().replace(/\s+/g, "-")}`} className="light-card rounded-2xl p-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Top Spaces in {topSpaces.city}</h2>
            <div className="relative -m-2">
              <button
                className="spaces-prev-btn hidden absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 text-gray-700 sm:block lg:hidden"
                onClick={(event) => {
                  const slider = event.currentTarget.parentElement?.querySelector(".spaces-slider");
                  slider?.scrollBy({ left: -300, behavior: "smooth" });
                }}
              >
                <i data-lucide="chevron-left" className="w-6 h-6"></i>
              </button>
              <div className="spaces-slider flex gap-6 overflow-x-auto pb-2 pt-2 -mx-4 px-4 snap-x snap-mandatory scroll-smooth horizontal-slider lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:p-0 lg:m-0">
                {topSpaces.spaces.map((space) => {
                  const amenitiesList = Array.isArray(space.facilities) ? space.facilities.slice(0, 3) : [];
                  const iconMap = {
                    wifi: "wifi",
                    ac: "wind",
                    tv: "tv",
                    laundry: "shirt",
                    parking: "car",
                    food: "utensils",
                    gym: "dumbbell"
                  };
                  const price = typeof space.price === "number" ? space.price.toLocaleString() : space.price;
                  return (
                    <div key={space.id || space.title} className="group flex-shrink-0 snap-start w-80 lg:w-full">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="relative">
                          <img src={space.img} alt={space.title} className="w-full h-48 object-cover" />
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5">
                            <span className="w-2 h-2 bg-white rounded-full opacity-90"></span>
                            <span className="w-2 h-2 bg-white rounded-full opacity-50"></span>
                            <span className="w-2 h-2 bg-white rounded-full opacity-50"></span>
                            <span className="w-2 h-2 bg-white rounded-full opacity-50"></span>
                          </div>
                        </div>

                        <div className="p-4 flex flex-col flex-grow">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-lg text-gray-900">{space.title}</h3>
                            <div className="text-right flex-shrink-0 ml-2">
                              <p className="font-bold text-blue-600 text-lg">₹{price}</p>
                              <p className="text-xs text-gray-500">onwards</p>
                            </div>
                          </div>

                          <p className="text-gray-600 text-sm mt-1">{space.location}</p>

                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="text-xs font-semibold text-gray-500 mb-2">Key Facilities</h4>
                            <div className="flex items-center space-x-3 text-gray-600">
                              {amenitiesList.map((amenity) => (
                                <i key={amenity} data-lucide={iconMap[amenity.toLowerCase()] || "star"} className="w-4 h-4"></i>
                              ))}
                            </div>
                          </div>

                          <a href={`property?id=${space.id || ""}`} className="block w-full text-center bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg text-sm hover:bg-blue-700 transition-colors mt-4">
                            View Details
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                className="spaces-next-btn hidden absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 text-gray-700 sm:block lg:hidden"
                onClick={(event) => {
                  const slider = event.currentTarget.parentElement?.querySelector(".spaces-slider");
                  slider?.scrollBy({ left: 300, behavior: "smooth" });
                }}
              >
                <i data-lucide="chevron-right" className="w-6 h-6"></i>
              </button>
            </div>
          </section>
        </section>
      )}

      <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-16">
        <section id="favorites-list">
          <div id="favorites-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((property) => {
              const propertyId = property._id || property.enquiry_id;
              const propertyImage = property.property_image || property.images?.[0] || "https://via.placeholder.com/400x300?text=No+Image";
              const propertyName = property.property_name || property.title || "Property";
              const propertyLocation = property.location || property.city || "Location";
              const propertyPrice = property.price || "Price Not Available";
              const propertyType = property.property_type || "Residential";
              const bedrooms = property.bedrooms || 0;
              const bathrooms = property.bathrooms || 0;

              return (
                <div key={propertyId} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
                  <div className="relative overflow-hidden h-48 bg-gray-200">
                    <img src={propertyImage} alt={propertyName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    <button
                      className="favorite-btn absolute top-3 left-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition-colors"
                      onClick={(event) => {
                        event.preventDefault();
                        handleRemoveFavorite(propertyId);
                      }}
                      title="Remove from favorites"
                    >
                      <i data-lucide="heart" className="w-5 h-5 fill-current"></i>
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">{propertyName}</h3>
                    <p className="text-sm text-gray-500 mb-2 flex items-center">
                      <i data-lucide="map-pin" className="w-4 h-4 mr-1"></i>
                      {propertyLocation}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded">{propertyType}</span>
                    </p>
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-3 pb-3 border-b">
                      <span className="flex items-center">
                        <i data-lucide="bed" className="w-4 h-4 mr-1"></i>
                        {bedrooms} Beds
                      </span>
                      <span className="flex items-center">
                        <i data-lucide="droplet" className="w-4 h-4 mr-1"></i>
                        {bathrooms} Baths
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-bold text-blue-600">₹{propertyPrice}</p>
                      <a href={`property?id=${propertyId}`} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                        View Details
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div id="no-favorites" className={`text-center py-16 ${filteredFavorites.length > 0 ? "hidden" : ""}`}>
            <i data-lucide="heart" className="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-600 mb-2">No Favorites Yet</h2>
            <p className="text-gray-500 mb-6">Start adding properties to your favorites by clicking the heart icon!</p>
            <a href="/website/ourproperty" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
              Browse Properties
            </a>
          </div>
        </section>
      </main>

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
            <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" />
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
          <p>© 2025 <strong>Roomhy</strong>. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}


