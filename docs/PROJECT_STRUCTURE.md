# Roomhy Project Structure (Phase 1 Cleanup)

This project contains multiple frontend apps and one Node.js backend.

## Core runtime folders
- `roomhy-backend/` - Express API + MongoDB integration
- `website/` - Public marketing/listing pages
- `superadmin/` - Superadmin panel
- `propertyowner/` - Property owner panel
- `tenant/` - Tenant panel
- `digital-checkin/` - Digital KYC/check-in flow
- `deploy/` - Nginx, monitoring, backup, load-test configs

## Utility folders
- `docs/` - Architecture and maintainability docs
- `scripts/quality/` - Static quality scan scripts
- `archive/legacy-dev-artifacts/` - Old test/debug/support files moved from root

## Non-breaking cleanup done
- Root-level legacy test/debug files moved to:
  - `archive/legacy-dev-artifacts/`
- Runtime folders and entry points were not modified in this phase.

## Next phase (safe refactor plan)
1. Extract inline CSS from each app to `assets/css/*.css`.
2. Extract inline JS to `assets/js/*.js` with `defer`.
3. Keep API config in one shared JS file per app.
4. Remove duplicated utility functions (toast, auth helpers, API URL builders).
5. Add lint/prettier passes after each module refactor.
