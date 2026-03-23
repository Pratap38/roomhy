import React, { useEffect, useMemo, useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { fetchJson } from "../../utils/api";
import { useHtmlPage } from "../../utils/htmlPage";
import {
  assignTenant,
  clearOwnerRuntimeSession,
  createRoom,
  fetchOwnerProperties,
  fetchOwnerRooms,
  fetchOwnerTenants,
  formatMoney,
  getOwnerRuntimeSession
} from "../../utils/propertyowner";

const initialRoomForm = {
  roomNo: "",
  roomType: "AC",
  roomRent: "",
  roomGender: "",
  roomBeds: 2
};

const initialTenantForm = {
  name: "",
  phone: "",
  email: ""
};

const readJson = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

const toLegacyBeds = (room) => {
  const existingBeds = Array.isArray(room?.beds)
    ? room.beds
    : Array.from({ length: Number(room?.beds || room?.capacity || room?.totalBeds || 0) }, (_, index) => {
        const assignment = room?.bedAssignments?.[index] || room?.bedsInfo?.[index] || null;
        return assignment && (assignment.tenantName || assignment.name || assignment.loginId || assignment.tenantId)
          ? {
              status: "occupied",
              tenantId: assignment.tenantId || assignment.loginId || assignment._id || assignment.id || null,
              tenantName: assignment.tenantName || assignment.name || "Tenant"
            }
          : { status: "available", tenantId: null, tenantName: null };
      });
  return existingBeds.length ? existingBeds : [{ status: "available", tenantId: null, tenantName: null }];
};

const normalizeRoomRecord = (room, ownerLoginId) => {
  const propertyId = room?.propertyId || room?.property?._id || room?.property?.id || room?.property || "";
  const number = room?.number || room?.roomNo || room?.title || "Room";
  return {
    ...room,
    id: room?.id || room?._id || `ROOM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    _id: room?._id || room?.id || null,
    ownerId: room?.ownerId || room?.ownerLoginId || ownerLoginId,
    ownerLoginId: room?.ownerLoginId || room?.ownerId || ownerLoginId,
    propertyId,
    propertyTitle: room?.propertyTitle || room?.property?.title || "",
    number,
    roomNo: room?.roomNo || number,
    title: room?.title || number,
    type: room?.type || room?.roomType || "AC",
    roomType: room?.roomType || room?.type || "AC",
    rent: Number(room?.rent ?? room?.price ?? room?.roomRent ?? 0),
    price: Number(room?.price ?? room?.rent ?? room?.roomRent ?? 0),
    gender: room?.gender || room?.roomGender || "",
    beds: toLegacyBeds(room)
  };
};

const mergeRoomSources = (ownerLoginId, property, backendRooms) => {
  const localRooms = readJson("roomhy_rooms", []);
  const propertyId = property?._id || property?.id || property?.propertyId || "";
  const propertyTitle = firstValidValue(property?.title, property?.name, property?.propertyName);
  const merged = [];
  const seen = new Set();

  [...localRooms, ...backendRooms].forEach((item) => {
    const room = normalizeRoomRecord(item, ownerLoginId);
    if (room.ownerLoginId && String(room.ownerLoginId).toUpperCase() !== String(ownerLoginId).toUpperCase()) {
      if (propertyId && String(room.propertyId) !== String(propertyId) && room.propertyTitle !== propertyTitle) return;
    }
    if (!room.propertyId && propertyId) room.propertyId = propertyId;
    if (!room.propertyTitle && propertyTitle) room.propertyTitle = propertyTitle;
    const key = `${room.propertyId || room.propertyTitle}:${room.number}`;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(room);
  });

  return merged;
};

const getOwnerPrimaryPropertyTitle = (owner) =>
  firstValidValue(
    owner?.propertyTitle,
    owner?.propertyName,
    owner?.profile?.propertyTitle,
    owner?.profile?.propertyName
  );

const getSessionOwnerContext = () => {
  if (typeof window === "undefined") return {};
  let sessionOwner = {};
  try {
    sessionOwner = JSON.parse(sessionStorage.getItem("owner_session") || "null") || {};
  } catch {
    sessionOwner = {};
  }
  const storedOwner =
    readJson("owner_user", null) ||
    readJson("user", null) ||
    sessionOwner ||
    {};
  return {
    ...(storedOwner && typeof storedOwner === "object" ? storedOwner : {}),
    ...(window.__ownerContext || {})
  };
};

const findCachedPropertyRecord = (ownerLoginId, currentProperty) => {
  const propertyId = currentProperty?._id || currentProperty?.id || currentProperty?.propertyId || "";
  const cachedProperties = readJson("roomhy_properties", []);
  const propertyMatch = cachedProperties.find((item) => {
    const candidateOwner = String(item?.ownerLoginId || item?.ownerId || item?.owner || "").toUpperCase();
    const candidateId = String(item?._id || item?.id || item?.propertyId || "");
    return (
      (candidateOwner && candidateOwner === String(ownerLoginId || "").toUpperCase()) ||
      (propertyId && candidateId === String(propertyId))
    );
  });
  if (propertyMatch) return propertyMatch;

  const visits = readJson("roomhy_visits", []);
  const visitMatch = visits.find((visit) => {
    const generatedLoginId = String(
      visit?.generatedCredentials?.loginId ||
      visit?.generatedCreds?.loginId ||
      visit?.generatedId ||
      visit?.loginId ||
      ""
    ).toUpperCase();
    return generatedLoginId && generatedLoginId === String(ownerLoginId || "").toUpperCase();
  });
  if (!visitMatch) return null;
  const visitProperty = visitMatch?.propertyInfo || visitMatch?.property || visitMatch?.propertyDetails || null;
  if (visitProperty) return visitProperty;
  return {
    title: visitMatch?.propertyName || visitMatch?.name || "",
    name: visitMatch?.propertyName || visitMatch?.name || "",
    propertyName: visitMatch?.propertyName || visitMatch?.name || "",
    location: visitMatch?.location || visitMatch?.area || visitMatch?.city || visitMatch?.address || "",
    area: visitMatch?.area || "",
    city: visitMatch?.city || "",
    address: visitMatch?.address || "",
    locationCode: visitMatch?.locationCode || visitMatch?.area || ""
  };
};

const findVacantBeds = (room) =>
  toLegacyBeds(room).map((bed, index) => ({
    index,
    occupied: bed?.status === "occupied" || Boolean(bed?.tenantName || bed?.loginId || bed?.tenantId),
    tenant: bed
  }));

const normalizeTextValue = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  const lower = text.toLowerCase();
  if (lower === "new" || lower === "undefined" || lower === "null" || lower === "na" || lower === "n/a") {
    return "";
  }
  return text;
};

const firstValidValue = (...values) => {
  for (const value of values) {
    const cleaned = normalizeTextValue(value);
    if (cleaned) return cleaned;
  }
  return "";
};

export default function Rooms() {
  useHtmlPage({
    title: "RoomHy - Room Management",
    bodyClass: "text-slate-800 h-screen overflow-hidden flex flex-col",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      },
      { rel: "stylesheet", href: "/propertyowner/assets/css/rooms.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [owner, setOwner] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState("unknown");
  const [errorMsg, setErrorMsg] = useState("");
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [roomForm, setRoomForm] = useState(initialRoomForm);
  const [assignMode, setAssignMode] = useState("existing");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBedIndex, setSelectedBedIndex] = useState(null);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [newTenantForm, setNewTenantForm] = useState(initialTenantForm);

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [rooms, properties, tenants, roomModalOpen, assignModalOpen]);

  const currentProperty = useMemo(() => properties[0] || null, [properties]);
  const cachedProperty = useMemo(
    () => findCachedPropertyRecord(owner?.loginId, currentProperty),
    [owner?.loginId, currentProperty]
  );
  const ownerContext = useMemo(
    () => getSessionOwnerContext(),
    []
  );
  const roomPropertyTitle = useMemo(
    () => firstValidValue(...rooms.map((room) => room?.propertyTitle)),
    [rooms]
  );
  const currentPropertyTitle = useMemo(
    () => firstValidValue(
      getOwnerPrimaryPropertyTitle(owner),
      owner?.profile?.propertyName,
      owner?.profile?.propertyTitle,
      currentProperty?.title,
      currentProperty?.name,
      currentProperty?.propertyName,
      currentProperty?.displayName,
      currentProperty?.propName,
      cachedProperty?.title,
      cachedProperty?.name,
      cachedProperty?.propertyName,
      roomPropertyTitle,
      ownerContext?.propertyName,
      ownerContext?.propertyTitle,
      owner?.propertyName
    ),
    [cachedProperty, currentProperty, owner, ownerContext, roomPropertyTitle]
  );
  const currentPropertyLocation = useMemo(
    () => firstValidValue(
      currentProperty?.location,
      currentProperty?.locationCode,
      currentProperty?.area,
      currentProperty?.city,
      currentProperty?.address,
      cachedProperty?.location,
      cachedProperty?.locationCode,
      cachedProperty?.area,
      cachedProperty?.city,
      cachedProperty?.address,
      ownerContext?.propertyLocation,
      ownerContext?.area,
      ownerContext?.locationCode,
      owner?.location,
      owner?.checkinArea,
      owner?.area,
      owner?.locationCode,
      owner?.address,
      owner?.checkinAddress
    ),
    [cachedProperty, currentProperty, owner, ownerContext]
  );
  const currentPropertyDisplay = useMemo(
    () => {
      if (currentPropertyTitle && currentPropertyLocation) return `${currentPropertyTitle} (${currentPropertyLocation})`;
      if (currentPropertyTitle) return currentPropertyTitle;
      if (currentPropertyLocation) return `Location: ${currentPropertyLocation}`;
      return "Loading Property...";
    },
    [currentPropertyLocation, currentPropertyTitle]
  );
  const unassignedTenants = useMemo(
    () => tenants.filter((tenant) => !tenant.room && !tenant.roomNo && !tenant.roomNumber),
    [tenants]
  );

  const persistRooms = (updater) => {
    const nextRooms = typeof updater === "function" ? updater(readJson("roomhy_rooms", [])) : updater;
    writeJson("roomhy_rooms", nextRooms);
    setRooms(mergeRoomSources(owner?.loginId || "", currentProperty, nextRooms));
    return nextRooms;
  };

  const markBedOccupied = (roomId, bedIndex, tenantId, tenantName) => {
    const applyBedUpdate = (room) => {
      const normalizedRoom = normalizeRoomRecord(room, owner?.loginId || "");
      const beds = toLegacyBeds(normalizedRoom);
      beds[bedIndex] = {
        status: "occupied",
        tenantId,
        tenantName
      };
      return { ...normalizedRoom, beds };
    };

    setRooms((prevRooms) => prevRooms.map((room) => (
      String(room.id || room._id) === String(roomId) ? applyBedUpdate(room) : room
    )));

    const localRooms = readJson("roomhy_rooms", []);
    const localRoomIndex = localRooms.findIndex((room) => String(room.id || room._id) === String(roomId));
    const nextLocalRooms = [...localRooms];
    if (localRoomIndex >= 0) {
      nextLocalRooms[localRoomIndex] = applyBedUpdate(nextLocalRooms[localRoomIndex]);
    } else {
      const currentRoom = rooms.find((room) => String(room.id || room._id) === String(roomId));
      if (currentRoom) {
        nextLocalRooms.push(applyBedUpdate(currentRoom));
      }
    }
    writeJson("roomhy_rooms", nextLocalRooms);
  };

  const ensurePropertyId = async (session, propertyList) => {
    const existingProperty = propertyList?.[0];
    if (existingProperty?._id) return existingProperty._id;
    const propertyTitle = firstValidValue(
      existingProperty?.title,
      existingProperty?.name,
      getOwnerPrimaryPropertyTitle(owner),
      owner?.propertyName,
      "Owner Property"
    );
    const locationCode = firstValidValue(
      existingProperty?.locationCode,
      existingProperty?.area,
      owner?.locationCode,
      owner?.area,
      owner?.checkinArea,
      "KO"
    );
    const created = await fetchJson(`/api/owners/${encodeURIComponent(session.loginId)}/properties`, {
      method: "POST",
      body: JSON.stringify({
        title: propertyTitle,
        address: firstValidValue(existingProperty?.address, owner?.address, owner?.checkinAddress),
        locationCode,
        area: locationCode
      })
    });
    return created?.property?._id || "";
  };

  const loadPage = async (session) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [propertyList, roomData, tenantList, ownerProfile] = await Promise.all([
        fetchOwnerProperties(session.loginId),
        fetchOwnerRooms(session.loginId),
        fetchOwnerTenants(session.loginId),
        fetchJson(`/api/owners/${encodeURIComponent(session.loginId)}`).catch(() => null)
      ]);
      if (ownerProfile) {
        setOwner((prev) => ({ ...(prev || {}), ...ownerProfile }));
      }
      const resolvedProperties = propertyList.length ? propertyList : roomData.properties || [];
      const mergedRooms = mergeRoomSources(session.loginId, resolvedProperties[0], roomData.rooms || []);
      setProperties(resolvedProperties);
      setRooms(mergedRooms);
      setTenants(tenantList || []);
      setBackendStatus("connected");
    } catch (err) {
      setBackendStatus("connection failed");
      setErrorMsg(err?.body || err?.message || "Failed to load rooms.");
      setRooms(mergeRoomSources(session.loginId, properties[0], []));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = getOwnerRuntimeSession();
    if (!session?.loginId) {
      window.location.href = "/propertyowner/ownerlogin";
      return;
    }
    setOwner(session);
    loadPage(session);
  }, []);

  const openAssignModal = (room, bedIndex) => {
    setSelectedRoom(room);
    setSelectedBedIndex(bedIndex);
    setSelectedTenantId("");
    setNewTenantForm(initialTenantForm);
    setAssignMode("new");
    setAssignModalOpen(true);
  };

  const handleCreateRoom = async (event) => {
    event.preventDefault();
    if (!owner?.loginId) {
      setErrorMsg("Owner session missing. Please login again.");
      return;
    }
    try {
      setErrorMsg("");
      const session = owner;
      const propertyId = currentProperty?._id || await ensurePropertyId(session, properties);
      if (!propertyId) {
        setErrorMsg("Property not loaded. Cannot add room.");
        return;
      }
      const bedCount = Number(roomForm.roomBeds || 1);
      const localRoom = normalizeRoomRecord({
        id: `ROOM-${Date.now()}`,
        ownerId: session.loginId,
        ownerLoginId: session.loginId,
        propertyId,
        propertyTitle: firstValidValue(
          getOwnerPrimaryPropertyTitle(owner),
          currentProperty?.title,
          currentProperty?.name,
          cachedProperty?.title,
          cachedProperty?.name,
          cachedProperty?.propertyName,
          roomPropertyTitle,
          ownerContext?.propertyName,
          owner?.propertyName,
          "Owner Property"
        ),
        number: roomForm.roomNo,
        roomNo: roomForm.roomNo,
        title: roomForm.roomNo,
        type: roomForm.roomType,
        roomType: roomForm.roomType,
        rent: Number(roomForm.roomRent || 0),
        price: Number(roomForm.roomRent || 0),
        gender: roomForm.roomGender,
        beds: Array.from({ length: bedCount }, () => ({ status: "available", tenantId: null, tenantName: null })),
        source: "owner",
        approvalStatus: "auto-approved",
        submittedAt: new Date().toISOString()
      }, session.loginId);
      persistRooms((allRooms) => [...allRooms, localRoom]);
      try {
        await createRoom({
          propertyId,
          title: roomForm.roomNo,
          type: roomForm.roomType,
          price: Number(roomForm.roomRent || 0),
          rent: Number(roomForm.roomRent || 0),
          beds: bedCount,
          capacity: bedCount,
          roomNo: roomForm.roomNo,
          number: roomForm.roomNo,
          gender: roomForm.roomGender,
          ownerLoginId: session.loginId
        });
      } catch (_) {
        // keep legacy local-first behavior when backend sync fails
      }
      setRoomModalOpen(false);
      setRoomForm(initialRoomForm);
      await loadPage(session);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to create room.");
    }
  };

  const handleAssignTenant = async (event) => {
    event.preventDefault();
    if (!owner?.loginId || !selectedRoom) return;
    try {
      setErrorMsg("");
      const propertyId = currentProperty?._id || selectedRoom.property?._id || selectedRoom.property || selectedRoom.propertyId || "";
      const roomNo = selectedRoom.number || selectedRoom.roomNo || selectedRoom.title || "";
      const agreedRent = Number(selectedRoom.rent ?? selectedRoom.price ?? 0);
      const moveInDate = new Date().toISOString().split("T")[0];
      let payload;
      let assignedTenantName = "Tenant";
      let assignedTenantId = selectedTenantId || `TNT-${Date.now()}`;

      if (assignMode === "existing") {
        const existingTenant = tenants.find((tenant) => (tenant._id || tenant.id || tenant.loginId) === selectedTenantId);
        if (!existingTenant) {
          setErrorMsg("Select a tenant.");
          return;
        }
        if (!existingTenant.name || !existingTenant.phone || !existingTenant.email) {
          setErrorMsg("Selected tenant must have name, phone, and email.");
          return;
        }
        payload = {
          name: existingTenant.name,
          phone: existingTenant.phone,
          email: existingTenant.email,
          propertyId,
          roomNo,
          bedNo: Number(selectedBedIndex) + 1,
          moveInDate,
          agreedRent,
          ownerLoginId: owner.loginId,
          propertyTitle: firstValidValue(
            selectedRoom.propertyTitle,
            getOwnerPrimaryPropertyTitle(owner),
            currentProperty?.title,
            currentProperty?.name
          ),
          locationCode: firstValidValue(currentProperty?.locationCode, currentProperty?.area, owner?.locationCode, owner?.area)
        };
        assignedTenantName = existingTenant.name;
        assignedTenantId = existingTenant._id || existingTenant.id || existingTenant.loginId;
      } else {
        if (!newTenantForm.name || !newTenantForm.phone || !newTenantForm.email) {
          setErrorMsg("Name, phone and email are required.");
          return;
        }
        payload = {
          name: newTenantForm.name,
          phone: newTenantForm.phone,
          email: newTenantForm.email,
          propertyId,
          roomNo,
          bedNo: Number(selectedBedIndex) + 1,
          moveInDate,
          agreedRent,
          ownerLoginId: owner.loginId,
          propertyTitle: firstValidValue(
            selectedRoom.propertyTitle,
            getOwnerPrimaryPropertyTitle(owner),
            currentProperty?.title,
            currentProperty?.name
          ),
          locationCode: firstValidValue(currentProperty?.locationCode, currentProperty?.area, owner?.locationCode, owner?.area)
        };
        assignedTenantName = newTenantForm.name;
      }

      await assignTenant(payload);
      markBedOccupied(selectedRoom.id || selectedRoom._id, selectedBedIndex, assignedTenantId, assignedTenantName);
      setAssignModalOpen(false);
      await loadPage(owner);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to assign tenant.");
    }
  };

  const handleAddBed = (roomId) => {
    persistRooms((allRooms) => allRooms.map((room) => {
      const normalized = normalizeRoomRecord(room, owner?.loginId || "");
      if ((normalized.id || normalized._id) !== roomId) return room;
      if (normalized.beds.length >= 10) return room;
      return {
        ...normalized,
        beds: [...normalized.beds, { status: "available", tenantId: null, tenantName: null }]
      };
    }));
  };

  const handleRemoveBed = (roomId, bedIndex) => {
    persistRooms((allRooms) => allRooms.map((room) => {
      const normalized = normalizeRoomRecord(room, owner?.loginId || "");
      if ((normalized.id || normalized._id) !== roomId) return room;
      const beds = normalized.beds.filter((_, index) => index !== bedIndex);
      return { ...normalized, beds: beds.length ? beds : [{ status: "available", tenantId: null, tenantName: null }] };
    }));
  };

  const handleDeleteRoom = (roomId) => {
    persistRooms((allRooms) => allRooms.filter((room) => (room.id || room._id) !== roomId));
  };

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Manage Rooms"
      navVariant="default"
      headerVariant="compact"
      onLogout={() => {
        clearOwnerRuntimeSession();
        window.location.href = "/propertyowner/ownerlogin";
      }}
      mainClassName="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar"
      contentClassName="max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center mt-1 text-slate-500 text-sm bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200 w-fit">
            <i data-lucide="map-pin" className="w-4 h-4 mr-2 text-purple-500"></i>
            <a id="propertyNameDisplay" className="font-medium text-purple-700 hover:underline" href={currentProperty?._id ? `/propertyowner/properties?id=${encodeURIComponent(currentProperty._id)}` : "#"}>{currentPropertyDisplay}</a>
          </div>
          <div id="dataStatus" className="mt-2 text-xs text-gray-500 flex items-center gap-3">
            <span id="backendStatus">{`Backend: ${loading ? "loading" : backendStatus}`}</span>
            <span id="roomsCount">{`Rooms: ${rooms.length}`}</span>
            <span id="tenantsCount">{`Tenants: ${tenants.length}`}</span>
            <button id="loadTenantsBtn" type="button" onClick={() => owner && loadPage(owner)} className="ml-2 text-xs px-2 py-1 bg-gray-100 rounded-md">
              Import Tenants
            </button>
          </div>
        </div>
        <button type="button" onClick={() => setRoomModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-purple-500/30 transition-all font-medium">
          <i data-lucide="plus-circle" className="w-5 h-5"></i>
          Add New Room
        </button>
      </div>

      {errorMsg ? <div className="text-sm text-red-600 mb-4">{errorMsg}</div> : null}

      <div id="roomsGrid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {!loading && rooms.map((room) => {
          const beds = findVacantBeds(room);
          return (
            <div key={room._id || room.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{room.number || room.roomNo || room.title || "Room"}</h3>
                  <p className="text-sm text-gray-500">{`${room.type || room.roomType || "AC"} | ${formatMoney(room.rent ?? room.price)}/month`}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">{room.gender || "Mixed"}</span>
              </div>
              <div className="space-y-3">
                {beds.map((bed) => (
                  <div key={`${room._id || room.id}-${bed.index}`} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-3 bg-gray-50">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{`Bed ${bed.index + 1}`}</p>
                      <p className="text-xs text-gray-500">{bed.occupied ? (bed.tenant?.tenantName || bed.tenant?.name || "Occupied") : "Vacant"}</p>
                    </div>
                    {!bed.occupied ? (
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => openAssignModal(room, bed.index)} className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 text-white">
                          Assign
                        </button>
                        <button type="button" onClick={() => handleRemoveBed(room.id || room._id, bed.index)} className="text-xs px-2 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-500">
                          X
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700">Occupied</span>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => handleAddBed(room.id || room._id)} className="w-full rounded-xl border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-500 hover:bg-gray-50">
                  Add Bed
                </button>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={() => handleDeleteRoom(room.id || room._id)} className="text-xs text-red-500 hover:underline">
                  Remove Room
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && rooms.length === 0 ? (
        <div id="emptyState" className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="bg-purple-50 p-4 rounded-full mb-4">
            <i data-lucide="bed-double" className="w-10 h-10 text-purple-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-700">No rooms added yet</h3>
          <p className="text-sm">Start by adding a room to manage beds and tenants.</p>
          <button type="button" onClick={() => setRoomModalOpen(true)} className="mt-4 text-purple-600 font-medium hover:underline">Add Room Now</button>
        </div>
      ) : null}

      <div className={`fixed inset-0 bg-black/60 ${roomModalOpen ? "flex" : "hidden"} items-center justify-center z-50 backdrop-blur-sm transition-opacity`}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative transform transition-all scale-100">
          <button type="button" onClick={() => setRoomModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-1 rounded-full transition">
            <i data-lucide="x" className="w-5 h-5"></i>
          </button>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900">Add New Room</h3>
            <p className="text-sm text-gray-500">Configure room details and capacity.</p>
          </div>
          <form id="roomForm" onSubmit={handleCreateRoom}>
            <div className="space-y-5">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Property</label>
                <div className="flex items-center text-sm font-medium text-gray-800">
                  <i data-lucide="building-2" className="w-4 h-4 mr-2 text-purple-500"></i>
                  <span id="modalPropertyNameText">{currentPropertyDisplay}</span>
                </div>
                <input type="hidden" id="modalPropertyId" value={currentProperty?._id || ""} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number / Name</label>
                <input type="text" required className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition" placeholder="e.g. 101, A-Wing" value={roomForm.roomNo} onChange={(event) => setRoomForm((prev) => ({ ...prev, roomNo: event.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                  <div className="relative">
                    <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-8 focus:ring-2 focus:ring-purple-500 outline-none appearance-none bg-white" value={roomForm.roomType} onChange={(event) => setRoomForm((prev) => ({ ...prev, roomType: event.target.value }))}>
                      <option value="AC">AC Room</option>
                      <option value="Non-AC">Non-AC</option>
                    </select>
                    <i data-lucide="chevron-down" className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none"></i>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rent / Month (Rs)</label>
                  <input type="number" required className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="0.00" value={roomForm.roomRent} onChange={(event) => setRoomForm((prev) => ({ ...prev, roomRent: event.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <div className="relative">
                  <select required className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-8 focus:ring-2 focus:ring-purple-500 outline-none appearance-none bg-white" value={roomForm.roomGender} onChange={(event) => setRoomForm((prev) => ({ ...prev, roomGender: event.target.value }))}>
                    <option value="">-- Select Gender --</option>
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                    <option value="Co-ed">Co-ed</option>
                  </select>
                  <i data-lucide="chevron-down" className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none"></i>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Beds</label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button type="button" onClick={() => setRoomForm((prev) => ({ ...prev, roomBeds: Math.max(1, prev.roomBeds - 1) }))} className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border-r">-</button>
                  <input type="number" required min="1" max="10" value={roomForm.roomBeds} className="w-full text-center py-2.5 outline-none" readOnly />
                  <button type="button" onClick={() => setRoomForm((prev) => ({ ...prev, roomBeds: Math.min(10, prev.roomBeds + 1) }))} className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border-l">+</button>
                </div>
                <p className="text-xs text-gray-500 mt-1">You can add/remove beds later.</p>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setRoomModalOpen(false)} className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 shadow-md hover:shadow-lg transition">Create Room</button>
            </div>
          </form>
        </div>
      </div>

      <div className={`fixed inset-0 bg-black/60 ${assignModalOpen ? "flex" : "hidden"} items-center justify-center z-50 backdrop-blur-sm`}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
          <button type="button" onClick={() => setAssignModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 p-1 rounded-full">
            <i data-lucide="x" className="w-5 h-5"></i>
          </button>
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Assign Tenant</h3>
            <p className="text-sm text-gray-500">{`Assigning to ${selectedRoom?.number || selectedRoom?.roomNo || selectedRoom?.title || "Room"}`}</p>
          </div>
          <div className="flex mb-4 bg-gray-100 p-1 rounded-lg">
            <button type="button" onClick={() => setAssignMode("existing")} className={`tab-btn flex-1 py-2 text-sm font-medium rounded-md transition text-center ${assignMode === "existing" ? "active bg-white text-purple-600 shadow-sm" : "text-gray-500"}`}>Select Existing</button>
            <button type="button" onClick={() => setAssignMode("new")} className={`tab-btn flex-1 py-2 text-sm font-medium rounded-md transition text-center ${assignMode === "new" ? "active bg-white text-purple-600 shadow-sm" : "text-gray-500"}`}>New Tenant</button>
          </div>
          <form onSubmit={handleAssignTenant}>
            <div className="mb-4 rounded-lg border border-purple-100 bg-purple-50 p-3">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-gray-500 uppercase font-semibold">Property</p>
                  <p className="text-gray-800 font-semibold truncate">{currentPropertyDisplay === "Loading Property..." ? "-" : currentPropertyDisplay}</p>
                </div>
                <div>
                  <p className="text-gray-500 uppercase font-semibold">Room</p>
                  <p className="text-gray-800 font-semibold">{selectedRoom?.number || selectedRoom?.roomNo || selectedRoom?.title || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500 uppercase font-semibold">Rent</p>
                  <p className="text-gray-800 font-semibold">{formatMoney(selectedRoom?.rent ?? selectedRoom?.price)}</p>
                </div>
              </div>
            </div>
            {assignMode === "existing" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Unassigned Tenant</label>
                  <select className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none bg-white" value={selectedTenantId} onChange={(event) => setSelectedTenantId(event.target.value)}>
                    <option value="">Select a tenant...</option>
                    {unassignedTenants.map((tenant) => (
                      <option key={tenant._id || tenant.id || tenant.loginId} value={tenant._id || tenant.id || tenant.loginId}>
                        {tenant.name || tenant.fullName || tenant.email || tenant.loginId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Enter name" value={newTenantForm.name} onChange={(event) => setNewTenantForm((prev) => ({ ...prev, name: event.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Enter phone" value={newTenantForm.phone} onChange={(event) => setNewTenantForm((prev) => ({ ...prev, phone: event.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Enter email" value={newTenantForm.email} onChange={(event) => setNewTenantForm((prev) => ({ ...prev, email: event.target.value }))} />
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setAssignModalOpen(false)} className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 shadow-md hover:shadow-lg transition">Confirm Assignment</button>
            </div>
          </form>
        </div>
      </div>
    </PropertyOwnerLayout>
  );
}
