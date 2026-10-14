// Pure pipeline and task math shared by the overview, pipeline, and tasks views.
// The explicit .ts extension lets `node --test` load this module without a bundler.
import { addDays, dateLabel, stageProbability, stages, type CrmRecord, type Stage } from './crm.ts';

export const ranges = ['30d', '90d', '12m', 'all'] as const;
export type RangeKey = (typeof ranges)[number];
export const rangeNames: Record<RangeKey, string> = { '30d': '30D', '90d': '90D', '12m': '12M', all: 'All' };
export const rangeLongNames: Record<RangeKey, string> = {
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '12m': 'Last 12 months',
  all: 'All time',
};

const total = (deals: CrmRecord[]) => deals.reduce((sum, deal) => sum + deal.value, 0);
export const isOpenDeal = (deal: CrmRecord) => deal.status !== 'won' && deal.status !== 'lost';
export const weightedValue = (deal: CrmRecord) => Math.round(deal.value * (stageProbability[deal.status] ?? 0));

/** Shifts a YYYY-MM-DD date by whole months and returns its YYYY-MM key. */
function monthKey(date: string, offset = 0) {
  const [year, month] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString().slice(0, 7);
}
const monthLabel = (key: string) =>
  new Date(`${key}-01T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });

/** First calendar day included in a range, or '' for all time. */
export function rangeStart(range: RangeKey, on: string) {
  if (range === '30d') return addDays(on, -29);
  if (range === '90d') return addDays(on, -89);
  if (range === '12m') return `${monthKey(on, -11)}-01`;
  return '';
}

/** The equally long window immediately before a range, for period-over-period deltas. */
export function previousRange(range: RangeKey, on: string): { start: string; end: string } | null {
  if (range === 'all') return null;
  const start = rangeStart(range, on);
  if (range === '12m') return { start: `${monthKey(on, -23)}-01`, end: start };
  const days = range === '30d' ? 30 : 90;
  return { start: addDays(start, -days), end: start };
}

export function forecast(deals: CrmRecord[]) {
  const open = deals.filter(isOpenDeal);
  return { count: open.length, value: total(open), weighted: open.reduce((sum, deal) => sum + weightedValue(deal), 0) };
}

export function stageSummary(deals: CrmRecord[], list: readonly Stage[] = stages) {
  return list.map((stage) => {
    const inStage = deals.filter((deal) => deal.status === stage);
    return {
      stage,
      count: inStage.length,
      value: total(inStage),
      weighted: inStage.reduce((sum, deal) => sum + weightedValue(deal), 0),
      probability: stageProbability[stage],
    };
  });
}

/** Won or lost deals whose close date falls in [start, end). */
export function closedBetween(deals: CrmRecord[], start: string, end = '') {
  return deals.filter(
    (deal) => !isOpenDeal(deal) && !!deal.closeDate && deal.closeDate >= start && (!end || deal.closeDate < end),
  );
}

export function wonBetween(deals: CrmRecord[], start: string, end = '') {
  const won = closedBetween(deals, start, end).filter((deal) => deal.status === 'won');
  return { count: won.length, value: total(won) };
}

/** Share of closed deals that were won, or null when nothing closed. */
export function winRate(deals: CrmRecord[], start: string, end = '') {
  const closed = closedBetween(deals, start, end);
  if (!closed.length) return null;
  return closed.filter((deal) => deal.status === 'won').length / closed.length;
}

export interface SeriesPoint {
  key: string;
  label: string;
  value: number;
  count: number;
}

/** Won revenue bucketed by week (30D/90D) or month (12M/All). */
export function revenueSeries(deals: CrmRecord[], range: RangeKey, on: string): SeriesPoint[] {
  const won = deals.filter((deal) => deal.status === 'won' && deal.closeDate && deal.closeDate <= on);
  if (range === '30d' || range === '90d') {
    const start = rangeStart(range, on);
    const points: SeriesPoint[] = [];
    for (let day = start; day <= on; day = addDays(day, 7)) {
      const end = addDays(day, 7);
      const inBucket = won.filter((deal) => deal.closeDate >= day && deal.closeDate < end);
      points.push({ key: day, label: dateLabel(day), value: total(inBucket), count: inBucket.length });
    }
    return points;
  }
  let months = 12;
  if (range === 'all') {
    const first = won.reduce((min, deal) => (deal.closeDate < min ? deal.closeDate : min), on);
    const [fy, fm] = first.split('-').map(Number);
    const [ty, tm] = on.split('-').map(Number);
    months = Math.min(36, Math.max(6, (ty - fy) * 12 + (tm - fm) + 1));
  }
  return Array.from({ length: months }, (_, i) => {
    const key = monthKey(on, i - months + 1);
    const inBucket = won.filter((deal) => deal.closeDate.startsWith(key));
    return { key, label: monthLabel(key), value: total(inBucket), count: inBucket.length };
  });
}

export function closingInMonth(deals: CrmRecord[], on: string) {
  const month = on.slice(0, 7);
  const list = deals.filter((deal) => isOpenDeal(deal) && deal.closeDate.startsWith(month));
  return { count: list.length, value: total(list), deals: list };
}

export const closeFilters = ['any', 'overdue', 'this-month', 'next-30', 'this-quarter'] as const;
export type CloseFilter = (typeof closeFilters)[number];
export const closeFilterNames: Record<CloseFilter, string> = {
  any: 'Any close date',
  overdue: 'Past close date',
  'this-month': 'Closing this month',
  'next-30': 'Next 30 days',
  'this-quarter': 'This quarter',
};

export function matchesCloseFilter(deal: CrmRecord, filter: CloseFilter, on: string) {
  const date = deal.closeDate;
  if (filter === 'any') return true;
  if (!date) return false;
  if (filter === 'overdue') return isOpenDeal(deal) && date < on;
  if (filter === 'this-month') return date.startsWith(on.slice(0, 7));
  if (filter === 'next-30') return date >= on && date <= addDays(on, 30);
  const quarter = (value: string) => `${value.slice(0, 4)}-${Math.floor((Number(value.slice(5, 7)) - 1) / 3)}`;
  return quarter(date) === quarter(on);
}

const byDue = (a: CrmRecord, b: CrmRecord) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || a.name.localeCompare(b.name);

export function groupTasks(tasks: CrmRecord[], on: string) {
  const open = tasks.filter((task) => !task.completed).sort(byDue);
  return {
    overdue: open.filter((task) => task.dueDate && task.dueDate < on),
    today: open.filter((task) => task.dueDate === on),
    upcoming: open.filter((task) => !task.dueDate || task.dueDate > on),
    done: tasks.filter((task) => task.completed).sort((a, b) => b.updatedAt - a.updatedAt),
  };
}
