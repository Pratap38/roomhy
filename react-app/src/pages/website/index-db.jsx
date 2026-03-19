import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { getWebsiteApiUrl } from "../../utils/websiteSession";
import { useLucideIcons, useWebsiteCommon } from "../../utils/websiteUi";

const getPhotoList = (prop) => {
  const photos = Array.isArray(prop?.photos) ? prop.photos : [];
  const proPhotos = Array.isArray(prop?.professionalPhotos) ? prop.professionalPhotos : [];
  if (photos.length > 0) return photos;
  if (proPhotos.length > 0) return proPhotos;
  return ["https://via.placeholder.com/400x250?text=No+Photos"];
};

export default function WebsiteIndexDb() {
  useWebsiteCommon();

  const apiUrl = useMemo(() => getWebsiteApiUrl(), []);
  const [allProperties, setAllProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [cityFilter, setCityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [activeProperty, setActiveProperty] = useState(null);
  const [imageIndex, setImageIndex] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState("");

  useLucideIcons([filteredProperties, activeProperty, imageIndex]);

  useEffect(() => {
    let mounted = true;
    const loadProperties = async () => {
      setLoading(true);
      setErrorState("");
      try {
        const response = await fetch(`${apiUrl}/api/approved-properties/website/live`);
        const result = await response.json();
        if (result?.success) {
          const props = result.properties || [];
          if (!mounted) return;
          setAllProperties(props);
          setFilteredProperties(props);
        } else {
          throw new Error("Failed to load properties");
        }
      } catch (error) {
        if (!mounted) return;
        setErrorState(error.message || "Failed to load properties");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadProperties();
    return () => {
      mounted = false;
    };
  }, [apiUrl]);

  useEffect(() => {
    let result = allProperties;
    if (cityFilter) {
      result = result.filter((prop) => prop.city === cityFilter);
    }
    if (typeFilter) {
      result = result.filter((prop) => prop.propertyType === typeFilter);
    }
    setFilteredProperties(result);
  }, [allProperties, cityFilter, typeFilter]);

  const cityOptions = useMemo(() => {
    const cities = new Set();
    allProperties.forEach((prop) => {
      if (prop.city) cities.add(prop.city);
    });
    return Array.from(cities).sort();
  }, [allProperties]);

  const showDetails = (propertyId) => {
    const prop = allProperties.find((p) => p.propertyId === propertyId);
    if (!prop) return;
    setActiveProperty(prop);
  };

  const closeModal = () => {
    setActiveProperty(null);
  };

  const goPrevImage = (propertyId, photos) => {
    if (!photos?.length) return;
    setImageIndex((prev) => {
      const current = prev[propertyId] ?? 0;
      const next = (current - 1 + photos.length) % photos.length;
      return { ...prev, [propertyId]: next };
    });
  };

  const goNextImage = (propertyId, photos) => {
    if (!photos?.length) return;
    setImageIndex((prev) => {
      const current = prev[propertyId] ?? 0;
      const next = (current + 1) % photos.length;
      return { ...prev, [propertyId]: next };
    });
  };

  useHtmlPage({
    title: "Available Properties - Roomhy",
    bodyClass: "bg-gray-50",
    htmlAttrs: {
      lang: "en"
    },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    bases: [],
    links: [
      {
        rel: "stylesheet",
        href: "/website/assets/css/index-db.css"
      }
    ],
    styles: [],
    scripts: [
      { src: "https://cdn.tailwindcss.com" }
    ],
    inlineScripts: []
  });

  return (
    <div className="html-page">
      <div className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Available Properties</h1>
          <p className="text-gray-600">Find your perfect rental</p>
        </div>
      </div>

      <div className="bg-white shadow-md mt-6">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by City</label>
              <select
                id="cityFilter"
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Cities</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="room">Single Room</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <button
              onClick={() => {
                setCityFilter("");
                setTypeFilter("");
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mt-6"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div id="propertiesContainer" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && (
            <div className="col-span-full text-center py-8 text-gray-500">Loading properties...</div>
          )}
          {!loading && errorState && (
            <div className="col-span-full text-center py-8 text-red-600">{errorState}</div>
          )}
          {!loading && !errorState && filteredProperties.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-8">No properties found</div>
          )}
          {!loading && !errorState && filteredProperties.map((prop) => {
            const photos = getPhotoList(prop);
            const propertyId = prop.propertyId || prop._id || prop.propertyNumber;
            const currentIndex = imageIndex[propertyId] ?? 0;
            const photo = photos[currentIndex] || photos[0];
            return (
              <div key={propertyId} className="bg-white rounded-lg shadow-lg overflow-hidden property-card">
                <div className="carousel">
                  <div className="carousel-container">
                    <div className="carousel-slide">
                      <img src={photo} alt="Property" />
                    </div>
                  </div>
                  {photos.length > 1 && (
                    <>
                      <button className="carousel-nav prev" onClick={() => goPrevImage(propertyId, photos)}>❮</button>
                      <button className="carousel-nav next" onClick={() => goNextImage(propertyId, photos)}>❯</button>
                    </>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{prop.propertyName}</h3>
                  <p className="text-gray-600 mb-4">{prop.city}{prop.area ? `, ${prop.area}` : ""}</p>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-semibold">{prop.propertyType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rent:</span>
                      <span className="font-semibold text-blue-600">₹{prop.monthlyRent || "N/A"}/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Suitable For:</span>
                      <span className="font-semibold">{prop.genderSuitability || "N/A"}</span>
                    </div>
                  </div>

                  <button onClick={() => showDetails(prop.propertyId)} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div id="detailsModal" className={`fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50 ${activeProperty ? "flex" : "hidden"}`}>
        {activeProperty && (
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800" id="modalTitle">{activeProperty.propertyName}</h2>
              <button onClick={closeModal} className="text-2xl font-bold text-gray-600 hover:text-gray-900">&times;</button>
            </div>
            <div id="modalContent" className="p-6 space-y-4">
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Property Details</h4>
                <div className="bg-gray-50 p-4 rounded space-y-2">
                  <p><strong>Type:</strong> {activeProperty.propertyType}</p>
                  <p><strong>Address:</strong> {activeProperty.address || "N/A"}</p>
                  <p><strong>City:</strong> {activeProperty.city}</p>
                  <p><strong>Area:</strong> {activeProperty.area || "N/A"}</p>
                  <p><strong>Pincode:</strong> {activeProperty.pincode || "N/A"}</p>
                  <p><strong>Description:</strong> {activeProperty.description || "N/A"}</p>
                  <p><strong>Monthly Rent:</strong> ₹{activeProperty.monthlyRent || "N/A"}</p>
                  <p><strong>Deposit:</strong> {activeProperty.deposit || "N/A"}</p>
                  <p><strong>Gender Suitability:</strong> {activeProperty.genderSuitability || "N/A"}</p>
                  <p><strong>Amenities:</strong> {(activeProperty.amenities || []).join(", ") || "N/A"}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2">Contact Owner</h4>
                <div className="bg-gray-50 p-4 rounded space-y-2">
                  <p><strong>Name:</strong> {activeProperty.ownerName}</p>
                  <p><strong>Email:</strong> <a href={`mailto:${activeProperty.ownerEmail}`} className="text-blue-600">{activeProperty.ownerEmail}</a></p>
                  <p><strong>Phone:</strong> <a href={`tel:${activeProperty.ownerPhone}`} className="text-blue-600">{activeProperty.ownerPhone}</a></p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


