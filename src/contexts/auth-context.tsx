'use client';

import { createContext, useContext, ReactNode } from 'react';
import { User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { createInitialCircles } from '@/lib/circle-utils';
import type { AppUser } from '@/types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Create/update user document
      const userRef = doc(db, 'users', user.uid);
      const names = user.displayName?.split(' ') || ['', ''];
      const firstName = names[0];
      const lastName = names.slice(1).join(' ');
      
      await setDoc(userRef, {
        firstName,
        lastName,
        firstName_lowercase: firstName.toLowerCase(),
        lastName_lowercase: lastName.toLowerCase(),
        email: user.email,
        avatarUrl: user.photoURL,
        isPremium: false,
        tokens: 5,
        premiumTokens: 0,
        createdAt: serverTimestamp(),
        publicProfile: {
          firstName,
          lastName,
          avatarUrl: user.photoURL,
        }
      }, { merge: true });

      // Create initial circles for new users
      await createInitialCircles(user.uid);
      
      // Redirect to dashboard after successful sign in
      router.push('/dashboard');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Redirect to home page after sign out
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}