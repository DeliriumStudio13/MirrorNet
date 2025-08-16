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
      setError(err instanceof Error ? err.message : 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 relative">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-[#e1e1e6] mb-1.5">
            First Name
          </label>
          <input
            type="text"
            name="firstName"
            id="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full h-10 px-3 bg-[#2a2b2e] border border-[#3b3b3e] rounded-lg text-white placeholder-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-colors text-sm relative z-20"
            placeholder="Enter your first name"
            required
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-[#e1e1e6] mb-1.5">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            id="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full h-10 px-3 bg-[#2a2b2e] border border-[#3b3b3e] rounded-lg text-white placeholder-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-colors text-sm relative z-20"
            placeholder="Enter your last name"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[#e1e1e6] mb-1.5">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full h-10 px-3 bg-[#2a2b2e] border border-[#3b3b3e] rounded-lg text-white placeholder-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-colors text-sm relative z-20"
          placeholder="Enter your email"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[#e1e1e6] mb-1.5">
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full h-10 px-3 bg-[#2a2b2e] border border-[#3b3b3e] rounded-lg text-white placeholder-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-colors text-sm relative z-20"
          placeholder="Create a password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-10 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] text-white rounded-lg font-medium hover:from-[#2563eb] hover:to-[#3b82f6] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm relative z-20"
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#3b3b3e]"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[#1a1b1e] text-[#71717a]">Or continue with</span>
        </div>
      </div>

      <AuthButton />
    </form>
  );
}