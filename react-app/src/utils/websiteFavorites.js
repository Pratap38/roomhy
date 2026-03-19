const STORAGE_KEY = "roomhy_favorites";

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const loadFavorites = () => {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY) || "[]", []);
};

export const saveFavorites = (favorites) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites || []));
};

export const addFavorite = (property) => {
  if (!property) return false;
  const favorites = loadFavorites();
  const propertyId = property._id || property.enquiry_id;
  if (!propertyId) return false;
  if (favorites.some((fav) => fav._id === propertyId || fav.enquiry_id === propertyId)) {
    return false;
  }
  const next = [
    ...favorites,
    {
      _id: property._id || property.enquiry_id,
      enquiry_id: property.enquiry_id || property._id,
      property_name: property.property_name,
      property_image: property.property_image,
      city: property.city,
      location: property.location || property.city,
      locality: property.locality,
      rent: property.rent,
      price: property.price || property.rent,
      property_type: property.property_type,
      photos: property.photos || property.professionalPhotos || [],
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      isVerified: property.isVerified,
      rating: property.rating,
      reviewsCount: property.reviewsCount,
      addedAt: new Date().toISOString()
    }
  ];
  saveFavorites(next);
  return true;
};

export const removeFavorite = (propertyId) => {
  if (!propertyId) return;
  const favorites = loadFavorites();
  const next = favorites.filter((fav) => fav._id !== propertyId && fav.enquiry_id !== propertyId);
  saveFavorites(next);
};

export const isFavorite = (propertyId) => {
  if (!propertyId) return false;
  const favorites = loadFavorites();
  return favorites.some((fav) => fav._id === propertyId || fav.enquiry_id === propertyId);
};
