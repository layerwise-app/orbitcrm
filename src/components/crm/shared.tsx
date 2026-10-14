import type { ReactNode } from 'react';
import { initials, stageNames, statusNames, type CrmRecord } from '~/lib/crm';

// Warm, low-chroma avatar tints; the brand accent stays reserved for actions and charts.
const tints = ['sand', 'slate', 'clay', 'plum', 'ochre'] as const;

export function Avatar({
  name,
  size = 'md',
  square = false,
}: {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  square?: boolean;
}) {
  const tint = tints[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % tints.length];
  return (
    <span className={`avatar avatar-${size} ${square ? 'avatar-square' : `tint-${tint}`}`} aria-hidden='true'>
      {square ? name.slice(0, 1).toUpperCase() : initials(name)}
    </span>
  );
}

export function RecordAvatar({ record, size = 'md' }: { record: CrmRecord; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  return <Avatar name={record.name} size={size} square={record.kind === 'company' || record.kind === 'deal'} />;
}

export function StagePill({ stage }: { stage: string }) {
  return (
    <span className={`pill stage-${stage}`}>
      <span className='pill-dot' />
      {stageNames[stage] ?? stage}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`pill status-${status}`}>
      <span className='pill-dot' />
      {statusNames[status] ?? status}
    </span>
  );
}

export function Tags({ tags, max = 2 }: { tags: string[]; max?: number }) {
  if (!tags.length) return null;
  return (
    <span className='tags'>
      {tags.slice(0, max).map((tag) => (
        <span className='tag' key={tag}>
          {tag}
        </span>
      ))}
      {tags.length > max && <span className='tag tag-more'>+{tags.length - max}</span>}
    </span>
  );
}

export function EmptyState({ title, action, icon }: { title: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className='empty'>
      {icon && <span className='empty-icon'>{icon}</span>}
      <p>{title}</p>
      {action}
    </div>
  );
}

export function PageHeader({ title, count, children }: { title: string; count?: number; children?: ReactNode }) {
  return (
    <header className='page-header'>
      <h1>
        {title}
        {count !== undefined && <span className='page-count tnum'>{count}</span>}
      </h1>
      {children && <div className='page-actions'>{children}</div>}
    </header>
  );
}

/** Compact relative time: "now", "12m", "5h", "3d", then a calendar date. */
export function timeAgo(ms: number, now = Date.now()) {
  const minutes = Math.round((now - ms) / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}
