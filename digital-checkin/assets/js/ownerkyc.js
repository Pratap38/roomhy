const API_BASES = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? ['http://localhost:5001', 'http://localhost:5001']
      : ['https://api.roomhy.com'];
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
    
    // Display email info if available
    if (ownerEmail) {
      document.getElementById('emailInfo').style.display = 'block';
      document.getElementById('displayEmail').textContent = ownerEmail;
      console.log('OTP will be sent to:', ownerEmail);
    } else {
      console.warn('No email found in URL parameter');
    }

    // Format Aadhaar number as user types
    document.getElementById('aadhaarNumber').addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
      if (val.length > 12) val = val.substring(0, 12); // Limit to 12 digits
      // Format with spaces: XXXX XXXX XXXX
      if (val.length > 8) val = val.substring(0, 4) + ' ' + val.substring(4, 8) + ' ' + val.substring(8);
      else if (val.length > 4) val = val.substring(0, 4) + ' ' + val.substring(4);
      e.target.value = val;
      console.log('Formatted Aadhaar:', val, 'digits only:', val.replace(/\s/g, ''));
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
      } catch (_) {
        // keep manual flow without email prefill
      }
    }

    hydrateOwnerEmail();

    document.getElementById('sendOtpBtn').onclick = async () => {
      const loginId = document.getElementById('loginId').value.trim();
      const aadhaarLinkedPhone = document.getElementById('aadhaarLinkedPhone').value.trim();
      const aadhaarNumber = document.getElementById('aadhaarNumber').value.trim().replace(/\s/g, '');
      
      if (!loginId) {
        return alert('Login ID is missing. Please check the URL.');
      }
      if (!aadhaarLinkedPhone) {
        return alert('Please enter your mobile number linked with Aadhaar');
      }
      if (!aadhaarNumber) {
        return alert('Please enter your Aadhaar number');
      }
      if (aadhaarNumber.length !== 12) {
        return alert('Aadhaar must be exactly 12 digits (without spaces)');
      }
      if (!/^\d+$/.test(aadhaarNumber)) {
        return alert('Aadhaar must contain only digits');
      }
      
      try {
        document.getElementById('sendOtpBtn').disabled = true;
        const payload = {
          loginId: loginId,
          aadhaarLinkedPhone: aadhaarLinkedPhone,
          aadhaarNumber: aadhaarNumber,
          email: ownerEmail
        };
        console.log('Sending OTP request:', payload);
        const data = await postWithFallback('/api/checkin/owner/kyc/send-otp', payload);
        if (!data.success) {
          document.getElementById('otpMsg').innerHTML = `<span class="error">Error: ${data.message || 'OTP send failed'}</span>`;
          document.getElementById('sendOtpBtn').disabled = false;
          return;
        }
        document.getElementById('otpMsg').innerHTML = `<span class="success">✓ OTP sent to your registered email. Check your inbox for a 4-digit code.</span>`;
      } catch (err) {
        console.error('OTP send error:', err);
        document.getElementById('otpMsg').innerHTML = `<span class="error">Error: ${err.message}</span>`;
        document.getElementById('sendOtpBtn').disabled = false;
      }
    };

    document.getElementById('verifyOtpBtn').onclick = async () => {
      const loginId = document.getElementById('loginId').value.trim();
      const aadhaarNumber = document.getElementById('aadhaarNumber').value.trim().replace(/\s/g, '');
      const otp = document.getElementById('otp').value.trim();
      
      if (!loginId) {
        return alert('Login ID is missing');
      }
      if (!aadhaarNumber || aadhaarNumber.length !== 12) {
        return alert('Please enter a valid Aadhaar number (12 digits)');
      }
      if (!otp || otp.length !== 4) {
        return alert('Please enter a valid 4-digit OTP');
      }
      
      try {
        document.getElementById('verifyOtpBtn').disabled = true;
        const payload = {
          loginId: loginId,
          aadhaarNumber: aadhaarNumber,
          otp: otp
        };
        console.log('Verifying OTP with payload:', payload);
        const data = await postWithFallback('/api/checkin/owner/kyc/verify-otp', payload);
        if (!data.success) {
          document.getElementById('otpMsg').innerHTML = `<span class="error">Error: ${data.message || 'OTP verification failed'}</span>`;
          document.getElementById('verifyOtpBtn').disabled = false;
          return;
        }
        document.getElementById('otpMsg').innerHTML = `<span class="success">✓ OTP verified successfully! Your login credentials have been sent to your email.</span>`;
        document.getElementById('nextBtn').style.display = 'inline-block';
      } catch (err) {
        console.error('OTP verify error:', err);
        document.getElementById('otpMsg').innerHTML = `<span class="error">Error: ${err.message}</span>`;
        document.getElementById('verifyOtpBtn').disabled = false;
      }
    };

    document.getElementById('nextBtn').onclick = () => {
      const loginId = document.getElementById('loginId').value.trim();
      const emailPart = ownerEmail ? `&email=${encodeURIComponent(ownerEmail)}` : '';
      location.href = `ownerterms.html?loginId=${encodeURIComponent(loginId)}${emailPart}`;
    };
