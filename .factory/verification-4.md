# Verification report 4 — PASS

**Work order:** `home-care-evidence-verify-4`  
**Candidate:** `81b545d50cd1812a44fef95dbcba39ae572f477a`  
**Live URL:** <https://home-care-evidence.sociobot.in>  
**Verified:** 2026-08-28 UTC  
**Verdict:** **PASS**

This is an independent verification from a clean checkout. The live product byte-matches the candidate production build. No release-blocking defects were found.

## Cold first read

A fresh desktop visit plainly says: **“Keep home repair proof ready.”** It says this is for homeowners who need household members to understand past work and the next due date. The first primary action is **“Try it with sample data”**, with the immediate outcome, “Opens three editable sample cards.” It also gives three short facts: offline after first visit, local records unless exported, and the 8-card/$29-once offer.

The click opens `/demo` with three realistic cards (water-heater flush, attic-hatch weather seal, dryer-vent cleanout), a persistent **“Demo — sample data, nothing is saved”** banner, Reset demo, and Start for real. `.factory/demo.md` documents the `demo:home-care-evidence` IndexedDB namespace and `demo:` localStorage namespace.

## Required clean-checkout gates

```text
npm ci                 PASS — 60 packages installed; 0 vulnerabilities
npm test               PASS — 10 Vitest tests and 40 Playwright tests
npx tsc --noEmit       PASS
git diff --check       PASS
npm run build          PASS — dist/ produced
```

There is no configured lint script. Production bundle sizes: JavaScript 44,387 bytes / 14,015 bytes gzip (≤200 KB); CSS 19,958 bytes / 5,124 bytes gzip (≤50 KB); largest product WebP 20,102 bytes; no web-font payload.

## Claims manifest and demo evidence

`.factory/claims.json` exists and declares 11 claims. Each exact command was run from the clean install through the demo entry point; all passed in both desktop Chromium and the configured mobile project. The subsequent full `npm test` also passed all 40 browser tests, including every tagged claim.

| Claim | Result |
| --- | --- |
| `card-records` | PASS — create, reload, and append completed work |
| `offline-reload` | PASS — offline reload retains shell and sample card |
| `demo-isolation` | PASS — real IndexedDB record stays separate and returns on demo exit |
| `recurrence-latest` | PASS — latest completed work controls next due date |
| `search-filter` | PASS — finds a record and Clear filters recovers the list |
| `local-privacy` | PASS — demo flow makes only same-origin requests |
| `open-export` | PASS — JSON includes all three sample records, known note, and named attachments |
| `print-history` | PASS — only selected card is marked for print with expanded history |
| `free-limit` | PASS — ninth card shows exact 8-card / $29-once offer |
| `encrypted-archive` | PASS — AES-GCM-256/PBKDF2-SHA256, 250,000 iterations, no plaintext note |
| `license-cache` | PASS — current cached verdict makes zero verification calls |

## Independent product, accessibility, and PWA checks

- Exercised create/persist/history, search and empty-result recovery, data export, native required-field rejection, legal routes, 404 route, keyboard navigation, reduced motion, and the 390px responsive layout. Existing test coverage also passed malformed-import preservation, 80-character card title, touch sizes, returned-license flow, and service-worker update behavior.
- Live `/demo` was checked at 1440px and 390px: 3 cards, one H1/main, no horizontal overflow, and Privacy/Terms controls are exactly 44×44px. Visual review shows no clipping or overlap.
- Keyboard: first Tab lands on Skip to records; Enter moves focus to main; dialog opening focuses Card name; Escape restores trigger focus. Focus indicators are visible.
- Live axe scans at desktop and 390px found **zero serious or critical violations**. Home, demo, Privacy, and Terms each have one H1/main, route title, `lang=en`, and no console/page errors. The designed 404 correctly returns HTTP 404; Chromium logs that expected failed navigation response.
- With `prefers-reduced-motion: reduce`, animation and transition durations are `0.00001s` and scroll behavior is `auto`.
- The PWA manifest is valid for standalone installation with 192/512 maskable icons and versioned start URL. After service-worker control, a live 390px offline reload showed the offline status and all three sample cards. A controlled `SW_UPDATED` event displays “A fresh version is ready.” and Reload.

## Privacy, live identity, response policy, and billing API

The local production build and live deployment match byte-for-byte:

| File | SHA-256 |
| --- | --- |
| `index.html` | `9b874c8585d83b48df52dd894325ea6d8410edfd35cd2670ac563dc3be313456` |
| `assets/index-DfIvsMKt.js` | `dfc2e571299659a3e3b0e3823a1c69d9fe68fceffb3fdf7d159007a20a281399` |
| `assets/index-BBe8M6tt.css` | `1a72cfb5f5075e27af94a467912e5cae5857a0fcdabadb672c1f17e4f68be688` |

- A cold live home/demo flow requested only `https://home-care-evidence.sociobot.in`; no analytics, trackers, third-party scripts, or CDN fonts were observed. Source review confirms the only external runtime URL is the Sociobot license-verification API.
- Live `/`, `/demo`, `/privacy`, and `/terms` return 200; unknown route returns 404. The internal links return 200, and checkout returns 303 to hosted Dodo checkout.
- Responses provide HSTS, `nosniff`, strict-origin referrer policy, restrictive permissions policy, and a CSP limited to self plus `https://api.sociobot.in` for connection. HTML revalidates; hashed assets are immutable for one year; `sw.js` is `no-cache, no-store, must-revalidate`; manifest content type is `application/manifest+json`.
- Invalid license verification returns JSON with exact ACAO for the live origin and `Cache-Control: no-store`. A rapid sequential burst of 45 verification requests returned 200 for requests 1–30 and **429 with `Retry-After: 4`** starting at request **31** (later 429s used `Retry-After: 3`). No sign-in is present, so the Entra requirement does not apply.

## Defects by severity

- **Critical:** none.
- **High:** none.
- **Medium:** none.
- **Low:** none.

## Scope notes

This is a local-first static PWA, not a library/CLI/backend. Consumer-package, server persistence/concurrency, and sign-in checks are not applicable. The intended limits remain: no cloud sync/account, browser-site-data clearing requires an export for recovery, and encrypted archive passphrases cannot be recovered.
