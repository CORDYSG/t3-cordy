// src/hooks/useActivityTracker.ts
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useGuest } from '@/contexts/GuestContext'; // Use context instead
import { api } from '@/trpc/react';

export function useActivityTracker() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { guestId } = useGuest(); // Get guestId from context
  const logActivity = api.activity.logActivity.useMutation();
  const previousPathname = useRef<string | undefined>(undefined);
  
  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') return; 
    if (!session?.user && !guestId) return;
    
    // Don't log the same page twice
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
 
    const logPageView = () => {
      // Only log if we have either a user or guestId
      if (session?.user || guestId) {
        logActivity.mutate({
          guestId: !session?.user ? guestId || undefined : undefined,
          activityType: 'page_view',
          url: pathname,
          metadata: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            authenticated: !!session?.user,
          },
        });
      }
    };

    logPageView();
  }, [pathname, session, status, guestId, logActivity]); // Include guestId in dependencies
}