const API_BASES = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? ['http://localhost:5001']
  : ['', 'https://api.roomhy.com'];

const params = new URLSearchParams(location.search);
if (params.get('loginId')) document.getElementById('loginId').value = params.get('loginId');
let lastRefId = '';

function readFileAsData(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl: r.result
    });
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

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

document.getElementById('startDigiLockerBtn').onclick = async () => {
  try {
    const frontFile = document.getElementById('aadhaarFront').files[0];
    const backFile = document.getElementById('aadhaarBack').files[0];
    if (!frontFile || !backFile) return alert('Upload Aadhaar front and back photos');

    const aadhaarNumber = document.getElementById('aadhaarNumber').value.trim().replace(/\D/g, '');
    if (!/^\d{12}$/.test(aadhaarNumber)) return alert('Aadhaar must be 12 digits');

    const data = await post('/api/checkin/tenant/kyc/digilocker/start', {
      loginId: document.getElementById('loginId').value.trim(),
      aadhaarNumber,
      aadhaarLinkedPhone: document.getElementById('aadhaarLinkedPhone').value.trim(),
      aadhaarFront: await readFileAsData(frontFile),
      aadhaarBack: await readFileAsData(backFile)
    });

    lastRefId = data.referenceId || '';
    document.getElementById('digilockerRef').value = lastRefId;
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
  location.href = `tenantagreement.html?loginId=${encodeURIComponent(loginId)}`;
};
