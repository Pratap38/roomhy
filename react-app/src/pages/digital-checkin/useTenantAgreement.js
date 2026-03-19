import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiBases, postExpectSuccess } from "./utils";

export const useTenantAgreement = () => {
  const apiBases = useMemo(() => getApiBases(), []);
  const [loginId, setLoginId] = useState("");
  const [eSignName, setESignName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("loginId")) setLoginId(params.get("loginId"));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!loginId.trim() || !eSignName.trim() || !accepted) {
      alert("Login ID, e-sign and acceptance are required");
      return;
    }

    setSubmitting(true);
    try {
      await postExpectSuccess(
        "/api/checkin/tenant/agreement",
        { loginId: loginId.trim(), eSignName: eSignName.trim(), accepted: true },
        apiBases
      );
      await postExpectSuccess("/api/checkin/tenant/final-submit", { loginId: loginId.trim() }, apiBases);
      window.location.href = `/digital-checkin/tenant-confirmation?loginId=${encodeURIComponent(loginId.trim())}`;
    } catch (err) {
      alert(err.message || "Unable to submit tenant agreement");
    } finally {
      setSubmitting(false);
    }
  }, [accepted, apiBases, eSignName, loginId]);

  return {
    loginId,
    setLoginId,
    eSignName,
    setESignName,
    accepted,
    setAccepted,
    submitting,
    handleSubmit
  };
};

