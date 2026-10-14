import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { BrandLink } from '~/components/brand';
import { openPipeline, pipeline, usd, weightedForecast } from '~/components/landing/data';
import { StageColumn } from '~/components/landing/product-shot';

type AuthLayoutProps = {
  title: string;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

/** Split layout shared by every auth page: form on the left, product preview on the right. */
export function AuthLayout({ title, description, footer, children }: AuthLayoutProps) {
  return (
    <div className='auth'>
      <main className='auth-main'>
        <header className='auth-top'>
          <BrandLink />
          <Link to='/demo' search={{ view: 'dashboard', record: '' }} className='auth-top-link'>View demo</Link>
        </header>
        <div className='auth-body'>
          <div className='auth-form'>
            <h1>{title}</h1>
            {description && <p className='auth-description'>{description}</p>}
            <div className='auth-content'>{children}</div>
            {footer && <div className='auth-footer'>{footer}</div>}
          </div>
        </div>
        <p className='auth-legal'>© 2026 Orbit CRM</p>
      </main>
      <AuthPreview />
    </div>
  );
}

const previewStages = pipeline.filter(stage => stage.id === 'proposal' || stage.id === 'negotiation');

function AuthPreview() {
  return (
    <aside className='auth-aside' aria-hidden='true'>
      <div className='auth-preview'>
        <div className='auth-preview-metrics'>
          <div className='lp-metric'>
            <span>Open pipeline</span>
            <strong className='tnum'>{usd(openPipeline)}</strong>
          </div>
          <div className='lp-metric is-accent'>
            <span>Weighted forecast</span>
            <strong className='tnum'>{usd(weightedForecast)}</strong>
          </div>
        </div>
        <div className='auth-preview-board'>
          {previewStages.map(stage => <StageColumn key={stage.id} stage={stage} />)}
        </div>
      </div>
    </aside>
  );
}
