'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { createInitialCircles } from '@/lib/circle-utils';
import { AuthButton } from './auth-button';

interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export function SignUpForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<SignUpFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        firstName_lowercase: formData.firstName.toLowerCase(),
        lastName_lowercase: formData.lastName.toLowerCase(),
        email: formData.email,
        isPremium: false,
        tokens: 5,
        createdAt: serverTimestamp(),
        publicProfile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        // Add premium-related fields
        premiumTokens: 0,
        subscriptionStatus: 'none',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        premiumPlan: null,
        premiumActivatedAt: null,
        premiumCanceledAt: null,
        lastPaymentAt: null,
        lastFailedPaymentAt: null
      });

      // Create initial circles
      await createInitialCircles(userCredential.user.uid);

      router.push('/dashboard');
    } catch (err) {
      if (err instanceof Error) {
        if (err.code === 'auth/email-already-in-use') {
          setError('An account with this email already exists. Try signing in instead.');
        } else if (err.code === 'auth/weak-password') {
          setError('Password should be at least 6 characters long.');
        } else if (err.code === 'auth/invalid-email') {
          setError('Please enter a valid email address.');
        } else if (err.code === 'auth/too-many-requests') {
          setError('Too many attempts. Please wait a moment before trying again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An error occurred during sign up. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 relative">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-white mb-1.5">
            First Name
          </label>
          <input
            type="text"
            name="firstName"
            id="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full h-12 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm relative z-20"
            placeholder="Enter your first name"
            required
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-white mb-1.5">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            id="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full h-12 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm relative z-20"
            placeholder="Enter your last name"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white mb-1.5">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full h-10 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm relative z-20"
          placeholder="Enter your email"
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          We'll send a verification email to this address
        </p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-white mb-1.5">
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full h-10 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm relative z-20"
          placeholder="Create a password (min 6 characters)"
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          Password must be at least 6 characters long
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-10 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm relative z-20"
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
        </div>
      </div>

      <AuthButton />
    </form>
  );
}