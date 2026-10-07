import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, ArrowUpRight, Building2, Check, CheckCheck, ChartNoAxesCombined, CircleCheck, LockKeyhole, MessageSquare, Sparkles, Users } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { getAuthSession } from '~/lib/auth.functions';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/')({
  loader: async () => ({ session: await getAuthSession() }),
  head: () => ({ meta: seo({ title: 'Orbit CRM · A little more connected', description: 'A calmer way to grow your business. Bring contacts, companies, deals, and follow-ups into one private workspace.' }) }),
  component: LandingPage,
});

function LandingPage() {
  const { session } = Route.useLoaderData();
  const workspaceLink = session
    ? <Link to='/dashboard' search={{ view: 'dashboard', record: '' }}>Open your workspace <ArrowUpRight size={16} /></Link>
    : <Link to='/sign-up'>Create your workspace <ArrowRight size={16} /></Link>;

  return <div className='orbit-landing'>
    <header className='landing-header'>
      <Link to='/' className='crm-brand' aria-label='Orbit CRM home'><span className='orbit-mark'><span /></span><span>orbit<span className='brand-crm'>crm</span></span></Link>
      <nav aria-label='Main navigation'>
        <a href='#features'>A little more connected</a>
        <Link to='/demo' search={{ view: 'dashboard', record: '' }}>Explore the demo <ArrowUpRight size={13} /></Link>
      </nav>
      <div className='landing-header-actions'>
        {!session && <Link to='/sign-in' className='landing-sign-in'>Sign in</Link>}
        <Button className='landing-primary' asChild>{workspaceLink}</Button>
      </div>
    </header>

    <main>
      <section className='landing-hero'>
        <div className='landing-hero-copy'>
          <span className='landing-eyebrow'><span />YOUR RELATIONSHIPS, IN ORBIT</span>
          <h1>Good relationships.<br />Great <span>possibilities.</span></h1>
          <p>Less keeping tabs. More keeping in touch.<br />Bring your people, deals, and next steps into one calm, connected workspace.</p>
          <div className='landing-hero-actions'><Button className='landing-primary' size='lg' asChild>{workspaceLink}</Button><Button variant='outline' size='lg' className='landing-demo-button' asChild><Link to='/demo' search={{ view: 'dashboard', record: '' }}>Take a look around <ArrowUpRight size={16} /></Link></Button></div>
          <div className='landing-hero-reassurance'><span><Check size={13} />Your own private workspace</span><span><Check size={13} />No account needed for the demo</span></div>
        </div>
        <div className='landing-hero-art'>
          <div className='landing-orbits' aria-hidden='true'><span /><span /><span /></div>
          <span className='landing-art-sparkle' aria-hidden='true'><Sparkles size={35} strokeWidth={1.2} /></span>
          <div className='landing-preview'>
            <div className='landing-preview-top'><span className='landing-preview-dots'><i /><i /><i /></span><span>YOUR WORKSPACE, AT A GLANCE</span><span className='landing-preview-initials'>AM</span></div>
            <div className='landing-preview-content'>
              <span className='landing-preview-eyebrow'>A LITTLE MOMENTUM</span>
              <h2>A good day to grow.</h2><p>Big things start with a conversation.</p>
              <div className='landing-preview-stats'><div><span>Pipeline value <ChartNoAxesCombined size={14} /></span><strong>$162,500</strong><small><span />6 active opportunities</small></div><div><span>Won revenue <ArrowUpRight size={14} /></span><strong>$82,500</strong><small><Check size={10} />2 good reasons to celebrate</small></div></div>
              <div className='landing-preview-pipeline'><div><strong>Your next possibilities</strong><span>In good company <ArrowUpRight size={11} /></span></div><div className='landing-preview-deal'><span className='landing-company-logo'>N</span><div><strong>Enterprise workspace</strong><small>Notion · Phoenix Baker</small></div><span className='landing-preview-stage'>Proposal</span><strong>$48,000</strong></div><div className='landing-preview-deal'><span className='landing-company-logo'>L</span><div><strong>Annual team subscription</strong><small>Linear · Olivia Rhye</small></div><span className='landing-preview-stage negotiation'>Negotiation</span><strong>$24,500</strong></div></div>
              <div className='landing-preview-task'><span className='landing-preview-checkbox' /><span>Follow up on the enterprise proposal</span><small>Today</small></div>
            </div>
          </div>
          <div className='landing-milestone'><span><CircleCheck size={20} strokeWidth={1.5} /></span><div><strong>Another possibility, made real.</strong><small>Global rollout moved to Won</small></div><span className='landing-milestone-sparkle'><Sparkles size={16} /></span></div>
          <span className='landing-art-caption'>A little clarity. A lot of possibility.</span>
        </div>
      </section>

      <section id='features' className='landing-features'>
        <div className='landing-section-heading'><span className='landing-eyebrow'>LESS BUSYWORK. MORE HUMAN CONNECTIONS.</span><h2>Everything connected.<br /><span>Nothing overcomplicated.</span></h2><p>A focused CRM for the relationships that matter.<br />The right tools, with room to breathe.</p></div>
        <div className='landing-feature-grid'>
          <article><span className='landing-feature-icon'><Users size={23} strokeWidth={1.5} /></span><span className='landing-feature-number'>01 / YOUR PEOPLE</span><h3>Keep your circle close.</h3><p>Contacts, companies, tags, and conversation notes. All the context you need for a thoughtful next hello.</p><Link to='/demo' search={{ view: 'contacts', record: '' }}>Meet your contacts <ArrowUpRight size={14} /></Link></article>
          <article><span className='landing-feature-icon'><ChartNoAxesCombined size={23} strokeWidth={1.5} /></span><span className='landing-feature-number'>02 / YOUR POSSIBILITIES</span><h3>Find your momentum.</h3><p>See every opportunity in a clear sales pipeline. Move deals forward, track their value, and celebrate the wins.</p><Link to='/demo' search={{ view: 'deals', record: '' }}>Explore the pipeline <ArrowUpRight size={14} /></Link></article>
          <article><span className='landing-feature-icon'><CheckCheck size={23} strokeWidth={1.5} /></span><span className='landing-feature-number'>03 / YOUR NEXT STEPS</span><h3>Make the follow-up count.</h3><p>Turn a good conversation into a next step. Linked tasks and due dates help you show up at the right time.</p><Link to='/demo' search={{ view: 'tasks', record: '' }}>See what’s next <ArrowUpRight size={14} /></Link></article>
        </div>
      </section>

      <section className='landing-connected-strip' aria-label='Workspace capabilities'><span><Building2 size={17} />Contacts & companies</span><span><MessageSquare size={17} />Notes & activity</span><span><ChartNoAxesCombined size={17} />Pipeline & insights</span><span><LockKeyhole size={17} />Private by design</span></section>
      <section className='landing-closing'><div><span className='landing-eyebrow'><Sparkles size={14} />A LITTLE ROOM TO GROW</span><h2>Your next great relationship<br />starts with a little hello.</h2><p>Make yourself at home. We’ll help you connect the dots.</p></div><div><Button className='landing-primary' size='lg' asChild>{workspaceLink}</Button><Link to='/demo' search={{ view: 'dashboard', record: '' }} className='landing-closing-demo'>Or explore the demo first <ArrowUpRight size={14} /></Link></div><div className='landing-closing-orbits' aria-hidden='true'><span /><span /><span /></div></section>
    </main>
    <footer className='landing-footer'><Link to='/' className='crm-brand'><span className='orbit-mark'><span /></span><span>orbit<span className='brand-crm'>crm</span></span></Link><span>Less busywork. More human connections.</span><div><Link to='/demo' search={{ view: 'dashboard', record: '' }}>Demo</Link>{session ? <Link to='/dashboard' search={{ view: 'dashboard', record: '' }}>Your workspace</Link> : <Link to='/sign-in'>Sign in</Link>}</div></footer>
  </div>;
}
