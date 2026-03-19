import { useCallback, useEffect, useMemo, useState } from "react";
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
  upiId: ""
};

const OWNER_KYC_STATE_KEY = "roomhy_owner_kyc_state";

export const useOwnerProfile = () => {
  const apiBases = useMemo(() => getApiBases(), []);
  const [form, setForm] = useState(emptyForm);
  const [autoInfo, setAutoInfo] = useState({ email: "", area: "", password: "" });
  const [aadhaarLinkedPhone, setAadhaarLinkedPhone] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [digilockerRef, setDigilockerRef] = useState("");
  const [kycStatus, setKycStatus] = useState({ type: "", text: "" });
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [lastRefId, setLastRefId] = useState("");

  const updateForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
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
            referenceId: digilockerRef.trim() || lastRefId || "",
            ...extra
          })
        );
      } catch (_) {}
    },
    [aadhaarLinkedPhone, aadhaarNumber, autoInfo.email, digilockerRef, form.email, form.loginId, lastRefId]
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
      if (state.referenceId) {
        setDigilockerRef(state.referenceId);
        setLastRefId(state.referenceId);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    const referenceFromCallback = getParamValue(["reference_id", "ref_id", "referenceId"]);
    const verificationFromCallback = getParamValue(["verification_id", "verificationId"]);
    if (!referenceFromCallback) return;
    setDigilockerRef(referenceFromCallback);
    setLastRefId(referenceFromCallback);
    saveKycState({ referenceId: referenceFromCallback, verificationId: verificationFromCallback || "" });
    setKycStatus({ type: "success", text: "DigiLocker callback received. Complete verification below." });
  }, [saveKycState]);

  useEffect(() => {
    const hydrateFromOwner = async () => {
      const id = form.loginId.trim();
      if (!id) return;
      try {
        const owner = await getWithFallback(`/api/owners/${encodeURIComponent(id)}`, apiBases);
        if (!owner || typeof owner !== "object") return;

        const setIfEmpty = (key, value) => {
          if (!form[key] && value) updateForm({ [key]: value });
        };

        setIfEmpty("name", owner.name || owner.profile?.name || "");
        setIfEmpty("email", owner.email || owner.profile?.email || owner.checkinEmail || "");
        setIfEmpty("area", owner.checkinArea || owner.locationCode || owner.profile?.locationCode || "");
        setIfEmpty("dob", owner.checkinDob || "");
        setIfEmpty("phone", owner.checkinPhone || owner.phone || owner.profile?.phone || "");
        setIfEmpty("address", owner.checkinAddress || owner.address || owner.profile?.address || "");
        setIfEmpty("bankName", owner.checkinBankName || owner.bankName || owner.profile?.bankName || "");
        setIfEmpty("branchName", owner.checkinBranchName || owner.branchName || owner.profile?.branchName || "");
        setIfEmpty(
          "bankAccountNumber",
          owner.checkinBankAccountNumber || owner.accountNumber || owner.profile?.accountNumber || ""
        );
        setIfEmpty("ifscCode", owner.checkinIfscCode || owner.ifscCode || owner.profile?.ifscCode || "");
        setIfEmpty(
          "accountHolderName",
          owner.checkinAccountHolderName || owner.profile?.accountHolderName || ""
        );
        setIfEmpty("upiId", owner.checkinUpiId || owner.profile?.upiId || "");

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
          setKycStatus({ type: "success", text: "DigiLocker verification already completed." });
        }
      } catch (_) {}
    };

    hydrateFromOwner();
  }, [apiBases, form, updateForm]);

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
      const redirectUrl = `${window.location.origin}${window.location.pathname}?loginId=${encodeURIComponent(trimmedLogin)}${
        emailValue ? `&email=${encodeURIComponent(emailValue)}` : ""
      }`;
      const data = await postExpectSuccess(
        "/api/checkin/owner/kyc/digilocker/start",
        {
          loginId: trimmedLogin,
          aadhaarLinkedPhone: aadhaarLinkedPhone.trim(),
          aadhaarNumber: aadhaarRaw,
          email: emailValue,
          redirectUrl
        },
        apiBases
      );

      const referenceId = data.referenceId || "";
      setLastRefId(referenceId);
      setDigilockerRef(referenceId);
      saveKycState({ referenceId, verificationId: data.verificationId || "" });
      setKycStatus({ type: "success", text: "DigiLocker verification started. Finish auth and return here." });
      if (data.verifyUrl) window.location.href = data.verifyUrl;
    } catch (err) {
      setKycStatus({ type: "error", text: `Error: ${err.message}` });
      setLoadingStart(false);
    }
  }, [aadhaarLinkedPhone, aadhaarNumber, apiBases, autoInfo, form, saveKycState, saveProfile]);

  const handleCompleteVerification = useCallback(async () => {
    const trimmedLogin = form.loginId.trim();
    const aadhaarRaw = aadhaarNumber.trim().replace(/\s/g, "");
    const referenceId = digilockerRef.trim() || lastRefId;

    if (!trimmedLogin) return alert("Login ID is required");
    if (!/^\d{12}$/.test(aadhaarRaw)) return alert("Aadhaar must be 12 digits");
    if (!referenceId) return alert("DigiLocker reference ID is required");

    try {
      setLoadingComplete(true);
      const payload = await saveProfile(form, autoInfo);
      saveKycState({ referenceId });
      await postExpectSuccess(
        "/api/checkin/owner/kyc/digilocker/complete",
        { loginId: trimmedLogin, aadhaarNumber: aadhaarRaw, referenceId },
        apiBases
      );
      window.location.href = `/digital-checkin/ownerterms?loginId=${encodeURIComponent(payload.loginId)}&email=${encodeURIComponent(
        payload.email
      )}`;
    } catch (err) {
      setKycStatus({ type: "error", text: `Error: ${err.message}` });
      setLoadingComplete(false);
    }
  }, [aadhaarNumber, apiBases, autoInfo, digilockerRef, form, lastRefId, saveKycState, saveProfile]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      try {
        await saveProfile(form, autoInfo);
        setKycStatus({
          type: "success",
          text: "Profile saved. Complete DigiLocker verification below to continue."
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
    autoInfo,
    showAutoInfo,
    aadhaarLinkedPhone,
    setAadhaarLinkedPhone,
    aadhaarNumber,
    handleAadhaarChange,
    digilockerRef,
    setDigilockerRef,
    kycStatus,
    loadingStart,
    loadingComplete,
    handleStartVerification,
    handleCompleteVerification,
    handleSubmit
  };
};
