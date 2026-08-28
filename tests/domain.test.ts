import { describe, expect, it } from 'vitest';
import { addInterval, dueStatus, nextDue, type MaintenanceRecord } from '../src/domain';

function record(completedDate: string, intervalValue = 1, intervalUnit: 'weeks' | 'months' | 'years' = 'months'): MaintenanceRecord {
  return {
    id: 'record-1', title: 'Test', area: 'Utility', issue: 'Routine work', intervalValue, intervalUnit,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    events: [{ id: 'event-1', completedDate, workType: 'DIY', provider: '', note: 'Done', attachments: [], createdAt: '2026-01-01T00:00:00.000Z' }]
  };
}

describe('recurrence dates', () => {
  it('clamps a monthly interval to the end of a shorter month', () => {
    expect(addInterval('2026-01-31', 1, 'months')).toBe('2026-02-28');
  });

  it('clamps leap day when adding a year', () => {
    expect(addInterval('2024-02-29', 1, 'years')).toBe('2025-02-28');
  });

  it('uses the latest service entry for the next due date', () => {
    const value = record('2026-01-01', 6, 'months');
    value.events.push({ ...value.events[0], id: 'event-2', completedDate: '2026-03-15' });
    expect(nextDue(value)).toBe('2026-09-15');
  });

  it('labels upcoming and overdue work without relying on color', () => {
    expect(dueStatus(record('2026-07-31'), new Date('2026-08-15T00:00:00Z')).label).toBe('Due in 16 days');
    expect(dueStatus(record('2026-06-01'), new Date('2026-08-15T00:00:00Z')).kind).toBe('overdue');
  });
});
