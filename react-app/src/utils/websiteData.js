import { getWebsiteApiUrl } from "./websiteSession";

const fallbackCities = [
  {
    name: "Kota",
    img: "https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990262/roomhy/website/OIP.jpg",
    icon: "university"
  },
  {
    name: "Sikar",
    img: "https://images.unsplash.com/photo-1549487560-671520624a9e?q=80&w=2070&auto=format&fit=crop",
    icon: "building-2"
  },
  {
    name: "Indore",
    img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=2070&auto=format&fit=crop",
    icon: "landmark"
  }
];

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const getStoredCities = () => {
  if (typeof window === "undefined") return [];
  const citiesData = safeParse(window.localStorage.getItem("roomhy_cities") || "[]", []);
  return citiesData
    .map((city) => {
      if (typeof city === "string") return { name: city };
      if (city && typeof city === "object" && city.name) return { name: city.name };
      return null;
    })
    .filter(Boolean);
};

export const loadCities = async () => {
  const apiBase = getWebsiteApiUrl();
  try {
    const response = await fetch(`${apiBase}/api/locations/cities`);
    if (!response.ok) throw new Error("Failed");
    const data = await response.json();
    const cityInfo = (data.data || []).map((city) => ({
      _id: city._id || city.id,
      name: city.name || city.cityName,
      img:
        city.imageUrl ||
        city.image ||
        "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=2070&auto=format&fit=crop",
      icon: city.icon || "map-pin"
    }));
    if (cityInfo.length > 0) return cityInfo;
  } catch (error) {
    // ignore and fall back
  }

  const stored = getStoredCities();
  if (stored.length > 0) {
    return stored.map((city) => ({ ...city, img: city.img || "", icon: city.icon || "map-pin" }));
  }

  return fallbackCities;
};

export const loadAreasByCity = async () => {
  const apiBase = getWebsiteApiUrl();
  const areasByCity = {};
  try {
    const response = await fetch(`${apiBase}/api/locations/areas`);
    if (!response.ok) return areasByCity;
    const areaData = await response.json();
    (areaData.data || []).forEach((area) => {
      const cityName = area.city || area.cityName;
      if (!cityName) return;
      if (!areasByCity[cityName]) {
        areasByCity[cityName] = [];
      }
      if (area.imageUrl || area.image) {
        areasByCity[cityName].push({
          name: area.name,
          img: area.imageUrl || area.image
        });
      }
    });
  } catch (error) {
    // ignore
  }
  return areasByCity;
};

export const loadTopSpaces = async () => {
  const apiBase = getWebsiteApiUrl();
  const stored = getStoredCities();
  const cityNames = stored.map((city) => city.name).filter(Boolean);
  const customCities = cityNames.filter(
    (city) => city.toLowerCase() !== "indore" && city.toLowerCase() !== "kota"
  );

  if (customCities.length === 0) return null;

  const results = await Promise.all(
    customCities.map(async (city) => {
      try {
        const response = await fetch(`${apiBase}/api/website-enquiry/city/${encodeURIComponent(city)}`);
        const data = await response.json();
        const enquiries = data.enquiries || [];
        return {
          city,
          count: enquiries.length,
          enquiries
        };
      } catch (error) {
        return { city, count: 0, enquiries: [] };
      }
    })
  );

  const validResults = results.filter((result) => result.count > 0);
  if (validResults.length === 0) return null;

  const topCity = validResults.reduce((max, current) => (current.count > max.count ? current : max));
  const spaces = (topCity.enquiries || []).slice(0, 4).map((enq) => ({
    img: enq.photos && enq.photos.length > 0 ? enq.photos[0] : "https://via.placeholder.com/300x200?text=Property",
    title: enq.property_name,
    location: `${enq.locality || ""}, ${enq.city}`.trim(),
    price: enq.rent || "Contact",
    facilities: enq.amenities || [],
    id: enq.enquiry_id
  }));

  return {
    city: topCity.city,
    spaces
  };
};
