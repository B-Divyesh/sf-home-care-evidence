# Home Care Evidence — verification 5 handoff

## Outcome

Independent verification 5 completed against the live product and a clean checkout. **Verdict: FAIL — 2 findings, 0 untested public claims.** Product code was not changed.

- Implementation SHA: `a80ebc826aed82a0b2352c6e38b99d2ff274d83b`
- Documentation baseline: `d57804abb5ea01c5ae6a5cb44e632d19f4be3ffb`
- Verification report: `.factory/verification-5.md`
- Deployment ID: `c3664506-7801-4f03-9700-1084fa364c55` (`Succeeded`)
- Deployed artifact: the `dist/` build from implementation SHA `a80ebc8`

## Verification 5 findings

1. At 390×844, the paid section's **purchase terms** link has a 77.109×14 CSS px clickable box. The attached accessibility and site contracts require every touch target to be at least 44×44 px.
2. The site-structure contract requires an SVG favicon and a 180 px Apple touch icon. The site instead points both icon relations to the 192×192 PNG and ships no SVG or 180×180 variant.

All 17 declared claim commands passed independently. The full suite passed 10 unit tests and 56 browser runs. Live axe scans found zero violations on all public routes, offline writes and attachments survived reload, all internal links worked, the deliberate 404 rendered correctly, and live mobile Lighthouse scored 100/100/100/100. Live HTML, JavaScript, and CSS byte-match the implementation build.

See `.factory/verification-5.md` for exact evidence and the disposition of every earlier finding.

## Strict review repairs

- Expanded `.factory/claims.json` from 11 to 17 claims. Every public promise named by review now has one outcome-based browser test.
- The offline claim now saves a completed-work note and receipt while disconnected, reloads offline, and reads both back.
- The paid-limit claim now proves the free ninth card is blocked and a cached valid license can save the ninth card.
- Added 10 MiB acceptance and 10 MiB plus one byte rejection coverage for attachments.
- Added the 9/10-character passphrase boundary and proof that an export passphrase is neither requested nor present after reload in browser storage.
- Encrypted archive coverage now deletes a sample card, imports the archive, and confirms its named attachment returns.
- Added failed-import preservation, confirmed card deletion, and saved-license removal claims.
- Added **Remove saved license**. It clears only the product-scoped license and verdict keys and leaves maintenance cards unchanged.
- Added the exact landing offer after the scope section: Unlimited costs $29 once, removes the 8-card limit, and adds encrypted archives.
- Replaced decorative labels such as “Evidence drawer,” “Data bay,” and “Drawer 404” with direct task labels. The expanded copy audit includes first-screen, product, empty, paid, footer, demo, data, and license copy.
- Added History API navigation for Home, Demo, Privacy, Terms, and not-found states. Route changes focus the new H1, update the title, announce the H1, and work with back/forward. Hash-only skip-link focus remains native.

## Clean-checkout verification

A fresh clone of implementation SHA `a80ebc8` was used.

```sh
npm ci
# every test command in .factory/claims.json, one at a time
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Results:

- `npm ci`: 60 packages, 0 vulnerabilities.
- All 17 declared claim commands passed independently. Each command ran its claim in desktop Chromium and the 390px mobile project.
- `npm test`: 10 Vitest unit/config tests and 56 Playwright runs passed.
- TypeScript and `git diff --check`: passed.
- Build: `dist/` produced. JavaScript is 46,640 bytes (14,477 gzip); CSS is 20,635 bytes (5,283 gzip); largest WebP is 20,102 bytes; no web-font payload.
- Local mobile Lighthouse 13: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1s, LCP 1.1s, TBT 10ms, CLS 0.

## Live verification

- Live HTML, JavaScript, and CSS hashes match the local implementation build exactly.
- Fresh 1440×1000 and 390×844 contexts show the job, homeowner audience, first sample action, and click result before scrolling. The phone action ends at 530 CSS pixels.
- One click opens `/demo` with three cards and the persistent “Demo — sample data, nothing is saved” banner.
- The water-heater sample shows Northside Plumbing, `plumber-receipt.pdf`, and Aug 18, 2027 as the next due date.
- Deleting a sample reduced the demo to two cards. Reset restored three. Starting for real returned the unchanged real record.
- A true offline live reload retained three cards. A note and PDF saved while offline both survived another offline reload.
- Home, Demo, Privacy, Terms, and the designed 404 have route-specific titles, one H1, one main, zero axe violations, and no console errors. The deliberate unknown route returns HTTP 404 as expected.
- Privacy navigation focuses and announces “Control your stored records.” Back/forward restores the route and focus.
- Reduced motion yields 0.01ms animation and transition durations with automatic scrolling.
- The full cold sample flow requested only the product origin. No analytics, tracker, CDN font, or third-party script request appeared.
- Live mobile Lighthouse 13: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9s, LCP 1.1s, TBT 0ms, CLS 0.
- Hashed assets have one-year immutable caching. HTML revalidates. The manifest uses `application/manifest+json`. CSP, HSTS, `nosniff`, referrer, and permissions headers are present.
- Checkout returns 303 to the hosted checkout. Product verification first returned 429 on burst request 31 with `Retry-After: 3`.

Live SHA-256 identity:

| File | SHA-256 |
| --- | --- |
| `index.html` | `51fb1ebc639d79ae7954ff29713674142bb78459793814429016c77389069254` |
| `assets/index-B-QO5Lkd.js` | `8b89575c41406a581f9f52d77c5acb92675b776ca9e98c008a39d92e0fefc5d7` |
| `assets/index-D_nOiQ42.css` | `b1eafec4c52f824e8dc23a89502fbe53f4fe83d80322154bc7da7e429c6d0ca9` |

## Earlier finding disposition

| Finding | Disposition |
| --- | --- |
| Nine public promises lacked complete claim coverage | Resolved with six new claims and three broadened claim tests |
| Privacy promised license removal without a control | Resolved and tested across reload |
| Route changes did not focus or announce H1 | Resolved with History API routing, focus, live announcement, and back/forward regression |
| Landing page omitted the paid section | Resolved with exact price, free features, paid features, checkout, restore, and terms |
| Decorative metaphor labels and incomplete copy audit | Resolved with direct labels and an expanded audit |
| Billing verification lacked 429/Retry-After | Still resolved; live request 31 returned 429 with `Retry-After: 3` |
| Hashed assets lacked immutable caching | Still resolved live |
| CSP was missing | Still resolved live with no violations |
| Manifest MIME was incorrect | Still resolved live |
| Valid 80-character titles clipped | Still resolved and covered at desktop and 390px |
| Card actions and footer legal links missed 44px | Still resolved; the separate paid-section terms link is a new finding above |
| Demo, claims manifest, cold read, and 404 were missing | Still resolved |
| Malformed imports replaced valid data | Still resolved; invalid input causes no confirmation and preserves all cards |
| Expanded card caused an axe landmark issue | Still resolved; live routes report zero axe violations |

## Billing metadata and limits

The public one-time offer is recorded in `/work/.evidence/billing-offer.json`. Core recordkeeping, attachments, printing, service history, and open exports remain free. No real purchase was made during verification, so checkout completion and a newly issued production entitlement were not exercised. The license return, daily cache, valid cached entitlement, invalid verification, license removal, and rate-limit paths were exercised.

This remains a static local-first PWA. Backend tenancy, server restart persistence, and SQLite checks do not apply. Clearing browser site data can remove records unless the homeowner exported them. Archive passphrases cannot be recovered. Long histories can print beyond one physical page. HEIC preview still depends on browser support, though HEIC files remain stored and exported.
