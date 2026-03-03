function getBaseUrl() {
    const env = String(process.env.CASHFREE_ENV || 'sandbox').toLowerCase();
    if (process.env.CASHFREE_API_BASE) return process.env.CASHFREE_API_BASE.trim();
    return env === 'production' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com';
}

function getHeaders() {
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error('Cashfree client credentials are not configured');
    }
    const headers = {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-client-secret': clientSecret
    };
    if (process.env.CASHFREE_API_VERSION) {
        headers['x-api-version'] = process.env.CASHFREE_API_VERSION;
    }
    return headers;
}

async function callJson(method, path, { body, query } = {}) {
    const url = new URL(`${getBaseUrl()}${path}`);
    if (query && typeof query === 'object') {
        Object.entries(query).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
        });
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(process.env.CASHFREE_TIMEOUT_MS || 15000));
    try {
        const response = await fetch(url.toString(), {
            method,
            headers: getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const err = new Error(data?.message || data?.error || `Cashfree DigiLocker request failed (${response.status})`);
            err.status = response.status;
            err.code = data?.code || data?.type || '';
            err.data = data;
            throw err;
        }
        return data;
    } finally {
        clearTimeout(timeout);
    }
}

async function verifyDigilockerAccount({ verificationId, mobileNumber, aadhaarNumber }) {
    return callJson('POST', '/verification/digilocker/verify-account', {
        body: {
            verification_id: verificationId,
            mobile_number: mobileNumber || undefined,
            aadhaar_number: aadhaarNumber || undefined
        }
    });
}

async function createDigilockerUrl({ verificationId, redirectUrl, userFlow = 'signin', documents = ['AADHAAR'] }) {
    return callJson('POST', '/verification/digilocker', {
        body: {
            verification_id: verificationId,
            document_requested: documents,
            redirect_url: redirectUrl,
            user_flow: userFlow
        }
    });
}

async function getDigilockerVerificationStatus({ verificationId, referenceId }) {
    return callJson('GET', '/verification/digilocker', {
        query: {
            verification_id: verificationId,
            reference_id: referenceId
        }
    });
}

async function getDigilockerDocument({ documentType = 'AADHAAR', verificationId, referenceId }) {
    return callJson('GET', `/verification/digilocker/document/${documentType}`, {
        query: {
            verification_id: verificationId,
            reference_id: referenceId
        }
    });
}

module.exports = {
    verifyDigilockerAccount,
    createDigilockerUrl,
    getDigilockerVerificationStatus,
    getDigilockerDocument
};
