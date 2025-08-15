// src/hooks/useGuestActivityMerge.ts
'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/trpc/react';
import { useGuest } from '@/contexts/GuestContext';

export function useGuestActivityMerge() {
  const { data: session, status } = useSession();
  const mergeActivities = api.activity.mergeGuestActivities.useMutation();
  const hasProcessed = useRef(false);
    const { guestId } = useGuest(); // Get guestId from context
  
  useEffect(() => {
    // When user logs in, merge their guest activities
    if (status === 'authenticated' && session?.user && !hasProcessed.current) {

      
      if (guestId) {
        mergeActivities.mutate({ guestId });
        // Optionally clear the guestId since user is now authenticated
        localStorage.removeItem('guestId');
        hasProcessed.current = true;
      }
    }
    
    // Reset when user logs out
    if (status === 'unauthenticated') {
      hasProcessed.current = false;
    }
  }, [session, status, mergeActivities]);
}