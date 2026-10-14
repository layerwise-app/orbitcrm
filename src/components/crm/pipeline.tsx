import { useState, type CSSProperties, type DragEvent } from 'react';
import { Ellipsis, Plus, Search } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '~/components/ui/dropdown-menu';
import { Input } from '~/components/ui/input';
import { Switch } from '~/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group';
import {
  closeFilterNames,
  closeFilters,
  closingInMonth,
  forecast,
  isOpenDeal,
  matchesCloseFilter,
  rangeStart,
  stageSummary,
  weightedValue,
  wonBetween,
  type CloseFilter,
} from '~/lib/crm-insights';
import { dateLabel, money, openStages, stageNames, stages, type CrmRecord, type Stage } from '~/lib/crm';
import { FilterSelect } from './filter-select';
import { Avatar, EmptyState, PageHeader, StagePill, percent } from './shared';
import { useWorkspace } from './workspace-context';

export function Pipeline() {
  const { data, on, byId, actions } = useWorkspace();
  const [query, setQuery] = useState('');
  const [owner, setOwner] = useState('all');
  const [company, setCompany] = useState('all');
  const [close, setClose] = useState<CloseFilter>('any');
  const [showClosed, setShowClosed] = useState(false);
  const [layout, setLayout] = useState<'board' | 'list'>('board');
  const [dragging, setDragging] = useState<CrmRecord | null>(null);

  const deals = data.records.filter((r) => r.kind === 'deal');
  const companyName = (deal: CrmRecord) => (deal.companyId && byId.get(deal.companyId)?.name) || '';
  const ownerOptions = [...new Set(deals.map((d) => d.owner).filter(Boolean))].sort();
  const companyOptions = [...new Set(deals.map((d) => d.companyId).filter((id): id is string => !!id))]
    .map((id) => ({ value: id, label: byId.get(id)?.name ?? 'Unknown' }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const q = query.trim().toLowerCase();
  const filtered = deals.filter(
    (d) =>
      (owner === 'all' || d.owner === owner) &&
      (company === 'all' || d.companyId === company) &&
      matchesCloseFilter(d, close, on) &&
      (!q || `${d.name} ${companyName(d)}`.toLowerCase().includes(q)),
  );
  const filtering = !!q || owner !== 'all' || company !== 'all' || close !== 'any';
  const clearFilters = () => {
    setQuery('');
    setOwner('all');
    setCompany('all');
    setClose('any');
  };
  const totals = forecast(filtered);
  const closing = closingInMonth(filtered, on);
  const won = wonBetween(filtered, rangeStart('90d', on));
  const visibleStages: readonly Stage[] = showClosed ? stages : openStages;
  const columns = stageSummary(filtered, visibleStages);
  const byClose = (a: CrmRecord, b: CrmRecord) => (a.closeDate || '9999').localeCompare(b.closeDate || '9999');

  return (
    <>
      <PageHeader title='Pipeline' count={totals.count}>
        <ToggleGroup
          type='single'
          variant='outline'
          size='sm'
          value={layout}
          onValueChange={(value) => value && setLayout(value as 'board' | 'list')}
          aria-label='Layout'
        >
          <ToggleGroupItem value='board'>Board</ToggleGroupItem>
          <ToggleGroupItem value='list'>List</ToggleGroupItem>
        </ToggleGroup>
        <Button size='sm' onClick={() => actions.create('deal')}>
          <Plus /> New deal
        </Button>
      </PageHeader>

      <div className='metrics'>
        <Metric label='Open pipeline' value={money(totals.value)} sub={`${totals.count} deals`} />
        <Metric label='Weighted forecast' value={money(totals.weighted)} sub={totals.value ? `${percent(totals.weighted / totals.value)} of open` : '—'} accent />
        <Metric label='Closing this month' value={money(closing.value)} sub={`${closing.count} deals`} />
        <Metric label='Won · last 90 days' value={money(won.value)} sub={`${won.count} deals`} />
      </div>

      <div className='toolbar'>
        <div className='search-field'>
          <Search size={15} />
          <Input aria-label='Search deals' placeholder='Search deals' value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <FilterSelect label='Owner' value={owner} onChange={setOwner} all='All owners' options={ownerOptions.map((o) => ({ value: o, label: o }))} />
        <FilterSelect label='Company' value={company} onChange={setCompany} all='All companies' options={companyOptions} />
        <FilterSelect
          label='Close date'
          value={close}
          onChange={(value) => setClose(value as CloseFilter)}
          options={closeFilters.map((f) => ({ value: f, label: closeFilterNames[f] }))}
        />
        {filtering && (
          <Button variant='ghost' size='sm' onClick={clearFilters}>
            Clear
          </Button>
        )}
        <label className='switch-label'>
          <Switch checked={showClosed} onCheckedChange={setShowClosed} />
          Won &amp; lost
        </label>
      </div>

      {!deals.length ? (
        <EmptyState title='No deals yet.' action={<Button size='sm' onClick={() => actions.create('deal')}>New deal</Button>} />
      ) : !filtered.length ? (
        <EmptyState title='No deals match these filters.' action={<Button variant='outline' size='sm' onClick={clearFilters}>Clear filters</Button>} />
      ) : layout === 'board' ? (
        <div className='board-wrap'>
          <div className='board' style={{ '--columns': visibleStages.length } as CSSProperties}>
            {columns.map((column) => (
              <StageColumn
                key={column.stage}
                column={column}
                deals={filtered
                  .filter((d) => d.status === column.stage)
                  .sort(isOpenDeal({ status: column.stage } as CrmRecord) ? byClose : (a, b) => byClose(b, a))}
                dragging={dragging}
                onDragging={setDragging}
              />
            ))}
          </div>
          {dragging && !showClosed && (
            <div className='outcome-drop'>
              <DropZone stage='won' label='Won' dragging={dragging} onDropped={() => setDragging(null)} />
              <DropZone stage='lost' label='Lost' dragging={dragging} onDropped={() => setDragging(null)} />
            </div>
          )}
        </div>
      ) : (
        <DealTable deals={(showClosed ? filtered : filtered.filter(isOpenDeal)).sort(byClose)} />
      )}
    </>
  );
}

function Metric({ label, value, sub, accent = false }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`metric ${accent ? 'metric-accent' : ''}`}>
      <span className='metric-label'>{label}</span>
      <strong className='metric-value tnum'>{value}</strong>
      <span className='metric-sub tnum'>{sub}</span>
    </div>
  );
}

function useDrop(stage: Stage, dragging: CrmRecord | null, onDropped: () => void) {
  const { actions } = useWorkspace();
  const [over, setOver] = useState(false);
  return {
    over,
    handlers: {
      onDragOver: (event: DragEvent) => {
        if (!dragging) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setOver(true);
      },
      onDragLeave: () => setOver(false),
      onDrop: (event: DragEvent) => {
        event.preventDefault();
        setOver(false);
        onDropped();
        if (dragging) actions.moveDeal(dragging, stage);
      },
    },
  };
}

function StageColumn({
  column,
  deals,
  dragging,
  onDragging,
}: {
  column: ReturnType<typeof stageSummary>[number];
  deals: CrmRecord[];
  dragging: CrmRecord | null;
  onDragging: (deal: CrmRecord | null) => void;
}) {
  const { actions } = useWorkspace();
  const drop = useDrop(column.stage, dragging, () => onDragging(null));
  const open = column.stage !== 'won' && column.stage !== 'lost';
  return (
    <section className={`column ${drop.over ? 'is-over' : ''}`} aria-label={stageNames[column.stage]} {...drop.handlers}>
      <header className='column-head'>
        <div className='column-title'>
          <StagePill stage={column.stage} />
          <span className='column-count tnum'>{column.count}</span>
          {open && <span className='column-prob tnum'>{percent(column.probability)}</span>}
        </div>
        <div className='column-totals tnum'>
          <strong>{money(column.value)}</strong>
          {open && <span>{money(column.weighted)} weighted</span>}
        </div>
      </header>
      <div className='column-cards'>
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onDragging={onDragging} />
        ))}
        {open && (
          <button className='column-add' onClick={() => actions.create('deal', { status: column.stage })}>
            <Plus size={14} /> New
          </button>
        )}
      </div>
    </section>
  );
}

function DropZone({ stage, label, dragging, onDropped }: { stage: Stage; label: string; dragging: CrmRecord; onDropped: () => void }) {
  const drop = useDrop(stage, dragging, onDropped);
  return (
    <div className={`drop-zone drop-${stage} ${drop.over ? 'is-over' : ''}`} {...drop.handlers}>
      Mark as {label.toLowerCase()}
    </div>
  );
}

function DealCard({ deal, onDragging }: { deal: CrmRecord; onDragging: (deal: CrmRecord | null) => void }) {
  const { byId, on, actions } = useWorkspace();
  const company = deal.companyId ? byId.get(deal.companyId) : undefined;
  const overdue = isOpenDeal(deal) && !!deal.closeDate && deal.closeDate < on;
  return (
    <article
      className='deal-card'
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', deal.id);
        event.dataTransfer.effectAllowed = 'move';
        onDragging(deal);
      }}
      onDragEnd={() => onDragging(null)}
    >
      <div className='deal-card-top'>
        <button className='deal-card-name' onClick={() => actions.open(deal)}>
          {deal.name}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon-xs' className='deal-card-menu' aria-label={`Actions for ${deal.name}`}>
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='min-w-44'>
            <DropdownMenuItem onClick={() => actions.open(deal)}>Open</DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.edit(deal)}>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            {openStages
              .filter((stage) => stage !== deal.status)
              .map((stage) => (
                <DropdownMenuItem key={stage} onClick={() => actions.moveDeal(deal, stage)}>
                  Move to {stageNames[stage]}
                </DropdownMenuItem>
              ))}
            <DropdownMenuSeparator />
            {deal.status !== 'won' && <DropdownMenuItem onClick={() => actions.moveDeal(deal, 'won')}>Mark as won</DropdownMenuItem>}
            {deal.status !== 'lost' && <DropdownMenuItem onClick={() => actions.moveDeal(deal, 'lost')}>Mark as lost…</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {company && <span className='deal-card-company'>{company.name}</span>}
      {deal.status === 'lost' && deal.lostReason && <span className='deal-card-reason'>{deal.lostReason}</span>}
      <div className='deal-card-foot'>
        <span className='deal-card-value tnum'>{money(deal.value)}</span>
        <span className={`deal-card-date tnum ${overdue ? 'is-overdue' : ''}`}>{dateLabel(deal.closeDate)}</span>
        {deal.owner && (
          <span title={deal.owner}>
            <Avatar name={deal.owner} size='xs' />
          </span>
        )}
      </div>
    </article>
  );
}

function DealTable({ deals }: { deals: CrmRecord[] }) {
  const { byId, on, actions } = useWorkspace();
  return (
    <div className='table-wrap'>
      <table className='data-table'>
        <thead>
          <tr>
            <th>Deal</th>
            <th>Company</th>
            <th>Stage</th>
            <th>Owner</th>
            <th className='num'>Value</th>
            <th className='num'>Weighted</th>
            <th>Close date</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.id} onClick={() => actions.open(deal)}>
              <td>
                <button className='cell-link' onClick={() => actions.open(deal)}>
                  {deal.name}
                </button>
              </td>
              <td className='muted'>{(deal.companyId && byId.get(deal.companyId)?.name) || '—'}</td>
              <td>
                <StagePill stage={deal.status} />
              </td>
              <td className='muted'>{deal.owner || '—'}</td>
              <td className='num tnum'>{money(deal.value)}</td>
              <td className='num tnum muted'>{isOpenDeal(deal) ? money(weightedValue(deal)) : '—'}</td>
              <td className={`tnum ${isOpenDeal(deal) && deal.closeDate && deal.closeDate < on ? 'text-overdue' : 'muted'}`}>
                {dateLabel(deal.closeDate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
