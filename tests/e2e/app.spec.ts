import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    indexedDB.deleteDatabase('home-care-evidence');
    indexedDB.deleteDatabase('demo:home-care-evidence');
  });
  await page.reload();
});

test('@claim:card-records creates a durable maintenance card and adds service history', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Keep home repair proof ready' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Record a completed home repair' })).toBeVisible();

  await page.getByRole('button', { name: 'Add your first card' }).click();
  await page.getByLabel('Card name *').fill('Water heater flush');
  await page.getByLabel('Area or system *').fill('Utility room');
  await page.getByLabel('What was observed? *').fill('Sediment found during the annual inspection.');
  await page.locator('#record-form').getByLabel('Completed date *').fill('2026-08-15');
  await page.locator('#record-form').getByLabel('What was done? *').fill('Drained the tank until the water ran clear and checked for leaks.');
  await page.getByRole('button', { name: 'Save card' }).click();

  await expect(page.getByRole('heading', { name: 'Water heater flush' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Water heater flush' })).toBeVisible();

  await page.getByRole('button', { name: 'Add completed work' }).click();
  await page.locator('#service-form').getByLabel('Completed date *').fill('2026-08-20');
  await page.locator('#service-form').getByLabel('What was done? *').fill('Follow-up leak check was dry.');
  await page.getByRole('button', { name: 'Add to history' }).click();
  await page.getByText('View evidence & history').click();
  await expect(page.getByText('Follow-up leak check was dry.')).toBeVisible();
  await expect(page.getByText('2 service entries')).toBeVisible();
});

test('has no serious accessibility violations in empty and dialog states', async ({ page }) => {
  let results = await new AxeBuilder({ page }).exclude('.spinner').analyze();
  expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  await page.getByRole('button', { name: 'Add your first card' }).click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
});

test('@claim:offline-reload restores the demo and local records while offline', async ({ page, context }) => {
  await page.goto('/demo');
  await expect(page.getByRole('heading', { name: 'Water heater flush' })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await expect(page.getByRole('heading', { name: 'Water heater flush' })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline mode — records and attachments still save on this device.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Water heater flush' })).toBeVisible();
  await page.locator('[data-record-id="demo-water-heater"]').getByRole('button', { name: 'Add completed work' }).click();
  await page.locator('#service-form').getByLabel('Completed date *').fill('2026-09-01');
  await page.locator('#service-form').getByLabel('What was done? *').fill('Saved this note and receipt while the device was offline.');
  await page.locator('#service-form').getByLabel('Receipt or invoice').setInputFiles({ name: 'offline-receipt.pdf', mimeType: 'application/pdf', buffer: Buffer.from('offline receipt proof') });
  await page.getByRole('button', { name: 'Add to history' }).click();
  await expect(page.getByText('Completed work added. The next due date has been recalculated.')).toBeVisible();
  await page.reload();
  const offlineCard = page.locator('[data-record-id="demo-water-heater"]');
  await offlineCard.getByText('View evidence & history').click();
  await expect(offlineCard.getByText('Saved this note and receipt while the device was offline.')).toBeVisible();
  await expect(offlineCard.getByText('offline-receipt.pdf')).toBeVisible();
  await context.setOffline(false);
});

test('renders direct legal routes with one heading and a main landmark', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page).toHaveTitle(/Privacy/);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByText('Control your stored records')).toBeVisible();
});

test('captures a returned license, verifies it, and removes it from the URL', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/home-care-evidence/verify?*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null })
  }));
  await page.goto('/?license=verified-test-token');
  await expect(page).toHaveURL('/');
  await page.getByRole('button', { name: 'Data & license' }).click();
  await expect(page.getByText('Unlimited is active.')).toBeVisible();
  await expect(page.locator('#settings-dialog').getByRole('link', { name: 'Buy Unlimited — $29' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/home-care-evidence/checkout');
  expect(await page.evaluate(() => localStorage.getItem('sb_license:home-care-evidence'))).toBe('verified-test-token');
});

test('keeps an 80-character card name readable and every card action touch sized', async ({ page }) => {
  const boundaryTitle = 'A'.repeat(80);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Add your first card' }).click();
  await expect(page.getByLabel('Card name *')).toHaveAttribute('maxlength', '80');
  await page.getByLabel('Card name *').fill(boundaryTitle);
  await page.getByLabel('Area or system *').fill('Utility room');
  await page.getByLabel('What was observed? *').fill('Boundary title test.');
  await page.locator('#record-form').getByLabel('Completed date *').fill('2026-08-28');
  await page.locator('#record-form').getByLabel('What was done? *').fill('Recorded the condition.');
  await page.getByRole('button', { name: 'Save card' }).click();

  const heading = page.getByRole('heading', { level: 3, name: boundaryTitle });
  const card = page.locator('.record-card');
  await expect(heading).toBeVisible();
  const desktopBounds = await Promise.all([heading.boundingBox(), card.boundingBox()]);
  expect(desktopBounds[0]).not.toBeNull();
  expect(desktopBounds[1]).not.toBeNull();
  expect(desktopBounds[0]!.x + desktopBounds[0]!.width).toBeLessThanOrEqual(desktopBounds[1]!.x + desktopBounds[1]!.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(heading).toBeVisible();
  const mobileBounds = await Promise.all([heading.boundingBox(), card.boundingBox()]);
  expect(mobileBounds[0]!.x + mobileBounds[0]!.width).toBeLessThanOrEqual(mobileBounds[1]!.x + mobileBounds[1]!.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);

  const actions = page.locator('.card-actions button');
  await expect(actions).toHaveCount(4);
  for (const action of await actions.all()) {
    const bounds = await action.boundingBox();
    const label = (await action.textContent()) ?? 'unlabeled card action';
    expect(bounds, label).not.toBeNull();
    expect(bounds!.width, label).toBeGreaterThanOrEqual(44);
    expect(bounds!.height, label).toBeGreaterThanOrEqual(44);
  }
});

test('rejects a malformed branded archive before confirmation and preserves valid data', async ({ page }) => {
  await page.getByRole('button', { name: 'Add your first card' }).click();
  await page.getByLabel('Card name *').fill('Known good card');
  await page.getByLabel('Area or system *').fill('Utility room');
  await page.getByLabel('What was observed? *').fill('Known good observation.');
  await page.locator('#record-form').getByLabel('Completed date *').fill('2026-08-28');
  await page.locator('#record-form').getByLabel('What was done? *').fill('Known good work note.');
  await page.getByRole('button', { name: 'Save card' }).click();

  let confirmationCount = 0;
  page.on('dialog', async dialog => { confirmationCount += 1; await dialog.accept(); });
  await page.getByRole('button', { name: 'Data & license' }).click();
  await page.getByLabel('Import a backup').setInputFiles({
    name: 'incomplete.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ product: 'home-care-evidence', version: 1, records: [{ id: 'broken', title: 'Incomplete', issue: 'Missing required fields', events: [] }] }))
  });
  await page.getByRole('button', { name: 'Replace logbook from file' }).click();
  await expect(page.getByText('This archive contains an invalid repeat interval.')).toBeVisible();
  expect(confirmationCount).toBe(0);
  await page.getByRole('button', { name: 'Close data and license settings' }).click();
  await expect(page.getByRole('heading', { name: 'Known good card' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Known good card' })).toBeVisible();
  await expect(page.getByText('Your records did not open')).toHaveCount(0);
});

test('shows a job-focused first screen and a one-click isolated demo', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('Keep home repair proof ready');
  await expect(page.getByText(/For homeowners who need household members/)).toBeVisible();
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('.record-card')).toHaveCount(3);
  await page.goto('/?demo=1');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('.record-card')).toHaveCount(3);
});

test('shows the exact paid offer after scope information and uses direct labels', async ({ page }) => {
  const scope = page.getByRole('heading', { level: 2, name: 'A record, not repair advice' }).locator('..');
  const paid = page.getByRole('heading', { level: 2, name: 'Unlimited costs $29 once' }).locator('..');
  const footer = page.getByRole('contentinfo');
  const [scopeBox, paidBox, footerBox] = await Promise.all([scope.boundingBox(), paid.boundingBox(), footer.boundingBox()]);
  expect(scopeBox).not.toBeNull();
  expect(paidBox).not.toBeNull();
  expect(footerBox).not.toBeNull();
  expect(scopeBox!.y).toBeLessThan(paidBox!.y);
  expect(paidBox!.y).toBeLessThan(footerBox!.y);
  await expect(paid.getByText('Unlimited removes the 8-card limit and adds encrypted archives.')).toBeVisible();
  await expect(paid.getByRole('link', { name: 'Buy Unlimited — $29' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/home-care-evidence/checkout');
  const visibleCopy = await page.locator('body').innerText();
  expect(visibleCopy).not.toMatch(/Evidence drawer|Data bay|privacy plate|Drawer 404|unit 01/i);
});

test('keeps footer links touch sized at 390px and renders a designed not-found page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const footer = page.getByRole('contentinfo');
  for (const name of ['Privacy', 'Terms']) {
    const bounds = await footer.getByRole('link', { name, exact: true }).boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
  }
  await page.goto('/not-a-real-route');
  await expect(page).toHaveTitle('Page not found — Home Care Evidence');
  await expect(page.getByRole('heading', { level: 1, name: 'This page was not found' })).toBeVisible();
  await expect(page.locator('main')).toHaveCount(1);
});

test('moves focus to each route heading and restores routes with browser history', async ({ page }) => {
  await page.getByRole('link', { name: 'Privacy', exact: true }).first().click();
  await expect(page).toHaveURL('/privacy');
  await expect(page).toHaveTitle('Privacy — Home Care Evidence');
  await expect(page.getByRole('heading', { level: 1, name: 'Control your stored records' })).toBeFocused();
  await expect(page.locator('#route-status')).toHaveText('Control your stored records');

  await page.getByRole('link', { name: 'Demo', exact: true }).click();
  await expect(page).toHaveURL('/demo');
  await expect(page.getByRole('heading', { level: 1, name: 'Keep home repair proof ready' })).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL('/privacy');
  await expect(page.getByRole('heading', { level: 1, name: 'Control your stored records' })).toBeFocused();
});

test('supports keyboard-only use, reduced motion, and populated accessibility', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to records' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.getByRole('button', { name: 'Add your first card' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Card name *')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Add your first card' })).toBeFocused();

  await page.goto('/demo');
  await page.locator('[data-record-id="demo-water-heater"] summary').click();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  expect(results.violations.find(item => item.id === 'landmark-complementary-is-top-level')).toBeUndefined();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const motion = await page.locator('.button').first().evaluate(element => {
    const style = getComputedStyle(element);
    return { animation: style.animationDuration, transition: style.transitionDuration, scroll: getComputedStyle(document.documentElement).scrollBehavior };
  });
  expect(Number.parseFloat(motion.animation)).toBeLessThanOrEqual(0.00001);
  expect(Number.parseFloat(motion.transition)).toBeLessThanOrEqual(0.00001);
  expect(motion.scroll).toBe('auto');
});

test('announces an activated service-worker update with a reload action', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.locator('.record-card')).toHaveCount(3);
  await page.evaluate(() => {
    sessionStorage.setItem('hce-sw-ready', '1');
    navigator.serviceWorker.dispatchEvent(new MessageEvent('message', { data: { type: 'SW_UPDATED' } }));
  });
  await expect(page.getByText('A fresh version is ready.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reload' })).toBeVisible();
});
