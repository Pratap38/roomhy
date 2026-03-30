const User = require('../models/user');
const Owner = require('../models/Owner');
const Tenant = require('../models/Tenant');

const sessions = new Map();

function getConfig() {
    return {
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || process.env.ACCESS_TOKEN || '',
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID || '',
        apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
        defaultCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '91'
    };
}

function getSession(phone) {
    const key = String(phone || '').trim();
    if (!key) return { step: 'root' };
    const existing = sessions.get(key) || {};
    return {
        step: 'root',
        selectedCityId: '',
        selectedCityName: '',
        selectedAreaId: '',
        selectedAreaName: '',
        cities: [],
        areas: [],
        ...existing
    };
}

function setSession(phone, nextState) {
    const key = String(phone || '').trim();
    if (!key) return;
    sessions.set(key, {
        ...getSession(key),
        ...nextState
    });
}

function clearSession(phone) {
    const key = String(phone || '').trim();
    if (!key) return;
    sessions.delete(key);
}

function normalizePhoneNumber(rawPhone, defaultCountryCode = '91') {
    if (!rawPhone) return '';
    const cleaned = String(rawPhone).trim().replace(/[^0-9+]/g, '');
    const digitsOnly = cleaned.replace(/\D/g, '');
    if (!digitsOnly) return '';

    if (digitsOnly.length === 10) {
        return `${defaultCountryCode}${digitsOnly}`;
    }

    if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
        return `${defaultCountryCode}${digitsOnly.slice(1)}`;
    }

    if (digitsOnly.length >= 11 && digitsOnly.length <= 15) {
        return digitsOnly;
    }

    return '';
}

async function resolvePhoneByEmailOrUserId({ phone, email, userId }) {
    const cfg = getConfig();
    const directPhone = normalizePhoneNumber(phone, cfg.defaultCountryCode);
    if (directPhone) return directPhone;

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedUserId = String(userId || '').trim();

    try {
        if (normalizedEmail) {
            const userDoc = await User.findOne({ email: normalizedEmail }).select('phone').lean();
            const userPhone = normalizePhoneNumber(userDoc?.phone, cfg.defaultCountryCode);
            if (userPhone) return userPhone;
        }
    } catch (_) {}

    try {
        if (normalizedEmail) {
            const ownerDoc = await Owner.findOne({
                $or: [{ email: normalizedEmail }, { 'profile.email': normalizedEmail }]
            }).select('phone profile.phone').lean();
            const ownerPhone = normalizePhoneNumber(ownerDoc?.phone || ownerDoc?.profile?.phone, cfg.defaultCountryCode);
            if (ownerPhone) return ownerPhone;
        }
    } catch (_) {}

    try {
        if (normalizedEmail || normalizedUserId) {
            const tenantDoc = await Tenant.findOne({
                $or: [
                    normalizedEmail ? { email: normalizedEmail } : null,
                    normalizedUserId ? { loginId: normalizedUserId.toUpperCase() } : null
                ].filter(Boolean)
            }).select('phone').lean();
            const tenantPhone = normalizePhoneNumber(tenantDoc?.phone, cfg.defaultCountryCode);
            if (tenantPhone) return tenantPhone;
        }
    } catch (_) {}

    try {
        if (normalizedUserId) {
            const userDoc = await User.findOne({
                $or: [{ loginId: normalizedUserId.toUpperCase() }, { _id: normalizedUserId }]
            }).select('phone').lean();
            const userPhone = normalizePhoneNumber(userDoc?.phone, cfg.defaultCountryCode);
            if (userPhone) return userPhone;
        }
    } catch (_) {}

    return '';
}

async function sendWhatsAppPayload(payload) {
    const cfg = getConfig();
    if (!cfg.accessToken || !cfg.phoneNumberId || !payload) {
        return false;
    }

    const response = await fetch(`https://graph.facebook.com/${cfg.apiVersion}/${cfg.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${cfg.accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            ...payload
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.warn('WhatsApp send failed:', response.status, errorText);
        return false;
    }

    return true;
}

async function sendTextMessage(to, body) {
    if (!to || !body) return false;
    return sendWhatsAppPayload({
        to,
        type: 'text',
        text: {
            preview_url: true,
            body: String(body).slice(0, 3900)
        }
    });
}

async function sendButtonMessage(to, body, buttons) {
    if (!to || !body || !Array.isArray(buttons) || buttons.length === 0) {
        return false;
    }

    const safeButtons = buttons.slice(0, 3).map((button) => ({
        type: 'reply',
        reply: {
            id: String(button.id || '').slice(0, 256),
            title: String(button.title || '').slice(0, 20)
        }
    }));

    return sendWhatsAppPayload({
        to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: {
                text: String(body).slice(0, 1024)
            },
            action: {
                buttons: safeButtons
            }
        }
    });
}

async function sendBookingConfirmationButtons({
    phone,
    email,
    userId,
    cityName,
    areaName,
    propertyName
}) {
    const resolvedPhone = await resolvePhoneByEmailOrUserId({ phone, email, userId });
    if (!resolvedPhone) return false;

    setSession(resolvedPhone, {
        step: 'post_auth',
        selectedCityName: cityName || '',
        selectedAreaName: areaName || ''
    });

    const body = [
        `Booking confirmed for ${propertyName || 'your property'}.`,
        'Choose refund or alternative property.'
    ].join('\n');

    return sendButtonMessage(resolvedPhone, body, [
        { id: 'booking_refund', title: 'Refund' },
        { id: 'booking_alternative', title: 'Alternative' },
        { id: 'post_auth_menu', title: 'Main Menu' }
    ]);
}

module.exports = {
    clearSession,
    getSession,
    normalizePhoneNumber,
    resolvePhoneByEmailOrUserId,
    sendBookingConfirmationButtons,
    sendButtonMessage,
    sendTextMessage,
    setSession
};
