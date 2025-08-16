'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/auth-context';
import { SignUpForm } from '@/components/auth/signup-form';
import { SignInForm } from '@/components/auth/signin-form';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const { user, loading } = useAuthContext();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121214] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  // Don't render content if user is logged in (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#121214] text-white relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/20 to-transparent pointer-events-none" />
      
      {/* Main content */}
      <div className="relative min-h-screen flex flex-col">
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8 w-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] mb-3 md:mb-4">
              MirrorNet™
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-[#e1e1e6]">
              Your personal growth, reflected through trusted circles
            </p>
          </div>

          {/* Auth Container */}
          <div className="w-full max-w-[420px] bg-[#1a1b1e] rounded-xl shadow-xl border border-[#2a2b2e] overflow-hidden relative">
            {/* Tabs */}
            <div className="flex border-b border-[#2a2b2e]">
              <button
                onClick={() => setActiveTab('signin')}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative z-10 ${
                  activeTab === 'signin'
                    ? 'text-[#3b82f6] border-b-2 border-[#3b82f6]'
                    : 'text-[#a1a1aa] hover:text-[#e1e1e6]'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative z-10 ${
                  activeTab === 'signup'
                    ? 'text-[#3b82f6] border-b-2 border-[#3b82f6]'
                    : 'text-[#a1a1aa] hover:text-[#e1e1e6]'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form Container */}
            <div className="p-6 relative z-10">
              {activeTab === 'signin' ? <SignInForm /> : <SignUpForm />}
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section className="bg-[#1a1b1e] py-12 md:py-16 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
              Why Choose MirrorNet™?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {/* Feature 1 */}
              <div className="bg-[#2a2b2e] rounded-xl p-5 md:p-6 transform transition-transform duration-200 hover:scale-105">
                <div className="w-12 h-12 bg-[#3b82f6]/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">Structured Feedback</h3>
                <p className="text-[#a1a1aa] text-sm md:text-base">
                  Receive honest, anonymous feedback from different circles in your life
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#2a2b2e] rounded-xl p-5 md:p-6 transform transition-transform duration-200 hover:scale-105">
                <div className="w-12 h-12 bg-[#3b82f6]/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">Privacy by Design</h3>
                <p className="text-[#a1a1aa] text-sm md:text-base">
                  Advanced privacy features ensure safe and anonymous feedback
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-[#2a2b2e] rounded-xl p-5 md:p-6 transform transition-transform duration-200 hover:scale-105">
                <div className="w-12 h-12 bg-[#3b82f6]/10 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">Actionable Insights</h3>
                <p className="text-[#a1a1aa] text-sm md:text-base">
                  Get detailed analytics and insights to guide your personal growth
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#121214] py-6 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-[#a1a1aa] text-sm">
              <p>© 2024 MirrorNet™. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}