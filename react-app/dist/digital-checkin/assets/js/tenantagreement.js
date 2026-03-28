const API_BASES = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? ['http://localhost:5001']
      : ['', 'https://api.roomhy.com'];
    const params = new URLSearchParams(location.search);
    if (params.get('loginId')) document.getElementById('loginId').value = params.get('loginId');

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
          const data = await res.json().catch(() => ({}));
          if (res.ok) return data;
          lastErr = new Error(data.message || `HTTP ${res.status}`);
        } catch (err) {
          lastErr = err;
        }
      }
      throw lastErr || new Error('Request failed');
    }

    document.getElementById('submitBtn').onclick = async () => {
      const submitBtn = document.getElementById('submitBtn');
      const loginId = document.getElementById('loginId').value.trim();
      const eSignName = document.getElementById('eSignName').value.trim();
      const accepted = document.getElementById('accepted').checked;
      if (!loginId || !eSignName || !accepted) return alert('Login ID, e-sign and acceptance are required');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      try {
        // Do not block on stale local check-in reads.
        // Backend /tenant/final-submit already validates OTP/DigiLocker from both
        // CheckinRecord and Tenant model and returns authoritative result.
        await postWithFallback('/api/checkin/tenant/agreement', { loginId, eSignName, accepted: true });

        await postWithFallback('/api/checkin/tenant/final-submit', { loginId });

        const confirmationUrl = `/digital-checkin/tenant-confirmation?loginId=${encodeURIComponent(loginId)}`;
        window.location.href = confirmationUrl;
      } catch (err) {
        alert(err.message || 'Unable to submit tenant agreement');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Final Submit';
      }
    };
