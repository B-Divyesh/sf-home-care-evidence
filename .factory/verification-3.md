# Verification report 3 — FAIL

**Work order:** `home-care-evidence-verify-3`  
**Candidate:** `28769e1220e25a318bacffc745294b7ae4f4dca8`  
**Live URL:** https://home-care-evidence.sociobot.in  
**Verified:** 2026-08-28 UTC  
**Verdict:** **FAIL**

The deployed PWA byte-matches the candidate and its core create, persistence, export, paid-license, offline, accessibility, security-header, and performance paths are healthy. It is not releasable under this work order because the mandatory claims manifest is absent, there is no sample-data demo, the cold first screen does not plainly name the intended user, and a malformed import can replace good data and leave the logbook unable to render. Two mobile footer links also fail the 44×44px target requirement.

## Mandatory acceptance gates

### FAIL — `.factory/claims.json` is missing

The clean candidate checkout has no `.factory/claims.json`. Therefore there were no listed claim commands to run through the demo entry point. The work order explicitly makes a missing manifest release-blocking.

No test contains an `@claim:*` tag. Existing tests for offline reload and licensing are useful regression tests, but they do not satisfy the required claim inventory or one-tagged-test-per-claim contract.

Claim-like copy that is consequently unlisted includes:

- “works offline” and “offline-first”;
- records and attachments stay on the device unless exported;
- exports contain every note and attachment;
- one-page printing;
- the eight-card free limit;
- AES-GCM/PBKDF2 encrypted archives and passphrase handling;
- license verification at most once per day;
- no analytics, advertising, trackers, or third-party runtime scripts.

### FAIL — cold first-read and demo

Cold desktop view at 1440×900 showed:

- Product name/H1: `Home Care Evidence`.
- Explanatory heading: `A service record the next person can use.`
- Supporting copy: `Keep the finding, what was done, and the receipt together. Your logbook stays on this device and works offline.`
- First usable actions: `Add card` and `Add your first card`.

This explains the recordkeeping task, but “the next person” does not plainly identify the homeowner or household member specified by the brief. The H1 is the product name rather than the job in the user's words. Most importantly, there is no visible `Try it with sample data` action.

Fresh 390px browser contexts loaded both `/demo` and `/?demo=1`. Each showed the ordinary empty logbook: zero cards, no sample action, no demo banner, no seeded data, and no isolated demo state. `.factory/demo.md` is also missing. This independently fails the mandatory one-click sandbox gate.

## Release-blocking product defect

### High — incomplete archive import destroys the current logbook before validation

Reproduction against the candidate production build in an isolated browser:

1. Create a valid card named `Known good card`.
2. Import a syntactically valid archive with `product: "home-care-evidence"`, but omit required card fields such as `area`, `intervalValue`, and timestamps.
3. Accept the explicit replacement confirmation.

Observed result:

- The existing valid card was replaced in IndexedDB.
- Rendering then failed with the raw message `Cannot read properties of undefined (reading 'replace')`.
- After reload, the valid card was gone and the page showed `The evidence drawer did not open` with the same raw exception.
- `Try again` only reloads the same corrupted data, so there is no in-app recovery.

The importer validates only a subset of the archive shape and commits `replaceRecords()` before rendering exposes the invalid fields. Import must fully validate and construct the replacement before the destructive transaction; a failed import must preserve the current logbook.

## Other defects

### Medium — mobile footer links are undersized

At a 390×844 CSS-pixel live viewport:

- `Privacy`: 42×21.3px
- `Terms`: 34.2×21.3px

Both fail the supplied 44×44px touch-target minimum. The main controls and all four maintenance-card actions met 44px minimum height.

### Medium — required site/copy artifacts and routes are incomplete

- `.factory/copy-audit.md` is missing.
- `/not-a-real-route` returns HTTP 200 and renders the normal empty app; there is no designed 404 route or not-found state.
- `index.html` has no canonical URL, Open Graph metadata, Twitter card metadata, 1200×630 social image reference, or Apple touch icon.
- The home footer does not include the required `Built by Param Factory` or build/version identity.

### Low — one moderate axe issue in expanded content

An axe run with a populated card and expanded evidence found no serious or critical violations. It reported one moderate `landmark-complementary-is-top-level` issue for the schedule `<aside>` nested inside other content.

## Passing evidence

### Clean local gates

Run from the clean candidate checkout:

```text
npm ci                         PASS — 60 packages, 0 vulnerabilities
npm test                       PASS — 7 Vitest + 12 Playwright tests
npx tsc --noEmit               PASS
npm run build                  PASS — dist/ produced
lint                           N/A — no lint script/configuration is present
```

Production output:

- JavaScript: 34,638 bytes, 11.21 KB gzip (budget ≤200 KB)
- CSS: 17,563 bytes, 4.72 KB gzip (budget ≤50 KB)
- Largest responsive WebP: 20,102 bytes (hero budget ≤300 KB)
- No web-font payload or CDN dependency

### Independent end-to-end exercise

The candidate build passed these independent cases:

- Native required-field rejection and recovery.
- Interval boundaries: 0 and 121 invalid; 120 valid.
- 80-character card-name regression on desktop and mobile.
- 10 MiB + 1 byte attachment rejected with `too-large.png is larger than 10 MB. Choose a smaller file.`; the same form then saved with smaller photo and PDF attachments.
- User-entered `<script>` content rendered as text and did not execute.
- Record survived reload; search no-results state recovered via `Clear filters`.
- Added a second completed-work entry and recalculated the next date.
- Open JSON downloaded with one record and both attachment names.
- Unreadable JSON produced an actionable error without replacing data.
- Encrypted `.hce` export used `AES-GCM-256/PBKDF2-SHA256`, 250,000 iterations; wrong passphrase preserved the empty destination and the correct passphrase restored the record.
- Eight seeded free cards caused `Add card` to open licensing and show the exact limit message.
- `Print one-page history` invoked printing with only the selected card marked as the print target and its history expanded.

The separate malformed-but-parseable archive case above is the failed validation boundary.

### Live deployment identity

Live and local production bytes matched exactly:

| File | SHA-256 |
| --- | --- |
| `index.html` | `2fada4721a6a868b1531237d93ea645b2e36fbb107b6bad3b7954cc23d07f13f` |
| `assets/index-DBXGRuJj.js` | `05e271cf6f50ed3d1d7dbfa4cb97fc2d4518eee95406cb948adda36d65054f19` |
| `assets/index-DywxDC-C.css` | `a4ae83f8bbba6df49d96bbcef9b061db6eacc6ed0aa1d41c206dbfc32f32e3c8` |

This confirms the live findings apply to candidate `28769e1`.

### Accessibility and responsive behavior

- Worker `verify-url.sh`: HTTP 200, title present, `lang=en`, one H1, one main, zero missing image alts, zero unlabeled buttons, zero console/page errors.
- Independent axe: zero serious/critical findings in empty, dialog, and populated states.
- Keyboard order starts Skip link → Data & license → Add card; all show a 3px visible focus outline.
- Enter opens the dialog, focus moves to Card name, Escape closes it, and focus returns to Add card.
- Activating the skip link moves focus to `<main>`.
- At 390px, document width equals viewport width, body text is 16px, and card actions are at least 44px high.
- `prefers-reduced-motion: reduce` produces 0.01ms transitions/animations and automatic scrolling.
- The visual direction, single-mode palette, spacing, motion policy, and generated-asset provenance are documented in `.factory/design.md` and are product-specific.

### PWA and offline behavior

- Manifest has name/short name, standalone display, versioned start URL, matching theme/background colors, 192px and 512px icons, and maskable purpose.
- After service-worker control, an actual offline reload retained the shell, offline status, and IndexedDB record.
- A same-origin update fixture served a changed worker revision without changing repository files. The new worker activated, replaced cache `hce-1787910402448` with `qa-update-hce-1787910402448`, and the app displayed `A fresh version is ready.` with a visible `Reload` action.
- Live hashed JS/CSS return `Cache-Control: public, max-age=31536000, immutable`; HTML revalidates; `/sw.js` is no-store; the manifest is `application/manifest+json`.

### Privacy, network, security, and billing

- Full local and live create/read/offline flows requested only their own product origin.
- Source and runtime checks found no analytics, trackers, CDN fonts, or third-party scripts.
- Attachments and records use IndexedDB. The explicit license action is the only observed product call to `api.sociobot.in`.
- Live headers include HSTS, restrictive CSP, `nosniff`, strict-origin referrer policy, and a restrictive permissions policy. No CSP violations appeared.
- Invalid license verification returned JSON with exact ACAO `https://home-care-evidence.sociobot.in` and `Cache-Control: no-store`.
- A fresh rapid burst returned 200 for requests 1–30; request **31** returned **429** with `Retry-After: 3`.
- Checkout returned 303 to the hosted Dodo merchant URL. No payment provider is embedded in the app.
- Live paste-and-verify of an invalid license produced `This license is no longer active.`
- There is no sign-in feature, so the Entra authority requirement is not applicable.

### Performance

Fresh Lighthouse 13 mobile run against production:

- Performance 99
- Accessibility 100
- Best Practices 100
- SEO 100
- FCP 1.0s, LCP 1.1s, TBT 100ms, CLS 0, Speed Index 1.0s

## Required remediation

1. Add `.factory/claims.json`; inventory every claim and give each exactly one demo-based `@claim:<id>` test.
2. Add a first-screen `Try it with sample data` action, `/demo` or `?demo=1` seeded sandbox, separate demo storage namespace, persistent demo banner/reset/start-real controls, and `.factory/demo.md`.
3. Rewrite the H1/supporting copy so one cold screen plainly says what the tool does, who it is for, and what the first click does.
4. Fully validate imports before replacing IndexedDB; preserve current records on every validation/decryption/storage failure and provide a working recovery path.
5. Expand footer link hit areas to at least 44×44px.
6. Add the required copy audit, metadata, build identity, and designed 404 behavior.
