import { ArrowRight, CalendarDays, CornerDownLeft, Mail, Phone, Plus, Search, StickyNote, Target, Upload, Users } from 'lucide-react';
import { companies, owners } from './data';
import { CompanyLogo, Kbd, OwnerAvatar, Panel } from './primitives';

const timeline = [
  { icon: Phone, kind: 'Call', title: 'Pricing review with Elena', body: 'Wants a 3-year term if onboarding is included.', meta: 'Jordan · 32 min · Today, 10:40' },
  { icon: Mail, kind: 'Email', title: 'Sent revised order form', body: 'Multi-year agreement v3 attached.', meta: 'Jordan · Yesterday' },
  { icon: CalendarDays, kind: 'Meeting', title: 'Security review', body: 'IT signed off. Legal next.', meta: 'Priya, Jordan · Oct 8' },
  { icon: StickyNote, kind: 'Note', title: 'Procurement contact added', body: 'Loop in Mei Tanaka for vendor onboarding.', meta: 'Jordan · Oct 6' },
  { icon: ArrowRight, kind: 'Stage', title: 'Moved to Negotiation', body: 'From Proposal at $96,000.', meta: 'Jordan · Oct 3' },
];

/** Record timeline: composer tabs plus logged notes, calls, emails, and meetings. */
export function TimelineSnippet() {
  return (
    <Panel className='lp-timeline'>
      <div aria-hidden='true'>
        <div className='lp-record-head'>
          <CompanyLogo company={companies.northwind} size='md' />
          <div>
            <strong>Multi-year agreement</strong>
            <span className='tnum'>Northwind Traders · $96,000 · Negotiation</span>
          </div>
        </div>
        <div className='lp-composer'>
          <div className='lp-composer-tabs'>
            <span className='is-on'><StickyNote size={12} />Note</span>
            <span><Phone size={12} />Call</span>
            <span><Mail size={12} />Email</span>
            <span><CalendarDays size={12} />Meeting</span>
          </div>
          <div className='lp-composer-body'>
            <span>Elena confirmed budget for 2027<i className='lp-caret' /></span>
            <span className='lp-btn-mock lp-btn-mock-ink'>Log interaction</span>
          </div>
        </div>
        <ol className='lp-events'>
          {timeline.map(({ icon: Icon, kind, title, body, meta }) => (
            <li key={title}>
              <span className='lp-event-icon'><Icon size={13} /></span>
              <div>
                <strong>{title}<em>{kind}</em></strong>
                <p>{body}</p>
                <small>{meta}</small>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Panel>
  );
}

const paletteGroups = [
  {
    label: 'Records',
    items: [
      { icon: Target, text: 'Multi-year agreement', hint: 'Deal · Northwind', active: true },
      { icon: Users, text: 'Elena Novak', hint: 'Contact · Northwind' },
    ],
  },
  {
    label: 'Actions',
    items: [
      { icon: Plus, text: 'New deal', hint: 'Create' },
      { icon: Upload, text: 'Import contacts', hint: 'CSV' },
    ],
  },
];

/** ⌘K command palette with grouped results. */
export function PaletteSnippet() {
  return (
    <Panel className='lp-palette'>
      <div aria-hidden='true'>
        <div className='lp-palette-input'><Search size={14} /><span>north<i className='lp-caret' /></span><Kbd>esc</Kbd></div>
        {paletteGroups.map(group => (
          <div key={group.label} className='lp-palette-group'>
            <span className='lp-palette-label'>{group.label}</span>
            {group.items.map(({ icon: Icon, text, hint, active }) => (
              <span key={text} className={`lp-palette-item ${active ? 'is-active' : ''}`}>
                <Icon size={14} />
                <span>{text}</span>
                <small>{hint}</small>
                {active && <CornerDownLeft size={12} />}
              </span>
            ))}
          </div>
        ))}
        <div className='lp-palette-foot'>
          <span><Kbd>↑</Kbd><Kbd>↓</Kbd>Navigate</span>
          <span><Kbd>↵</Kbd>Open</span>
        </div>
      </div>
    </Panel>
  );
}

const taskGroups = [
  {
    label: 'Overdue',
    tone: 'danger',
    tasks: [{ text: 'Send redlines to Northwind legal', due: 'Oct 10', owner: owners.jordan }],
  },
  {
    label: 'Today',
    tone: 'accent',
    tasks: [
      { text: 'Follow up on Halcyon proposal', due: 'Today', owner: owners.priya },
      { text: 'Book onboarding kickoff', due: 'Today', owner: owners.priya, done: true },
    ],
  },
  {
    label: 'Upcoming',
    tone: 'neutral',
    tasks: [{ text: 'Quarterly review with Lumen Labs', due: 'Oct 21', owner: owners.marcus }],
  },
] as const;

/** Tasks grouped by due date with a quick-add row. */
export function TasksSnippet() {
  return (
    <Panel className='lp-tasks'>
      <div aria-hidden='true'>
        <div className='lp-task-add'><Plus size={13} /><span>Add a task…</span><span className='lp-task-add-due'><CalendarDays size={12} />Tomorrow</span></div>
        {taskGroups.map(group => (
          <div key={group.label} className='lp-task-group'>
            <span className={`lp-task-label is-${group.tone}`}>{group.label}<small className='tnum'>{group.tasks.length}</small></span>
            {group.tasks.map(task => (
              <span key={task.text} className={`lp-task ${'done' in task && task.done ? 'is-done' : ''}`}>
                <i className='lp-task-box' />
                <span>{task.text}</span>
                <small className={group.tone === 'danger' ? 'is-overdue' : ''}>{task.due}</small>
                <OwnerAvatar owner={task.owner} size='xs' />
              </span>
            ))}
          </div>
        ))}
        <span className='lp-task-more'>View all tasks<ArrowRight size={12} /></span>
      </div>
    </Panel>
  );
}
