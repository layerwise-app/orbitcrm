import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { authClient } from '~/lib/auth-client';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { AuthLayout } from '~/components/crm/auth-layout';

export const Route = createFileRoute('/sign-up')({
  component: SignUpPage
});

function SignUpPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const passwordsMatch = password === confirmPassword;

  const signUp = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password
      });
      if (error) throw new Error(error.message ?? 'Failed to create account');
    },
    onSuccess: () => navigate({ to: '/dashboard', search: { view: 'dashboard', record: '' } })
  });

  return (
    <AuthLayout
      title='Create your workspace'
      description='Track contacts, deals, and forecasts in one place.'
      footer={
        <>
          Already have an account? <Link to='/sign-in'>Sign in</Link>
        </>
      }
    >
      <form
        className='auth-fields'
        onSubmit={(event) => {
          event.preventDefault();
          if (!passwordsMatch) return;
          signUp.mutate();
        }}
      >
        <div className='auth-field'>
          <Label htmlFor='name'>Full name</Label>
          <Input
            id='name'
            autoComplete='name'
            autoFocus
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className='auth-field'>
          <Label htmlFor='email'>Work email</Label>
          <Input
            id='email'
            type='email'
            autoComplete='email'
            placeholder='you@company.com'
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className='auth-field'>
          <Label htmlFor='password'>Password</Label>
          <Input
            id='password'
            type='password'
            autoComplete='new-password'
            placeholder='At least 8 characters'
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className='auth-field'>
          <Label htmlFor='confirm-password'>Confirm password</Label>
          <Input
            id='confirm-password'
            type='password'
            autoComplete='new-password'
            minLength={8}
            required
            aria-invalid={confirmPassword ? !passwordsMatch : undefined}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          {confirmPassword && !passwordsMatch ? (
            <p className='auth-error' role='alert'>Passwords do not match.</p>
          ) : null}
        </div>
        {signUp.error ? (
          <p className='auth-error' role='alert'>{signUp.error.message}</p>
        ) : null}
        <Button
          type='submit'
          size='lg'
          className='auth-submit'
          disabled={!passwordsMatch || signUp.isPending}
        >
          {signUp.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
