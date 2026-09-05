# Verification 5 — keep home repair proof ready

**Work order:** `home-care-evidence-verify-5`  
**Live URL:** <https://home-care-evidence.sociobot.in>  
**Implementation reviewed:** `a80ebc826aed82a0b2352c6e38b99d2ff274d83b`  
**Documentation baseline:** `d57804abb5ea01c5ae6a5cb44e632d19f4be3ffb`  
**Deployment:** `c3664506-7801-4f03-9700-1084fa364c55`  
**Verified:** 2026-09-05 UTC  
**Verdict:** **FAIL — 2 findings, 0 untested public claims.**

The implementation is functionally complete and the live files byte-match the reviewed build. Two site-contract details remain: one checkout-adjacent link is too short for the required phone touch target, and the required SVG favicon plus 180 px Apple touch icon are absent.

## Cold first read and sample

Before scrolling in fresh 1440×1000 and 390×844 browser profiles, the page stated:

- Job: **Keep home repair proof ready**.
- Audience and result: **For homeowners who need household members to understand past work and the next due date.**
- First action: **Try it with sample data**.
- Click result: **Opens three editable sample cards.**

The primary action ended at 532 CSS px on desktop and 530 CSS px on the phone, so both were visible before scrolling. Three short facts covered offline use, local storage, and the free/paid limit.

One click opened `/demo`. The persistent label read **Demo — sample data, nothing is saved**. The three populated cards were Water heater flush, Attic hatch weather seal, and Dryer vent cleanout. Expanded water-heater evidence showed Northside Plumbing, `plumber-receipt.pdf`, and Aug 18, 2027.

In the disposable profile, a real card named `Real household boiler record` was saved before opening the demo. Deleting a sample reduced the demo to two cards. **Reset demo** restored all three. **Start for real** returned to the unchanged real card, with no sample record copied into real storage.

## Findings

### Medium — the purchase-terms link misses the required phone touch size

At 390×844, the visible **purchase terms** link in the paid section measured **77.109×14 CSS px**. Its width is sufficient, but its clickable height is 30 px below the attached 44×44 px minimum. The surrounding sentence is not linked, so there is no larger activation area.

This link sits beside payment and refund information, where reliable touch access matters. Every other visible link, button, input, select, and disclosure in the populated phone demo met 44×44 px in the same measurement.

Evidence: `/work/.evidence/verify-5/live-browser.json` and `/work/.evidence/verify-5/phone-demo.png`.

### Low — the required favicon and Apple touch icon variants are missing

The site-structure contract requires an SVG favicon and a 180 px Apple touch icon. The document instead points both `rel="icon"` and `rel="apple-touch-icon"` to `/icon-192.png`. The repository and live site have 192×192 and 512×512 PNG PWA icons, but no SVG favicon and no 180×180 Apple touch icon.

The existing PWA icons load and the manifest is valid, so this does not block installation. It remains a missing required site artifact.

## Declared claims

A new clone at documentation SHA `d57804a` was installed with `npm ci`. Every exact `test` command in `.factory/claims.json` was then run separately. Each command passed in desktop Chromium and the configured 390 px mobile project.

| Claim | Result and observed coverage |
| --- | --- |
| `card-records` | PASS — complete card, reload, added work, and history |
| `offline-reload` | PASS — offline note and receipt saved and survived offline reload |
| `demo-isolation` | PASS — real record stayed hidden and unchanged |
| `recurrence-latest` | PASS — latest work changed the next due date |
| `search-filter` | PASS — text/status filters and empty-result recovery |
| `local-privacy` | PASS — sample workflow allowed only the product origin |
| `open-export` | PASS — all sample records, notes, and named attachments |
| `print-history` | PASS — one selected print target with full expanded history |
| `free-limit` | PASS — free ninth card blocked; cached valid license saved it |
| `encrypted-archive` | PASS — documented envelope and attachment round trip |
| `license-cache` | PASS — current verdict caused no verification request |
| `attachment-limit` | PASS — 10 MiB accepted; 10 MiB plus one byte rejected |
| `archive-passphrase` | PASS — 9 characters rejected; 10 accepted |
| `passphrase-private` | PASS — no request or stored value after reload |
| `import-safety` | PASS — invalid branded archive preserved all cards |
| `delete-card` | PASS — cancellation, confirmation, and reload persistence |
| `license-removal` | PASS — license keys cleared while cards remained |

The live landing page, legal pages, settings copy, and README were cross-checked against the manifest. No missing, false, incomplete, or untested public claim was found. **Untested public claim count: 0.**

## Clean-checkout quality gates

```text
npm ci                 PASS — 60 packages, 0 vulnerabilities
17 claim commands      PASS — 34 browser runs total
npm test               PASS — 10 Vitest tests and 56 Playwright runs
npx tsc --noEmit       PASS
git diff --check       PASS
npm run build          PASS — dist/ produced
```

The production build contains 46,640 bytes of JavaScript (14.54 kB gzip), 20,635 bytes of CSS (5.26 kB gzip), a 20,102-byte largest WebP, and no web-font payload.

## Live behavior, accessibility, privacy, and PWA

- Normal, required-field, malformed-import, boundary, deletion, license, and recovery paths passed through the full suite and independent live checks.
- The phone layout had no horizontal overflow and used a 16 px body font. Visual review found no clipping or overlap.
- At 200% text size, the populated demo retained all three cards and controls without horizontal overflow or lost content.
- The first Tab reached **Skip to records**; Enter focused `<main>`. Opening the card dialog focused Card name, and Escape restored the Add card trigger.
- The visible focus outline measured 3 px in signal orange. Reduced motion produced `0.00001s` animation and transition durations with automatic scrolling.
- Playwright axe returned zero violations on Home, expanded Demo, Privacy, Terms, and the designed 404.
- `/privacy` and `/terms` returned 200 with route-specific titles, one H1, and one main. History navigation focused and announced the new H1; back navigation restored route and focus.
- `/verification-5-missing` deliberately returned HTTP 404 with the designed not-found page. This expected response is not a defect.
- All discovered internal links returned 200. Generated attachment links worked as blob downloads. The explicit mail link was valid. Checkout returned 303 to the hosted checkout.
- A fresh live home/demo flow contacted only `https://home-care-evidence.sociobot.in`. No analytics, trackers, CDN fonts, or third-party runtime scripts appeared.
- The service worker controlled the demo. After going offline, a new work note and PDF receipt saved and survived another offline reload. The update event displayed **A fresh version is ready** and a Reload action.
- Invalid live license verification failed softly. **Remove saved license** removed the product-scoped demo license while preserving all three cards. A real purchase was not performed.
- The billing verification endpoint allowed 30 rapid invalid checks; request 31 returned 429 with `Retry-After: 4`. A later normal response used exact-origin CORS and `Cache-Control: no-store`.
- Live mobile Lighthouse 13 scored **100 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO**. FCP was 0.956 s, LCP 1.052 s, TBT 0 ms, and CLS 0.00012.

This is a static local-first PWA. Backend tenancy, SQLite restart persistence, and server concurrency checks do not apply.

## Live identity and response policy

The live deployment byte-matches the implementation build:

| File | Local/live SHA-256 |
| --- | --- |
| `index.html` | `51fb1ebc639d79ae7954ff29713674142bb78459793814429016c77389069254` |
| `assets/index-B-QO5Lkd.js` | `8b89575c41406a581f9f52d77c5acb92675b776ca9e98c008a39d92e0fefc5d7` |
| `assets/index-D_nOiQ42.css` | `b1eafec4c52f824e8dc23a89502fbe53f4fe83d80322154bc7da7e429c6d0ca9` |

HTML revalidates. Hashed assets use one-year immutable caching, `sw.js` uses no-store, and the manifest is served as `application/manifest+json`. Live responses include HSTS, `nosniff`, strict-origin referrer policy, a restrictive permissions policy, and a CSP limited to self plus the Sociobot billing API connection.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Billing verification lacked 429/Retry-After | Resolved — request 31 returned 429 with `Retry-After: 4` |
| Hashed assets lacked immutable caching | Resolved live |
| CSP was missing | Resolved live with no violations |
| Manifest MIME was incorrect | Resolved live |
| Valid 80-character titles clipped | Resolved by both browser projects |
| Card actions were below 44 px | Resolved; all card actions met the minimum |
| Claims manifest and demo were missing | Resolved; 17 complete claims and isolated sample flow |
| Cold read did not state job, audience, and action | Resolved before scrolling on phone and desktop |
| Malformed import destroyed valid records | Resolved; invalid import preserved all records |
| Footer legal links were undersized | Resolved; both measured at least 44×44 px |
| Metadata, copy audit, footer identity, and designed 404 were missing | Resolved except for the icon variants reported above |
| Expanded card had a nested landmark issue | Resolved; zero axe violations |
| Nine public promises lacked full claim coverage | Resolved; all nine have outcome-based declared coverage |
| Privacy promised license removal without a control | Resolved and tested live |
| Route changes did not focus or announce the H1 | Resolved with History API navigation |
| Landing page omitted the exact paid tier | Resolved in the required order |
| Decorative labels and incomplete copy audit | Resolved; shipped copy is direct and audited |

## Evidence

Evidence is under `/work/.evidence/verify-5/`:

- `live-browser.json` — desktop, phone, keyboard, route, axe, offline, privacy, and license observations
- `links.json` — discovered-link statuses
- `lighthouse.json` — live mobile Lighthouse result
- `desktop-home.png`, `desktop-demo.png`, `phone-home.png`, `phone-demo.png`, `phone-offline.png`, `text-resize-200.png`
- `verify.json` — worker URL check

## Final decision

**FAIL — 2 findings and 0 untested public claims.** The product behavior, declared claims, live identity, accessibility scan, offline flow, and performance gates pass. The report cannot declare PASS while the 44 px touch-target and required icon-variant contracts remain unmet.
