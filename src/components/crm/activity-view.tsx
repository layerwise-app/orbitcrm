import { useState } from 'react';
import { ArrowRightLeft, CalendarDays, Check, CircleDot, Mail, Pencil, Phone, Plus, StickyNote, Trash2, Trophy, Upload, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import type { CrmActivity } from '~/lib/crm';
import { FilterSelect } from './filter-select';
import { EmptyState, PageHeader } from './shared';
import { useWorkspace } from './workspace-context';

const icons: Record<string, typeof Check> = {
  created: Plus,
  updated: Pencil,
  stage: ArrowRightLeft,
  won: Trophy,
  lost: X,
  completed: Check,
  deleted: Trash2,
  imported: Upload,
  note: StickyNote,
  call: Phone,
  email: Mail,
  meeting: CalendarDays,
};
const filters = [
  { value: 'all', label: 'All activity' },
  { value: 'interactions', label: 'Calls, emails & meetings' },
  { value: 'deals', label: 'Deal changes' },
  { value: 'records', label: 'Record changes' },
];
const matches: Record<string, (type: string) => boolean> = {
  all: () => true,
  interactions: (type) => ['note', 'call', 'email', 'meeting'].includes(type),
  deals: (type) => ['stage', 'won', 'lost'].includes(type),
  records: (type) => ['created', 'updated', 'deleted', 'imported', 'completed'].includes(type),
};
const PAGE = 60;

function dayLabel(ms: number, now: number) {
  const day = (t: number) => new Date(t).toDateString();
  if (day(ms) === day(now)) return 'Today';
  if (day(ms) === day(now - 86_400_000)) return 'Yesterday';
  return new Date(ms).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function ActivityView() {
  const { data, byId, actions } = useWorkspace();
  const [filter, setFilter] = useState('all');
  const [limit, setLimit] = useState(PAGE);
  const now = Date.now();
  const list = data.activities.filter((a) => matches[filter](a.type)).sort((a, b) => b.createdAt - a.createdAt);
  const days = new Map<string, CrmActivity[]>();
  for (const activity of list.slice(0, limit)) {
    const label = dayLabel(activity.createdAt, now);
    days.set(label, [...(days.get(label) ?? []), activity]);
  }

  return (
    <>
      <PageHeader title='Activity'>
        <FilterSelect label='Activity type' value={filter} onChange={setFilter} options={filters} />
      </PageHeader>
      {!list.length ? (
        <EmptyState title='Nothing logged yet.' />
      ) : (
        <div className='activity-days'>
          {[...days].map(([label, items]) => (
            <section key={label} className='activity-day'>
              <h2 className='section-label'>{label}</h2>
              <ol className='activity-list'>
                {items.map((activity) => {
                  const Icon = icons[activity.type] ?? CircleDot;
                  const record = activity.recordId ? byId.get(activity.recordId) : undefined;
                  return (
                    <li key={activity.id} className={`activity-row event-${activity.type}`}>
                      <span className='feed-icon'>
                        <Icon size={12} />
                      </span>
                      {record ? (
                        <button className='activity-text is-link' onClick={() => actions.open(record)}>
                          {activity.message}
                        </button>
                      ) : (
                        <span className='activity-text'>{activity.message}</span>
                      )}
                      <span className='activity-meta'>
                        {activity.author} ·{' '}
                        <time className='tnum' dateTime={new Date(activity.createdAt).toISOString()}>
                          {new Date(activity.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </time>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
          {list.length > limit && (
            <Button variant='outline' size='sm' className='self-start' onClick={() => setLimit((n) => n + PAGE)}>
              Show more
            </Button>
          )}
        </div>
      )}
    </>
  );
}
