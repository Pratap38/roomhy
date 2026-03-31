import { useEffect, useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { fetchJson } from "../../utils/api";
import { useHtmlPage } from "../../utils/htmlPage";
import { clearOwnerRuntimeSession, getOwnerRuntimeSession } from "../../utils/propertyowner";

const initialForm = {
  name: "",
  email: "",
  area: "",
  dob: "",
  phone: "",
  address: "",
  bankName: "",
  branchName: "",
  bankAccountNumber: "",
  ifscCode: "",
  accountHolderName: "",
  upiId: "",
  vacantRooms: 0,
  vacantBeds: 0,
  occupiedRooms: 0,
  occupiedBeds: 0,
  occupiedRoomBeds: [1],
  vacantRoomBeds: [1]
};

const distributeBeds = (totalBeds, roomCount) => {
  const safeCount = Number(roomCount || 0);
  if (safeCount <= 0) return [];
  const safeBeds = Math.max(0, Number(totalBeds || 0));
  const base = Math.floor(safeBeds / safeCount);
  let remainder = safeBeds % safeCount;
  return Array.from({ length: safeCount }, () => {
    const value = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    return Math.max(value, 1);
  });
};

const normalizeBedsArray = (values, count) => {
  const safeCount = Math.max(0, Number(count || 0));
  return Array.from({ length: safeCount }, (_, index) => Math.max(1, Number(values?.[index] || 1)));
};

const toRoomBedArrays = (roomInventory = [], fallback = initialForm) => {
  const occupied = [];
  const vacant = [];
  (Array.isArray(roomInventory) ? roomInventory : []).forEach((room) => {
    const beds = Array.isArray(room?.beds) ? room.beds : [];
    const occupiedBeds = beds.filter((bed) => String(bed?.status || "").toLowerCase() === "occupied").length;
    const vacantBeds = Math.max(0, beds.length - occupiedBeds);
    if (occupiedBeds > 0) occupied.push(occupiedBeds);
    if (vacantBeds > 0) vacant.push(vacantBeds);
  });
  return {
    occupiedRoomBeds: occupied.length ? occupied : distributeBeds(fallback.occupiedBeds, fallback.occupiedRooms),
    vacantRoomBeds: vacant.length ? vacant : distributeBeds(fallback.vacantBeds, fallback.vacantRooms)
  };
};

export default function PropertyownerOwnerprofile() {
  useHtmlPage({
    title: "Roomhy - Owner Profile",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [owner, setOwner] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }, [owner, form, saving, message]);

  useEffect(() => {
    const session = getOwnerRuntimeSession();
    if (!session?.loginId) {
      window.location.href = "/propertyowner/ownerlogin";
      return;
    }
    setOwner(session);

    const loadOwner = async () => {
      try {
        const data = await fetchJson(`/api/owners/${encodeURIComponent(session.loginId)}`);
        const nextOwner = data && typeof data === "object" ? data : session;
        setOwner((prev) => ({ ...(prev || {}), ...nextOwner }));
        setForm({
          name: nextOwner.name || nextOwner.profile?.name || "",
          email: nextOwner.email || nextOwner.profile?.email || "",
          area: nextOwner.checkinArea || nextOwner.area || nextOwner.locationCode || nextOwner.profile?.locationCode || "",
          dob: nextOwner.checkinDob || "",
          phone: nextOwner.checkinPhone || nextOwner.phone || nextOwner.profile?.phone || "",
          address: nextOwner.checkinAddress || nextOwner.address || nextOwner.profile?.address || "",
          bankName: nextOwner.checkinBankName || nextOwner.bankName || nextOwner.profile?.bankName || "",
          branchName: nextOwner.checkinBranchName || nextOwner.branchName || nextOwner.profile?.branchName || "",
          bankAccountNumber: nextOwner.checkinBankAccountNumber || nextOwner.accountNumber || nextOwner.profile?.accountNumber || "",
          ifscCode: nextOwner.checkinIfscCode || nextOwner.ifscCode || nextOwner.profile?.ifscCode || "",
          accountHolderName: nextOwner.checkinAccountHolderName || nextOwner.profile?.accountHolderName || "",
          upiId: nextOwner.checkinUpiId || nextOwner.profile?.upiId || "",
          vacantRooms: Number(nextOwner.vacantRooms ?? 0),
          vacantBeds: Number(nextOwner.vacantBeds ?? 0),
          occupiedRooms: Number(nextOwner.occupiedRooms ?? 0),
          occupiedBeds: Number(nextOwner.occupiedBeds ?? 0),
          ...toRoomBedArrays(nextOwner.roomInventory, {
            occupiedRooms: Number(nextOwner.occupiedRooms ?? 0),
            occupiedBeds: Number(nextOwner.occupiedBeds ?? 0),
            vacantRooms: Number(nextOwner.vacantRooms ?? 0),
            vacantBeds: Number(nextOwner.vacantBeds ?? 0)
          })
        });
      } catch (_) {}
    };

    loadOwner();
  }, []);

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const updateRoomCount = (key, count) => {
    const safeCount = Math.max(0, Number(count || 0));
    setForm((prev) => {
      const bedsKey = key === "occupiedRooms" ? "occupiedRoomBeds" : "vacantRoomBeds";
      const currentBeds = normalizeBedsArray(prev[bedsKey], safeCount);
      const next = {
        ...prev,
        [key]: safeCount,
        [bedsKey]: currentBeds
      };
      next.occupiedBeds = next.occupiedRoomBeds.reduce((sum, value) => sum + Number(value || 0), 0);
      next.vacantBeds = next.vacantRoomBeds.reduce((sum, value) => sum + Number(value || 0), 0);
      return next;
    });
  };

  const updateRoomBed = (group, index, value) => {
    setForm((prev) => {
      const key = group === "occupied" ? "occupiedRoomBeds" : "vacantRoomBeds";
      const nextBeds = [...prev[key]];
      nextBeds[index] = Math.max(1, Number(value || 1));
      const next = { ...prev, [key]: nextBeds };
      next.occupiedBeds = next.occupiedRoomBeds.reduce((sum, item) => sum + Number(item || 0), 0);
      next.vacantBeds = next.vacantRoomBeds.reduce((sum, item) => sum + Number(item || 0), 0);
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!owner?.loginId) return;
    setSaving(true);
    setMessage("");
    try {
      const occupiedRoomBeds = normalizeBedsArray(form.occupiedRoomBeds, form.occupiedRooms);
      const vacantRoomBeds = normalizeBedsArray(form.vacantRoomBeds, form.vacantRooms);
      const roomInventory = [
        ...occupiedRoomBeds.map((bedCount, index) => ({
          id: `OWNER-OCC-${owner.loginId}-${index + 1}`,
          number: `Occupied Room ${index + 1}`,
          roomNo: `Occupied Room ${index + 1}`,
          title: `Occupied Room ${index + 1}`,
          type: "Occupied",
          roomType: "Occupied",
          gender: "Mixed",
          beds: Array.from({ length: bedCount }, (_, bedIndex) => ({
            status: "occupied",
            tenantId: `OCC-${index + 1}-${bedIndex + 1}`,
            tenantName: "Occupied"
          }))
        })),
        ...vacantRoomBeds.map((bedCount, index) => ({
          id: `OWNER-VAC-${owner.loginId}-${index + 1}`,
          number: `Vacant Room ${index + 1}`,
          roomNo: `Vacant Room ${index + 1}`,
          title: `Vacant Room ${index + 1}`,
          type: "Vacant",
          roomType: "Vacant",
          gender: "Mixed",
          beds: Array.from({ length: bedCount }, () => ({
            status: "available",
            tenantId: "",
            tenantName: ""
          }))
        }))
      ];
      const payload = {
        loginId: owner.loginId,
        name: form.name,
        dob: form.dob,
        email: form.email,
        phone: form.phone,
        address: form.address,
        area: form.area,
        password: owner.checkinPassword || owner.credentials?.password || "",
        vacantRooms: vacantRoomBeds.length,
        vacantBeds: vacantRoomBeds.reduce((sum, value) => sum + Number(value || 0), 0),
        occupiedRooms: occupiedRoomBeds.length,
        occupiedBeds: occupiedRoomBeds.reduce((sum, value) => sum + Number(value || 0), 0),
        roomInventory,
        payment: {
          bankName: form.bankName,
          branchName: form.branchName,
          bankAccountNumber: form.bankAccountNumber,
          ifscCode: form.ifscCode,
          accountHolderName: form.accountHolderName,
          upiId: form.upiId
        }
      };
      await fetchJson("/api/checkin/owner/profile", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setOwner((prev) => ({
        ...(prev || {}),
        ...payload,
        roomCount: payload.vacantRooms + payload.occupiedRooms,
        bedCount: payload.vacantBeds + payload.occupiedBeds,
        roomInventory
      }));
      setMessage("Owner profile saved.");
    } catch (error) {
      setMessage(error?.body || error?.message || "Failed to save owner profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Owner Profile"
      navVariant="default"
      onLogout={() => {
        clearOwnerRuntimeSession();
        window.location.href = "/propertyowner/ownerlogin";
      }}
      contentClassName="max-w-5xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Basic Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border border-gray-300 rounded-lg px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => updateForm({ name: e.target.value })} required />
            <input className="border border-gray-300 rounded-lg px-3 py-2" placeholder="Gmail" type="email" value={form.email} onChange={(e) => updateForm({ email: e.target.value })} required />
            <input className="border border-gray-300 rounded-lg px-3 py-2" placeholder="Area" value={form.area} onChange={(e) => updateForm({ area: e.target.value })} required />
            <input className="border border-gray-300 rounded-lg px-3 py-2" placeholder="DOB" type="date" value={form.dob} onChange={(e) => updateForm({ dob: e.target.value })} required />
            <input className="border border-gray-300 rounded-lg px-3 py-2" placeholder="Phone" value={form.phone} onChange={(e) => updateForm({ phone: e.target.value })} required />
            <input className="border border-gray-300 rounded-lg px-3 py-2" placeholder="Address" value={form.address} onChange={(e) => updateForm({ address: e.target.value })} required />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Occupancy Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <input className="border border-gray-300 rounded-lg px-3 py-2 w-full" placeholder="Occupied Rooms" type="number" min="0" value={form.occupiedRooms} onChange={(e) => updateRoomCount("occupiedRooms", e.target.value)} />
              {form.occupiedRoomBeds.map((beds, index) => (
                <input key={`occupied-${index}`} className="border border-gray-300 rounded-lg px-3 py-2 w-full" placeholder={`Occupied Room ${index + 1} Beds`} type="number" min="1" value={beds} onChange={(e) => updateRoomBed("occupied", index, e.target.value)} />
              ))}
              <div className="text-xs text-slate-500">{`Occupied Beds Total: ${form.occupiedBeds}`}</div>
            </div>
            <div className="space-y-3">
              <input className="border border-gray-300 rounded-lg px-3 py-2 w-full" placeholder="Vacant Rooms" type="number" min="0" value={form.vacantRooms} onChange={(e) => updateRoomCount("vacantRooms", e.target.value)} />
              {form.vacantRoomBeds.map((beds, index) => (
                <input key={`vacant-${index}`} className="border border-gray-300 rounded-lg px-3 py-2 w-full" placeholder={`Vacant Room ${index + 1} Beds`} type="number" min="1" value={beds} onChange={(e) => updateRoomBed("vacant", index, e.target.value)} />
              ))}
              <div className="text-xs text-slate-500">{`Vacant Beds Total: ${form.vacantBeds}`}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border border-gray-300 rounded-lg px-3 py-2" placeholder="Bank Name" value={form.bankName} onChange={(e) => updateForm({ bankName: e.target.value })} required />
            <input className="border border-gray-300 rounded-lg px-3 py-2" placeholder="Branch Name" value={form.branchName} onChange={(e) => updateForm({ branchName: e.target.value })} required />
            <input className="border border-gray-300 rounded-lg px-3 py-2" placeholder="Account Number" value={form.bankAccountNumber} onChange={(e) => updateForm({ bankAccountNumber: e.target.value })} required />
            <input className="border border-gray-300 rounded-lg px-3 py-2" placeholder="IFSC Code" value={form.ifscCode} onChange={(e) => updateForm({ ifscCode: e.target.value })} required />
            <input className="border border-gray-300 rounded-lg px-3 py-2" placeholder="Account Holder Name" value={form.accountHolderName} onChange={(e) => updateForm({ accountHolderName: e.target.value })} required />
            <input className="border border-gray-300 rounded-lg px-3 py-2" placeholder="UPI ID" value={form.upiId} onChange={(e) => updateForm({ upiId: e.target.value })} />
          </div>
        </div>

        {message ? <div className="text-sm text-slate-600">{message}</div> : null}

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-60">
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </PropertyOwnerLayout>
  );
}
