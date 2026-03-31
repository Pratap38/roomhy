import React, { useState } from "react";

const CITY_DATA = {
  Indore: [
    { name: "PG in Vijay Nagar", area: "Vijay Nagar", type: "PG" },
    { name: "PG in Palasia", area: "Palasia", type: "PG" },
    { name: "PG in LIG Colony", area: "LIG Colony", type: "PG" },
    { name: "PG in Scheme 54", area: "Scheme 54", type: "PG" },
    { name: "PG in Bhawarkuan", area: "Bhawarkuan", type: "PG" },
    { name: "PG in South Tukoganj", area: "South Tukoganj", type: "PG" },
    { name: "Hostel near DAVV", area: "DAVV", type: "Hostel" },
    { name: "Hostel near IIM Indore", area: "IIM Indore", type: "Hostel" },
    { name: "Flat in Nipania", area: "Nipania", type: "Apartment" },
    { name: "PG in AB Road", area: "AB Road", type: "PG" },
    { name: "PG in MR 10", area: "MR 10", type: "PG" },
    { name: "Flat in Vijay Nagar", area: "Vijay Nagar", type: "Apartment" }
  ],
  Kota: [
    { name: "PG in Talwandi", area: "Talwandi", type: "PG" },
    { name: "PG in Jawahar Nagar", area: "Jawahar Nagar", type: "PG" },
    { name: "PG in Vigyan Nagar", area: "Vigyan Nagar", type: "PG" },
    { name: "PG in Mahaveer Nagar", area: "Mahaveer Nagar", type: "PG" },
    { name: "Hostel near Allen", area: "Allen", type: "Hostel" },
    { name: "Hostel near Resonance", area: "Resonance", type: "Hostel" },
    { name: "Hostel near Bansal Classes", area: "Bansal", type: "Hostel" },
    { name: "PG in Dadabari", area: "Dadabari", type: "PG" },
    { name: "Flat in Talwandi", area: "Talwandi", type: "Apartment" },
    { name: "PG in Rangbari", area: "Rangbari", type: "PG" }
  ],
  Sikar: [
    { name: "PG in Subhash Nagar", area: "Subhash Nagar", type: "PG" },
    { name: "PG in Nehru Nagar", area: "Nehru Nagar", type: "PG" },
    { name: "PG near Shekhawati University", area: "Shekhawati Uni", type: "PG" },
    { name: "Hostel near CBSE Schools", area: "CBSE Zone", type: "Hostel" },
    { name: "Flat in Sikar City", area: "Sikar City", type: "Apartment" },
    { name: "PG near Bus Stand", area: "Bus Stand", type: "PG" }
  ],
  Bengaluru: [
    { name: "PG in BTM Layout", area: "BTM Layout", type: "PG" },
    { name: "PG in Koramangala", area: "Koramangala", type: "PG" },
    { name: "PG in HSR Layout", area: "HSR Layout", type: "PG" },
    { name: "PG in Marathahalli", area: "Marathahalli", type: "PG" },
    { name: "PG in Manyata Tech Park", area: "Manyata", type: "PG" },
    { name: "Hostel near RVCE", area: "RVCE", type: "Hostel" },
    { name: "PG in Bellandur", area: "Bellandur", type: "PG" },
    { name: "Flat in Koramangala", area: "Koramangala", type: "Apartment" }
  ],
  Mumbai: [
    { name: "PG in Andheri", area: "Andheri", type: "PG" },
    { name: "PG in Bandra", area: "Bandra", type: "PG" },
    { name: "PG in Powai", area: "Powai", type: "PG" },
    { name: "PG in Thane", area: "Thane", type: "PG" },
    { name: "Flat in Andheri", area: "Andheri", type: "Apartment" },
    { name: "PG in Navi Mumbai", area: "Navi Mumbai", type: "PG" }
  ],
  Delhi: [
    { name: "PG in Mukherjee Nagar", area: "Mukherjee Nagar", type: "PG" },
    { name: "PG near DU North Campus", area: "DU North", type: "PG" },
    { name: "PG in Dwarka", area: "Dwarka", type: "PG" },
    { name: "Hostel near JNU", area: "JNU", type: "Hostel" },
    { name: "PG in Lajpat Nagar", area: "Lajpat Nagar", type: "PG" },
    { name: "PG in Rohini", area: "Rohini", type: "PG" }
  ],
  Pune: [
    { name: "PG in Kothrud", area: "Kothrud", type: "PG" },
    { name: "PG in Hinjewadi", area: "Hinjewadi", type: "PG" },
    { name: "PG in Baner", area: "Baner", type: "PG" },
    { name: "Hostel near COEP", area: "COEP", type: "Hostel" },
    { name: "Flat in Hinjewadi", area: "Hinjewadi", type: "Apartment" },
    { name: "PG in Viman Nagar", area: "Viman Nagar", type: "PG" }
  ],
  Hyderabad: [
    { name: "PG in Gachibowli", area: "Gachibowli", type: "PG" },
    { name: "PG in Hitech City", area: "Hitech City", type: "PG" },
    { name: "PG in Kondapur", area: "Kondapur", type: "PG" },
    { name: "Hostel near IIIT Hyd", area: "IIIT Hyderabad", type: "Hostel" },
    { name: "Flat in Gachibowli", area: "Gachibowli", type: "Apartment" },
    { name: "PG in Ameerpet", area: "Ameerpet", type: "PG" }
  ]
};

const CITIES = Object.keys(CITY_DATA);

const footerStyle = {
  backgroundColor: "#0a0a0a",
  color: "#d1d5db",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  borderTop: "1px solid #141414",
  marginTop: "4rem"
};

const desktopGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr 1fr",
  gap: "40px",
  padding: "64px 48px 52px",
  borderBottom: "1px solid #141414"
};

const mobileGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "28px",
  padding: "36px 20px 28px",
  borderBottom: "1px solid #141414"
};

const headingStyle = {
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: "600",
  margin: "0 0 20px",
  letterSpacing: "0.01em"
};

export default function WebsiteFooter() {
  const [selectedCity, setSelectedCity] = useState(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 960 : false
  );

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 960);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <footer data-roomhy-shared-footer="1" style={footerStyle}>
      <div style={isMobile ? mobileGridStyle : desktopGridStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "7px",
                backgroundColor: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span style={{ color: "#ffffff", fontSize: "17px", fontWeight: "700", letterSpacing: "-0.3px" }}>
              Roomhy
            </span>
          </div>
          <p
            style={{
              color: "#444444",
              fontSize: "13px",
              lineHeight: "1.75",
              margin: 0,
              maxWidth: "220px",
              whiteSpace: "pre-line"
            }}
          >
            {"© copyright Roomhy 2025.\nAll rights reserved."}
          </p>
        </div>

        <div>
          <h4 style={headingStyle}>Cities</h4>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
            {CITIES.map((city) => {
              const isOpen = selectedCity === city;
              const cityListings = CITY_DATA[city] || [];

              return (
                <li key={city}>
                  <button
                    onClick={() => setSelectedCity((prev) => (prev === city ? null : city))}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "4px 0",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      color: isOpen ? "#ffffff" : "#555555",
                      fontSize: "13px",
                      fontWeight: isOpen ? "600" : "400",
                      transition: "color 0.15s"
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          backgroundColor: isOpen ? "#4ade80" : "transparent",
                          border: isOpen ? "none" : "1px solid #2a2a2a",
                          flexShrink: 0
                        }}
                      />
                      {city}
                    </span>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      style={{
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                        flexShrink: 0
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {isOpen && (
                    <ul
                      style={{
                        listStyle: "none",
                        margin: "4px 0 8px 11px",
                        padding: "0 0 0 10px",
                        borderLeft: "1px solid #1e1e1e",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                      }}
                    >
                      {cityListings.map((listing, index) => (
                        <li key={`${city}-${listing.area}-${index}`}>
                          <a
                            href={`/website/ourproperty?city=${encodeURIComponent(city)}&area=${encodeURIComponent(
                              listing.area
                            )}&type=${encodeURIComponent(listing.type)}`}
                            style={{
                              color: "#3a3a3a",
                              fontSize: "12px",
                              textDecoration: "none",
                              transition: "color 0.15s",
                              display: "block",
                              lineHeight: "1.4"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "#aaaaaa";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "#3a3a3a";
                            }}
                          >
                            {listing.name}
                          </a>
                        </li>
                      ))}
                      <li>
                        <a
                          href={`/website/ourproperty?city=${encodeURIComponent(city)}`}
                          style={{
                            color: "#2a2a2a",
                            fontSize: "11px",
                            textDecoration: "none",
                            transition: "color 0.15s",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            marginTop: "2px"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#4ade80";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#2a2a2a";
                          }}
                        >
                          View all →
                        </a>
                      </li>
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <NavCol
          heading="Pages"
          links={[
            { label: "Find a PG", href: "/website/ourproperty?type=pg" },
            { label: "Hostels", href: "/website/ourproperty?type=hostel" },
            { label: "Apartments", href: "/website/ourproperty?type=apartment" },
            { label: "Fast Bidding", href: "/website/fast-bidding" },
            { label: "List Property", href: "/website/list" },
            { label: "About Us", href: "/website/about" }
          ]}
        />

        <NavCol
          heading="Socials"
          links={[
            { label: "Facebook", href: "#" },
            { label: "Instagram", href: "#" },
            { label: "Twitter", href: "#" },
            { label: "LinkedIn", href: "#" },
            { label: "YouTube", href: "#" }
          ]}
        />

        <NavCol
          heading="Legal"
          links={[
            { label: "Privacy Policy", href: "/website/privacy" },
            { label: "Terms of Service", href: "/website/terms" },
            { label: "Cookie Policy", href: "/website/cookies" },
            { label: "Sitemap", href: "/sitemap.xml" }
          ]}
        />

        <NavCol
          heading="Register"
          links={[
            { label: "Sign Up", href: "/website/signup" },
            { label: "Login", href: "/website/signup" },
            { label: "List Property", href: "/website/signuprole" },
            { label: "Contact Us", href: "/website/contact" },
            { label: "FAQ", href: "#faq" }
          ]}
        />
      </div>

      <div
        style={{
          overflow: "hidden",
          userSelect: "none",
          pointerEvents: "none",
          lineHeight: "0.85",
          padding: isMobile ? "0 12px" : "0 24px",
          textAlign: "center"
        }}
      >
        <p
          style={{
            fontSize: "clamp(72px, 17vw, 210px)",
            fontWeight: "800",
            color: "#141414",
            margin: 0,
            letterSpacing: "-0.04em",
            fontFamily: "'Inter', sans-serif",
            whiteSpace: "nowrap"
          }}
        >
          Roomhy
        </p>
      </div>
    </footer>
  );
}

function NavCol({ heading, links }) {
  return (
    <div>
      <h4 style={headingStyle}>{heading}</h4>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
        {links.map(({ label, href }) => (
          <li key={label}>
            <a
              href={href}
              style={{ color: "#555555", fontSize: "13px", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#555555";
              }}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
