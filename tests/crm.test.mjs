import test from 'node:test';
import assert from 'node:assert/strict';
import { blankRecord, csvCell, money, parseCsv, validateCrmSearch, validateRecord } from '../src/lib/crm.ts';

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
