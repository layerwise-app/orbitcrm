import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { authClient } from '~/lib/auth-client';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '~/components/ui/input-otp';
import { AuthLayout } from '~/components/crm/auth-layout';

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage
});

const backToSignIn = (
  <Link to='/sign-in' className='auth-back'>
    <ArrowLeft size={14} />
    Back to sign in
  </Link>
);

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const passwordsMatch = password === confirmPassword;

  const requestReset = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.emailOtp.requestPasswordReset({
        email
      });
      if (error) throw new Error(error.message ?? 'Failed to send reset code');
    }
  });

  const resetPassword = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password
      });
      if (error) throw new Error(error.message ?? 'Failed to reset password');
    }
  });

  if (resetPassword.isSuccess) {
    return (
      <AuthLayout
        title='Password updated'
        description='Sign in with your new password.'
      >
        <Button asChild size='lg' className='auth-submit'>
          <Link to='/sign-in'>Back to sign in</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title='Reset your password'
      description='We’ll email you a 6-digit reset code.'
      footer={backToSignIn}
    >
      <form
        className='auth-fields'
        onSubmit={(event) => {
          event.preventDefault();
          setOtp('');
          resetPassword.reset();
          requestReset.mutate();
        }}
      >
        <div className='auth-field'>
          <Label htmlFor='email'>Email</Label>
          <div className='auth-inline-form'>
            <Input
              id='email'
              type='email'
              autoComplete='email'
              placeholder='you@company.com'
              autoFocus
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setOtp('');
                requestReset.reset();
                resetPassword.reset();
              }}
            />
            <Button
              type='submit'
              size='lg'
              variant={requestReset.isSuccess ? 'outline' : 'default'}
              disabled={requestReset.isPending}
            >
              {requestReset.isPending
                ? 'Sending…'
                : requestReset.isSuccess
                  ? 'Resend code'
                  : 'Send code'}
            </Button>
          </div>
        </div>
        {requestReset.error ? (
          <p className='auth-error' role='alert'>{requestReset.error.message}</p>
        ) : null}
      </form>
      {requestReset.isSuccess ? (
        <form
          className='auth-fields auth-step'
          onSubmit={(event) => {
            event.preventDefault();
            if (!passwordsMatch) return;
            resetPassword.mutate();
          }}
        >
          <p className='auth-hint'>
            Enter the code sent to <strong>{email}</strong> and choose a new password.
          </p>
          <div className='auth-field'>
            <Label htmlFor='reset-code'>Reset code</Label>
            <InputOTP
              id='reset-code'
              containerClassName='auth-otp'
              maxLength={6}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                resetPassword.reset();
              }}
            >
              <InputOTPGroup className='w-full'>
                {Array.from({ length: 6 }, (_, index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <div className='auth-field'>
            <Label htmlFor='password'>New password</Label>
            <Input
              id='password'
              type='password'
              autoComplete='new-password'
              placeholder='At least 8 characters'
              minLength={8}
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                resetPassword.reset();
              }}
            />
          </div>
          <div className='auth-field'>
            <Label htmlFor='confirm-password'>Confirm new password</Label>
            <Input
              id='confirm-password'
              type='password'
              autoComplete='new-password'
              minLength={8}
              required
              aria-invalid={confirmPassword ? !passwordsMatch : undefined}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                resetPassword.reset();
              }}
            />
            {confirmPassword && !passwordsMatch ? (
              <p className='auth-error' role='alert'>Passwords do not match.</p>
            ) : null}
          </div>
          {resetPassword.error ? (
            <p className='auth-error' role='alert'>{resetPassword.error.message}</p>
          ) : null}
          <Button
            type='submit'
            size='lg'
            className='auth-submit'
            disabled={otp.length < 6 || !passwordsMatch || resetPassword.isPending}
          >
            {resetPassword.isPending ? 'Resetting…' : 'Reset password'}
          </Button>
        </form>
      ) : null}
    </AuthLayout>
  );
}
