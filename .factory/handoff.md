# Home Care Evidence — repair handoff

## Outcome

Release-blocking findings from verifier report commit `7b3d32714b866f87a2fc5fd9500dfa1bc712f2b2`, tested against candidate `38ea71f6b16f27a05d6ffda07d13c3cf38f6c0ac`, are repaired and deployed.

- Valid 80-character unbroken card names now shrink within the flexible header column and wrap at any character. At 1440px, the repaired live heading ends at x=1144.8 while its card ends at x=1370.8. At 390px it remains readable with no page overflow.
- `Add completed work`, `Print one-page history`, and `Edit card` now have a 44px minimum height. Live 390px measurements are 176×44, 188.6×44, and 92.8×44px; Delete is 53.8×44px.
- `/assets/*` now returns `Cache-Control: public, max-age=31536000, immutable`. HTML revalidates, and `/sw.js` returns `no-cache, no-store, must-revalidate`.
- A self-only CSP allows only the Sociobot billing API connection. Azure's `.webmanifest` MIME map now serves `/manifest.webmanifest` as `application/manifest+json`.

Exact regressions live in `tests/e2e/app.spec.ts` and `tests/deployment.test.ts`. The UI regression uses the verifier's 80-character value and exact 1440px/390px viewports, checks heading/card bounds and page width, and measures every card action.

## Verification

Run from a clean checkout:

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
```

Final evidence on August 28, 2026 UTC:

- Clean install: 60 packages installed; 0 vulnerabilities.
- Unit/integration: 7 Vitest tests passed, including three response-policy tests.
- Browser: 12 Playwright tests passed across desktop Chromium and Pixel 5 projects.
- Type check: `npx tsc --noEmit` passed. This repository has no separate lint script.
- Production build: `dist/index.html` present; JavaScript 34,638 bytes (11.21 KB gzip), CSS 17,563 bytes (4.72 KB gzip), largest WebP 20,102 bytes. No web-font payload.
- Live populated browser audit: no console/page errors; only the product origin was requested; body text is 16px; 390px document width is exactly 390px.
- Keyboard: Tab order reaches Skip to records → Data & license → Add card; Enter opens the record dialog and focuses Card name.
- Accessibility: populated Playwright axe scan found zero serious/critical violations. `verify-url.sh` found a title, `lang=en`, one h1, one main, complete image alts, labeled buttons, and zero console errors.
- Motion: reduced-motion mode reports 0.01ms transitions and automatic scrolling.
- Offline: after service-worker control, a true offline reload retained the shell, offline banner, and IndexedDB record.
- Update: a same-origin revision change activated a new worker and showed `A fresh version is ready.` with a visible Reload action.
- Lighthouse 13 live mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.99s, LCP 1.03s, TBT 40ms, CLS 0.00012.
- Privacy: the full create/read/offline flow made only same-origin requests. There are no analytics, CDN fonts, trackers, or third-party scripts.
- Billing API: invalid verification returned exact ACAO `https://home-care-evidence.sociobot.in`, `Cache-Control: no-store`, and valid JSON. A fresh burst first returned 429 at request 30 with `Retry-After: 4`. Checkout returned 303 to the hosted merchant page.
- Package/consumer checks: not applicable; this is a static PWA with no published package surface.

## Deployment and identity

- Deployment class: unchanged `pwa-offline`, static Azure Static Web Apps deployment from `dist/`.
- Live URL: https://home-care-evidence.sociobot.in
- Azure deployment ID: `e3e91c70-9fd7-4666-86fe-c287b246b72e` (Succeeded).
- Repair commits: `022139b` (UI, regressions, cache/CSP policy) and `4c08c21` (Azure manifest MIME mapping).
- Live/local SHA-256 matches:
  - `index.html`: `2fada4721a6a868b1531237d93ea645b2e36fbb107b6bad3b7954cc23d07f13f`
  - `index-DBXGRuJj.js`: `05e271cf6f50ed3d1d7dbfa4cb97fc2d4518eee95406cb948adda36d65054f19`
  - `index-DywxDC-C.css`: `a4ae83f8bbba6df49d96bbcef9b061db6eacc6ed0aa1d41c206dbfc32f32e3c8`

## Known gaps

- There is intentionally no cloud sync or account recovery. Browser/site-data deletion can remove records, so users should export backups.
- Encrypted archive passphrases cannot be recovered by design.
- Browser and printer pagination can place very long histories on more than one printed page.
- HEIC preview support depends on the browser; HEIC files still store and export.
