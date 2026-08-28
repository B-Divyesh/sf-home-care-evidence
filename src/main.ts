import './styles.css';
import { exportEncryptedArchive, exportOpenArchive, readArchive } from './archive';
import { getRecords, removeRecord, replaceRecords, saveRecord, useDemoDatabase } from './db';
import { CHECKOUT_URL, captureReturnedLicense, hasCachedUnlock, storeAndVerifyLicense, useDemoLicenseStorage, verifyLicense } from './license';
import { createId, dueStatus, escapeHtml, formatDate, latestEvent, type EvidenceAttachment, type IntervalUnit, type MaintenanceRecord, type ServiceEvent, type WorkType } from './domain';
import { sampleRecords } from './sample';

const app = document.querySelector<HTMLDivElement>('#app')!;
const FREE_RECORD_LIMIT = 8;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
let records: MaintenanceRecord[] = [];
let unlocked = false;
let searchText = '';
let statusFilter = 'all';
let objectUrls: string[] = [];
const path = location.pathname.replace(/\/$/, '') || '/';
const demoMode = path === '/demo' || (path === '/' && new URL(location.href).searchParams.get('demo') === '1');

function setMetadata(title: string, description: string, route: string): void {
  document.title = title;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute('content', description);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute('content', title);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.setAttribute('content', description);
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', `https://home-care-evidence.sociobot.in${route}`);
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', `https://home-care-evidence.sociobot.in${route}`);
}

function footer(): string {
  return `<footer class="site-footer"><span>Keep home repair proof and due dates together.</span><nav aria-label="Site information"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><span>Generated illustration</span><span>Built by Param Factory</span><span>Version 1.0 · repair 2</span></nav></footer>`;
}

function legalPage(kind: 'privacy' | 'terms'): void {
  const privacy = kind === 'privacy';
  setMetadata(`${privacy ? 'Privacy' : 'Terms'} — Home Care Evidence`, privacy ? 'How Home Care Evidence stores records, attachments, exports, and license details.' : 'Terms for using the Home Care Evidence local maintenance logbook.', `/${kind}`);
  app.innerHTML = `
    <header class="legal-header"><a class="brand-mini" href="/" aria-label="Home Care Evidence home"><span aria-hidden="true">⌂</span> Home Care Evidence</a><nav aria-label="Primary"><a href="/demo">Demo</a><a href="/privacy">Privacy</a></nav></header>
    <main id="main" class="legal-page">
      <p class="eyebrow">Household logbook / ${privacy ? 'privacy plate' : 'terms plate'}</p>
      <h1>${privacy ? 'Your records stay yours.' : 'Plain terms for a durable record.'}</h1>
      <p class="legal-lede">Effective August 28, 2026</p>
      ${privacy ? `
        <h2>Data on this device</h2><p>Maintenance cards, notes, dates, photos, receipts, and your license token are stored locally in your browser. We do not receive or sync those records. Removing site data or uninstalling without an export can erase them.</p>
        <h2>Exports and attachments</h2><p>Nothing leaves your device unless you choose Export, follow the hosted purchase link, or verify a license. Open JSON exports include the attachments you added. Encrypted archives use AES-GCM encryption in your browser; we never receive the passphrase and cannot recover it.</p>
        <h2>Purchase verification</h2><p>If you buy or restore Unlimited, the license token is sent to the Sociobot billing API for verification at most once per day. Sociobot/Dodo is the merchant of record and handles payment information. This app includes no analytics, advertising, trackers, or third-party runtime scripts.</p>
        <h2>Your controls</h2><p>You can export all records, delete individual cards, clear browser site data, or remove a stored license at any time. For privacy questions, contact <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>
      ` : `
        <h2>What this tool is</h2><p>Home Care Evidence is a local recordkeeping utility. It helps you preserve observations, work notes, proof, and a calculated next-due date. It does not inspect a home, diagnose a defect, verify a repair, or provide safety, building-code, legal, financial, or professional repair advice.</p>
        <h2>Your responsibility</h2><p>You are responsible for the accuracy of records, backup exports, archive passphrases, and deciding when to consult a qualified professional. Due dates are calculated only from the interval you enter.</p>
        <h2>Unlimited purchase</h2><p>Unlimited is a $29 one-time license for unlimited maintenance cards and encrypted archives. The free tier remains useful with up to eight cards, printing, service history, attachments, and open exports. Sociobot/Dodo is the merchant of record. Refunds are handled there and revoke the associated license.</p>
        <h2>Availability and liability</h2><p>The software is provided “as is” without warranties. To the extent permitted by law, its authors are not liable for lost records, missed maintenance, property damage, or decisions made from these records. Export backups regularly. These terms are governed by applicable law.</p>
      `}
      <p><a class="button secondary" href="/">Return to your logbook</a></p>
    </main>
    ${footer()}`;
}

if (path === '/privacy' || path === '/terms') {
  legalPage(path.slice(1) as 'privacy' | 'terms');
} else if (path !== '/' && path !== '/demo') {
  notFoundPage();
} else {
  useDemoDatabase(demoMode);
  useDemoLicenseStorage(demoMode);
  void start();
}

function notFoundPage(): void {
  setMetadata('Page not found — Home Care Evidence', 'This Home Care Evidence page does not exist. Return to the local maintenance logbook.', location.pathname);
  app.innerHTML = `<header class="legal-header"><a class="brand-mini" href="/" aria-label="Home Care Evidence home"><span aria-hidden="true">⌂</span> Home Care Evidence</a><nav aria-label="Primary"><a href="/demo">Demo</a><a href="/privacy">Privacy</a></nav></header>
    <main id="main" class="not-found"><p class="eyebrow">Drawer 404 / no record found</p><h1>This page is not in the logbook.</h1><p>The address may be old or incomplete. Your saved maintenance cards have not changed.</p><a class="button primary" href="/">Return to your logbook</a></main>${footer()}`;
}

async function start(): Promise<void> {
  setMetadata(demoMode ? 'Demo — Home Care Evidence' : 'Home Care Evidence — keep repair proof ready', 'Keep home repair findings, completed work, receipts, and next due dates together in a local logbook.', demoMode ? '/demo' : '/');
  const returned = captureReturnedLicense();
  unlocked = hasCachedUnlock();
  renderShell();
  setOnlineState();
  addEventListeners();
  try {
    records = await getRecords();
    if (demoMode && records.length === 0) {
      await replaceRecords(sampleRecords());
      records = await getRecords();
    }
    renderRecords();
  } catch (error) {
    renderLoadError(error instanceof Error ? error.message : 'The local logbook could not be opened.');
  }
  if (returned || localStorage.getItem(`${demoMode ? 'demo:' : ''}sb_license:home-care-evidence`)) {
    const result = await verifyLicense(returned);
    unlocked = result.valid;
    updateLicenseUI(result.message);
    renderRecords();
  }
  if (new URL(location.href).searchParams.get('action') === 'add') openRecordDialog();
  registerServiceWorker();
}

function renderShell(): void {
  app.innerHTML = `
    ${demoMode ? `<div class="demo-banner" role="status"><strong>Demo — sample data, nothing is saved</strong><span>Changes stay in this sample logbook only.</span><div><button class="banner-action" type="button" data-action="reset-demo">Reset demo</button><button class="banner-action" type="button" data-action="start-real">Start for real</button></div></div>` : ''}
    <div class="connection-banner" id="connection-banner" role="status" hidden><span class="lamp" aria-hidden="true"></span> Offline mode — records and attachments still save on this device.</div>
    <header class="topbar">
      <a class="wordmark" href="/" aria-label="Home Care Evidence home"><span class="house-mark" aria-hidden="true"><span></span></span><span><span class="eyebrow">Household service register / unit 01</span><span class="product-name">Home Care Evidence</span></span></a>
      <div class="header-tools"><nav class="primary-nav" aria-label="Primary"><a href="/demo">Demo</a><a href="/privacy">Privacy</a></nav><div class="header-actions"><button class="button quiet" type="button" data-action="open-settings">Data &amp; license</button><button class="button primary" type="button" data-action="new-record"><span aria-hidden="true">＋</span> Add card</button></div></div>
    </header>
    <main id="main" tabindex="-1">
      <section class="overview" aria-labelledby="page-title">
        <div class="overview-copy"><p class="eyebrow">Reason → proof → next date</p><h1 id="page-title">Keep home repair proof ready</h1><p>For homeowners who need household members to understand past work and the next due date.</p><div class="hero-action"><a class="button primary" href="/demo">Try it with sample data</a><span>Opens three editable sample cards.</span></div><ul class="plain-facts"><li>Works offline after your first visit.</li><li>Records stay on this device unless you export.</li><li>Free for 8 cards. Unlimited costs $29 once.</li></ul></div>
        <div class="gauge-bank" aria-label="Maintenance overview">
          <div class="gauge"><span class="gauge-label">Cards</span><strong id="stat-total">—</strong><span>on device</span></div>
          <div class="gauge"><span class="gauge-label">Due soon</span><strong id="stat-soon">—</strong><span>30 days</span></div>
          <div class="gauge signal"><span class="gauge-label">Overdue</span><strong id="stat-overdue">—</strong><span>needs review</span></div>
        </div>
      </section>
      <section class="ledger" aria-labelledby="ledger-title">
        <div class="ledger-heading"><div><p class="eyebrow">Evidence drawer</p><h2 id="ledger-title">Maintenance cards</h2></div><p id="storage-note">Loading the on-device logbook…</p></div>
        <div class="filter-panel" aria-label="Filter maintenance cards">
          <label class="search-field"><span>Find a card</span><input id="search" type="search" autocomplete="off" placeholder="Roof, furnace, kitchen…" /></label>
          <label><span>Schedule status</span><select id="status-filter"><option value="all">All cards</option><option value="overdue">Overdue</option><option value="soon">Due within 30 days</option><option value="current">On schedule</option><option value="unscheduled">No schedule</option></select></label>
        </div>
        <div id="records" class="record-list" aria-live="polite" aria-busy="true"><div class="loading-state"><span class="spinner" aria-hidden="true"></span><p>Opening the local evidence drawer…</p></div></div>
      </section>
      <section class="how-it-works" aria-labelledby="how-title"><p class="eyebrow">Three entries / one record</p><h2 id="how-title">How the logbook works</h2><ol><li><strong>Record the reason.</strong><span>Save the finding and the part of the home it affects.</span></li><li><strong>Attach the proof.</strong><span>Keep work notes, photos, and the receipt with the card.</span></li><li><strong>Check the next date.</strong><span>The latest completed work sets the next due date.</span></li></ol></section>
      <section class="scope-note" aria-labelledby="scope-title"><h2 id="scope-title">A record, not repair advice</h2><p>This tool stores what you enter. It does not inspect, diagnose, or verify home repairs.</p></section>
    </main>
    ${footer()}
    ${recordDialogTemplate()}
    ${serviceDialogTemplate()}
    ${settingsDialogTemplate()}
    <div class="toast" id="toast" role="status" aria-live="polite" hidden><span id="toast-message"></span><button type="button" data-action="dismiss-toast" aria-label="Dismiss message">×</button></div>`;
}

function recordDialogTemplate(): string {
  return `<dialog id="record-dialog" class="sheet-dialog" aria-labelledby="record-dialog-title">
    <form id="record-form"><div class="dialog-plate"><div><p class="eyebrow">Maintenance card</p><h2 id="record-dialog-title">Add a record</h2></div><button class="icon-button" type="button" data-action="close-record" aria-label="Close record form">×</button></div>
      <input type="hidden" name="recordId" />
      <div class="form-grid">
        <label class="span-2"><span>Card name <b aria-hidden="true">*</b></span><input name="title" required maxlength="80" autocomplete="off" placeholder="e.g. Water heater flush" /></label>
        <label><span>Area or system <b aria-hidden="true">*</b></span><input name="area" required maxlength="60" placeholder="e.g. Utility room" /></label>
        <label class="interval-field"><span>Repeat every <b aria-hidden="true">*</b></span><span class="inline-fields"><input name="intervalValue" required type="number" min="1" max="120" value="12" aria-label="Interval number" /><select name="intervalUnit" aria-label="Interval unit"><option value="months">months</option><option value="weeks">weeks</option><option value="years">years</option></select></span></label>
        <label class="span-2"><span>What was observed? <b aria-hidden="true">*</b></span><textarea name="issue" required maxlength="800" rows="3" placeholder="Record the inspection finding or reason for the work. Do not include account numbers."></textarea></label>
      </div>
      <fieldset id="first-service"><legend>First completed service</legend><div class="form-grid">
        <label><span>Completed date <b aria-hidden="true">*</b></span><input name="completedDate" required type="date" /></label>
        <label><span>Who did the work?</span><select name="workType"><option value="DIY">DIY / household</option><option value="Vendor">Vendor</option></select></label>
        <label class="span-2"><span>Vendor or household member</span><input name="provider" maxlength="100" placeholder="Optional name" /></label>
        <label class="span-2"><span>What was done? <b aria-hidden="true">*</b></span><textarea name="note" required maxlength="1200" rows="4" placeholder="Include materials, model or part details, and the outcome another person would need."></textarea></label>
        <label><span>Proof photos</span><input name="photos" type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple /><small>Up to 10 MB each. Stored only here.</small></label>
        <label><span>Receipt or invoice</span><input name="receipt" type="file" accept="image/*,application/pdf" /><small>Image or PDF, up to 10 MB.</small></label>
      </div></fieldset>
      <p class="form-error" id="record-error" role="alert" hidden></p>
      <div class="dialog-actions"><button class="button quiet" type="button" data-action="close-record">Cancel</button><button class="button primary" type="submit">Save card</button></div>
      <p class="fine-print">This is a recordkeeping tool, not repair, safety, or building-code advice.</p>
    </form></dialog>`;
}

function serviceDialogTemplate(): string {
  return `<dialog id="service-dialog" class="sheet-dialog compact" aria-labelledby="service-dialog-title"><form id="service-form">
    <div class="dialog-plate"><div><p class="eyebrow">Service history</p><h2 id="service-dialog-title">Add completed work</h2></div><button class="icon-button" type="button" data-action="close-service" aria-label="Close service form">×</button></div>
    <input type="hidden" name="recordId" /><div class="form-grid">
      <label><span>Completed date <b aria-hidden="true">*</b></span><input name="completedDate" required type="date" /></label>
      <label><span>Who did the work?</span><select name="workType"><option value="DIY">DIY / household</option><option value="Vendor">Vendor</option></select></label>
      <label class="span-2"><span>Vendor or household member</span><input name="provider" maxlength="100" /></label>
      <label class="span-2"><span>What was done? <b aria-hidden="true">*</b></span><textarea name="note" required maxlength="1200" rows="4"></textarea></label>
      <label><span>Proof photos</span><input name="photos" type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple /><small>Up to 10 MB each.</small></label>
      <label><span>Receipt or invoice</span><input name="receipt" type="file" accept="image/*,application/pdf" /><small>Image or PDF, up to 10 MB.</small></label>
    </div><p class="form-error" id="service-error" role="alert" hidden></p><div class="dialog-actions"><button class="button quiet" type="button" data-action="close-service">Cancel</button><button class="button primary" type="submit">Add to history</button></div>
  </form></dialog>`;
}

function settingsDialogTemplate(): string {
  return `<dialog id="settings-dialog" class="sheet-dialog settings" aria-labelledby="settings-title"><div class="dialog-plate"><div><p class="eyebrow">Data bay / license plate</p><h2 id="settings-title">Own your logbook</h2></div><button class="icon-button" type="button" data-action="close-settings" aria-label="Close data and license settings">×</button></div>
    <section><h3>Backup and move records</h3><p>Exports include every note and attachment. Keep exported files somewhere you trust.</p><div class="button-row"><button class="button secondary" type="button" data-action="export-open">Export open JSON</button><button class="button secondary paid-feature" type="button" data-action="export-encrypted">Export encrypted archive <span class="paid-badge">Unlimited</span></button></div>
      <label><span>Archive passphrase</span><input id="archive-passphrase" type="password" minlength="10" autocomplete="new-password" placeholder="10+ characters for encrypted files" /><small>Required only for encrypted export or import. There is no recovery.</small></label>
      <label><span>Import a backup</span><input id="archive-file" type="file" accept=".json,.hce,application/json,application/octet-stream" /></label><button class="button quiet" type="button" data-action="import">Replace logbook from file</button>
    </section>
    <section class="license-panel"><div class="license-copy"><p class="eyebrow">One-time license</p><h3>Unlimited · $29 once</h3><p>Keep unlimited maintenance cards and create password-encrypted archives. The free logbook includes 8 cards, full service history, attachments, printing, and open exports.</p></div>
      <div><p class="license-state" id="license-state"><span class="lamp" aria-hidden="true"></span><span>${unlocked ? 'Unlimited is active.' : 'Free logbook — 8 card limit.'}</span></p><a class="button primary" href="${CHECKOUT_URL}">Buy Unlimited — $29</a></div>
      <form id="license-form"><label><span>Have a license? Paste it here</span><input name="license" autocomplete="off" required /></label><button class="button quiet" type="submit">Verify license</button></form><p class="fine-print">One-time purchase. Sociobot/Dodo is the merchant of record and handles refunds. <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></p>
    </section></dialog>`;
}

function addEventListeners(): void {
  window.addEventListener('online', setOnlineState);
  window.addEventListener('offline', setOnlineState);
  document.addEventListener('click', event => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const id = target.dataset.id;
    if (action === 'new-record') openRecordDialog();
    if (action === 'open-settings') openDialog('settings-dialog');
    if (action === 'close-record') closeDialog('record-dialog');
    if (action === 'close-service') closeDialog('service-dialog');
    if (action === 'close-settings') closeDialog('settings-dialog');
    if (action === 'edit-record' && id) openRecordDialog(records.find(record => record.id === id));
    if (action === 'add-service' && id) openServiceDialog(id);
    if (action === 'delete-record' && id) void deleteRecord(id);
    if (action === 'print-record' && id) printRecord(id);
    if (action === 'export-open') void exportOpen();
    if (action === 'export-encrypted') void exportEncrypted();
    if (action === 'import') void importRecords();
    if (action === 'reset-demo' && demoMode) void resetDemo();
    if (action === 'start-real' && demoMode) void startReal();
    if (action === 'dismiss-toast') hideToast();
    if (action === 'reload') location.reload();
  });
  query<HTMLInputElement>('#search').addEventListener('input', event => { searchText = (event.target as HTMLInputElement).value.toLowerCase(); renderRecords(); });
  query<HTMLSelectElement>('#status-filter').addEventListener('change', event => { statusFilter = (event.target as HTMLSelectElement).value; renderRecords(); });
  query<HTMLFormElement>('#record-form').addEventListener('submit', event => void submitRecord(event));
  query<HTMLFormElement>('#service-form').addEventListener('submit', event => void submitService(event));
  query<HTMLFormElement>('#license-form').addEventListener('submit', event => void submitLicense(event));
  document.querySelectorAll<HTMLDialogElement>('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }));
}

async function resetDemo(): Promise<void> {
  await replaceRecords(sampleRecords());
  records = await getRecords();
  searchText = '';
  statusFilter = 'all';
  query<HTMLInputElement>('#search').value = '';
  query<HTMLSelectElement>('#status-filter').value = 'all';
  renderRecords();
  showToast('Sample cards reset.');
}

async function startReal(): Promise<void> {
  await replaceRecords([]);
  localStorage.removeItem('demo:sb_license:home-care-evidence');
  localStorage.removeItem('demo:sb_license_verdict:home-care-evidence');
  location.assign('/');
}

function query<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing interface element: ${selector}`);
  return element;
}

function openDialog(id: string): void { query<HTMLDialogElement>(`#${id}`).showModal(); }
function closeDialog(id: string): void { query<HTMLDialogElement>(`#${id}`).close(); }
function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function openRecordDialog(record?: MaintenanceRecord): void {
  if (!record && !unlocked && records.length >= FREE_RECORD_LIMIT) {
    openDialog('settings-dialog');
    showToast('The free logbook holds 8 cards. Unlimited removes the card limit.');
    return;
  }
  const form = query<HTMLFormElement>('#record-form');
  form.reset();
  const service = query<HTMLFieldSetElement>('#first-service');
  const serviceInputs = service.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input,textarea,select');
  service.hidden = Boolean(record);
  serviceInputs.forEach(input => { input.disabled = Boolean(record); });
  query<HTMLElement>('#record-dialog-title').textContent = record ? 'Edit maintenance card' : 'Add a record';
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  button.textContent = record ? 'Save changes' : 'Save card';
  (form.elements.namedItem('completedDate') as HTMLInputElement).value = today();
  if (record) {
    (form.elements.namedItem('recordId') as HTMLInputElement).value = record.id;
    (form.elements.namedItem('title') as HTMLInputElement).value = record.title;
    (form.elements.namedItem('area') as HTMLInputElement).value = record.area;
    (form.elements.namedItem('issue') as HTMLTextAreaElement).value = record.issue;
    (form.elements.namedItem('intervalValue') as HTMLInputElement).value = String(record.intervalValue);
    (form.elements.namedItem('intervalUnit') as HTMLSelectElement).value = record.intervalUnit;
  }
  setFormError('record-error', '');
  openDialog('record-dialog');
  (form.elements.namedItem('title') as HTMLInputElement).focus();
}

function openServiceDialog(id: string): void {
  const record = records.find(item => item.id === id);
  if (!record) return;
  const form = query<HTMLFormElement>('#service-form');
  form.reset();
  (form.elements.namedItem('recordId') as HTMLInputElement).value = id;
  (form.elements.namedItem('completedDate') as HTMLInputElement).value = today();
  query('#service-dialog-title').textContent = `Add work: ${record.title}`;
  setFormError('service-error', '');
  openDialog('service-dialog');
}

async function readAttachments(form: HTMLFormElement): Promise<EvidenceAttachment[]> {
  const result: EvidenceAttachment[] = [];
  const inputs: Array<[string, EvidenceAttachment['kind']]> = [['photos', 'photo'], ['receipt', 'receipt']];
  for (const [name, kind] of inputs) {
    const files = (form.elements.namedItem(name) as HTMLInputElement | null)?.files;
    for (const file of Array.from(files ?? [])) {
      if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is larger than 10 MB. Choose a smaller file.`);
      result.push({ id: createId(), name: file.name, type: file.type || 'application/octet-stream', size: file.size, kind, blob: file });
    }
  }
  return result;
}

async function submitRecord(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  submit.disabled = true;
  setFormError('record-error', '');
  try {
    const data = new FormData(form);
    const id = String(data.get('recordId') ?? '');
    const existing = records.find(record => record.id === id);
    const now = new Date().toISOString();
    let record: MaintenanceRecord;
    if (existing) {
      record = { ...existing, title: String(data.get('title')).trim(), area: String(data.get('area')).trim(), issue: String(data.get('issue')).trim(), intervalValue: Number(data.get('intervalValue')), intervalUnit: data.get('intervalUnit') as IntervalUnit, updatedAt: now };
    } else {
      const serviceEvent: ServiceEvent = { id: createId(), completedDate: String(data.get('completedDate')), workType: data.get('workType') as WorkType, provider: String(data.get('provider') ?? '').trim(), note: String(data.get('note')).trim(), attachments: await readAttachments(form), createdAt: now };
      record = { id: createId(), title: String(data.get('title')).trim(), area: String(data.get('area')).trim(), issue: String(data.get('issue')).trim(), intervalValue: Number(data.get('intervalValue')), intervalUnit: data.get('intervalUnit') as IntervalUnit, events: [serviceEvent], createdAt: now, updatedAt: now };
    }
    await saveRecord(record);
    records = await getRecords();
    closeDialog('record-dialog');
    renderRecords();
    showToast(existing ? 'Maintenance card updated.' : 'Maintenance card saved on this device.');
  } catch (error) {
    setFormError('record-error', error instanceof Error ? error.message : 'The card could not be saved. Try again.');
  } finally { submit.disabled = false; }
}

async function submitService(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  submit.disabled = true;
  setFormError('service-error', '');
  try {
    const data = new FormData(form);
    const record = records.find(item => item.id === data.get('recordId'));
    if (!record) throw new Error('That maintenance card could not be found.');
    const now = new Date().toISOString();
    record.events.push({ id: createId(), completedDate: String(data.get('completedDate')), workType: data.get('workType') as WorkType, provider: String(data.get('provider') ?? '').trim(), note: String(data.get('note')).trim(), attachments: await readAttachments(form), createdAt: now });
    record.updatedAt = now;
    await saveRecord(record);
    records = await getRecords();
    closeDialog('service-dialog');
    renderRecords();
    showToast('Completed work added. The next due date has been recalculated.');
  } catch (error) { setFormError('service-error', error instanceof Error ? error.message : 'The service entry could not be saved.'); }
  finally { submit.disabled = false; }
}

async function deleteRecord(id: string): Promise<void> {
  const record = records.find(item => item.id === id);
  if (!record || !confirm(`Delete “${record.title}” and all of its attachments from this device? This cannot be undone.`)) return;
  try { await removeRecord(id); records = await getRecords(); renderRecords(); showToast(`“${record.title}” was deleted.`); }
  catch { showToast('The card could not be deleted. Try again.'); }
}

function setFormError(id: string, message: string): void {
  const error = query<HTMLElement>(`#${id}`);
  error.textContent = message;
  error.hidden = !message;
}

function renderLoadError(message: string): void {
  query('#records').innerHTML = `<div class="error-state"><span aria-hidden="true">!</span><h3>The evidence drawer did not open</h3><p>${escapeHtml(message)}</p><button class="button secondary" type="button" onclick="location.reload()">Try again</button></div>`;
  query('#records').setAttribute('aria-busy', 'false');
}

function renderRecords(): void {
  objectUrls.forEach(url => URL.revokeObjectURL(url));
  objectUrls = [];
  const statuses = records.map(record => dueStatus(record));
  query('#stat-total').textContent = String(records.length);
  query('#stat-soon').textContent = String(statuses.filter(status => status.kind === 'soon').length);
  query('#stat-overdue').textContent = String(statuses.filter(status => status.kind === 'overdue').length);
  query('#storage-note').textContent = demoMode ? `${records.length} sample card${records.length === 1 ? '' : 's'} in the demo sandbox` : `${records.length} card${records.length === 1 ? '' : 's'} stored locally${unlocked ? ' · Unlimited active' : ` · ${Math.max(0, FREE_RECORD_LIMIT - records.length)} free spaces left`}`;
  const visible = records.filter(record => {
    const haystack = `${record.title} ${record.area} ${record.issue} ${record.events.map(item => `${item.note} ${item.provider}`).join(' ')}`.toLowerCase();
    return (!searchText || haystack.includes(searchText)) && (statusFilter === 'all' || dueStatus(record).kind === statusFilter);
  });
  const container = query('#records');
  container.setAttribute('aria-busy', 'false');
  if (!records.length) { container.innerHTML = emptyState(); return; }
  if (!visible.length) { container.innerHTML = `<div class="no-results"><span aria-hidden="true">⌕</span><h3>No cards match</h3><p>Try another word or schedule status.</p><button class="button quiet" type="button" data-action="clear-filter">Clear filters</button></div>`; const button = container.querySelector('[data-action="clear-filter"]'); button?.addEventListener('click', () => { searchText = ''; statusFilter = 'all'; query<HTMLInputElement>('#search').value = ''; query<HTMLSelectElement>('#status-filter').value = 'all'; renderRecords(); }); return; }
  container.innerHTML = visible.map(recordCard).join('');
}

function emptyState(): string {
  return `<div class="empty-state"><div class="empty-copy"><span class="index-tag">Start here · card 001</span><h3>Turn the next finished job into a durable record.</h3><p>Add one finding, what was done, and when it is due again. Photos and receipts stay with the card—even offline.</p><ol><li><span>1</span>Describe the reason</li><li><span>2</span>Attach the proof</li><li><span>3</span>Set the repeat interval</li></ol><button class="button primary" type="button" data-action="new-record">Add your first card</button></div><picture><source media="(max-width: 700px)" srcset="/assets/evidence-station-640.webp" /><img src="/assets/evidence-station-960.webp" width="960" height="640" alt="Illustrated mid-century service station with a cutaway home, blank maintenance card, photo sleeve, receipt envelope, date dial, and hand tools" decoding="async" fetchpriority="high" /></picture></div>`;
}

function recordCard(record: MaintenanceRecord): string {
  const status = dueStatus(record);
  const latest = latestEvent(record);
  const sortedEvents = [...record.events].sort((a, b) => b.completedDate.localeCompare(a.completedDate));
  return `<article class="record-card status-${status.kind}" data-record-id="${record.id}">
    <div class="card-spine"><span class="status-lamp" aria-hidden="true"></span><span>${escapeHtml(record.area)}</span><span class="card-number">${record.id.slice(0, 4).toUpperCase()}</span></div>
    <div class="card-main"><div class="card-header"><div><p class="status-line"><span>${escapeHtml(status.label)}</span> · next due <time datetime="${status.due ?? ''}">${formatDate(status.due)}</time></p><h3>${escapeHtml(record.title)}</h3></div><div class="date-readout"><span>Last done</span><strong>${formatDate(latest?.completedDate ?? null)}</strong></div></div>
      <p class="issue"><span>Why this card exists</span>${escapeHtml(record.issue)}</p>
      <details><summary>View evidence &amp; history <span>${record.events.length} service entr${record.events.length === 1 ? 'y' : 'ies'}</span></summary>
        <div class="evidence-body"><div class="history"><h4>Service history</h4><ol>${sortedEvents.map((entry, index) => eventItem(entry, index)).join('')}</ol></div>
          <div class="schedule-plate"><span class="eyebrow">Repeat setting</span><strong>Every ${record.intervalValue} ${record.intervalUnit}</strong><dl><div><dt>Next due</dt><dd>${formatDate(status.due)}</dd></div><div><dt>Card created</dt><dd>${formatDate(record.createdAt.slice(0, 10))}</dd></div></dl></div></div>
      </details>
      <div class="card-actions"><button class="button secondary" type="button" data-action="add-service" data-id="${record.id}">Add completed work</button><button class="button quiet" type="button" data-action="print-record" data-id="${record.id}">Print one-page history</button><button class="button quiet" type="button" data-action="edit-record" data-id="${record.id}">Edit card</button><button class="text-danger" type="button" data-action="delete-record" data-id="${record.id}">Delete</button></div>
    </div></article>`;
}

function eventItem(event: ServiceEvent, index: number): string {
  const attachments = event.attachments.map(attachment => {
    const url = URL.createObjectURL(attachment.blob);
    objectUrls.push(url);
    if (attachment.kind === 'photo' && attachment.type.startsWith('image/')) return `<a class="photo-proof" href="${url}" target="_blank" rel="noopener"><img src="${url}" width="160" height="120" loading="lazy" alt="Photo evidence: ${escapeHtml(attachment.name)}" /><span>${escapeHtml(attachment.name)}</span></a>`;
    return `<a class="file-proof" href="${url}" download="${escapeHtml(attachment.name)}"><span aria-hidden="true">▤</span><span>${escapeHtml(attachment.name)}<small>${formatBytes(attachment.size)}</small></span></a>`;
  }).join('');
  return `<li><div class="history-marker"><span>${index + 1}</span></div><div><div class="history-heading"><time datetime="${event.completedDate}">${formatDate(event.completedDate)}</time><span>${event.workType}${event.provider ? ` · ${escapeHtml(event.provider)}` : ''}</span></div><p>${escapeHtml(event.note)}</p>${attachments ? `<div class="proof-grid">${attachments}</div>` : '<p class="no-proof">No files attached to this entry.</p>'}</div></li>`;
}

function formatBytes(bytes: number): string { return bytes < 1_000_000 ? `${Math.ceil(bytes / 1000)} KB` : `${(bytes / 1_000_000).toFixed(1)} MB`; }

function printRecord(id: string): void {
  const card = document.querySelector<HTMLElement>(`[data-record-id="${CSS.escape(id)}"]`);
  if (!card) return;
  card.classList.add('print-target');
  card.querySelector('details')?.setAttribute('open', '');
  document.body.classList.add('printing');
  const cleanup = () => { document.body.classList.remove('printing'); card.classList.remove('print-target'); window.removeEventListener('afterprint', cleanup); };
  window.addEventListener('afterprint', cleanup);
  window.print();
  setTimeout(cleanup, 2000);
}

async function exportOpen(): Promise<void> {
  try { await exportOpenArchive(records); showToast('Open backup prepared. Keep the file somewhere safe.'); }
  catch { showToast('The backup could not be prepared. Try again.'); }
}

async function exportEncrypted(): Promise<void> {
  if (!unlocked) { showToast('Encrypted archives are included with Unlimited. Open exports remain free.'); return; }
  try { await exportEncryptedArchive(records, query<HTMLInputElement>('#archive-passphrase').value); showToast('Encrypted archive prepared. Do not lose the passphrase.'); }
  catch (error) { showToast(error instanceof Error ? error.message : 'The encrypted archive could not be prepared.'); }
}

async function importRecords(): Promise<void> {
  const file = query<HTMLInputElement>('#archive-file').files?.[0];
  if (!file) { showToast('Choose a .json or .hce archive first.'); return; }
  try {
    const imported = await readArchive(file, query<HTMLInputElement>('#archive-passphrase').value);
    if (!confirm(`Replace the ${records.length} card${records.length === 1 ? '' : 's'} currently on this device with “${file.name}”? Export first if you need a backup.`)) return;
    await replaceRecords(imported);
    records = await getRecords();
    renderRecords();
    closeDialog('settings-dialog');
    showToast(`${records.length} card${records.length === 1 ? '' : 's'} imported.`);
  } catch (error) { showToast(error instanceof Error ? error.message : 'The archive could not be imported.'); }
}

async function submitLicense(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const value = (form.elements.namedItem('license') as HTMLInputElement).value;
  updateLicenseUI('Checking this license…');
  const result = await storeAndVerifyLicense(value);
  unlocked = result.valid;
  updateLicenseUI(result.message);
  renderRecords();
}

function updateLicenseUI(message: string): void {
  const state = document.querySelector('#license-state span:last-child');
  if (state) state.textContent = message;
  document.body.classList.toggle('is-unlocked', unlocked);
}

function setOnlineState(): void {
  const banner = document.querySelector<HTMLElement>('#connection-banner');
  if (banner) banner.hidden = navigator.onLine;
}

let toastTimer = 0;
function showToast(message: string, action?: string): void {
  const toast = query<HTMLElement>('#toast');
  query('#toast-message').textContent = message;
  const existing = toast.querySelector('[data-action="reload"]');
  existing?.remove();
  if (action) toast.insertAdjacentHTML('beforeend', `<button class="toast-action" type="button" data-action="reload">${escapeHtml(action)}</button>`);
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(hideToast, action ? 15_000 : 5000);
}
function hideToast(): void { const toast = document.querySelector<HTMLElement>('#toast'); if (toast) toast.hidden = true; }

function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  navigator.serviceWorker.register('/sw.js').catch(() => showToast('Offline setup did not complete. Reload while connected to try again.'));
  navigator.serviceWorker.addEventListener('message', event => { if (event.data?.type === 'SW_UPDATED' && sessionStorage.getItem('hce-sw-ready')) showToast('A fresh version is ready.', 'Reload'); sessionStorage.setItem('hce-sw-ready', '1'); });
}
