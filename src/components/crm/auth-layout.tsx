import { Link } from '@tanstack/react-router';
import { ArrowLeft, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return <main className='orbit-auth'><section className='auth-story'><Link to='/' className='crm-brand'><span className='orbit-mark'><span /></span><span>orbit<span className='brand-crm'>crm</span></span></Link><div className='auth-story-content'><span className='auth-eyebrow'><Sparkles size={16} />A LITTLE MORE CONNECTED</span><h1>Good relationships.<br />Great possibilities.</h1><p>Your people, your plans, your next big thing.<br />Bring it all into one connected workspace.</p><div className='auth-orbits' aria-hidden='true'><span /><span /><span /><i /></div></div><span className='auth-story-footer'>Less busywork. More human connections.</span></section><section className='auth-form-side'><Link to='/demo' search={{ view: 'dashboard', record: '' }} className='auth-back'><ArrowLeft size={15} />Back to the demo</Link>{children}<p className='auth-privacy'>A private workspace, just for you.</p></section></main>;
}
