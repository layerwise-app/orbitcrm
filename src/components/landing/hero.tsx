import { DemoCta, PrimaryCta } from './cta-links';
import { ProductShot } from './product-shot';

export function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className='lp-hero' aria-labelledby='lp-hero-title'>
      <div className='lp-hero-copy'>
        <h1 id='lp-hero-title'>The CRM that keeps deals moving.</h1>
        <p>Contacts, pipeline, and forecasts in one fast workspace for small sales teams.</p>
        <div className='lp-hero-actions'>
          <PrimaryCta signedIn={signedIn} />
          <DemoCta />
        </div>
      </div>
      <div className='lp-hero-visual'>
        <ProductShot />
      </div>
    </section>
  );
}
