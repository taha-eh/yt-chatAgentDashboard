'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';
import '@aws-amplify/ui-react/styles.css';
import { ReactNode, useEffect, useState } from 'react';

// Configure Amplify on the client side
Amplify.configure(outputs, { ssr: true });

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="animate-pulse">
          <div className="w-32 h-8 skeleton rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <Authenticator.Provider>
      {children}
    </Authenticator.Provider>
  );
}

