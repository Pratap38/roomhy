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
    let email = getParamValue(['email', 'ownerEmail', 'mail']);
    let area = getParamValue(['area', 'assignedArea', 'location']);
    let password = getParamValue(['password', 'tempPassword', 'pass']);
    
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

    function updateAutoInfo() {
      if (email || area || password) {
        infoDiv.style.display = 'block';
        document.getElementById('autoEmail').textContent = email || '-';
        document.getElementById('autoArea').textContent = area || '-';
        document.getElementById('autoPassword').textContent = password || '-';
      } else {
        infoDiv.style.display = 'none';
      }
    }

    async function hydrateFromOwner() {
      const id = loginId || document.getElementById('loginId').value.trim();
      if (!id) return;
      try {
        const owner = await getWithFallback(`/api/owners/${encodeURIComponent(id)}`);
        if (!owner || typeof owner !== 'object') return;

        const setIfEmpty = (fieldId, value) => {
          const el = document.getElementById(fieldId);
          if (!el) return;
          if (!el.value && value) el.value = value;
        };

        setIfEmpty('name', owner.name || owner.profile?.name || '');
        setIfEmpty('email', owner.email || owner.profile?.email || owner.checkinEmail || '');
        setIfEmpty('area', owner.checkinArea || owner.locationCode || owner.profile?.locationCode || '');
        setIfEmpty('dob', owner.checkinDob || '');
        setIfEmpty('phone', owner.checkinPhone || owner.phone || owner.profile?.phone || '');
        setIfEmpty('address', owner.checkinAddress || owner.address || owner.profile?.address || '');
        setIfEmpty('bankName', owner.checkinBankName || owner.bankName || owner.profile?.bankName || '');
        setIfEmpty('branchName', owner.checkinBranchName || owner.branchName || owner.profile?.branchName || '');
        setIfEmpty('bankAccountNumber', owner.checkinBankAccountNumber || owner.accountNumber || owner.profile?.accountNumber || '');
        setIfEmpty('ifscCode', owner.checkinIfscCode || owner.ifscCode || owner.profile?.ifscCode || '');
        setIfEmpty('accountHolderName', owner.checkinAccountHolderName || owner.profile?.accountHolderName || '');
        setIfEmpty('upiId', owner.checkinUpiId || owner.profile?.upiId || '');

        email = email || owner.email || owner.profile?.email || owner.checkinEmail || '';
        area = area || owner.checkinArea || owner.locationCode || owner.profile?.locationCode || '';
        password = password || owner.checkinPassword || owner.credentials?.password || '';
        updateAutoInfo();
      } catch (_) {
        // keep manual flow if fetch fails
      }
    }

    hydrateFromOwner();

    document.getElementById('ownerProfileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const loginIdValue = loginId || document.getElementById('loginId').value.trim();
        const emailValue = email || document.getElementById('email').value.trim();
        const areaValue = area || document.getElementById('area').value.trim();
        const passwordValue = password || '';
        if (!loginIdValue) return alert('Error: Login ID is required');
        if (!emailValue) return alert('Error: Email is required');
        if (!areaValue) return alert('Error: Area is required');
        
        const payload = {
          loginId: loginIdValue,
          name: document.getElementById('name').value.trim(),
          dob: document.getElementById('dob').value,
          email: emailValue,
          phone: document.getElementById('phone').value.trim(),
          address: document.getElementById('address').value.trim(),
          area: areaValue,
          password: passwordValue,
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
        location.href = `/digital-checkin/ownerkyc?loginId=${encodeURIComponent(payload.loginId)}&email=${encodeURIComponent(payload.email)}`;
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
