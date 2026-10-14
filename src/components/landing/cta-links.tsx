import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

type Size = 'sm' | 'lg';

/** "Get started" for visitors, "Open workspace" for signed-in users. */
export function PrimaryCta({ signedIn, size = 'lg', tone = 'accent' }: { signedIn: boolean; size?: Size; tone?: 'accent' | 'ink' }) {
  const className = `lp-btn lp-btn-${size} lp-btn-${tone}`;
  if (signedIn) {
    return (
      <Link to='/dashboard' search={{ view: 'dashboard', record: '' }} className={className}>
        Open workspace{size === 'lg' && <ArrowRight size={15} />}
      </Link>
    );
  }
  return (
    <Link to='/sign-up' className={className}>
      Get started{size === 'lg' && <ArrowRight size={15} />}
    </Link>
  );
}

export function DemoCta({ tone = 'outline' }: { tone?: 'outline' | 'ghost-dark' }) {
  return (
    <Link to='/demo' search={{ view: 'dashboard', record: '' }} className={`lp-btn lp-btn-lg lp-btn-${tone}`}>
      View demo
    </Link>
  );
}
