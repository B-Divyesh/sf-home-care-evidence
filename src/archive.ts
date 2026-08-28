import type { EvidenceAttachment, MaintenanceRecord } from './domain';

interface SerializableAttachment extends Omit<EvidenceAttachment, 'blob'> { data: string }
type SerializableRecord = Omit<MaintenanceRecord, 'events'> & { events: Array<Omit<MaintenanceRecord['events'][number], 'attachments'> & { attachments: SerializableAttachment[] }> };
type ArchiveObject = Record<string, unknown>;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  try {
    if (value.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw new Error();
    const binary = atob(value);
    return Uint8Array.from(binary, character => character.charCodeAt(0));
  } catch {
    throw new Error('This archive contains a damaged attachment.');
  }
}

async function attachmentToJSON(attachment: EvidenceAttachment): Promise<SerializableAttachment> {
  return { ...attachment, data: bytesToBase64(new Uint8Array(await attachment.blob.arrayBuffer())) };
}

async function recordsToJSON(records: MaintenanceRecord[]): Promise<SerializableRecord[]> {
  return Promise.all(records.map(async record => ({
    ...record,
    events: await Promise.all(record.events.map(async event => ({
      ...event,
      attachments: await Promise.all(event.attachments.map(attachmentToJSON))
    })))
  })));
}

function object(value: unknown, message: string): ArchiveObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(message);
  return value as ArchiveObject;
}

function string(value: unknown, label: string, maximum: number, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim()) || value.length > maximum) {
    throw new Error(`This archive contains an invalid ${label}.`);
  }
  return value;
}

function isoTimestamp(value: unknown, label: string): string {
  const result = string(value, label, 40);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(result) || Number.isNaN(Date.parse(result))) {
    throw new Error(`This archive contains an invalid ${label}.`);
  }
  return result;
}

function calendarDate(value: unknown): string {
  const result = string(value, 'completed date', 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(result);
  if (!match) throw new Error('This archive contains an invalid completed date.');
  const parsed = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (parsed.toISOString().slice(0, 10) !== result) throw new Error('This archive contains an invalid completed date.');
  return result;
}

function attachmentFromJSON(value: unknown): EvidenceAttachment {
  const item = object(value, 'This archive contains an invalid attachment.');
  const id = string(item.id, 'attachment id', 200);
  const name = string(item.name, 'attachment name', 255);
  const type = string(item.type, 'attachment type', 150);
  const kind = item.kind;
  const size = item.size;
  if (kind !== 'photo' && kind !== 'receipt') throw new Error('This archive contains an invalid attachment kind.');
  if (!Number.isSafeInteger(size) || (size as number) < 0 || (size as number) > 10 * 1024 * 1024) throw new Error('This archive contains an invalid attachment size.');
  const bytes = base64ToBytes(string(item.data, 'attachment data', 14_000_000, true));
  if (bytes.byteLength !== size) throw new Error('This archive contains a damaged attachment.');
  return { id, name, type, kind, size: size as number, blob: new Blob([bytes.slice().buffer as ArrayBuffer], { type }) };
}

function recordsFromJSON(value: unknown): MaintenanceRecord[] {
  if (!Array.isArray(value)) throw new Error('This file does not contain a Home Care Evidence archive.');
  const recordIds = new Set<string>();
  const eventIds = new Set<string>();
  const attachmentIds = new Set<string>();
  return value.map(rawRecord => {
    const record = object(rawRecord, 'This archive contains an invalid maintenance card.');
    const id = string(record.id, 'maintenance card id', 200);
    if (recordIds.has(id)) throw new Error('This archive contains duplicate maintenance card ids.');
    recordIds.add(id);
    const intervalValue = record.intervalValue;
    if (!Number.isInteger(intervalValue) || (intervalValue as number) < 1 || (intervalValue as number) > 120) throw new Error('This archive contains an invalid repeat interval.');
    if (record.intervalUnit !== 'weeks' && record.intervalUnit !== 'months' && record.intervalUnit !== 'years') throw new Error('This archive contains an invalid interval unit.');
    if (!Array.isArray(record.events) || record.events.length === 0) throw new Error('This archive contains a maintenance card without service history.');
    const events = record.events.map(rawEvent => {
      const event = object(rawEvent, 'This archive contains an invalid service entry.');
      const eventId = string(event.id, 'service entry id', 200);
      if (eventIds.has(eventId)) throw new Error('This archive contains duplicate service entry ids.');
      eventIds.add(eventId);
      if (event.workType !== 'DIY' && event.workType !== 'Vendor') throw new Error('This archive contains an invalid work type.');
      const workType = event.workType as MaintenanceRecord['events'][number]['workType'];
      if (!Array.isArray(event.attachments)) throw new Error('This archive contains an invalid attachment list.');
      const attachments = event.attachments.map(rawAttachment => {
        const result = attachmentFromJSON(rawAttachment);
        if (attachmentIds.has(result.id)) throw new Error('This archive contains duplicate attachment ids.');
        attachmentIds.add(result.id);
        return result;
      });
      return {
        id: eventId,
        completedDate: calendarDate(event.completedDate),
        workType,
        provider: string(event.provider, 'provider', 100, true),
        note: string(event.note, 'service note', 1200),
        attachments,
        createdAt: isoTimestamp(event.createdAt, 'service timestamp')
      };
    });
    return {
      id,
      title: string(record.title, 'card name', 80),
      area: string(record.area, 'area or system', 60),
      issue: string(record.issue, 'observation', 800),
      intervalValue: intervalValue as number,
      intervalUnit: record.intervalUnit,
      events,
      createdAt: isoTimestamp(record.createdAt, 'card creation timestamp'),
      updatedAt: isoTimestamp(record.updatedAt, 'card update timestamp')
    };
  });
}

async function archivePayload(records: MaintenanceRecord[]): Promise<string> {
  return JSON.stringify({ product: 'home-care-evidence', version: 1, exportedAt: new Date().toISOString(), records: await recordsToJSON(records) });
}

function download(contents: BlobPart, name: string, type: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportOpenArchive(records: MaintenanceRecord[]): Promise<void> {
  download(await archivePayload(records), `home-care-evidence-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
}

async function encryptionKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: 250_000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function exportEncryptedArchive(records: MaintenanceRecord[], passphrase: string): Promise<void> {
  if (passphrase.length < 10) throw new Error('Use a passphrase with at least 10 characters.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await encryptionKey(passphrase, salt), encoder.encode(await archivePayload(records)));
  const envelope = JSON.stringify({ product: 'home-care-evidence', encrypted: true, version: 1, algorithm: 'AES-GCM-256/PBKDF2-SHA256', iterations: 250000, salt: bytesToBase64(salt), iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(encrypted)) });
  download(envelope, `home-care-evidence-${new Date().toISOString().slice(0, 10)}.hce`, 'application/octet-stream');
}

export async function readArchive(file: File, passphrase: string): Promise<MaintenanceRecord[]> {
  let parsed: ArchiveObject;
  try { parsed = object(JSON.parse(await file.text()), 'The selected file is not a readable archive.'); } catch { throw new Error('The selected file is not a readable archive.'); }
  if (parsed.product !== 'home-care-evidence') throw new Error('This archive belongs to a different product.');
  if (parsed.version !== 1) throw new Error('This archive version is not supported.');
  if (parsed.encrypted === true) {
    if (!passphrase) throw new Error('Enter the passphrase used for this encrypted archive.');
    if (parsed.algorithm !== 'AES-GCM-256/PBKDF2-SHA256' || parsed.iterations !== 250000) throw new Error('This encrypted archive uses an unsupported format.');
    try {
      const iv = base64ToBytes(string(parsed.iv, 'encryption IV', 100));
      const salt = base64ToBytes(string(parsed.salt, 'encryption salt', 100));
      const data = base64ToBytes(string(parsed.data, 'encrypted data', 200_000_000));
      if (iv.byteLength !== 12 || salt.byteLength !== 16) throw new Error();
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, await encryptionKey(passphrase, salt), data as BufferSource);
      parsed = object(JSON.parse(decoder.decode(decrypted)), 'That passphrase did not open the archive.');
    } catch { throw new Error('That passphrase did not open the archive.'); }
    if (parsed.product !== 'home-care-evidence' || parsed.version !== 1) throw new Error('The encrypted archive contains an invalid payload.');
  } else if (parsed.encrypted !== undefined && parsed.encrypted !== false) {
    throw new Error('This archive has an invalid encryption marker.');
  }
  return recordsFromJSON(parsed.records);
}
