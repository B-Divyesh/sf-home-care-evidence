import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    indexedDB.deleteDatabase('home-care-evidence');
  });
  await page.reload();
});

test('creates a durable maintenance card and adds service history', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Home Care Evidence' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Turn the next finished job into a durable record.' })).toBeVisible();

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

test('restores the app shell and local records while offline', async ({ page, context }) => {
  await page.getByRole('button', { name: 'Add your first card' }).click();
  await page.getByLabel('Card name *').fill('Smoke alarm batteries');
  await page.getByLabel('Area or system *').fill('Whole house');
  await page.getByLabel('What was observed? *').fill('Routine replacement reminder.');
  await page.locator('#record-form').getByLabel('Completed date *').fill('2026-08-01');
  await page.locator('#record-form').getByLabel('What was done? *').fill('Replaced and tested each alarm battery.');
  await page.getByRole('button', { name: 'Save card' }).click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await expect(page.getByRole('heading', { name: 'Smoke alarm batteries' })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline mode — records and attachments still save on this device.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Smoke alarm batteries' })).toBeVisible();
  await context.setOffline(false);
});

test('renders direct legal routes with one heading and a main landmark', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page).toHaveTitle(/Privacy/);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByText('Your records stay yours.')).toBeVisible();
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
  await expect(page.getByRole('link', { name: 'Buy Unlimited — $29' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/home-care-evidence/checkout');
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
