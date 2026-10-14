import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { ChevronDownIcon } from 'lucide-react';
import { authClient } from '~/lib/auth-client';
import { Button } from '~/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '~/components/ui/collapsible';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { AuthLayout } from '~/components/crm/auth-layout';

export const Route = createFileRoute('/sign-in')({
  component: SignInPage
});

function SignInPage() {
  const navigate = useNavigate();
  const [passwordEmail, setPasswordEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpEmail, setOtpEmail] = useState('');

  const sendOtp = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: otpEmail,
        type: 'sign-in'
      });
      if (error) throw new Error(error.message ?? 'Failed to send code');
    },
    onSuccess: () =>
      navigate({ to: '/sign-in/otp', search: { email: otpEmail } })
  });

  const signInWithPassword = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signIn.email({
        email: passwordEmail,
        password
      });
      if (error) throw new Error(error.message ?? 'Failed to sign in');
    },
    onSuccess: () => navigate({ to: '/dashboard', search: { view: 'dashboard', record: '' } })
  });

  return (
    <AuthLayout
      title='Sign in to Orbit'
      description='We’ll email you a one-time sign-in code.'
      footer={
        <>
          New to Orbit? <Link to='/sign-up'>Create an account</Link>
        </>
      }
    >
      <form
        className='auth-fields'
        onSubmit={(event) => {
          event.preventDefault();
          sendOtp.mutate();
        }}
      >
        <div className='auth-field'>
          <Label htmlFor='otp-email'>Email</Label>
          <Input
            id='otp-email'
            type='email'
            autoComplete='email'
            placeholder='you@company.com'
            autoFocus
            required
            value={otpEmail}
            onChange={(event) => {
              setOtpEmail(event.target.value);
              sendOtp.reset();
            }}
          />
        </div>
        {sendOtp.error ? (
          <p className='auth-error' role='alert'>{sendOtp.error.message}</p>
        ) : null}
        <Button type='submit' size='lg' className='auth-submit' disabled={sendOtp.isPending}>
          {sendOtp.isPending ? 'Sending code…' : 'Continue with email'}
        </Button>
      </form>
      <div className='auth-divider'>or</div>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant='outline' size='lg' className='auth-secondary group'>
            Sign in with password
            <ChevronDownIcon className='size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180' />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <form
            className='auth-fields auth-password-form'
            onSubmit={(event) => {
              event.preventDefault();
              signInWithPassword.mutate();
            }}
          >
            <div className='auth-field'>
              <Label htmlFor='password-email'>Email</Label>
              <Input
                id='password-email'
                type='email'
                autoComplete='email'
                required
                value={passwordEmail}
                onChange={(event) => {
                  setPasswordEmail(event.target.value);
                  signInWithPassword.reset();
                }}
              />
            </div>
            <div className='auth-field'>
              <div className='auth-label-row'>
                <Label htmlFor='password'>Password</Label>
                <Link to='/forgot-password' className='auth-inline-link'>
                  Forgot password?
                </Link>
              </div>
              <Input
                id='password'
                type='password'
                autoComplete='current-password'
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  signInWithPassword.reset();
                }}
              />
            </div>
            {signInWithPassword.error ? (
              <p className='auth-error' role='alert'>
                {signInWithPassword.error.message}
              </p>
            ) : null}
            <Button type='submit' size='lg' className='auth-submit' disabled={signInWithPassword.isPending}>
              {signInWithPassword.isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CollapsibleContent>
      </Collapsible>
    </AuthLayout>
  );
}
