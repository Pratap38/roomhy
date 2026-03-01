(function () {
  const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5001'
    : 'https://api.roomhy.com';
  const API_BASES = Array.from(new Set([
    API_URL,
    'http://localhost:5001',
    'https://api.roomhy.com'
  ]));
  let activeApiBase = API_URL;

  const OWNER_CONTEXT_DEBUG = /(^|[?&])ownerDebug=1(&|$)/.test(window.location.search || '');
  const debugLog = (...args) => { if (OWNER_CONTEXT_DEBUG) console.log(...args); };

  async function apiFetch(path, options = {}) {
    const attempts = [activeApiBase, ...API_BASES.filter((b) => b !== activeApiBase)];
    let lastError = null;

    for (const base of attempts) {
      try {
        const res = await fetch(`${base}${path}`, options);
        if (res.status === 404) {
          lastError = new Error(`404 for ${path} at ${base}`);
          continue;
        }
        if (res.ok) activeApiBase = base;
        return res;
      } catch (err) {
        lastError = err;
      }
    }

    if (lastError) throw lastError;
    throw new Error(`API request failed for ${path}`);
  }

  function safeParse(raw) {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  }

  function safeSet(storage, key, value) {
    try { storage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function getUrlLoginId() {
    try {
      const q = new URLSearchParams(window.location.search || '');
      const fromQuery = q.get('loginId') || q.get('loginid');
      if (fromQuery) return String(fromQuery).trim().toUpperCase();
    } catch (_) {}
    return '';
  }

  function getUrlData() {
    try {
      const q = new URLSearchParams(window.location.search || '');
      return {
        loginId: (q.get('loginId') || q.get('loginid') || '').trim().toUpperCase(),
        name: q.get('name') ? decodeURIComponent(q.get('name')) : '',
        propertyName: q.get('propertyName') ? decodeURIComponent(q.get('propertyName')) : '',
        email: q.get('email') ? decodeURIComponent(q.get('email')) : ''
      };
    } catch (_) {
      return { loginId: '', name: '', propertyName: '', email: '' };
    }
  }

  function readCandidate() {
    // Priority 1: Read from URL parameters (bypasses Tracking Prevention)
    const urlData = getUrlData();
    if (urlData.loginId && urlData.name) {
      debugLog('[ownerContextSync] 🔗 Found owner data in URL parameters:', {
        name: urlData.name,
        loginId: urlData.loginId,
        propertyName: urlData.propertyName
      });
      return {
        loginId: urlData.loginId,
        ownerId: urlData.loginId,
        role: 'owner',
        name: urlData.name,
        propertyName: urlData.propertyName,
        email: urlData.email
      };
    }

    const sOwner = safeParse(sessionStorage.getItem('owner_session'));
    const lOwner = safeParse(localStorage.getItem('owner_user')) || safeParse(localStorage.getItem('ownerUser'));
    const sUser = safeParse(sessionStorage.getItem('user'));
    const lUser = safeParse(localStorage.getItem('user'));
    const loginIdFromUrl = getUrlLoginId();

    debugLog('[ownerContextSync] Reading candidate from storage:', {
      'sessionStorage.owner_session.name': sOwner?.name,
      'localStorage.owner_user.name': lOwner?.name,
      'sessionStorage.user.name': sUser?.name,
      'localStorage.user.name': lUser?.name,
      'URL parameter': loginIdFromUrl
    });

    const fallbackUser = (sUser && sUser.role === 'owner') ? sUser : ((lUser && lUser.role === 'owner') ? lUser : null);
    const c = sOwner || lOwner || fallbackUser || null;
    if (c && (c.loginId || c.ownerId)) {
      debugLog('[ownerContextSync] Found candidate in storage:', {
        name: c.name,
        loginId: c.loginId || c.ownerId
      });
      return c;
    }

    // Fallback: roomhy_owners_db from superadmin owner page
    try {
      const loginIdFromUrl = getUrlLoginId();
      const db = safeParse(localStorage.getItem('roomhy_owners_db')) || {};
      if (loginIdFromUrl && db[loginIdFromUrl]) {
        const entry = db[loginIdFromUrl];
        const candidate = {
          loginId: loginIdFromUrl,
          ownerId: loginIdFromUrl,
          role: 'owner',
          name: entry?.name || entry?.profile?.name || 'Owner',
          email: entry?.email || entry?.profile?.email || '',
          phone: entry?.checkinPhone || entry?.phone || entry?.profile?.phone || '',
          address: entry?.checkinAddress || entry?.address || entry?.profile?.address || '',
          locationCode: entry?.checkinArea || entry?.locationCode || entry?.profile?.locationCode || ''
        };
        debugLog('[ownerContextSync] Found candidate in roomhy_owners_db:', {
          name: candidate.name,
          loginId: candidate.loginId
        });
        return candidate;
      }
    } catch (_) {}

    // Fallback: persist loginId in window.name across owner tab navigation
    try {
      if (!loginIdFromUrl && window.name && window.name.startsWith('roomhy_owner_loginid=')) {
        const l = window.name.split('=')[1] || '';
        if (l) {
          debugLog('[ownerContextSync] Found candidate from window.name:', l);
          return { loginId: String(l).toUpperCase(), ownerId: String(l).toUpperCase(), role: 'owner' };
        }
      }
    } catch (_) {}

    if (loginIdFromUrl) {
      debugLog('[ownerContextSync] Using loginId from URL:', loginIdFromUrl);
      return { loginId: loginIdFromUrl, ownerId: loginIdFromUrl, role: 'owner' };
    }
    
    debugLog('[ownerContextSync] No candidate found');
    return null;
  }

  async function fetchOwner(loginId) {
    try {
      const res = await apiFetch(`/api/owners/${encodeURIComponent(loginId)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data && (data.owner || data.data || data);
    } catch (_) {
      return null;
    }
  }

  async function fetchOwnerProperty(loginId) {
    try {
      const pRes = await apiFetch(`/api/owners/${encodeURIComponent(loginId)}/properties`);
      if (pRes.ok) {
        const pData = await pRes.json();
        const props = Array.isArray(pData?.properties) ? pData.properties : [];
        if (props.length > 0) return props[0];
      }
    } catch (_) {}

    try {
      const rRes = await apiFetch(`/api/owners/${encodeURIComponent(loginId)}/rooms`);
      if (rRes.ok) {
        const rData = await rRes.json();
        const props = Array.isArray(rData?.properties) ? rData.properties : [];
        if (props.length > 0) return props[0];
      }
    } catch (_) {}

    try {
      const vRes = await apiFetch(`/api/visits/approved`);
      if (!vRes.ok) return null;
      const vData = await vRes.json();
      const visits = Array.isArray(vData?.visits) ? vData.visits : [];
      const match = visits.find((v) =>
        String(v?.generatedCredentials?.loginId || '').toUpperCase() === String(loginId).toUpperCase()
      );
      if (!match) return null;
      return match.propertyInfo || match;
    } catch (_) {
      // local fallback (superadmin/visit cache)
      try {
        const localVisits = safeParse(localStorage.getItem('roomhy_visits')) || [];
        const localMatch = localVisits.find((v) =>
          String(v?.generatedCredentials?.loginId || '').toUpperCase() === String(loginId).toUpperCase()
        );
        if (localMatch) return localMatch.propertyInfo || localMatch;
      } catch (_) {}
      return null;
    }
  }

  function enrichFromLocalOwnerDb(ctx) {
    try {
      const db = safeParse(localStorage.getItem('roomhy_owners_db')) || {};
      const entry = db[ctx.loginId] || null;
      if (!entry) return ctx;
      return {
        ...ctx,
        name: ctx.name && ctx.name !== 'Owner' ? ctx.name : (entry?.name || entry?.profile?.name || ctx.name),
        email: ctx.email || entry?.email || entry?.profile?.email || '',
        phone: ctx.phone || entry?.checkinPhone || entry?.phone || entry?.profile?.phone || '',
        address: ctx.address || entry?.checkinAddress || entry?.address || entry?.profile?.address || '',
        locationCode: ctx.locationCode || entry?.checkinArea || entry?.locationCode || entry?.profile?.locationCode || '',
        area: ctx.area || entry?.checkinArea || entry?.area || entry?.locationCode || '',
        propertyName: ctx.propertyName || entry?.propertyName || '',
        propertyLocation: ctx.propertyLocation || entry?.propertyLocation || ''
      };
    } catch (_) {
      return ctx;
    }
  }

  function buildOwnerContext(candidate, owner, property) {
    const loginId = String(candidate?.loginId || candidate?.ownerId || owner?.loginId || '').trim().toUpperCase();
    const propertyName =
      property?.title ||
      property?.name ||
      property?.propertyName ||
      candidate?.propertyName ||
      '';
    const propertyLocation =
      property?.location ||
      property?.area ||
      property?.city ||
      property?.address ||
      candidate?.propertyLocation ||
      '';

    // PRIORITY: Use name from candidate (already logged in with correct name) FIRST
    // Only use API data if candidate name is missing
    const finalName =
      (candidate?.name && candidate.name !== 'Owner') ? candidate.name :
      (owner?.profile?.name || owner?.name || candidate?.name || 'Owner');

    return {
      ...candidate,
      loginId,
      ownerId: loginId,
      role: 'owner',
      name: finalName,
      email:
        candidate?.email ||
        owner?.profile?.email ||
        owner?.email ||
        '',
      phone:
        candidate?.phone ||
        owner?.profile?.phone ||
        owner?.phone ||
        '',
      address:
        candidate?.address ||
        owner?.profile?.address ||
        owner?.address ||
        '',
      locationCode:
        candidate?.locationCode ||
        owner?.profile?.locationCode ||
        owner?.locationCode ||
        owner?.checkinArea ||
        '',
      area:
        candidate?.area ||
        owner?.checkinArea ||
        owner?.area ||
        owner?.locationCode ||
        '',
      propertyName,
      propertyLocation
    };
  }

  function applyOwnerDom(ctx) {
    if (!ctx) return;
    const ownerName = ctx.name || 'Owner';
    const loginId = ctx.loginId || ctx.ownerId || '';
    const area = ctx.area || ctx.locationCode || '';
    const propertyText = ctx.propertyName
      ? `${ctx.propertyName}${ctx.propertyLocation ? ` (${ctx.propertyLocation})` : ''}`
      : (area ? `Property (${area})` : 'Property Name');

    debugLog('[ownerContextSync] Applying DOM updates:', {
      ownerName: ownerName,
      loginId: loginId,
      propertyText: propertyText,
      readyState: document.readyState
    });

    const nameIds = ['headerOwnerName', 'headerName', 'welcomeName', 'ownerName'];
    nameIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        debugLog(`[ownerContextSync] Setting #${id} to "${ownerName}"`);
        el.textContent = ownerName;
      }
    });

    const loginIds = ['headerOwnerId', 'headerAccountId', 'ownerLoginId'];
    loginIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === 'headerOwnerId') {
        debugLog(`[ownerContextSync] Setting #${id} to "ID: ${loginId}"`);
        el.textContent = `ID: ${loginId || '-'}`;
      }
      else if (id === 'headerAccountId') {
        debugLog(`[ownerContextSync] Setting #${id} to "Account: ${loginId}"`);
        el.textContent = `Account: ${loginId || '-'}`;
      }
      else {
        debugLog(`[ownerContextSync] Setting #${id} to "${loginId}"`);
        el.textContent = loginId || '-';
      }
    });

    const avatar = document.getElementById('headerAvatar');
    if (avatar) {
      const letter = ownerName.charAt(0).toUpperCase();
      debugLog(`[ownerContextSync] Setting #headerAvatar to "${letter}"`);
      avatar.textContent = letter;
    }

    const propertyIds = ['propertyNameDisplay', 'modalPropertyNameText', 'propertyNameText'];
    propertyIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        debugLog(`[ownerContextSync] Setting #${id} to "${propertyText}"`);
        el.textContent = propertyText;
      }
    });
  }

  function storeContext(ctx) {
    safeSet(localStorage, 'owner_user', ctx);
    safeSet(localStorage, 'ownerUser', ctx);
    safeSet(localStorage, 'user', ctx);
    safeSet(sessionStorage, 'owner_session', ctx);
    safeSet(sessionStorage, 'user', ctx);
    window.__ownerContext = ctx;
    try { window.name = `roomhy_owner_loginid=${ctx.loginId || ctx.ownerId || ''}`; } catch (_) {}
  }

  function publishContext(ctx) {
    applyOwnerDom(ctx);
    propagateLoginIdToLinks(ctx.loginId || ctx.ownerId || '');
    window.dispatchEvent(new CustomEvent('owner-session-updated', { detail: ctx }));
  }

  function propagateLoginIdToLinks(loginId) {
    if (!loginId) return;
    const anchors = document.querySelectorAll('a[href]');
    anchors.forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;
      try {
        const u = new URL(href, window.location.origin + window.location.pathname);
        if (!u.searchParams.get('loginId')) u.searchParams.set('loginId', loginId);
        a.setAttribute('href', `${u.pathname.split('/').pop()}${u.search}${u.hash || ''}`);
      } catch (_) {}
    });
  }

  function reinforceDom(ctx) {
    let count = 0;
    const t = setInterval(function () {
      publishContext(ctx);
      count += 1;
      if (count >= 2) clearInterval(t);
    }, 500);
  }

  window.getCurrentOwner = function () {
    return window.__ownerContext || readCandidate() || null;
  };

  async function syncOwnerContext() {
    const candidate = readCandidate();
    if (!candidate) {
      debugLog('[ownerContextSync] No candidate found, skipping sync');
      return;
    }

    const loginId = String(candidate.loginId || candidate.ownerId || '').trim().toUpperCase();
    if (!loginId) {
      debugLog('[ownerContextSync] No loginId, skipping sync');
      return;
    }

    debugLog('[ownerContextSync] Starting sync for:', loginId);
    debugLog('[ownerContextSync] Candidate data:', {
      name: candidate.name,
      propertyName: candidate.propertyName,
      area: candidate.area,
      email: candidate.email
    });

    const [owner, property] = await Promise.all([
      fetchOwner(loginId),
      fetchOwnerProperty(loginId)
    ]);

    const ctx = enrichFromLocalOwnerDb(buildOwnerContext(candidate, owner, property));
    debugLog('[ownerContextSync] Built context:', {
      name: ctx.name,
      propertyName: ctx.propertyName,
      propertyLocation: ctx.propertyLocation
    });
    
    storeContext(ctx);

    publishContext(ctx);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { publishContext(ctx); }, { once: true });
    } else {
      setTimeout(function () { publishContext(ctx); }, 100);
    }
    setTimeout(function () { publishContext(ctx); }, 700);
    reinforceDom(ctx);
  }

  syncOwnerContext();
})();

