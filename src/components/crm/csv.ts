import { blankRecord, csvCell, parseCsv, today, validateRecord, type CrmRecord } from '~/lib/crm';

/** Downloads contacts or companies as a UTF-8 CSV that Excel opens correctly. */
export function exportRecords(kind: 'contact' | 'company', list: CrmRecord[], byId: Map<string, CrmRecord>) {
  const headers =
    kind === 'contact'
      ? ['name', 'email', 'phone', 'role', 'company', 'status', 'tags']
      : ['name', 'website', 'industry', 'email', 'phone', 'status', 'tags'];
  const row = (r: CrmRecord) =>
    kind === 'contact'
      ? [r.name, r.email, r.phone, r.role, (r.companyId && byId.get(r.companyId)?.name) || '', r.status, r.tags.join(';')]
      : [r.name, r.website, r.industry, r.email, r.phone, r.status, r.tags.join(';')];
  const csv = [headers.join(','), ...list.map((r) => row(r).map(csvCell).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `orbit-${kind === 'contact' ? 'contacts' : 'companies'}-${today()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Parses a contact CSV into validated records; company names must match existing companies. */
export async function readContactsCsv(file: File, companies: CrmRecord[]) {
  if (file.size > 2_000_000) throw new Error('Choose a CSV under 2 MB.');
  const [header, ...rows] = parseCsv(await file.text());
  if (!header || !rows.length || rows.length > 500) throw new Error('The CSV must contain a header and 1–500 contacts.');
  const columns = header.map((c) => c.toLowerCase().trim().replace(/\s+/g, '_'));
  if (!columns.includes('name') && !columns.includes('full_name')) throw new Error('A name or full_name column is required.');
  return rows.map((row, i) => {
    const get = (key: string) => row[columns.indexOf(key)]?.trim() ?? '';
    const companyName = get('company');
    const company = companies.find((c) => c.name.toLowerCase() === companyName.toLowerCase());
    if (companyName && !company) throw new Error(`Row ${i + 2}: Company "${companyName}" not found. Create it first or leave it blank.`);
    try {
      return validateRecord({
        ...blankRecord('contact'),
        name: get('name') || get('full_name'),
        email: get('email'),
        phone: get('phone'),
        role: get('role') || get('job_title'),
        companyId: company?.id ?? null,
        status: get('status') || 'prospect',
        tags: get('tags')
          .split(';')
          .map((t) => t.trim())
          .filter(Boolean),
      });
    } catch (error) {
      throw new Error(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Invalid data'}`);
    }
  });
}
