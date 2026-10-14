import test from 'node:test';
import assert from 'node:assert/strict';
import { blankRecord } from '../src/lib/crm.ts';
import {
  closingInMonth,
  forecast,
  groupTasks,
  matchesCloseFilter,
  previousRange,
  rangeStart,
  revenueSeries,
  stageSummary,
  weightedValue,
  winRate,
  wonBetween,
} from '../src/lib/crm-insights.ts';

const on = '2026-10-14';
const deal = (status, value, closeDate = '') => ({ ...blankRecord('deal'), name: `${status} ${value}`, status, value, closeDate });
const task = (name, dueDate, completed = false, updatedAt = 0) => ({ ...blankRecord('task'), name, dueDate, completed, updatedAt });

test('weighted forecast applies stage probabilities to open deals only', () => {
  assert.equal(weightedValue(deal('proposal', 10_000)), 5_000);
  assert.equal(weightedValue(deal('lead', 333)), 33);
  const deals = [deal('lead', 10_000), deal('negotiation', 20_000), deal('won', 50_000), deal('lost', 70_000)];
  assert.deepEqual(forecast(deals), { count: 2, value: 30_000, weighted: 16_000 });
});

test('stage summary totals count, value, and weighted value per stage', () => {
  const summary = stageSummary([deal('qualified', 4_000), deal('qualified', 6_000), deal('won', 1_000)], ['qualified', 'proposal']);
  assert.deepEqual(summary, [
    { stage: 'qualified', count: 2, value: 10_000, weighted: 2_500, probability: 0.25 },
    { stage: 'proposal', count: 0, value: 0, weighted: 0, probability: 0.5 },
  ]);
});

test('win rate and won revenue only count deals closed inside the window', () => {
  const deals = [deal('won', 100, '2026-10-01'), deal('lost', 100, '2026-09-20'), deal('won', 300, '2026-06-01'), deal('proposal', 900, '2026-10-02')];
  assert.equal(winRate(deals, rangeStart('30d', on)), 0.5);
  assert.equal(winRate(deals, '2026-10-10'), null);
  assert.deepEqual(wonBetween(deals, rangeStart('90d', on)), { count: 1, value: 100 });
  assert.deepEqual(wonBetween(deals, '2026-01-01', '2026-10-01'), { count: 1, value: 300 });
});

test('ranges start on the right day and compare against an equally long prior window', () => {
  assert.equal(rangeStart('30d', on), '2026-09-15');
  assert.equal(rangeStart('12m', on), '2025-11-01');
  assert.equal(rangeStart('all', on), '');
  assert.deepEqual(previousRange('30d', on), { start: '2026-08-16', end: '2026-09-15' });
  assert.deepEqual(previousRange('12m', on), { start: '2024-11-01', end: '2025-11-01' });
  assert.equal(previousRange('all', on), null);
});

test('revenue series buckets won deals by week or month and ignores future close dates', () => {
  const deals = [deal('won', 100, '2026-10-14'), deal('won', 200, '2026-10-02'), deal('won', 400, '2026-03-05'), deal('won', 999, '2026-10-20')];
  const weekly = revenueSeries(deals, '30d', on);
  assert.equal(weekly.length, 5);
  assert.equal(weekly[0].key, '2026-09-15');
  assert.equal(weekly.reduce((sum, point) => sum + point.value, 0), 300);
  const monthly = revenueSeries(deals, '12m', on);
  assert.equal(monthly.length, 12);
  assert.deepEqual(monthly.at(-1), { key: '2026-10', label: 'Oct', value: 300, count: 2 });
  assert.equal(monthly.find((point) => point.key === '2026-03').value, 400);
  assert.equal(revenueSeries(deals, 'all', on).length, 8);
});

test('close-date filters match overdue, this month, the next 30 days, and this quarter', () => {
  const late = deal('proposal', 1, '2026-10-01');
  assert.equal(matchesCloseFilter(late, 'overdue', on), true);
  assert.equal(matchesCloseFilter({ ...late, status: 'won' }, 'overdue', on), false);
  assert.equal(matchesCloseFilter(late, 'this-month', on), true);
  assert.equal(matchesCloseFilter(late, 'next-30', on), false);
  assert.equal(matchesCloseFilter(deal('lead', 1, '2026-11-13'), 'next-30', on), true);
  assert.equal(matchesCloseFilter(deal('lead', 1, '2026-12-31'), 'this-quarter', on), true);
  assert.equal(matchesCloseFilter(deal('lead', 1, '2027-01-01'), 'this-quarter', on), false);
  assert.equal(matchesCloseFilter(deal('lead', 1), 'this-month', on), false);
  assert.equal(matchesCloseFilter(deal('lead', 1), 'any', on), true);
  assert.equal(closingInMonth([late, deal('won', 5, '2026-10-03')], on).count, 1);
});

test('tasks group into overdue, today, upcoming (including undated), and done', () => {
  const groups = groupTasks(
    [task('B late', '2026-10-01'), task('A late', '2026-10-01'), task('Now', on), task('Later', '2026-10-20'), task('Someday', ''), task('Old', '2026-09-01', true, 1), task('New', on, true, 2)],
    on,
  );
  assert.deepEqual(groups.overdue.map((t) => t.name), ['A late', 'B late']);
  assert.deepEqual(groups.today.map((t) => t.name), ['Now']);
  assert.deepEqual(groups.upcoming.map((t) => t.name), ['Later', 'Someday']);
  assert.deepEqual(groups.done.map((t) => t.name), ['New', 'Old']);
});
