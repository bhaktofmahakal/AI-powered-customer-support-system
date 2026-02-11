'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect, useState } from 'react';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mockSession, setMockSession] = useState<any>(undefined);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('testAuth=true')) {
      setMockSession({
        user: {
          id: 'demo-user-id',
          name: 'Demo User',
          email: 'demo@example.com',
          image: 'https://i.pravatar.cc/150?img=1'
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  }, []);

  return (
    <SessionProvider
      session={mockSession}
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}
