'use client';

import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppUser } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Listen to the user document for premium status and other custom fields
      const unsubscribeUser = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.data();
            setUser({
              ...firebaseUser,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              avatarUrl: userData.avatarUrl || firebaseUser.photoURL,
              isPremium: userData.isPremium || false,
              premiumSince: userData.premiumSince?.toDate(),
              premiumPlan: userData.premiumPlan,
              tokens: userData.tokens || 0,
              premiumTokens: userData.premiumTokens || 0,
              customCircleOwned: userData.customCircleOwned,
              customCircleMemberships: userData.customCircleMemberships || [],
            } as AppUser);
          } else {
            setUser(firebaseUser as AppUser);
          }
          setLoading(false);
        }
      );

      return () => unsubscribeUser();
    });

    return () => unsubscribeAuth();
  }, []);

  return { user, loading };
}