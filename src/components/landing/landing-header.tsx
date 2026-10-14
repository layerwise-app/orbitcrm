import { Link } from '@tanstack/react-router';
import { BrandLink } from '~/components/brand';
import { PrimaryCta } from './cta-links';

const anchors = [
  { href: '#pipeline', label: 'Pipeline' },
  { href: '#insights', label: 'Insights' },
  { href: '#contacts', label: 'Contacts' },
];

export function LandingHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className='lp-header'>
      <div className='lp-header-inner'>
        <BrandLink className='lp-header-brand' />
        <nav className='lp-header-nav' aria-label='Main'>
          {anchors.map(anchor => <a key={anchor.href} href={anchor.href}>{anchor.label}</a>)}
          <Link to='/demo' search={{ view: 'dashboard', record: '' }}>Demo</Link>
        </nav>
        <div className='lp-header-actions'>
          {!signedIn && <Link to='/sign-in' className='lp-header-signin'>Sign in</Link>}
          <PrimaryCta signedIn={signedIn} size='sm' />
        </div>
      </div>
    </header>
  );
}
