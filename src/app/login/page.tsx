'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';

function LoginContent() {
  const router = useRouter();
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [authStatus, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-surface-50 via-brand-50 to-surface-100">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-brand-300/20 blur-3xl" />
      </div>

      {/* Logo and title */}
      <div className="relative z-10 text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/25 mb-4">
          <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-surface-900">Agent Dashboard</h1>
        <p className="text-surface-600 mt-1">Monitor your AI conversations</p>
      </div>

      {/* Authenticator */}
      <div className="relative z-10 w-full max-w-md px-4">
        <Authenticator
          variation="modal"
          components={{
            Header() {
              return null;
            },
          }}
          formFields={{
            signIn: {
              username: {
                label: 'Email',
                placeholder: 'Enter your email',
              },
            },
            signUp: {
              email: {
                label: 'Email',
                placeholder: 'Enter your email',
                order: 1,
              },
              password: {
                label: 'Password',
                placeholder: 'Create a password',
                order: 2,
              },
              confirm_password: {
                label: 'Confirm Password',
                placeholder: 'Confirm your password',
                order: 3,
              },
            },
          }}
        >
          {() => null}
        </Authenticator>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-8 text-center">
        <p className="text-sm text-surface-500">
          Powered by AWS Amplify
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginContent />;
}

