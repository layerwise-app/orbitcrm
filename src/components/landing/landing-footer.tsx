import { Link } from '@tanstack/react-router';
import { BrandLink } from '~/components/brand';
import { DemoCta, PrimaryCta } from './cta-links';

export function ClosingCta({ signedIn }: { signedIn: boolean }) {
  return (
    <section className='lp-closing' aria-labelledby='lp-closing-title'>
      <h2 id='lp-closing-title'>Run your pipeline in Orbit.</h2>
      <p>Set up your workspace in under a minute.</p>
      <div className='lp-hero-actions'>
        <PrimaryCta signedIn={signedIn} />
        <DemoCta tone='ghost-dark' />
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className='lp-footer'>
      <div className='lp-footer-inner'>
        <BrandLink />
        <nav aria-label='Footer'>
          <Link to='/demo' search={{ view: 'dashboard', record: '' }}>Demo</Link>
          <Link to='/sign-in'>Sign in</Link>
        </nav>
        <small>© 2026 Orbit CRM</small>
      </div>
    </footer>
  );
}
