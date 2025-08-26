'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { App } from '@capacitor/app';

export function useBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let backButtonListener: any;

    const setupBackButtonListener = async () => {
      try {
        // Check if we're in a Capacitor environment
        const appInfo = await App.getInfo();
        if (!appInfo) return;

        // Add back button listener
        backButtonListener = await App.addListener('backButton', () => {
          // If we're on dashboard, let the app minimize (default behavior)
          if (pathname === '/dashboard') {
            return;
          }

          // For all other pages, navigate back to dashboard instead of minimizing
          router.push('/dashboard');
        });
      } catch (error) {
        // Not in Capacitor environment or error occurred
        console.log('Back button listener not available (web environment)');
      }
    };

    setupBackButtonListener();

    // Cleanup listener on unmount
    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [router, pathname]);
}
