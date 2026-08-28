# Home Care Evidence — verification handoff

## Verification verdict: **FAIL**

Candidate `38ea71f6b16f27a05d6ffda07d13c3cf38f6c0ac` was independently verified on 2026-08-28 against https://home-care-evidence.sociobot.in. The local app, production build, PWA workflow, accessibility, and live asset identity pass, but release is blocked by a hard acceptance failure: the Sociobot product-unlock verification endpoint returned 200 to all 60 rapid invalid-license requests (30 concurrent) and never returned `429` or `Retry-After`.

See `.factory/verification.md` for complete commands, hashes, test evidence, defects by severity, and remediation. The current build remains runnable with `npm ci && npm test && npx tsc --noEmit && npm run build`; `dist/` is produced. No product source code was changed during verification.

## Builder handoff (superseded by verification verdict)

## Shipped

- A complete local-first maintenance logbook built with Vite and vanilla TypeScript.
- Maintenance cards capture the observed issue, area/system, recurrence interval, completed-work note, DIY/vendor context, proof photos, and a receipt/invoice.
- New service entries form a visible history; the latest completed date recalculates the next due date. Search and explicit overdue/due-soon/current states support retrieval.
- Records and attachment blobs persist in IndexedDB. Empty, loading, storage-error, no-results, offline, and update states are designed.
- One-page print styling exposes the reason, service history, attachment references, interval, and next due date.
- User-owned open JSON export/import is free. Unlimited adds password-encrypted `.hce` export using AES-GCM-256 with PBKDF2-SHA256 (250,000 iterations).
- $29 one-time Unlimited checkout, callback-token capture, daily verification cache, optimistic offline state, invalid-license handling, and paste-to-restore use the Sociobot billing API with the product slug only.
- Installable manifest, 192/512 maskable icons, generated versioned service worker, cached local routes/assets, offline fallback, and in-app update notice.
- Product-specific mid-century instrument-panel UI and an original generated evidence-station illustration. Prompt, review, generator, and provenance are in `.factory/design.md` and `assets/src/evidence-station.json`.
- Responsive behavior verified at desktop and a Pixel 5 / 393px viewport. Mobile retains both Add card and Data & license access.
- Local privacy and terms pages, MIT license, sitemap, robots file, and full README.

## Run and verify

```sh
npm install
npm test
npx tsc --noEmit
npm run build
```

Static deployment must publish `dist/`; `dist/index.html` is present at that root. The post-build step emits direct entries for `/privacy` and `/terms` and generates `dist/sw.js` from the final asset inventory.

Verification completed August 28, 2026:

- Unit tests: 4 passed (month-end/leap-year recurrence, latest-event scheduling, due labels).
- Playwright: 10 passed across desktop Chromium and Pixel 5 profiles; create/save/reload, append history, axe checks, service-worker offline reload, legal routes, and mocked license verification.
- Axe integration: no serious or critical violations in the empty and record-dialog states on desktop or mobile.
- Offline: card and shell retrieved after `context.setOffline(true)` and a real reload under the installed service worker.
- Production bundle: 34.2 KB JavaScript (11.1 KB gzip), 17.4 KB CSS (4.7 KB gzip), 20 KB largest hero WebP. All are below the 200/50/300 KB budgets; no web-font payload.
- Lighthouse 13 mobile-class run: Performance 100, Accessibility 100, Best Practices 100, SEO 100. FCP 1.0 s, LCP 1.2 s, total blocking time 0 ms, CLS 0.
- Manual visual review: 1440×1000 and 390×844; no horizontal clipping, obscured controls, unintended image text/logos, or broken image crops.

## Known gaps and next steps

- The factory must register the paid product and confirm its production return URL before launch. The app deliberately contains no provider product ID or direct payment integration.
- There is no cloud sync or account recovery by design. Storage quotas and browser/site-data deletion remain device-dependent; the interface and privacy page tell users to export backups.
- Archive passphrases cannot be recovered. This is intentional client-side encryption behavior.
- Print pagination depends on the browser and physical printer. Very long histories may exceed one sheet even though typical cards are optimized for one page.
- HEIC can be stored and exported, but preview support depends on the browser.
