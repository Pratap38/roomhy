import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatAadhaarWithSpaces,
  getApiBases,
  getParamValue,
  getWithFallback,
  postExpectSuccess,
  postWithFallback
} from "./utils";

const emptyForm = {
  loginId: "",
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

const OWNER_KYC_STATE_KEY = "roomhy_owner_kyc_state";

const distributeBeds = (totalBeds, roomCount) => {
  const safeRoomCount = Math.max(0, Number(roomCount || 0));
  if (safeRoomCount <= 0) return [];
  const safeBeds = Math.max(0, Number(totalBeds || 0));
  const base = Math.floor(safeBeds / safeRoomCount);
  let remainder = safeBeds % safeRoomCount;
  return Array.from({ length: safeRoomCount }, () => {
    const next = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    return Math.max(1, next);
  });
};

const normalizeBedsArray = (values, count) =>
  Array.from({ length: Math.max(0, Number(count || 0)) }, (_, index) => Math.max(1, Number(values?.[index] || 1)));

const toRoomBedArrays = (roomInventory = [], fallback = emptyForm) => {
  const occupiedRoomBeds = [];
  const vacantRoomBeds = [];

  (Array.isArray(roomInventory) ? roomInventory : []).forEach((room) => {
    const beds = Array.isArray(room?.beds) ? room.beds : [];
    const occupiedBeds = beds.filter((bed) => String(bed?.status || "").toLowerCase() === "occupied").length;
    const vacantBeds = Math.max(0, beds.length - occupiedBeds);

    if (occupiedBeds > 0) occupiedRoomBeds.push(occupiedBeds);
    if (vacantBeds > 0) vacantRoomBeds.push(vacantBeds);
  });

  return {
    occupiedRoomBeds: occupiedRoomBeds.length
      ? occupiedRoomBeds
      : distributeBeds(fallback.occupiedBeds, fallback.occupiedRooms),
    vacantRoomBeds: vacantRoomBeds.length
      ? vacantRoomBeds
      : distributeBeds(fallback.vacantBeds, fallback.vacantRooms)
  };
};

export const useOwnerProfile = () => {
  const apiBases = useMemo(() => getApiBases(), []);
  const hydratedLoginRef = useRef("");
  const [form, setForm] = useState(emptyForm);
  const [autoInfo, setAutoInfo] = useState({ email: "", area: "", password: "" });
  const [aadhaarLinkedPhone, setAadhaarLinkedPhone] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [kycStatus, setKycStatus] = useState({ type: "", text: "" });
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const updateForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateRoomCount = useCallback((key, value) => {
    const safeCount = Math.max(0, Number(value || 0));
    setForm((prev) => {
      const bedsKey = key === "occupiedRooms" ? "occupiedRoomBeds" : "vacantRoomBeds";
      const nextBeds = normalizeBedsArray(prev[bedsKey], safeCount);
      const next = {
        ...prev,
        [key]: safeCount,
        [bedsKey]: nextBeds
      };
      next.occupiedBeds = next.occupiedRoomBeds.reduce((sum, item) => sum + Number(item || 0), 0);
      next.vacantBeds = next.vacantRoomBeds.reduce((sum, item) => sum + Number(item || 0), 0);
      return next;
    });
  }, []);

  const updateRoomBed = useCallback((group, index, value) => {
    setForm((prev) => {
      const key = group === "occupied" ? "occupiedRoomBeds" : "vacantRoomBeds";
      const nextBeds = [...prev[key]];
      nextBeds[index] = Math.max(1, Number(value || 1));
      const next = { ...prev, [key]: nextBeds };
      next.occupiedBeds = next.occupiedRoomBeds.reduce((sum, item) => sum + Number(item || 0), 0);
      next.vacantBeds = next.vacantRoomBeds.reduce((sum, item) => sum + Number(item || 0), 0);
      return next;
    });
  }, []);

  const saveProfile = useCallback(
    async (formValue, autoInfoValue) => {
      const loginIdValue = formValue.loginId.trim();
      const emailValue = autoInfoValue.email || formValue.email.trim();
      const areaValue = autoInfoValue.area || formValue.area.trim();
      const passwordValue = autoInfoValue.password || "";

      if (!loginIdValue) throw new Error("Login ID is required");
      if (!emailValue) throw new Error("Email is required");
      if (!areaValue) throw new Error("Area is required");

      const payload = {
        loginId: loginIdValue,
        name: formValue.name.trim(),
        dob: formValue.dob,
        email: emailValue,
        phone: formValue.phone.trim(),
        address: formValue.address.trim(),
        area: areaValue,
        password: passwordValue,
        occupiedRooms: normalizeBedsArray(formValue.occupiedRoomBeds, formValue.occupiedRooms).length,
        occupiedBeds: normalizeBedsArray(formValue.occupiedRoomBeds, formValue.occupiedRooms).reduce((sum, value) => sum + Number(value || 0), 0),
        vacantRooms: normalizeBedsArray(formValue.vacantRoomBeds, formValue.vacantRooms).length,
        vacantBeds: normalizeBedsArray(formValue.vacantRoomBeds, formValue.vacantRooms).reduce((sum, value) => sum + Number(value || 0), 0),
        roomInventory: [
          ...normalizeBedsArray(formValue.occupiedRoomBeds, formValue.occupiedRooms).map((bedCount, index) => ({
            id: `OWNER-OCC-${loginIdValue}-${index + 1}`,
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
          ...normalizeBedsArray(formValue.vacantRoomBeds, formValue.vacantRooms).map((bedCount, index) => ({
            id: `OWNER-VAC-${loginIdValue}-${index + 1}`,
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
        ],
        payment: {
          bankName: formValue.bankName.trim(),
          branchName: formValue.branchName.trim(),
          bankAccountNumber: formValue.bankAccountNumber.trim(),
          ifscCode: formValue.ifscCode.trim(),
          accountHolderName: formValue.accountHolderName.trim(),
          upiId: formValue.upiId.trim()
        }
      };

      const data = await postWithFallback("/api/checkin/owner/profile", payload, apiBases);
      if (!data.success) throw new Error(data.message || "Failed to save profile");
      return payload;
    },
    [apiBases]
  );

  const saveKycState = useCallback(
    (extra = {}) => {
      try {
        sessionStorage.setItem(
          OWNER_KYC_STATE_KEY,
          JSON.stringify({
            loginId: form.loginId.trim(),
            ownerEmail: autoInfo.email || form.email.trim(),
            aadhaarLinkedPhone: aadhaarLinkedPhone.trim(),
            aadhaarNumber: aadhaarNumber.trim().replace(/\D/g, ""),
            otpSent,
            ...extra
          })
        );
      } catch (_) {}
    },
    [aadhaarLinkedPhone, aadhaarNumber, autoInfo.email, form.email, form.loginId, otpSent]
  );

  useEffect(() => {
    const loginId = getParamValue(["loginId", "loginid", "staffId"]);
    const email = getParamValue(["email", "ownerEmail", "mail"]);
    const area = getParamValue(["area", "assignedArea", "location"]);
    const password = getParamValue(["password", "tempPassword", "pass"]);

    if (loginId) updateForm({ loginId });
    if (email || area) updateForm({ email, area });
    if (email || area || password) setAutoInfo({ email, area, password });
  }, [updateForm]);

  useEffect(() => {
    try {
      const state = JSON.parse(sessionStorage.getItem(OWNER_KYC_STATE_KEY) || "{}");
      if (!state || typeof state !== "object") return;
      if (state.aadhaarLinkedPhone) setAadhaarLinkedPhone(state.aadhaarLinkedPhone);
      if (state.aadhaarNumber) setAadhaarNumber(formatAadhaarWithSpaces(state.aadhaarNumber));
      if (state.otpSent) setOtpSent(true);
    } catch (_) {}
  }, []);

  useEffect(() => {
    const hydrateFromOwner = async () => {
      const id = form.loginId.trim();
      if (!id || hydratedLoginRef.current === id) return;
      hydratedLoginRef.current = id;
      try {
        const owner = await getWithFallback(`/api/owners/${encodeURIComponent(id)}`, apiBases);
        if (!owner || typeof owner !== "object") return;

        setForm((prev) => {
          const nextOccupiedRooms = Number(owner.occupiedRooms ?? prev.occupiedRooms ?? 0);
          const nextOccupiedBeds = Number(owner.occupiedBeds ?? prev.occupiedBeds ?? 0);
          const nextVacantRooms = Number(owner.vacantRooms ?? prev.vacantRooms ?? 0);
          const nextVacantBeds = Number(owner.vacantBeds ?? prev.vacantBeds ?? 0);

          return {
            ...prev,
            name: prev.name || owner.name || owner.profile?.name || "",
            email: prev.email || owner.email || owner.profile?.email || owner.checkinEmail || "",
            area: prev.area || owner.checkinArea || owner.locationCode || owner.profile?.locationCode || "",
            dob: prev.dob || owner.checkinDob || "",
            phone: prev.phone || owner.checkinPhone || owner.phone || owner.profile?.phone || "",
            address: prev.address || owner.checkinAddress || owner.address || owner.profile?.address || "",
            bankName: prev.bankName || owner.checkinBankName || owner.bankName || owner.profile?.bankName || "",
            branchName:
              prev.branchName || owner.checkinBranchName || owner.branchName || owner.profile?.branchName || "",
            bankAccountNumber:
              prev.bankAccountNumber ||
              owner.checkinBankAccountNumber ||
              owner.accountNumber ||
              owner.profile?.accountNumber ||
              "",
            ifscCode: prev.ifscCode || owner.checkinIfscCode || owner.ifscCode || owner.profile?.ifscCode || "",
            accountHolderName:
              prev.accountHolderName || owner.checkinAccountHolderName || owner.profile?.accountHolderName || "",
            upiId: prev.upiId || owner.checkinUpiId || owner.profile?.upiId || "",
            vacantRooms: nextVacantRooms,
            vacantBeds: nextVacantBeds,
            occupiedRooms: nextOccupiedRooms,
            occupiedBeds: nextOccupiedBeds,
            ...toRoomBedArrays(owner.roomInventory, {
              occupiedRooms: nextOccupiedRooms,
              occupiedBeds: nextOccupiedBeds,
              vacantRooms: nextVacantRooms,
              vacantBeds: nextVacantBeds
            })
          };
        });

        setAutoInfo((prev) => ({
          email: prev.email || owner.email || owner.profile?.email || owner.checkinEmail || "",
          area: prev.area || owner.checkinArea || owner.locationCode || owner.profile?.locationCode || "",
          password: prev.password || owner.checkinPassword || owner.credentials?.password || ""
        }));

        const storedAadhaar =
          owner.checkinAadhaarNumber || owner.kyc?.aadharNumber || owner.kyc?.aadhaarNumber || "";
        const storedPhone = owner.checkinAadhaarLinkedPhone || owner.kyc?.aadhaarLinkedPhone || "";
        if (storedAadhaar) setAadhaarNumber((prev) => prev || formatAadhaarWithSpaces(storedAadhaar));
        if (storedPhone) setAadhaarLinkedPhone((prev) => prev || storedPhone);
        if (owner.kyc?.status === "submitted") {
          setKycStatus({ type: "success", text: "Aadhaar OTP verification already completed." });
        }
      } catch (_) {}
    };

    hydrateFromOwner();
  }, [apiBases, form.loginId]);

  const showAutoInfo = Boolean(autoInfo.email || autoInfo.area || autoInfo.password);

  const handleAadhaarChange = useCallback((value) => {
    setAadhaarNumber(formatAadhaarWithSpaces(value));
  }, []);

  const handleStartVerification = useCallback(async () => {
    const trimmedLogin = form.loginId.trim();
    const aadhaarRaw = aadhaarNumber.trim().replace(/\s/g, "");
    if (!trimmedLogin) return alert("Login ID is required");
    if (!/^\d{12}$/.test(aadhaarRaw)) return alert("Aadhaar must be 12 digits");

    try {
      await saveProfile(form, autoInfo);
      setLoadingStart(true);
      const emailValue = autoInfo.email || form.email.trim();
      const data = await postExpectSuccess(
        "/api/checkin/owner/kyc/send-otp",
        {
          loginId: trimmedLogin,
          aadhaarLinkedPhone: aadhaarLinkedPhone.trim(),
          aadhaarNumber: aadhaarRaw,
          email: emailValue
        },
        apiBases
      );
      setOtpSent(true);
      saveKycState({ otpSent: true });
      setKycStatus({
        type: "success",
        text: data?.mockOtp
          ? `OTP sent. Sandbox mock OTP: ${data.mockOtp}`
          : "OTP sent to Aadhaar-linked mobile. Enter OTP and complete verification."
      });
      setLoadingStart(false);
    } catch (err) {
      setKycStatus({ type: "error", text: `Error: ${err.message}` });
      setLoadingStart(false);
    }
  }, [aadhaarLinkedPhone, aadhaarNumber, apiBases, autoInfo, form, saveKycState, saveProfile]);

  const handleCompleteVerification = useCallback(async () => {
    const trimmedLogin = form.loginId.trim();
    const aadhaarRaw = aadhaarNumber.trim().replace(/\s/g, "");

    if (!trimmedLogin) return alert("Login ID is required");
    if (!/^\d{12}$/.test(aadhaarRaw)) return alert("Aadhaar must be 12 digits");
    if (!otp.trim()) return alert("OTP is required");

    try {
      setLoadingComplete(true);
      const payload = await saveProfile(form, autoInfo);
      saveKycState({ otpSent: true });
      await postExpectSuccess(
        "/api/checkin/owner/kyc/verify-otp",
        { loginId: trimmedLogin, aadhaarNumber: aadhaarRaw, otp: otp.trim() },
        apiBases
      );
      window.location.href = `/digital-checkin/ownerterms?loginId=${encodeURIComponent(payload.loginId)}&email=${encodeURIComponent(
        payload.email
      )}`;
    } catch (err) {
      setKycStatus({ type: "error", text: `Error: ${err.message}` });
      setLoadingComplete(false);
    }
  }, [aadhaarNumber, apiBases, autoInfo, form, otp, saveKycState, saveProfile]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      try {
        await saveProfile(form, autoInfo);
        setKycStatus({
          type: "success",
          text: "Profile saved. Send OTP and complete Aadhaar verification below to continue."
        });
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    },
    [autoInfo, form, saveProfile]
  );

  return {
    form,
    updateForm,
    updateRoomCount,
    updateRoomBed,
    autoInfo,
    showAutoInfo,
    aadhaarLinkedPhone,
    setAadhaarLinkedPhone,
    aadhaarNumber,
    handleAadhaarChange,
    otp,
    setOtp,
    otpSent,
    kycStatus,
    loadingStart,
    loadingComplete,
    handleStartVerification,
    handleCompleteVerification,
    handleSubmit
  };
};
