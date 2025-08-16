'use client';

import { useState } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { Settings, Crown, User, Shield, AlertTriangle, CreditCard } from 'lucide-react';
import { createPortalSession } from '../premium/actions';
import { PremiumBadge } from '@/components/ui/premium-badge';

export default function SettingsPage() {
  const { user } = useAuthContext();
  const [processing, setProcessing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleTogglePremium = async () => {
    if (!user?.uid) return;

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      if (user.isPremium) {
        // Revert to standard
        await updateDoc(doc(db, 'users', user.uid), {
          isPremium: false,
          premiumSince: null,
          premiumPlan: null,
          premiumExpires: null,
          premiumTokens: 0,
          revertedAt: serverTimestamp()
        });
        setSuccess('Reverted to standard account successfully!');
      } else {
        // Upgrade to premium
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30);

        await updateDoc(doc(db, 'users', user.uid), {
          isPremium: true,
          premiumSince: serverTimestamp(),
          premiumPlan: 'monthly_trial',
          premiumExpires: trialEndDate,
          premiumTokens: 3,
          upgradedAt: serverTimestamp()
        });
        setSuccess('Upgraded to premium successfully!');
      }
    } catch (err) {
      console.error('Error toggling premium status:', err);
      setError('Failed to update premium status. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleResetTokens = async () => {
    if (!user?.uid || !user.isPremium) return;

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        premiumTokens: 3,
        tokensResetAt: serverTimestamp()
      });
      setSuccess('Premium tokens reset to 3!');
    } catch (err) {
      console.error('Error resetting tokens:', err);
      setError('Failed to reset tokens. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-white transition-colors block mb-4"
        >
          ← Back to Dashboard
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Settings</h1>
        </div>
        <p className="text-gray-400">Manage your account preferences and premium features</p>
      </div>

      {/* Account Info */}
      <div className="bg-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Account Information
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Name:</span>
            <div className="flex items-center gap-2">
              <span className="text-white">{user?.firstName} {user?.lastName}</span>
              {user?.isPremium && <PremiumBadge size="sm" />}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Email:</span>
            <span className="text-white">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Status:</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm px-2 py-1 rounded-full ${
                user?.isPremium 
                  ? 'bg-purple-600/20 text-purple-300' 
                  : 'bg-gray-600/20 text-gray-300'
              }`}>
                {user?.isPremium ? 'Premium' : 'Standard'}
              </span>
            </div>
          </div>
          {user?.isPremium && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Premium Tokens:</span>
                <span className="text-purple-300 font-medium">{user.premiumTokens}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Plan:</span>
                <span className="text-white">{user.premiumPlan === 'monthly_trial' ? '30-Day Trial' : 'Monthly'}</span>
              </div>
              {user.premiumExpires && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">
                    {user.premiumPlan === 'monthly_trial' ? 'Trial Ends:' : 'Expires:'}
                  </span>
                  <span className="text-white">{user.premiumExpires ? new Date(user.premiumExpires).toLocaleDateString() : 'N/A'}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Premium Controls */}
      <div className="bg-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Crown className="h-5 w-5 text-purple-400" />
          Premium Controls
        </h2>
        
        <div className="space-y-6">
          {/* Premium Toggle */}
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-medium text-white mb-1">
                  {user?.isPremium ? 'Revert to Standard' : 'Upgrade to Premium'}
                </h3>
                <p className="text-gray-400 text-sm">
                  {user?.isPremium 
                    ? 'Test how the app works for standard users' 
                    : 'Get access to premium features including Attraction Circle'
                  }
                </p>
              </div>
              <button
                onClick={handleTogglePremium}
                disabled={processing}
                className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  user?.isPremium
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                }`}
              >
                {processing ? 'Processing...' : user?.isPremium ? 'Revert to Standard' : 'Upgrade to Premium'}
              </button>
            </div>
          </div>

          {/* Subscription Management */}
          {user?.isPremium && (
            <div className="border border-gray-700 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">Manage Subscription</h3>
                  <p className="text-gray-400 text-sm">
                    Update payment method, view billing history, or cancel subscription
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      setPortalLoading(true);
                      setError(null);
                      await createPortalSession();
                    } catch (err) {
                      console.error('Error opening portal:', err);
                      setError('Failed to open billing portal. Please try again.');
                    } finally {
                      setPortalLoading(false);
                    }
                  }}
                  disabled={portalLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {portalLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Billing Portal
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Token Reset */}
          {user?.isPremium && (
            <div className="border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">Reset Premium Tokens</h3>
                  <p className="text-gray-400 text-sm">
                    Reset your premium tokens back to 3 for testing purposes
                  </p>
                </div>
                <button
                  onClick={handleResetTokens}
                  disabled={processing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processing ? 'Processing...' : 'Reset Tokens'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Testing Notice */}
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-8">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-yellow-300 font-medium mb-1">Testing Environment</h3>
            <p className="text-yellow-200 text-sm">
              These controls are for testing purposes only. In production, premium upgrades would be handled through Stripe payment processing.
            </p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
          <p className="text-green-400">{success}</p>
        </div>
      )}

      {/* Privacy & Security */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-400" />
          Privacy & Security
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2">
            <div>
              <div className="text-white font-medium">Anonymous Ratings</div>
              <div className="text-gray-400 text-sm">Your ratings are anonymous by default</div>
            </div>
            <div className="text-green-400 text-sm">✓ Enabled</div>
          </div>
          <div className="flex justify-between items-center py-2">
            <div>
              <div className="text-white font-medium">Data Protection</div>
              <div className="text-gray-400 text-sm">Your personal data is securely encrypted</div>
            </div>
            <div className="text-green-400 text-sm">✓ Protected</div>
          </div>
          <div className="flex justify-between items-center py-2">
            <div>
              <div className="text-white font-medium">Reveal Control</div>
              <div className="text-gray-400 text-sm">You control when to reveal your identity</div>
            </div>
            <div className="text-green-400 text-sm">✓ Your Choice</div>
          </div>
        </div>
      </div>
    </div>
  );
}
