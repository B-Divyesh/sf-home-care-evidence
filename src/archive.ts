import type { EvidenceAttachment, MaintenanceRecord } from './domain';

interface SerializableAttachment extends Omit<EvidenceAttachment, 'blob'> { data: string }
type SerializableRecord = Omit<MaintenanceRecord, 'events'> & { events: Array<Omit<MaintenanceRecord['events'][number], 'attachments'> & { attachments: SerializableAttachment[] }> };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
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

function recordsFromJSON(records: SerializableRecord[]): MaintenanceRecord[] {
  if (!Array.isArray(records)) throw new Error('This file does not contain a Home Care Evidence archive.');
  return records.map(record => ({
    ...(typeof record?.id === 'string' && typeof record.title === 'string' && typeof record.issue === 'string' && Array.isArray(record.events)
      ? record
      : (() => { throw new Error('This archive contains an invalid maintenance card.'); })()),
    events: record.events.map(event => ({
      ...(typeof event?.id === 'string' && typeof event.completedDate === 'string' && typeof event.note === 'string' && Array.isArray(event.attachments)
        ? event
        : (() => { throw new Error('This archive contains an invalid service entry.'); })()),
      attachments: event.attachments.map(({ data, ...attachment }) => ({
        ...attachment,
        blob: new Blob([base64ToBytes(data).slice().buffer as ArrayBuffer], { type: attachment.type })
      }))
    }))
  }));
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
  let parsed: { encrypted?: boolean; salt?: string; iv?: string; data?: string; product?: string; records?: SerializableRecord[] };
  try { parsed = JSON.parse(await file.text()) as typeof parsed; } catch { throw new Error('The selected file is not a readable archive.'); }
  if (parsed.product !== 'home-care-evidence') throw new Error('This archive belongs to a different product.');
  if (parsed.encrypted) {
    if (!passphrase) throw new Error('Enter the passphrase used for this encrypted archive.');
    try {
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(parsed.iv ?? '') as BufferSource }, await encryptionKey(passphrase, base64ToBytes(parsed.salt ?? '')), base64ToBytes(parsed.data ?? '') as BufferSource);
      parsed = JSON.parse(decoder.decode(decrypted)) as typeof parsed;
    } catch { throw new Error('That passphrase did not open the archive.'); }
  }
  return recordsFromJSON(parsed.records ?? []);
}
