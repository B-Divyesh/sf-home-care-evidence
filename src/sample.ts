import type { MaintenanceRecord } from './domain';

function attachment(id: string, name: string, kind: 'photo' | 'receipt', contents: string, type: string) {
  const blob = new Blob([contents], { type });
  return { id, name, kind, type, size: blob.size, blob };
}

export function sampleRecords(): MaintenanceRecord[] {
  return [
    {
      id: 'demo-water-heater',
      title: 'Water heater flush',
      area: 'Utility room',
      issue: 'Annual inspection found light sediment at the drain valve.',
      intervalValue: 12,
      intervalUnit: 'months',
      createdAt: '2026-07-12T09:30:00.000Z',
      updatedAt: '2026-08-18T14:20:00.000Z',
      events: [{
        id: 'demo-water-event', completedDate: '2026-08-18', workType: 'Vendor', provider: 'Northside Plumbing',
        note: 'Drained the tank until the water ran clear. Checked the valve and nearby fittings for leaks.',
        createdAt: '2026-08-18T14:20:00.000Z',
        attachments: [attachment('demo-water-receipt', 'plumber-receipt.pdf', 'receipt', 'Sample receipt: water heater flush, 2026-08-18', 'application/pdf')]
      }]
    },
    {
      id: 'demo-attic-hatch',
      title: 'Attic hatch weather seal',
      area: 'Upstairs hallway',
      issue: 'The inspection report noted a visible gap around one edge of the hatch.',
      intervalValue: 1,
      intervalUnit: 'years',
      createdAt: '2026-03-04T11:00:00.000Z',
      updatedAt: '2026-03-04T11:00:00.000Z',
      events: [{
        id: 'demo-attic-event', completedDate: '2026-03-04', workType: 'DIY', provider: 'Maya',
        note: 'Replaced the compressed foam strip and photographed the closed hatch for the household file.',
        createdAt: '2026-03-04T11:00:00.000Z',
        attachments: [attachment('demo-attic-photo', 'attic-hatch-after.svg', 'photo', '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="#f3ecd8"/><rect x="55" y="35" width="210" height="170" rx="4" fill="#173f3a"/><rect x="70" y="50" width="180" height="140" fill="#d7b96e"/><path d="M80 178h160" stroke="#b64024" stroke-width="12"/></svg>', 'image/svg+xml')]
      }]
    },
    {
      id: 'demo-dryer-vent',
      title: 'Dryer vent cleanout',
      area: 'Laundry room',
      issue: 'Drying times increased, so the vent path needed a documented cleanout.',
      intervalValue: 6,
      intervalUnit: 'months',
      createdAt: '2025-11-09T16:45:00.000Z',
      updatedAt: '2025-11-09T16:45:00.000Z',
      events: [{
        id: 'demo-dryer-event', completedDate: '2025-11-09', workType: 'DIY', provider: 'Jordan',
        note: 'Vacuumed the accessible duct and exterior hood. Airflow returned to the usual level.',
        createdAt: '2025-11-09T16:45:00.000Z', attachments: []
      }]
    }
  ];
}
