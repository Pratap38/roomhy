const API_BASES = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? ['http://localhost:5001']
  : ['', 'https://api.roomhy.com'];

const params = new URLSearchParams(location.search);
if (params.get('loginId')) document.getElementById('loginId').value = params.get('loginId');
let lastRefId = '';
const TENANT_KYC_STATE_KEY = 'roomhy_tenant_kyc_state';

async function post(path, payload) {
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

function loadKycState() {
  try {
    const state = JSON.parse(sessionStorage.getItem(TENANT_KYC_STATE_KEY) || '{}');
    if (!state || typeof state !== 'object') return;
    if (!document.getElementById('loginId').value && state.loginId) document.getElementById('loginId').value = state.loginId;
    if (state.aadhaarNumber) document.getElementById('aadhaarNumber').value = state.aadhaarNumber;
    if (state.aadhaarLinkedPhone) document.getElementById('aadhaarLinkedPhone').value = state.aadhaarLinkedPhone;
    // Do not auto-fill stale DigiLocker reference on initial page load.
    // Reference should appear only after Start/Callback in current flow.
    if (state.referenceId) {
      lastRefId = state.referenceId;
    }
  } catch (_) {}
}

function saveKycState(extra = {}) {
  try {
    const state = {
      loginId: document.getElementById('loginId').value.trim(),
      aadhaarNumber: document.getElementById('aadhaarNumber').value.trim().replace(/\D/g, ''),
      aadhaarLinkedPhone: document.getElementById('aadhaarLinkedPhone').value.trim(),
      referenceId: document.getElementById('digilockerRef').value.trim() || lastRefId || '',
      ...extra
    };
    sessionStorage.setItem(TENANT_KYC_STATE_KEY, JSON.stringify(state));
  } catch (_) {}
}

function applyCallbackParams() {
  const callbackParams = new URLSearchParams(window.location.search);
  const referenceFromCallback =
    callbackParams.get('reference_id') ||
    callbackParams.get('ref_id') ||
    callbackParams.get('referenceId') ||
    '';
  if (referenceFromCallback) {
    lastRefId = referenceFromCallback;
    document.getElementById('digilockerRef').value = referenceFromCallback;
    saveKycState({ referenceId: referenceFromCallback });
    document.getElementById('otpMsg').innerText = 'DigiLocker callback received. Click Complete Verification.';
  }
}

loadKycState();
applyCallbackParams();
if (!new URLSearchParams(window.location.search).get('reference_id')
  && !new URLSearchParams(window.location.search).get('ref_id')
  && !new URLSearchParams(window.location.search).get('referenceId')) {
  document.getElementById('digilockerRef').value = '';
}

document.getElementById('startDigiLockerBtn').onclick = async () => {
  try {
    const aadhaarNumber = document.getElementById('aadhaarNumber').value.trim().replace(/\D/g, '');
    if (!/^\d{12}$/.test(aadhaarNumber)) return alert('Aadhaar must be 12 digits');

    const data = await post('/api/checkin/tenant/kyc/digilocker/start', {
      loginId: document.getElementById('loginId').value.trim(),
      aadhaarNumber,
      aadhaarLinkedPhone: document.getElementById('aadhaarLinkedPhone').value.trim(),
      redirectUrl: `${window.location.origin}${window.location.pathname}?loginId=${encodeURIComponent(document.getElementById('loginId').value.trim())}`
    });

    lastRefId = data.referenceId || '';
    // Keep UI field empty on start; use hidden in-memory value for complete call.
    document.getElementById('digilockerRef').value = '';
    saveKycState({ referenceId: lastRefId, verificationId: data.verificationId || '' });
    document.getElementById('otpMsg').innerText = 'DigiLocker verification initiated. Complete it and click Complete Verification.';
    if (data.verifyUrl) window.location.href = data.verifyUrl;
  } catch (err) {
    alert('Error: ' + err.message);
  }
};

document.getElementById('completeDigiLockerBtn').onclick = async () => {
  try {
    const aadhaarNumber = document.getElementById('aadhaarNumber').value.trim().replace(/\D/g, '');
    if (!/^\d{12}$/.test(aadhaarNumber)) return alert('Aadhaar must be 12 digits');
    const referenceId = document.getElementById('digilockerRef').value.trim() || lastRefId;
    if (!referenceId) return alert('DigiLocker reference ID is required');

    const payload = {
      loginId: document.getElementById('loginId').value.trim(),
      aadhaarNumber,
      referenceId
    };
    saveKycState({ referenceId });
    await post('/api/checkin/tenant/kyc/digilocker/complete', payload);

    try {
      const loginId = String(payload.loginId || '').toUpperCase();
      const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
      const idx = tenants.findIndex(t => String(t.loginId || '').toUpperCase() === loginId);
      if (idx > -1) {
        tenants[idx].kycStatus = 'verified';
        tenants[idx].kyc = tenants[idx].kyc || {};
        tenants[idx].kyc.digilockerVerified = true;
        tenants[idx].kyc.digilockerVerifiedAt = new Date().toISOString();
        tenants[idx].kyc.aadhaarNumber = payload.aadhaarNumber || tenants[idx].kyc.aadhaarNumber || '';
        tenants[idx].kyc.aadhar = payload.aadhaarNumber || tenants[idx].kyc.aadhar || '';
        tenants[idx].digitalCheckin = tenants[idx].digitalCheckin || {};
        tenants[idx].digitalCheckin.kyc = {
          ...(tenants[idx].digitalCheckin.kyc || {}),
          digilockerVerified: true,
          digilockerVerifiedAt: new Date().toISOString()
        };
        localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
      }
    } catch (_) {}

    alert('DigiLocker verification completed successfully');
    document.getElementById('nextBtn').style.display = 'inline-block';
  } catch (err) {
    alert('Error: ' + err.message);
  }
};

document.getElementById('nextBtn').onclick = () => {
  const loginId = document.getElementById('loginId').value.trim();
  location.href = `/digital-checkin/tenantagreement?loginId=${encodeURIComponent(loginId)}`;
};
