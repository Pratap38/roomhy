# Frontend Refactor Guide (No-Break Approach)

Goal: split HTML/CSS/JS cleanly without breaking current behavior.

## Refactor unit
Do one page at a time.

For a page like:
- `superadmin/manager.html`

Create:
- `superadmin/assets/css/manager.css`
- `superadmin/assets/js/manager.js`

Then in HTML:
1. Move `<style>...</style>` to CSS file.
2. Move inline `<script>...</script>` to JS file.
3. Keep only:
   - required CDN scripts
   - `<script src="assets/js/manager.js" defer></script>`
   - `<link rel="stylesheet" href="assets/css/manager.css">`

## Rules to avoid regressions
1. Do not rename element IDs or classes in first pass.
2. Do not change API payload shape in refactor phase.
3. Keep global names used by `onclick="..."` unless HTML is updated too.
4. Use `defer` for JS script tags.
5. Validate each page after extraction:
   - login
   - list fetch
   - form submit
   - table render
   - modal open/close

## Suggested order
1. Login pages:
   - `superadmin/index.html`
   - `propertyowner/index.html`
   - `tenant/tenantlogin.html`
2. Dashboard pages with heavy inline JS:
   - `superadmin/manager.html`
   - `superadmin/location.html`
   - `propertyowner/admin.html`
3. Website pages:
   - `website/index.html`
   - `website/signup.html`
   - `website/list.html`

## Quick audit command
```powershell
powershell -ExecutionPolicy Bypass -File scripts/quality/check-inline-assets.ps1
```
