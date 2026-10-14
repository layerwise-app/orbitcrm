import { useState } from 'react';
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate
} from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { authClient } from '~/lib/auth-client';
import { Button } from '~/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '~/components/ui/input-otp';
import { AuthLayout } from '~/components/crm/auth-layout';

export const Route = createFileRoute('/sign-in_/otp')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email.trim() : ''
  }),
  beforeLoad: ({ search }) => {
    if (!search.email) throw redirect({ to: '/sign-in' });
  },
  component: EmailOtpPage
});

function EmailOtpPage() {
  const navigate = useNavigate();
  const { email } = Route.useSearch();
  const [otp, setOtp] = useState('');

  const verifyOtp = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signIn.emailOtp({ email, otp });
      if (error) throw new Error(error.message ?? 'Invalid code');
    },
    onSuccess: () => navigate({ to: '/dashboard', search: { view: 'dashboard', record: '' } })
  });

  const resendOtp = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'sign-in'
      });
      if (error) throw new Error(error.message ?? 'Failed to resend code');
    }
  });

  return (
    <AuthLayout
      title='Check your email'
      description={
        <>
          Enter the 6-digit code sent to <strong>{email}</strong>.
        </>
      }
      footer={<Link to='/sign-in'>Use a different email</Link>}
    >
      <form
        className='auth-fields'
        onSubmit={(event) => {
          event.preventDefault();
          verifyOtp.mutate();
        }}
      >
        <InputOTP
          aria-label='Sign-in code'
          autoFocus
          autoComplete='one-time-code'
          containerClassName='auth-otp'
          maxLength={6}
          value={otp}
          onChange={(value) => {
            setOtp(value);
            verifyOtp.reset();
          }}
        >
          <InputOTPGroup className='w-full'>
            {Array.from({ length: 6 }, (_, index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        {verifyOtp.error ? (
          <p className='auth-error' role='alert'>{verifyOtp.error.message}</p>
        ) : null}
        <Button
          type='submit'
          size='lg'
          className='auth-submit'
          disabled={otp.length < 6 || verifyOtp.isPending}
        >
          {verifyOtp.isPending ? 'Verifying…' : 'Verify and sign in'}
        </Button>
      </form>
      <div className='auth-resend'>
        <span>Didn’t get it?</span>
        <button
          type='button'
          className='auth-inline-link'
          disabled={resendOtp.isPending}
          onClick={() => resendOtp.mutate()}
        >
          {resendOtp.isPending
            ? 'Sending…'
            : resendOtp.isSuccess
              ? 'Code sent'
              : 'Resend code'}
        </button>
      </div>
      {resendOtp.error ? (
        <p className='auth-error' role='alert'>{resendOtp.error.message}</p>
      ) : null}
    </AuthLayout>
  );
}
