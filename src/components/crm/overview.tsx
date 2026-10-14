import { useState, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Spinner } from '~/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group';
import {
  closedBetween,
  closingInMonth,
  forecast,
  groupTasks,
  previousRange,
  rangeLongNames,
  rangeNames,
  ranges,
  rangeStart,
  revenueSeries,
  stageSummary,
  winRate,
  wonBetween,
  type RangeKey,
} from '~/lib/crm-insights';
import { dateLabel, money, openStages } from '~/lib/crm';
import { RevenueChart, StageChart } from './overview-charts';
import { EmptyState, PageHeader, StagePill, percent } from './shared';
import { useWorkspace } from './workspace-context';

export function Overview() {
  const { data, crm, on, byId, actions } = useWorkspace();
  const [range, setRange] = useState<RangeKey>('90d');
  const deals = data.records.filter((r) => r.kind === 'deal');
  const tasks = data.records.filter((r) => r.kind === 'task');

  if (!data.records.length) {
    return (
      <>
        <PageHeader title='Overview' />
        <EmptyState
          title='Your workspace is empty.'
          action={
            <div className='flex flex-wrap justify-center gap-2'>
              {!crm.isDemo && (
                <Button size='sm' disabled={crm.seed.isPending} onClick={() => crm.seed.mutate()}>
                  {crm.seed.isPending && <Spinner />}
                  Load sample data
                </Button>
              )}
              <Button variant='outline' size='sm' onClick={() => actions.create('contact')}>
                Add a contact
              </Button>
            </div>
          }
        />
      </>
    );
  }

  const start = rangeStart(range, on);
  const previous = previousRange(range, on);
  const open = forecast(deals);
  const won = wonBetween(deals, start);
  const wonBefore = previous ? wonBetween(deals, previous.start, previous.end) : null;
  const rate = winRate(deals, start);
  const closed = closedBetween(deals, start).length;
  const closing = closingInMonth(deals, on);
  const due = groupTasks(tasks, on);
  const delta = wonBefore && wonBefore.value ? (won.value - wonBefore.value) / wonBefore.value : null;
  const dueTasks = [...due.overdue, ...due.today].slice(0, 6);

  return (
    <>
      <PageHeader title='Overview'>
        <ToggleGroup
          type='single'
          variant='outline'
          size='sm'
          value={range}
          onValueChange={(value) => value && setRange(value as RangeKey)}
          aria-label='Date range'
        >
          {ranges.map((key) => (
            <ToggleGroupItem key={key} value={key} aria-label={rangeLongNames[key]} className='tnum'>
              {rangeNames[key]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </PageHeader>

      <div className='metrics metrics-5'>
        <Kpi label='Open pipeline' value={money(open.value)} sub={`${money(open.weighted)} weighted`} onClick={() => actions.go('deals')} />
        <Kpi
          label='Won revenue'
          value={money(won.value)}
          sub={
            delta === null ? (
              `${won.count} deals`
            ) : (
              <span className={delta >= 0 ? 'delta-up' : 'delta-down'}>
                {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {percent(Math.abs(delta))} vs prior
              </span>
            )
          }
          accent
        />
        <Kpi label='Win rate' value={rate === null ? '—' : percent(rate)} sub={`${closed} closed`} />
        <Kpi label='Closing this month' value={money(closing.value)} sub={`${closing.count} deals`} />
        <Kpi
          label='Overdue tasks'
          value={String(due.overdue.length)}
          sub={`${due.today.length} due today`}
          warn={due.overdue.length > 0}
          onClick={() => actions.go('tasks')}
        />
      </div>

      <div className='overview-grid'>
        <section className='card card-wide'>
          <header className='card-head'>
            <h2>Won revenue</h2>
            <span className='card-meta'>{rangeLongNames[range]}</span>
          </header>
          <RevenueChart points={revenueSeries(deals, range, on)} />
        </section>
        <section className='card'>
          <header className='card-head'>
            <h2>Pipeline by stage</h2>
            <span className='card-legend'>
              <i className='legend-swatch is-accent' /> Weighted
            </span>
          </header>
          <StageChart summary={stageSummary(deals, openStages)} />
        </section>

        <section className='card card-wide'>
          <header className='card-head'>
            <h2>Closing this month</h2>
            <Button variant='ghost' size='xs' onClick={() => actions.go('deals')}>
              Pipeline
            </Button>
          </header>
          {closing.deals.length ? (
            <ul className='mini-list'>
              {closing.deals
                .sort((a, b) => a.closeDate.localeCompare(b.closeDate))
                .map((deal) => (
                  <li key={deal.id}>
                    <button className='mini-row' onClick={() => actions.open(deal)}>
                      <span className='mini-name'>
                        {deal.name}
                        <span className='mini-sub'>{(deal.companyId && byId.get(deal.companyId)?.name) || ''}</span>
                      </span>
                      <StagePill stage={deal.status} />
                      <span className={`mini-date tnum ${deal.closeDate < on ? 'text-overdue' : ''}`}>{dateLabel(deal.closeDate)}</span>
                      <span className='mini-value tnum'>{money(deal.value)}</span>
                    </button>
                  </li>
                ))}
            </ul>
          ) : (
            <p className='muted-line'>No open deals close this month.</p>
          )}
        </section>
        <section className='card'>
          <header className='card-head'>
            <h2>Due tasks</h2>
            <Button variant='ghost' size='xs' onClick={() => actions.go('tasks')}>
              All tasks
            </Button>
          </header>
          {dueTasks.length ? (
            <ul className='mini-list'>
              {dueTasks.map((task) => (
                <li key={task.id} className='mini-task'>
                  <Checkbox aria-label={`Complete ${task.name}`} checked={false} onCheckedChange={() => actions.toggleTask(task)} />
                  <button className='mini-name' onClick={() => actions.open(task)}>
                    {task.name}
                  </button>
                  <span className={`mini-date tnum ${task.dueDate < on ? 'text-overdue' : ''}`}>
                    {task.dueDate === on ? 'Today' : dateLabel(task.dueDate)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className='muted-line'>Nothing due.</p>
          )}
        </section>
      </div>
    </>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent = false,
  warn = false,
  onClick,
}: {
  label: string;
  value: string;
  sub: ReactNode;
  accent?: boolean;
  warn?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className='metric-label'>{label}</span>
      <strong className={`metric-value tnum ${warn ? 'text-overdue' : ''}`}>{value}</strong>
      <span className='metric-sub tnum'>{sub}</span>
    </>
  );
  const className = `metric ${accent ? 'metric-accent' : ''}`;
  return onClick ? (
    <button className={`${className} metric-link`} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}
