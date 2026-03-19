import { useCallback, useEffect, useMemo, useState } from "react";
import { cleanPropertyName, isLocalHost } from "./utils";

const emptyForm = {
  loginId: "",
  name: "",
  propertyName: "",
  roomNo: "",
  agreedRent: "",
  dob: "",
  guardianNumber: "",
  moveInDate: "",
  email: ""
};

export const useTenantProfile = () => {
  const apiBase = useMemo(
    () => (isLocalHost() ? "http://localhost:5001" : "https://api.roomhy.com"),
    []
  );
  const [form, setForm] = useState(emptyForm);

  const updateForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loginId = params.get("loginId");
    if (loginId) {
      updateForm({ loginId: loginId.toUpperCase() });
    }
  }, [updateForm]);

  useEffect(() => {
    const prefillTenantData = async () => {
      const loginId = (form.loginId || "").trim().toUpperCase();
      if (!loginId) return;
      let tenant = null;

      try {
        const cached = JSON.parse(localStorage.getItem("roomhy_tenants") || "[]");
        tenant = cached.find((t) => String(t.loginId || "").toUpperCase() === loginId) || null;
      } catch (_) {}

      if (!tenant) {
        try {
          const res = await fetch(`${apiBase}/api/tenants`);
          const data = await res.json().catch(() => ({}));
          const list = Array.isArray(data) ? data : Array.isArray(data.tenants) ? data.tenants : [];
          tenant = list.find((t) => String(t.loginId || "").toUpperCase() === loginId) || null;
        } catch (_) {}
      }

      if (!tenant) return;

      updateForm({
        name: tenant.name || "",
        email: tenant.email || "",
        moveInDate: tenant.moveInDate ? String(tenant.moveInDate).slice(0, 10) : "",
        guardianNumber: tenant.guardianNumber || tenant.emergencyContact || "",
        dob: tenant.dob || ""
      });

      const rawPropertyName =
        tenant.property && typeof tenant.property === "object"
          ? tenant.propertyTitle || tenant.propertyName || tenant.property.title || tenant.property.name || ""
          : tenant.propertyTitle || tenant.propertyName || tenant.property || "";
      let propertyName = cleanPropertyName(rawPropertyName);

      if (!propertyName && tenant.propertyId) {
        try {
          const props = JSON.parse(localStorage.getItem("roomhy_properties") || "[]");
          const match = props.find(
            (p) => String(p._id || p.id || p.propertyId || "") === String(tenant.propertyId)
          );
          propertyName = cleanPropertyName(match && (match.title || match.name || match.propertyName));
        } catch (_) {}
      }

      if (!propertyName && tenant.propertyId) {
        try {
          const res = await fetch(`${apiBase}/api/properties`);
          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            const list = Array.isArray(data?.properties) ? data.properties : [];
            const match = list.find(
              (p) => String(p._id || p.id || p.propertyId || "") === String(tenant.propertyId)
            );
            propertyName = cleanPropertyName(match && (match.title || match.name || match.propertyName));
          }
        } catch (_) {}
      }

      updateForm({
        propertyName: propertyName || "",
        roomNo: tenant.roomNo || "",
        agreedRent: tenant.agreedRent ? `INR ${tenant.agreedRent}` : ""
      });
    };

    prefillTenantData();
  }, [apiBase, form.loginId, updateForm]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const rentRaw = (form.agreedRent || "").replace(/[^\d.]/g, "");
      const payload = {
        loginId: form.loginId.trim().toUpperCase(),
        name: form.name.trim(),
        propertyName: form.propertyName.trim(),
        roomNo: form.roomNo.trim(),
        agreedRent: rentRaw ? Number(rentRaw) : null,
        dob: form.dob,
        guardianNumber: form.guardianNumber.trim(),
        moveInDate: form.moveInDate,
        email: form.email.trim()
      };

      const res = await fetch(`${apiBase}/api/checkin/tenant/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) return alert(data.message || "Failed to save profile");

      try {
        const list = JSON.parse(localStorage.getItem("roomhy_tenants") || "[]");
        const idx = list.findIndex((t) => String(t.loginId || "").toUpperCase() === payload.loginId);
        if (idx > -1) {
          list[idx].name = payload.name;
          list[idx].email = payload.email || list[idx].email;
          list[idx].dob = payload.dob;
          list[idx].guardianNumber = payload.guardianNumber;
          list[idx].moveInDate = payload.moveInDate;
          list[idx].propertyTitle = payload.propertyName || list[idx].propertyTitle;
          list[idx].roomNo = payload.roomNo || list[idx].roomNo;
          if (payload.agreedRent !== null) list[idx].agreedRent = payload.agreedRent;
          localStorage.setItem("roomhy_tenants", JSON.stringify(list));
        }
      } catch (_) {}

      window.location.href = `/digital-checkin/tenantkyc?loginId=${encodeURIComponent(payload.loginId)}`;
    },
    [apiBase, form]
  );

  return { form, updateForm, handleSubmit };
};

