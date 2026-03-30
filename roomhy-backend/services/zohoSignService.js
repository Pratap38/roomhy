const DEFAULT_COMPLETE_PATH = '/digital-checkin/owner-success';

function getFrontendBaseUrl() {
    return (
        process.env.DIGITAL_CHECKIN_URL ||
        process.env.ADMIN_URL ||
        process.env.FRONTEND_URL ||
        process.env.APP_URL ||
        'https://roomhy.com'
    );
}

function getBearerHeaders() {
    const accessToken = process.env.ZOHO_SIGN_ACCESS_TOKEN || '';
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function getCompleteUrl(loginId) {
    const base = new URL(getFrontendBaseUrl());
    base.pathname = DEFAULT_COMPLETE_PATH;
    base.searchParams.set('loginId', String(loginId || '').toUpperCase());
    base.searchParams.set('completeAgreement', '1');
    return base.toString();
}

function isZohoConfigured() {
    return Boolean(process.env.ZOHO_SIGN_CREATE_URL && process.env.ZOHO_SIGN_ACCESS_TOKEN);
}

function pickFirstString(values = []) {
    return values.find((value) => typeof value === 'string' && value.trim()) || '';
}

function buildOwnerAgreementPayload({ owner = {}, loginId, aadhaarNumber, callbackUrl }) {
    const normalizedLoginId = String(loginId || '').toUpperCase();
    return {
        templateId: process.env.ZOHO_SIGN_TEMPLATE_ID || '',
        documentName: `RoomHy Owner Agreement - ${normalizedLoginId}`,
        callbackUrl,
        redirectUrl: getCompleteUrl(normalizedLoginId),
        owner: {
            loginId: normalizedLoginId,
            name: owner.name || owner.profile?.name || '',
            email: owner.email || owner.profile?.email || '',
            phone: owner.checkinPhone || owner.phone || owner.profile?.phone || '',
            area: owner.checkinArea || owner.area || owner.locationCode || owner.profile?.locationCode || '',
            aadhaarNumber: aadhaarNumber || owner.checkinAadhaarNumber || owner.kyc?.aadharNumber || ''
        },
        fields: {
            owner_name: owner.name || owner.profile?.name || '',
            owner_email: owner.email || owner.profile?.email || '',
            owner_phone: owner.checkinPhone || owner.phone || owner.profile?.phone || '',
            owner_login_id: normalizedLoginId,
            owner_area: owner.checkinArea || owner.area || owner.locationCode || owner.profile?.locationCode || '',
            owner_aadhaar_number: aadhaarNumber || owner.checkinAadhaarNumber || owner.kyc?.aadharNumber || ''
        }
    };
}

async function createOwnerAgreementRequest({ owner = {}, loginId, aadhaarNumber, callbackUrl }) {
    const normalizedLoginId = String(loginId || '').toUpperCase();
    const payload = buildOwnerAgreementPayload({ owner, loginId: normalizedLoginId, aadhaarNumber, callbackUrl });

    if (!isZohoConfigured()) {
        const requestId = `MOCK-ZOHO-${normalizedLoginId}-${Date.now()}`;
        return {
            provider: 'mock-zoho-sign',
            requestId,
            status: 'pending_signature',
            signUrl: getCompleteUrl(normalizedLoginId),
            payload,
            raw: { mock: true }
        };
    }

    const response = await fetch(process.env.ZOHO_SIGN_CREATE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getBearerHeaders()
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(
            data?.message ||
            data?.error ||
            `Zoho Sign request failed (${response.status})`
        );
        error.status = response.status;
        error.data = data;
        throw error;
    }

    const signUrl = pickFirstString([
        data?.signUrl,
        data?.sign_url,
        data?.signing_url,
        data?.request?.sign_url,
        data?.request?.signUrl,
        data?.document?.sign_url,
        data?.document?.signUrl,
        data?.requests?.[0]?.sign_url,
        data?.requests?.[0]?.signUrl
    ]);
    const requestId = pickFirstString([
        data?.requestId,
        data?.request_id,
        data?.document_id,
        data?.documentId,
        data?.requests?.[0]?.request_id,
        data?.requests?.[0]?.requestId
    ]) || `ZOHO-${normalizedLoginId}-${Date.now()}`;

    return {
        provider: 'zoho-sign',
        requestId,
        status: 'pending_signature',
        signUrl: signUrl || getCompleteUrl(normalizedLoginId),
        payload,
        raw: data
    };
}

module.exports = {
    buildOwnerAgreementPayload,
    createOwnerAgreementRequest,
    getCompleteUrl
};
