import { createFileRoute } from '@tanstack/react-router';
import { Features } from '~/components/landing/features';
import { Hero } from '~/components/landing/hero';
import { LandingHeader } from '~/components/landing/landing-header';
import { ClosingCta, LandingFooter } from '~/components/landing/landing-footer';
import { getAuthSession } from '~/lib/auth.functions';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/')({
  loader: async () => ({ session: await getAuthSession() }),
  head: () => ({
    meta: seo({
      title: 'Orbit CRM — Pipeline, contacts, and forecasts for small sales teams',
      description: 'Track deals by stage, forecast weighted revenue, and manage contacts and follow-ups in one fast workspace.',
    }),
  }),
  component: LandingPage,
});

function LandingPage() {
  const { session } = Route.useLoaderData();
  const signedIn = Boolean(session);
  return (
    <div className='lp'>
      <LandingHeader signedIn={signedIn} />
      <main>
        <Hero signedIn={signedIn} />
        <Features />
        <ClosingCta signedIn={signedIn} />
      </main>
      <LandingFooter />
    </div>
  );
}
