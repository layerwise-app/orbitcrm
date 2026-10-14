import type { ReactNode } from 'react';
import type { Company, Owner, Tone } from './data';

export function OwnerAvatar({ owner, size = 'sm' }: { owner: Pick<Owner, 'initials' | 'tone'>; size?: 'xs' | 'sm' | 'md' }) {
  return <span className={`lp-avatar lp-avatar-${size} lp-tone-${owner.tone}`}>{owner.initials}</span>;
}

export function CompanyLogo({ company, size = 'sm' }: { company: Company; size?: 'xs' | 'sm' | 'md' }) {
  return <span className={`lp-logo lp-logo-${size} lp-tone-${company.tone}`}>{company.name[0]}</span>;
}

export function Pill({ tone = 'neutral', children }: { tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | Tone; children: ReactNode }) {
  return <span className={`lp-pill lp-pill-${tone}`}>{children}</span>;
}

/** A framed piece of UI with a subtle surface, used for every feature snippet. */
export function Panel({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`lp-panel ${className}`}>{children}</div>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className='lp-kbd'>{children}</kbd>;
}
