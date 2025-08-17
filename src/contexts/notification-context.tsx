'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthContext } from './auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface NotificationContextType {
  totalNotifications: number;
  hasNewNotifications: boolean;
  markAsViewed: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setTotalNotifications(0);
      setHasNewNotifications(false);
      return;
    }

    const unsubscribers: (() => void)[] = [];

    // Listen for pending invitations
    const invitationsQuery = query(
      collection(db, 'invitations'),
      where('toUid', '==', user.uid),
      where('status', '==', 'pending')
    );

    const invitationsUnsubscribe = onSnapshot(invitationsQuery, (snapshot) => {
      const inviteCount = snapshot.size;
      updateTotalCount(inviteCount, 'invitations');
    });
    unsubscribers.push(invitationsUnsubscribe);

    // Listen for reveal requests (all users can receive them)
    const revealRequestsQuery = query(
      collection(db, 'revealRequests'),
      where('toUid', '==', user.uid),
      where('status', '==', 'pending')
    );

    const revealRequestsUnsubscribe = onSnapshot(revealRequestsQuery, (snapshot) => {
      const revealCount = snapshot.size;
      updateTotalCount(revealCount, 'reveals');
    });
    unsubscribers.push(revealRequestsUnsubscribe);

    // Listen for family goal notifications
    const familyGoalsQuery = query(
      collection(db, 'notifications'),
      where('toUid', '==', user.uid),
      where('type', '==', 'family_goal'),
      where('read', '==', false)
    );

    const familyGoalsUnsubscribe = onSnapshot(familyGoalsQuery, (snapshot) => {
      const goalCount = snapshot.size;
      updateTotalCount(goalCount, 'goals');
    });
    unsubscribers.push(familyGoalsUnsubscribe);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user?.uid]);

  const [counts, setCounts] = useState({
    invitations: 0,
    reveals: 0,
    goals: 0
  });

  const updateTotalCount = (count: number, type: 'invitations' | 'reveals' | 'goals') => {
    setCounts(prev => {
      const newCounts = { ...prev, [type]: count };
      const newTotal = Object.values(newCounts).reduce((sum, val) => sum + val, 0);
      
      // Show new notification indicator if total increased
      if (newTotal > totalNotifications && totalNotifications > 0) {
        setHasNewNotifications(true);
      }
      
      setTotalNotifications(newTotal);
      return newCounts;
    });
  };

  const markAsViewed = () => {
    setHasNewNotifications(false);
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        totalNotifications, 
        hasNewNotifications, 
        markAsViewed 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
