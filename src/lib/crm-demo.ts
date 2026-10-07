import { blankRecord, type CrmData, type CrmRecord, type RecordKind } from './crm';

export function demoData(): CrmData {
  const now = Date.now();
  const day = (offset: number) => new Date(now + offset * 86400000).toISOString().slice(0, 10);
  const record = (kind: RecordKind, id: string, name: string, extra: Partial<CrmRecord> = {}): CrmRecord => ({ ...blankRecord(kind), id, name, workspaceId: 'demo', createdAt: now - 7 * 86400000, updatedAt: now, ...extra });
  const records = [
    record('company', 'co1', 'Linear', { industry: 'Software', website: 'https://linear.app', status: 'customer', tags: ['SaaS'] }),
    record('company', 'co2', 'Notion', { industry: 'Productivity', website: 'https://notion.so', tags: ['Enterprise'] }),
    record('company', 'co3', 'Figma', { industry: 'Design', website: 'https://figma.com', status: 'partner', tags: ['Design'] }),
    record('company', 'co4', 'Vercel', { industry: 'Software', website: 'https://vercel.com', tags: ['SaaS'] }),
    record('company', 'co5', 'Arc', { industry: 'Technology', website: 'https://arc.net', tags: ['Startup'] }),
    record('company', 'co6', 'Stripe', { industry: 'Finance', website: 'https://stripe.com', status: 'customer', tags: ['Enterprise'] }),
    record('contact', 'ct1', 'Olivia Rhye', { companyId: 'co1', email: 'olivia@linear.app', role: 'Head of Operations', status: 'customer', tags: ['Decision maker', 'SaaS'] }),
    record('contact', 'ct2', 'Phoenix Baker', { companyId: 'co2', email: 'phoenix@notion.so', role: 'VP of Product', tags: ['Enterprise'] }),
    record('contact', 'ct3', 'Lana Steiner', { companyId: 'co3', email: 'lana@figma.com', role: 'Design Director', status: 'partner', tags: ['Design'] }),
    record('contact', 'ct4', 'Demi Wilkinson', { companyId: 'co4', email: 'demi@vercel.com', role: 'Engineering Manager', tags: ['SaaS'] }),
    record('contact', 'ct5', 'Drew Cano', { companyId: 'co5', email: 'drew@arc.net', role: 'Co-founder', tags: ['Startup'] }),
    record('contact', 'ct6', 'Natali Craig', { companyId: 'co6', email: 'natali@stripe.com', role: 'Partnerships Lead', status: 'customer', tags: ['Enterprise'] }),
    record('deal', 'd1', 'Enterprise workspace', { companyId: 'co2', contactId: 'ct2', value: 4800000, status: 'proposal', closeDate: day(12), tags: ['Enterprise'] }),
    record('deal', 'd2', 'Annual team subscription', { companyId: 'co1', contactId: 'ct1', value: 2450000, status: 'negotiation', closeDate: day(5), tags: ['SaaS'] }),
    record('deal', 'd3', 'Design team expansion', { companyId: 'co3', contactId: 'ct3', value: 3200000, status: 'qualified', closeDate: day(18), tags: ['Expansion'] }),
    record('deal', 'd4', 'Platform partnership', { companyId: 'co4', contactId: 'ct4', value: 1800000, status: 'lead', closeDate: day(25), tags: ['Partnership'] }),
    record('deal', 'd5', 'Startup growth plan', { companyId: 'co5', contactId: 'ct5', value: 1200000, status: 'qualified', closeDate: day(20) }),
    record('deal', 'd6', 'Global rollout', { companyId: 'co6', contactId: 'ct6', value: 6400000, status: 'won', closeDate: day(-2) }),
    record('deal', 'd7', 'Customer success package', { companyId: 'co1', contactId: 'ct1', value: 1850000, status: 'won', closeDate: day(-8) }),
    record('deal', 'd8', 'Product team onboarding', { companyId: 'co2', contactId: 'ct2', value: 2800000, status: 'lead', closeDate: day(30) }),
    record('task', 't1', 'Follow up on enterprise proposal', { contactId: 'ct2', dealId: 'd1', dueDate: day(0), tags: ['High priority'] }),
    record('task', 't2', 'Send revised pricing to Olivia', { contactId: 'ct1', dealId: 'd2', dueDate: day(0) }),
    record('task', 't3', 'Schedule a product walkthrough', { contactId: 'ct3', dealId: 'd3', dueDate: day(1) }),
    record('task', 't4', 'Prepare partnership presentation', { contactId: 'ct4', dealId: 'd4', dueDate: day(2) }),
    record('task', 't5', 'Check in with Drew', { contactId: 'ct5', dueDate: day(3) }),
  ];
  return { workspace: { id: 'demo', name: 'Acme Workspace' }, records, notes: [
    { id: 'n1', workspaceId: 'demo', recordId: 'ct2', body: 'Great discovery call. The team is looking for a centralized workspace for 120 people. Follow up with an enterprise proposal this week.', author: 'Alex Morgan', createdAt: now - 86400000 },
  ], activities: [
    { id: 'a1', workspaceId: 'demo', recordId: 'd6', message: 'Won Global rollout with Stripe', type: 'won', author: 'Alex Morgan', createdAt: now - 25 * 60000 },
    { id: 'a2', workspaceId: 'demo', recordId: 'ct2', message: 'Added a note to Phoenix Baker', type: 'note', author: 'Alex Morgan', createdAt: now - 58 * 60000 },
    { id: 'a3', workspaceId: 'demo', recordId: 'd1', message: 'Moved Enterprise workspace to Proposal', type: 'stage', author: 'Alex Morgan', createdAt: now - 2 * 3600000 },
    { id: 'a4', workspaceId: 'demo', recordId: 'ct5', message: 'Added Drew Cano as a contact', type: 'created', author: 'Alex Morgan', createdAt: now - 3 * 3600000 },
  ] };
}
