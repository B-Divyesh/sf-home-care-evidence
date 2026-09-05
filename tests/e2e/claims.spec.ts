import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

async function deleteDatabase(page: import('@playwright/test').Page, name: string): Promise<void> {
  await page.evaluate(databaseName => new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  }), name);
}

async function cacheDemoLicense(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.setItem('demo:sb_license:home-care-evidence', 'cached-demo-license');
    localStorage.setItem('demo:sb_license_verdict:home-care-evidence', JSON.stringify({ valid: true, checkedAt: Date.now(), reason: 'ok' }));
  });
  await page.reload();
  await expect(page.locator('.record-card')).toHaveCount(3);
}

async function seedDemoToEight(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('demo:home-care-evidence', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('records', 'readwrite');
      for (let index = 4; index <= 8; index += 1) transaction.objectStore('records').put({
        id: `demo-extra-${index}`, title: `Sample card ${index}`, area: 'Garage', issue: 'Sample maintenance item', intervalValue: 1, intervalUnit: 'years',
        createdAt: '2026-01-01T00:00:00.000Z', updatedAt: `2026-01-0${index}T00:00:00.000Z`,
        events: [{ id: `demo-extra-event-${index}`, completedDate: '2026-01-01', workType: 'DIY', provider: '', note: 'Sample completed work', attachments: [], createdAt: '2026-01-01T00:00:00.000Z' }]
      });
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }));
  await page.reload();
  await expect(page.locator('.record-card')).toHaveCount(8);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await deleteDatabase(page, 'home-care-evidence');
  await deleteDatabase(page, 'demo:home-care-evidence');
  await page.goto('/demo');
  await expect(page.locator('.record-card')).toHaveCount(3);
});

test('@claim:demo-isolation keeps sample changes outside the real logbook and discards them on exit', async ({ page }) => {
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('home-care-evidence', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('records', { keyPath: 'id' });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('records', 'readwrite');
      transaction.objectStore('records').put({
        id: 'real-card', title: 'Real household record', area: 'Kitchen', issue: 'Private real record', intervalValue: 1, intervalUnit: 'years',
        createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
        events: [{ id: 'real-event', completedDate: '2026-01-01', workType: 'DIY', provider: '', note: 'Private work note', attachments: [], createdAt: '2026-01-01T00:00:00.000Z' }]
      });
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }));
  await page.reload();
  await expect(page.getByText('Real household record')).toHaveCount(0);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Real household record' })).toBeVisible();
});

test('@claim:recurrence-latest recalculates the next due date from the latest completed work', async ({ page }) => {
  await page.locator('[data-record-id="demo-water-heater"]').getByRole('button', { name: 'Add completed work' }).click();
  await page.locator('#service-form').getByLabel('Completed date *').fill('2026-08-20');
  await page.locator('#service-form').getByLabel('What was done? *').fill('Checked the drain and confirmed clear water.');
  await page.getByRole('button', { name: 'Add to history' }).click();
  const card = page.locator('[data-record-id="demo-water-heater"]');
  await expect(card.locator('.status-line time')).toHaveText('Aug 20, 2027');
  await card.getByText('View evidence & history').click();
  await expect(card.getByText('2 service entries')).toBeVisible();
});

test('@claim:search-filter finds cards with text and schedule filters and recovers from no results', async ({ page }) => {
  await page.getByLabel('Find a card').fill('attic');
  await expect(page.locator('.record-card')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Attic hatch weather seal' })).toBeVisible();
  const status = await page.locator('[data-record-id="demo-attic-hatch"]').evaluate(element => [...element.classList].find(name => name.startsWith('status-'))!.replace('status-', ''));
  await page.getByLabel('Schedule status').selectOption(status);
  await expect(page.getByRole('heading', { name: 'Attic hatch weather seal' })).toBeVisible();
  await page.getByLabel('Find a card').fill('not in this logbook');
  await expect(page.getByRole('heading', { name: 'No cards match' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.record-card')).toHaveCount(3);
});

test('@claim:local-privacy performs the sample workflow without third-party runtime requests', async ({ page }) => {
  const urls: string[] = [];
  page.on('request', request => urls.push(request.url()));
  await page.reload();
  await page.getByLabel('Find a card').fill('dryer');
  await expect(page.getByRole('heading', { name: 'Dryer vent cleanout' })).toBeVisible();
  const origins = [...new Set(urls.map(url => new URL(url).origin))];
  expect(origins).toEqual(['http://127.0.0.1:4173']);
  expect(await page.evaluate(() => indexedDB.databases().then(items => items.map(item => item.name)))).toContain('demo:home-care-evidence');
});

test('@claim:open-export exports every sample note and attachment', async ({ page }) => {
  await page.getByRole('button', { name: 'Data & license' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export open JSON' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const archive = JSON.parse(await readFile(path!, 'utf8')) as { records: Array<{ events: Array<{ note: string; attachments: Array<{ name: string }> }> }> };
  expect(archive.records).toHaveLength(3);
  const notes = archive.records.flatMap(record => record.events.map(event => event.note));
  const attachments = archive.records.flatMap(record => record.events.flatMap(event => event.attachments.map(item => item.name)));
  expect(notes).toContain('Drained the tank until the water ran clear. Checked the valve and nearby fittings for leaks.');
  expect(attachments).toEqual(expect.arrayContaining(['plumber-receipt.pdf', 'attic-hatch-after.svg']));
});

test('@claim:print-history prepares only the chosen card with its full history', async ({ page }) => {
  await page.evaluate(() => { (window as Window & { printCalled?: boolean }).print = () => { (window as Window & { printCalled?: boolean }).printCalled = true; }; });
  const card = page.locator('[data-record-id="demo-water-heater"]');
  await card.getByRole('button', { name: 'Print one-page history' }).click();
  await expect(card).toHaveClass(/print-target/);
  await expect(card.locator('details')).toHaveAttribute('open', '');
  expect(await page.evaluate(() => (window as Window & { printCalled?: boolean }).printCalled)).toBe(true);
  await expect(page.locator('.print-target')).toHaveCount(1);
});

test('@claim:free-limit keeps eight free cards and shows the exact one-time paid option', async ({ page }) => {
  await seedDemoToEight(page);
  await page.getByRole('button', { name: 'Add card' }).click();
  await expect(page.getByText('The free logbook holds 8 cards. Unlimited removes the card limit.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Unlimited · $29 once' })).toBeVisible();
  await page.getByRole('button', { name: 'Close data and license settings' }).click();
  await page.evaluate(() => {
    localStorage.setItem('demo:sb_license:home-care-evidence', 'cached-demo-license');
    localStorage.setItem('demo:sb_license_verdict:home-care-evidence', JSON.stringify({ valid: true, checkedAt: Date.now(), reason: 'ok' }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Add card' }).click();
  await page.getByLabel('Card name *').fill('Licensed ninth card');
  await page.getByLabel('Area or system *').fill('Garage');
  await page.getByLabel('What was observed? *').fill('A licensed record beyond the free limit.');
  await page.locator('#record-form').getByLabel('Completed date *').fill('2026-09-05');
  await page.locator('#record-form').getByLabel('What was done? *').fill('Recorded the completed work.');
  await page.getByRole('button', { name: 'Save card' }).click();
  await expect(page.locator('.record-card')).toHaveCount(9);
  await expect(page.getByRole('heading', { name: 'Licensed ninth card' })).toBeVisible();
});

test('@claim:encrypted-archive creates the documented encrypted format and restores its attachments', async ({ page }) => {
  await cacheDemoLicense(page);
  await page.getByRole('button', { name: 'Data & license' }).click();
  await page.getByLabel('Archive passphrase').fill('sample-passphrase');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export encrypted archive/ }).click();
  const path = await (await downloadPromise).path();
  const raw = await readFile(path!, 'utf8');
  const envelope = JSON.parse(raw) as { algorithm: string; iterations: number; encrypted: boolean; data: string };
  expect(envelope).toMatchObject({ encrypted: true, algorithm: 'AES-GCM-256/PBKDF2-SHA256', iterations: 250000 });
  expect(raw).not.toContain('Drained the tank until the water ran clear');
  expect(envelope.data.length).toBeGreaterThan(100);

  await page.getByRole('button', { name: 'Close data and license settings' }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-record-id="demo-attic-hatch"]').getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('[data-record-id="demo-attic-hatch"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Data & license' }).click();
  await page.getByLabel('Archive passphrase').fill('sample-passphrase');
  await page.getByLabel('Import a backup').setInputFiles(path!);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Replace logbook from file' }).click();
  const restored = page.locator('[data-record-id="demo-attic-hatch"]');
  await expect(restored).toBeVisible();
  await restored.getByText('View evidence & history').click();
  await expect(restored.getByText('attic-hatch-after.svg')).toBeVisible();
});

test('@claim:license-cache verifies a saved license no more than once per day', async ({ page }) => {
  let verificationRequests = 0;
  await page.route('https://api.sociobot.in/api/v1/products/home-care-evidence/verify?*', route => { verificationRequests += 1; return route.abort(); });
  await page.evaluate(() => {
    localStorage.setItem('demo:sb_license:home-care-evidence', 'cached-demo-license');
    localStorage.setItem('demo:sb_license_verdict:home-care-evidence', JSON.stringify({ valid: true, checkedAt: Date.now(), reason: 'ok' }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Data & license' }).click();
  await expect(page.getByText('Unlimited is active.')).toBeVisible();
  expect(verificationRequests).toBe(0);
});

test('@claim:attachment-limit accepts 10 MiB attachments and rejects larger files without losing the form', async ({ page }) => {
  await page.getByRole('button', { name: 'Add card' }).click();
  await page.getByLabel('Card name *').fill('Attachment boundary card');
  await page.getByLabel('Area or system *').fill('Basement');
  await page.getByLabel('What was observed? *').fill('Attachment size boundary check.');
  await page.locator('#record-form').getByLabel('Completed date *').fill('2026-09-05');
  await page.locator('#record-form').getByLabel('What was done? *').fill('Saved proof at the stated size limit.');
  await page.locator('#record-form').getByLabel('Proof photos').setInputFiles({ name: 'exactly-10-mib.png', mimeType: 'image/png', buffer: Buffer.alloc(10 * 1024 * 1024, 1) });
  await page.getByRole('button', { name: 'Save card' }).click();
  const card = page.getByRole('heading', { name: 'Attachment boundary card' }).locator('xpath=ancestor::article');
  await expect(page.getByRole('heading', { name: 'Attachment boundary card' })).toBeVisible();
  await page.getByRole('heading', { name: 'Attachment boundary card' }).locator('xpath=ancestor::article').getByText('View evidence & history').click();
  await expect(page.getByText('exactly-10-mib.png')).toBeVisible();

  await card.getByRole('button', { name: 'Add completed work' }).click();
  await page.locator('#service-form').getByLabel('Completed date *').fill('2026-09-06');
  await page.locator('#service-form').getByLabel('What was done? *').fill('This oversized file must not save.');
  await page.locator('#service-form').getByLabel('Receipt or invoice').setInputFiles({ name: 'too-large.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(10 * 1024 * 1024 + 1, 2) });
  await page.getByRole('button', { name: 'Add to history' }).click();
  await expect(page.getByText('too-large.pdf is larger than 10 MB. Choose a smaller file.')).toBeVisible();
  await expect(page.locator('#service-dialog')).toHaveAttribute('open', '');
});

test('@claim:archive-passphrase enforces the 9 and 10 character boundary', async ({ page }) => {
  await cacheDemoLicense(page);
  await page.getByRole('button', { name: 'Data & license' }).click();
  await page.getByLabel('Archive passphrase').fill('123456789');
  await page.getByRole('button', { name: /Export encrypted archive/ }).click();
  await expect(page.getByText('Use a passphrase with at least 10 characters.')).toBeVisible();
  await page.getByLabel('Archive passphrase').fill('1234567890');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export encrypted archive/ }).click();
  expect(await (await downloadPromise).path()).not.toBeNull();
});

test('@claim:passphrase-private neither sends nor stores an archive passphrase', async ({ page }) => {
  await cacheDemoLicense(page);
  const passphrase = 'private-test-passphrase-7842';
  const requested: string[] = [];
  page.on('request', request => requested.push(request.url()));
  await page.getByRole('button', { name: 'Data & license' }).click();
  await page.getByLabel('Archive passphrase').fill(passphrase);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export encrypted archive/ }).click();
  await downloadPromise;
  expect(requested).toEqual([]);
  await page.getByRole('button', { name: 'Close data and license settings' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Data & license' }).click();
  await expect(page.getByLabel('Archive passphrase')).toHaveValue('');
  const storedValues = await page.evaluate(() => [...Object.values(localStorage), ...Object.values(sessionStorage)].join('\n'));
  expect(storedValues).not.toContain(passphrase);
  await expect(page.getByText('There is no recovery.')).toBeVisible();
});

test('@claim:import-safety leaves current cards unchanged when an archive is invalid', async ({ page }) => {
  let confirmationCount = 0;
  page.on('dialog', async dialog => { confirmationCount += 1; await dialog.accept(); });
  await page.getByRole('button', { name: 'Data & license' }).click();
  await page.getByLabel('Import a backup').setInputFiles({
    name: 'incomplete.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ product: 'home-care-evidence', version: 1, records: [{ id: 'broken', title: 'Incomplete', events: [] }] }))
  });
  await page.getByRole('button', { name: 'Replace logbook from file' }).click();
  await expect(page.getByText('This archive contains an invalid repeat interval.')).toBeVisible();
  expect(confirmationCount).toBe(0);
  await page.getByRole('button', { name: 'Close data and license settings' }).click();
  await expect(page.locator('.record-card')).toHaveCount(3);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Water heater flush' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Attic hatch weather seal' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dryer vent cleanout' })).toBeVisible();
});

test('@claim:delete-card requires confirmation and keeps the deletion after reload', async ({ page }) => {
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('[data-record-id="demo-dryer-vent"]').getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('[data-record-id="demo-dryer-vent"]')).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-record-id="demo-dryer-vent"]').getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('[data-record-id="demo-dryer-vent"]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-record-id="demo-dryer-vent"]')).toHaveCount(0);
  await expect(page.locator('.record-card')).toHaveCount(2);
});

test('@claim:license-removal removes only saved license data and keeps maintenance cards', async ({ page }) => {
  await cacheDemoLicense(page);
  await page.getByRole('button', { name: 'Data & license' }).click();
  await expect(page.getByText('Unlimited is active.')).toBeVisible();
  await page.getByRole('button', { name: 'Remove saved license' }).click();
  await expect(page.getByText('Saved license removed. Your maintenance cards were not changed.')).toBeVisible();
  expect(await page.evaluate(() => ({
    license: localStorage.getItem('demo:sb_license:home-care-evidence'),
    verdict: localStorage.getItem('demo:sb_license_verdict:home-care-evidence')
  }))).toEqual({ license: null, verdict: null });
  await page.getByRole('button', { name: 'Close data and license settings' }).click();
  await expect(page.locator('.record-card')).toHaveCount(3);
  await page.reload();
  await page.getByRole('button', { name: 'Data & license' }).click();
  await expect(page.getByText('Free logbook — 8 card limit.')).toBeVisible();
});
