'use client';

import { useState } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import Link from 'next/link';
import { Crown, Sparkles, Heart, Users, Check, ArrowRight } from 'lucide-react';
import { createCheckoutSession, createPortalSession } from './actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function PremiumPage() {
  const { user } = useAuthContext();
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle checkout success/failure
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    if (checkoutStatus === 'success') {
      // User will be updated via webhook
      router.replace('/dashboard/premium'); // Remove query param
    } else if (checkoutStatus === 'canceled') {
      setError('Checkout was canceled. Please try again.');
      router.replace('/dashboard/premium'); // Remove query param
    }
  }, [searchParams, router]);

  const handleUpgradeToPremium = async () => {
    if (!user?.uid) return;

    setUpgrading(true);
    setError(null);

    try {
      await createCheckoutSession();
    } catch (err) {
      console.error('Error starting checkout:', err);
      setError('Failed to start checkout. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  if (user?.isPremium) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">You're Already Premium! 🎉</h1>
          <p className="text-gray-400 text-lg mb-8">
            Enjoy all the premium features and thank you for your support!
          </p>
          
          {/* Premium Status */}
          <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-6 mb-8 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <span className="text-purple-300 font-medium">Premium Status</span>
            </div>
            <div className="text-2xl font-bold text-white mb-2">
              Premium Tokens: {user.premiumTokens}
            </div>
            <p className="text-gray-300 text-sm">
              Plan: {user.premiumPlan === 'monthly_trial' ? '30-Day Trial' : 'Monthly'}
            </p>
            {user.premiumExpires && (
              <p className="text-gray-400 text-xs mt-2">
                {user.premiumPlan === 'monthly_trial' ? 'Trial ends' : 'Next billing date'}: {
                  user.premiumExpires ? new Date(user.premiumExpires).toLocaleDateString() : 'N/A'
                }
              </p>
            )}
            <button
              onClick={() => createPortalSession()}
              className="w-full mt-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-medium flex items-center justify-center gap-2"
            >
              <Crown className="h-4 w-4" />
              Manage Subscription
            </button>
          </div>

          <div className="flex gap-4 justify-center">
            <Link 
              href="/dashboard"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Back to Dashboard
            </Link>
            <Link 
              href="/dashboard/attraction"
              className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors font-medium flex items-center gap-2"
            >
              <Heart className="h-4 w-4" />
              Attraction Dashboard
            </Link>
            <button
              onClick={() => createPortalSession()}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Manage Subscription
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <Link 
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-white transition-colors block mb-4"
        >
          ← Back to Dashboard
        </Link>
        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Crown className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Upgrade to Premium</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Unlock exclusive features and get deeper insights into your personal growth journey
        </p>
      </div>

      {/* Pricing Card */}
      <div className="max-w-md mx-auto mb-12">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 border-purple-500/50 p-8 relative overflow-hidden">
          {/* Popular Badge */}
          <div className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-4 py-2 rounded-bl-lg">
            BEST VALUE
          </div>
          
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">Premium Plan</h3>
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-4xl font-bold text-purple-400">30</span>
              <span className="text-lg text-gray-300">days trial</span>
            </div>
            <div className="text-sm text-gray-400">
              Then €3.99/month
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-white font-medium">Attraction Circle Access</div>
                <div className="text-gray-400 text-sm">Rate and see attraction feedback</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-white font-medium">3 Premium Tokens</div>
                <div className="text-gray-400 text-sm">Rate anyone, request reveals</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-white font-medium">View Received Ratings</div>
                <div className="text-gray-400 text-sm">See who finds you attractive</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-white font-medium">Identity Reveal Control</div>
                <div className="text-gray-400 text-sm">Choose when to reveal yourself</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 mt-0.5 flex-shrink-0 rounded-full bg-orange-600/20 flex items-center justify-center">
                <svg className="h-3 w-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-medium flex items-center gap-2">
                  Custom Circles
                  <span className="px-2 py-1 text-xs bg-orange-600/20 text-orange-400 rounded">
                    Coming Soon
                  </span>
                </div>
                <div className="text-gray-400 text-sm">Gaming, Book Club, Gym Buddies & more</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-white font-medium">Priority Support</div>
                <div className="text-gray-400 text-sm">Get help when you need it</div>
              </div>
            </div>
          </div>

          {/* Upgrade Button */}
          <button
            onClick={handleUpgradeToPremium}
            disabled={upgrading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg flex items-center justify-center gap-2"
          >
            {upgrading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <Crown className="h-5 w-5" />
                Start 30-Day Trial
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center mt-4">
            No payment required for trial. Cancel anytime.
          </p>
        </div>
      </div>

      {/* Feature Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-gray-800 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-pink-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-6 w-6 text-pink-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Attraction Insights</h3>
          <p className="text-gray-400 text-sm">
            See who finds you attractive and rate others anonymously or with your identity revealed
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-6 w-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Premium Tokens</h3>
          <p className="text-gray-400 text-sm">
            Use tokens to rate anyone in the app and request identity reveals from anonymous raters
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 text-center relative">
          <div className="w-12 h-12 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-white">Custom Circles</h3>
            <span className="px-2 py-1 text-xs bg-orange-600/20 text-orange-400 rounded">
              Coming Soon
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            Create custom circles for gaming clans, book clubs, gym buddies, and more specialized communities
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">What happens during the 30-day trial?</h3>
            <p className="text-gray-400">
              You get full access to all premium features for 30 days completely free. After the trial, 
              you'll be charged €3.99/month unless you cancel.
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Can I cancel anytime?</h3>
            <p className="text-gray-400">
              Yes! You can cancel your subscription at any time from your account settings. 
              You'll continue to have premium access until the end of your billing period.
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">What are Premium Tokens?</h3>
            <p className="text-gray-400">
              Premium tokens allow you to rate users outside your circles and request identity reveals 
              from anonymous attraction raters. You get 3 tokens when you upgrade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}