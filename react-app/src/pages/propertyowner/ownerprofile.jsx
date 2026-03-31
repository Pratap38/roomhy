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
  occupiedBeds: 0
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
          occupiedBeds: Number(nextOwner.occupiedBeds ?? 0)
        });
      } catch (_) {}
    };

    loadOwner();
  }, []);

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!owner?.loginId) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        loginId: owner.loginId,
        name: form.name,
        dob: form.dob,
        email: form.email,
        phone: form.phone,
        address: form.address,
        area: form.area,
        password: owner.checkinPassword || owner.credentials?.password || "",
        vacantRooms: Number(form.vacantRooms || 0),
        vacantBeds: Number(form.vacantBeds || 0),
        occupiedRooms: Number(form.occupiedRooms || 0),
        occupiedBeds: Number(form.occupiedBeds || 0),
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
        bedCount: payload.vacantBeds + payload.occupiedBeds
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border border-gray-300 rounded-lg px-3 py-2" placeholder="Occupied Rooms" type="number" min="0" value={form.occupiedRooms} onChange={(e) => updateForm({ occupiedRooms: e.target.value })} />
            <input className="border border-gray-300 rounded-lg px-3 py-2" placeholder="Beds In Occupied Rooms" type="number" min="0" value={form.occupiedBeds} onChange={(e) => updateForm({ occupiedBeds: e.target.value })} />
            <input className="border border-gray-300 rounded-lg px-3 py-2" placeholder="Vacant Rooms" type="number" min="0" value={form.vacantRooms} onChange={(e) => updateForm({ vacantRooms: e.target.value })} />
            <input className="border border-gray-300 rounded-lg px-3 py-2" placeholder="Beds In Vacant Rooms" type="number" min="0" value={form.vacantBeds} onChange={(e) => updateForm({ vacantBeds: e.target.value })} />
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
