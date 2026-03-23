export const sharedNavConfig = {
  superadmin: {
    title: "Superadmin",
    base: "/superadmin",
    sections: [
      {
        label: "Overview",
        links: [
          { label: "Dashboard", to: "/superadmin/superadmin", icon: "layout-dashboard" }
        ]
      },
      {
        label: "Management",
        links: [
          { label: "Teams", to: "/superadmin/manager", icon: "map-pin" },
          { label: "Property Owners", to: "/superadmin/owner", icon: "briefcase" },
          { label: "Properties", to: "/superadmin/properties", icon: "home" },
          { label: "Tenants", to: "/superadmin/tenant", icon: "users" },
          { label: "New Signups", to: "/superadmin/new_signups", icon: "file-badge" }
        ]
      },
      {
        label: "Operations",
        links: [
          { label: "Web Enquiry", to: "/superadmin/websiteenq", icon: "folder-open" },
          { label: "Enquiries", to: "/superadmin/enquiry", icon: "help-circle" },
          { label: "Bookings", to: "/superadmin/booking", icon: "calendar-check" },
          { label: "Reviews", to: "/superadmin/reviews", icon: "star" },
          { label: "Complaint History", to: "/superadmin/complaint-history", icon: "alert-circle" }
        ]
      },
      {
        label: "Website",
        links: [
          { label: "Live Properties", to: "/superadmin/website", icon: "globe" }
        ]
      },
      {
        label: "Finance",
        links: [
          { label: "Rent Collections", to: "/superadmin/rentcollection", icon: "wallet" },
          { label: "Commissions", to: "/superadmin/platform", icon: "indian-rupee" },
          { label: "Refunds", to: "/superadmin/refund", icon: "rotate-ccw" }
        ]
      },
      {
        label: "System",
        links: [
          { label: "Locations", to: "/superadmin/location", icon: "globe" },
          { label: "Settings", to: "/superadmin/settings", icon: "settings" },
          { label: "Profile", to: "/superadmin/profile", icon: "user" }
        ]
      }
    ],
    links: []
  },
  propertyowner: {
    title: "Property Owner",
    base: "/propertyowner",
    links: [
      { label: "Login", to: "/propertyowner/ownerlogin" },
      { label: "Dashboard", to: "/propertyowner/admin" },
      { label: "Properties", to: "/propertyowner/properties" },
      { label: "Rooms", to: "/propertyowner/rooms" },
      { label: "Tenants", to: "/propertyowner/tenants" },
      { label: "Bookings", to: "/propertyowner/booking" },
      { label: "Booking Form", to: "/propertyowner/booking-form" },
      { label: "Booking Requests", to: "/propertyowner/booking_request" },
      { label: "Payments", to: "/propertyowner/payment" },
      { label: "Payment Received", to: "/propertyowner/payment-received" },
      { label: "Complaints", to: "/propertyowner/complaints" },
      { label: "Documents", to: "/propertyowner/documents" },
      { label: "Review", to: "/propertyowner/review" },
      { label: "Settings", to: "/propertyowner/settings" },
      { label: "Owner Profile", to: "/propertyowner/ownerprofile" },
      { label: "Owner Chat", to: "/propertyowner/ownerchat" },
      { label: "Schedule Visit", to: "/propertyowner/schedulevisit" },
      { label: "Tenant Records", to: "/propertyowner/tenantrec" },
      { label: "Enquiry", to: "/propertyowner/enquiry" },
      { label: "Location", to: "/propertyowner/location" }
    ]
  },
  tenant: {
    title: "Tenant",
    base: "/tenant",
    links: [
      { label: "Login", to: "/tenant/tenantlogin" },
      { label: "Dashboard", to: "/tenant/tenantdashboard" },
      { label: "Agreement", to: "/tenant/tenantagreement" },
      { label: "Complaints", to: "/tenant/tenantcomplints" },
      { label: "Chat", to: "/tenant/tenantchat" }
    ]
  },
  website: {
    title: "Website",
    base: "/website",
    links: [
      { label: "Home", to: "/website/index" },
      { label: "List", to: "/website/list" },
      { label: "Property", to: "/website/property" },
      { label: "Property New", to: "/website/property_new" },
      { label: "Our Property", to: "/website/ourproperty" },
      { label: "My Stays", to: "/website/mystays" },
      { label: "Bookings", to: "/website/mystays-bookings" },
      { label: "Profile", to: "/website/profile" },
      { label: "Favorites", to: "/website/fav" },
      { label: "Login", to: "/website/login" },
      { label: "Signup", to: "/website/signup" },
      { label: "Signup Role", to: "/website/signuprole" },
      { label: "Terms", to: "/website/terms" },
      { label: "Privacy", to: "/website/privacy" },
      { label: "Contact", to: "/website/contact" },
      { label: "Cancellation", to: "/website/cancellation" },
      { label: "Refund", to: "/website/refund" },
      { label: "Refund Request", to: "/website/refund-request" },
      { label: "Fast Bidding", to: "/website/fast-bidding" },
      { label: "Slider", to: "/website/slider" },
      { label: "Website Chat", to: "/website/websitechat" },
      { label: "Enquiry", to: "/website/enquiry" },
      { label: "About", to: "/website/about" },
      { label: "Before", to: "/website/before" }
    ]
  },
  "digital-checkin": {
    title: "Digital Check-in",
    base: "/digital-checkin",
    links: [
      { label: "Index", to: "/digital-checkin/index" },
      { label: "Owner Profile", to: "/digital-checkin/ownerprofile" },
      { label: "Owner KYC", to: "/digital-checkin/ownerkyc" },
      { label: "Owner Terms", to: "/digital-checkin/ownerterms" },
      { label: "Tenant Profile", to: "/digital-checkin/tenantprofile" },
      { label: "Tenant KYC", to: "/digital-checkin/tenantkyc" },
      { label: "Tenant Agreement", to: "/digital-checkin/tenantagreement" },
      { label: "Tenant Confirmation", to: "/digital-checkin/tenant-confirmation" }
    ]
  }
};

export const resolveSectionFromPath = (path = "") => {
  if (path === "/superadmin/index") return null;
  if (path.startsWith("/superadmin/areaadmin")) return null;
  if (path.startsWith("/employee/")) return null;
  if (
    path === "/propertyowner/index" ||
    path === "/propertyowner/ownerlogin" ||
    path.startsWith("/tenant/")
  ) {
    return null;
  }
  if (path.startsWith("/superadmin/")) return "superadmin";
  // Property owner pages render their own admin.html-style shell.
  if (path.startsWith("/propertyowner/")) return null;
  // Digital check-in pages render as standalone forms without the shared shell.
  if (path.startsWith("/digital-checkin/")) return null;
  return null;
};
