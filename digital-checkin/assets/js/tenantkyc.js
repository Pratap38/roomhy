const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'http://localhost:5001'
      : 'https://api.roomhy.com';
    const params = new URLSearchParams(location.search);
    if (params.get('loginId')) document.getElementById('loginId').value = params.get('loginId');

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

    document.getElementById('sendOtpBtn').onclick = async () => {
      try {
        const frontFile = document.getElementById('aadhaarFront').files[0];
        const backFile = document.getElementById('aadhaarBack').files[0];
        if (!frontFile || !backFile) return alert('Upload Aadhaar front and back photos');
        const aadhaarFront = await readFileAsData(frontFile);
        const aadhaarBack = await readFileAsData(backFile);
        const payload = {
          loginId: document.getElementById('loginId').value.trim(),
          aadhaarNumber: document.getElementById('aadhaarNumber').value.trim(),
          aadhaarLinkedPhone: document.getElementById('aadhaarLinkedPhone').value.trim(),
          aadhaarFront,
          aadhaarBack
        };
        const res = await fetch(`${API_BASE}/api/checkin/tenant/kyc/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.success) return alert(data.message || 'OTP send failed');
        document.getElementById('otpMsg').innerText = 'OTP sent to Aadhaar linked mobile number. Enter the 6-digit OTP.';
      } catch (err) {
        alert('Error: ' + err.message);
      }
    };

    document.getElementById('verifyOtpBtn').onclick = async () => {
      const otpInput = document.getElementById('otp').value.trim();
      if (!/^\d{6}$/.test(otpInput)) return alert('Please enter a valid 6-digit OTP');
      const payload = {
        loginId: document.getElementById('loginId').value.trim(),
        aadhaarNumber: document.getElementById('aadhaarNumber').value.trim(),
        otp: otpInput
      };
      const res = await fetch(`${API_BASE}/api/checkin/tenant/kyc/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) return alert(data.message || 'OTP verification failed');

      // Keep local cache in sync so tenant/superadmin pages show "Verified" immediately.
      try {
        const loginId = String(payload.loginId || '').toUpperCase();
        const tenants = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
        const idx = tenants.findIndex(t => String(t.loginId || '').toUpperCase() === loginId);
        if (idx > -1) {
          tenants[idx].kycStatus = 'verified';
          tenants[idx].kyc = tenants[idx].kyc || {};
          tenants[idx].kyc.otpVerified = true;
          tenants[idx].kyc.otpVerifiedAt = new Date().toISOString();
          tenants[idx].kyc.aadhaarNumber = payload.aadhaarNumber || tenants[idx].kyc.aadhaarNumber || '';
          tenants[idx].kyc.aadhar = payload.aadhaarNumber || tenants[idx].kyc.aadhar || '';
          tenants[idx].digitalCheckin = tenants[idx].digitalCheckin || {};
          tenants[idx].digitalCheckin.kyc = {
            ...(tenants[idx].digitalCheckin.kyc || {}),
            otpVerified: true,
            otpVerifiedAt: new Date().toISOString()
          };
          localStorage.setItem('roomhy_tenants', JSON.stringify(tenants));
        }
      } catch (_) {}

      alert('OTP verified successfully');
      document.getElementById('nextBtn').style.display = 'inline-block';
    };

    document.getElementById('nextBtn').onclick = () => {
      const loginId = document.getElementById('loginId').value.trim();
      location.href = `tenantagreement.html?loginId=${encodeURIComponent(loginId)}`;
    };
