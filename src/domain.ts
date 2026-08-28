export type IntervalUnit = 'weeks' | 'months' | 'years';
export type WorkType = 'DIY' | 'Vendor';

export interface EvidenceAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  kind: 'photo' | 'receipt';
  blob: Blob;
}

export interface ServiceEvent {
  id: string;
  completedDate: string;
  workType: WorkType;
  provider: string;
  note: string;
  attachments: EvidenceAttachment[];
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  title: string;
  area: string;
  issue: string;
  intervalValue: number;
  intervalUnit: IntervalUnit;
  events: ServiceEvent[];
  createdAt: string;
  updatedAt: string;
}

export type DueKind = 'overdue' | 'soon' | 'current' | 'unscheduled';

export function createId(): string {
  return crypto.randomUUID();
}

function utcDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addInterval(date: string, amount: number, unit: IntervalUnit): string {
  const source = utcDate(date);
  if (unit === 'weeks') source.setUTCDate(source.getUTCDate() + amount * 7);
  if (unit === 'months') {
    const day = source.getUTCDate();
    source.setUTCDate(1);
    source.setUTCMonth(source.getUTCMonth() + amount);
    const lastDay = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + 1, 0)).getUTCDate();
    source.setUTCDate(Math.min(day, lastDay));
  }
  if (unit === 'years') {
    const month = source.getUTCMonth();
    source.setUTCFullYear(source.getUTCFullYear() + amount);
    if (source.getUTCMonth() !== month) source.setUTCDate(0);
  }
  return source.toISOString().slice(0, 10);
}

export function latestEvent(record: MaintenanceRecord): ServiceEvent | undefined {
  return [...record.events].sort((a, b) => b.completedDate.localeCompare(a.completedDate))[0];
}

export function nextDue(record: MaintenanceRecord): string | null {
  const event = latestEvent(record);
  if (!event || !record.intervalValue) return null;
  return addInterval(event.completedDate, record.intervalValue, record.intervalUnit);
}

export function dueStatus(record: MaintenanceRecord, today = new Date()): { kind: DueKind; label: string; due: string | null } {
  const due = nextDue(record);
  if (!due) return { kind: 'unscheduled', label: 'No schedule', due: null };
  const todayKey = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const days = Math.ceil((utcDate(due).getTime() - todayKey.getTime()) / 86_400_000);
  if (days < 0) return { kind: 'overdue', label: `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`, due };
  if (days <= 30) return { kind: 'soon', label: days === 0 ? 'Due today' : `Due in ${days} day${days === 1 ? '' : 's'}`, due };
  return { kind: 'current', label: 'On schedule', due };
}

export function formatDate(value: string | null): string {
  if (!value) return 'Not scheduled';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(utcDate(value));
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}
