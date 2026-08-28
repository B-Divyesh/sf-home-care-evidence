# Home Care Evidence — visual thesis

## Direction: the household logbook as a mid-century instrument panel

Home Care Evidence should feel like the dependable control panel beside an old boiler: quiet, legible, repairable, and still useful after decades. The visual language borrows the purposeful proportions of 1950s–70s laboratory instruments, appliance labels, service tags, and ruled maintenance ledgers—not their nostalgia as decoration. A homeowner should be able to glance at the “next service” dial, locate proof, and hand the record to someone else without learning a dashboard.

The interface is deliberately single-mode. A warm enamel background and ink-dark panel are painted explicitly in every state; a second color scheme would weaken the physical logbook metaphor. Contrast is verified within this light treatment.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| Paper | `#F3ECD8` | page/background, like an aged-but-clean service card |
| Panel | `#173F3A` | masthead and primary controls; deep oxidized green |
| Panel raised | `#23564E` | active instrument areas |
| Ink | `#17211F` | body text |
| Muted ink | `#59645F` | secondary copy (7:1+ on Paper) |
| Cream | `#FFF9E8` | record surfaces and fields |
| Signal orange | `#B64024` | primary action, overdue condition, focus accent; cream text contrast 5.3:1 |
| Ochre | `#A56812` | due-soon warning with a text label |
| Brass | `#D7B96E` | hairlines, ticks, decorative hardware |
| Success | `#236A4B` | complete/current status with a text label |
| Danger | `#A3342B` | destructive actions and errors |

No generic gradients. Depth comes from solid layers, one-pixel keylines, inset rules, and short hard-edged shadows resembling stacked metal plates and paper cards.

## Typography

- Display and numeric readouts: `Arial Narrow`, `Aptos Narrow`, `Roboto Condensed`, system sans-serif. Uppercase labels use 0.08–0.12em tracking. Tabular figures are mandatory for dates and counts.
- Body and forms: `Georgia`, `Charter`, serif. It evokes an annotated household ledger while remaining available offline with no font payload or CDN.
- Scale: 0.78rem instrument label, 0.9rem metadata, 1rem body, 1.25rem section title, clamp(2rem, 6vw, 4.6rem) product display.
- Body text is at least 16px, line height 1.55, and long copy is held to 68 characters.

## Space, shape, and responsive intent

The base unit is 4px, with primary spacing at 8, 12, 16, 24, 32, 48, and 64px. Corners are mostly 2–10px, never pill-shaped except for small physical “lamp” indicators. Controls are at least 44px high with 8px separation.

Desktop uses a narrow left “control rail” beside the evidence ledger. At 760px and below, the rail becomes a concise top status panel, filters stack, and record metadata moves to one column. The 390px view keeps the Add record action and next-due information prominent; secondary explanatory art and verbose labels recede.

## Interaction grammar

- New records enter through a centered paper-sheet dialog anchored to the Add record control.
- Status changes are represented by a labeled pilot lamp plus a due-date readout; color is never the only signal.
- Record details expand in place, maintaining spatial context. Buttons depress by 1px with a reduced shadow.
- Saving, importing, deleting, and licensing always produce a live-region message. Deletion requires a record-specific confirmation.
- The printable view strips away controls and renders a one-page service dossier with observed issue, work proof, attachments list, and next due date.

## Motion policy

Only opacity and transform are animated, 160–220ms: dialog rises 8px from its trigger context, record disclosure opens with a slight fade, and toasts enter from the bottom edge. Nothing loops. With `prefers-reduced-motion: reduce`, all movement and smooth scrolling are removed; state change remains visible through borders, labels, and live copy.

## Original asset plan and provenance

The hero illustration is a generated still-life/cutaway that explains the product world: a compact house service station with a maintenance card, labeled-by-shape photo sleeve, receipt envelope, date dial, and hand tools. It contains no people, no legible writing, no brands, and no UI promises. The composition supplies visual context on wide screens and crops away on phones. Interface icons and the app mark are hand-authored SVG/CSS geometry, not stock assets.

### Prompt sheet

- **Use case:** `stylized-concept`
- **Subject:** tabletop home-maintenance evidence station: miniature house cutaway, cream service card, instant-photo sleeve, receipt envelope, brass date dial, screwdriver and measuring tape
- **World/materials:** 1960s appliance service bench; powder-coated green steel, warm cream paper, walnut, brass, orange indicator lamp; subtle paper grain
- **Light/lens:** soft directional workshop window light, long controlled shadow, orthographic three-quarter view, 50mm feel
- **Composition:** landscape, object cluster on the right, generous quiet cream negative space on the left; readable at small size
- **Palette words:** oxidized green, warm enamel cream, signal orange, muted brass, charcoal ink
- **Negative list:** no people, hands, text, letters, numbers, logos, watermark, trademarks, branded products, gradients, glossy app UI, futuristic screens, unsafe repair scene, damaged house, photorealistic mess

Final generation prompt:

> Use case: stylized-concept. Asset type: PWA home-screen contextual illustration. A carefully arranged tabletop home-maintenance evidence station in the visual language of a mid-century instrument panel: miniature house cutaway, blank cream service card, instant-photo sleeve with abstract image shapes, receipt envelope, brass date dial, small screwdriver and measuring tape. Powder-coated oxidized-green steel, warm enamel cream paper, walnut, muted brass, one signal-orange indicator lamp, subtle paper grain. Soft directional workshop window light with a controlled long shadow, precise three-quarter orthographic composition, landscape 3:2, object cluster on the right with generous quiet cream negative space on the left, readable at small size. Editorial gouache and screen-print texture with clean geometry. No people, hands, text, letters, numbers, logos, watermark, trademarks, brands, generic gradient, glossy interface, futuristic screen, unsafe repair scene, damaged house, clutter.

### Asset record

- Generator: Azure AI Foundry factory image deployment via `/opt/fleet/lib/gen-image.sh`
- Date: 2026-08-28
- License/provenance: original model-generated asset for this product; no third-party source material supplied
- Source candidate: `assets/src/evidence-station.png`
- Production exports: responsive WebP files under `public/assets/`
