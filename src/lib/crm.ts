export const kinds = ['contact', 'company', 'deal', 'task'] as const;
export type RecordKind = typeof kinds[number];
export const views = ['dashboard', 'contacts', 'companies', 'deals', 'tasks', 'activity'] as const;
export type CrmView = typeof views[number];
export function validateCrmSearch(search: Record<string, unknown>) {
  return {
    view: views.includes(search.view as CrmView) ? search.view as CrmView : 'dashboard' as CrmView,
    record: typeof search.record === 'string' ? search.record : '',
  };
}
export const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;
export type Stage = typeof stages[number];
export const stageNames: Record<string, string> = { lead: 'New leads', qualified: 'Qualified', proposal: 'Proposal', negotiation: 'Negotiation', won: 'Won', lost: 'Lost' };

export interface CrmRecord {
  id: string; workspaceId: string; kind: RecordKind; name: string; email: string;
  phone: string; role: string; website: string; industry: string; tags: string[];
  status: string; value: number; closeDate: string; dueDate: string; completed: boolean;
  companyId: string | null; contactId: string | null; dealId: string | null;
  createdAt: number; updatedAt: number;
}
export interface CrmNote { id: string; workspaceId: string; recordId: string; body: string; author: string; createdAt: number }
export interface CrmActivity { id: string; workspaceId: string; recordId: string | null; message: string; type: string; author: string; createdAt: number }
export interface CrmData { workspace: { id: string; name: string }; records: CrmRecord[]; notes: CrmNote[]; activities: CrmActivity[] }
export const money = (cents: number, compact = false) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, ...(compact ? { notation: 'compact' as const } : {}) }).format(cents / 100);
export const initials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
export const dateLabel = (date: string) => date ? new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date';
export const today = () => new Date().toISOString().slice(0, 10);
export function blankRecord(kind: RecordKind): CrmRecord {
  return { id: '', workspaceId: '', kind, name: '', email: '', phone: '', role: '', website: '', industry: '', tags: [], status: kind === 'contact' || kind === 'company' ? 'prospect' : 'lead', value: 0, closeDate: '', dueDate: '', completed: false, companyId: null, contactId: null, dealId: null, createdAt: 0, updatedAt: 0 };
}

export function validateRecord(input: unknown): CrmRecord {
  if (!input || typeof input !== 'object') throw new Error('Invalid record.');
  const r = input as CrmRecord;
  if (!kinds.includes(r.kind)) throw new Error('Invalid record type.');
  const result = blankRecord(r.kind);
  for (const field of ['id', 'name', 'email', 'phone', 'role', 'website', 'industry', 'status', 'closeDate', 'dueDate'] as const) {
    if (typeof r[field] !== 'string' || r[field].length > 500) throw new Error(`Invalid ${field}.`);
    result[field] = r[field].trim();
  }
  if (!result.name) throw new Error('A name is required.');
  if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) throw new Error('Enter a valid email address.');
  if (result.website) {
    try { const url = new URL(result.website); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); }
    catch { throw new Error('Website must be a valid http or https URL.'); }
  }
  for (const field of ['closeDate', 'dueDate'] as const) {
    if (result[field] && (!/^\d{4}-\d{2}-\d{2}$/.test(result[field]) || Number.isNaN(Date.parse(result[field])) || new Date(result[field]).toISOString().slice(0, 10) !== result[field])) throw new Error('Enter a valid date.');
  }
  if (!Number.isSafeInteger(r.value) || r.value < 0 || r.value > 100_000_000_000) throw new Error('Enter a valid non-negative deal value.');
  result.value = r.value;
  if (!Array.isArray(r.tags) || r.tags.length > 20 || r.tags.some(t => typeof t !== 'string' || t.length > 40)) throw new Error('Use up to 20 tags, each under 40 characters.');
  result.tags = [...new Set(r.tags.map(t => t.trim()).filter(Boolean))];
  if (typeof r.completed !== 'boolean') throw new Error('Invalid completion status.');
  result.completed = r.completed;
  for (const field of ['companyId', 'contactId', 'dealId'] as const) {
    if (r[field] !== null && (typeof r[field] !== 'string' || r[field].length > 100)) throw new Error('Invalid linked record.');
    result[field] = r[field] || null;
  }
  if (r.kind === 'deal' && !stages.includes(r.status as Stage)) throw new Error('Invalid pipeline stage.');
  if ((r.kind === 'contact' || r.kind === 'company') && !['prospect', 'customer', 'partner'].includes(r.status)) throw new Error('Invalid relationship status.');
  return result;
}

// RFC 4180 parsing: quoted commas, escaped quotes, BOMs, and multiline fields.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else if (!quoted && cell.length) throw new Error('Invalid CSV quoting.');
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (quoted) throw new Error('CSV contains an unclosed quote.');
  row.push(cell); if (row.some(Boolean)) rows.push(row);
  return rows;
}
export const csvCell = (value: string) => `"${(/^[=+@\-\t\r]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`;
