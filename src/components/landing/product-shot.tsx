import { Building2, CalendarDays, CheckCheck, ChevronDown, LayoutDashboard, LayoutGrid, List, Plus, Search, SlidersHorizontal, Target, Users, Zap } from 'lucide-react';
import { BrandMark } from '~/components/brand';
import { openPipeline, pipeline, stageTotal, stageWeighted, usd, weightedForecast, wonThisMonth, type Deal, type Stage } from './data';
import { CompanyLogo, Kbd, OwnerAvatar } from './primitives';

const nav = [
  { icon: LayoutDashboard, label: 'Overview' },
  { icon: Users, label: 'Contacts', count: 248 },
  { icon: Building2, label: 'Companies', count: 64 },
  { icon: Target, label: 'Deals', count: 12, active: true },
  { icon: CheckCheck, label: 'Tasks', count: 9 },
  { icon: Zap, label: 'Activity' },
];

/** The hero's product visual: Orbit's deals board, rendered from sample data. */
export function ProductShot() {
  return (
    <div className='lp-shot' aria-hidden='true'>
      <div className='lp-shot-chrome'>
        <span className='lp-shot-dots'><i /><i /><i /></span>
        <span className='lp-shot-url'>orbit.app/deals</span>
      </div>
      <div className='lp-shot-body'>
        <ShotSidebar />
        <div className='lp-shot-main'>
          <div className='lp-shot-header'>
            <div className='lp-shot-title'>
              <h3>Deals</h3>
              <span className='tnum'>12 open</span>
            </div>
            <div className='lp-shot-actions'>
              <span className='lp-shot-toggle'><span className='is-on'><LayoutGrid size={13} />Board</span><span><List size={13} />List</span></span>
              <span className='lp-btn-mock lp-btn-mock-primary'><Plus size={13} />New deal</span>
            </div>
          </div>
          <div className='lp-shot-filters'>
            <span className='lp-chip'><Search size={12} />Search deals</span>
            <span className='lp-chip'>Owner: Anyone<ChevronDown size={12} /></span>
            <span className='lp-chip'>Close: This quarter<ChevronDown size={12} /></span>
            <span className='lp-chip lp-chip-ghost'><SlidersHorizontal size={12} />Filter</span>
          </div>
          <div className='lp-shot-forecast'>
            <Metric label='Open pipeline' value={usd(openPipeline)} />
            <Metric label='Weighted forecast' value={usd(weightedForecast)} accent />
            <Metric label='Won this month' value={usd(wonThisMonth)} />
            <Metric label='Win rate' value='41%' />
          </div>
          <div className='lp-board'>
            {pipeline.map(stage => <StageColumn key={stage.id} stage={stage} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShotSidebar() {
  return (
    <div className='lp-shot-sidebar'>
      <div className='lp-shot-workspace'><BrandMark size={16} /><strong>Acme Sales</strong><ChevronDown size={12} /></div>
      <div className='lp-shot-search'><Search size={12} /><span>Search</span><Kbd>⌘K</Kbd></div>
      <div className='lp-shot-nav'>
        {nav.map(({ icon: Icon, label, count, active }) => (
          <span key={label} className={active ? 'is-active' : ''}>
            <Icon size={14} strokeWidth={1.75} />
            <span>{label}</span>
            {count !== undefined && <small className='tnum'>{count}</small>}
          </span>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`lp-metric ${accent ? 'is-accent' : ''}`}>
      <span>{label}</span>
      <strong className='tnum'>{value}</strong>
    </div>
  );
}

export function StageColumn({ stage }: { stage: Stage }) {
  const won = stage.id === 'won';
  return (
    <div className={`lp-col lp-col-${stage.id}`}>
      <div className='lp-col-head'>
        <div>
          <strong>{stage.name}</strong>
          <span className='tnum'>{stage.deals.length}</span>
          {!won && <em className='tnum'>{Math.round(stage.probability * 100)}%</em>}
        </div>
        <div className='lp-col-sum'>
          <span className='tnum'>{usd(stageTotal(stage))}</span>
          {!won && <small className='tnum'>{usd(stageWeighted(stage))} weighted</small>}
        </div>
      </div>
      <div className='lp-col-cards'>
        {stage.deals.map(deal => <DealCard key={deal.name} deal={deal} won={won} />)}
      </div>
    </div>
  );
}

export function DealCard({ deal, won = false }: { deal: Deal; won?: boolean }) {
  return (
    <div className='lp-deal'>
      <div className='lp-deal-company'><CompanyLogo company={deal.company} size='xs' /><span>{deal.company.name}</span></div>
      <strong className='lp-deal-name'>{deal.name}</strong>
      <div className='lp-deal-foot'>
        <span className='lp-deal-value tnum'>{usd(deal.value)}</span>
        <span className={`lp-deal-date ${deal.overdue ? 'is-overdue' : ''} ${won ? 'is-won' : ''}`}><CalendarDays size={11} />{deal.close}</span>
        <OwnerAvatar owner={deal.owner} size='xs' />
      </div>
    </div>
  );
}
