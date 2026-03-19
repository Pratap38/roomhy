import React, { useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { useLucideIcons, useWebsiteCommon } from "../../utils/websiteUi";

export default function WebsitePropertyNew() {
  useWebsiteCommon();
  const [showPayment, setShowPayment] = useState(false);

  useLucideIcons([showPayment]);

  useHtmlPage({
    title: "Athena House - Student Accommodation",
    bodyClass: "bg-gray-50",
    htmlAttrs: {
      lang: "en",
      class: "scroll-smooth"
    },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    bases: [],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: true },
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/website/assets/css/property_new.css" }
    ],
    styles: [],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" }
    ],
    inlineScripts: []
  });

  return (
    <div className="html-page">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/website/index" className="font-bold text-xl text-blue-600">Roomhy</a>
          <div className="flex gap-4 items-center">
            <button id="mobile-menu-btn" className="md:hidden p-2 text-slate-600"><i data-lucide="menu" className="w-7 h-7"></i></button>
            <a href="/website/list" className="text-gray-600 hover:text-blue-600 inline-flex items-center text-sm">
              <i data-lucide="arrow-left" className="w-4 h-4 mr-1"></i> Back
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <section className="mb-12">
          <div className="relative bg-gray-900 rounded-lg overflow-hidden h-96 sm:h-[500px] shadow-lg">
            <div className="flex overflow-x-auto snap-x snap-mandatory h-full" id="carousel">
              <img src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1000&h=600&fit=crop" alt="Room" className="w-full h-full object-cover flex-shrink-0" />
              <img src="https://images.unsplash.com/photo-1615875605825-5eb9bb5c6896?w=1000&h=600&fit=crop" alt="Washroom" className="w-full h-full object-cover flex-shrink-0" />
              <img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1000&h=600&fit=crop" alt="Common Area" className="w-full h-full object-cover flex-shrink-0" />
              <img src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1000&h=600&fit=crop" alt="Lounge" className="w-full h-full object-cover flex-shrink-0" />
              <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&h=600&fit=crop" alt="Kitchen" className="w-full h-full object-cover flex-shrink-0" />
            </div>
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-semibold">
              1 / 5
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex gap-2 mb-3">
                    <span className="badge badge-info" id="property-type">Hostel for Girls</span>
                    <span className="badge badge-success" id="verified-badge">✓ Verified</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900" id="property-name">Athena House</h1>
                  <p className="text-gray-600 mt-2 flex items-center">
                    <i data-lucide="map-pin" className="w-5 h-5 mr-2 text-blue-600"></i>
                    <span id="property-location">Hinjawadi, Pune</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-500 mb-2">
                    <i data-lucide="star" className="w-5 h-5 fill-current"></i>
                    <span className="font-bold text-gray-900">4.8</span>
                  </div>
                  <p className="text-sm text-gray-600">(12 reviews)</p>
                </div>
              </div>
            </section>

            <section className="card p-8 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2" id="cta-title">Ready to Join?</h2>
                <p className="text-gray-600 mb-6" id="cta-description">Send your bid to all hostels in this area</p>
                <button id="bid-btn" className="btn-primary w-full py-4 px-6 text-lg flex items-center justify-center gap-2 mb-3" onClick={() => setShowPayment(true)}>
                  <i data-lucide="send" className="w-5 h-5"></i>
                  <span id="bid-btn-text">Bid to All</span>
                </button>
                <button className="btn-secondary w-full py-3 px-6">Request Callback</button>
              </div>
            </section>

            <section className="card p-6">
              <h3 className="text-xl font-bold mb-4">Rent Breakdown</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Monthly Rent</span>
                  <span className="font-semibold">₹10,000</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Security Deposit</span>
                  <span className="font-semibold">₹10,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Electricity / Maintenance</span>
                  <span className="font-semibold">Included</span>
                </div>
              </div>
            </section>

            <section className="card p-6">
              <h3 className="text-xl font-bold mb-6">Facilities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <i data-lucide="wifi" className="w-6 h-6 text-blue-600"></i>
                  <span className="text-sm">High-Speed WiFi</span>
                </div>
                <div className="flex items-center gap-3">
                  <i data-lucide="utensils" className="w-6 h-6 text-blue-600"></i>
                  <span className="text-sm">Daily Meals</span>
                </div>
                <div className="flex items-center gap-3">
                  <i data-lucide="wind" className="w-6 h-6 text-blue-600"></i>
                  <span className="text-sm">Air Conditioned</span>
                </div>
                <div className="flex items-center gap-3">
                  <i data-lucide="washing-machine" className="w-6 h-6 text-blue-600"></i>
                  <span className="text-sm">Laundry Service</span>
                </div>
                <div className="flex items-center gap-3">
                  <i data-lucide="car" className="w-6 h-6 text-blue-600"></i>
                  <span className="text-sm">Parking</span>
                </div>
                <div className="flex items-center gap-3">
                  <i data-lucide="plug-zap" className="w-6 h-6 text-blue-600"></i>
                  <span className="text-sm">Power Backup</span>
                </div>
              </div>
            </section>

            <section className="card p-6">
              <h3 className="text-xl font-bold mb-4">House Rules</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-3">
                  <i data-lucide="circle" className="w-2 h-2 mt-2 text-blue-600 flex-shrink-0"></i>
                  <span><strong>No smoking</strong> in rooms or common areas</span>
                </li>
                <li className="flex items-start gap-3">
                  <i data-lucide="circle" className="w-2 h-2 mt-2 text-blue-600 flex-shrink-0"></i>
                  <span><strong>Alcohol not allowed</strong> on premises</span>
                </li>
                <li className="flex items-start gap-3">
                  <i data-lucide="circle" className="w-2 h-2 mt-2 text-blue-600 flex-shrink-0"></i>
                  <span><strong>Visitors allowed</strong> in common areas only (9 AM - 9 PM)</span>
                </li>
                <li className="flex items-start gap-3">
                  <i data-lucide="circle" className="w-2 h-2 mt-2 text-blue-600 flex-shrink-0"></i>
                  <span><strong>Curfew at 10:30 PM</strong> (exceptions with approval)</span>
                </li>
              </ul>
            </section>

            <section className="card p-6">
              <h3 className="text-xl font-bold mb-4">Location</h3>
              <div className="bg-gray-200 h-80 rounded-lg mb-4 flex items-center justify-center">
                <i data-lucide="map" className="w-12 h-12 text-gray-400"></i>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <i data-lucide="graduation-cap" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"></i>
                  <div>
                    <p className="font-semibold">Symbiosis Institute</p>
                    <p className="text-gray-600">1.5 km away</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <i data-lucide="bus" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"></i>
                  <div>
                    <p className="font-semibold">Bus Stop</p>
                    <p className="text-gray-600">300 m away</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <i data-lucide="shopping-cart" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"></i>
                  <div>
                    <p className="font-semibold">D-Mart</p>
                    <p className="text-gray-600">800 m away</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="card p-6 bg-blue-50 border border-blue-200">
              <h3 className="text-xl font-bold mb-4">Property Manager</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                  <i data-lucide="user" className="w-6 h-6 text-blue-600"></i>
                </div>
                <div>
                  <p className="font-semibold">John D.</p>
                  <p className="text-sm text-gray-600">95% response rate</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3 p-2 bg-white rounded">
                <i data-lucide="shield" className="w-3 h-3 inline mr-1"></i>
                Phone number will be shared only after owner accepts your bid
              </p>
            </section>

            <section className="card p-6 locked-state bg-gray-50 border border-gray-300">
              <div className="text-center">
                <i data-lucide="lock" className="w-12 h-12 text-gray-400 mx-auto mb-3"></i>
                <h3 className="font-bold text-gray-700 mb-2">Schedule a Visit</h3>
                <p className="text-sm text-gray-600">Visit scheduling will be available after the owner accepts your bid</p>
              </div>
            </section>

            <section className="card p-6 bg-green-50 border border-green-200">
              <h3 className="text-xl font-bold mb-4 text-green-900">Trust & Safety</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <i data-lucide="check-circle" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"></i>
                  <span>All payments handled securely by Roomhy</span>
                </li>
                <li className="flex items-start gap-3">
                  <i data-lucide="check-circle" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"></i>
                  <span>₹500 visit security is fully refundable</span>
                </li>
                <li className="flex items-start gap-3">
                  <i data-lucide="check-circle" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"></i>
                  <span>No direct contact until owner accepts</span>
                </li>
                <li className="flex items-start gap-3">
                  <i data-lucide="check-circle" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"></i>
                  <span>Chat available only after acceptance</span>
                </li>
              </ul>
            </section>
          </div>

          <aside className="lg:col-span-1">
            <div className="card p-6 sticky top-24 space-y-6">
              <div>
                <p className="text-sm text-gray-600">Monthly Rent</p>
                <p className="text-4xl font-bold text-gray-900">₹10,000</p>
                <p className="text-sm text-gray-600">/month</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="font-semibold text-blue-900 mb-2" id="bid-info-title">Bid to All</p>
                <p className="text-sm text-blue-800" id="bid-info-desc">Your bid will be sent to all matching hostels in this area</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">What You'll Pay</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bid Activation</span>
                    <span className="font-semibold">₹49</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Visit Security</span>
                    <span className="font-semibold">₹500</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>(Refundable)</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 my-3 pt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-xl text-blue-600">₹549</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t border-gray-200 pt-4 text-sm">
                <div className="flex gap-2">
                  <i data-lucide="check" className="w-5 h-5 text-green-600 flex-shrink-0"></i>
                  <span className="text-gray-700">Chat opens after owner accepts</span>
                </div>
                <div className="flex gap-2">
                  <i data-lucide="check" className="w-5 h-5 text-green-600 flex-shrink-0"></i>
                  <span className="text-gray-700">Max 2 visits allowed</span>
                </div>
                <div className="flex gap-2">
                  <i data-lucide="check" className="w-5 h-5 text-green-600 flex-shrink-0"></i>
                  <span className="text-gray-700">Security refunded on booking</span>
                </div>
              </div>

              <button id="sidebar-bid-btn" className="btn-primary w-full py-3 text-lg" onClick={() => setShowPayment(true)}>
                <i data-lucide="send" className="w-4 h-4 inline mr-2"></i>
                <span id="sidebar-bid-text">Bid to All</span>
              </button>
            </div>
          </aside>
        </div>
      </main>

      <div id="payment-modal" className={`fixed inset-0 bg-black/50 items-center justify-center z-50 p-4 ${showPayment ? "flex" : "hidden"}`}>
        <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Place Your Bid</h2>
          <p className="text-gray-600 mb-4">Total: <span className="text-2xl font-bold text-blue-600">₹549</span></p>
          <button className="btn-primary w-full py-3 mb-2">Proceed to Payment</button>
          <button className="text-gray-600" onClick={() => setShowPayment(false)}>Cancel</button>
        </div>
      </div>

      <div id="mobile-overlay" className="fixed inset-0 bg-black/50 z-[60] hidden backdrop-blur-sm"></div>
      <div id="mobile-sidebar" className="fixed inset-y-0 right-0 w-72 bg-white z-[70] translate-x-full transition-transform duration-300 p-6 flex flex-col gap-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-indigo-600 text-xl">Menu</span>
          <button id="close-mobile-menu"><i data-lucide="x" className="w-6 h-6 text-slate-400"></i></button>
        </div>
        <a href="/website/index" className="text-lg font-semibold text-slate-700 flex items-center gap-3"><i data-lucide="home" className="w-5 h-5"></i> Home</a>
        <a href="/website/ourproperty" className="text-lg font-semibold text-slate-700 flex items-center gap-3"><i data-lucide="search" className="w-5 h-5"></i> Properties</a>
        <a href="/website/contact" className="text-lg font-semibold text-slate-700 flex items-center gap-3"><i data-lucide="phone" className="w-5 h-5"></i> Contact</a>
        <hr />
        <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Account</button>
      </div>

      <footer className="bg-gray-900 text-gray-300 py-12 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm">© 2025 Roomhy. Your trusted student accommodation platform.</p>
        </div>
      </footer>
    </div>
  );
}


