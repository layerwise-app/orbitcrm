export const kinds = ['contact', 'company', 'deal', 'task'] as const;
export type RecordKind = (typeof kinds)[number];

export const views = ['dashboard', 'contacts', 'companies', 'deals', 'tasks', 'activity'] as const;
export type CrmView = (typeof views)[number];

export function validateCrmSearch(search: Record<string, unknown>) {
  return {
    view: views.includes(search.view as CrmView) ? (search.view as CrmView) : ('dashboard' as CrmView),
    record: typeof search.record === 'string' ? search.record : '',
  };
}

export const kindView: Record<RecordKind, CrmView> = {
  contact: 'contacts',
  company: 'companies',
  deal: 'deals',
  task: 'tasks',
};

export const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;
export type Stage = (typeof stages)[number];
export const openStages = ['lead', 'qualified', 'proposal', 'negotiation'] as const;
export const stageNames: Record<string, string> = {
  lead: 'Lead',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};
/** Default win likelihood per stage; drives the weighted forecast. */
export const stageProbability: Record<string, number> = {
  lead: 0.1,
  qualified: 0.25,
  proposal: 0.5,
  negotiation: 0.75,
  won: 1,
  lost: 0,
};
export const lostReasons = ['Price', 'Timing', 'Competitor', 'No decision', 'Missing feature', 'Other'] as const;

export const relationshipStatuses = ['prospect', 'customer', 'partner'] as const;
export type RelationshipStatus = (typeof relationshipStatuses)[number];
export const statusNames: Record<string, string> = { prospect: 'Prospect', customer: 'Customer', partner: 'Partner' };

export const noteTypes = ['note', 'call', 'email', 'meeting'] as const;
export type NoteType = (typeof noteTypes)[number];
export const noteTypeNames: Record<NoteType, string> = { note: 'Note', call: 'Call', email: 'Email', meeting: 'Meeting' };

export interface CrmRecord {
  id: string;
  workspaceId: string;
  kind: RecordKind;
  name: string;
  email: string;
  phone: string;
  role: string;
  website: string;
  industry: string;
  tags: string[];
  status: string;
  value: number;
  closeDate: string;
  dueDate: string;
  completed: boolean;
  companyId: string | null;
  contactId: string | null;
  dealId: string | null;
  owner: string;
  lostReason: string;
  createdAt: number;
  updatedAt: number;
}
export interface CrmNote {
  id: string;
  workspaceId: string;
  recordId: string;
  type: NoteType;
  body: string;
  author: string;
  createdAt: number;
}
export interface CrmActivity {
  id: string;
  workspaceId: string;
  recordId: string | null;
  message: string;
  type: string;
  author: string;
  createdAt: number;
}
export interface CrmData {
  workspace: { id: string; name: string };
  records: CrmRecord[];
  notes: CrmNote[];
  activities: CrmActivity[];
}

const moneyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const compactMoneyFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});
export const money = (cents: number, compact = false) => (compact ? compactMoneyFormat : moneyFormat).format(cents / 100);
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
/** Date-only fields are UTC calendar days. */
export const dateLabel = (date: string) =>
  date ? new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : 'No date';
export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

export function blankRecord(kind: RecordKind): CrmRecord {
  return {
    id: '',
    workspaceId: '',
    kind,
    name: '',
    email: '',
    phone: '',
    role: '',
    website: '',
    industry: '',
    tags: [],
    status: kind === 'contact' || kind === 'company' ? 'prospect' : 'lead',
    value: 0,
    closeDate: '',
    dueDate: '',
    completed: false,
    companyId: null,
    contactId: null,
    dealId: null,
    owner: '',
    lostReason: '',
    createdAt: 0,
    updatedAt: 0,
  };
}

const textFields = ['id', 'name', 'email', 'phone', 'role', 'website', 'industry', 'status', 'closeDate', 'dueDate', 'owner', 'lostReason'] as const;

export function validateRecord(input: unknown): CrmRecord {
  if (!input || typeof input !== 'object') throw new Error('Invalid record.');
  const r = input as CrmRecord;
  if (!kinds.includes(r.kind)) throw new Error('Invalid record type.');
  const result = blankRecord(r.kind);
  for (const field of textFields) {
    if (typeof r[field] !== 'string' || r[field].length > 500) throw new Error(`Invalid ${field}.`);
    result[field] = r[field].trim();
  }
  if (!result.name) throw new Error('A name is required.');
  if (result.owner.length > 80) throw new Error('Owner must be under 80 characters.');
  if (result.lostReason.length > 200) throw new Error('Lost reason must be under 200 characters.');
  if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) throw new Error('Enter a valid email address.');
  if (result.website) {
    try {
      const url = new URL(result.website);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch {
      throw new Error('Website must be a valid http or https URL.');
    }
  }
  for (const field of ['closeDate', 'dueDate'] as const) {
    const value = result[field];
    if (value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) {
      throw new Error('Enter a valid date.');
    }
  }
  if (!Number.isSafeInteger(r.value) || r.value < 0 || r.value > 100_000_000_000) throw new Error('Enter a valid non-negative deal value.');
  result.value = r.value;
  if (!Array.isArray(r.tags) || r.tags.length > 20 || r.tags.some((t) => typeof t !== 'string' || t.length > 40)) {
    throw new Error('Use up to 20 tags, each under 40 characters.');
  }
  result.tags = [...new Set(r.tags.map((t) => t.trim()).filter(Boolean))];
  if (typeof r.completed !== 'boolean') throw new Error('Invalid completion status.');
  result.completed = r.completed;
  for (const field of ['companyId', 'contactId', 'dealId'] as const) {
    if (r[field] !== null && (typeof r[field] !== 'string' || r[field].length > 100)) throw new Error('Invalid linked record.');
    result[field] = r[field] || null;
  }
  if (r.kind === 'deal' && !stages.includes(r.status as Stage)) throw new Error('Invalid pipeline stage.');
  if ((r.kind === 'contact' || r.kind === 'company') && !relationshipStatuses.includes(r.status as RelationshipStatus)) {
    throw new Error('Invalid relationship status.');
  }
  // A lost reason only describes lost deals.
  if (result.kind !== 'deal' || result.status !== 'lost') result.lostReason = '';
  return result;
}

/** Moving a deal into Won or Lost records the day as its actual close date. */
export function moveDeal(deal: CrmRecord, stage: Stage, lostReason = '', on = today()): CrmRecord {
  const closing = (stage === 'won' || stage === 'lost') && deal.status !== stage;
  return { ...deal, status: stage, lostReason: stage === 'lost' ? lostReason : '', closeDate: closing ? on : deal.closeDate };
}

/** One activity line per save, shared by the server and the in-memory demo. */
export function describeChange(previous: CrmRecord | undefined, next: CrmRecord): { message: string; type: string } {
  if (!previous) return { message: `Added ${next.name}`, type: 'created' };
  if (next.kind === 'task' && !previous.completed && next.completed) return { message: `Completed ${next.name}`, type: 'completed' };
  if (next.kind === 'deal' && previous.status !== next.status) {
    if (next.status === 'won') return { message: `Won ${next.name}`, type: 'won' };
    if (next.status === 'lost') return { message: `Lost ${next.name}${next.lostReason ? ` · ${next.lostReason}` : ''}`, type: 'lost' };
    return { message: `Moved ${next.name} to ${stageNames[next.status]}`, type: 'stage' };
  }
  return { message: `Updated ${next.name}`, type: 'updated' };
}

export function validateNoteInput(input: unknown): { recordId: string; type: NoteType; body: string } {
  const value = input as { recordId?: unknown; type?: unknown; body?: unknown } | null;
  if (typeof value?.recordId !== 'string' || !value.recordId || value.recordId.length > 100) throw new Error('Invalid record ID.');
  const type = value.type ?? 'note';
  if (!noteTypes.includes(type as NoteType)) throw new Error('Invalid entry type.');
  if (typeof value.body !== 'string' || !value.body.trim() || value.body.length > 10_000) throw new Error('Enter 1 to 10,000 characters.');
  return { recordId: value.recordId, type: type as NoteType, body: value.body.trim() };
}

/** Activity line for a timeline entry, shared by the server and the demo. */
export function entryMessage(type: NoteType, record: Pick<CrmRecord, 'name' | 'kind'>) {
  if (type === 'note') return `Added a note to ${record.name}`;
  const article = type === 'email' ? 'an' : 'a';
  return `Logged ${article} ${type} ${record.kind === 'contact' ? 'with' : 'on'} ${record.name}`;
}

export interface BulkInput {
  ids: string[];
  action: 'tag' | 'status' | 'delete';
  value: string;
}
export function validateBulkInput(input: unknown): BulkInput {
  const value = input as Partial<BulkInput> | null;
  if (!Array.isArray(value?.ids) || !value.ids.length || value.ids.length > 500) throw new Error('Select between 1 and 500 records.');
  if (value.ids.some((id) => typeof id !== 'string' || !id || id.length > 100)) throw new Error('Invalid record ID.');
  if (!['tag', 'status', 'delete'].includes(value.action as string)) throw new Error('Invalid bulk action.');
  const text = typeof value.value === 'string' ? value.value.trim() : '';
  if (value.action === 'tag' && (!text || text.length > 40)) throw new Error('Enter a tag under 40 characters.');
  if (value.action === 'status' && !relationshipStatuses.includes(text as RelationshipStatus)) throw new Error('Invalid relationship status.');
  return { ids: [...new Set(value.ids)], action: value.action as BulkInput['action'], value: text };
}

/** Applies a validated tag or status bulk edit; the demo and server share it. */
export function applyBulkEdit(record: CrmRecord, input: BulkInput, now: number): CrmRecord {
  if (input.action === 'tag') {
    if (record.tags.includes(input.value) || record.tags.length >= 20) return record;
    return { ...record, tags: [...record.tags, input.value], updatedAt: now };
  }
  if (input.action === 'status') return { ...record, status: input.value, updatedAt: now };
  return record;
}

export function bulkMessage(input: BulkInput, count: number, kind: 'contact' | 'company') {
  const noun = count === 1 ? kind : kind === 'company' ? 'companies' : 'contacts';
  if (input.action === 'tag') return `Tagged ${count} ${noun} “${input.value}”`;
  if (input.action === 'status') return `Set ${count} ${noun} to ${statusNames[input.value]}`;
  return `Deleted ${count} ${noun}`;
}

// RFC 4180 parsing: quoted commas, escaped quotes, BOMs, and multiline fields.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (!quoted && cell.length) throw new Error('Invalid CSV quoting.');
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else cell += char;
  }
  if (quoted) throw new Error('CSV contains an unclosed quote.');
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
export const csvCell = (value: string) => `"${(/^[=+@\-\t\r]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`;
