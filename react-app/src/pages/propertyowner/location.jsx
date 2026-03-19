import React, { useEffect, useMemo, useState } from "react";
import { fetchJson, getApiBase } from "../../utils/api";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { useHtmlPage } from "../../utils/htmlPage";
import { requireOwnerSession } from "../../utils/ownerSession";

export default function Location() {
  useHtmlPage({
    title: "Roomhy - Admin Location Management",
    bodyClass: "text-gray-900",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic", crossOrigin: true },
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      },
      { rel: "stylesheet", href: "/propertyowner/assets/css/location.css" }
    ],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" }
    ],
    inlineScripts: []
  });

  const [owner, setOwner] = useState(null);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("cities");
  const [cityForm, setCityForm] = useState({ name: "", state: "" });
  const [areaForm, setAreaForm] = useState({ name: "", city: "", pincode: "" });

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [cities, areas, activeTab, loading]);

  useEffect(() => {
    const session = requireOwnerSession();
    if (!session) return;
    setOwner(session);
    const load = async () => {
      try {
        const [citiesRes, areasRes] = await Promise.all([
          fetchJson("/api/locations/cities"),
          fetchJson("/api/locations/areas")
        ]);
        setCities(citiesRes?.data || citiesRes || []);
        setAreas(areasRes?.data || areasRes || []);
      } catch (err) {
        setErrorMsg(err?.body || err?.message || "Failed to load locations.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const citiesOptions = useMemo(() => cities.map((c) => c.name || c.city || ""), [cities]);

  const createCity = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", cityForm.name);
      formData.append("state", cityForm.state);
      const res = await fetch(`${getApiBase()}/api/locations/cities`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      const newCity = result?.data || result;
      setCities((prev) => [...prev, newCity]);
      setCityForm({ name: "", state: "" });
    } catch (err) {
      setErrorMsg(err?.message || "Failed to create city.");
    }
  };

  const createArea = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", areaForm.name);
      formData.append("city", areaForm.city);
      formData.append("pincode", areaForm.pincode);
      const res = await fetch(`${getApiBase()}/api/locations/areas`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      const newArea = result?.data || result;
      setAreas((prev) => [...prev, newArea]);
      setAreaForm({ name: "", city: "", pincode: "" });
    } catch (err) {
      setErrorMsg(err?.message || "Failed to create area.");
    }
  };

  return (
    <PropertyOwnerLayout owner={owner} title="Location" icon="map-pin">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Serviceable Locations</h2>
          <p className="text-gray-500 mt-1">Manage cities and areas where Roomhy is available.</p>
        </div>
      </div>

      {errorMsg && <div className="text-sm text-red-600 mb-4">{errorMsg}</div>}

      <div className="mb-6 flex space-x-3">
        <button type="button" className={`filter-tab ${activeTab === "cities" ? "active" : ""}`} onClick={() => setActiveTab("cities")}>
          Cities
        </button>
        <button type="button" className={`filter-tab ${activeTab === "areas" ? "active" : ""}`} onClick={() => setActiveTab("areas")}>
          Areas
        </button>
      </div>

      {loading && <div className="text-gray-500">Loading locations...</div>}

      {!loading && activeTab === "cities" && (
        <div className="space-y-6">
          <form onSubmit={createCity} className="bg-white rounded-xl shadow-lg p-4 flex flex-wrap gap-3">
            <input className="border border-gray-300 rounded px-3 py-2 text-sm" placeholder="City name" value={cityForm.name} onChange={(e) => setCityForm((prev) => ({ ...prev, name: e.target.value }))} />
            <input className="border border-gray-300 rounded px-3 py-2 text-sm" placeholder="State" value={cityForm.state} onChange={(e) => setCityForm((prev) => ({ ...prev, state: e.target.value }))} />
            <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">Add City</button>
          </form>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full excel-table">
                <thead>
                  <tr>
                    <th>City Name</th>
                    <th>State</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.length === 0 && (
                    <tr><td colSpan={3} className="text-center py-6 text-gray-500">No cities found.</td></tr>
                  )}
                  {cities.map((city) => (
                    <tr key={city._id || city.name}>
                      <td>{city.name || city.city || "-"}</td>
                      <td>{city.state || "-"}</td>
                      <td className="capitalize">{city.status || "active"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === "areas" && (
        <div className="space-y-6">
          <form onSubmit={createArea} className="bg-white rounded-xl shadow-lg p-4 flex flex-wrap gap-3">
            <input className="border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Area name" value={areaForm.name} onChange={(e) => setAreaForm((prev) => ({ ...prev, name: e.target.value }))} />
            <select className="border border-gray-300 rounded px-3 py-2 text-sm" value={areaForm.city} onChange={(e) => setAreaForm((prev) => ({ ...prev, city: e.target.value }))}>
              <option value="">Select City</option>
              {citiesOptions.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <input className="border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Pincode" value={areaForm.pincode} onChange={(e) => setAreaForm((prev) => ({ ...prev, pincode: e.target.value }))} />
            <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">Add Area</button>
          </form>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full excel-table">
                <thead>
                  <tr>
                    <th>Area Name</th>
                    <th>City</th>
                    <th>Pincode</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-6 text-gray-500">No areas found.</td></tr>
                  )}
                  {areas.map((area) => (
                    <tr key={area._id || area.name}>
                      <td>{area.name || "-"}</td>
                      <td>{area.city || "-"}</td>
                      <td>{area.pincode || "-"}</td>
                      <td className="capitalize">{area.status || "active"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
