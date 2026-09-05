# Home Care Evidence

Home Care Evidence is a local household maintenance logbook for homeowners. Each card keeps the finding, work notes, attachments, interval, and next due date together. Another household member can understand the work later.

Try the isolated sample logbook at <https://home-care-evidence.sociobot.in/demo>. The live product is at <https://home-care-evidence.sociobot.in>.

It does not diagnose problems or provide safety, building-code, or professional repair advice.

## What it includes

- Three-card sample demo in a separate `demo:home-care-evidence` IndexedDB database
- Local IndexedDB cards with service history and attachments
- Text and schedule filters for finding cards
- Due-date calculation from the latest completed-work entry
- Open JSON export with every note and attachment
- One-card print layout with expanded history
- Offline reload after the first connected visit
- Eight-card free limit
- $29 one-time Unlimited license for unlimited cards and encrypted archives
- AES-GCM-256 encrypted archives with PBKDF2-SHA256, 250,000 iterations, and a 10-character minimum passphrase
- License-verdict cache limited to one verification per day

The sample workflow makes no analytics, advertising, tracker, CDN font, or third-party runtime request. Records and attachments stay on the device unless the user exports them. Browser storage can be cleared by the device, so regular exports matter.

Every product claim, its location, and its demo-based browser command is recorded in [`.factory/claims.json`](.factory/claims.json). Demo data and isolation behavior are documented in [`.factory/demo.md`](.factory/demo.md).

## Run locally

Requirements: Node.js 22+ and npm.

```sh
npm ci
npm run dev
```

Build the static deployment:

```sh
npm run build
```

The deploy root is `dist/`. The postbuild step adds direct-route documents and a versioned service worker. `public/staticwebapp.config.json` defines Azure Static Web Apps response headers, cache policy, manifest MIME type, and 404 behavior.

## Test and verify

```sh
npm test
npm run test:unit
npm run test:e2e
npx tsc --noEmit
```

Playwright and its browser core are pinned to 1.58.2. Browser tests run in desktop Chromium and a 390px mobile profile. The suite covers claims, demo isolation, malformed-import rollback, keyboard and accessibility states, response policy, offline reload, legal routes, and paid-license behavior.

## Data, payments, and deployment

Open `.json` and encrypted `.hce` archives include attachments. The passphrase is not sent or stored and cannot be recovered. Invalid or unreadable imports leave current records unchanged.

The buy link uses the Sociobot billing API. Sociobot/Dodo is the merchant of record; this repository contains no payment-provider integration. The artifact remains a static `pwa-offline` deployment.

## Project references

- [Researched brief](.factory/brief.json)
- [Visual system and asset provenance](.factory/design.md)
- [Repair handoff](.factory/handoff.md)

MIT licensed; see [LICENSE](LICENSE).
