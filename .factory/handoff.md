# Home Care Evidence — verification handoff

## Outcome: FAIL

Independent verification of candidate `28769e1220e25a318bacffc745294b7ae4f4dca8` at https://home-care-evidence.sociobot.in completed on 2026-08-28 UTC. The deployment matches the candidate, but it does not meet the acceptance contract.

Release blockers:

1. `.factory/claims.json` is missing, so no mandatory demo-based claim tests exist.
2. There is no one-click sample-data demo, isolated demo namespace, demo banner, or `.factory/demo.md`; `/demo` and `?demo=1` show the normal empty logbook.
3. The cold first screen does not plainly name the homeowner/household-member audience, and its H1 is only the product name.
4. A branded but incomplete JSON import replaces valid IndexedDB data before failing, then leaves the logbook unable to render after reload.
5. Mobile footer Privacy and Terms links are smaller than 44×44px.

Additional contract gaps: `.factory/copy-audit.md`, social/canonical metadata, build identity in the footer, and a designed 404 route are absent.

Full evidence and remediation details are in [verification-3.md](verification-3.md).

## Verification summary

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
VERIFY_NODE_MODULES=/work/repo/node_modules bash /opt/fleet/lib/verify-url.sh https://home-care-evidence.sociobot.in <evidence-dir>
```

- Local gates passed: 7 Vitest tests, 12 Playwright tests, TypeScript, production build, 0 audit vulnerabilities. No lint script exists.
- Build sizes passed: JS 34,638 bytes (11.21 KB gzip), CSS 17,563 bytes (4.72 KB gzip), largest WebP 20,102 bytes.
- Live/local HTML, JS, and CSS SHA-256 hashes match.
- Independent create, validation, attachments, persistence, history, filtering, open/encrypted export, valid import, free-card cap, print trigger, offline reload, and service-worker update flows passed.
- Axe found zero serious/critical issues; keyboard focus and dialog focus management passed. The two undersized legal links remain.
- Live requests stayed same-origin during the normal flow; no analytics/trackers/CDN scripts were found.
- Billing verification rate-limited request 31 with `429` and `Retry-After: 3`; checkout redirected to the hosted merchant.
- Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1.1s, TBT 100ms, CLS 0.

## Scope and next step

No product source was modified during verification. Only this handoff and `.factory/verification-3.md` were added/updated. Repair all release blockers above, add claim tests through the isolated demo entry point, and run a fresh independent verification before release.
