'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/contexts/auth-context';
import { SignUpForm } from '@/components/auth/signup-form';
import { SignInForm } from '@/components/auth/signin-form';
import { Frame, Shield, Users, TrendingUp, Star, ChevronDown, ChevronUp } from 'lucide-react';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  // Don't render content if user is logged in (will redirect)
  if (user) {
    return null;
  }

  const faqData = [
    {
      question: "How does MirrorNet™ ensure anonymity?",
      answer: "We use advanced encryption and privacy-by-design principles. Feedback is completely anonymous, and we never store identifying information with responses."
    },
    {
      question: "What's the difference between Free and Premium?",
      answer: "All basic features are free forever, including Family, Friends, and Work circles. Premium users get exclusive Attraction Circle access, 3 Premium Tokens monthly, Family Goals, early access to new features, and a premium supporter badge."
    },
    {
      question: "How do I invite people to my circles?",
      answer: "You can invite trusted friends, family, or colleagues who already have MirrorNet™ accounts. They'll need to create an account first before they can be invited to your circles."
    },
    {
      question: "Can I cancel my Premium subscription anytime?",
      answer: "Yes! You can cancel anytime through your account settings. You'll continue to have Premium access until the end of your billing period."
    },
    {
      question: "Is my personal data secure?",
      answer: "Absolutely. We use enterprise-grade security, encrypt all data, and follow GDPR compliance standards. Your privacy is our top priority."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Frame className="h-8 w-8 text-purple-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                MirrorNet™
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <Link href="/faq" className="text-gray-300 hover:text-white transition-colors">FAQ</Link>
              <Link href="/terms" className="text-gray-300 hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-pink-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-6">
                <Frame className="h-16 w-16 text-purple-500 mr-4" />
                <h1 className="text-4xl md:text-6xl font-bold">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    MirrorNet™
                  </span>
                </h1>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Personal Growth Through
                <span className="text-purple-400"> Trusted Feedback</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl">
                Receive structured, anonymous feedback from different circles in your life. 
                Transform insights into actionable personal growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => setActiveTab('signup')}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
                >
                  Start Free Trial
                </button>
                <button
                  onClick={() => setActiveTab('signin')}
                  className="px-8 py-4 border border-gray-600 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>

            {/* Auth Container */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-700">
                  <button
                    onClick={() => setActiveTab('signin')}
                    className={`flex-1 py-4 text-sm font-medium transition-colors ${
                      activeTab === 'signin'
                        ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-700/50'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setActiveTab('signup')}
                    className={`flex-1 py-4 text-sm font-medium transition-colors ${
                      activeTab === 'signup'
                        ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-700/50'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Form Container */}
                <div className="p-6">
                  {activeTab === 'signin' ? <SignInForm /> : <SignUpForm />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose MirrorNet™?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Transform how you receive and act on feedback with our comprehensive personal growth platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-purple-500/50 transition-all transform hover:scale-105">
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Anonymous & Secure</h3>
              <p className="text-gray-300">
                Advanced privacy features ensure completely anonymous feedback while maintaining security and trust.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-purple-500/50 transition-all transform hover:scale-105">
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Multiple Circles</h3>
              <p className="text-gray-300">
                Organize feedback from family, friends, colleagues, and romantic interests in separate circles.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-purple-500/50 transition-all transform hover:scale-105">
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Actionable Insights</h3>
              <p className="text-gray-300">
                Get detailed analytics and personalized recommendations to guide your personal growth journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-300">
              Start free, upgrade to Premium for exclusive features
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-8 border border-purple-500/50 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Premium Features
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <p className="text-gray-300 mb-6">Unlock exclusive features for deeper insights</p>
              <div className="text-4xl font-bold text-white mb-2">€3.99</div>
              <p className="text-gray-300 mb-6">per month</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-purple-400 mr-3" />
                  Exclusive Attraction Circle access
                </li>
                <li className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-purple-400 mr-3" />
                  3 Premium Tokens monthly
                </li>
                <li className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-purple-400 mr-3" />
                  Set Family Goals
                </li>
                <li className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-purple-400 mr-3" />
                  Early access to new features
                </li>
                <li className="flex items-center text-gray-300">
                  <Star className="w-5 h-5 text-purple-400 mr-3" />
                  Premium supporter badge
                </li>
              </ul>
              <button
                onClick={() => setActiveTab('signup')}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all mb-4"
              >
                Start 30-Day Free Trial
              </button>
              <p className="text-center text-sm text-gray-400">
                All basic features are free forever
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-300">
              Everything you need to know about MirrorNet™
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="bg-gray-800 rounded-lg border border-gray-700">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-700/50 transition-colors"
                >
                  <span className="text-lg font-semibold text-white">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-purple-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-purple-400" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-300">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Frame className="h-8 w-8 text-purple-500" />
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  MirrorNet™
                </span>
              </div>
              <p className="text-gray-300 mb-4 max-w-md">
                Transform your personal growth journey through structured, anonymous feedback from trusted circles.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#faq" className="text-gray-300 hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-gray-300 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><a href="mailto:support@mirrornet.net" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 MirrorNet™. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}