const API_BASES = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? ['http://localhost:5001', 'http://localhost:5001']
      : ['https://api.roomhy.com'];
    const query = new URLSearchParams(location.search);
    const loginId = query.get('loginId') || '';
    const queryEmail = query.get('email') || '';

    async function postWithFallback(path, payload) {
      let lastErr = null;
      for (const base of API_BASES) {
        try {
          const res = await fetch(`${base}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) return res.json();
          const data = await res.json().catch(() => ({}));
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

    function setText(id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value || '-';
    }

    function showFinalConfirmation(dashboardUrl) {
      const wrap = document.querySelector('.wrap');
      if (!wrap) return;
      wrap.innerHTML = `
        <div style="position:relative;overflow:hidden;border-radius:18px;background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 55%,#22c55e 120%);padding:28px;color:#fff;box-shadow:0 18px 40px rgba(15,23,42,.25);">
          <div style="position:absolute;top:-80px;right:-60px;width:220px;height:220px;border-radius:9999px;background:rgba(255,255,255,.15);"></div>
          <div style="position:absolute;bottom:-90px;left:-70px;width:240px;height:240px;border-radius:9999px;background:rgba(255,255,255,.1);"></div>
          <div style="position:relative;z-index:2;">
            <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.18);padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.03em;">CHECK-IN COMPLETED</div>
            <h1 style="margin:14px 0 8px;font-size:34px;line-height:1.1;font-weight:800;">Welcome to RoomHy</h1>
            <p style="margin:0 0 14px;font-size:16px;color:#dbeafe;max-width:620px;">All login credentials have been sent to your Gmail account.</p>
            <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;">
              <div style="background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);padding:10px 14px;border-radius:10px;font-size:13px;">
                <strong style="color:#e2e8f0;">Login ID:</strong> <span style="font-family:monospace;">${loginId || '-'}</span>
              </div>
            </div>
            <div style="margin-top:18px;display:flex;flex-wrap:wrap;gap:10px;">
              <button type="button" onclick="location.reload()" style="background:#fff;color:#1e3a8a;border:0;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;">Back to Summary</button>
              ${dashboardUrl ? `<a href="${dashboardUrl}" style="display:inline-block;background:#22c55e;color:#052e16;text-decoration:none;border-radius:10px;padding:10px 16px;font-weight:700;">Open Owner Dashboard</a>` : ''}
            </div>
          </div>
        </div>
      `;
    }

    function maskAadhaar(aadhaar) {
      const clean = String(aadhaar || '').replace(/\D/g, '');
      if (clean.length !== 12) return aadhaar || '-';
      return `XXXX XXXX ${clean.slice(-4)}`;
    }

    async function loadOwnerDetails() {
      if (!loginId) {
        setText('loadStatus', 'Missing loginId in URL.');
        return;
      }
      try {
        const [checkinResp, ownerResp] = await Promise.all([
          getWithFallback(`/api/checkin/owner/${encodeURIComponent(loginId)}`),
          getWithFallback(`/api/owners/${encodeURIComponent(loginId)}`)
        ]);

        const record = checkinResp && checkinResp.record ? checkinResp.record : {};
        const owner = ownerResp || {};
        const profile = record.ownerProfile || {};
        const kyc = record.ownerKyc || {};

        const email = owner.email || profile.email || queryEmail || '';
        const area = owner.checkinArea || owner.locationCode || profile.area || '';

        setText('dLoginId', loginId);
        setText('dName', owner.name || profile.name || '-');
        setText('dEmail', email || '-');
        setText('dPhone', owner.checkinPhone || owner.phone || profile.phone || '-');
        setText('dArea', area || '-');
        setText('dAddress', owner.checkinAddress || owner.address || profile.address || '-');
        setText('dKycPhone', owner.checkinAadhaarLinkedPhone || kyc.aadhaarLinkedPhone || '-');
        setText('dAadhaar', maskAadhaar(owner.checkinAadhaarNumber || kyc.aadhaarNumber || ''));
        setText('dOtpVerified', (kyc.otpVerified || kyc.digilockerVerified || (owner.kyc && owner.kyc.status === 'submitted')) ? 'Yes' : 'No');
        setText('dTermsAccepted', record.ownerTermsAcceptedAt ? 'Yes' : 'No');
        setText('loadStatus', 'Details loaded. Please verify and edit if needed.');

        document.getElementById('editProfileBtn').onclick = () => {
          const areaPart = area ? `&area=${encodeURIComponent(area)}` : '';
          const emailPart = email ? `&email=${encodeURIComponent(email)}` : '';
          location.href = `/digital-checkin/ownerprofile?loginId=${encodeURIComponent(loginId)}${emailPart}${areaPart}`;
        };

        document.getElementById('editKycBtn').onclick = () => {
          const emailPart = email ? `&email=${encodeURIComponent(email)}` : '';
          location.href = `/digital-checkin/ownerkyc?loginId=${encodeURIComponent(loginId)}${emailPart}`;
        };
      } catch (err) {
        setText('loadStatus', `Failed to load details: ${err.message}`);
      }
    }

    document.getElementById('acceptBtn').onclick = async () => {
      if (!document.getElementById('acceptTerms').checked) return alert('Please accept terms first');
      try {
        const data = await postWithFallback('/api/checkin/owner/terms-accept', { loginId, accepted: true });
        if (!data.success) return alert(data.message || 'Failed to accept terms');
        alert('Terms accepted');
        loadOwnerDetails();
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    };

    document.getElementById('submitBtn').onclick = async () => {
      if (!document.getElementById('finalVerify').checked) return alert('Please check final verify');
      try {
        const checkinResp = await getWithFallback(`/api/checkin/owner/${encodeURIComponent(loginId)}`);
        const ownerResp = await getWithFallback(`/api/owners/${encodeURIComponent(loginId)}`);
        const kyc = checkinResp?.record?.ownerKyc || {};
        const ownerKycStatus = ownerResp?.kyc?.status || '';
        const kycVerified = Boolean(kyc.otpVerified || kyc.digilockerVerified || ownerKycStatus === 'submitted');
        if (!kycVerified) {
          return alert('Complete KYC verification first (OTP or DigiLocker), then submit.');
        }
        const data = await postWithFallback('/api/checkin/owner/final-submit', { loginId, finalVerified: true });
        if (!data.success) return alert(data.message || 'Submit failed');
        showFinalConfirmation(data.dashboardUrl || '');
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    };

    loadOwnerDetails();
