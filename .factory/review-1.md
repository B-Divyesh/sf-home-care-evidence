# Review 1 — keep home repair proof ready

**Work order:** `home-care-evidence-review-1`  
**Live URL:** <https://home-care-evidence.sociobot.in>  
**Reviewed:** 2026-09-05 UTC  
**Candidate/release SHA:** `81b545d50cd1812a44fef95dbcba39ae572f477a`  
**Last code-changing SHA:** `4e9525f9e2fdbccc36706ad2132933d5b433ec43`  
**Documentation baseline:** `797e1505c64b0cd9c5402f6c12c30455829bbee0`  
**Verdict:** **FAIL**  
**Finding count:** **5**  
**Untested public claim count:** **9**

Candidate `81b545d` changes only `.factory/handoff.md`; its product tree is the implementation from `4e9525f`. The current documentation baseline is `797e150`. Live HTML, JavaScript, and CSS byte-match the candidate build, so the findings below apply to the deployed product without requiring a new product image for the later report commits.

## Cold first read and sample

Before scrolling in fresh 1440×1000 and Pixel-sized 390×844 browser contexts, the page said:

- Job: **Keep home repair proof ready**.
- Audience and result: **For homeowners who need household members to understand past work and the next due date.**
- First action: **Try it with sample data**.
- Immediate result: **Opens three editable sample cards.**

The phone action ended at 530 CSS pixels, inside the first 844-pixel screen. One click opened `/demo`. The persistent banner said **Demo — sample data, nothing is saved**. The populated result contained Water heater flush, Attic hatch weather seal, and Dryer vent cleanout. The water-heater card showed Northside Plumbing, `plumber-receipt.pdf`, one service entry, and the next due date Aug 18, 2027.

Reset demo restored the three originals. In a fresh profile I created `Real household boiler record`, entered the demo, changed sample history, reset it, and selected Start for real. The real record returned unchanged; the demo and real IndexedDB databases remained separate.

## Findings

### Medium — declared claim commands do not cover nine public claims

All 11 commands in `.factory/claims.json` pass, but passing commands are not enough when their assertions omit part of the public promise or a promise has no manifest entry. Nine testable statements remain untested by a declared `@claim:*` command:

1. The offline banner says records **and attachments** still save while offline. `@claim:offline-reload` only reloads three records created while connected.
2. The paid copy says Unlimited removes the eight-card limit. `@claim:free-limit` proves only that an unlicensed ninth card is blocked and that the offer is displayed; it never proves a licensed ninth card can be created.
3. Both attachment controls promise **up to 10 MB each**. No declared claim tests acceptance at 10 MiB and rejection above it.
4. The archive field promises a **10+ character** passphrase. No declared claim tests the 9/10-character boundary.
5. README says encrypted `.hce` archives include attachments. `@claim:encrypted-archive` inspects the envelope and lack of plaintext but never decrypts or imports it to assert attachment survival.
6. README and Privacy say the passphrase is not stored, not received, and cannot be recovered. No declared privacy claim exercises encrypted export and inspects storage and requests.
7. README says import validation finishes before replacement and replacement is one IndexedDB transaction. The malformed-import regression is untagged, and no declared claim covers atomic replacement failure.
8. Privacy says users can delete individual cards. No declared claim tests deletion, confirmation, persistence, or recovery behavior.
9. Privacy says users can remove a stored license at any time. No declared claim tests that statement, and the control is absent as described in the next finding.

Independent review checks showed that offline attachment saving, licensed ninth-card access, encrypted attachment round-trip, wrong-passphrase preservation, and non-storage of the test passphrase work. Those ad hoc checks do not satisfy the contract requiring every public claim to have an exact repeatable command.

### Medium — Privacy promises a license-removal control that does not exist

`/privacy` says, “You can … remove a stored license at any time.” Data & license offers purchase and paste/verify controls, but no Remove license action. Source search finds license removal only when leaving demo mode. A live invalid-license attempt left `demo:sb_license:home-care-evidence` stored, and the settings dialog exposed zero controls named for removing a license.

Clearing all browser site data is listed as a separate action in the same sentence, so it does not make the promised license-only control available. This is both a false privacy control statement and one of the nine untested public claims above.

### Low — route changes do not satisfy the focus and announcement contract

Home, Demo, Privacy, Terms, and the 404 route have correct titles and back/forward navigation works. However, selecting Privacy from Home leaves `document.activeElement` on `BODY`, not the new H1, and the legal page has no route-change live region. Navigation performs full document loads rather than the required history routing with H1 focus and a polite announcement.

### Low — the paid tier is missing from the required landing-page order

The first screen states `$29 once`, but the landing page goes from the product and “How the logbook works” directly to the scope note and footer. The exact Unlimited benefits appear only after opening Data & license. The site-structure contract requires a paid-tier section on the landing page, after privacy/scope and before the footer, with the exact price and included features.

### Low — visible labels and the copy audit retain prohibited metaphor copy

The live interface uses decorative instrument-panel labels including **Household service register / unit 01**, **Evidence drawer**, **Data bay / license plate**, **privacy plate**, and **Drawer 404**. The plain-words contract prohibits brand lore and metaphor labels even when the main headings are clear. `.factory/copy-audit.md` also omits these labels and the footer sentence, so it is not a complete extraction of the shipped landing copy.

## Clean-checkout verification

The review used a new local clone at documentation SHA `797e150`.

```text
npm ci                 PASS — 60 packages, 0 vulnerabilities
11 claim commands      PASS — each command ran separately; 2 browser projects each
npm test               PASS — 10 Vitest tests and 40 Playwright runs
npx tsc --noEmit       PASS
npm run build          PASS — dist/ produced
git diff --check       PASS
```

There is no configured lint command. Production output was 44,387 bytes of JavaScript (14.08 KB gzip), 19,958 bytes of CSS (5.11 KB gzip), and a 20,102-byte largest WebP, with no web-font payload.

All declared commands returned success:

| Claim ID | Command result | Coverage review |
| --- | --- | --- |
| `card-records` | PASS | Complete for create, reload, and added history |
| `offline-reload` | PASS | Incomplete for the stronger offline-save banner copy |
| `demo-isolation` | PASS | Complete |
| `recurrence-latest` | PASS | Complete |
| `search-filter` | PASS | Complete |
| `local-privacy` | PASS | Complete for the declared normal demo workflow |
| `open-export` | PASS | Complete for open JSON |
| `print-history` | PASS | Complete |
| `free-limit` | PASS | Incomplete for licensed limit removal |
| `encrypted-archive` | PASS | Complete for algorithm/envelope; incomplete for encrypted attachment round-trip and passphrase privacy copy |
| `license-cache` | PASS | Complete for a current cached verdict |

## Live functional and boundary evidence

- Normal path: created a card, reloaded it, searched to no results, cleared filters, and exported JSON.
- Invalid path: an empty required form remained invalid. A malformed branded archive returned `This archive contains an invalid repeat interval.`, opened no replacement confirmation, and preserved the valid card after reload.
- Boundaries: intervals 0 and 121 were invalid; 120 was valid. An 80-character unbroken title stayed inside its card at desktop and 390px.
- Attachment recovery: 10 MiB + 1 byte returned `too-large.png is larger than 10 MB. Choose a smaller file.` Replacing it with a small attachment saved successfully.
- Security rendering: entered `<script>` text rendered as text and did not execute.
- Touch targets: all four card actions measured at least 44px high; Privacy and Terms measured 44×44px at 390px. No page overflow occurred.
- Encrypted recovery: a wrong passphrase preserved the destination; the correct passphrase restored three cards and `attic-hatch-after.svg`; the passphrase was absent from localStorage.
- License recovery: invalid verification made one product-scoped API request and displayed `This license is no longer active.` The checkout link returned 303 to hosted checkout.

## Accessibility, PWA, privacy, and response policy

- The worker URL check passed: HTTP 200, `lang=en`, title, one H1, one main, alt text, labeled buttons, and no console/page errors.
- Independent axe scans on Home, expanded Demo, Privacy, Terms, and the designed 404 returned zero violations of any impact.
- Keyboard smoke test passed the skip link, main focus, dialog opening, initial field focus, Escape, and trigger-focus restoration.
- Reduced motion produced `0.00001s` animation/transition durations and automatic scrolling.
- Fresh mobile Lighthouse 13: Performance 97, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0s, LCP 1.1s, TBT 210ms, CLS 0. INP was not measured in the lab run.
- A service-worker-controlled offline reload retained all three demo cards and displayed offline status. The update message path displayed `A fresh version is ready.` and Reload.
- Cold Home/Demo use requested only `https://home-care-evidence.sociobot.in`. No analytics, tracker, CDN font, or third-party script request appeared.
- Home, Demo, Privacy, and Terms return 200. `/review-missing` deliberately returns 404 with the designed page; that expected status is not a defect. Internal links return 200, the mail link is explicit, and hosted checkout returns 303.
- HTML revalidates; hashed assets use one-year immutable caching; `sw.js` is no-store; the manifest is `application/manifest+json`. CSP, HSTS, `nosniff`, strict-origin referrer policy, and the restrictive permissions policy are present.
- Product verification returned exact-origin CORS and `Cache-Control: no-store`. Requests 1–30 returned 200; request 31 returned 429 with `Retry-After: 3`.

## Live identity

| File | Local/live SHA-256 |
| --- | --- |
| `index.html` | `9b874c8585d83b48df52dd894325ea6d8410edfd35cd2670ac563dc3be313456` |
| `assets/index-DfIvsMKt.js` | `dfc2e571299659a3e3b0e3823a1c69d9fe68fceffb3fdf7d159007a20a281399` |
| `assets/index-BBe8M6tt.css` | `1a72cfb5f5075e27af94a467912e5cae5857a0fcdabadb672c1f17e4f68be688` |

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Billing verification lacked 429/Retry-After | Resolved — first 429 at request 31 with `Retry-After: 3` |
| Hashed assets lacked immutable caching | Resolved — one-year immutable policy live |
| CSP missing | Resolved — restrictive response CSP live with no violations |
| Manifest MIME incorrect | Resolved — `application/manifest+json` |
| 80-character titles clipped | Resolved — contained at 1440px and 390px |
| Card actions below 44px | Resolved — all measured 44px high or more |
| Claims manifest absent | Resolved mechanically — 11 entries and one tag each; completeness finding remains above |
| Cold read did not name job/audience/action | Resolved |
| No isolated one-click demo | Resolved |
| Malformed import replaced valid data | Resolved |
| Footer legal links below 44px | Resolved |
| Copy/metadata/build identity/404 artifacts missing | Resolved as artifacts; shipped metaphor and incomplete audit remain above |
| Nested complementary landmark axe issue | Resolved — zero axe violations on expanded sample |

## Evidence files

Runtime artifacts are under `/work/.evidence/live/`, including `browser-review.json`, `verify.json`, the Lighthouse JSON, and fresh desktop/phone/offline screenshots. The required report copy is `/work/.evidence/qa-report.md` and the machine verdict is `/work/.evidence/qa-result.json`.

## Final decision

**FAIL — 5 findings and 9 untested public claims.** The deployed runtime is stable and all earlier functional defects are repaired, but this review cannot declare PASS until every public claim has complete declared coverage, the false license-removal promise is corrected or implemented, and the remaining site-structure and plain-language requirements are met.
