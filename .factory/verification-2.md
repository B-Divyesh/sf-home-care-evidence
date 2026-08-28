# Verification report 2 — FAIL

**Work order:** `home-care-evidence-verify-2`  
**Candidate tested from a clean detached worktree:** `38ea71f6b16f27a05d6ffda07d13c3cf38f6c0ac` (`test: verify offline, accessibility, and paid unlock`)  
**Live URL:** https://home-care-evidence.sociobot.in  
**Verified:** 2026-08-28 UTC  
**Verdict:** **FAIL** — the core PWA is strong and the earlier deployment-only rate-limit failure no longer reproduces, but a valid boundary-value card title is clipped and three mobile card actions miss the required 44px touch-target minimum.

This is a fresh independent report. It supersedes the rate-limit result in `verification.md`: the same production billing endpoint now rate limits correctly.

## Release-blocking defects

### High — valid 80-character card names are not readable

`Card name` permits 80 characters. I created a card whose title was 80 unbroken `A` characters, an allowed value. At a 1440px viewport, its heading extended from the card's usable area to `x=2275`; the card's right edge was `x=1371`. The document did not horizontally scroll (`scrollWidth=1440`), so the title was visibly clipped rather than wrapping or remaining recoverable. The same CSS has no `overflow-wrap`/word-break rule for card headings, so this also affects narrow screens.

This fails the requested boundary-value exercise and the product's core handoff/retrieval goal: valid record context can become unreadable. The desktop screenshot used for this check showed the clipped title.

### Medium — mobile maintenance-card controls are 42px tall

At a real 390×844 CSS-pixel mobile viewport, after creating a card, these visible controls measured 42px tall:

- `Add completed work` — 176×42px
- `Print one-page history` — 189×42px
- `Edit card` — 93×42px

The contract and supplied accessibility/design rules require touch/click targets of at least 44×44px. This comes directly from `.card-actions .button { min-height: 42px; }` and is reproducible in the candidate build.

## Deployment / policy findings

### Low — hashed assets are not given immutable browser caching

Live HTML, JS, CSS, service worker, images, and icons use `Cache-Control: public, must-revalidate, max-age=30`. In particular fingerprinted `/assets/index-CKfv68G4.js` and `/assets/index-DOZbSHbB.css` lack a long immutable lifetime. The service worker precache means offline use still passed, but this misses the supplied PWA caching policy for immutable hashed assets.

### Low — hardening headers and manifest MIME can improve

The live site has HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, and DNS-prefetch control, but no `Content-Security-Policy`. Also, `/manifest.webmanifest` is served as `application/octet-stream` rather than `application/manifest+json`. Chromium successfully parsed the manifest, so this is not the cause of the verdict, but both are deployment hardening gaps.

## Fresh evidence that passed

### Clean local quality gates

- `npm ci` passed from the clean candidate worktree; audit: 0 vulnerabilities.
- `npm test` passed: 4 Vitest unit tests and 10 Playwright tests (desktop Chromium and Pixel 5).
- `npx tsc --noEmit` passed. `package.json` has no lint script.
- Exact production build `npm run build` passed and produced `dist/`.
- Produced payload: JS 34,638 bytes (11.21 KB gzip), CSS 17,499 bytes (4.71 KB gzip), largest WebP 20,102 bytes, no web-font payload — all within 200/50/300 KB budgets.

### End-to-end product exercise

- Verified native required-field rejection and recovery; empty new-card form was invalid.
- Created a full maintenance card containing observed issue, 120-year boundary recurrence, leap-day completed date, completed-work note, PNG proof, and PDF receipt.
- A 10 MiB + 1 byte attachment failed with the actionable alert `too-large.png is larger than 10 MB. Choose a smaller file.` Replacing it with a small file let the same form save successfully.
- Expanded evidence/history, confirmed two attachments render, exported open JSON, and confirmed both attachment names are present in the archive.
- Verified search no-results state and Clear filters recovery.
- Confirmed injected `<script>` text was rendered as text, not executed.
- Desktop keyboard smoke test: 3px solid focus ring, Enter opens the dialog, and initial dialog focus lands on Card name. The mobile Tab sequence reached summary, all card actions, footer legal links, and toast dismissal with visible focus.
- At 390px the page itself had no horizontal page overflow (`scrollWidth=390`, body 16px); the visible target-size issue above is the exception.
- `prefers-reduced-motion: reduce` reduced animation and transition durations to 0.01ms.
- Independent axe scans on a populated desktop card and live empty state returned **zero serious or critical findings**. There were no browser console errors or page errors.

### PWA, privacy, and payments

- With the installed service worker controlling the page, an offline reload retained the shell, visible offline banner, and IndexedDB card.
- An independent same-origin update-server exercise changed only the served worker revision: a new worker activated and the candidate showed `A fresh version is ready.` with a `Reload` action. No product source was changed for the test.
- Normal live use made requests only to `https://home-care-evidence.sociobot.in`; source/runtime inspection found no analytics, trackers, third-party scripts, or CDN fonts. Records and attachments are local IndexedDB data; the only external product call is explicit Sociobot billing verification/checkout.
- Live billing verification with `Origin: https://home-care-evidence.sociobot.in` returned the exact ACAO origin and `Cache-Control: no-store`. There is no sign-in, so no non-Sociobot identity provider is present.
- Fresh rate-limit burst: 29 sequential invalid-license verification requests returned 200; request **30** returned **429** with `Retry-After: 3` and `x-ratelimit-after: 3`. This satisfies the work-order rate-limit requirement and corrects the earlier report's stale deployment evidence.

### Deployment identity and basic response checks

- The live `/`, JS, and CSS byte-match the candidate production build:
  - `index.html`: `bbf1302ec6afade4bc9d202800f0ab80ab4681bab00291d69ed50f12e0d7e1f9`
  - `index-CKfv68G4.js`: `da54e4f2979673d4c2922e7e83babefeed74e5748f420e0470d9410ed42878ab`
  - `index-DOZbSHbB.css`: `af54025278229da3aabe5e1d178a1e03da05088b6329d313b8acdc0b9a101a18`
- `sw.js` has the same generated inventory/logic after normalizing its intentionally variable `Date.now()` cache-version timestamp.
- Live `/privacy` and `/terms` returned 200. The live app has title, `lang=en`, exactly one `h1`, exactly one `main`, useful image alt text, manifest fields, and no console errors.

## Required remediation before PASS

1. Make user-entered card titles wrap/break safely (including unbroken 80-character values) without obscuring card content at desktop or 390px.
2. Restore the 44px minimum for all maintenance-card action controls.
3. Configure immutable long-lived caching for hashed `/assets/*`; retain an appropriate short/no-cache policy for HTML and the service worker.
4. Add a restrictive static-site CSP and serve the manifest as `application/manifest+json`.

Re-run this verification after items 1 and 2. The API rate-limit finding needs no product change at the observed deployment state.
