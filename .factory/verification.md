# Verification report — FAIL

**Work order:** `home-care-evidence-verify-1`  
**Candidate:** `38ea71f6b16f27a05d6ffda07d13c3cf38f6c0ac` (`test: verify offline, accessibility, and paid unlock`)  
**Live URL:** https://home-care-evidence.sociobot.in  
**Verified:** 2026-08-28 UTC  
**Verdict:** **FAIL** — the app is functionally strong, but the required product-unlock endpoint does not demonstrate rate limiting.

## Release-blocking defect

### High — license verification endpoint is not rate limited

`GET https://api.sociobot.in/api/v1/products/home-care-evidence/verify?license=verification-nonsecret-invalid-token` returned `200 {"valid":false,"reason":"invalid"}` for **all 60** rapid requests (30 concurrent workers; completed in 3.6 seconds). No response was `429` and no `Retry-After` header was returned. Observed threshold: **none through 60 requests**.

The work order explicitly requires an API endpoint, including product-unlock calls, to begin returning `429` with `Retry-After` under a burst. This is a factory billing API/deployment issue rather than product-source code in this repository, but it is an acceptance-contract failure and prevents release approval.

## Other defects

### Medium — fingerprinted production assets are not cached immutably

The live JS, CSS, service worker, images, icons, and HTML all respond with `Cache-Control: public, must-revalidate, max-age=30`. In particular, immutable fingerprinted assets `/assets/index-CKfv68G4.js` and `/assets/index-DOZbSHbB.css` receive only a 30-second browser cache lifetime and no `immutable` directive. This misses the PWA performance/caching policy for long-lived immutable hashed assets. The service worker still precaches the shell, so offline use works.

### Low — no Content-Security-Policy response header

Live responses include HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, and DNS-prefetch control, but no `Content-Security-Policy`. A restrictive self-only CSP is feasible for this static, self-hosted app and would better enforce its no-third-party-runtime privacy posture.

## What passed

### Reproducible local quality gates

- Clean worktree was exactly the candidate commit before reporting changes.
- `npm ci`: passed; audit reported 0 vulnerabilities.
- `npx tsc --noEmit`: passed. No separate lint script exists in `package.json`.
- `npm test`: passed — 4 Vitest unit tests and 10 Playwright tests across Chromium desktop and Pixel 5.
- Exact production command `npm run build`: passed and emitted `dist/`.
- Build payload: JS 34,638 bytes (11.21 KB gzip), CSS 17,499 bytes (4.71 KB gzip), largest shipped WebP 20,102 bytes, no font payload. All are within 200 KB JS / 50 KB CSS / 300 KB mobile-image budgets.
- Local mobile Lighthouse 13: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.1 s, TBT 0 ms, CLS 0.

### Independent product exercise

- Created a maintenance card with observed issue, DIY/vendor work note, recurrence, photo proof, and PDF receipt; expanded its history and verified the attachments render.
- Open JSON export contained the card and both attachments with their names, kinds, and base64 payloads.
- Added service history and verified recurrence uses the latest service entry. Leap-day 2024-02-29 plus one year correctly produced 2025-02-28.
- Boundary checks: interval `0` is rejected by native min validation; `120` is accepted. A 10 MiB + 1 byte attachment produced the explicit error `oversize.jpg is larger than 10 MB. Choose a smaller file.` Removing that file and submitting again saved the card successfully.
- Injected eight local cards and attempted a ninth: the Data & license dialog opened and announced `The free logbook holds 8 cards. Unlimited removes the card limit.`
- Keyboard-only smoke test: Tab reached the skip link, settings, and Add card; Enter opened the modal; focus entered the card-name field; Escape closed it. Designed 3px orange focus ring was visible. Native dialog behavior provided no trap in this smoke test.
- Desktop 1440px and mobile 390px checks found no horizontal overflow, clipped primary action, or console/page errors. Mobile primary controls measured at least 44px high.
- `prefers-reduced-motion: reduce` reduced transition/animation duration to 0.01ms and set document scrolling to `auto`.
- Independent axe scan after record creation found zero serious or critical violations; repository axe checks also passed in empty and dialog states on both configured device profiles.

### PWA and privacy

- Service worker controlled the production build; after caching, a true offline reload retained the shell, offline banner, and locally stored card.
- Update handling was independently simulated with a same-origin test server: a new worker activated, delivered `SW_UPDATED`, and displayed `A fresh version is ready.` plus a Reload action. No app source was changed.
- The live site also completed a service-worker-controlled offline reload at 390px with one `<h1>`, one `<main>`, no overflow, no console/page errors, and no failed requests.
- Fresh normal use made no third-party requests. Source and runtime inspection show no analytics, advertising, CDN fonts, or external scripts; record data is in IndexedDB. The only external application call is the explicit Sociobot license verification/purchase path.
- With the live origin supplied, verification CORS was correctly restricted to `Access-Control-Allow-Origin: https://home-care-evidence.sociobot.in`; the response was `Cache-Control: no-store`. No sign-in implementation exists.

### Deployment identity and response checks

- Live `/` SHA-256 exactly matched `dist/index.html`: `bbf1302ec6afade4bc9d202800f0ab80ab4681bab00291d69ed50f12e0d7e1f9`.
- Live candidate asset hashes exactly matched the local build for JS, CSS, offline page, and both icons. Live manifest also matched exactly.
- The generated service-worker body/precache inventory matched the candidate build. Its `VERSION` differs only because the candidate's postbuild step intentionally uses `Date.now()`; it is not a reproducible byte-for-byte artifact.
- Live direct `/privacy` and `/terms` returned 200 and rendered their intended title, one heading, and main landmark. Response headers confirmed HTTPS/HSTS, referrer policy, and MIME sniffing protections.

## Required remediation before a PASS

1. Add a rate limiter to the Sociobot verification endpoint that returns `429` and a meaningful `Retry-After` under a rapid burst; retest and record the observed threshold.
2. Configure deployment caching so hashed `/assets/*` receive a long immutable lifetime (for example, `public, max-age=31536000, immutable`), while HTML and `sw.js` remain short/no-cache as appropriate.
3. Add a restrictive Content-Security-Policy for the static site, allowing the required Sociobot API connection only when license verification is used.

