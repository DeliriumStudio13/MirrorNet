'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AuthButton } from './auth-button';

export function SignInForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
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
      await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign in');
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
          placeholder="Enter your password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-10 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] text-white rounded-lg font-medium hover:from-[#2563eb] hover:to-[#3b82f6] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm relative z-20"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#2a2b2e]"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-[#1a1b1e] text-[#a1a1aa]">Or continue with</span>
        </div>
      </div>

      <div className="relative z-20">
        <AuthButton />
      </div>
    </form>
  );
}