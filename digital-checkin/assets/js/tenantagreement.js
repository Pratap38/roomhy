const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'http://localhost:5001'
      : 'https://api.roomhy.com';
    const params = new URLSearchParams(location.search);
    if (params.get('loginId')) document.getElementById('loginId').value = params.get('loginId');

    document.getElementById('submitBtn').onclick = async () => {
      const submitBtn = document.getElementById('submitBtn');
      const loginId = document.getElementById('loginId').value.trim();
      const eSignName = document.getElementById('eSignName').value.trim();
      const accepted = document.getElementById('accepted').checked;
      if (!loginId || !eSignName || !accepted) return alert('Login ID, e-sign and acceptance are required');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      try {
        const agreeRes = await fetch(`${API_BASE}/api/checkin/tenant/agreement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loginId, eSignName, accepted: true })
        });
        const agreeData = await agreeRes.json();
        if (!agreeRes.ok || !agreeData.success) {
          throw new Error(agreeData.message || 'Agreement submit failed');
        }

        const submitRes = await fetch(`${API_BASE}/api/checkin/tenant/final-submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loginId })
        });
        const submitData = await submitRes.json();
        if (!submitRes.ok || !submitData.success) {
          throw new Error(submitData.message || 'Final submit failed');
        }

        const confirmationUrl = `tenant-confirmation.html?loginId=${encodeURIComponent(loginId)}`;
        window.location.href = confirmationUrl;
      } catch (err) {
        alert(err.message || 'Unable to submit tenant agreement');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Final Submit';
      }
    };