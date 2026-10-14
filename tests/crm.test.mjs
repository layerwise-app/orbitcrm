import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyBulkEdit,
  blankRecord,
  bulkMessage,
  csvCell,
  describeChange,
  entryMessage,
  money,
  moveDeal,
  parseCsv,
  validateBulkInput,
  validateCrmSearch,
  validateNoteInput,
  validateRecord,
} from '../src/lib/crm.ts';
import { sampleWorkspace } from '../src/lib/crm-demo.ts';

test('demo and dashboard share validated view and detail search parameters', () => {
  assert.deepEqual(validateCrmSearch({}), { view: 'dashboard', record: '' });
  assert.deepEqual(validateCrmSearch({ view: 'contacts', record: 'contact-123' }), { view: 'contacts', record: 'contact-123' });
  assert.deepEqual(validateCrmSearch({ view: 'invalid', record: 123 }), { view: 'dashboard', record: '' });
});

test('CSV handles BOM, CRLF, quoted commas, multiline values, and escaped quotes', () => {
  assert.deepEqual(parseCsv('\uFEFFname,email\r\n"Alex, Morgan",alex@example.com\r\n"Sam ""S""\nLee",sam@example.com\r\n'), [
    ['name', 'email'], ['Alex, Morgan', 'alex@example.com'], ['Sam "S"\nLee', 'sam@example.com'],
  ]);
});
test('CSV rejects unclosed or misplaced quotes and ignores empty lines', () => {
  assert.throws(() => parseCsv('"unclosed'), /unclosed/);
  assert.throws(() => parseCsv('ab"cd'), /quoting/);
  assert.deepEqual(parseCsv('\n\r\nname\nAlex\n'), [['name'], ['Alex']]);
});
test('CSV export prevents spreadsheet formulas and round trips quoted strings', () => {
  for (const value of ['=1+1', '+cmd', '@SUM(A1)', '-123', '\tformula']) assert.ok(csvCell(value).startsWith('"\''));
  assert.deepEqual(parseCsv(csvCell('Alex "Morgan", Jr.')), [['Alex "Morgan", Jr.']]);
});
test('record validation normalizes strings and tags without trusting client ownership', () => {
  const validated = validateRecord({ ...blankRecord('contact'), name: '  Alex Morgan ', workspaceId: 'attacker', tags: [' VIP ', 'VIP', ''] });
  assert.equal(validated.name, 'Alex Morgan');
  assert.equal(validated.workspaceId, '');
  assert.deepEqual(validated.tags, ['VIP']);
});
test('record validation rejects invalid names, amounts, emails, dates, stages, and URLs', () => {
  const r = { ...blankRecord('deal'), name: 'Opportunity' };
  for (const patch of [{ name: '' }, { value: -1 }, { value: 1.2 }, { value: NaN }, { email: 'invalid' }, { closeDate: '2026-02-30' }, { status: 'anything' }, { website: 'javascript:alert(1)' }, { tags: [42] }, { completed: 'yes' }]) assert.throws(() => validateRecord({ ...r, ...patch }));
  assert.equal(validateRecord({ ...r, website: 'https://example.com', closeDate: '2026-12-31' }).closeDate, '2026-12-31');
});
test('financial values are stored in integer cents', () => {
  assert.equal(money(1234500), '$12,345');
  assert.equal(money(0), '$0');
});

const pick = ({ status, lostReason, closeDate }) => ({ status, lostReason, closeDate });
test('moving a deal to won or lost stamps the close date and keeps the reason only when lost', () => {
  const open = { ...blankRecord('deal'), name: 'Renewal', status: 'proposal', closeDate: '2026-12-01', lostReason: '' };
  assert.deepEqual(pick(moveDeal(open, 'lost', 'Price', '2026-10-14')), { status: 'lost', lostReason: 'Price', closeDate: '2026-10-14' });
  assert.deepEqual(pick(moveDeal(open, 'won', 'Price', '2026-10-14')), { status: 'won', lostReason: '', closeDate: '2026-10-14' });
  assert.deepEqual(pick(moveDeal(open, 'negotiation', '', '2026-10-14')), { status: 'negotiation', lostReason: '', closeDate: '2026-12-01' });
  const won = moveDeal(open, 'won', '', '2026-10-01');
  assert.equal(moveDeal(won, 'won', '', '2026-10-14').closeDate, '2026-10-01');
});

test('record validation drops lost reasons that do not belong to a lost deal', () => {
  const lost = { ...blankRecord('deal'), name: 'Pilot', status: 'lost', lostReason: ' Timing ' };
  assert.equal(validateRecord(lost).lostReason, 'Timing');
  assert.equal(validateRecord({ ...lost, status: 'proposal' }).lostReason, '');
  assert.equal(validateRecord({ ...blankRecord('contact'), name: 'Ana', lostReason: 'Price' }).lostReason, '');
});

test('activity messages describe creates, completions, and stage changes', () => {
  const deal = { ...blankRecord('deal'), name: 'Pilot', status: 'proposal' };
  assert.deepEqual(describeChange(undefined, deal), { message: 'Added Pilot', type: 'created' });
  assert.deepEqual(describeChange(deal, { ...deal, status: 'lost', lostReason: 'Price' }), { message: 'Lost Pilot · Price', type: 'lost' });
  assert.deepEqual(describeChange(deal, { ...deal, status: 'negotiation' }), { message: 'Moved Pilot to Negotiation', type: 'stage' });
  const todo = { ...blankRecord('task'), name: 'Call back' };
  assert.equal(describeChange(todo, { ...todo, completed: true }).type, 'completed');
  assert.equal(entryMessage('email', { name: 'Ana', kind: 'contact' }), 'Logged an email with Ana');
  assert.equal(entryMessage('call', { name: 'Pilot', kind: 'deal' }), 'Logged a call on Pilot');
});

test('timeline entries validate type and body', () => {
  assert.deepEqual(validateNoteInput({ recordId: 'r1', body: ' Hi ' }), { recordId: 'r1', type: 'note', body: 'Hi' });
  assert.throws(() => validateNoteInput({ recordId: 'r1', type: 'sms', body: 'Hi' }), /entry type/);
  assert.throws(() => validateNoteInput({ recordId: 'r1', type: 'call', body: '  ' }));
});

test('bulk edits validate input, dedupe IDs, and add tags or statuses idempotently', () => {
  assert.deepEqual(validateBulkInput({ ids: ['a', 'a', 'b'], action: 'tag', value: ' VIP ' }), { ids: ['a', 'b'], action: 'tag', value: 'VIP' });
  for (const bad of [{ ids: [], action: 'delete' }, { ids: ['a'], action: 'merge' }, { ids: ['a'], action: 'status', value: 'lead' }, { ids: ['a'], action: 'tag', value: '' }]) {
    assert.throws(() => validateBulkInput(bad));
  }
  const contact = { ...blankRecord('contact'), name: 'Ana', tags: ['VIP'], updatedAt: 1 };
  assert.equal(applyBulkEdit(contact, { ids: [], action: 'tag', value: 'VIP' }, 9), contact);
  assert.deepEqual(applyBulkEdit(contact, { ids: [], action: 'tag', value: 'Q4' }, 9).tags, ['VIP', 'Q4']);
  assert.equal(applyBulkEdit(contact, { ids: [], action: 'status', value: 'partner' }, 9).status, 'partner');
  assert.equal(bulkMessage({ ids: [], action: 'status', value: 'partner' }, 3, 'company'), 'Set 3 companies to Partner');
});

test('sample data gets fresh IDs with every link remapped', () => {
  let n = 0;
  const sample = sampleWorkspace('ws-1', () => `id-${++n}`, Date.parse('2026-10-14T12:00:00Z'));
  const ids = new Set(sample.records.map((r) => r.id));
  assert.equal(ids.size, sample.records.length);
  for (const r of sample.records) {
    assert.equal(r.workspaceId, 'ws-1');
    for (const link of [r.companyId, r.contactId, r.dealId]) assert.ok(link === null || ids.has(link));
  }
  assert.ok(sample.notes.every((note) => ids.has(note.recordId)));
  assert.ok(sample.activities.every((a) => a.recordId === null || ids.has(a.recordId)));
});
