# Roomhy Security and Scalability Overview

## Implemented
- Helmet security headers in backend.
- CORS allowlist in backend.
- API/global/auth/OTP/form rate limiting (`express-rate-limit`).
- CAPTCHA verification middleware (Turnstile/reCAPTCHA compatible).
- Password hashing with bcrypt (`User` model pre-save hook).
- JWT auth + role-based authorization middleware.
- Audit trail model and middleware for admin-sensitive write actions.
- Nginx hardened template with request/connection limiting and auth-path throttling.
- PM2 cluster deployment template for multi-core usage.
- MongoDB backup/restore automation scripts + retention.
- Baseline k6 load-test script.

## Operational controls to configure in infrastructure
- Cloudflare (or provider WAF) for L3/L4 DDoS and bot filtering.
- TLS certificates and HTTPS redirect on all domains.
- Cron schedule for daily backup script.
- Offsite backup copy (object storage recommended).
- Centralized logs and monitoring/alerting.

## Pending (if enterprise-grade target)
- SIEM integration for audit logs.
- Advanced WAF bot score rules and challenge mode.
- Automated failover database strategy (multi-region DR).
- Scheduled chaos/failover drills.
