const express = require('express');

const router = express.Router();

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'my_verify_token';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.ACCESS_TOKEN || '';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID || '';
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';

async function sendAutoReply(to, messageText) {
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID || !to || !messageText) {
        return false;
    }

    const response = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: {
                body: `You said: ${messageText}`
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.warn('WhatsApp auto-reply failed:', response.status, errorText);
        return false;
    }

    console.log(`WhatsApp auto-reply sent to ${to}`);
    return true;
}

// Meta calls this once while verifying the callback URL.
router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WhatsApp webhook verified successfully');
        return res.status(200).send(challenge);
    }

    console.warn('WhatsApp webhook verification failed');
    return res.sendStatus(403);
});

// Meta posts incoming messages and delivery updates here.
router.post('/', async (req, res) => {
    console.log('Incoming WhatsApp webhook body:');
    console.log(JSON.stringify(req.body, null, 2));

    try {
        const entry = req.body.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        const message = value?.messages?.[0];

        const senderPhone = message?.from || '';
        const messageText = message?.text?.body || '';

        if (senderPhone && messageText) {
            console.log('WhatsApp sender:', senderPhone);
            console.log('WhatsApp message:', messageText);
            await sendAutoReply(senderPhone, messageText);
        } else {
            console.log('WhatsApp webhook received without a text message payload');
        }
    } catch (err) {
        console.error('WhatsApp webhook processing error:', err.message);
    }

    return res.sendStatus(200);
});

module.exports = router;
