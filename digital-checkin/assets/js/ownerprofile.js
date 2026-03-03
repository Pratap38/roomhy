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
    
    // Auto-fetch from URL parameters (supports aliases and case differences)
    const loginId = getParamValue(['loginId', 'loginid', 'staffId']);
    const email = getParamValue(['email', 'ownerEmail', 'mail']);
    const area = getParamValue(['area', 'assignedArea', 'location']);
    const password = getParamValue(['password', 'tempPassword', 'pass']);
    
    if (loginId) document.getElementById('loginId').value = loginId;
    
    // Display auto-fetched values
    const infoDiv = document.getElementById('autoFetchedInfo');
    if (email || area || password) {
      infoDiv.style.display = 'block';
      if (email) document.getElementById('autoEmail').textContent = email;
      if (area) document.getElementById('autoArea').textContent = area;
      if (password) document.getElementById('autoPassword').textContent = password;
    } else {
      infoDiv.style.display = 'none';
    }



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

    document.getElementById('ownerProfileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        // Validate auto-fetched required fields
        // Email, area, and password come from URL parameters (not form inputs)
        if (!email) return alert('Error: Email not provided in URL. Please use the correct link from enquiry.html');
        if (!area) return alert('Error: Area not provided in URL. Please use the correct link from enquiry.html');
        if (!password) return alert('Error: Password not provided in URL. Please use the correct link from enquiry.html');
        
        const payload = {
          loginId: loginId || document.getElementById('loginId').value.trim(),
          name: document.getElementById('name').value.trim(),
          dob: document.getElementById('dob').value,
          email: email, // From URL parameter
          phone: document.getElementById('phone').value.trim(),
          address: document.getElementById('address').value.trim(),
          area: area, // From URL parameter
          password: password, // From URL parameter
          payment: {
            bankName: document.getElementById('bankName').value.trim(),
            branchName: document.getElementById('branchName').value.trim(),
            bankAccountNumber: document.getElementById('bankAccountNumber').value.trim(),
            ifscCode: document.getElementById('ifscCode').value.trim(),
            accountHolderName: document.getElementById('accountHolderName').value.trim(),
            upiId: document.getElementById('upiId').value.trim()
          }
        };

        const data = await postWithFallback('/api/checkin/owner/profile', payload);
        if (!data.success) return alert(data.message || 'Failed to save profile');
        location.href = `ownerkyc.html?loginId=${encodeURIComponent(payload.loginId)}&email=${encodeURIComponent(payload.email)}`;
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });