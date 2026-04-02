

import React from "react";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import WebsiteHeader from "../../components/website/WebsiteHeader";
import { useHtmlPage } from "../../utils/htmlPage";
import { buildBreadcrumbJsonLd, buildOrganizationJsonLd, buildSeoConfig } from "../../utils/websiteSeo";
import { useHeroSlideshow, useWebsiteCommon, useWebsiteMenu } from "../../utils/websiteUi";

export default function WebsiteAbout() {
  useWebsiteCommon();
  useWebsiteMenu();
  useHeroSlideshow();

  const seo = buildSeoConfig({
    title: "About Roomhy | Student Housing Platform in India",
    description:
      "Learn how Roomhy helps students find verified rentals, PGs, hostels and coliving spaces with a simpler, broker-free booking experience.",
    path: "/website/about",
    keywords: ["about roomhy", "student housing platform", "verified rentals india", "broker free accommodation"],
    jsonLd: [
      buildOrganizationJsonLd(),
      buildBreadcrumbJsonLd([
        { name: "Home", path: "/website/index" },
        { name: "About", path: "/website/about" }
      ])
    ]
  });

  useHtmlPage({
    title: "About Roomhy | Student Housing Platform in India",
    bodyClass: "text-gray-800 flex flex-col min-h-screen",
    htmlAttrs: { "lang": "en", "class": "scroll-smooth" },
    metas: [
      { "charset": "UTF-8" },
      { "name": "viewport", "content": "width=device-width, initial-scale=1.0" },
      ...seo.metas
    ],
    bases: [],
    links: [
      { "rel": "preconnect", "href": "https://fonts.googleapis.com" },
      { "rel": "preconnect", "href": "https://fonts.gstatic.com", "crossorigin": true },
      {
        "href": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lexend:wght@400;500;600;700;800&display=swap",
        "rel": "stylesheet"
      },
      {
        "rel": "stylesheet",
        "href": "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
      },
      ...seo.links
    ],
    headScripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" },
      ...seo.headScripts
    ],
    styles: [
      `
        /* ── BASE ── */
        *, *::before, *::after { box-sizing: border-box; }
        body {
          font-family: 'Inter', sans-serif;
          background-color: #f1f2f6;
          color: #1F2937;
          overflow-x: hidden;
          margin: 0;
        }
        h1, h2, h3, h4, h5, h6 { font-family: 'Lexend', sans-serif; }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in {
          animation-name: slideIn;
          animation-duration: 0.7s;
          animation-fill-mode: forwards;
          animation-timing-function: ease-out;
          opacity: 0;
        }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0    rgba(168,85,247,0.15); }
          50%       { box-shadow: 0 0 0 10px rgba(168,85,247,0);    }
        }
        .pulse-icon { animation: pulseGlow 3s ease-in-out infinite; }

        @keyframes kenburns {
          0%   { transform: scale(1)    translateX(0)   translateY(0);   }
          50%  { transform: scale(1.08) translateX(-1%) translateY(-1%); }
          100% { transform: scale(1)    translateX(0)   translateY(0);   }
        }
        .animate-kenburns { animation: kenburns 12s ease-in-out infinite; }

        @keyframes float {
          0%   { transform: translateY(0px);   }
          50%  { transform: translateY(-10px); }
          100% { transform: translateY(0px);   }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }

        .text-shadow { text-shadow: 0 2px 4px rgba(0,0,0,0.2); }

        .light-card {
          background: #fff;
          border: 1px solid #E5E7EB;
          box-shadow: 0 4px 6px -1px rgb(0 0 0/0.05), 0 2px 4px -2px rgb(0 0 0/0.05);
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        .light-card:hover {
          box-shadow: 0 10px 15px -3px rgb(0 0 0/0.1), 0 4px 6px -4px rgb(0 0 0/0.1);
          transform: translateY(-4px);
        }
        .glow-button { transition: all 0.3s ease; }
        .glow-button:hover { transform: scale(1.05); }

        .feature-card { transition: all 0.3s ease-in-out; }
        .feature-card:hover {
          transform: translateY(-8px) scale(1.03);
          box-shadow: 0 15px 30px -10px rgba(0,0,0,0.1);
          border-color: #d8b4fe;
        }
        .stat-card { transition: all 0.3s ease-in-out; }
        .stat-card:hover {
          transform: translateY(-10px) scale(1.03);
          box-shadow: 0 20px 40px -15px rgba(0,0,0,0.25);
        }
        .founder-card { transition: all 0.3s ease-in-out; }
        .founder-card:hover {
          transform: scale(1.03);
          box-shadow: 0 20px 40px -15px rgba(0,0,0,0.2);
        }

        /* ── MOBILE RESPONSIVENESS ── */
        @media (max-width: 640px) {
          .hero-section { padding-top: 4rem !important; padding-bottom: 4rem !important; }
          .hero-section h1 { font-size: 2rem !important; }
          .hero-section p  { font-size: 1rem !important; }
        }

        @media (max-width: 1024px) {
          .welcome-img-grid {
            display: flex !important;
            flex-direction: column;
            height: auto !important;
            gap: 12px;
          }
          .welcome-img-grid > div {
            width: 100% !important;
            height: 200px !important;
          }
        }

        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; gap: 1rem !important; }
          .stats-grid h3 { font-size: 1.75rem !important; }
        }

        @media (max-width: 640px) {
          .feature-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 641px) and (max-width: 1023px) {
          .feature-grid { grid-template-columns: repeat(2,1fr) !important; }
        }

        @media (max-width: 768px) {
          .stat-cards-grid { grid-template-columns: 1fr !important; }
          .stat-card { padding: 2rem !important; }
          .stat-card h3 { font-size: 2.5rem !important; }
        }

        @media (max-width: 1023px) {
          .flex-section { flex-direction: column !important; }
          .flex-section .flex-col-img { width: 100% !important; min-width: unset !important; }
          .flex-section .flex-col-text { width: 100% !important; min-width: unset !important; }
        }

        @media (max-width: 640px) {
          .timeline-years div { font-size: 1.25rem !important; }
        }

        @media (max-width: 640px) {
          .mission-inner { padding: 1.5rem !important; }
          .mission-inner h3 { font-size: 1.5rem !important; }
          .mission-inner p, .mission-inner li { font-size: 1rem !important; }
        }

        @media (max-width: 380px) {
          .post-prop-btn span.always-show { display: none; }
        }

        @media (max-width: 640px) {
          .founder-card { max-width: 100% !important; }
        }

        @media (max-width: 640px) {
          .why-list { gap: 1.5rem !important; }
        }

        @media (max-width: 640px) {
          .tech-mini-cards { flex-direction: column !important; }
          .tech-mini-cards > div { min-width: unset !important; }
        }
      `
    ],
    scripts: [],
    inlineScripts: [
      `setTimeout(function() {
        if (window.lucide) window.lucide.createIcons();
      }, 100);`
    ]
  });

  return (
    <div className="html-page">

      {/* ── SHARED HEADER COMPONENT ── */}
      <WebsiteHeader />

      {/* ── HERO ── */}
      <section className="hero-section relative py-20 md:py-36 text-white">
        <div id="hero-image-wrapper" className="absolute inset-0 w-full h-full overflow-hidden">
          <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto=format&fit=crop" alt="Hero 1" className="absolute inset-0 w-full h-full object-cover animate-kenburns opacity-100 transition-opacity duration-1000" />
          <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop" alt="Hero 2" className="absolute inset-0 w-full h-full object-cover animate-kenburns opacity-0 transition-opacity duration-1000" />
          <img src="https://images.unsplash.com/photo-1494203484021-3c454daf695d?q=80&w=2070&auto=format&fit=crop" alt="Hero 3" className="absolute inset-0 w-full h-full object-cover animate-kenburns opacity-0 transition-opacity duration-1000" />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-shadow mb-4 sm:mb-6 animate-slide-in" style={{ color: "#fffcf2", animationDelay: "100ms" }}>
            About Roomhy
          </h1>
          <p className="text-base sm:text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto text-shadow animate-slide-in" style={{ animationDelay: "200ms" }}>
            We're making student housing smarter, simpler, and broker-free.
          </p>
        </div>
      </section>

      {/* ── MAIN ── */}
      <main className="container mx-auto px-4 sm:px-6 py-8 md:py-16 space-y-12 md:space-y-20 flex-grow">

        {/* ── WELCOME ── */}
        <section id="welcome" className="scroll-mt-20 light-card rounded-2xl p-5 sm:p-8 md:p-10">
          <div className="grid lg:grid-cols-2 lg:gap-16 lg:items-center">
            <div className="animate-slide-in">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Welcome to Roomhy. <br />
                Where your budget meets <span className="text-purple-600">your next home.</span>
              </h2>
              <div className="space-y-3 sm:space-y-4 text-base sm:text-lg text-gray-600">
                <p>At Roomhy, we're making student housing smarter, simpler, and broker-free. Whether you're looking for a PG, hostel, or co-living space, Roomhy lets you bid in <strong>real-time</strong>, directly with property owners — no middlemen, no markups.</p>
                <p>From flexible stays to verified listings and instant negotiations, we're flipping the rental game for students across India. Our platform is built for <strong>transparency, trust, and tech-first convenience</strong> — because finding a room shouldn't feel like a chore.</p>
                <p>Whether it's your first room near campus or a co-living space with friends, Roomhy ensures you bid smart, live better.</p>
              </div>
            </div>
            <div className="welcome-img-grid w-full h-80 sm:h-96 grid grid-cols-5 grid-rows-3 gap-2 sm:gap-3 mt-8 lg:mt-0 animate-slide-in animate-float" style={{ animationDelay: "200ms" }}>
              <div className="col-span-2 row-span-3 rounded-2xl overflow-hidden shadow-lg">
                <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990269/roomhy/website/two.jpg" className="w-full h-full object-cover" alt="Two women talking" />
              </div>
              <div className="col-span-3 row-span-2 rounded-2xl overflow-hidden shadow-lg">
                <img src="https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" alt="Modern living room" />
              </div>
              <div className="col-span-1 row-span-1 rounded-2xl overflow-hidden shadow-lg">
                <img src="https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" alt="Kitchen" />
              </div>
              <div className="col-span-2 row-span-1 rounded-2xl overflow-hidden shadow-lg">
                <img src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" alt="Bedroom" />
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS GRID ── */}
        <section id="features" className="light-card rounded-2xl p-5 sm:p-8 md:p-10">
          <div className="text-center mb-8 sm:mb-12 animate-slide-in">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              The Simple and Safe Way to Find Your Next <span className="text-purple-600">Coliving Home</span>
            </h2>
          </div>
          <div className="stats-grid grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mb-8 text-center">
            {[
              { value: "6+", label: "Cities" },
              { value: "500+", label: "Rooms" },
              { value: "1000+", label: "Beds" },
              { value: "500+", label: "Verified Listings" },
              { value: "3000+", label: "Student Signups" },
              { value: "₹1 Cr+", label: "Brokerage Saved" },
              { value: "1000+", label: "Placed" },
              { value: "500+", label: "Beds Sold" },
            ].map(({ value, label }, i) => (
              <div key={label} className="animate-slide-in" style={{ animationDelay: `${100 + i * 50}ms` }}>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">{value}</h3>
                <p className="text-gray-500 mt-1 text-xs sm:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURE CARDS ── */}
        <section className="animate-slide-in">
          <div className="feature-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
            {[
              { icon: "badge-percent", title: "No Brokerage", desc: "Say goodbye to broker fees forever. Roomhy is 100% owner-to-student direct.", delay: "200ms" },
              { icon: "gavel", title: "Live Bidding System", desc: "Students place real-time bids, owners pick the best offer.", delay: "300ms" },
              { icon: "smartphone", title: "100% Online Process", desc: "From browsing to booking — everything happens online.", delay: "400ms" },
              { icon: "shield-check", title: "Verified Listings", desc: "Each room is checked and verified to ensure trust and transparency.", delay: "500ms" },
            ].map(({ icon, title, desc, delay }) => (
              <div key={title} className="text-center flex flex-col items-center p-5 sm:p-6 border border-gray-200 rounded-2xl animate-slide-in feature-card" style={{ animationDelay: delay }}>
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0 shadow-sm pulse-icon">
                  <i data-lucide={icon} className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600"></i>
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mt-4 sm:mt-5">{title}</h3>
                <p className="text-gray-500 mt-2 text-sm sm:text-base">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── MISSION / VISION / VALUES / GOALS ── */}
        <section id="mission-vision" className="light-card rounded-2xl p-5 sm:p-8 md:p-10 animate-slide-in">
          <div className="mission-inner max-w-4xl mx-auto">
            {[
              {
                title: "Our Vision",
                delay: "100ms",
                content: [
                  "To disrupt the traditional rental model by giving students the power to bid, book, and live — without brokers, hidden charges, or negotiation stress.",
                  "Founded in 2024, Roomhy, under the leadership of Resham Singh, is pioneering a new way for India's youth to find accommodation — transparent, real-time, and entirely online."
                ]
              },
              {
                title: "Our Mission",
                delay: "200ms",
                content: [
                  "To simplify student housing by enabling direct, real-time bidding between students and property owners — making room rentals fair, flexible, and broker-free.",
                  "Roomhy is India's first student-centric property bidding platform — helping students take control of where and how they live, and helping property owners get the best value for their rooms."
                ]
              }
            ].map(({ title, delay, content }) => (
              <div key={title} className="mb-10 sm:mb-12 animate-slide-in" style={{ animationDelay: delay }}>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 text-purple-600">{title}</h3>
                {content.map((p, i) => (
                  <p key={i} className={`text-gray-600 text-base sm:text-lg leading-relaxed ${i > 0 ? "mt-4" : ""}`}>{p}</p>
                ))}
              </div>
            ))}

            <div className="mb-10 sm:mb-12 animate-slide-in" style={{ animationDelay: "300ms" }}>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 text-purple-600">Our Values</h3>
              <ul className="space-y-3 sm:space-y-4 text-gray-600 text-base sm:text-lg">
                <li><strong>Transparency</strong> — No middlemen. No hidden fees. What you see is what you bid.</li>
                <li><strong>Empowerment</strong> — Students and owners are in full control.</li>
                <li><strong>Speed &amp; Simplicity</strong> — From listing to booking in under 5 mins.</li>
                <li><strong>Trust</strong> — Every listing is verified. Every user is real.</li>
              </ul>
              <p className="text-gray-700 font-semibold italic mt-4 sm:mt-6 text-base sm:text-lg">We're not just fixing rentals. We're fixing trust.</p>
            </div>

            <div className="animate-slide-in" style={{ animationDelay: "400ms" }}>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 text-purple-600">Our Goals</h3>
              <ul className="space-y-3 sm:space-y-4 list-disc list-outside ml-5 text-gray-600 text-base sm:text-lg">
                <li>To become the default platform for student rentals in India by:</li>
                <li>Helping students bid smart and live better</li>
                <li>Helping owners earn more, without paying brokerage</li>
                <li>Building a transparent, tech-first ecosystem for youth mobility in India</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── STAT CARDS ── */}
        <section id="stats2" className="animate-slide-in">
          <div className="stat-cards-grid grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
            {[
              { bg: "#581c87", icon: "home", value: "5+", label: "Cities", delay: "100ms" },
              { bg: "#a21caf", icon: "bed-double", value: "5000+", label: "Operational Beds", delay: "200ms" },
              { bg: "#86198f", icon: "building", value: "75+", label: "Properties", delay: "300ms" },
            ].map(({ bg, icon, value, label, delay }) => (
              <div key={label} className="text-white p-8 sm:p-10 rounded-2xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden stat-card animate-slide-in" style={{ backgroundColor: bg, animationDelay: delay }}>
                <i data-lucide={icon} className="w-20 h-20 sm:w-24 sm:h-24 text-white/10 absolute -bottom-4 -right-4"></i>
                <h3 className="text-4xl sm:text-5xl lg:text-6xl font-bold z-10">{value}</h3>
                <p className="text-lg sm:text-xl mt-2 text-purple-200 z-10">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FOUNDER ── */}
        <section id="founder" className="light-card rounded-2xl p-5 sm:p-8 md:p-10 animate-slide-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center mb-8 sm:mb-12 animate-slide-in">Our Founders</h2>
          <div className="flex flex-col items-center">
            <div className="w-full max-w-xs sm:max-w-sm rounded-lg overflow-hidden shadow-xl mb-8 sm:mb-12 founder-card animate-slide-in" style={{ animationDelay: "200ms" }}>
              <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990231/roomhy/website/ceo1.jpg" alt="Resham Singh, Founder & CEO" className="w-full h-auto object-cover" />
              <div className="p-4 sm:p-5 bg-gray-900 text-white text-center">
                <h4 className="text-xl sm:text-2xl font-bold">Resham Singh</h4>
                <p className="text-gray-300 text-sm sm:text-base">Founder &amp; CEO</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOUNDER NOTE ── */}
        <section id="founder-note" className="light-card rounded-2xl p-5 sm:p-8 md:p-10 animate-slide-in">
          <div className="flex-section flex flex-wrap lg:flex-nowrap items-center gap-8 sm:gap-12 lg:gap-16">
            <div className="flex-col-text flex-1 min-w-0 w-full animate-slide-in" style={{ animationDelay: "100ms" }}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Founders <span className="text-purple-600">Note</span>
              </h2>
              <div className="text-base sm:text-lg text-gray-600 space-y-4 sm:space-y-5">
                <p>Growing up in Kota, India's education hub, I lived in the everyday chaos of student rentals. When a student moves to a new city, they're often left with two options: roam endlessly or rely on brokers who care more about their commission than your comfort.</p>
                <p>I've seen friends overpay, compromise on rooms, and get stuck with whatever was available. On the other side, property owners struggle too: they want full occupancy when sessions begin, but lack a reliable, transparent way to reach students.</p>
                <p>That's where ROOMHY comes in, India's first real-time property bidding platform, built for students, scaled for cities. No brokers. No guesswork. Just verified properties, fair pricing, and total control.</p>
                <p>Here, you set the price with your bid. Whether it's a PG, hostel, or shared flat, you find what fits your own budget: fast, fair, and fully online.</p>
                <p className="text-purple-600 font-bold text-lg sm:text-xl mt-4">Because we believe: Broker hatao. Bid lagao. Roomhy chalao</p>
                <p>ROOMHY isn't just an app or any other platform, it's a solution to a broken system. One that gives students freedom, owners visibility, and both sides a better way to connect.</p>
              </div>
            </div>
            <div className="flex-col-img flex-1 min-w-0 w-full flex items-center justify-center animate-slide-in" style={{ animationDelay: "200ms" }}>
              <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990233/roomhy/website/ceo2.jpg" alt="Roomhy Founder" className="rounded-2xl shadow-xl w-full max-w-xs sm:max-w-md h-auto object-cover" />
            </div>
          </div>
        </section>

        {/* ── POWERED BY TECH ── */}
        <section id="powered-by-tech" className="light-card rounded-2xl p-5 sm:p-8 md:p-10 animate-slide-in">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-8 sm:mb-12 text-center">
              Powered by <span className="text-purple-600">Technology.</span> Built for Students.
            </h2>
            <div className="flex-section flex flex-wrap lg:flex-nowrap gap-8 sm:gap-12 lg:gap-16 justify-between items-center">
              <div className="flex-col-text flex-1 min-w-0 w-full animate-slide-in" style={{ animationDelay: "100ms" }}>
                <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">Roomhy is India's First Real-Time Property Bidding Platform — made to give students the power to rent smarter, faster, and without brokers.</p>
                <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">Whether you're finding your first PG or switching hostels, Roomhy's tech does the heavy lifting. From live bidding to verified stays, everything happens in real-time — no phone calls, no shady listings, no running around.</p>
                <p className="text-base sm:text-xl text-gray-800 font-semibold mb-4 sm:mb-5">Our AI-powered platform makes it simple</p>
                <ul className="list-none p-0 mb-8 sm:mb-12 space-y-3 sm:space-y-4">
                  {[
                    { emoji: "💡", text: "Suggests the right stay based on your budget, preferences, and location" },
                    { emoji: "📍", text: "Shows actual occupancy (Single, Double, Triple, etc.) in real-time" },
                    { emoji: "🗓️", text: "Combines rent, booking & service details in one clean dashboard" },
                  ].map(({ emoji, text }) => (
                    <li key={emoji} className="flex items-start text-sm sm:text-lg text-gray-600">
                      <span className="mr-3 text-xl sm:text-2xl flex-shrink-0">{emoji}</span>
                      {text}
                    </li>
                  ))}
                </ul>
                <div className="tech-mini-cards flex flex-wrap gap-4 sm:gap-6 mb-8 sm:mb-12">
                  {[
                    { title: "Find your perfect stay, your way", desc: "Search by location, budget, or preferences — and place live bids directly. Explore rooms, check real-time availability, or schedule a virtual visit." },
                    { title: "Everything in one dashboard", desc: "From bidding history to rent payments, invoices, and support — manage your entire rental journey from a single, clean dashboard." }
                  ].map(({ title, desc }) => (
                    <div key={title} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4 sm:p-6 flex-1" style={{ minWidth: "240px" }}>
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-100 flex items-center justify-center mb-3 sm:mb-4">
                        <i data-lucide="check" className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600"></i>
                      </div>
                      <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{desc}</p>
                    </div>
                  ))}
                </div>
                <a href="/website/index" className="inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg bg-purple-600 text-white font-semibold text-sm sm:text-base transition-colors hover:bg-purple-700 glow-button">
                  EXPLORE HOMES
                </a>
              </div>
              <div className="flex-col-img flex-1 min-w-0 w-full flex justify-center items-center animate-slide-in" style={{ animationDelay: "200ms" }}>
                <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990272/roomhy/website/why.jpg" alt="Roomhy App" className="max-w-full h-auto rounded-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY ROOMHY ── */}
        <section id="why-roomhy-2" className="light-card rounded-2xl p-5 sm:p-8 md:p-10 animate-slide-in">
          <div className="max-w-6xl mx-auto">
            <div className="flex-section flex flex-wrap-reverse lg:flex-nowrap gap-8 sm:gap-12 lg:gap-16 justify-between items-center">
              <div className="flex-col-text flex-1 min-w-0 w-full animate-slide-in" style={{ animationDelay: "100ms" }}>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 sm:mb-10">
                  Why stay with <span className="text-purple-600">Roomhy?</span>
                </h2>
                <div className="why-list space-y-6 sm:space-y-8">
                  {[
                    { badge: "Affordable", badgeColor: "bg-red-100 text-red-700", title: "No Brokerage", desc: "Find your ideal room without paying a single rupee in commission. Every stay is broker-free — direct from owner to student." },
                    { badge: "Convenient", badgeColor: "bg-green-100 text-green-700", title: "Fully Online", desc: "Bid, book, pay rent, or raise issues — all from your phone. No need for site visits or endless WhatsApp calls." },
                    { badge: "Flexible", badgeColor: "bg-blue-100 text-blue-700", title: "Flexible Stays", desc: "Monthly, quarterly, or semester-wise — choose what suits your academic life. No long-term lock-ins." },
                    { badge: "Reliable", badgeColor: "bg-purple-100 text-purple-700", title: "Verified Rooms", desc: "What you see is what you get. Photos, amenities, and availability are 100% verified by the Roomhy team." },
                    { badge: "Social", badgeColor: "bg-gray-200 text-gray-700", title: "Community-Driven", desc: "Live in spaces where you connect with other students and young professionals — feel at home, even away from home." },
                  ].map(({ badge, badgeColor, title, desc }) => (
                    <div key={title}>
                      <span className={`inline-block ${badgeColor} text-xs font-semibold px-3 py-1 rounded-full mb-1.5 sm:mb-2`}>{badge}</span>
                      <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-1.5 sm:mb-2">{title}</h3>
                      <p className="text-sm sm:text-base text-gray-600">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-col-img flex-1 min-w-0 w-full flex items-center justify-center animate-slide-in" style={{ animationDelay: "200ms" }}>
                <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990258/roomhy/website/jolly.jpg" alt="Students in shared space" className="w-full h-auto rounded-2xl shadow-xl" />
              </div>
            </div>
          </div>
        </section>

        {/* ── TIMELINE ── */}
        <section id="timeline" className="light-card rounded-2xl p-5 sm:p-8 md:p-10 animate-slide-in">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Roomhy's <span className="text-cyan-600">Timeline</span>
            </h2>
            <p className="text-sm sm:text-lg text-gray-600 mb-8 sm:mb-16">Over the years, Zolo has grown to become the largest coliving brand in India.</p>
            <div className="w-full overflow-x-auto pb-8">
              <div className="min-w-[700px] sm:min-w-[1000px] px-4 sm:px-8">
                <div className="timeline-years flex justify-between px-0">
                  {["2015", "2017", "2019", "2021", "2023"].map((yr) => (
                    <div key={yr} className="flex-1 text-center text-xl sm:text-2xl md:text-4xl font-bold text-gray-700">{yr}</div>
                  ))}
                </div>
                <div className="relative w-full h-1 bg-cyan-500 mt-4 sm:mt-6">
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[15px] border-l-cyan-500 absolute -right-4 -top-[8px]"></div>
                  {["6.5%", "29%", "51.5%", "74%", "96.5%"].map((left) => (
                    <div key={left} className="absolute -top-[10px] w-5 h-5 sm:w-6 sm:h-6 bg-cyan-500 rotate-45 rounded-sm" style={{ left }}></div>
                  ))}
                </div>
                <div className="flex justify-between gap-3 sm:gap-6 mt-6 sm:mt-10 text-left">
                  {[
                    { title: "Initiation", items: ["Set up first property in Blr", "Secured Nexus as an investor"] },
                    { title: "Validation", items: ["Secured series A funding of $5 million", "Hit milestone of 100 properties and 10,000 beds"] },
                    { title: "Scale", items: ["Largest coliving player", "Series B funding", "8000+ YoY properties"] },
                    { title: "Expansion", items: ["Launched Student Housing Vertical", "Presence in 15+ cities"] },
                    { title: "Acceleration", items: ["Turned Profitable", "New Verticals: Z Vacation & Z Express"] },
                  ].map(({ title, items }) => (
                    <div key={title} className="flex-1 bg-white p-3 sm:p-6 rounded-lg shadow-md border border-gray-100">
                      <h3 className="text-sm sm:text-xl font-semibold text-gray-900 mt-0 mb-3 sm:mb-4">{title}</h3>
                      <ul className="list-none p-0 m-0 space-y-1.5 sm:space-y-2">
                        {items.map((item) => (
                          <li key={item} className="flex items-start text-xs sm:text-base text-gray-600">
                            <span className="text-cyan-500 text-lg sm:text-2xl mr-1.5 sm:mr-2 leading-none mt-[-2px] flex-shrink-0">–</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <WebsiteFooter />
    </div>
  );
}
