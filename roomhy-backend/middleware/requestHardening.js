const compression = require('compression');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

function requestHardening(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
}

module.exports = {
    compressionMiddleware: compression(),
    hppMiddleware: hpp(),
    mongoSanitizeMiddleware: mongoSanitize({
        replaceWith: '_'
    }),
    requestHardening
};
