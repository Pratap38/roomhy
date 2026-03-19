const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'http://localhost:5001'
      : 'https://api.roomhy.com';
    const params = new URLSearchParams(location.search);
    if (params.get('loginId')) document.getElementById('loginId').value = params.get('loginId').toUpperCase();

    function cleanPropertyName(value) {
      const text = String(value || '').trim();
      if (!text) return '';
      const lower = text.toLowerCase();
      if (lower === 'new' || lower === 'new property' || lower === 'undefined' || lower === 'null' || /^new\s*(\(.+\))?$/.test(lower)) return '';
      return text;
    }

    async function prefillTenantData() {
      const loginId = (document.getElementById('loginId').value || '').trim().toUpperCase();
      if (!loginId) return;
      let tenant = null;

      try {
        const cached = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
        tenant = cached.find(t => String(t.loginId || '').toUpperCase() === loginId) || null;
      } catch (_) {}

      if (!tenant) {
        try {
          const res = await fetch(`${API_BASE}/api/tenants`);
          const data = await res.json().catch(() => ({}));
          const list = Array.isArray(data) ? data : (Array.isArray(data.tenants) ? data.tenants : []);
          tenant = list.find(t => String(t.loginId || '').toUpperCase() === loginId) || null;
        } catch (_) {}
      }

      if (!tenant) return;

      document.getElementById('name').value = tenant.name || '';
      document.getElementById('email').value = tenant.email || '';
      document.getElementById('moveInDate').value = tenant.moveInDate ? String(tenant.moveInDate).slice(0, 10) : '';
      document.getElementById('guardianNumber').value = tenant.guardianNumber || tenant.emergencyContact || '';
      document.getElementById('dob').value = tenant.dob || '';

      const rawPropertyName = (tenant.property && typeof tenant.property === 'object')
        ? (tenant.propertyTitle || tenant.propertyName || tenant.property.title || tenant.property.name || '')
        : (tenant.propertyTitle || tenant.propertyName || tenant.property || '');
      let propertyName = cleanPropertyName(rawPropertyName);
      if (!propertyName && tenant.propertyId) {
        try {
          const props = JSON.parse(localStorage.getItem('roomhy_properties') || '[]');
          const match = props.find(p => String(p._id || p.id || p.propertyId || '') === String(tenant.propertyId));
          propertyName = cleanPropertyName(match && (match.title || match.name || match.propertyName));
        } catch (_) {}
      }
      if (!propertyName && tenant.propertyId) {
        try {
          const res = await fetch(`${API_BASE}/api/properties`);
          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            const list = Array.isArray(data?.properties) ? data.properties : [];
            const match = list.find(p => String(p._id || p.id || p.propertyId || '') === String(tenant.propertyId));
            propertyName = cleanPropertyName(match && (match.title || match.name || match.propertyName));
          }
        } catch (_) {}
      }
      document.getElementById('propertyName').value = propertyName || '';
      document.getElementById('roomNo').value = tenant.roomNo || '';
      document.getElementById('agreedRent').value = tenant.agreedRent ? `INR ${tenant.agreedRent}` : '';
    }

    prefillTenantData();

    document.getElementById('tenantProfileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const rentRaw = (document.getElementById('agreedRent').value || '').replace(/[^\d.]/g, '');
      const payload = {
        loginId: document.getElementById('loginId').value.trim().toUpperCase(),
        name: document.getElementById('name').value.trim(),
        propertyName: document.getElementById('propertyName').value.trim(),
        roomNo: document.getElementById('roomNo').value.trim(),
        agreedRent: rentRaw ? Number(rentRaw) : null,
        dob: document.getElementById('dob').value,
        guardianNumber: document.getElementById('guardianNumber').value.trim(),
        moveInDate: document.getElementById('moveInDate').value,
        email: document.getElementById('email').value.trim()
      };
      const res = await fetch(`${API_BASE}/api/checkin/tenant/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) return alert(data.message || 'Failed to save profile');

      try {
        const list = JSON.parse(localStorage.getItem('roomhy_tenants') || '[]');
        const idx = list.findIndex(t => String(t.loginId || '').toUpperCase() === payload.loginId);
        if (idx > -1) {
          list[idx].name = payload.name;
          list[idx].email = payload.email || list[idx].email;
          list[idx].dob = payload.dob;
          list[idx].guardianNumber = payload.guardianNumber;
          list[idx].moveInDate = payload.moveInDate;
          list[idx].propertyTitle = payload.propertyName || list[idx].propertyTitle;
          list[idx].roomNo = payload.roomNo || list[idx].roomNo;
          if (payload.agreedRent !== null) list[idx].agreedRent = payload.agreedRent;
          localStorage.setItem('roomhy_tenants', JSON.stringify(list));
        }
      } catch (_) {}

      location.href = `/digital-checkin/tenantkyc?loginId=${encodeURIComponent(payload.loginId)}`;
    });