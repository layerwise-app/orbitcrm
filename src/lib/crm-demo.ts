import { blankRecord, type CrmActivity, type CrmData, type CrmNote, type CrmRecord, type NoteType, type RecordKind } from './crm.ts';

// Sample workspace for /demo (and "Load sample data"). Dates are relative to
// today so every chart, overdue badge, and "closing this month" view stays alive.
export const demoUser = { id: 'demo', name: 'Alex Morgan', email: 'alex@acme.co' };
export const demoOwners = ['Alex Morgan', 'Priya Shah', 'Jordan Lee', 'Sam Rivera'];

const DAY = 86_400_000;
const companies: Array<[string, string, string, string, string, string[]]> = [
  // id, name, industry, domain, status, tags
  ['co-northwind', 'Northwind Logistics', 'Logistics', 'northwind.io', 'customer', ['Enterprise']],
  ['co-lumen', 'Lumen Labs', 'Software', 'lumenlabs.dev', 'customer', ['SaaS']],
  ['co-brightpath', 'Brightpath Health', 'Healthcare', 'brightpath.health', 'prospect', ['Enterprise']],
  ['co-halcyon', 'Halcyon Studio', 'Design', 'halcyon.studio', 'partner', ['Agency']],
  ['co-kestrel', 'Kestrel Capital', 'Finance', 'kestrel.capital', 'prospect', ['Enterprise']],
  ['co-atlas', 'Atlas Freight', 'Logistics', 'atlasfreight.com', 'customer', ['Mid-market']],
  ['co-juniper', 'Juniper Retail', 'Retail', 'juniper.shop', 'prospect', ['Mid-market']],
  ['co-vantage', 'Vantage Analytics', 'Software', 'vantage.ai', 'prospect', ['SaaS']],
  ['co-cobalt', 'Cobalt Robotics', 'Manufacturing', 'cobalt.bot', 'prospect', ['Startup']],
  ['co-meridian', 'Meridian Hotels', 'Hospitality', 'meridianhotels.com', 'customer', ['Enterprise']],
  ['co-fieldnote', 'Fieldnote Coffee', 'Food & beverage', 'fieldnote.coffee', 'partner', ['SMB']],
  ['co-pinecrest', 'Pinecrest Schools', 'Education', 'pinecrest.edu', 'prospect', ['Public sector']],
];
const contacts: Array<[string, string, string, string, string, string[]]> = [
  // id, name, company, role, status, tags
  ['ct-maya', 'Maya Chen', 'co-northwind', 'VP Operations', 'customer', ['Decision maker']],
  ['ct-ethan', 'Ethan Brooks', 'co-northwind', 'IT Director', 'customer', ['Technical']],
  ['ct-sofia', 'Sofia Martins', 'co-lumen', 'Head of Revenue', 'customer', ['Champion', 'VIP']],
  ['ct-liam', 'Liam O’Connor', 'co-lumen', 'Finance Manager', 'customer', ['Billing']],
  ['ct-grace', 'Grace Okafor', 'co-brightpath', 'Chief Digital Officer', 'prospect', ['Decision maker', 'VIP']],
  ['ct-noah', 'Noah Fischer', 'co-brightpath', 'Procurement Lead', 'prospect', ['Billing']],
  ['ct-ava', 'Ava Lindqvist', 'co-halcyon', 'Founder', 'partner', ['Champion']],
  ['ct-daniel', 'Daniel Kim', 'co-kestrel', 'Managing Partner', 'prospect', ['Decision maker']],
  ['ct-isla', 'Isla Moreno', 'co-kestrel', 'Operations Analyst', 'prospect', []],
  ['ct-marcus', 'Marcus Bell', 'co-atlas', 'Head of Fleet', 'customer', ['Champion']],
  ['ct-hana', 'Hana Suzuki', 'co-atlas', 'Systems Engineer', 'customer', ['Technical']],
  ['ct-oliver', 'Oliver Grant', 'co-juniper', 'COO', 'prospect', ['Decision maker']],
  ['ct-zara', 'Zara Ahmed', 'co-juniper', 'Store Ops Manager', 'prospect', []],
  ['ct-lucas', 'Lucas Weber', 'co-vantage', 'CTO', 'prospect', ['Technical', 'Decision maker']],
  ['ct-emma', 'Emma Novak', 'co-vantage', 'Product Lead', 'prospect', ['Champion']],
  ['ct-ryan', 'Ryan Patel', 'co-cobalt', 'Co-founder', 'prospect', ['Decision maker']],
  ['ct-chloe', 'Chloé Dubois', 'co-meridian', 'Director of Guest Experience', 'customer', ['Champion', 'VIP']],
  ['ct-james', 'James Whitfield', 'co-meridian', 'CFO', 'customer', ['Billing', 'Decision maker']],
  ['ct-nina', 'Nina Rossi', 'co-fieldnote', 'Owner', 'partner', []],
  ['ct-theo', 'Theo Andersen', 'co-pinecrest', 'Superintendent', 'prospect', ['Decision maker']],
  ['ct-priyanka', 'Priyanka Rao', 'co-pinecrest', 'IT Coordinator', 'prospect', ['Technical']],
  ['ct-ben', 'Ben Carter', '', 'Independent consultant', 'partner', ['Referral']],
];
const deals: Array<[string, string, string, string, number, string, number, string, string?]> = [
  // id, name, company, contact, value ($), stage, close offset (days), owner, lost reason
  ['d-northwind-renewal', 'Northwind renewal + upsell', 'co-northwind', 'ct-maya', 64000, 'negotiation', 4, 'Alex Morgan'],
  ['d-meridian-crm', 'Meridian guest CRM', 'co-meridian', 'ct-chloe', 54000, 'negotiation', 11, 'Priya Shah'],
  ['d-lumen-team', 'Lumen team plan', 'co-lumen', 'ct-sofia', 24500, 'negotiation', -2, 'Alex Morgan'],
  ['d-brightpath-ent', 'Brightpath enterprise', 'co-brightpath', 'ct-grace', 86000, 'proposal', 9, 'Priya Shah'],
  ['d-atlas-expansion', 'Atlas fleet expansion', 'co-atlas', 'ct-marcus', 38500, 'proposal', 14, 'Jordan Lee'],
  ['d-halcyon-partner', 'Halcyon partner program', 'co-halcyon', 'ct-ava', 12000, 'proposal', 6, 'Sam Rivera'],
  ['d-vantage-platform', 'Vantage data platform', 'co-vantage', 'ct-lucas', 42000, 'qualified', 21, 'Jordan Lee'],
  ['d-kestrel-seats', 'Kestrel advisory seats', 'co-kestrel', 'ct-daniel', 27000, 'qualified', 18, 'Alex Morgan'],
  ['d-fieldnote-portal', 'Fieldnote wholesale portal', 'co-fieldnote', 'ct-nina', 6800, 'qualified', 12, 'Sam Rivera'],
  ['d-juniper-pos', 'Juniper POS rollout', 'co-juniper', 'ct-oliver', 18000, 'lead', 40, 'Priya Shah'],
  ['d-pinecrest-district', 'Pinecrest district license', 'co-pinecrest', 'ct-theo', 32000, 'lead', 55, 'Jordan Lee'],
  ['d-cobalt-pilot', 'Cobalt pilot', 'co-cobalt', 'ct-ryan', 9500, 'lead', 30, 'Sam Rivera'],
  ['d-atlas-api', 'Atlas API add-on', 'co-atlas', 'ct-hana', 14500, 'lead', 26, 'Alex Morgan'],
  ['d-northwind-2025', 'Northwind annual contract', 'co-northwind', 'ct-maya', 72000, 'won', -3, 'Alex Morgan'],
  ['d-meridian-pilot', 'Meridian pilot', 'co-meridian', 'ct-chloe', 18000, 'won', -12, 'Priya Shah'],
  ['d-lumen-seats', 'Lumen seat expansion', 'co-lumen', 'ct-sofia', 21000, 'won', -26, 'Alex Morgan'],
  ['d-atlas-core', 'Atlas core platform', 'co-atlas', 'ct-marcus', 46000, 'won', -41, 'Jordan Lee'],
  ['d-halcyon-referral', 'Halcyon referral bundle', 'co-halcyon', 'ct-ava', 9000, 'won', -58, 'Sam Rivera'],
  ['d-fieldnote-pos', 'Fieldnote café POS', 'co-fieldnote', 'ct-nina', 5400, 'won', -77, 'Sam Rivera'],
  ['d-meridian-ent', 'Meridian enterprise', 'co-meridian', 'ct-james', 58000, 'won', -98, 'Priya Shah'],
  ['d-lumen-starter', 'Lumen starter plan', 'co-lumen', 'ct-liam', 12500, 'won', -130, 'Alex Morgan'],
  ['d-northwind-pilot', 'Northwind pilot', 'co-northwind', 'ct-ethan', 16000, 'won', -165, 'Jordan Lee'],
  ['d-atlas-trial', 'Atlas paid trial', 'co-atlas', 'ct-hana', 8000, 'won', -205, 'Jordan Lee'],
  ['d-ben-referral', 'Consulting referral', '', 'ct-ben', 6500, 'won', -250, 'Sam Rivera'],
  ['d-meridian-poc', 'Meridian proof of concept', 'co-meridian', 'ct-chloe', 11000, 'won', -300, 'Priya Shah'],
  ['d-kestrel-pilot', 'Kestrel pilot', 'co-kestrel', 'ct-isla', 15000, 'lost', -9, 'Alex Morgan', 'Timing'],
  ['d-juniper-loyalty', 'Juniper loyalty app', 'co-juniper', 'ct-zara', 22000, 'lost', -34, 'Priya Shah', 'Competitor'],
  ['d-cobalt-seed', 'Cobalt seed bundle', 'co-cobalt', 'ct-ryan', 7500, 'lost', -70, 'Sam Rivera', 'Price'],
  ['d-vantage-poc', 'Vantage POC', 'co-vantage', 'ct-emma', 12000, 'lost', -120, 'Jordan Lee', 'No decision'],
];
const tasks: Array<[string, string, string | null, string | null, number, boolean, string, string[]]> = [
  // id, title, contact, deal, due offset (days), completed, owner, tags
  ['t-lumen-redline', 'Send redlined MSA to Sofia', 'ct-sofia', 'd-lumen-team', -2, false, 'Alex Morgan', ['Legal']],
  ['t-kestrel-recap', 'Recap call notes for Daniel', 'ct-daniel', 'd-kestrel-seats', -1, false, 'Alex Morgan', []],
  ['t-northwind-pricing', 'Final pricing for Northwind renewal', 'ct-maya', 'd-northwind-renewal', 0, false, 'Alex Morgan', ['High priority']],
  ['t-brightpath-security', 'Answer Brightpath security review', 'ct-noah', 'd-brightpath-ent', 0, false, 'Priya Shah', []],
  ['t-meridian-demo', 'Book exec demo with James', 'ct-james', 'd-meridian-crm', 0, false, 'Priya Shah', []],
  ['t-atlas-roi', 'Build ROI model for Atlas', 'ct-marcus', 'd-atlas-expansion', 1, false, 'Jordan Lee', []],
  ['t-vantage-sandbox', 'Provision Vantage sandbox', 'ct-lucas', 'd-vantage-platform', 2, false, 'Jordan Lee', []],
  ['t-halcyon-deck', 'Co-marketing deck for Halcyon', 'ct-ava', 'd-halcyon-partner', 3, false, 'Sam Rivera', []],
  ['t-pinecrest-intro', 'Intro call with Pinecrest IT', 'ct-priyanka', 'd-pinecrest-district', 5, false, 'Jordan Lee', []],
  ['t-juniper-discovery', 'Discovery questions for Oliver', 'ct-oliver', 'd-juniper-pos', 7, false, 'Priya Shah', []],
  ['t-cobalt-checkin', 'Check in with Ryan', 'ct-ryan', 'd-cobalt-pilot', 9, false, 'Sam Rivera', []],
  ['t-qbr', 'Quarterly review with Meridian', 'ct-chloe', null, 16, false, 'Priya Shah', []],
  ['t-northwind-kickoff', 'Northwind contract kickoff', 'ct-maya', 'd-northwind-2025', -3, true, 'Alex Morgan', []],
  ['t-lumen-invoice', 'Confirm Lumen invoice details', 'ct-liam', 'd-lumen-seats', -6, true, 'Alex Morgan', []],
  ['t-atlas-proposal', 'Send Atlas proposal', 'ct-marcus', 'd-atlas-expansion', -8, true, 'Jordan Lee', []],
];
const entries: Array<[string, NoteType, string, number, string]> = [
  // record, type, body, minutes ago, author
  ['ct-maya', 'call', 'Walked through renewal pricing. Wants 3-year terms if we hold this year’s rate. Legal review starts Monday.', 50, 'Alex Morgan'],
  ['d-northwind-renewal', 'meeting', 'Exec sync with Maya and Ethan. Upsell to 40 warehouse seats is approved in principle.', 26 * 60, 'Alex Morgan'],
  ['d-northwind-renewal', 'note', 'Procurement needs the security addendum attached to the order form.', 3 * 24 * 60, 'Alex Morgan'],
  ['ct-maya', 'email', 'Sent the renewal summary and a draft order form.', 2 * 24 * 60, 'Alex Morgan'],
  ['ct-grace', 'meeting', 'Brightpath steering committee liked the rollout plan. Concern: HIPAA audit trail. Sent docs.', 5 * 60, 'Priya Shah'],
  ['d-brightpath-ent', 'note', 'Budget confirmed for Q4. Competing with an in-house build.', 2 * 24 * 60, 'Priya Shah'],
  ['ct-sofia', 'email', 'Shared the redlined MSA. Waiting on their counsel.', 3 * 24 * 60, 'Alex Morgan'],
  ['d-lumen-team', 'call', 'Sofia flagged a delay: their CFO is out until next week.', 26 * 60, 'Alex Morgan'],
  ['ct-chloe', 'call', 'Guest CRM pilot results are strong: 18% faster check-in. Wants exec demo.', 8 * 60, 'Priya Shah'],
  ['d-meridian-crm', 'note', 'Expansion covers 14 properties. Pricing per property.', 4 * 24 * 60, 'Priya Shah'],
  ['ct-lucas', 'meeting', 'Technical deep dive. Needs SSO and audit logs before security sign-off.', 30 * 60, 'Jordan Lee'],
  ['ct-daniel', 'call', 'Interested in 12 advisory seats. Follow up with case studies.', 28 * 60, 'Alex Morgan'],
  ['ct-marcus', 'email', 'Sent expansion proposal for 120 additional vehicles.', 6 * 24 * 60, 'Jordan Lee'],
  ['d-kestrel-pilot', 'note', 'Lost on timing. Revisit in Q2 after their fund close.', 9 * 24 * 60, 'Alex Morgan'],
];
const events: Array<[string | null, string, string, number, string]> = [
  // record, message, type, minutes ago, author
  ['ct-maya', 'Logged a call with Maya Chen', 'call', 50, 'Alex Morgan'],
  ['d-northwind-2025', 'Won Northwind annual contract', 'won', 3 * 60, 'Alex Morgan'],
  ['ct-grace', 'Logged a meeting with Grace Okafor', 'meeting', 5 * 60, 'Priya Shah'],
  ['ct-chloe', 'Logged a call with Chloé Dubois', 'call', 8 * 60, 'Priya Shah'],
  ['d-brightpath-ent', 'Moved Brightpath enterprise to Proposal', 'stage', 22 * 60, 'Priya Shah'],
  ['d-northwind-renewal', 'Logged a meeting on Northwind renewal + upsell', 'meeting', 26 * 60, 'Alex Morgan'],
  ['d-lumen-team', 'Logged a call on Lumen team plan', 'call', 26 * 60, 'Alex Morgan'],
  ['ct-daniel', 'Logged a call with Daniel Kim', 'call', 28 * 60, 'Alex Morgan'],
  ['t-northwind-kickoff', 'Completed Northwind contract kickoff', 'completed', 30 * 60, 'Alex Morgan'],
  ['ct-lucas', 'Logged a meeting with Lucas Weber', 'meeting', 30 * 60, 'Jordan Lee'],
  ['d-vantage-platform', 'Moved Vantage data platform to Qualified', 'stage', 2 * 24 * 60, 'Jordan Lee'],
  ['d-atlas-api', 'Added Atlas API add-on', 'created', 2 * 24 * 60 + 90, 'Alex Morgan'],
  ['d-meridian-crm', 'Moved Meridian guest CRM to Negotiation', 'stage', 3 * 24 * 60, 'Priya Shah'],
  ['ct-priyanka', 'Added Priyanka Rao', 'created', 4 * 24 * 60, 'Jordan Lee'],
  [null, 'Imported 18 contacts from CSV', 'imported', 5 * 24 * 60, 'Alex Morgan'],
  ['d-kestrel-pilot', 'Lost Kestrel pilot · Timing', 'lost', 9 * 24 * 60, 'Alex Morgan'],
  ['d-meridian-pilot', 'Won Meridian pilot', 'won', 12 * 24 * 60, 'Priya Shah'],
];

export function demoData(now = Date.now(), workspaceId = 'demo'): CrmData {
  const day = (offset: number) => new Date(now + offset * DAY).toISOString().slice(0, 10);
  const record = (kind: RecordKind, id: string, name: string, ageDays: number, extra: Partial<CrmRecord>): CrmRecord => ({
    ...blankRecord(kind),
    id,
    name,
    workspaceId,
    createdAt: now - ageDays * DAY,
    updatedAt: now - Math.min(ageDays, 2) * DAY,
    ...extra,
  });
  const slug = (name: string) => name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
  const domainOf = (companyId: string) => companies.find((c) => c[0] === companyId)?.[3] ?? 'gmail.com';

  const records: CrmRecord[] = [
    ...companies.map(([id, name, industry, domain, status, tags], i) =>
      record('company', id, name, 200 - i * 9, { industry, website: `https://${domain}`, email: `hello@${domain}`, status, tags }),
    ),
    ...contacts.map(([id, name, companyId, role, status, tags], i) =>
      record('contact', id, name, 160 - i * 6, {
        companyId: companyId || null,
        role,
        status,
        tags,
        email: `${slug(name)}@${domainOf(companyId)}`,
        phone: `+1 (415) 555-${String(1200 + i * 37).padStart(4, '0')}`,
      }),
    ),
    ...deals.map(([id, name, companyId, contactId, dollars, stage, offset, owner, lostReason], i) =>
      record('deal', id, name, Math.max(14, -offset + 30 + (i % 5) * 6), {
        companyId: companyId || null,
        contactId,
        value: dollars * 100,
        status: stage,
        closeDate: day(offset),
        owner,
        lostReason: lostReason ?? '',
      }),
    ),
    ...tasks.map(([id, name, contactId, dealId, offset, completed, owner, tags]) =>
      record('task', id, name, Math.max(3, -offset + 4), { contactId, dealId, dueDate: day(offset), completed, owner, tags }),
    ),
  ];
  const notes: CrmNote[] = entries.map(([recordId, type, body, minutes, author], i) => ({
    id: `n-${i}`,
    workspaceId,
    recordId,
    type,
    body,
    author,
    createdAt: now - minutes * 60_000,
  }));
  const activities: CrmActivity[] = events.map(([recordId, message, type, minutes, author], i) => ({
    id: `a-${i}`,
    workspaceId,
    recordId,
    message,
    type,
    author,
    createdAt: now - minutes * 60_000,
  }));
  return { workspace: { id: workspaceId, name: 'Acme Sales' }, records, notes, activities };
}

/** Sample data with fresh IDs, for seeding an empty persisted workspace. */
export function sampleWorkspace(workspaceId: string, newId: () => string, now = Date.now()) {
  const data = demoData(now, workspaceId);
  const ids = new Map(data.records.map((record) => [record.id, newId()]));
  const link = (id: string | null) => (id ? (ids.get(id) ?? null) : null);
  return {
    records: data.records.map((record) => ({
      ...record,
      id: ids.get(record.id) as string,
      companyId: link(record.companyId),
      contactId: link(record.contactId),
      dealId: link(record.dealId),
    })),
    notes: data.notes.map((note) => ({ ...note, id: newId(), recordId: ids.get(note.recordId) as string })),
    activities: data.activities.map((activity) => ({ ...activity, id: newId(), recordId: link(activity.recordId) })),
  };
}
