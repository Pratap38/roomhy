import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { getWebsiteApiUrl } from "../../utils/websiteSession";
import { useHeroSlideshow, useLucideIcons, useWebsiteCommon, useWebsiteMenu } from "../../utils/websiteUi";
import { getStoredCities } from "../../utils/websiteData";

export default function WebsiteList() {
  useWebsiteCommon();
  useWebsiteMenu();
  useHeroSlideshow();

  const apiUrl = useMemo(() => getWebsiteApiUrl(), []);
  const [cityOptions, setCityOptions] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    property_name: "",
    tenants_managed: "",
    city: "",
    country: "",
    contact_name: "",
    additional_message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);

  useLucideIcons([cityOptions, submitMessage]);

  useEffect(() => {
    let mounted = true;
    const loadCities = async () => {
      let citiesData = [];
      try {
        const response = await fetch(`${apiUrl}/api/cities`);
        if (response.ok) {
          const data = await response.json();
          citiesData = (data.data || []).map((city) => city.name);
        }
      } catch (err) {
        // ignore
      }

      if (citiesData.length === 0) {
        citiesData = getStoredCities().map((city) => city.name).filter(Boolean);
      }

      if (citiesData.length === 0) {
        citiesData = ["Indore", "Kota", "Ahmedabad", "Delhi"];
      }

      if (mounted) setCityOptions(citiesData);
    };
    loadCities();
    return () => {
      mounted = false;
    };
  }, [apiUrl]);

  useEffect(() => {
    if (formData.city === "custom") {
      const customLocation = window.prompt("Enter your city/location name:");
      if (customLocation && customLocation.trim()) {
        setCityOptions((prev) => {
          if (prev.includes(customLocation)) return prev;
          return [...prev, customLocation];
        });
        setFormData((prev) => ({ ...prev, city: customLocation }));
      } else {
        setFormData((prev) => ({ ...prev, city: "" }));
      }
    }
  }, [formData.city]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitMessage(null);

    const ownerName = formData.name.trim();
    const propertyName = formData.property_name.trim();
    const city = formData.city.trim();
    const country = formData.country.trim();
    const contactName = formData.contact_name.trim();
    const additionalMessage = formData.additional_message.trim();
    const tenantsManaged = parseInt(formData.tenants_managed, 10) || 0;

    if (!ownerName || !propertyName || !city || !country || !contactName) {
      setSubmitMessage({ type: "error", text: "Please fill in all required fields." });
      return;
    }

    const enquiryDescriptionLines = [`Tenants Managed: ${tenantsManaged}`, `Contact Name: ${contactName}`];
    if (additionalMessage) {
      enquiryDescriptionLines.push(`Additional Message: ${additionalMessage}`);
    }

    const enquiryData = {
      property_type: "pg",
      property_name: propertyName,
      city,
      locality: country,
      address: "",
      pincode: "",
      description: enquiryDescriptionLines.join("\n"),
      amenities: [],
      gender_suitability: "",
      rent: 0,
      deposit: "",
      owner_name: ownerName,
      owner_email: "",
      owner_phone: "NA",
      contact_name: contactName,
      tenants_managed: tenantsManaged,
      country,
      additional_message: additionalMessage
    };

    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/api/website-enquiry/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enquiryData)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to submit enquiry");
      }
      setSubmitMessage({
        type: "success",
        text: "Success! Your property enquiry has been submitted successfully. It will be reviewed by our team soon."
      });
      setFormData({
        name: "",
        property_name: "",
        tenants_managed: "",
        city: "",
        country: "",
        contact_name: "",
        additional_message: ""
      });
    } catch (error) {
      setSubmitMessage({ type: "error", text: error.message || "Failed to submit enquiry." });
    } finally {
      setSubmitting(false);
    }
  };

  useHtmlPage({
    title: "Roomhy - List Your Property",
    bodyClass: "text-gray-800 flex flex-col min-h-screen",
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
        href: "/website/assets/css/list.css"
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
      "tailwind.config = {\n  theme: {\n    extend: {\n      keyframes: {\n        kenburns: { '0%': { transform: 'scale(1) translate(0, 0)' }, '100%': { transform: 'scale(1.1) translate(-2%, 2%)' } },\n        'slide-left': { '0%': { transform: 'translateX(0%)' }, '100%': { transform: 'translateX(-50%)' } },\n        'slide-right': { '0%': { transform: 'translateX(-50%)' }, '100%': { transform: 'translateX(0%)' } },\n        float: { '0%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' }, '100%': { transform: 'translateY(0px)' } }\n      },\n      animation: {\n        kenburns: 'kenburns 30s ease-in-out infinite alternate',\n        'slide-left-infinite': 'slide-left 40s linear infinite',\n        'slide-right-infinite': 'slide-right 40s linear infinite',\n        float: 'float 6s ease-in-out infinite'\n      }\n    }\n  }\n};"
    ]
  });

  return (
    <div className="html-page">
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-sm shadow-sm flex-shrink-0">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center space-x-4">
              <a href="/website/index" className="flex items-center space-x-1 p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Go back">
                <i data-lucide="chevron-left" className="w-6 h-6 text-gray-800"></i>
              </a>
              <a href="/website/index" className="flex-shrink-0">
                <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-10 w-25" />
              </a>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
              <nav className="hidden lg:flex items-center space-x-6">
                <a href="/website/about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">About Us</a>
                <a href="/website/contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contact</a>
              </nav>

              <a href="#" className="flex-shrink-0 flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                <i data-lucide="building" className="w-4 h-4"></i>
                <span>My <span className="hidden sm:inline">Listings</span></span>
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
          <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto=format&fit=crop" alt="Hero background 1" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-100" />
          <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop" alt="Hero background 2" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-0" />
          <img src="https://images.unsplash.com/photo-1494203484021-3c454daf695d?q=80&w=2070&auto=format&fit=crop" alt="Hero background 3" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-kenburns opacity-0" />
          <div className="absolute inset-0 w-full h-full bg-black/60"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <h1 className="text-3xl md:text-5xl font-extrabold text-shadow mb-4" style={{ color: "#fffcf2" }}>
            List Your Property For Free
          </h1>
          <p className="text-xl text-gray-200 text-shadow">Reach thousands of verified students with a simple form.</p>
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
            <span className="text-lg font-semibold text-gray-800" id="welcomeUserName">Hi, welcome</span>
          </div>
          <a href="/website/profile" className="text-sm font-medium text-blue-600 hover:underline">Profile</a>
        </div>

        <div className="px-6 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 relative overflow-hidden">
            <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990266/roomhy/website/post.png" alt="Illustartion of people with house" className="absolute right-0 bottom-0 opacity-80 w-32 h-auto" style={{ pointerEvents: "none" }} />
            <p className="font-semibold text-gray-800 mb-3 relative z-10">Looking to Sell/Rent your Property?</p>
            <a href="#register-property" className="block text-center w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg text-sm hover:bg-blue-700 transition-colors relative z-10" style={{ width: "150px" }}>
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
          <hr className="my-2 border-gray-100" />
          <a href="#why-roomhy" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <i data-lucide="info" className="w-5 h-5 text-gray-600"></i>
            </div>
            <span>About Us</span>
          </a>
          <a href="/website/contact" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <i data-lucide="mail" className="w-5 h-5 text-gray-600"></i>
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
          <a href="#" className="flex items-center space-x-4 p-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <i data-lucide="log-out" className="w-5 h-5 text-red-600"></i>
            </div>
            <span>Logout</span>
          </a>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12 flex-grow">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">Property Listing Form</h1>
          <p className="text-center text-gray-600 mb-10 -mt-4">Fill the details below and submit for review.</p>

          {submitMessage && (
            <div id="submit-message" className={`mb-4 p-4 rounded-lg ${submitMessage.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
              {submitMessage.text}
            </div>
          )}

          <form id="property-form" action="#" method="POST" className="space-y-8" onSubmit={handleSubmit}>
            <input type="hidden" name="property_type" value="pg" />
            <input type="hidden" name="owner_phone" value="NA" />

            <div className="light-card rounded-lg p-6 md:p-8">
              <div className="flex items-center mb-6 border-b pb-4">
                <i data-lucide="clipboard-list" className="w-6 h-6 mr-3 text-blue-600"></i>
                <h2 className="text-xl font-semibold text-gray-800">Required Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                  <input type="text" id="name" name="name" required className="form-input w-full border-gray-300 rounded-md shadow-sm" placeholder="Enter your name" value={formData.name} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="property_name" className="block text-sm font-medium text-gray-700 mb-1">Property Name <span className="text-red-500">*</span></label>
                  <input type="text" id="property_name" name="property_name" required className="form-input w-full border-gray-300 rounded-md shadow-sm" placeholder="Enter property name" value={formData.property_name} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="tenants_managed" className="block text-sm font-medium text-gray-700 mb-1">Number of Tenant Managed <span className="text-red-500">*</span></label>
                  <input type="number" id="tenants_managed" name="tenants_managed" min="0" required className="form-input w-full border-gray-300 rounded-md shadow-sm" placeholder="Enter number of tenants" value={formData.tenants_managed} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                  <select id="city" name="city" required className="form-select w-full border-gray-300 rounded-md shadow-sm" value={formData.city} onChange={handleChange}>
                    <option value="">Select City</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                    <option value="custom">+ Add Custom Location</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                  <input type="text" id="country" name="country" required className="form-input w-full border-gray-300 rounded-md shadow-sm" placeholder="Enter country" value={formData.country} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-1">Contact Name <span className="text-red-500">*</span></label>
                  <input type="text" id="contact_name" name="contact_name" required className="form-input w-full border-gray-300 rounded-md shadow-sm" placeholder="Enter contact person name" value={formData.contact_name} onChange={handleChange} />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="additional_message" className="block text-sm font-medium text-gray-700 mb-1">Additional Message (if any)</label>
                  <textarea id="additional_message" name="additional_message" rows="4" className="form-textarea w-full border-gray-300 rounded-md shadow-sm" placeholder="Type additional message..." value={formData.additional_message} onChange={handleChange}></textarea>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <button type="submit" disabled={submitting} className="w-full md:w-auto bg-blue-600 text-white font-semibold py-3 px-10 rounded-lg text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/50">
                <i data-lucide="send" className="w-5 h-5 inline mr-2"></i>
                <span>{submitting ? "Submitting..." : "Submit"}</span>
              </button>
              <p className="text-xs text-gray-500 mt-3">Your listing will be reviewed before going live.</p>
            </div>
          </form>
        </div>
      </main>

      <a href="/website/contact" className="fixed bottom-6 right-6 z-50 p-4 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-transform hover:scale-110">
        <i data-lucide="message-circle" className="w-8 h-8"></i>
      </a>

      <footer className="footer flex-shrink-0 mt-auto">
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
              <li><a href="/website/ourproperty">Our Properties</a></li>
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
            <h4>Get in Touch</h4>
            <p><i data-lucide="mail" className="w-4 h-4 inline-block"></i> contact@roomhy.com</p>
            <p><i data-lucide="phone" className="w-4 h-4 inline-block"></i> +91 98765 43210</p>
            <p><i data-lucide="map-pin" className="w-4 h-4 inline-block"></i> 123, Tech Park, Bangalore, India</p>
            <div className="footer-social">
              <a href="#" aria-label="Facebook"><i data-lucide="facebook" className="w-5 h-5"></i></a>
              <a href="#" aria-label="Instagram"><i data-lucide="instagram" className="w-5 h-5"></i></a>
              <a href="#" aria-label="Twitter"><i data-lucide="twitter" className="w-5 h-5"></i></a>
              <a href="#" aria-label="LinkedIn"><i data-lucide="linkedin" className="w-5 h-5"></i></a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; 2024 Roomhy. All rights reserved.
        </div>
      </footer>
    </div>
  );
}


