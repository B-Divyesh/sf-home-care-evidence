# Home Care Evidence

Home Care Evidence is an offline-first household maintenance logbook. It keeps the reason for a repair, completed-work notes, proof photos, receipts, recurrence interval, calculated next-due date, and printable history in one card another household member can understand years later.

It is for homeowners replacing scattered inspection PDFs, camera-roll photos, invoices, and vague calendar reminders with a durable local record. It does not diagnose problems or provide safety, building-code, or professional repair advice.

Live product: <https://home-care-evidence.sociobot.in>

## What v1 includes

- IndexedDB storage for maintenance cards and attachment blobs
- Recurrence calculations from the most recent service entry
- Search and overdue/due-soon/current filters
- In-place service history and a one-page print layout
- Open JSON export/import so core data portability is always free
- Optional AES-GCM encrypted archives with the Unlimited license
- Installable PWA manifest, versioned app-shell cache, offline fallback, and update notice
- $29 one-time Unlimited license through the Sociobot hosted checkout; no payment provider code is embedded here
- Local `/privacy` and `/terms` pages, keyboard operation, reduced-motion treatment, and responsive layouts down to 390px

There is no account, cloud sync, analytics, advertising, or third-party runtime script. Records and attachments leave the device only when the user explicitly exports them. Browser storage can be cleared by the device, so regular exports matter.

## Run locally

Requirements: Node.js 22+ and npm.

```sh
npm install
npm run dev
```

Vite prints the local URL. Production output is reproducible with the work-order build command:

```sh
npm run build
```

The static deploy root is `dist/`, with `dist/index.html` at its root. `scripts/postbuild.mjs` adds direct-route entry files and creates a versioned service worker from the final build inventory. `public/staticwebapp.config.json` defines the production cache, MIME, CSP, and security-header policy.

## Test and verify

```sh
npm test             # unit + Chromium desktop/mobile end-to-end tests
npm run test:unit
npm run test:e2e
npx tsc --noEmit
```

Playwright is pinned to 1.58.2. Its tests cover the card workflow, refresh persistence, additional service history, axe accessibility checks, offline reload, legal routes, and license callback/verification behavior.

## Data and license notes

Open `.json` and encrypted `.hce` archives both include attachments. Encryption is performed in-browser with AES-GCM-256 and a PBKDF2-SHA256 key derived using 250,000 iterations. The passphrase is never stored and cannot be recovered.

The free tier supports eight cards plus unlimited history entries, attachments, printing, and open backups. Unlimited removes the card limit and enables encrypted export. The billing endpoint uses the product slug—not a hardcoded provider product ID—and the factory registers the product separately.

## Project references

- [Researched brief](.factory/brief.json)
- [Visual system and original-asset provenance](.factory/design.md)
- [Build handoff](.factory/handoff.md)

MIT licensed; see [LICENSE](LICENSE).
