# Home Care Evidence — review handoff

## Strict review 1 update — FAIL

Review `home-care-evidence-review-1` completed on 2026-09-05 against candidate `81b545d50cd1812a44fef95dbcba39ae572f477a` (last code-changing SHA `4e9525f9e2fdbccc36706ad2132933d5b433ec43`; documentation baseline `797e1505c64b0cd9c5402f6c12c30455829bbee0`). Live HTML, JavaScript, and CSS still byte-match the production build.

The clean install, all 11 declared claim commands, full 10-unit/40-browser test suite, TypeScript check, and production build pass. Fresh desktop and phone review also passed the cold read, one-click sample, demo isolation/reset, normal and invalid workflows, import preservation, keyboard, zero-violation axe scans, reduced motion, offline reload, update notice, privacy/network review, response policy, and the billing rate limit at request 31.

The strict verdict is nevertheless **FAIL** with 5 findings and 9 untested public claims. The declared tests omit stronger public promises, including offline attachment writes and licensed limit removal; Privacy promises a stored-license removal control that is absent; route changes do not focus/announce the new H1; the required landing-page paid section is absent; and decorative instrument-panel metaphors remain in shipped copy and outside the copy audit. Product code was not changed under the review work order. See `.factory/review-1.md` for exact evidence and remediation scope.

## Historical independent verification update — PASS (superseded)

Candidate `81b545d50cd1812a44fef95dbcba39ae572f477a` **PASSed** independent clean-checkout and live-deployment verification on 2026-08-28 UTC. The live HTML, JS, and CSS byte-match the candidate build. All 11 required claims passed via the isolated `/demo` flow; `npm test`, `npx tsc --noEmit`, and `npm run build` passed. Live desktop/390px, axe, keyboard, offline reload, service-worker update, privacy/network, response-policy, and billing rate-limit checks passed. The verification API first returned `429` with `Retry-After: 4` on burst request 31. That report recorded no open defects; strict review 1 above supersedes its release verdict. See `.factory/verification-4.md` for exact commands, hashes, and evidence.

## Outcome

All release-blocking findings in verifier report commit `36362ed0bbab5696977883d4de5fa6edcceba105`, against candidate `28769e1220e25a318bacffc745294b7ae4f4dca8`, are repaired. Repair commit `4e9525f` is pushed to `main` and deployed at <https://home-care-evidence.sociobot.in>.

Deployment ID: `f9758c3d-aabe-4e38-9a29-2e91e9c89529` (Succeeded).

## Repairs

- Added `.factory/claims.json` with 11 visitor-facing claims. Each claim maps to exactly one `@claim:<id>` browser test and every declared command passed from the demo entry point.
- Added one-click `/demo` and `?demo=1` entry points with three realistic maintenance cards, a persistent demo banner, Reset demo, and Start for real.
- Isolated demo records in IndexedDB `demo:home-care-evidence` and demo licenses under `demo:` localStorage keys. The isolation regression seeds a real record, enters and exits demo, and confirms the real record is untouched.
- Replaced the product-name H1 with the job-focused `Keep home repair proof ready`, named homeowners and household members, explained the first click, and added three plain facts.
- Rebuilt archive parsing as complete nested validation for card, event, attachment, date, interval, identifier, encryption, and payload fields. Validation now finishes before confirmation or any IndexedDB write. The exact malformed-but-parseable archive regression confirms no prompt, no replacement, and survival after reload.
- Enlarged footer links to 44×44px minimum and added a 390px measurement regression.
- Added `.factory/demo.md`, `.factory/copy-audit.md`, canonical/Open Graph/Twitter metadata, a 1200×630 product-art social image, Apple touch metadata, `/demo` sitemap discovery, build identity, and a designed 404 response.
- Removed the nested complementary landmark that caused the moderate axe result and retained the existing 80-character title, card-action sizing, CSP, manifest MIME, and immutable asset-cache repairs.

## Verification

Run from a clean checkout:

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
```

Evidence recorded on August 28, 2026 UTC:

- Clean install: 60 packages installed; 0 vulnerabilities.
- Unit/integration/config: 10 Vitest tests passed.
- Browser: 40 Playwright runs passed across desktop Chromium and the mobile profile. The tests cover all 11 claims, full create/history persistence, malformed-import preservation, 80-character titles, 44px controls, legal/404 routes, license return, keyboard focus, reduced motion, axe, offline reload, and update notification.
- Claim commands: all 11 exact commands in `.factory/claims.json` passed independently; each ran once in desktop Chromium and once in the mobile project.
- Type check: `npx tsc --noEmit` passed. No separate lint tool is configured; TypeScript strict checking and `git diff --check` passed.
- Build: `dist/index.html` exists. JavaScript is 44,387 bytes (14.08 KB gzip); CSS is 19,958 bytes (5.11 KB gzip); the largest product WebP is 20,102 bytes. There is no web-font payload.
- Local worker URL check: title and `lang=en` present, one H1, one main, zero missing alts, zero unlabeled buttons, and zero console/page errors.
- Local Lighthouse 13 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0s, LCP 1.2s, TBT 10ms, CLS 0.
- Visual inspection: full-page 1440×1000 home, 390×844 home, and 390×844 demo captures showed no horizontal overflow or clipped content. The first action remains visible on the mobile first screen.
- Keyboard/accessibility: skip link moves focus to main; Enter opens the record dialog and focuses Card name; Escape closes and restores focus. Populated axe scan found zero serious/critical issues and no nested-complementary-landmark issue. Reduced motion yields 0.01ms transitions/animations and automatic scrolling.
- Privacy: the complete live demo/offline flow requested only `https://home-care-evidence.sociobot.in`. No analytics, trackers, CDN fonts, or third-party scripts were observed.
- Offline/update: a service-worker-controlled live 390px offline reload retained all three demo cards and the offline status. The update event regression displays `A fresh version is ready.` and its Reload action.
- Package/consumer: not applicable; this remains a static `pwa-offline` product with no published package API.

## Live identity and response policy

The live deployment byte-matches the production build:

| File | SHA-256 |
| --- | --- |
| `index.html` | `9b874c8585d83b48df52dd894325ea6d8410edfd35cd2670ac563dc3be313456` |
| `assets/index-DfIvsMKt.js` | `dfc2e571299659a3e3b0e3823a1c69d9fe68fceffb3fdf7d159007a20a281399` |
| `assets/index-BBe8M6tt.css` | `1a72cfb5f5075e27af94a467912e5cae5857a0fcdabadb672c1f17e4f68be688` |

- Live `/`, `/demo`, `/privacy`, and `/terms` return 200. `/not-a-real-route` returns 404 with the designed not-found page.
- Hashed assets return `public, max-age=31536000, immutable`; HTML revalidates; `sw.js` is `no-cache, no-store, must-revalidate`; the manifest is `application/manifest+json`.
- Live responses retain HSTS, the restrictive self-only CSP with only the Sociobot verification connection, `nosniff`, strict-origin referrer policy, and the restrictive permissions policy.
- Live worker check: no console errors; title/lang/one-H1/main/alt/button-label checks pass.
- Live 390px demo: three sample cards, one H1/main, exact 390px document width, 44×44px Privacy and Terms links, zero serious/critical axe issues, and only same-origin requests.
- Live Lighthouse 13 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9s, LCP 1.0s, TBT 0ms, CLS 0.
- Billing verification returns JSON, exact ACAO for the live origin, and `Cache-Control: no-store`. A burst first returned 429 at request 31 with `Retry-After: 3`. Checkout returns 303 to the hosted Dodo checkout; no provider is embedded.

## Known limits

- There is intentionally no account or cloud sync. Clearing browser/site data removes records unless the user exported them.
- Encrypted archive passphrases cannot be recovered by design.
- Very long histories can span more than one physical printed page.
- HEIC preview depends on browser support; HEIC files still store and export.
