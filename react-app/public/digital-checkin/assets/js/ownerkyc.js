const API_BASES = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? ['http://localhost:5001']
  : ['', 'https://api.roomhy.com'];

const params = new URLSearchParams(location.search);
const hashQuery = location.hash && location.hash.includes('?')
  ? new URLSearchParams(location.hash.split('?')[1])
  : new URLSearchParams('');

function getParamValue(names) {
  const allEntries = [...params.entries(), ...hashQuery.entries()];
  for (const key of names) {
    const direct = params.get(key) || hashQuery.get(key);
    if (direct) return direct.trim();
    const ciMatch = allEntries.find(([k, v]) => k.toLowerCase() === key.toLowerCase() && v);
    if (ciMatch && ciMatch[1]) return ciMatch[1].trim();
  }
  return '';
}

const loginIdFromQuery = getParamValue(['loginId', 'loginid', 'staffId']);
if (loginIdFromQuery) document.getElementById('loginId').value = loginIdFromQuery;
let ownerEmail = getParamValue(['email', 'ownerEmail', 'mail']);
let lastRefId = '';
const OWNER_KYC_STATE_KEY = 'roomhy_owner_kyc_state';

if (ownerEmail) {
  document.getElementById('emailInfo').style.display = 'block';
  document.getElementById('displayEmail').textContent = ownerEmail;
}

function loadKycState() {
  try {
    const state = JSON.parse(sessionStorage.getItem(OWNER_KYC_STATE_KEY) || '{}');
    if (!state || typeof state !== 'object') return;
    if (!document.getElementById('loginId').value && state.loginId) document.getElementById('loginId').value = state.loginId;
    if (state.aadhaarLinkedPhone) document.getElementById('aadhaarLinkedPhone').value = state.aadhaarLinkedPhone;
    if (state.aadhaarNumber) document.getElementById('aadhaarNumber').value = state.aadhaarNumber;
    if (state.referenceId) {
      document.getElementById('digilockerRef').value = state.referenceId;
      lastRefId = state.referenceId;
    }
    if (!ownerEmail && state.ownerEmail) {
      ownerEmail = state.ownerEmail;
      document.getElementById('emailInfo').style.display = 'block';
      document.getElementById('displayEmail').textContent = ownerEmail;
    }
  } catch (_) {}
}

function saveKycState(extra = {}) {
  try {
    const payload = {
      loginId: document.getElementById('loginId').value.trim(),
      aadhaarLinkedPhone: document.getElementById('aadhaarLinkedPhone').value.trim(),
      aadhaarNumber: document.getElementById('aadhaarNumber').value.trim(),
      ownerEmail,
      referenceId: document.getElementById('digilockerRef').value.trim() || lastRefId || '',
      ...extra
    };
    sessionStorage.setItem(OWNER_KYC_STATE_KEY, JSON.stringify(payload));
  } catch (_) {}
}

function applyCallbackParams() {
  const referenceFromCallback = getParamValue(['reference_id', 'ref_id', 'referenceId']);
  const verificationFromCallback = getParamValue(['verification_id', 'verificationId']);
  if (referenceFromCallback) {
    document.getElementById('digilockerRef').value = referenceFromCallback;
    lastRefId = referenceFromCallback;
    saveKycState({ referenceId: referenceFromCallback, verificationId: verificationFromCallback || '' });
    document.getElementById('otpMsg').innerHTML = '<span class="success">DigiLocker callback received. Click Complete Verification.</span>';
  }
}

document.getElementById('aadhaarNumber').addEventListener('input', (e) => {
  let val = e.target.value.replace(/\D/g, '');
  if (val.length > 12) val = val.substring(0, 12);
  if (val.length > 8) val = `${val.substring(0, 4)} ${val.substring(4, 8)} ${val.substring(8)}`;
  else if (val.length > 4) val = `${val.substring(0, 4)} ${val.substring(4)}`;
  e.target.value = val;
});

async function postWithFallback(path, payload) {
  let lastErr = null;
  for (const base of API_BASES) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) return data;
      lastErr = new Error(data.message || `HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Request failed');
}

async function getWithFallback(path) {
  let lastErr = null;
  for (const base of API_BASES) {
    try {
      const res = await fetch(`${base}${path}`);
      if (res.ok) return res.json();
      const data = await res.json().catch(() => ({}));
      lastErr = new Error(data.message || `HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Request failed');
}

async function hydrateOwnerEmail() {
  const loginId = document.getElementById('loginId').value.trim();
  if (!loginId || ownerEmail) return;
  try {
    const owner = await getWithFallback(`/api/owners/${encodeURIComponent(loginId)}`);
    ownerEmail = (owner?.email || owner?.profile?.email || owner?.checkinEmail || '').trim();
    if (ownerEmail) {
      document.getElementById('emailInfo').style.display = 'block';
      document.getElementById('displayEmail').textContent = ownerEmail;
    }
  } catch (_) {}
}

hydrateOwnerEmail();
loadKycState();
applyCallbackParams();

document.getElementById('startDigiLockerBtn').onclick = async () => {
  const loginId = document.getElementById('loginId').value.trim();
  const aadhaarLinkedPhone = document.getElementById('aadhaarLinkedPhone').value.trim();
  const aadhaarNumber = document.getElementById('aadhaarNumber').value.trim().replace(/\s/g, '');
  if (!loginId) return alert('Login ID is missing. Please check the URL.');
  if (!/^\d{12}$/.test(aadhaarNumber)) return alert('Aadhaar must be 12 digits');

  try {
    document.getElementById('startDigiLockerBtn').disabled = true;
    const data = await postWithFallback('/api/checkin/owner/kyc/digilocker/start', {
      loginId,
      aadhaarLinkedPhone,
      aadhaarNumber,
      email: ownerEmail,
      redirectUrl: `${window.location.origin}${window.location.pathname}?loginId=${encodeURIComponent(loginId)}${ownerEmail ? `&email=${encodeURIComponent(ownerEmail)}` : ''}`
    });
    lastRefId = data.referenceId || '';
    document.getElementById('digilockerRef').value = lastRefId;
    saveKycState({ referenceId: lastRefId, verificationId: data.verificationId || '' });
    document.getElementById('otpMsg').innerHTML = '<span class="success">DigiLocker verification initiated. Complete it and click Complete Verification.</span>';
    if (data.verifyUrl) {
      window.location.href = data.verifyUrl;
    }
  } catch (err) {
    document.getElementById('otpMsg').innerHTML = `<span class="error">Error: ${err.message}</span>`;
    document.getElementById('startDigiLockerBtn').disabled = false;
  }
};

document.getElementById('completeDigiLockerBtn').onclick = async () => {
  const loginId = document.getElementById('loginId').value.trim();
  const aadhaarNumber = document.getElementById('aadhaarNumber').value.trim().replace(/\s/g, '');
  const referenceId = document.getElementById('digilockerRef').value.trim() || lastRefId;
  if (!loginId) return alert('Login ID is missing');
  if (!/^\d{12}$/.test(aadhaarNumber)) return alert('Aadhaar must be 12 digits');
  if (!referenceId) return alert('DigiLocker reference ID is required');

  try {
    saveKycState({ referenceId });
    document.getElementById('completeDigiLockerBtn').disabled = true;
    await postWithFallback('/api/checkin/owner/kyc/digilocker/complete', {
      loginId,
      aadhaarNumber,
      referenceId
    });
    document.getElementById('otpMsg').innerHTML = '<span class="success">DigiLocker verification completed successfully.</span>';
    document.getElementById('nextBtn').style.display = 'inline-block';
  } catch (err) {
    document.getElementById('otpMsg').innerHTML = `<span class="error">Error: ${err.message}</span>`;
    document.getElementById('completeDigiLockerBtn').disabled = false;
  }
};

document.getElementById('nextBtn').onclick = () => {
  const loginId = document.getElementById('loginId').value.trim();
  const emailPart = ownerEmail ? `&email=${encodeURIComponent(ownerEmail)}` : '';
  location.href = `/digital-checkin/ownerterms?loginId=${encodeURIComponent(loginId)}${emailPart}`;
};
